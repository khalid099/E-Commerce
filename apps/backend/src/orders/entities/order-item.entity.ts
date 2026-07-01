import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'product_name' })
  productName: string;

  // Image snapshot — frozen at order time so historical orders never dereference
  // the live product (which may be re-imaged or deleted later).
  @Column({ name: 'product_image_url', type: 'text', nullable: true })
  productImageUrl: string | null;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'int' })
  quantity: number;

  // Variant snapshot — frozen at order time, never dereferenced from the live product.
  @Column({ name: 'selected_color', type: 'varchar', length: 60, nullable: true })
  selectedColor: string | null;

  @Column({ name: 'selected_size', type: 'varchar', length: 30, nullable: true })
  selectedSize: string | null;

  @Column({ name: 'line_total', type: 'decimal', precision: 10, scale: 2 })
  lineTotal: number;
}
