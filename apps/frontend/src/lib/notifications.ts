import api from '@/lib/api';
import type {
  Notification,
  PaginatedResponse,
  ApiResponse,
} from '@ecommerce/shared-types';

export async function listNotifications(
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<Notification>> {
  const res = await api.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', {
    params: { page, limit },
  });
  return res.data.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
  return res.data.data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
