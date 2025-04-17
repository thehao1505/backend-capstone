import { Controller, Delete, Get, Param, Req, Post, Query, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { QueryDto } from '@dtos/user.dto'
import { Request } from 'express'
import { AuthGuard } from '@nestjs/passport'

@Controller()
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  me(@Req() req: Request) {
    return this.userService.getMe(req.user['_id'])
  }

  @Get()
  async getUsers(@Query() queryDto: QueryDto) {
    return await this.userService.getUsers(queryDto)
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return await this.userService.getUser(id)
  }

  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string) {
    return await this.userService.getUserByUsername(username)
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return await this.userService.deleteUser(id)
  }

  @Post('follow/:followingId')
  async followUser(@Req() req: Request, @Param('followingId') followingId: string) {
    return await this.userService.followUser(req.user['_id'], followingId)
  }

  @Post('unfollow/:followingId')
  async unFollowUser(@Req() req: Request, @Param('followingId') followingId: string) {
    return await this.userService.unFollowUser(req.user['_id'], followingId)
  }

  @Post('remove-follower/:followerId')
  async removeFollower(@Req() req: Request, @Param('followerId') followerId: string) {
    return await this.userService.removeFollower(req.user['_id'], followerId)
  }

  @Get('connection/user')
  async getUserConnection(@Req() req: Request) {
    return await this.userService.getUserConnection(req.user['_id'])
  }
}
