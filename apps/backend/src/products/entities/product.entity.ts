import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import type { ProductColor } from '@ecommerce/shared-types';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // Optional "was" price for sale display. When set and greater than price the
  // storefront shows a strikethrough + Sale badge. numeric → string from TypeORM.
  @Column({ name: 'compare_at_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  compareAtPrice: number | null;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string | null;

  // Average customer rating (0–5) and review count, surfaced on cards and detail.
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number | null;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  // Selectable variants shown on the product detail page. Presentational — the
  // cart/order line is keyed by product, not variant.
  @Column({ type: 'jsonb', nullable: true })
  colors: ProductColor[] | null;

  @Column({ type: 'jsonb', nullable: true })
  sizes: string[] | null;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Marks a product as a new arrival — surfaces the NEW badge and populates the
  // New Arrivals view. Kept distinct from a sale item; the two are mutually exclusive.
  @Column({ name: 'is_new', default: false })
  isNew: boolean;

  @ManyToOne(() => Category, (category) => category.products, { eager: false })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id' })
  categoryId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
