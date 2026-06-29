import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User, UserRole } from '../users/entities/user.entity';
import type { DashboardStats } from '@ecommerce/shared-types';

// Number of trailing days included in the revenue trend chart.
const REVENUE_TREND_DAYS = 14;
// Number of best-selling products surfaced.
const TOP_PRODUCTS_LIMIT = 5;

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
      revenueByDay,
    ] = await Promise.all([
      this.getTotalRevenue(),
      this.orderRepo.count(),
      this.productRepo.count(),
      this.userRepo.count({ where: { role: UserRole.CUSTOMER } }),
      this.getOrdersByStatus(),
      this.getTopProducts(),
      this.getRevenueByDay(),
    ]);

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      ordersByStatus,
      topProducts,
      revenueByDay,
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
    const rows = await this.orderItemRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .select('oi.productId', 'productId')
      .addSelect('oi.productName', 'productName')
      .addSelect('SUM(oi.quantity)', 'unitsSold')
      .addSelect('SUM(oi.lineTotal)', 'revenue')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('oi.productId')
      .addGroupBy('oi.productName')
      .orderBy('SUM(oi.quantity)', 'DESC')
      .limit(TOP_PRODUCTS_LIMIT)
      .getRawMany<{
        productId: string;
        productName: string;
        unitsSold: string;
        revenue: string;
      }>();

    return rows.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      unitsSold: Number(row.unitsSold),
      revenue: Math.round(Number(row.revenue) * 100) / 100,
    }));
  }

  private async getRevenueByDay(): Promise<DashboardStats['revenueByDay']> {
    // Inclusive window: today back through REVENUE_TREND_DAYS - 1 days.
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (REVENUE_TREND_DAYS - 1));

    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select("TO_CHAR(o.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(o.total)', 'revenue')
      .addSelect('COUNT(*)', 'orders')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('o.createdAt >= :since', { since })
      .groupBy("TO_CHAR(o.createdAt, 'YYYY-MM-DD')")
      .getRawMany<{ date: string; revenue: string; orders: string }>();

    const byDate = new Map(rows.map((r) => [r.date, r]));

    // Emit a continuous series so the chart has no gaps on quiet days.
    // Build keys from local date parts (not toISOString, which is UTC and would
    // shift the window by a day in non-UTC timezones) to match TO_CHAR output.
    const series: DashboardStats['revenueByDay'] = [];
    for (let i = 0; i < REVENUE_TREND_DAYS; i++) {
      const day = new Date(since);
      day.setDate(since.getDate() + i);
      const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const match = byDate.get(date);
      series.push({
        date,
        revenue: match ? Math.round(Number(match.revenue) * 100) / 100 : 0,
        orders: match ? Number(match.orders) : 0,
      });
    }
    return series;
  }
}
