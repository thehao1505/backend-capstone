import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class AuthDto {
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
