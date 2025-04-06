import { Body, Controller, Delete, Get, Param, Req, Post, Put, Query, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CreateUserDto, UpdateUserDto, QueryDto } from '@dtos/user.dto'
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
    console.log(req.user)
    return req.user
  }

  @Get()
  async getUsers(@Query() queryDto: QueryDto) {
    return await this.userService.getUsers(queryDto)
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return await this.userService.getUser(id)
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto)
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.updateUser(id, updateUserDto)
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return await this.userService.deleteUser(id)
  }

  @Post(':userId/follow/:followingId')
  async followUser(@Param('userId') userId: string, @Param('followingId') followingId: string) {
    return await this.userService.followUser(userId, followingId)
  }

  @Post(':userId/unfollow/:followingId')
  async unFollowUser(@Param('userId') userId: string, @Param('followingId') followingId: string) {
    return await this.userService.unFollowUser(userId, followingId)
  }

  @Post(':userId/remove-follower/:followerId')
  async removeFollower(@Param('userId') userId: string, @Param('followerId') followerId: string) {
    return await this.userService.removeFollower(userId, followerId)
  }
}
