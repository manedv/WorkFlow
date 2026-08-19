import {
  Controller, Get, Patch, Param, Query, UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@CurrentUser() user: { userId: string }, @Query('unread') unread?: string) {
    const notifications = await this.notificationsService.findByUser(user.userId, unread === 'true');
    return { success: true, data: notifications };
  }

  @Get('count')
  async getUnreadCount(@CurrentUser() user: { userId: string }) {
    const count = await this.notificationsService.getUnreadCount(user.userId);
    return { success: true, data: { count } };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    await this.notificationsService.markAsRead(id, user.userId);
    return { success: true, data: { message: 'Marked as read' } };
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: { userId: string }) {
    await this.notificationsService.markAllAsRead(user.userId);
    return { success: true, data: { message: 'All marked as read' } };
  }
}
