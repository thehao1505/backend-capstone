/* eslint-disable prettier/prettier */
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsOptional, IsNotEmpty, Min, IsInt, IsJSON } from 'class-validator'

export class Pagination {
  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(1)
  @IsInt()
  page?: number

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(1)
  @IsInt()
  limit?: number = 10

  @ApiPropertyOptional({
    example: { "key": "Value" },
    description: 'A valid JSON string',
  })
  @IsOptional()
  @IsJSON()
  sort?: string
}
