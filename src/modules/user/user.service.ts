import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { NotificationType, User } from '@entities'
import { QueryDto, QuerySearchDto, UpdateUserDto } from '@dtos/user.dto'
import { NotificationService } from '@modules/notification/notification.service'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { Cron, CronExpression } from '@nestjs/schedule'
import { configs } from '@utils/configs'
import { EmbeddingService, QdrantService } from '@modules/index-service'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectQueue('embedding') private readonly embeddingQueue: Queue,
    @Inject(forwardRef(() => QdrantService)) private readonly qdrantService: QdrantService,
    @Inject(forwardRef(() => EmbeddingService)) private readonly embeddingService: EmbeddingService,
    @Inject(forwardRef(() => NotificationService)) private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleEnqueueUserForEmbedding() {
    const users = await this.userModel
      .find({ isEmbedded: { $ne: true } })
      .limit(100)
      .lean()
    for (const user of users) {
      await this.enqueueUserForEmbedding(user._id.toString())
    }
  }

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
    const updatedUser = await this.userModel.findOneAndUpdate({ _id: id }, { $set: updateUserDto }, { new: true, runValidators: true })
    if (!updatedUser) {
      throw new NotFoundException('User not found')
    }
    return updatedUser
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
      await this.notificationService.createNotification({
        type: NotificationType.FOLLOW,
        recipientId: followingId,
        senderId: userId,
      })
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
    const user = await this.userModel.findById(userId).lean()

    const mutualConnectionIds = user.followers.filter(followerId => user.followings.includes(followerId.toString()))

    return await this.userModel.find({ _id: { $in: mutualConnectionIds } }).select('avatar username')
  }

  async searchUsers(query: QuerySearchDto) {
    const { page, limit } = query
    const { text } = query

    const embedding = await this.embeddingService.generateEmbedding(text)
    const similar = await this.qdrantService.searchSimilar(configs.userCollectionName, embedding, Number(limit), Number(page), {})

    const similarUserIds = similar.map(item => item.id)
    const similarUsersRaw = await this.userModel
      .find({
        _id: { $in: similarUserIds },
      })
      .select('avatar username fullName')
      .lean()

    const idToUserMap = new Map(similarUsersRaw.map(user => [user._id.toString(), user]))
    const similarUsers = similarUserIds.map(id => idToUserMap.get(id.toString())).filter(Boolean)

    return similarUsers
  }

  async enqueueUserForEmbedding(userId: string) {
    await this.embeddingQueue.add(
      'process-user-embedding',
      { userId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    )
    this.logger.log(`Enqueued user ${userId} for embedding`)
  }
}
