import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { MessageService } from '@modules/index-service'
import { Request } from 'express'
import { GetConversationDto } from '@dtos/message.dto'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

@Controller()
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('conversation')
  async getConversation(@Req() req: Request, @Query() getConversationDto: GetConversationDto) {
    return this.messageService.getConversation(req.user['_id'], getConversationDto)
  }
}
