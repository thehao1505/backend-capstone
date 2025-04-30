import { forwardRef, Module } from '@nestjs/common'
import { QdrantService } from './qdrant.service'
import { EmbeddingService } from './embedding.service'
import { EmbeddingProcessor } from './embedding.processor'
import { MongooseModule } from '@nestjs/mongoose'
import { Post, PostSchema } from '@entities/index'
import { RedisModule } from '@modules/redis/redis.module'

@Module({
  imports: [forwardRef(() => RedisModule), MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }])],
  providers: [QdrantService, EmbeddingService, EmbeddingProcessor],
  exports: [QdrantService, EmbeddingService, EmbeddingProcessor],
})
export class QdrantModule {}
