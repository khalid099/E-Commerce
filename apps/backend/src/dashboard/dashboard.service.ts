import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User, UserRole } from '../users/entities/user.entity';
import type { DashboardStats } from '@ecommerce/shared-types';

// Number of trailing calendar months included in the revenue trend chart.
const REVENUE_TREND_MONTHS = 6;
// Number of best-selling products surfaced.
const TOP_PRODUCTS_LIMIT = 5;

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Revenue, top sellers and the trend exclude CANCELLED orders — cancelled
  // orders never produced realised sales. Counts (totalOrders, ordersByStatus)
  // include every order so the operational picture stays complete.
  async getStats(): Promise<DashboardStats> {
    const [
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      ordersByStatus,
      topProducts,
      revenueByMonth,
    ] = await Promise.all([
      this.getTotalRevenue(),
      this.orderRepo.count(),
      this.productRepo.count(),
      this.userRepo.count({ where: { role: UserRole.CUSTOMER } }),
      this.getOrdersByStatus(),
      this.getTopProducts(),
      this.getRevenueByMonth(),
    ]);

    // AOV is over realised orders only — cancelled orders never produced a sale.
    const realisedOrders = totalOrders - (ordersByStatus[OrderStatus.CANCELLED] ?? 0);
    const averageOrderValue =
      realisedOrders > 0 ? Math.round((totalRevenue / realisedOrders) * 100) / 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      averageOrderValue,
      ordersByStatus,
      topProducts,
      revenueByMonth,
    };
  }

  private async getTotalRevenue(): Promise<number> {
    const row = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total), 0)', 'revenue')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .getRawOne<{ revenue: string }>();

    return Math.round(Number(row?.revenue ?? 0) * 100) / 100;
  }

  private async getOrdersByStatus(): Promise<Record<string, number>> {
    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.status')
      .getRawMany<{ status: OrderStatus; count: string }>();

    // Seed every status with 0 so the response is stable regardless of data.
    const result: Record<string, number> = {};
    for (const status of Object.values(OrderStatus)) {
      result[status] = 0;
    }
    for (const row of rows) {
      result[row.status] = Number(row.count);
    }
    return result;
  }

  private async getTopProducts(): Promise<DashboardStats['topProducts']> {
    // LEFT JOIN the product so a since-removed product still reports its sales,
    // just without a live image/category.
    const rows = await this.orderItemRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      // OrderItem has no Product relation (it snapshots name/price), so join by id.
      // product_id is a plain varchar column while products.id is uuid — cast to match.
      .leftJoin(Product, 'p', 'p.id = oi.product_id::uuid')
      .leftJoin('p.category', 'c')
      .select('oi.productId', 'productId')
      .addSelect('oi.productName', 'productName')
      .addSelect('SUM(oi.quantity)', 'unitsSold')
      .addSelect('SUM(oi.lineTotal)', 'revenue')
      .addSelect('p.imageUrl', 'imageUrl')
      .addSelect('c.name', 'categoryName')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('oi.productId')
      .addGroupBy('oi.productName')
      .addGroupBy('p.imageUrl')
      .addGroupBy('c.name')
      .orderBy('SUM(oi.quantity)', 'DESC')
      .limit(TOP_PRODUCTS_LIMIT)
      .getRawMany<{
        productId: string;
        productName: string;
        unitsSold: string;
        revenue: string;
        imageUrl: string | null;
        categoryName: string | null;
      }>();

    return rows.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      unitsSold: Number(row.unitsSold),
      revenue: Math.round(Number(row.revenue) * 100) / 100,
      imageUrl: row.imageUrl ?? null,
      categoryName: row.categoryName ?? null,
    }));
  }

  private async getRevenueByMonth(): Promise<DashboardStats['revenueByMonth']> {
    // Inclusive window: first day of the month REVENUE_TREND_MONTHS - 1 months ago.
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(1);
    since.setMonth(since.getMonth() - (REVENUE_TREND_MONTHS - 1));

    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select("TO_CHAR(o.createdAt, 'YYYY-MM')", 'month')
      .addSelect('SUM(o.total)', 'revenue')
      .addSelect('COUNT(*)', 'orders')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('o.createdAt >= :since', { since })
      .groupBy("TO_CHAR(o.createdAt, 'YYYY-MM')")
      .getRawMany<{ month: string; revenue: string; orders: string }>();

    const byMonth = new Map(rows.map((r) => [r.month, r]));

    // Emit a continuous 6-month series so the chart has no gaps on quiet months.
    const series: DashboardStats['revenueByMonth'] = [];
    for (let i = 0; i < REVENUE_TREND_MONTHS; i++) {
      const d = new Date(since);
      d.setMonth(since.getMonth() + i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const match = byMonth.get(month);
      series.push({
        month,
        label: MONTH_LABELS[d.getMonth()],
        revenue: match ? Math.round(Number(match.revenue) * 100) / 100 : 0,
        orders: match ? Number(match.orders) : 0,
      });
    }
    return series;
  }
}
