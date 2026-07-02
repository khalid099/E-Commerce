import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController, MyReviewsController, AdminReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Product, OrderItem, Order]), NotificationsModule],
  controllers: [ReviewsController, MyReviewsController, AdminReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
