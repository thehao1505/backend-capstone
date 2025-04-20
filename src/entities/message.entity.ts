import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseEntity } from './base.entity'

@Schema({
  timestamps: true,
  collectionOptions: {
    changeStreamPreAndPostImages: { enabled: true },
  },
})
export class Message extends BaseEntity {
  @Prop({
    ref: 'User',
    type: String,
  })
  sender: string

  @Prop({
    ref: 'User',
    type: String,
  })
  receiver: string

  @Prop({
    type: String,
    required: true,
  })
  content: string

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  isRead: boolean
}
export const MessageSchema = SchemaFactory.createForClass(Message)
export type MessageDocument = Message & Document
