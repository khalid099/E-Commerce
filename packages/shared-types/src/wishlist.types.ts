import type { Product } from './product.types';

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export interface AddToWishlistDto {
  productId: string;
}
