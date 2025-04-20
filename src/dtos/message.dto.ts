import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { Pagination } from './base.dto'

export class CreateMessageDto {
  @ApiProperty({
    example: 'bffb6ad2-ace4-4f55-8b1a-4de8640bd131',
  })
  @IsOptional()
  @IsString()
  sender: string

  @ApiProperty({
    example: 'bffb6ad2-ace4-4f55-8b1a-4de8640bd131',
  })
  @IsOptional()
  @IsString()
  receiver: string

  @ApiProperty({
    example: 'Hello, how are you?',
  })
  @IsOptional()
  @IsString()
  content: string
}

export class GetConversationDto extends Pagination {
  @ApiProperty({
    example: 'bffb6ad2-ace4-4f55-8b1a-4de8640bd131',
  })
  @IsOptional()
  @IsString()
  connectionId: string
}
