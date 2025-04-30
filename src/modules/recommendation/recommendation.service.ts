import { User } from '@entities/index'
import { Post } from '@entities/post.entity'
import { CommentService, EmbeddingService, QdrantService, RedisService } from '@modules/index-service'
import { InjectQueue } from '@nestjs/bullmq'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
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
  async getRecommendationsForNewUser(userId: string, limit: number = 10) {
    const popularPosts = await this.postModel.find({ isHidden: false, isDeleted: false }).sort({ 'likes.length': -1 }).limit(20).lean()

    if (popularPosts.length === 0) return []

    const shuffledPosts = popularPosts.sort(() => 0.5 - Math.random())
    return shuffledPosts.slice(0, limit)
  }

  // Get content-based recommendations for a post
  async getSimilarPosts(postId: string, limit: number = 10) {
    try {
      const post = await this.postModel.findById(postId).lean()
      if (!post) throw new BadRequestException('Post not found')

      // Generate embedding for the query post
      const embedding = await this.embeddingService.generateEmbedding(post.content)

      // Find similar posts in Qdrant
      const similar = await this.qdrantService.searchSimilar(embedding, limit + 1, {
        must_not: [
          {
            key: 'postId',
            match: {
              value: postId,
            },
          },
        ],
      })

      const similarPostIds = similar.map(item => item.id).filter(id => id !== postId)
      const similarPosts = await this.postModel.find({ _id: { $in: similarPostIds }, isHidden: false }).lean()

      return similarPosts
    } catch (error) {
      this.logger.error(`Error finding similar posts: ${error.message} `)
      throw new BadRequestException('Failed to find similar posts')
    }
  }

  private async getCachedRecommendations(userId: string, limit: number): Promise<Post[] | null> {
    const cacheKey = `recommendations:${userId}:${limit}`
    const cached = await this.redisService.client.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
    return null
  }

  private async cacheRecommendations(userId: string, limit: number, recommendations: Post[]) {
    const cacheKey = `recommendations:${userId}:${limit}`
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

  async getRecommendationsForUser(userId: string, limit: number = 10) {
    const startTime = Date.now()
    try {
      // Try to get cached recommendations first
      const cachedRecommendations = await this.getCachedRecommendations(userId, limit)
      if (cachedRecommendations) {
        await this.trackMetric('cache_hits')
        await this.trackRecommendationMetrics(userId, cachedRecommendations, 'cache')
        return cachedRecommendations
      }
      await this.trackMetric('cache_misses')

      const user = await this.userModel.findById(userId)
      if (!user) throw new BadRequestException('User not found')

      const postLiked = await this.postModel.countDocuments({ likes: user._id })
      const commented = await this.commentService.countCommentsByUserId(userId)

      if (postLiked === 0 || commented === 0 || !user.followings) {
        const newUserRecommendations = await this.getRecommendationsForNewUser(userId, limit)
        await this.trackRecommendationMetrics(userId, newUserRecommendations, 'new_user')
        return newUserRecommendations
      }

      // Get posts from following users
      const followingPosts = await this.postModel
        .find({
          author: { $in: user.followings },
          isHidden: false,
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()

      // Get liked posts
      const likedPosts = await this.postModel
        .find({
          likes: userId,
          isHidden: false,
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()

      let recommendations: Post[] = []

      if (likedPosts.length > 0) {
        const likedContent = likedPosts.map(post => post.content).join(' ')
        const embedding = await this.embeddingService.generateEmbedding(likedContent)

        const similar = await this.qdrantService.searchSimilar(embedding, limit * 2, {
          must_not: [
            {
              key: 'postId',
              match: {
                value: { $in: likedPosts.map(post => post._id.toString()) },
              },
            },
            {
              key: 'author',
              match: {
                value: userId,
              },
            },
          ],
        })

        const similarPostIds = similar.map(item => item.id)
        const similarPosts = await this.postModel.find({ _id: { $in: similarPostIds }, isHidden: false }).lean()

        // Combine and score posts
        const allPosts = [...followingPosts, ...similarPosts]
        const scoredPosts = allPosts.map(post => ({
          ...post,
          score: this.calculateTimeDecayScore(post),
        }))

        // Sort by score and get diverse recommendations
        scoredPosts.sort((a, b) => b.score - a.score)
        recommendations = await this.getDiversePosts(scoredPosts, limit)
      } else {
        recommendations = await this.getDiversePosts(followingPosts, limit)
      }

      // Cache the recommendations
      await this.cacheRecommendations(userId, limit, recommendations)

      // Track performance metrics
      const endTime = Date.now()
      await this.trackMetric('processing_time', endTime - startTime)
      await this.trackRecommendationMetrics(userId, recommendations, 'personalized')

      return recommendations
    } catch (error) {
      this.logger.error(`Error getting recommendations: ${error.message}`)
      await this.trackMetric('errors')
      // Fallback to new user recommendations if there's an error
      const fallbackRecommendations = await this.getRecommendationsForNewUser(userId, limit)
      await this.trackRecommendationMetrics(userId, fallbackRecommendations, 'fallback')
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
}
