export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  /** Snapshot of the colour chosen at order time; null when none. */
  selectedColor: string | null;
  /** Snapshot of the size chosen at order time; null when none. */
  selectedSize: string | null;
  lineTotal: number;
}

export interface OrderCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  shippingAddress: ShippingAddress;
  stripePaymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Populated on admin endpoints only — who placed the order. */
  customer?: OrderCustomer;
}

/** Valid status transitions for the order lifecycle. Empty array = terminal state. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export interface CreateOrderDto {
  shippingAddress: ShippingAddress;
  paymentIntentId: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}
