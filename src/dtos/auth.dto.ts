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

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'thehao155@gmail.com',
  })
  @IsString()
  email: string
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'password',
  })
  @IsString()
  password: string

  @ApiProperty({
    example: 'password',
  })
  @IsString()
  passwordConfirm: string
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'password',
  })
  @IsString()
  currentPassword: string

  @ApiProperty({
    example: 'password',
  })
  @IsString()
  newPassword: string

  @ApiProperty({
    example: 'password',
  })
  @IsString()
  newPasswordConfirm: string
}
