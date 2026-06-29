import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
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
    const items = (cart.items ?? []).map((item) => ({
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      product: item.product,
      quantity: item.quantity,
      selectedColor: item.selectedColor ?? null,
      selectedSize: item.selectedSize ?? null,
      lineTotal: Number(item.product.price) * item.quantity,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return {
      id: cart.id,
      userId: cart.userId,
      items: items as unknown as CartItemResponse[],
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

    // A product that offers variants must be added with a valid choice — the
    // client selector is convenience only; this is the authoritative check.
    const selectedColor = this.resolveVariant(
      product.colors?.map((c) => c.name) ?? null,
      dto.selectedColor,
      'colour',
    );
    const selectedSize = this.resolveVariant(product.sizes ?? null, dto.selectedSize, 'size');

    // Same product in a different colour/size is a distinct line, not a merge.
    const existingItem = cart.items.find(
      (i) =>
        i.productId === dto.productId &&
        (i.selectedColor ?? null) === selectedColor &&
        (i.selectedSize ?? null) === selectedSize,
    );
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
        selectedColor,
        selectedSize,
      });
      await this.cartItemRepo.save(item);
    }

    return this.getCart(userId);
  }

  // Validates a chosen variant against the options the product actually offers.
  // Returns the chosen value, or null when the product has no such variant axis.
  private resolveVariant(
    options: string[] | null,
    chosen: string | undefined,
    label: string,
  ): string | null {
    if (!options || options.length === 0) return null;
    if (!chosen || !options.includes(chosen)) {
      throw new BadRequestException(`Please select a valid ${label}`);
    }
    return chosen;
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
