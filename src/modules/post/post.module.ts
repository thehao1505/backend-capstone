import { Module } from '@nestjs/common'
import { PostController } from './post.controller'
import { PostService } from '@modules/index-service'

@Module({
  imports: [],
  controllers: [PostController],
  providers: [PostService, PostService],
  exports: [PostService],
})
export class PostModule {}
