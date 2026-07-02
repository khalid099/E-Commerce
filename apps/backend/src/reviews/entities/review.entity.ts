import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

// One review per customer per product — enforced at the DB level so a race
// between two concurrent submissions can't create a duplicate.
@Entity('reviews')
@Unique('UQ_review_user_product', ['userId', 'productId'])
@Index(['productId', 'createdAt'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column('int')
  rating: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  // Snapshot of the reviewer's display name at creation time. Keeps the public
  // list endpoint join-free and never leaks the reviewer's email.
  @Column({ name: 'author_name' })
  authorName: string;

  // Snapshotted at creation — whether the reviewer had actually bought the
  // product. Drives the "Verified purchase" badge; not recomputed on edits.
  @Column({ name: 'verified_purchase', default: false })
  verifiedPurchase: boolean;

  // The store's public response to this review, set by an admin. Shown beneath
  // the review on the product page.
  @Column({ type: 'text', nullable: true })
  reply: string | null;

  @Column({ name: 'replied_at', type: 'timestamp', nullable: true })
  repliedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
