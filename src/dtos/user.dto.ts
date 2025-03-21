import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

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

export class CreateUserDto {
  @ApiProperty({
    example: 'Hao',
  })
  @IsOptional()
  @IsString()
  firstName: string

  @ApiProperty({
    example: 'Nguyen',
  })
  @IsOptional()
  @IsString()
  lastName: string

  @ApiProperty({
    example: new Date().toISOString(),
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dob: Date

  @ApiProperty({
    example: 'Binh Thanh, HCMC',
  })
  @IsOptional()
  @IsString()
  address: string

  @ApiProperty({
    example: 'thehao155@gmail.com',
  })
  @IsString()
  email: string

  @ApiProperty({
    example: 'password',
  })
  @IsString()
  password: string
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
