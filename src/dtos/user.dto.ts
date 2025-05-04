import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'
import { Pagination } from './base.dto'

export class QueryDto {
  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(1)
  @IsInt()
  limit: number = 10

  @ApiPropertyOptional({
    example: 10,
  })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(1)
  @IsInt()
  page: number = 1
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'thehao155',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  username: string

  @ApiPropertyOptional({
    example: 'Hao',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  firstName: string

  @ApiPropertyOptional({
    example: 'Nguyen',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  lastName: string

  @ApiPropertyOptional({
    example: 'I am a software engineer',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  shortDescription: string

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  avatar: string
}

export class QuerySearchDto extends Pagination {
  @ApiProperty({
    example: 'Some content to search',
  })
  @IsString()
  text: string
}
