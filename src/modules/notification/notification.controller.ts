import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common'
import { NotificationService } from './notification.service'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'
import { NotificationQueryDto } from '@dtos/notification.dto'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

@Controller()
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(@Req() req: Request, @Query() queryDto: NotificationQueryDto) {
    return this.notificationService.getUserNotifications(req.user['_id'], queryDto)
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
