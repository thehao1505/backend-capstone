import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { QdrantClient } from '@qdrant/js-client-rest'
import { configs } from '@utils/configs'

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name)
  private client: QdrantClient

  constructor() {
    this.client = new QdrantClient({ url: configs.qdrantUrl, apiKey: configs.qdrantApiKey })
  }

  async onModuleInit() {
    await this.initializeCollection()
  }

  private async initializeCollection() {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections()
      const collectionExists = collections.collections.some(collection => collection.name === configs.collectionName)

      if (!collectionExists) {
        // Create collection if it doesn't exist
        await this.client.createCollection(configs.collectionName, {
          vectors: {
            size: Number(configs.vectorSize),
            distance: 'Cosine',
          },
        })
        this.logger.log(`Collection ${configs.collectionName} created`)
      } else {
        this.logger.log(`Collection ${configs.collectionName} already exists`)
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Qdrant collection: ${error.message}`)
      throw error
    }
  }

  async upsertVector(id: string, vector: number[], payload: Record<string, any>) {
    return this.client.upsert(configs.collectionName, {
      points: [
        {
          id,
          vector,
          payload,
        },
      ],
    })
  }

  async searchSimilar(vector: number[], limit: number = 10, filter?: Record<string, any>) {
    return this.client.search(configs.collectionName, {
      vector,
      limit,
      filter,
    })
  }

  async deleteVector(id: string) {
    return this.client.delete(configs.collectionName, {
      points: [id],
    })
  }
}
