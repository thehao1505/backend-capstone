import { forwardRef, Module } from '@nestjs/common'
import { QdrantService } from './qdrant.service'
import { EmbeddingService } from './embedding.service'
import { EmbeddingProcessor } from './embedding.processor'
import { MongooseModule } from '@nestjs/mongoose'
import { Post, PostSchema, User, UserSchema } from '@entities/index'
import { RedisModule } from '@modules/redis/redis.module'
import { QdrantController } from './qdrant.controller'

@Module({
  imports: [
    forwardRef(() => RedisModule),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [QdrantService, EmbeddingService, EmbeddingProcessor],
  controllers: [QdrantController],
  exports: [QdrantService, EmbeddingService, EmbeddingProcessor],
})
export class QdrantModule {}
