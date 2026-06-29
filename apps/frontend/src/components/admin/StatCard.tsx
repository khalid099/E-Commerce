import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Tailwind background + text classes for the icon chip. */
  iconClassName: string;
}

/** A single dashboard metric: an icon chip, the value, and its label. */
export function StatCard({ label, value, icon: Icon, iconClassName }: StatCardProps) {
  return (
    <div className="group rounded-[18px] border border-maison-line bg-white p-[22px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(120,90,60,0.12)]">
      <div className={`flex h-[42px] w-[42px] items-center justify-center rounded-xl ${iconClassName}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-[18px] text-[30px] font-extrabold tracking-[-0.5px] tabular-nums text-maison-ink">
        {value}
      </div>
      <div className="mt-0.5 text-[13px] text-maison-subtle">{label}</div>
    </div>
  );
}
