import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class ImageDto {
  @ApiProperty({
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  imageUrl: string
}

export class EmbedDto {
  @ApiProperty({
    example: 'Some content to embed',
  })
  @IsString()
  text: string
}
