import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseEntity } from './base.entity'

@Schema({
  timestamps: true,
  collectionOptions: {
    changeStreamPreAndPostImages: { enabled: true },
  },
  _id: false,
})
export class KeyStore extends BaseEntity {
  @Prop({
    type: String,
    required: true,
  })
  key: string

  @Prop({
    type: String,
    required: true,
  })
  value: string
}
export const KeyStoreSchema = SchemaFactory.createForClass(KeyStore)
export type KeyStoreDocument = KeyStore & Document
