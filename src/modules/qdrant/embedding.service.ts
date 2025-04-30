import { Injectable, Logger } from '@nestjs/common'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { configs } from '@utils/configs'

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name)
  private genAI: GoogleGenerativeAI
  private embeddingModel: any

  constructor() {
    const apiKey = configs.geminiApiKey
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.embeddingModel = this.genAI.getGenerativeModel({ model: 'embedding-001' })
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent(text)
      return result.embedding.values
    } catch (error) {
      this.logger.error(`Error generating embedding: ${error.message}`)
      throw error
    }
  }
}
