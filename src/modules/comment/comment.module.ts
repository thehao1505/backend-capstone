import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Comment, CommentSchema } from '@entities'
import { UserModule, PostModule, NotificationModule } from '@modules/index'
import { CommentController } from './comment.controller'
import { CommentService } from '@modules/index-service'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Comment.name,
        schema: CommentSchema,
      },
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => PostModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
