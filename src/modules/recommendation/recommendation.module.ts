import { RecommendationService } from '@modules/index-service'
import { forwardRef, Module } from '@nestjs/common'
import { RecommendationController } from './recommendation.controller'
import { User, UserSchema, Post, PostSchema } from '@entities/index'
import { MongooseModule } from '@nestjs/mongoose'
import { QdrantModule, CommentModule, RedisModule } from '@modules/index'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => QdrantModule),
    forwardRef(() => RedisModule),
    forwardRef(() => CommentModule),
  ],
  providers: [RecommendationService],
  exports: [RecommendationService],
  controllers: [RecommendationController],
})
export class RecommendationModule {}
