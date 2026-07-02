'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Bell,
  Package,
  Truck,
  MessageSquare,
  ShoppingBag,
  AlertTriangle,
  CheckCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { NotificationType, type Notification } from '@ecommerce/shared-types';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

const ICONS: Record<NotificationType, LucideIcon> = {
  [NotificationType.ORDER_PLACED]: Package,
  [NotificationType.ORDER_STATUS_CHANGED]: Truck,
  [NotificationType.REVIEW_REPLY]: MessageSquare,
  [NotificationType.NEW_ORDER]: ShoppingBag,
  [NotificationType.LOW_STOCK]: AlertTriangle,
};

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

export function NotificationBell() {
  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const router = useRouter();

  const onOpen = (n: Notification) => {
    if (!n.isRead) void markRead(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
          className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full text-maison-muted transition-colors hover:bg-maison-line hover:text-maison-ink"
        >
          <Bell className="h-[19px] w-[19px]" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-maison-clay px-1.5 text-[11px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[310] bg-[rgba(33,28,22,0.42)] backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          aria-label="Notifications"
          className="fixed right-0 top-0 z-[311] flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-maison-cream shadow-[-40px_0_100px_-20px_rgba(33,28,22,0.45)] focus:outline-none data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out"
        >
          {/* header — dark ink band with a soft glow so the panel opens with weight */}
          <div className="relative shrink-0 overflow-hidden bg-maison-ink px-6 pb-6 pt-6 text-white">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-maison-clay/40 blur-3xl"
              aria-hidden
            />
            <div className="relative flex items-start justify-between">
              <div>
                <DialogPrimitive.Title className="font-serif text-[27px] leading-none tracking-tight">
                  Notifications
                </DialogPrimitive.Title>
                <p className="mt-2 text-[12.5px] text-white/55">
                  {unreadCount > 0
                    ? `${unreadCount} new update${unreadCount === 1 ? '' : 's'}`
                    : 'Order updates & replies'}
                </p>
              </div>
              <DialogPrimitive.Close
                aria-label="Close"
                className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <X className="h-[18px] w-[18px]" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <DialogPrimitive.Description className="sr-only">
            Order updates and review replies.
          </DialogPrimitive.Description>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-maison-line to-maison-cream shadow-inner ring-1 ring-maison-line">
                  <Bell className="h-7 w-7 text-maison-faint" aria-hidden />
                </span>
                <p className="font-serif text-[19px] text-maison-ink">
                  You&apos;re all caught up
                </p>
                <p className="max-w-[220px] text-[13px] leading-relaxed text-maison-faint">
                  Order updates and replies will appear here.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((n) => {
                  const Icon = ICONS[n.type] ?? Bell;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onOpen(n)}
                        className={cn(
                          'group relative flex w-full items-start gap-3.5 overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5',
                          n.isRead
                            ? 'border-transparent bg-white/50 hover:border-maison-line hover:bg-white hover:shadow-[0_14px_30px_-16px_rgba(33,28,22,0.4)] dark:bg-maison-panel/40'
                            : 'border-maison-clay/20 bg-white shadow-[0_10px_28px_-18px_rgba(199,91,57,0.45)] hover:shadow-[0_16px_36px_-16px_rgba(199,91,57,0.55)] dark:bg-maison-panel',
                        )}
                      >
                        {!n.isRead && (
                          <span
                            className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-maison-clay"
                            aria-hidden
                          />
                        )}
                        <span
                          className={cn(
                            'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 transition-colors',
                            n.isRead
                              ? 'bg-maison-line/70 text-maison-muted ring-transparent'
                              : 'bg-maison-clay/12 text-maison-clay-dark ring-maison-clay/20',
                          )}
                        >
                          <Icon className="h-[17px] w-[17px]" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                'truncate text-[14px]',
                                n.isRead
                                  ? 'font-medium text-maison-muted'
                                  : 'font-semibold text-maison-ink',
                              )}
                            >
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full bg-maison-clay shadow-[0_0_0_3px_rgba(199,91,57,0.15)]"
                                aria-hidden
                              />
                            )}
                          </span>
                          <span className="mt-1 block whitespace-normal text-[12.5px] leading-snug text-maison-subtle">
                            {n.message}
                          </span>
                          <span className="mt-1.5 block text-[11px] font-medium uppercase tracking-[0.4px] text-maison-faint">
                            {timeAgo(n.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {unreadCount > 0 && (
            <div className="shrink-0 border-t border-maison-line bg-white/70 px-4 py-3.5 backdrop-blur dark:bg-maison-panel/70">
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-maison-ink py-3 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-maison-ink/90 hover:shadow-[0_14px_28px_-14px_rgba(33,28,22,0.6)]"
              >
                <CheckCheck className="h-4 w-4" aria-hidden />
                Mark all as read
              </button>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
