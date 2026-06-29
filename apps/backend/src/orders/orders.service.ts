import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import type {
  Order as OrderResponse,
  PaginatedResponse,
} from '@ecommerce/shared-types';

const TAX_RATE = 0.1; // 10%

// Order lifecycle: each status may only advance to an allowed next state.
// Empty array = terminal state.
const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  private mapOrder(order: Order): OrderResponse {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status as unknown as OrderResponse['status'],
      items: (order.items ?? []).map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        selectedColor: item.selectedColor ?? null,
        selectedSize: item.selectedSize ?? null,
        lineTotal: Number(item.lineTotal),
      })),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      shippingAddress: order.shippingAddress,
      stripePaymentIntentId: order.stripePaymentIntentId,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      // `user` relation is loaded only on admin endpoints.
      customer: order.user
        ? {
            id: order.user.id,
            email: order.user.email,
            firstName: order.user.firstName,
            lastName: order.user.lastName,
          }
        : undefined,
    };
  }

  async createOrder(userId: string, dto: CreateOrderDto): Promise<OrderResponse> {
    const cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    return this.dataSource.transaction(async (manager) => {
      // Atomic stock decrement for each item — fail fast on insufficient stock
      for (const cartItem of cart.items) {
        const result = await manager
          .createQueryBuilder()
          .update(Product)
          .set({ stockQuantity: () => `stock_quantity - ${cartItem.quantity}` })
          .where('id = :id AND stock_quantity >= :qty', {
            id: cartItem.productId,
            qty: cartItem.quantity,
          })
          .execute();

        if (result.affected === 0) {
          throw new ConflictException(
            `Insufficient stock for "${cartItem.product.name}"`,
          );
        }
      }

      // Compute totals server-side from current product prices (price snapshot)
      const subtotal = cart.items.reduce(
        (sum, i) => sum + Number(i.product.price) * i.quantity,
        0,
      );
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      // Create order
      const order = manager.create(Order, {
        userId,
        status: OrderStatus.PENDING,
        subtotal,
        tax,
        shippingCost: 0,
        total,
        shippingAddress: dto.shippingAddress,
        stripePaymentIntentId: dto.paymentIntentId ?? null,
      });
      const savedOrder = await manager.save(Order, order);

      // Snapshot each line item
      const orderItems = cart.items.map((cartItem) =>
        manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: cartItem.productId,
          productName: cartItem.product.name,
          unitPrice: Number(cartItem.product.price),
          quantity: cartItem.quantity,
          selectedColor: cartItem.selectedColor ?? null,
          selectedSize: cartItem.selectedSize ?? null,
          lineTotal: Math.round(Number(cartItem.product.price) * cartItem.quantity * 100) / 100,
        }),
      );
      savedOrder.items = await manager.save(OrderItem, orderItems);

      // Clear the cart
      await manager.delete(CartItem, { cartId: cart.id });

      return this.mapOrder(savedOrder);
    });
  }

  async findUserOrders(
    userId: string,
    query: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Record<string, unknown> = { userId };
    if (query.status) where['status'] = query.status;

    const [orders, total] = await this.orderRepo.findAndCount({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    return {
      data: orders.map((o) => this.mapOrder(o)),
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

  async findUserOrder(userId: string, orderId: string): Promise<OrderResponse> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Order not found');

    return this.mapOrder(order);
  }

  async findAllOrders(
    query: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Record<string, unknown> = {};
    if (query.status) where['status'] = query.status;

    const [orders, total] = await this.orderRepo.findAndCount({
      where,
      relations: ['items', 'user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    return {
      data: orders.map((o) => this.mapOrder(o)),
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

  async findAdminOrder(orderId: string): Promise<OrderResponse> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'user'],
    });

    if (!order) throw new NotFoundException('Order not found');

    return this.mapOrder(order);
  }

  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponse> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'user'],
    });

    if (!order) throw new NotFoundException('Order not found');

    // Enforce the order lifecycle: a status may only move to an allowed next state.
    if (order.status !== dto.status) {
      const allowed = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot change order status from ${order.status} to ${dto.status}`,
        );
      }
      order.status = dto.status;
      await this.orderRepo.save(order);
    }

    return this.mapOrder(order);
  }
}
