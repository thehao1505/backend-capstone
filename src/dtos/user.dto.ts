import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator'

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
