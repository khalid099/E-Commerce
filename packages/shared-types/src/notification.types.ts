export enum NotificationType {
  /** Customer — an order was successfully placed. */
  ORDER_PLACED = 'ORDER_PLACED',
  /** Customer — an order they own moved to a new status. */
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  /** Customer — the store replied to their product review. */
  REVIEW_REPLY = 'REVIEW_REPLY',
  /** Admin — a new order was received. */
  NEW_ORDER = 'NEW_ORDER',
  /** Admin — a product dropped to or below the low-stock threshold. */
  LOW_STOCK = 'LOW_STOCK',
}

/** Deep-link context carried by a notification; drives the bell entry's target. */
export interface NotificationMetadata {
  orderId?: string;
  productId?: string;
  status?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata: NotificationMetadata | null;
  /** In-app route the entry navigates to, derived server-side from metadata. */
  link: string | null;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

/**
 * Socket.IO channel contract for real-time delivery. The gateway namespaces the
 * connection under `/notifications` and pushes to a per-user room; the client
 * subscribes to these events. Kept here so both apps share one source of truth.
 */
export const NOTIFICATION_NAMESPACE = '/notifications';

export const NOTIFICATION_EVENTS = {
  /** Server → client: a freshly created notification. Payload: `Notification`. */
  NEW: 'notification:new',
  /** Server → client: the user's current unread count. Payload: `UnreadCount`. */
  UNREAD: 'notification:unread',
} as const;
