import { MaisonLogo } from '@/components/layout/MaisonLogo';

interface AuthShellProps {
  headline: string;
  sub: string;
  /** Small eyebrow label above the headline on the brand panel. */
  eyebrow?: string;
  children: React.ReactNode;
}

// Warm, editorial apparel/interior shot from the store's own seed photography —
// doubles as the brand panel background. Built the way the seed script does:
// a raw Unsplash photo id + format/fit/width/quality query params.
const BRAND_IMAGE_URL =
  'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1400&q=80';

/**
 * Split-panel auth frame: a full-bleed editorial photograph brand panel with a
 * warm ink gradient overlay, beside the form panel. The card eases in on mount
 * and content reveals in a gentle stagger.
 */
export function AuthShell({ headline, sub, eyebrow = 'Considered essentials', children }: AuthShellProps) {
  return (
    <div className="maison relative flex min-h-screen items-center justify-center overflow-hidden bg-maison-cream px-5 py-12 font-sans text-maison-ink">
      {/* Ambient page wash behind the card */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-15%,#F4EAD9,transparent_55%)] dark:bg-[radial-gradient(120%_80%_at_50%_-15%,rgba(217,116,82,.08),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(199,91,57,.08),transparent_70%)] blur-3xl" />

      <div className="relative grid w-full max-w-[1040px] animate-modal-in overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_10px_30px_-10px_rgba(120,80,50,.25),0_50px_110px_-30px_rgba(90,60,35,.45)] ring-1 ring-inset ring-white/50 dark:border-maison-line dark:bg-maison-panel dark:ring-white/[.06] md:min-h-[620px] md:grid-cols-[1.05fr_1fr]">
        {/* Brand panel — full-bleed editorial photograph, pinned to warm dark
            tones in both themes so it never inherits the flipping ink/cream
            tokens. Logo top, copy + trust badges bottom, all over the image. */}
        <div
          className="relative hidden flex-col justify-between overflow-hidden bg-maison-ink bg-cover bg-center p-12 md:flex"
          style={{ backgroundImage: `url(${BRAND_IMAGE_URL})` }}
        >
          {/* Decorative CSS background photo — content is conveyed by the text below,
              not the image itself, so no alt text is required. */}

          {/* Warm ink gradient — legible base for the copy, deepest at the bottom */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(24,17,12,.35)_0%,rgba(24,17,12,.15)_32%,rgba(28,19,12,.72)_68%,rgba(20,13,9,.94)_100%)]" />
          {/* Subtle warm tint over the whole photo so it reads "maison", not generic stock */}
          <div className="pointer-events-none absolute inset-0 bg-[#C6753F] mix-blend-multiply opacity-[.14]" />
          {/* One slow drifting glow for a touch of life */}
          <div className="pointer-events-none absolute -bottom-24 right-[-3rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,180,120,.28),transparent_70%)] blur-2xl animate-drift-slow" />
          {/* Faint vignette at the edges */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,transparent_55%,rgba(10,7,5,.35)_100%)]" />
          {/* Hairline inner ring for a "glass" edge on the panel */}
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[.08]" />

          <div className="relative animate-auth-reveal">
            <MaisonLogo tone="cream" />
          </div>

          <div className="relative">
            <div className="mb-5 flex items-center gap-2.5 animate-auth-reveal [animation-delay:.08s]">
              <span className="h-px w-9 bg-[#E8A878]/70" />
              <span className="text-[11px] font-bold uppercase tracking-[2.4px] text-[#E8A878]">
                {eyebrow}
              </span>
            </div>
            <h2 className="mb-4 max-w-[13ch] font-serif text-[46px] leading-[1.04] text-[#FBF5EC] animate-auth-reveal [animation-delay:.16s]">
              {headline}
            </h2>
            <p className="max-w-[34ch] text-[15.5px] leading-[1.65] text-[#E4D6C4] animate-auth-reveal [animation-delay:.24s]">
              {sub}
            </p>
          </div>

          <div className="relative flex items-center gap-3.5 border-t border-white/[.16] pt-6 text-[12.5px] font-medium text-[#D9C6AE] animate-auth-reveal [animation-delay:.32s]">
            <span>Free shipping over $150</span>
            <span className="h-1 w-1 rounded-full bg-[#E8A878]/60" />
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
