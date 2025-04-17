import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Notification, NotificationType, NotificationDocument } from '../../entities/notification.entity'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationService {
  @WebSocketServer()
  server: Server

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
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
    const notification = await this.notificationModel.create(data)

    // Add to queue for processing
    await this.notificationQueue.add('process-notification', {
      notificationId: notification._id,
    })

    // Emit real-time notification
    this.server.to(data.recipientId).emit('new-notification', notification)

    return notification
  }

  async markAsRead(notificationId: string) {
    return this.notificationModel.findByIdAndUpdate(notificationId, { isRead: true }, { new: true })
  }

  async getUserNotifications(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    return this.notificationModel.find({ recipientId: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec()
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({
      recipientId: userId,
      isRead: false,
    })
  }
}
