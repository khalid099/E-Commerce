import api from '@/lib/api';
import type {
  Product,
  Category,
  CreateProductDto,
  UpdateProductDto,
  PaginatedResponse,
  ApiResponse,
} from '@ecommerce/shared-types';

export interface AdminProductQuery {
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export async function listAdminProducts(
  query: AdminProductQuery,
): Promise<PaginatedResponse<Product>> {
  const res = await api.get<ApiResponse<PaginatedResponse<Product>>>('/admin/products', {
    params: query,
  });
  return res.data.data;
}

export async function getAdminProduct(id: string): Promise<Product> {
  const res = await api.get<ApiResponse<Product>>(`/admin/products/${id}`);
  return res.data.data;
}

export async function createProduct(dto: CreateProductDto): Promise<Product> {
  const res = await api.post<ApiResponse<Product>>('/admin/products', dto);
  return res.data.data;
}

export async function updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}`, dto);
  return res.data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/admin/products/${id}`);
}

export async function uploadProductImage(id: string, file: File): Promise<Product> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<ApiResponse<Product>>(`/admin/products/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function listCategories(): Promise<Category[]> {
  const res = await api.get<ApiResponse<Category[]>>('/categories');
  return res.data.data;
}
