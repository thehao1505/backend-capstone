import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Notification, NotificationType, NotificationDocument } from '../../entities/notification.entity'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { NotificationGateway } from './notification.gateway'
import { NotificationQueryDto } from '@dtos/notification.dto'

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly notificationGateway: NotificationGateway,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async createNotification(data: {
    type: NotificationType
    recipientId: string
    senderId: string
    postId?: string
    commentId?: string
    metadata?: Record<string, any>
  }) {
    const initNotification = await this.notificationModel.create(data)
    const notification = await this.notificationModel
      .findById(initNotification._id)
      .populate('senderId', 'avatar username followers followings')
      .populate('postId', 'content likes')
      .populate('commentId', 'content likes left right postId')

    await this.notificationQueue.add('process-notification', {
      notificationId: notification._id,
    })

    this.notificationGateway.sendToUser(data.recipientId, notification)

    return notification
  }

  async markAsRead(notificationId: string) {
    return this.notificationModel.findByIdAndUpdate(notificationId, { isRead: true }, { new: true })
  }

  async getUserNotifications(userId: string, queryDto: NotificationQueryDto) {
    const { page, limit } = queryDto
    const skip = (page - 1) * limit
    return this.notificationModel
      .find({ recipientId: userId })
      .populate('senderId', 'avatar username followers followings')
      .populate('postId', 'content likes')
      .populate('commentId', 'content likes left right postId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec()
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({
      recipientId: userId,
      isRead: false,
    })
  }
}
