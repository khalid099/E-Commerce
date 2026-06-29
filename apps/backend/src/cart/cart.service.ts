import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Cart as CartResponse, CartItem as CartItemResponse } from '@ecommerce/shared-types';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  private async findOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product', 'items.product.category'],
    });
    if (!cart) {
      cart = this.cartRepo.create({ userId });
      await this.cartRepo.save(cart);
      cart.items = [];
    }
    return cart;
  }

  private mapCart(cart: Cart): CartResponse {
    const items: CartItemResponse[] = (cart.items ?? []).map((item) => ({
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      product: item.product,
      quantity: item.quantity,
      lineTotal: Number(item.product.price) * item.quantity,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt.toISOString(),
    };
  }

  async getCart(userId: string): Promise<CartResponse> {
    const cart = await this.findOrCreateCart(userId);
    return this.mapCart(cart);
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartResponse> {
    const cart = await this.findOrCreateCart(userId);

    const product = await this.productRepo.findOne({
      where: { id: dto.productId, isActive: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existingItem = cart.items.find((i) => i.productId === dto.productId);
    const newQty = (existingItem?.quantity ?? 0) + dto.quantity;

    if (product.stockQuantity < newQty) {
      throw new ConflictException('Insufficient stock');
    }

    if (existingItem) {
      existingItem.quantity = newQty;
      await this.cartItemRepo.save(existingItem);
    } else {
      const item = this.cartItemRepo.create({
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      });
      await this.cartItemRepo.save(item);
    }

    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    const cart = await this.findOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found');

    if (item.product.stockQuantity < dto.quantity) {
      throw new ConflictException('Insufficient stock');
    }

    item.quantity = dto.quantity;
    await this.cartItemRepo.save(item);

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponse> {
    const cart = await this.findOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found');

    await this.cartItemRepo.remove(item);

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CartResponse> {
    const cart = await this.findOrCreateCart(userId);
    if (cart.items.length > 0) {
      await this.cartItemRepo.remove(cart.items);
    }
    cart.items = [];
    return this.mapCart(cart);
  }
}
