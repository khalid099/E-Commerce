export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
  isActive: boolean;
  category: Category;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export type SortBy = 'price_asc' | 'price_desc' | 'newest';

export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: SortBy;
  page?: number;
  limit?: number;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  imageUrl?: string;
}

export type UpdateProductDto = Partial<CreateProductDto> & { isActive?: boolean };
