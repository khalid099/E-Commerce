import { ProductDetailContent } from '@/components/storefront/ProductDetailContent';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return <ProductDetailContent id={params.id} />;
}
