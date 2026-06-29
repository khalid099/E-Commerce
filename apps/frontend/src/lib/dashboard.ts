import api from '@/lib/api';
import type { ApiResponse, DashboardStats } from '@ecommerce/shared-types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
  return res.data.data;
}
