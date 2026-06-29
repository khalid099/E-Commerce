import { OrderStatus, ORDER_STATUS_TRANSITIONS } from '@ecommerce/shared-types';

/**
 * Admin order-status presentation, mirroring the Maison admin design.
 * `fg`/`bg` style the pill; `dot` is the solid swatch used in the dashboard
 * donut + legend and the order stepper.
 */
export interface StatusMeta {
  label: string;
  fg: string;
  bg: string;
  dot: string;
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  [OrderStatus.PENDING]: { label: 'Pending', fg: '#6C6358', bg: '#ECE6DC', dot: '#B6AC99' },
  [OrderStatus.PROCESSING]: { label: 'Processing', fg: '#9A6B1A', bg: '#FCEED2', dot: '#E0A03A' },
  [OrderStatus.SHIPPED]: { label: 'Shipped', fg: '#1A5A9A', bg: '#DCEAF6', dot: '#4A89C9' },
  [OrderStatus.DELIVERED]: { label: 'Delivered', fg: '#3F7A52', bg: '#E2F0E6', dot: '#5BA46F' },
  [OrderStatus.CANCELLED]: { label: 'Cancelled', fg: '#B23B3B', bg: '#F6E1E1', dot: '#D06A6A' },
};

/** Human label for a status, e.g. PENDING → "Pending". */
export function formatStatus(status: OrderStatus): string {
  return STATUS_META[status].label;
}

/** The linear fulfilment path used by the stepper (cancellation is off-path). */
export const FULFILMENT_STEPS: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

/** Allowed next states for a status — mirrors the backend transition table. */
export function nextStatuses(status: OrderStatus): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[status] ?? [];
}
