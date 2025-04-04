import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseEntity } from './base.entity'

@Schema({
  timestamps: true,
  collectionOptions: {
    changeStreamPreAndPostImages: { enabled: true },
  },
  _id: false,
})
export class Post extends BaseEntity {
  @Prop({
    type: String,
  })
  content: string

  @Prop({
    type: [String],
  })
  images: string[]

  @Prop({
    type: String,
    ref: 'User',
  })
  author: string

  @Prop({
    type: [String],
    ref: 'User',
    default: [],
  })
  likes: string[]

  @Prop({
    type: Boolean,
    default: false,
  })
  isHidden: boolean
}
export const PostSchema = SchemaFactory.createForClass(Post)
export type PostDocument = Post & Document
