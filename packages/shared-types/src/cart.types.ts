import type { Product } from './product.types';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  quantity: number;
  /** Chosen colour swatch name; null when the product has no colours. */
  selectedColor: string | null;
  /** Chosen size; null when the product has no sizes. */
  selectedSize: string | null;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartDto {
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface UpdateCartItemDto {
  quantity: number;
}
