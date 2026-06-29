import { MaisonLogo } from '@/components/layout/MaisonLogo';

interface AuthShellProps {
  headline: string;
  sub: string;
  children: React.ReactNode;
}

/** Split-panel auth frame: branded clay-gradient panel + white form panel. */
export function AuthShell({ headline, sub, children }: AuthShellProps) {
  return (
    <div className="maison flex min-h-screen items-center justify-center font-sans px-5 py-12 text-maison-ink">
      <div className="grid w-full max-w-[1000px] overflow-hidden rounded-3xl border border-maison-line shadow-[0_30px_70px_rgba(120,90,60,.16)] md:min-h-[540px] md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between bg-[linear-gradient(150deg,#E9DCCB,#CBB89E)] p-12 md:flex">
          <div className="absolute inset-0 bg-[radial-gradient(130%_90%_at_25%_12%,rgba(255,255,255,.45),transparent_60%)]" />
          <div className="relative">
            <MaisonLogo />
          </div>
          <div className="relative">
            <h2 className="mb-3.5 font-serif text-[40px] leading-[1.08]">{headline}</h2>
            <p className="text-[15.5px] leading-[1.6] text-maison-muted">{sub}</p>
          </div>
          <div className="relative flex gap-6 text-[13px] text-[#6C5A47]">
            <span>Free shipping over $150</span>
            <span>·</span>
            <span>30-day returns</span>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center bg-white p-10 sm:p-12">{children}</div>
      </div>
    </div>
  );
}
