/** Stock-level pill: out of stock / low stock / in stock, by quantity. */
export function StockBadge({ quantity }: { quantity: number }) {
  const { label, className } =
    quantity <= 0
      ? { label: 'Out of stock', className: 'bg-[#F6E1E1] text-[#B23B3B]' }
      : quantity <= 8
        ? { label: 'Low stock', className: 'bg-[#FCEED2] text-[#9A6B1A]' }
        : { label: 'In stock', className: 'bg-[#E2F0E6] text-[#3F7A52]' };

  return (
    <span className={`inline-flex rounded-full px-[11px] py-[5px] text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}
