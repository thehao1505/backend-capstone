import { Injectable, Logger } from '@nestjs/common'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { configs } from '@utils/configs'

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name)
  private genAI: GoogleGenerativeAI

  constructor() {
    const apiKey = configs.geminiApiKey
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddingModel = this.genAI.getGenerativeModel({ model: 'embedding-001' })
    try {
      const result = await embeddingModel.embedContent(text)
      return result.embedding.values
    } catch (error) {
      this.logger.error(`Error generating embedding: ${error.message}`)
      throw error
    }
  }

  async generateImageAnalysis(imageUrl: string): Promise<string> {
    const imageModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    })
    const { base64, mimeType } = await this.fetchImageAsBase64WithMime(imageUrl)

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64,
      },
    }

    const imagePrompt = `
    Describe the content of this image in a detailed yet concise paragraph suitable for semantic search. The description should include:

    - All recognizable objects (e.g. people, animals, nature, buildings, symbols)
    - Their spatial relationships and interactions
    - The overall scene and context (e.g. indoor/outdoor, event, activity)
    - Colors and artistic style (e.g. vintage, modern, surreal, minimalist)
    - Emotional tone or mood conveyed (e.g. joyful, mysterious, calm, chaotic)

    Avoid lists or formatting. Write in fluent natural language, focusing on conveying meaning and context as a human would describe the image for retrieval or comparison.`

    const result = await imageModel.generateContent([imagePrompt, imagePart])
    const finalText = result.response.text()
    return finalText
  }

  private async fetchImageAsBase64WithMime(url: string): Promise<{ base64: string; mimeType: string }> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${url}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Unsupported or missing content-type: ${contentType}`)
    }

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return {
      base64,
      mimeType: contentType,
    }
  }
}
