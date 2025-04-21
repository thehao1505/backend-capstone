import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User } from '@entities'
import { QueryDto, UpdateUserDto } from '@dtos/user.dto'

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async getMe(userId: string) {
    return await this.userModel.findById(userId).select('_id username email avatar followers followings')
  }

  async getUsers(queryDto: QueryDto) {
    return await this.userModel.find().limit(queryDto.limit).skip(queryDto.page).lean()
  }

  async getUser(id: string) {
    return await this.userModel.findById(id).select('-password')
  }

  async getUserByUsername(username: string) {
    const user = await this.userModel.findOne({ username }).select('-password')
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userModel.findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
    if (!updatedUser) {
      throw new NotFoundException('User not found')
    }
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

  async getUserConnection(userId: string) {
    const user = await this.userModel.findById(userId)
    return await this.userModel
      .find({
        _id: { $in: user.followers.concat(user.followings) },
      })
      .select('avatar username')
  }
}
