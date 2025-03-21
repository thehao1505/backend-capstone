import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { AuthDto } from '@dtos/auth.dto'

@Controller()
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() authDto: AuthDto) {
    return this.authService.login(authDto)
  }

  @Post('register')
  async register(@Body() authDto: AuthDto) {
    return this.authService.register(authDto)
  }
}
