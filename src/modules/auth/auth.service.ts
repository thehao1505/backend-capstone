import { User } from '@entities'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { AuthDto } from '@dtos/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(authDto: AuthDto) {
    try {
      const user = await this.userModel.create(authDto)
      delete user.password

      return await this.signJwtToken(user._id, user.email)
    } catch (error) {
      console.log(error)
    }
  }

  async login(authDto: AuthDto) {
    const user = await this.userModel.findOne({ email: authDto.email })
    if (!user) throw new ForbiddenException('User not found')

    const isRightPassword = await bcrypt.compare(authDto.password, user.password)
    if (!isRightPassword) throw new ForbiddenException('Wrong password!')

    delete user.password
    return await this.signJwtToken(user.id, user.email)
  }

  async signJwtToken(id: string, email: string): Promise<{ accessToken: string }> {
    const payload = { sub: id, email }
    const jwtString = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
      secret: process.env.JWT_SECRET,
    })

    return { accessToken: jwtString }
  }
}
