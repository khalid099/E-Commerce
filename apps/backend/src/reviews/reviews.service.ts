import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, SelectQueryBuilder } from 'typeorm';
import type {
  Review as ReviewResponse,
  AdminReview as AdminReviewResponse,
  MyReview as MyReviewResponse,
  ReviewSummary,
  ReviewEligibility,
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
import { QueryAdminReviewDto } from './dto/query-admin-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
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
      reply: review.reply ?? null,
      repliedAt: review.repliedAt ? review.repliedAt.toISOString() : null,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }

  private mapAdminReview(review: Review): AdminReviewResponse {
    return { ...this.mapReview(review), productName: review.product?.name ?? '—' };
  }

  private mapMyReview(review: Review): MyReviewResponse {
    return {
      ...this.mapReview(review),
      productName: review.product?.name ?? '—',
      productImageUrl: review.product?.imageUrl ?? null,
      // The product has no dedicated slug column — its id is the routable identifier.
      productSlug: review.productId,
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

  /** [Admin] Every review across the catalogue, newest first, optionally filtered by rating. */
  async listAllForAdmin(query: QueryAdminReviewDto): Promise<PaginatedResponse<AdminReviewResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.reviewRepo
      .createQueryBuilder('review')
      // Join only the product columns we render — avoid pulling the whole product row.
      .leftJoin('review.product', 'product')
      .addSelect(['product.id', 'product.name'])
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.rating) {
      qb.andWhere('review.rating = :rating', { rating: query.rating });
    }

    const [reviews, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data: reviews.map((r) => this.mapAdminReview(r)),
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

  /** Every review the current customer has written, across all products, newest first. */
  async listMine(
    userId: string,
    query: QueryReviewDto,
  ): Promise<PaginatedResponse<MyReviewResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [reviews, total] = await this.reviewRepo
      .createQueryBuilder('review')
      .leftJoin('review.product', 'product')
      .addSelect(['product.id', 'product.name', 'product.imageUrl'])
      .where('review.userId = :userId', { userId })
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    return {
      data: reviews.map((r) => this.mapMyReview(r)),
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

  /** [Admin] Set or update the store's public reply to a review. */
  async setReply(id: string, dto: ReplyReviewDto): Promise<AdminReviewResponse> {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: { product: true },
    });
    if (!review) throw new NotFoundException('Review not found');

    review.reply = dto.reply.trim();
    review.repliedAt = new Date();
    const saved = await this.reviewRepo.save(review);

    // Let the reviewer know the store responded — best-effort, never blocks the reply.
    try {
      await this.notificationsService.create({
        userId: saved.userId,
        type: NotificationType.REVIEW_REPLY,
        title: 'The store replied to your review',
        message: `${saved.product?.name ?? 'A product'} — the store responded to your review.`,
        metadata: { productId: saved.productId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to notify review reply for review ${saved.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return this.mapAdminReview(saved);
  }

  /** [Admin] Remove the store's reply from a review. */
  async clearReply(id: string): Promise<void> {
    const result = await this.reviewRepo.update({ id }, { reply: null, repliedAt: null });
    if (result.affected === 0) throw new NotFoundException('Review not found');
  }

  /** [Admin] Remove a review and refresh the product's cached rating. */
  async deleteByIdForAdmin(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(Review, { where: { id } });
      if (!review) throw new NotFoundException('Review not found');
      await manager.delete(Review, { id });
      await this.recomputeProductRating(manager, review.productId);
    });
  }

  async getSummary(productId: string): Promise<ReviewSummary> {
    return this.aggregateRatings((qb) =>
      qb.where('review.productId = :productId', { productId }),
    );
  }

  /** [Admin] Rating summary across the whole catalogue, driving the feedback header. */
  async getAdminSummary(): Promise<ReviewSummary> {
    return this.aggregateRatings();
  }

  /** Shared rating rollup: counts per star, total and mean, over an optional scope. */
  private async aggregateRatings(
    scope?: (qb: SelectQueryBuilder<Review>) => SelectQueryBuilder<Review>,
  ): Promise<ReviewSummary> {
    let qb = this.reviewRepo
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .groupBy('review.rating');
    if (scope) qb = scope(qb);

    const rows = await qb.getRawMany<{ rating: number; count: string }>();

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

  /** Whether the customer is allowed to review — only after an order for this product is delivered. */
  async getEligibility(userId: string, productId: string): Promise<ReviewEligibility> {
    return { canReview: await this.hasDeliveredPurchase(userId, productId) };
  }

  async create(user: User, productId: string, dto: CreateReviewDto): Promise<ReviewResponse> {
    await this.assertProductExists(productId);

    // Reviews are earned: only a customer whose order for this product has been
    // delivered may review it. This also makes every review a verified purchase.
    const verifiedPurchase = await this.hasDeliveredPurchase(user.id, productId);
    if (!verifiedPurchase) {
      throw new ForbiddenException(
        'You can review this product only after your order for it has been delivered',
      );
    }

    const existing = await this.reviewRepo.findOne({
      where: { userId: user.id, productId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

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

  /** A customer may review, and counts as verified, only once an order for this product is delivered. */
  private async hasDeliveredPurchase(userId: string, productId: string): Promise<boolean> {
    const count = await this.reviewRepo.manager
      .getRepository(OrderItem)
      .createQueryBuilder('item')
      .innerJoin(Order, 'ord', 'ord.id = item.orderId')
      .where('item.productId = :productId', { productId })
      .andWhere('ord.userId = :userId', { userId })
      .andWhere('ord.status = :delivered', { delivered: OrderStatus.DELIVERED })
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
