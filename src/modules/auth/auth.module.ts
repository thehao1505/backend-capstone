import { User, UserSchema } from '@entities'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthController } from './auth.controller'
import { AuthService } from '@modules/index-service'
import { JwtModule } from '@nestjs/jwt'
import { JwtStrategy } from '../../strategy'

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
