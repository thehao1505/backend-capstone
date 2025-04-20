import { CreateMessageDto, GetConversationDto } from '@dtos/message.dto'
import { Message } from '@entities/index'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

@Injectable()
export class MessageService {
  constructor(@InjectModel(Message.name) private messageModel: Model<Message>) {}

  async createMessage(createMessageDto: CreateMessageDto) {
    return await this.messageModel.create(createMessageDto)
  }

  async getConversation(userId1: string, getConversationDto: GetConversationDto) {
    const { connectionId, limit, page } = getConversationDto
    return await this.messageModel
      .find({
        $or: [
          { sender: userId1, receiver: connectionId },
          { sender: connectionId, receiver: userId1 },
        ],
      })
      .sort({ createdAt: 1 })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
  }
}
