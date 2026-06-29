import api from '@/lib/api';
import type {
  Order,
  OrderStatus,
  PaginatedResponse,
  ApiResponse,
} from '@ecommerce/shared-types';

export interface AdminOrderQuery {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export async function listAdminOrders(
  query: AdminOrderQuery,
): Promise<PaginatedResponse<Order>> {
  const res = await api.get<ApiResponse<PaginatedResponse<Order>>>('/admin/orders', {
    params: query,
  });
  return res.data.data;
}

export async function getAdminOrder(id: string): Promise<Order> {
  const res = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
  return res.data.data;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const res = await api.patch<ApiResponse<Order>>(`/admin/orders/${id}/status`, { status });
  return res.data.data;
}
