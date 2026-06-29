import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { WishlistItem as WishlistItemResponse } from '@ecommerce/shared-types';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepo: Repository<WishlistItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getWishlist(userId: string): Promise<WishlistItemResponse[]> {
    const items = await this.wishlistRepo.find({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
    return items.map((item) => this.mapItem(item));
  }

  // Add is idempotent: re-adding an already-wishlisted product is a no-op, so a
  // double-tap of the heart never errors. Returns the full, current wishlist.
  async addItem(userId: string, dto: AddToWishlistDto): Promise<WishlistItemResponse[]> {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, isActive: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.wishlistRepo.findOne({
      where: { userId, productId: dto.productId },
    });
    if (!existing) {
      await this.wishlistRepo.save(
        this.wishlistRepo.create({ userId, productId: dto.productId }),
      );
    }

    return this.getWishlist(userId);
  }

  async removeItem(userId: string, productId: string): Promise<WishlistItemResponse[]> {
    const existing = await this.wishlistRepo.findOne({ where: { userId, productId } });
    if (!existing) throw new NotFoundException('Wishlist item not found');

    await this.wishlistRepo.remove(existing);
    return this.getWishlist(userId);
  }

  private mapItem(item: WishlistItem): WishlistItemResponse {
    return {
      id: item.id,
      productId: item.productId,
      // Entity Date columns vs string in the shared shape — same cast the cart mapper uses.
      product: item.product as unknown as WishlistItemResponse['product'],
      createdAt: item.createdAt.toISOString(),
    };
  }
}
