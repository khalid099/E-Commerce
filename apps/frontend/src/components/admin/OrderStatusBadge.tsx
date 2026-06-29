import { OrderStatus } from '@ecommerce/shared-types';

const STATUS_STYLES: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:    'bg-yellow-100 text-yellow-800',
  [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
  [OrderStatus.SHIPPED]:    'bg-indigo-100 text-indigo-800',
  [OrderStatus.DELIVERED]:  'bg-green-100 text-green-800',
  [OrderStatus.CANCELLED]:  'bg-red-100 text-red-800',
};

export function formatStatus(status: OrderStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}
