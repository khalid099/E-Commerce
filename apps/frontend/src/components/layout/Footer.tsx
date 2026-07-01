import Link from 'next/link';
import { MaisonLogo } from './MaisonLogo';
import { NewsletterForm } from './NewsletterForm';

const SHOP_LINKS = [
  { label: 'All products', href: '/products' },
  { label: 'New arrivals', href: '/products?sortBy=newest' },
  { label: 'Collections', href: '/products' },
];

const ACCOUNT_LINKS = [
  { label: 'Cart', href: '/cart' },
  { label: 'My orders', href: '/orders' },
  { label: 'Sign in', href: '/login' },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-maison-ink text-maison-subtle dark:bg-maison-panel">
      <div className="mx-auto max-w-[1280px] px-5 pb-10 pt-14 sm:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <div className="mb-3.5">
              <MaisonLogo tone="cream" />
            </div>
            <p className="max-w-[280px] text-sm leading-relaxed text-maison-subtle">
              A curated marketplace of objects worth keeping — apparel, home, and the small
              luxuries in between.
            </p>
          </div>

          <FooterColumn title="SHOP" links={SHOP_LINKS} />
          <FooterColumn title="ACCOUNT" links={ACCOUNT_LINKS} />

          <div>
            <div className="mb-3.5 text-xs font-semibold tracking-[1px] text-maison-cream dark:text-maison-ink">
              NEWSLETTER
            </div>
            <p className="mb-3 text-[13.5px] text-maison-subtle">
              Early access to drops and exclusive offers.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-11 flex flex-col gap-2 border-t border-maison-line-strong pt-5 text-[12.5px] text-maison-faint sm:flex-row sm:justify-between">
          <span>© 2026 KD Store. All rights reserved.</span>
          <span>Secure checkout · Test mode</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div className="mb-3.5 text-xs font-semibold tracking-[1px] text-maison-cream dark:text-maison-ink">
        {title}
      </div>
      <div className="flex flex-col gap-2.5 text-[13.5px]">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="transition-colors hover:text-maison-cream dark:hover:text-maison-ink"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
