import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import type {
  Review as ReviewResponse,
  ReviewSummary,
  PaginatedResponse,
} from '@ecommerce/shared-types';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  private mapReview(review: Review): ReviewResponse {
    return {
      id: review.id,
      productId: review.productId,
      authorName: review.authorName,
      rating: review.rating,
      title: review.title ?? null,
      comment: review.comment ?? null,
      verifiedPurchase: review.verifiedPurchase,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }

  async listByProduct(
    productId: string,
    query: QueryReviewDto,
  ): Promise<PaginatedResponse<ReviewResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { productId },
      // Verified purchases first, then most recent — the professional default.
      order: { verifiedPurchase: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    return {
      data: reviews.map((r) => this.mapReview(r)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getSummary(productId: string): Promise<ReviewSummary> {
    const rows = await this.reviewRepo
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.productId = :productId', { productId })
      .groupBy('review.rating')
      .getRawMany<{ rating: number; count: string }>();

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let count = 0;
    let weighted = 0;
    for (const row of rows) {
      const star = Number(row.rating);
      const n = Number(row.count);
      distribution[star] = n;
      count += n;
      weighted += star * n;
    }

    const average = count > 0 ? Math.round((weighted / count) * 10) / 10 : 0;
    return { average, count, distribution };
  }

  async getMine(userId: string, productId: string): Promise<ReviewResponse | null> {
    const review = await this.reviewRepo.findOne({
      where: { userId, productId },
    });
    return review ? this.mapReview(review) : null;
  }

  async create(user: User, productId: string, dto: CreateReviewDto): Promise<ReviewResponse> {
    await this.assertProductExists(productId);

    const existing = await this.reviewRepo.findOne({
      where: { userId: user.id, productId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    const verifiedPurchase = await this.hasPurchased(user.id, productId);
    const authorName = this.displayName(user);

    return this.dataSource.transaction(async (manager) => {
      const review = manager.create(Review, {
        userId: user.id,
        productId,
        rating: dto.rating,
        title: dto.title ?? null,
        comment: dto.comment ?? null,
        authorName,
        verifiedPurchase,
      });
      const saved = await manager.save(Review, review);
      await this.recomputeProductRating(manager, productId);
      return this.mapReview(saved);
    });
  }

  async updateMine(
    userId: string,
    productId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponse> {
    return this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(Review, {
        where: { userId, productId },
      });
      if (!review) throw new NotFoundException('Review not found');

      if (dto.rating !== undefined) review.rating = dto.rating;
      if (dto.title !== undefined) review.title = dto.title || null;
      if (dto.comment !== undefined) review.comment = dto.comment || null;

      const saved = await manager.save(Review, review);
      await this.recomputeProductRating(manager, productId);
      return this.mapReview(saved);
    });
  }

  async deleteMine(userId: string, productId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.delete(Review, { userId, productId });
      if (result.affected === 0) throw new NotFoundException('Review not found');
      await this.recomputeProductRating(manager, productId);
    });
  }

  /**
   * Recompute the denormalized rating cache on the product from its reviews.
   * `product.rating`/`reviewCount` are a read-optimized cache so list/detail
   * endpoints never aggregate per product; this is the only writer.
   */
  private async recomputeProductRating(manager: EntityManager, productId: string): Promise<void> {
    const { avg, count } = await manager
      .createQueryBuilder(Review, 'review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('review.productId = :productId', { productId })
      .getRawOne<{ avg: string | null; count: string }>();

    const reviewCount = Number(count);
    await manager.update(
      Product,
      { id: productId },
      {
        rating: reviewCount > 0 ? Math.round(Number(avg) * 100) / 100 : null,
        reviewCount,
      },
    );
  }

  /** A reviewer counts as verified when they have a non-cancelled order line for this product. */
  private async hasPurchased(userId: string, productId: string): Promise<boolean> {
    const count = await this.reviewRepo.manager
      .getRepository(OrderItem)
      .createQueryBuilder('item')
      .innerJoin(Order, 'ord', 'ord.id = item.orderId')
      .where('item.productId = :productId', { productId })
      .andWhere('ord.userId = :userId', { userId })
      .andWhere('ord.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .getCount();
    return count > 0;
  }

  private displayName(user: User): string {
    const lastInitial = user.lastName ? ` ${user.lastName.charAt(0)}.` : '';
    return `${user.firstName}${lastInitial}`.trim();
  }

  private async assertProductExists(productId: string): Promise<void> {
    const exists = await this.productRepo.countBy({ id: productId });
    if (exists === 0) throw new NotFoundException(`Product ${productId} not found`);
  }
}
