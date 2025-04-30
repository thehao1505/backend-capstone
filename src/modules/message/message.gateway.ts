/* eslint-disable @typescript-eslint/no-unused-vars */
import { MessageService } from '@modules/index-service'
import { Logger } from '@nestjs/common'
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets'
import { Socket, Server } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { configs } from '@utils/configs'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private users: Map<string, string> = new Map()

  constructor(
    private readonly messageService: MessageService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    Logger.log('✅ WebSocket server has been initialized on port 8080')
  }

  // are Lifecycles Hooks provided by Nestjs for Websocket Gateway.
  // They are not "Handler registered by Nest via Decorators" as @subscribeMemessage ('chat'), so @useGuards () cannot be automatically applied.
  // In other words: Guard does not know where to "hook" to run before handleconnection ().
  async handleConnection(client: Socket) {
    try {
      const userId = await this.authenticateSocket(client)

      this.users.set(userId, client.id)
    } catch (error) {
      console.log(`❌ Connection rejected: ${error.message}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.users.entries()).find(([_, socketId]) => socketId === client.id)?.[0]
    if (userId) {
      this.users.delete(userId)
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: {
      receiverId: string
      content: string
    },
  ) {
    const senderId = client.data.userId

    const message = await this.messageService.createMessage({
      sender: senderId,
      receiver: payload.receiverId,
      content: payload.content,
    })

    const receiverSocketId = this.users.get(payload.receiverId)
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('newMessage', message)
    }

    return message
  }

  private authenticateSocket(client: Socket): Promise<string> {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1]

      if (!token) {
        throw new WsException('Unauthorized: Token not found')
      }

      const payload = this.jwtService.verify(token, {
        secret: configs.jwtSecret,
      })

      client.data.userId = payload._id
      return payload._id
    } catch (err) {
      console.log(err.message)
      throw new WsException('Unauthorized: Invalid token')
    }
  }
}
