// src/processors/embedding.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Post } from '@entities/index'
import { QdrantService } from '@modules/index-service'
import { EmbeddingService } from './embedding.service'

@Processor('embedding')
@Injectable()
export class EmbeddingProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbeddingProcessor.name)

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly qdrantService: QdrantService,
    @InjectModel(Post.name) private postModel: Model<Post>,
  ) {
    super()
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { postId } = job.data
    this.logger.log(`Processing embedding for post: ${postId}`)

    try {
      // Fetch post data
      const post = await this.postModel.findById(postId)
      if (!post) {
        throw new Error(`Post not found: ${postId}`)
      }

      // Extract content for embedding
      const contentToEmbed = post.content

      // Generate embedding
      const embedding = await this.embeddingService.generateEmbedding(contentToEmbed)

      // Store in Qdrant
      await this.qdrantService.upsertVector(postId, embedding, {
        postId: postId,
        content: post.content,
        author: post.author,
        createdAt: post.createdAt,
      })

      // Update embedding status in Post document
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
}
