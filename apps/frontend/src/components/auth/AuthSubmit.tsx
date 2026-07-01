import { cn } from '@/lib/utils';

interface AuthSubmitProps {
  /** Idle label, e.g. "Sign in". */
  label: string;
  /** Label shown while the form is submitting, e.g. "Signing in…". */
  pendingLabel: string;
  pending?: boolean;
  className?: string;
}

/**
 * Primary auth action button: clay gradient, lift on hover, press on active,
 * and a light sheen that sweeps across on hover. Shared by login and register.
 */
export function AuthSubmit({ label, pendingLabel, pending = false, className }: AuthSubmitProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'group relative h-[52px] overflow-hidden rounded-full bg-[linear-gradient(180deg,#D2683F,#C0522F)] text-[15.5px] font-semibold text-white shadow-[0_12px_28px_rgba(199,91,57,.32)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(199,91,57,.42)] active:translate-y-0 active:shadow-[0_8px_20px_rgba(199,91,57,.3)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)] opacity-0 group-hover:animate-sheen group-hover:opacity-100"
      />
      <span className="relative">{pending ? pendingLabel : label}</span>
    </button>
  );
}
