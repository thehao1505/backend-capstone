import { User, UserSchema } from '@entities'
import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { NotificationModule, QdrantModule, RedisModule } from '@modules/index'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    forwardRef(() => RedisModule),
    forwardRef(() => QdrantModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
