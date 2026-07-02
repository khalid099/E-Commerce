import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Mirrors NotificationType in @ecommerce/shared-types. Declared locally so the
// entity column owns its own runtime enum (same pattern as OrderStatus).
export enum NotificationType {
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  REVIEW_REPLY = 'REVIEW_REPLY',
  NEW_ORDER = 'NEW_ORDER',
  LOW_STOCK = 'LOW_STOCK',
}

export interface NotificationMetadata {
  orderId?: string;
  productId?: string;
  status?: string;
}

// Indexed on the two access patterns: the unread-count query filters by
// (userId, isRead); the list endpoint orders by (userId, createdAt).
@Entity('notifications')
@Index(['userId', 'isRead'])
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  // Deep-link context (orderId / productId / status). jsonb so it stays queryable
  // and typed without a join table.
  @Column({ type: 'jsonb', nullable: true })
  metadata: NotificationMetadata | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
