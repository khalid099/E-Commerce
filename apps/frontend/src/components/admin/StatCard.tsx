import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Tailwind background + text classes for the icon chip. */
  iconClassName: string;
  /** Accent hex used for the top bar, watermark and glow. */
  accent: string;
  /** Optional month-over-month delta, in percent. Positive renders green/up. */
  trend?: number | null;
  /** Small qualifier under the value, e.g. "vs last month". */
  caption?: string;
}

/** A single dashboard metric: an icon chip, the value, its label and an optional trend. */
export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  accent,
  trend,
  caption,
}: StatCardProps) {
  const up = (trend ?? 0) >= 0;
  return (
    <div
      className="group relative overflow-hidden rounded-[18px] border border-maison-line bg-white p-[22px] transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_22px_48px_rgba(120,90,60,0.16)] dark:bg-maison-panel"
    >
      {/* top accent bar — grows in on hover */}
      <span
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}00)` }}
      />
      {/* soft corner wash */}
      <span
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: accent }}
      />
      {/* watermark icon */}
      <Icon
        className="pointer-events-none absolute -bottom-3 -right-3 h-24 w-24 opacity-[0.06] transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.09]"
        style={{ color: accent }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between">
        <div
          className={`flex h-[44px] w-[44px] items-center justify-center rounded-xl shadow-sm ring-1 ring-inset ring-white/40 transition-transform duration-300 group-hover:scale-105 ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend != null && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11.5px] font-bold tabular-nums ${
              up ? 'bg-[#E2F0E6] text-[#3F7A52]' : 'bg-[#F6E1E1] text-[#B23B3B]'
            }`}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="relative mt-[18px] text-[30px] font-extrabold tracking-[-0.5px] tabular-nums text-maison-ink">
        {value}
      </div>
      <div className="relative mt-0.5 flex items-center gap-1.5 text-[13px] text-maison-subtle">
        <span>{label}</span>
        {caption && <span className="text-maison-faint">· {caption}</span>}
      </div>
    </div>
  );
}
