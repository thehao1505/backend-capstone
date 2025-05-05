// src/processors/embedding.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Post, User } from '@entities/index'
import { QdrantService } from '@modules/index-service'
import { EmbeddingService } from './embedding.service'
import { configs } from '@utils/configs/config'

@Processor('embedding')
@Injectable()
export class EmbeddingProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbeddingProcessor.name)

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly qdrantService: QdrantService,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    super()
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'process-post-embedding') {
      const { postId } = job.data
      this.logger.log(`Processing embedding for post: ${postId}`)

      try {
        const post = await this.postModel.findById(postId)
        if (!post) {
          throw new Error(`Post not found: ${postId}`)
        }

        await this.embedPost(post)

        await this.postModel.findByIdAndUpdate(postId, {
          $set: {
            isEmbedded: true,
            lastEmbeddedAt: new Date(),
          },
        })

        this.logger.log(`Successfully processed embedding for post: ${postId}`)
        return { success: true, postId }
      } catch (error) {
        this.logger.error(`Error processing embedding for post ${postId}: ${error.message}`)
        throw error
      }
    }

    if (job.name === 'process-user-embedding') {
      const { userId } = job.data
      this.logger.log(`Processing embedding for user: ${userId}`)

      try {
        const user = await this.userModel.findById(userId)
        if (!user) {
          throw new Error(`User not found: ${userId}`)
        }

        await this.embedUser(user)

        await this.userModel.findByIdAndUpdate(
          user._id,
          {
            $set: {
              isEmbedded: true,
              lastEmbeddedAt: new Date(),
            },
          },
          { new: true },
        )

        this.logger.log(`Successfully processed embedding for user: ${userId}`)
        return { success: true, userId }
      } catch (error) {
        this.logger.error(`Error processing embedding for user ${userId}: ${error.message}`)
        throw error
      }
    }
  }

  private async embedUser(user: User) {
    try {
      const contentToEmbed = `${user.firstName || ''} ${user.lastName || ''} ${user.username} ${user.shortDescription || ''}`

      const embedding = await this.embeddingService.generateEmbedding(contentToEmbed)

      await this.qdrantService.upsertVector(configs.userCollectionName, user._id, embedding, {
        userId: user._id,
        content: contentToEmbed,
      })
    } catch (error) {
      this.logger.error(`Error embedding user ${user._id}: ${error.message}`)
      throw error
    }
  }

  private async embedPost(post: Post) {
    try {
      const imagesDescription = post.images.map(image => this.embeddingService.generateImageAnalysis(image))

      const contentToEmbed = `${post.content} ${imagesDescription.join(' ')}`

      const embedding = await this.embeddingService.generateEmbedding(contentToEmbed)

      await this.qdrantService.upsertVector(configs.postCollectionName, post._id, embedding, {
        postId: post._id,
        content: contentToEmbed,
        author: post.author,
        createdAt: post.createdAt,
      })

      this.logger.log(`Embedded content for post: ${post._id}`)
    } catch (error) {
      this.logger.error(`Error embedding post ${post._id}: ${error.message}`)
      throw error
    }
  }
}
