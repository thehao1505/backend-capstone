import { QueryRecommendationDto, QuerySearchDto } from '@dtos/recommendation.dto'
import { User } from '@entities/index'
import { Post } from '@entities/post.entity'
import { CommentService, EmbeddingService, QdrantService, RedisService } from '@modules/index-service'
import { InjectQueue } from '@nestjs/bullmq'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { configs } from '@utils/configs/config'
import { Queue } from 'bullmq'
import { Model } from 'mongoose'

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name)
  private readonly CACHE_TTL = 60 * 30 // 30 minutes
  private readonly METRICS_PREFIX = 'recommendation:metrics:'

  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectQueue('embedding') private readonly embeddingQueue: Queue,
    private readonly qdrantService: QdrantService,
    private readonly embeddingService: EmbeddingService,
    private readonly commentService: CommentService,
    private readonly redisService: RedisService,
  ) {}

  private async trackMetric(metricName: string, value: number = 1) {
    const key = `${this.METRICS_PREFIX}${metricName}`
    await this.redisService.client.incrby(key, value)
    await this.redisService.client.expire(key, 60 * 60 * 24) // 24 hours TTL
  }

  private async trackRecommendationMetrics(userId: string, recommendations: Post[], source: string) {
    await this.trackMetric('total_recommendations')
    await this.trackMetric(`source:${source}`)

    // Track diversity metrics
    const uniqueAuthors = new Set(recommendations.map(post => post.author.toString()))
    await this.trackMetric('unique_authors', uniqueAuthors.size)

    // Track time-based metrics
    const now = new Date()
    const recentPosts = recommendations.filter(post => {
      const postDate = new Date(post.createdAt)
      const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)
      return hoursDiff <= 24
    })
    await this.trackMetric('recent_posts', recentPosts.length)
  }

  // Enqueue a post for embedding processing
  async enqueuePostForEmbedding(postId: string) {
    await this.embeddingQueue.add(
      'process-post-embedding',
      { postId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    )
    this.logger.log(`Enqueued post ${postId} for embedding`)
  }

  // Get content-based recommendations for a new user
  // Uses a random selection of popular posts as the baseline
  async getRecommendationsForNewUser(userId: string, query: QueryRecommendationDto) {
    const { page, limit } = query
    const skip = (page - 1) * limit
    const total = await this.postModel.countDocuments({ isHidden: false, isDeleted: false })
    const popularPosts = await this.postModel
      .find({ isHidden: false, isDeleted: false })
      .sort({ 'likes.length': -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    if (popularPosts.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      }
    }

    const shuffledPosts = popularPosts.sort(() => 0.5 - Math.random())
    return {
      items: shuffledPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  // Get content-based recommendations for a post
  async getSimilarPosts(postId: string, query: QueryRecommendationDto) {
    const { page, limit } = query
    try {
      const post = await this.postModel.findById(postId).lean()
      if (!post) throw new BadRequestException('Post not found')

      const embedding = await this.embeddingService.generateEmbedding(post.content)
      if (!embedding || embedding.length === 0) {
        throw new BadRequestException('Failed to generate embedding for post')
      }

      // Prepare filter
      const filter = {
        must_not: [
          {
            key: 'postId',
            match: {
              value: postId.toString(),
              type: 'keyword',
            },
          },
        ],
      }

      const similar = await this.qdrantService.searchSimilar(configs.postCollectionName, embedding, Number(limit), Number(page), filter)
      console.log(similar)

      const similarPostIds = similar.map(item => item.id).filter(id => id !== postId)
      const total = similarPostIds.length

      const similarPostsRaw = await this.postModel
        .find({
          _id: { $in: similarPostIds },
          isHidden: false,
        })
        .lean()

      const idToPostMap = new Map(similarPostsRaw.map(post => [post._id.toString(), post]))
      const similarPosts = similarPostIds.map(id => idToPostMap.get(id.toString())).filter(Boolean)

      return {
        items: similarPosts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    } catch (error) {
      this.logger.error(`Error finding similar posts: ${error.message}`, error.stack)
      throw new BadRequestException(`Failed to find similar posts: ${error.message}`)
    }
  }

  private async getCachedRecommendations(userId: string, page: number, limit: number) {
    const cacheKey = `recommendations:${userId}:${page}:${limit}`
    const cached = await this.redisService.client.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
    return null
  }

  private async cacheRecommendations(userId: string, page: number, limit: number, recommendations: any) {
    const cacheKey = `recommendations:${userId}:${page}:${limit}`
    await this.redisService.client.setex(cacheKey, this.CACHE_TTL, JSON.stringify(recommendations))
  }

  private calculateTimeDecayScore(post: Post): number {
    const now = new Date()
    const postDate = new Date(post.createdAt)
    const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)
    return Math.exp(-hoursDiff / 24) // Decay over 24 hours
  }

  private async getDiversePosts(posts: Post[], limit: number): Promise<Post[]> {
    // Group posts by author
    const authorGroups = new Map<string, Post[]>()
    posts.forEach(post => {
      const authorId = post.author.toString()
      if (!authorGroups.has(authorId)) {
        authorGroups.set(authorId, [])
      }
      authorGroups.get(authorId).push(post)
    })

    // Select posts ensuring diversity
    const diversePosts: Post[] = []
    const authors = Array.from(authorGroups.keys())

    while (diversePosts.length < limit && authors.length > 0) {
      // Randomly select an author
      const randomAuthorIndex = Math.floor(Math.random() * authors.length)
      const selectedAuthor = authors[randomAuthorIndex]
      const authorPosts = authorGroups.get(selectedAuthor)

      if (authorPosts.length > 0) {
        // Add the most recent post from this author
        const selectedPost = authorPosts.shift()
        diversePosts.push(selectedPost)
      }

      if (authorPosts.length === 0) {
        authors.splice(randomAuthorIndex, 1)
      }
    }

    return diversePosts
  }

  async getRecommendationsForUser(userId: string, query: QueryRecommendationDto) {
    const { page, limit } = query
    const startTime = Date.now()
    try {
      // Try to get cached recommendations first
      const cachedRecommendations = await this.getCachedRecommendations(userId, page, limit)
      if (cachedRecommendations) {
        await this.trackMetric('cache_hits')
        await this.trackRecommendationMetrics(userId, cachedRecommendations.items, 'cache')
        return cachedRecommendations
      }
      await this.trackMetric('cache_misses')

      const user = await this.userModel.findById(userId)
      if (!user) throw new BadRequestException('User not found')

      const postLiked = await this.postModel.countDocuments({ likes: user._id })
      const commented = await this.commentService.countCommentsByUserId(userId)

      if (postLiked === 0 && commented === 0 && !user.followings) {
        const newUserRecommendations = await this.getRecommendationsForNewUser(userId, query)
        await this.trackRecommendationMetrics(userId, newUserRecommendations.items, 'new_user')
        return newUserRecommendations
      }

      // Get posts from following users
      const followingPosts = await this.postModel
        .find({
          author: { $in: user.followings },
          isHidden: false,
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()

      const totalFollowingPosts = await this.postModel.countDocuments({
        author: { $in: user.followings },
        isHidden: false,
      })

      // Get liked posts
      const likedPosts = await this.postModel
        .find({
          likes: userId,
          isHidden: false,
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()

      let recommendations: any

      if (likedPosts.length > 0) {
        const likedContent = likedPosts.map(post => post.content).join(' ')
        const embedding = await this.embeddingService.generateEmbedding(likedContent)

        const filter = {
          must_not: [
            {
              should: likedPosts.map(post => ({
                key: 'postId',
                match: { value: post._id.toString() },
              })),
            },
            {
              key: 'author',
              match: { value: userId },
            },
          ],
        }

        const similar = await this.qdrantService.searchSimilar(configs.postCollectionName, embedding, Number(limit), Number(page), filter)
        console.log(similar)

        const similarPostIds = similar.map(item => item.id)
        const similarPosts = await this.postModel.find({ _id: { $in: similarPostIds }, isHidden: false }).lean()

        // Combine and score posts
        const scoredPosts = similarPosts.map(post => ({
          ...post,
          score: this.calculateTimeDecayScore(post),
        }))

        // Sort by score and get diverse recommendations
        scoredPosts.sort((a, b) => b.score - a.score)
        const diversePosts = await this.getDiversePosts(scoredPosts, limit)

        recommendations = {
          items: diversePosts,
          total: similarPostIds.length,
          page,
          limit,
          totalPages: Math.ceil(similarPostIds.length / limit),
        }
      } else {
        console.log('followingPosts', followingPosts)
        recommendations = {
          items: await this.getDiversePosts(followingPosts, limit),
          total: totalFollowingPosts,
          page,
          limit,
          totalPages: Math.ceil(totalFollowingPosts / limit),
        }
      }

      // Cache the recommendations
      await this.cacheRecommendations(userId, page, limit, recommendations)

      // Track performance metrics
      const endTime = Date.now()
      await this.trackMetric('processing_time', endTime - startTime)
      await this.trackRecommendationMetrics(userId, recommendations.items, 'personalized')

      return recommendations
    } catch (error) {
      this.logger.error(`Error getting recommendations: ${error.message}`)
      await this.trackMetric('errors')
      // Fallback to new user recommendations if there's an error
      const fallbackRecommendations = await this.getRecommendationsForNewUser(userId, query)
      await this.trackRecommendationMetrics(userId, fallbackRecommendations.items, 'fallback')
      return fallbackRecommendations
    }
  }

  async getRecommendationMetrics() {
    const metrics = {}
    const keys = await this.redisService.client.keys(`${this.METRICS_PREFIX}*`)

    for (const key of keys) {
      const value = await this.redisService.client.get(key)
      const metricName = key.replace(this.METRICS_PREFIX, '')
      metrics[metricName] = parseInt(value)
    }

    return metrics
  }

  async getFollowingRecommendations(userId: string, query: QueryRecommendationDto) {
    const { page, limit } = query

    const user = await this.userModel.findById(userId)
    if (!user) throw new BadRequestException('User not found')

    const followingPosts = await this.postModel
      .find({
        author: { $in: user.followings },
        isHidden: false,
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const totalFollowingPosts = await this.postModel.countDocuments({
      author: { $in: user.followings },
      isHidden: false,
    })

    const recommendations = {
      items: await this.getDiversePosts(followingPosts, limit),
      total: totalFollowingPosts,
      page,
      limit,
      totalPages: Math.ceil(totalFollowingPosts / limit),
    }

    return recommendations
  }

  async search(query: QuerySearchDto) {
    const { page, limit } = query
    const { text } = query

    const embedding = await this.embeddingService.generateEmbedding(text)
    const similar = await this.qdrantService.searchSimilar(configs.postCollectionName, embedding, Number(limit), Number(page), {})

    return similar
  }
}
