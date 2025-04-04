import { Body, Controller, Get, Patch, Post, Query, Param, Req, Delete, UseGuards } from '@nestjs/common'
import { CommentService } from '@modules/index-service'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'
import { CreateCommentDto, QueryCommentDto, UpdateCommentDto, DeleteCommentDto } from '@dtos/comment.dto'

@Controller()
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  async createComment(@Req() req: Request, @Body() createCommentDto: CreateCommentDto) {
    return await this.commentService.createComment(req.user['_id'], createCommentDto)
  }

  @Get()
  async getCommentsByParentId(@Query() queryCommentDto: QueryCommentDto) {
    return await this.commentService.getCommentsByParentId(queryCommentDto)
  }

  @Patch(':id')
  async updateComment(@Param('id') id: string, @Req() req: Request, @Body() updateCommentDto: UpdateCommentDto) {
    return await this.commentService.updateComment(id, req.user['_id'], updateCommentDto)
  }

  @Delete()
  async deleteComment(@Req() req: Request, @Body() deleteCommentDto: DeleteCommentDto) {
    return await this.commentService.deleteComment(req.user['_id'], deleteCommentDto)
  }
}
