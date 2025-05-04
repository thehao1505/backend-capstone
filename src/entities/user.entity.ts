import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseEntity } from './base.entity'
import * as bcrypt from 'bcryptjs'
import { configs } from '@utils/configs'

@Schema({
  timestamps: true,
  collectionOptions: {
    changeStreamPreAndPostImages: { enabled: true },
  },
  _id: false,
})
export class User extends BaseEntity {
  @Prop({
    type: String,
    required: true,
  })
  username: string

  @Prop({
    type: String,
    default: configs.defaultAvatar,
  })
  avatar: string

  @Prop({
    type: String,
  })
  firstName: string

  @Prop({
    type: String,
  })
  lastName: string

  @Prop({
    type: String,
  })
  fullName: string

  @Prop({
    type: Date,
  })
  dob: Date

  @Prop({
    type: String,
    required: true,
  })
  email: string

  @Prop({
    type: String,
  })
  address: string

  @Prop({
    type: String,
  })
  password: string

  @Prop({
    type: Date,
    default: null,
  })
  passwordChangeAt: Date

  @Prop({
    type: String,
    default: null,
  })
  passwordResetToken: string

  @Prop({
    type: Date,
    default: null,
  })
  passwordResetExpires: Date

  @Prop({
    type: [String],
    ref: 'User',
    default: [],
  })
  followings: string[]

  @Prop({
    type: [String],
    ref: 'User',
    default: [],
  })
  followers: string[]

  @Prop({
    type: Boolean,
    default: true,
  })
  isPublic: boolean

  @Prop({
    type: String,
    default: null,
  })
  shortDescription: string

  @Prop({
    type: Boolean,
    default: false,
  })
  isEmbedded: boolean

  @Prop({
    type: Date,
    default: null,
  })
  lastEmbeddedAt: Date
}
export const UserSchema = SchemaFactory.createForClass(User)
export type UserDocument = User & Document

UserSchema.index({ email: 1 }, { unique: true, background: true })
UserSchema.index({ username: 1 }, { unique: true, background: true })

UserSchema.index(
  {
    username: 'text',
    fullName: 'text',
    shortDescription: 'text',
  },
  {
    weights: {
      username: 10,
      fullName: 5,
      shortDescription: 1,
    },
    name: 'UserTextIndex',
  },
)

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12)
  }
  next()
})

UserSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], async function (next) {
  const update = this.getUpdate() as any

  if (update.password) {
    update.password = await bcrypt.hash(update.password, 12)
  }

  next()
})

UserSchema.pre('save', function (next) {
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.fullName = `${this.firstName} ${this.lastName}`
  }
  next()
})

UserSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], async function (next) {
  const update = this.getUpdate() as any
  const query = this.getQuery()
  const currentUser = await this.model.findById(query._id)

  if (update.$set.firstName || update.$set.lastName) {
    const firstName = update.$set.firstName || currentUser?.firstName
    const lastName = update.$set.lastName || currentUser?.lastName
    update.$set.fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim()
  }

  next()
})
