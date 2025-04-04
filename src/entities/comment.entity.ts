import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseEntity } from './base.entity'

@Schema({
  timestamps: true,
  collectionOptions: {
    changeStreamPreAndPostImages: { enabled: true },
  },
  _id: false,
})
export class Comment extends BaseEntity {
  @Prop({
    type: String,
    ref: 'User',
  })
  userId: string

  @Prop({
    type: String,
    ref: 'Post',
  })
  postId: string

  @Prop({
    type: String,
  })
  content: string

  @Prop({
    type: [String],
    ref: 'User',
    default: [],
  })
  likes: string[]

  @Prop({
    type: String,
    ref: 'Comment',
  })
  parentId: string

  @Prop({
    type: Number,
    default: 0,
  })
  depth: number

  @Prop({
    type: Number,
    default: 0,
  })
  left: number

  @Prop({
    type: Number,
    default: 0,
  })
  right: number
}

export const CommentSchema = SchemaFactory.createForClass(Comment)
export type CommentDocument = Comment & Document
