import { ClipboardList, Wallet, TrendingUp, Timer, type LucideIcon } from 'lucide-react';
import { money } from '@/lib/storefront';

interface OrderStatsStripProps {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pending: number;
}

interface Tile {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
  chip: string;
}

/** A four-metric header band that gives the orders table a premium, at-a-glance summary. */
export function OrderStatsStrip({
  totalOrders,
  totalRevenue,
  averageOrderValue,
  pending,
}: OrderStatsStripProps) {
  const tiles: Tile[] = [
    {
      label: 'Total orders',
      value: totalOrders.toLocaleString('en-GB'),
      hint: 'all time',
      icon: ClipboardList,
      accent: '#C75B39',
      chip: 'bg-[#F7E4DB] text-[#C75B39]',
    },
    {
      label: 'Revenue',
      value: money(totalRevenue),
      hint: 'realised',
      icon: Wallet,
      accent: '#3F7A52',
      chip: 'bg-[#E2F0E6] text-[#3F7A52]',
    },
    {
      label: 'Avg. order',
      value: money(averageOrderValue),
      hint: 'per order',
      icon: TrendingUp,
      accent: '#1A5A9A',
      chip: 'bg-[#DCEAF6] text-[#1A5A9A]',
    },
    {
      label: 'Awaiting action',
      value: pending.toLocaleString('en-GB'),
      hint: 'pending',
      icon: Timer,
      accent: '#E0A03A',
      chip: 'bg-[#FCEED2] text-[#9A6B1A]',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {tiles.map(({ label, value, hint, icon: Icon, accent, chip }) => (
        <div
          key={label}
          className="group relative overflow-hidden rounded-[16px] border border-maison-line bg-white p-[18px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(120,90,60,0.14)] dark:bg-maison-panel"
        >
          {/* soft corner wash keyed to the metric's accent */}
          <span
            className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
            style={{ background: accent }}
            aria-hidden
          />
          <div className="relative flex items-center gap-3">
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${chip}`}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.9px] text-maison-faint">
                {label}
              </div>
              <div className="mt-0.5 truncate text-[21px] font-extrabold leading-tight tracking-[-0.4px] tabular-nums text-maison-ink">
                {value}
              </div>
            </div>
          </div>
          <div className="relative mt-2.5 text-[11.5px] font-medium text-maison-subtle">{hint}</div>
        </div>
      ))}
    </div>
  );
}
