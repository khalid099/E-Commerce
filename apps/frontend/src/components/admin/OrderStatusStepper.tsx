import { Check } from 'lucide-react';
import type { OrderStatus } from '@ecommerce/shared-types';
import { FULFILMENT_STEPS, STATUS_META } from '@/lib/orderStatus';
import { cn } from '@/lib/utils';

/** Horizontal fulfilment progress (Pending → Delivered). Caller handles cancelled orders. */
export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  const currentIndex = FULFILMENT_STEPS.indexOf(status);

  return (
    <div className="flex items-start">
      {FULFILMENT_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <div
                className="absolute top-[15px] left-[-50%] right-[50%] h-[3px]"
                style={{ background: done ? '#C75B39' : '#EBE3D7' }}
              />
            )}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-[13px] font-bold',
                done
                  ? 'border-maison-clay bg-maison-clay text-white'
                  : 'border-maison-line-strong bg-white text-maison-faint',
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
            </div>
            <div
              className={cn(
                'mt-2 text-center text-[11.5px] font-semibold',
                isCurrent ? 'text-maison-ink' : done ? 'text-maison-muted' : 'text-maison-faint',
              )}
            >
              {STATUS_META[step].label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
