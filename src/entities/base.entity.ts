import { Prop } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

export class BaseEntity extends Document {
  @Prop({
    type: String,
    default: () => uuidv4(),
  })
  _id: string
  createdAt: Date
  updatedAt: Date

  @Prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean

  @Prop({
    type: Date,
  })
  deletedAt: Date

  @Prop({
    type: String,
  })
  createdBy: string

  @Prop({
    type: String,
  })
  updatedBy: string
}
