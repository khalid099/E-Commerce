/**
 * One-time backfill — populates order_items.product_image_url for orders created
 * before the image snapshot was added. Copies the current product image so
 * historical orders render their thumbnails. Idempotent: only touches rows where
 * the snapshot is still null.
 *
 * Run: `npx ts-node -r tsconfig-paths/register src/database/seeds/backfill-order-images.ts`
 */
import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

loadEnv();

async function backfill() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'ecommerce_db',
    entities: [User, Category, Product, Cart, CartItem, Order, OrderItem],
  });

  await dataSource.initialize();
  const result = await dataSource.query(`
    UPDATE order_items oi
    SET product_image_url = p.image_url
    FROM products p
    WHERE oi.product_id = p.id::text
      AND oi.product_image_url IS NULL
  `);
  const affected = Array.isArray(result) ? result[1] : result;
  console.log(`Backfilled product_image_url on ${affected ?? 0} order item(s).`);
  await dataSource.destroy();
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
