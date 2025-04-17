import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common'
import { NotificationService } from './notification.service'
import { ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'

@Controller()
@ApiTags('Notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(@Req() req: Request, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.notificationService.getUserNotifications(req.user['_id'], page, limit)
  }

  @Get('unread/count')
  async getUnreadCount(@Req() req: Request) {
    return this.notificationService.getUnreadCount(req.user['_id'])
  }

  @Get(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id)
  }
}
