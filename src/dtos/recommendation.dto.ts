import { ApiProperty } from '@nestjs/swagger'
import { Pagination } from './base.dto'
import { IsString } from 'class-validator'

export class QueryRecommendationDto extends Pagination {}

export class QuerySearchDto extends Pagination {
  @ApiProperty({
    example: 'Some content to search',
  })
  @IsString()
  text: string
}
