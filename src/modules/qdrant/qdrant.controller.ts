import { Body, Controller, Post } from '@nestjs/common'
import { EmbeddingService } from '@modules/index-service'
import { ApiTags } from '@nestjs/swagger'
import { EmbedDto, ImageDto } from '@dtos/qdrant.dto'

@Controller()
@ApiTags('Qdrant')
export class QdrantController {
  constructor(private readonly embeddingService: EmbeddingService) {}

  @Post('embedding')
  async generateEmbedding(@Body() embedDto: EmbedDto) {
    return this.embeddingService.generateEmbedding(embedDto.text)
  }

  @Post('image-analysis')
  async generateImageAnalysis(@Body() imageDto: ImageDto) {
    return this.embeddingService.generateImageAnalysis(imageDto.imageUrl)
  }
}
