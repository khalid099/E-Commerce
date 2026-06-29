export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** Hero image for the collection card; null falls back to the tonal placeholder. */
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Original price for sale display; null when not on sale. */
  compareAtPrice: number | null;
  imageUrl: string | null;
  /** Average rating 0–5; null when unrated. */
  rating: number | null;
  reviewCount: number;
  /** Selectable colour swatches (presentational). */
  colors: ProductColor[] | null;
  /** Selectable sizes (presentational). */
  sizes: string[] | null;
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
  compareAtPrice?: number;
  stockQuantity: number;
  categoryId: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  colors?: ProductColor[];
  sizes?: string[];
}

export type UpdateProductDto = Partial<CreateProductDto> & { isActive?: boolean };
