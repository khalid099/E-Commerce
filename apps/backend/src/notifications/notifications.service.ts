import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  Notification as NotificationResponse,
  PaginatedResponse,
} from '@ecommerce/shared-types';
import {
  Notification,
  NotificationType,
  NotificationMetadata,
} from './entities/notification.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationsGateway } from './notifications.gateway';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gateway: NotificationsGateway,
  ) {}

  private mapNotification(n: Notification): NotificationResponse {
    return {
      id: n.id,
      type: n.type as unknown as NotificationResponse['type'],
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      metadata: n.metadata ?? null,
      link: this.deriveLink(n),
      createdAt: n.createdAt.toISOString(),
    };
  }

  // The in-app target for an entry, derived from type + metadata. Customer types
  // resolve to storefront routes; admin types to the admin panel.
  private deriveLink(n: Notification): string | null {
    const m = n.metadata ?? {};
    switch (n.type) {
      case NotificationType.ORDER_PLACED:
      case NotificationType.ORDER_STATUS_CHANGED:
        return m.orderId ? `/orders/${m.orderId}` : null;
      case NotificationType.REVIEW_REPLY:
        return m.productId ? `/products/${m.productId}` : null;
      case NotificationType.NEW_ORDER:
        return m.orderId ? `/admin/orders?order=${m.orderId}` : '/admin/orders';
      case NotificationType.LOW_STOCK:
        return '/admin/products';
      default:
        return null;
    }
  }

  /**
   * Persist a notification and push it in real time. Best-effort by design:
   * a delivery failure must never break the business flow that triggered it,
   * so callers invoke this outside their critical transaction.
   */
  async create(input: CreateNotificationInput): Promise<void> {
    const entity = this.notificationRepo.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? null,
      isRead: false,
    });
    const saved = await this.notificationRepo.save(entity);

    this.gateway.emitNew(input.userId, this.mapNotification(saved));
    this.gateway.emitUnread(input.userId, await this.countUnread(input.userId));
  }

  /** Fan a single notification out to every admin (new order, low stock). */
  async notifyAdmins(
    input: Omit<CreateNotificationInput, 'userId'>,
  ): Promise<void> {
    const admins = await this.userRepo.find({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) => this.create({ ...input, userId: admin.id })),
    );
  }

  async list(
    userId: string,
    query: QueryNotificationDto,
  ): Promise<PaginatedResponse<NotificationResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = { userId };
    if (query.unread === 'true') where['isRead'] = false;

    const [rows, total] = await this.notificationRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    return {
      data: rows.map((n) => this.mapNotification(n)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationRepo.count({ where: { userId, isRead: false } });
  }

  // Ownership is enforced in the WHERE clause: a user can only mark their own
  // notification read; another user's id simply matches nothing.
  async markRead(userId: string, id: string): Promise<void> {
    const result = await this.notificationRepo.update(
      { id, userId },
      { isRead: true },
    );
    if (result.affected === 0) throw new NotFoundException('Notification not found');
    this.gateway.emitUnread(userId, await this.countUnread(userId));
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
    this.gateway.emitUnread(userId, 0);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.notificationRepo.delete({ id, userId });
    if (result.affected === 0) throw new NotFoundException('Notification not found');
    this.gateway.emitUnread(userId, await this.countUnread(userId));
  }
}
