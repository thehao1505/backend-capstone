import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { NotificationDocument } from '@entities'

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name)

  constructor(
    @InjectModel('Notification')
    private notificationModel: Model<NotificationDocument>,
  ) {}

  @Process('process-notification')
  async handleNotification(job: Job<{ notificationId: string }>) {
    this.logger.debug('Processing notification...')

    try {
      const notification = await this.notificationModel.findById(job.data.notificationId)
      if (!notification) {
        throw new Error('Notification not found')
      }

      this.logger.debug(`Notification ${notification._id} processed successfully`)
    } catch (error) {
      this.logger.error(`Error processing notification: ${error.message}`)
      throw error
    }
  }
}
