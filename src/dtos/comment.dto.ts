import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { Pagination } from './base.dto'

export class CreateCommentDto {
  @ApiProperty({
    example: '0cde6a63-2f61-4b4c-bf4e-ae9126288a24',
  })
  @IsOptional()
  @IsString()
  postId: string

  @ApiProperty({
    example: 'This is the content of the most attractive post!',
  })
  @IsOptional()
  @IsString()
  content: string

  @ApiProperty({
    example: '0cde6a63-2f61-4b4c-bf4e-ae9126288a24',
  })
  @IsOptional()
  @IsString()
  parentId?: string = null
}

export class QueryCommentDto extends Pagination {
  @ApiProperty({
    example: '0cde6a63-2f61-4b4c-bf4e-ae9126288a24',
  })
  @IsString()
  postId: string

  @ApiProperty({
    example: '0cde6a63-2f61-4b4c-bf4e-ae9126288a24',
  })
  @IsString()
  @IsOptional()
  parentId: string = null
}

export class UpdateCommentDto {
  @ApiProperty({
    example: 'This is the content of the most attractive post!',
  })
  @IsOptional()
  @IsString()
  content: string
}

export class DeleteCommentDto {
  @ApiProperty({
    example: '0cde6a63-2f61-4b4c-bf4e-ae9126288a24',
  })
  @IsOptional()
  @IsString()
  postId: string

  @ApiProperty({
    example: '0cde6a63-2f61-4b4c-bf4e-ae9126288a24',
  })
  @IsOptional()
  @IsString()
  commentId: string
}
