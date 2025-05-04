import { Body, Controller, Post, Patch, Param, UseInterceptors } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { AuthDto, ChangePasswordDto, ResetPasswordDto, ForgotPasswordDto, RegisterDto } from '@dtos/auth.dto'
import { UserEmbeddingInterceptor } from 'src/interceptors/user-embedding.interceptor'

@Controller()
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() authDto: AuthDto) {
    return this.authService.login(authDto)
  }

  @Post('register')
  @UseInterceptors(UserEmbeddingInterceptor)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email)
  }

  @Patch('reset-password/:token')
  async resetPassword(@Param('token') token: string, @Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto, token)
  }

  @Patch('change-password/:id')
  async changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(id, changePasswordDto)
  }
}
