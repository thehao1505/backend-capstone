import { Body, Controller, Post, Param, Get, Patch, Query, UseGuards, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PostService } from '@modules/index-service'
import { CreatePostDto, QueryDto, UpdatePostDto } from '@dtos/post.dto'
import { Request } from 'express'
import { AuthGuard } from '@nestjs/passport'

@Controller()
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  async createPost(@Req() req: Request, @Body() createPostDto: CreatePostDto) {
    return (await this.postService.createPost(req.user['_id'], createPostDto)).populate('author', 'username avatar')
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.postService.getPost(id)
  }

  @Get()
  async getPosts(@Query() queryDto: QueryDto) {
    return this.postService.getPosts(queryDto)
  }

  @Patch(':id')
  async updatePost(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.updatePost(id, updatePostDto)
  }

  @Post(':id/like')
  async likePost(@Param('id') id: string, @Req() req: Request) {
    return await this.postService.likePost(id, req.user['_id'])
  }

  @Post(':id/unLike')
  async unLikePost(@Param('id') id: string, @Req() req: Request) {
    return await this.postService.unLikePost(id, req.user['_id'])
  }
}
