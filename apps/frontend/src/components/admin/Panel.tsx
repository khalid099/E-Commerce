import { cn } from '@/lib/utils';

/** The white, hairline-bordered card that every admin surface is built from. */
export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-[18px] border border-maison-line bg-white', className)}>
      {children}
    </div>
  );
}
