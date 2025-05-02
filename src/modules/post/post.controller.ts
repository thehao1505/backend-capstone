import { Body, Controller, Post, Param, Get, Patch, Query, UseGuards, Req, UseInterceptors, Delete } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PostService } from '@modules/index-service'
import { CreatePostDto, QueryDto, UpdatePostDto } from '@dtos/post.dto'
import { Request } from 'express'
import { AuthGuard } from '@nestjs/passport'
import { PostEmbeddingInterceptor } from 'src/interceptors/post-embedding.interceptor'

@Controller()
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseInterceptors(PostEmbeddingInterceptor)
  async createPost(@Req() req: Request, @Body() createPostDto: CreatePostDto) {
    return (await this.postService.createPost(req.user['_id'], createPostDto)).populate('author', 'username avatar')
  }

  @Get(':id')
  async getPost(@Req() req: Request, @Param('id') id: string) {
    return this.postService.getPost(req.user['_id'], id)
  }

  @Get()
  async getPosts(@Query() queryDto: QueryDto) {
    return this.postService.getPosts(queryDto)
  }

  @Patch(':id')
  @UseInterceptors(PostEmbeddingInterceptor)
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

  @Delete(':id/soft-delete')
  async softDeletePost(@Param('id') id: string) {
    return await this.postService.softDeletePost(id)
  }

  @Delete(':id/hidden')
  async hiddenPost(@Param('id') id: string, @Req() req: Request) {
    return await this.postService.hiddenPost(req.user['_id'], id)
  }
}
