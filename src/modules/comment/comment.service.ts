import { BadRequestException, forwardRef, Inject } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Comment } from '@entities'
import { PostService } from '@modules/index-service'
import { UserService } from '@modules/index-service'
import { CreateCommentDto, QueryCommentDto, UpdateCommentDto, DeleteCommentDto } from '@dtos/comment.dto'

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @Inject(forwardRef(() => PostService)) private readonly postService: PostService,
  ) {}

  MAX_DEPTH = 3

  async createComment(userId: string, createCommentDto: CreateCommentDto) {
    const { postId, content, parentId } = createCommentDto
    let right: number, depth: number
    if (parentId) {
      const parentComment = await this.commentModel.findById(parentId)
      if (!parentComment || parentComment.postId !== postId) throw new BadRequestException('Not found parent comment')
      if (parentComment.depth >= this.MAX_DEPTH) throw new BadRequestException('Depth of comment is too large')

      right = parentComment.right

      await this.commentModel.updateMany(
        {
          postId: parentComment.postId,
          right: { $gte: right },
        },
        {
          $inc: { right: 2 },
        },
      )

      await this.commentModel.updateMany(
        {
          postId: parentComment.postId,
          left: { $gt: right },
        },
        {
          $inc: { left: 2 },
        },
      )
      depth = parentComment.depth + 1
    } else {
      const maxRightValue = await this.commentModel.findOne(
        {
          postId: createCommentDto.postId,
        },
        'right',
        { sort: { right: -1 } },
      )
      if (maxRightValue) right = maxRightValue.right + 1
      else right = 1
      depth = 1
    }
    const comment = await this.commentModel.create({
      userId,
      postId,
      content,
      parentId,
    })

    comment.depth = depth
    comment.left = right
    comment.right = right + 1

    return await comment.save()
  }

  async getCommentsByParentId(queryCommentDto: QueryCommentDto) {
    const { postId, parentId, page, limit, sort } = queryCommentDto
    if (parentId) {
      const parentComment = await this.commentModel.findById(parentId)
      if (!parentComment || parentComment.postId !== postId) throw new BadRequestException('Not found comment by post and parent comment')

      const comments = await this.commentModel
        .find({
          postId,
          left: { $gt: parentComment.left },
          right: { $lt: parentComment.right },
        })
        .select({
          _id: 1,
          left: 1,
          right: 1,
          parentId: 1,
        })
        .sort(sort || { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)

      return comments
    }

    const comments = await this.commentModel
      .find({
        postId: postId,
        parentId,
      })
      .populate({
        path: 'userId',
        select: 'username avatar',
      })
      .sort(sort || { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    return comments
  }

  async updateComment(commentId: string, userId: string, updateCommentDto: UpdateCommentDto) {
    const [comment] = await Promise.all([this.commentModel.findById(commentId)])
    if (!comment) throw new BadRequestException('Not found comment')

    if (comment.userId !== userId) {
      throw new BadRequestException('You are not allowed to update this comment')
    }

    comment.content = updateCommentDto.content
    return await comment.save()
  }

  async deleteComment(userId: string, deleteCommentDto: DeleteCommentDto) {
    const { commentId, postId } = deleteCommentDto
    const [comment, post] = await Promise.all([this.commentModel.findById(commentId), this.postService.getPost(postId)])
    if (!comment || !post) throw new BadRequestException('Not found comment/post')

    if (comment.userId !== userId && post.author !== userId) {
      throw new BadRequestException('You are not allowed to delete this comment')
    }

    const leftValue = comment.left
    const rightValue = comment.right

    const width = rightValue - leftValue + 1

    await this.commentModel.deleteMany({
      postId,
      left: { $gte: leftValue, $lte: rightValue },
    })

    await this.commentModel.updateMany(
      {
        postId,
        left: { $gt: rightValue },
      },
      {
        $inc: { left: -width },
      },
    )

    await this.commentModel.updateMany(
      {
        postId,
        right: { $gt: rightValue },
      },
      {
        $inc: { right: -width },
      },
    )

    return { message: 'Comment deleted successfully' }
  }
}
