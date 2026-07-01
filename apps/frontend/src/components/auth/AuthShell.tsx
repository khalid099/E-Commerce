import { MaisonLogo } from '@/components/layout/MaisonLogo';

interface AuthShellProps {
  headline: string;
  sub: string;
  /** Small eyebrow label above the headline on the brand panel. */
  eyebrow?: string;
  children: React.ReactNode;
}

/**
 * Split-panel auth frame: an editorial clay-gradient brand panel (with drifting
 * ambient glows and a serif watermark) beside the white form panel. The card
 * eases in on mount and the panel content reveals in a gentle stagger.
 */
export function AuthShell({ headline, sub, eyebrow = 'Considered essentials', children }: AuthShellProps) {
  return (
    <div className="maison relative flex min-h-screen items-center justify-center overflow-hidden bg-maison-cream px-5 py-12 font-sans text-maison-ink">
      {/* Ambient page wash behind the card */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-15%,#F4EAD9,transparent_55%)] dark:bg-[radial-gradient(120%_80%_at_50%_-15%,rgba(217,116,82,.08),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(199,91,57,.08),transparent_70%)] blur-3xl" />

      <div className="relative grid w-full max-w-[1040px] animate-modal-in overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_40px_100px_-25px_rgba(120,80,50,.4)] dark:border-maison-line dark:bg-maison-panel md:min-h-[600px] md:grid-cols-[1.05fr_1fr]">
        {/* Brand panel — always the warm clay-toned editorial face, pinned in
            both themes so it never inherits the flipping ink/cream tokens. */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#ECE1D0_0%,#DAC7AA_52%,#C6AF8A_100%)] p-12 dark:bg-[linear-gradient(155deg,#3A2E22_0%,#4A3826_52%,#5A4530_100%)] md:flex">
          {/* Drifting aurora glows */}
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.65),transparent_70%)] blur-2xl animate-drift-slow dark:bg-[radial-gradient(circle,rgba(255,255,255,.12),transparent_70%)]" />
          <div className="pointer-events-none absolute -bottom-28 right-[-4rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(199,91,57,.3),transparent_70%)] blur-2xl animate-drift-slow [animation-delay:-6s]" />
          {/* Soft top-left highlight */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(135%_95%_at_22%_8%,rgba(255,255,255,.55),transparent_58%)] dark:bg-[radial-gradient(135%_95%_at_22%_8%,rgba(255,255,255,.08),transparent_58%)]" />
          {/* Oversized serif watermark */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 bottom-[-5rem] select-none font-serif text-[300px] leading-none text-white/[.14]"
          >
            K
          </span>

          <div className="relative animate-auth-reveal">
            <MaisonLogo />
          </div>

          <div className="relative">
            <div className="mb-5 flex items-center gap-2.5 animate-auth-reveal [animation-delay:.08s]">
              <span className="h-px w-9 bg-maison-clay/45" />
              <span className="text-[11px] font-bold uppercase tracking-[2.4px] text-maison-clay-dark">
                {eyebrow}
              </span>
            </div>
            <h2 className="mb-4 max-w-[13ch] font-serif text-[46px] leading-[1.04] text-maison-ink dark:text-[#F0E9DE] animate-auth-reveal [animation-delay:.16s]">
              {headline}
            </h2>
            <p className="max-w-[34ch] text-[15.5px] leading-[1.65] text-maison-muted dark:text-[#D8C9B4] animate-auth-reveal [animation-delay:.24s]">
              {sub}
            </p>
          </div>

          <div className="relative flex items-center gap-3.5 border-t border-white/45 dark:border-white/10 pt-6 text-[12.5px] font-medium text-[#6C5A47] dark:text-[#C4B29A] animate-auth-reveal [animation-delay:.32s]">
            <span>Free shipping over $150</span>
            <span className="h-1 w-1 rounded-full bg-maison-clay/50" />
            <span>30-day returns</span>
          </div>
        </div>

        {/* Form panel — direct children reveal in a soft cascade */}
        <div className="relative flex flex-col justify-center bg-white dark:bg-maison-panel p-8 sm:p-12 [&>*]:animate-auth-reveal [&>*:nth-child(2)]:[animation-delay:.05s] [&>*:nth-child(3)]:[animation-delay:.1s] [&>*:nth-child(4)]:[animation-delay:.15s] [&>*:nth-child(5)]:[animation-delay:.2s] [&>*:nth-child(6)]:[animation-delay:.25s] [&>*:nth-child(7)]:[animation-delay:.3s]">
          {children}
        </div>
      </div>
    </div>
  );
}
