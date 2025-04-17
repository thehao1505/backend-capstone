import { User } from '@entities/user.entity'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PassportStrategy } from '@nestjs/passport'
import { configs } from '@utils/configs'
import { Model } from 'mongoose'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configs.jwtSecret,
    })
  }

  async validate(payload: { _id: string; email: string }) {
    const user = await this.userModel.findOne({ _id: payload._id })
    delete user.password
    return payload
  }
}
