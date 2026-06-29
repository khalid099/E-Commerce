import { Suspense } from 'react';
import { OrderConfirmationContent } from '@/components/storefront/OrderConfirmationContent';

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <OrderConfirmationContent />
    </Suspense>
  );
}
