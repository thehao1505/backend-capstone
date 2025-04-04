import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User } from '@entities'
import { CreateUserDto, UpdateUserDto, QueryDto } from '@dtos/user.dto'

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async getUsers(queryDto: QueryDto) {
    return await this.userModel.find().limit(queryDto.limit).skip(queryDto.page).lean()
  }

  async getUser(id: string) {
    return await this.userModel.findById(id)
  }

  async createUser(createUserDto: CreateUserDto) {
    return await this.userModel.create(createUserDto)
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    return await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true })
  }

  async deleteUser(id: string) {
    return await this.userModel.findByIdAndDelete(id)
  }

  async followUser(userId: string, followingId: string) {
    try {
      if (userId === followingId) {
        throw new BadRequestException('Can not do this action')
      }
      const user = await this.userModel.findById(userId)
      if (user.followings.includes(followingId)) {
        throw new BadRequestException('User is already following this user')
      }
      user.followings.push(followingId)
      const following = await this.userModel.findById(followingId)
      following.followers.push(userId)
      await Promise.all([user.save(), following.save()])
      return { message: 'Followed successfully' }
    } catch (error) {
      throw new BadRequestException('Can not follow this user')
    }
  }

  async unFollowUser(userId: string, followingId: string) {
    try {
      if (userId === followingId) {
        throw new BadRequestException('Can not do this action')
      }
      const user = await this.userModel.findById(userId)
      if (!user.followings.includes(followingId)) {
        throw new BadRequestException('User is not following this user')
      }
      user.followings = user.followings.filter(id => id.toString() !== followingId)
      const following = await this.userModel.findById(followingId)
      following.followers = following.followers.filter(id => id.toString() !== userId)
      await Promise.all([user.save(), following.save()])
      return { message: 'Unfollowed successfully' }
    } catch (error) {
      throw new BadRequestException('Can not unfollow this user')
    }
  }

  async removeFollower(userId: string, followerId: string) {
    try {
      if (userId === followerId) {
        throw new BadRequestException('Can not do this action')
      }
      const user = await this.userModel.findById(userId)
      if (!user.followers.includes(followerId)) {
        throw new BadRequestException('User is not following this user')
      }
      user.followers = user.followers.filter(id => id.toString() !== followerId)
      const follower = await this.userModel.findById(followerId)
      follower.followings = follower.followings.filter(id => id.toString() !== userId)
      await Promise.all([user.save(), follower.save()])
      return { message: 'Removed follower successfully' }
    } catch (error) {
      throw new BadRequestException('Can not remove follow this user')
    }
  }
}
