import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

// Every route is scoped to the authenticated user via @CurrentUser — a customer
// can only ever read or mutate their own notifications.
@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's notifications (paginated)" })
  list(@CurrentUser() user: User, @Query() query: QueryNotificationDto) {
    return this.notificationsService.list(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: "Get the current user's unread notification count" })
  async unreadCount(@CurrentUser() user: User): Promise<{ count: number }> {
    return { count: await this.notificationsService.countUnread(user.id) };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all of the current user\'s notifications as read' })
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Dismiss (delete) a notification' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.remove(user.id, id);
  }
}
