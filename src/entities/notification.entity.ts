import { Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseEntity } from './base.entity'
import { Prop } from '@nestjs/mongoose'

export enum NotificationType {
  FOLLOW = 'FOLLOW',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  COMMENT_REPLY = 'COMMENT_REPLY',
}

@Schema({
  timestamps: true,
  collectionOptions: {
    changeStreamPreAndPostImages: { enabled: true },
  },
  _id: false,
})
export class Notification extends BaseEntity {
  @Prop({ required: true, enum: NotificationType })
  type: NotificationType

  @Prop({ required: true })
  recipientId: string

  @Prop({ required: true })
  senderId: string

  @Prop()
  postId?: string

  @Prop()
  commentId?: string

  @Prop({ default: false })
  isRead: boolean

  @Prop({ type: Object })
  metadata: Record<string, any>
}

export const NotificationSchema = SchemaFactory.createForClass(Notification)
export type NotificationDocument = Notification & Document
