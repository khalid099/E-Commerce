import { Suspense } from 'react';
import { ProductsContent } from '@/components/storefront/ProductsContent';

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
