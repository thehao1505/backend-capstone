import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsArray, IsOptional, IsString } from 'class-validator'
import { Pagination } from './base.dto'

export class CreatePostDto {
  @ApiPropertyOptional({
    example: 'This is the content of the most attractive post!',
  })
  @IsOptional()
  @IsString()
  content: string

  @ApiPropertyOptional({
    example: ['link1', 'link2'],
  })
  @IsOptional()
  @IsArray()
  images: string[]
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class QueryDto extends Pagination {
  @ApiPropertyOptional({
    example: 'de5ecfed-4dc7-4a39-b09f-9d772052f3c8',
  })
  @IsOptional()
  @IsString()
  author?: string
}
