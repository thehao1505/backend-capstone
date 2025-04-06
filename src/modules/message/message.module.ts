import { Message, MessageSchema } from '@entities/index'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { MessageService } from './message.service'
import { MessageController } from './message.controller'
import { MessageGateway } from './message.gateway'
import { JwtModule } from '@nestjs/jwt'

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      {
        name: Message.name,
        schema: MessageSchema,
      },
    ]),
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway],
})
export class MessageModule {}
