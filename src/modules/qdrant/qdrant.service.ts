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
      const postCollectionExists = collections.collections.some(collection => collection.name === configs.postCollectionName)
      const userCollectionExists = collections.collections.some(collection => collection.name === configs.userCollectionName)

      if (!postCollectionExists) {
        await this.client.createCollection(configs.postCollectionName, {
          vectors: {
            size: Number(configs.vectorSize),
            distance: 'Cosine',
          },
        })
        this.logger.log(`Collection ${configs.postCollectionName} created`)
      } else {
        this.logger.log(`Collection ${configs.postCollectionName} already exists`)
      }

      if (!userCollectionExists) {
        await this.client.createCollection(configs.userCollectionName, {
          vectors: {
            size: Number(configs.vectorSize),
            distance: 'Cosine',
          },
        })
        this.logger.log(`Collection ${configs.userCollectionName} created`)
      } else {
        this.logger.log(`Collection ${configs.userCollectionName} already exists`)
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Qdrant collection: ${error.message}`)
      throw error
    }
  }

  async upsertVector(collectionName: string, id: string, vector: number[], payload: Record<string, any>) {
    return this.client.upsert(collectionName, {
      points: [
        {
          id,
          vector,
          payload,
        },
      ],
    })
  }

  async searchSimilar(collectionName: string, vector: number[], limit: number, page: number, filter: Record<string, any>) {
    const offset = (page - 1) * limit

    return this.client.search(collectionName, {
      vector,
      limit,
      offset,
      filter,
    })
  }

  async deleteVector(id: string, collectionName: string) {
    return this.client.delete(collectionName, {
      points: [id],
    })
  }
}
