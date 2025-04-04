import { Inject, Injectable, forwardRef, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Post } from '@entities'
import { UploadService, UserService } from '@modules/index-service'
import { CreatePostDto, UpdatePostDto } from '@dtos/post.dto'
import { QueryDto } from '@dtos/post.dto'

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @Inject(forwardRef(() => UploadService)) private readonly uploadService: UploadService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
  ) {}

  async createPost(createPostDto: CreatePostDto) {
    return await this.postModel.create(createPostDto)
  }

  async updatePost(id: string, updatePostDto: UpdatePostDto) {
    return await this.postModel.findByIdAndUpdate(id, updatePostDto, { new: true })
  }

  // IMPORTANT
  // get recommended posts by user's behavior
  // get posts by user's id
  // get posts by following users
  // hidden/non-hidden posts
  // public users/private users => if private, have to check if user is following the author && the post is non-hidden
  async getPosts(queryDto: QueryDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { author, page, limit, sort } = queryDto
    return await this.postModel.find()
  }

  async getPost(id: string) {
    return await this.postModel.findById(id)
  }

  async likePost(postId: string, userId: string) {
    const [post, user] = await Promise.all([this.postModel.findById(postId), this.userService.getUser(userId)])
    if (!post || !user) throw new NotFoundException('Post or user not found')

    if (post.likes.includes(userId)) {
      throw new BadRequestException('User already liked this post')
    }
    post.likes.push(userId)
    return await post.save()
  }

  async unLikePost(postId: string, userId: string) {
    const [post, user] = await Promise.all([this.postModel.findById(postId), this.userService.getUser(userId)])
    if (!post || !user) throw new NotFoundException('Post or user not found')

    if (!post.likes.includes(userId)) {
      throw new BadRequestException('User has not liked this post')
    }
    post.likes.filter(id => id !== userId)
    return await post.save()
  }
}
