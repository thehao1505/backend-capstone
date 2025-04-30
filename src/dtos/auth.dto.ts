import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, MinLength, MaxLength, Matches, IsNotEmpty, IsOptional } from 'class-validator'

export class AuthDto {
  @ApiPropertyOptional({
    example: 'thehao155@gmail.com',
  })
  @IsString()
  @IsOptional()
  email: string

  @ApiPropertyOptional({
    example: 'thehao155',
  })
  @IsString()
  @IsOptional()
  username: string

  @ApiProperty({
    example: 'password',
  })
  @IsString()
  password: string
}

export class RegisterDto {
  @ApiProperty({
    example: 'thehao155',
  })
  @IsNotEmpty({ message: 'Username is required.' })
  @IsString()
  @MinLength(6, { message: 'Username must be at least 6 characters long.' })
  @MaxLength(24, { message: 'Username cannot exceed 24 characters.' })
  @Matches(/^[a-z0-9._]+$/, {
    message: 'Username must only contain lowercase letters, numbers, dots (.), and underscores (_)',
  })
  username: string

  @ApiProperty({
    example: 'Hao',
  })
  @IsString()
  firstName: string

  @ApiProperty({
    example: 'Nguyen',
  })
  @IsString()
  lastName: string

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
