import { OrderStatus } from '@ecommerce/shared-types';
import { cn } from '@/lib/utils';

const STYLES: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-[#FCEED2] text-[#9A6B1A]',
  [OrderStatus.PROCESSING]: 'bg-[#E7EEF6] text-[#3A6EA5]',
  [OrderStatus.SHIPPED]: 'bg-[#EAE6F6] text-[#5B4B8A]',
  [OrderStatus.DELIVERED]: 'bg-maison-leaf-soft text-maison-leaf',
  [OrderStatus.CANCELLED]: 'bg-[#F6E8E4] text-maison-clay-dark',
};

/** Color-coded order status pill, shared by the order list and detail views. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[12.5px] font-semibold',
        STYLES[status],
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
