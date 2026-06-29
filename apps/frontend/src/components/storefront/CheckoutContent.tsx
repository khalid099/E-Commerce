'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { ProductTone } from './ProductTone';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { money, cartEstimate } from '@/lib/storefront';
import { cn } from '@/lib/utils';
import type { ApiResponse, Order } from '@ecommerce/shared-types';

type Errors = Partial<Record<'email' | 'name' | 'address' | 'card', string>>;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function CheckoutContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { cart, isLoading, fetchCart } = useCartStore();
  const showToast = useUiStore((s) => s.showToast);

  const [form, setForm] = useState({
    email: '',
    name: '',
    address: '',
    city: '',
    zip: '',
    card: '',
    exp: '',
    cvc: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        email: f.email || user.email,
        name: f.name || `${user.firstName} ${user.lastName}`.trim(),
      }));
    }
  }, [user]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const fillTest = () =>
    setForm((f) => ({ ...f, card: '4242 4242 4242 4242', exp: '12 / 34', cvc: '123' }));

  const subtotal = cart?.subtotal ?? 0;
  const hasItems = !!cart && cart.items.length > 0;
  const { shipping, total } = cartEstimate(subtotal, hasItems, false);

  const placeOrder = async () => {
    const next: Errors = {};
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email.';
    if (!form.name.trim()) next.name = 'Enter your name.';
    if (!form.address.trim()) next.address = 'Enter your shipping address.';
    if (form.card.replace(/\s/g, '').length < 15 || !form.exp.trim() || !form.cvc.trim())
      next.card = 'Enter complete card details (try "Use test card").';
    setErrors(next);
    if (Object.keys(next).length) return;
    if (!hasItems) {
      router.push('/cart');
      return;
    }

    setPlacing(true);
    try {
      const res = await api.post<ApiResponse<Order>>('/orders', {
        shippingAddress: {
          fullName: form.name.trim(),
          line1: form.address.trim(),
          city: form.city.trim() || '—',
          state: '—',
          postalCode: form.zip.trim() || '—',
          country: 'United States',
        },
        paymentIntentId: `pi_mock_${Date.now()}`,
      });
      await fetchCart();
      router.push(`/checkout/success?order=${res.data.data.id}`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not place order'));
      setPlacing(false);
    }
  };

  if (isLoading && !cart) {
    return (
      <main className="mx-auto max-w-[1080px] px-5 pb-12 pt-9 sm:px-8">
        <Skeleton className="h-[600px] w-full rounded-[18px]" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1080px] animate-page-in px-5 pb-12 pt-9 sm:px-8">
      <div className="overflow-hidden rounded-[18px] border border-[#E6E0D6] shadow-[0_30px_70px_rgba(33,28,22,.16)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-[#E6E0D6] bg-[#F2EEE8] px-[18px] py-[11px]">
          <span className="h-[11px] w-[11px] rounded-full bg-[#E8736A]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#F0BE4F]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#69C16B]" />
          <div className="flex flex-1 items-center justify-center gap-1.5 text-[12.5px] text-maison-subtle">
            <Lock className="h-3 w-3" />
            checkout.stripe.com
          </div>
        </div>

        <div className="grid bg-white md:grid-cols-2">
          {/* Summary */}
          <div className="border-b border-[#EFEAE2] p-10 md:border-b-0 md:border-r">
            <div className="mb-[30px] flex items-center gap-2.5">
              <button onClick={() => router.push('/cart')} aria-label="Back to cart" className="text-maison-subtle">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-maison-ink font-serif text-base text-white">
                M
              </span>
              <span className="text-sm font-semibold">Maison</span>
              <span className="rounded bg-[#FCEED2] px-2 py-[3px] text-[10.5px] font-bold tracking-[.6px] text-[#9A6B1A]">
                TEST MODE
              </span>
            </div>

            <div className="text-sm text-maison-subtle">Pay Maison</div>
            <div className="mb-7 mt-1 text-[38px] font-bold">{money(total)}</div>

            <div className="flex flex-col gap-4">
              {cart?.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3.5">
                  <ProductTone
                    name={item.product.name}
                    categoryName={item.product.category?.name}
                    imageUrl={item.product.imageUrl}
                    initialClassName="text-[24px]"
                    className="h-[46px] w-[46px] flex-shrink-0 rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="text-[13.5px] font-semibold">{item.product.name}</div>
                    <div className="text-xs text-maison-subtle">Qty {item.quantity}</div>
                  </div>
                  <div className="text-[13.5px] font-semibold">{money(item.lineTotal)}</div>
                </div>
              ))}
            </div>

            <div className="mt-[22px] flex flex-col gap-2.5 border-t border-[#EFEAE2] pt-4">
              <SummaryRow label="Subtotal" value={money(subtotal)} />
              <SummaryRow label="Shipping" value={shipping === 0 ? 'Free' : money(shipping)} />
              <div className="mt-1.5 flex justify-between border-t border-[#EFEAE2] pt-3 text-[15px]">
                <span className="font-bold">Total due</span>
                <span className="font-bold">{money(total)}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-10">
            <div className="mb-2.5 text-[13px] font-semibold">Shipping information</div>

            <Field label="Email" error={errors.email}>
              <input
                value={form.email}
                onChange={(e) => set('email')(e.target.value)}
                placeholder="you@example.com"
                className={inputCls(!!errors.email)}
              />
            </Field>
            <Field label="Full name" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set('name')(e.target.value)}
                placeholder="Jane Doe"
                className={inputCls(!!errors.name)}
              />
            </Field>
            <Field label="Shipping address" error={errors.address}>
              <input
                value={form.address}
                onChange={(e) => set('address')(e.target.value)}
                placeholder="123 Market St"
                className={inputCls(!!errors.address)}
              />
              <div className="mt-2.5 grid grid-cols-[1fr_110px] gap-2.5">
                <input
                  value={form.city}
                  onChange={(e) => set('city')(e.target.value)}
                  placeholder="City"
                  className={inputCls(false)}
                />
                <input
                  value={form.zip}
                  onChange={(e) => set('zip')(e.target.value)}
                  placeholder="ZIP"
                  className={inputCls(false)}
                />
              </div>
            </Field>

            <div className="mb-2.5 mt-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold">Payment details</span>
              <button onClick={fillTest} className="text-[11.5px] font-semibold text-maison-clay">
                Use test card
              </button>
            </div>
            <Field label="Card information" error={errors.card}>
              <input
                value={form.card}
                onChange={(e) => set('card')(formatCard(e.target.value))}
                placeholder="1234 1234 1234 1234"
                inputMode="numeric"
                className={inputCls(!!errors.card)}
              />
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <input
                  value={form.exp}
                  onChange={(e) => set('exp')(e.target.value)}
                  placeholder="MM / YY"
                  className={inputCls(!!errors.card)}
                />
                <input
                  value={form.cvc}
                  onChange={(e) => set('cvc')(e.target.value)}
                  placeholder="CVC"
                  inputMode="numeric"
                  className={inputCls(!!errors.card)}
                />
              </div>
            </Field>

            <button
              onClick={placeOrder}
              disabled={placing}
              className="h-[50px] w-full rounded-lg bg-[#3B3550] text-[15px] font-semibold text-white transition-colors hover:bg-[#2A2640] disabled:opacity-60"
            >
              {placing ? 'Processing…' : `Pay ${money(total)}`}
            </button>
            <div className="mt-3.5 text-center text-[11.5px] text-maison-subtle">
              Powered by <span className="font-bold text-[#635BFF]">stripe</span> &nbsp;·&nbsp; This
              is a test. No real payment is processed.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function inputCls(error: boolean) {
  return cn(
    'w-full rounded-lg border px-3.5 py-3 text-sm outline-none transition-colors',
    error ? 'border-maison-clay' : 'border-[#DDD6CB] focus:border-maison-clay',
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs text-[#6C6358]">{label}</label>
      {children}
      <div className="mt-1 min-h-[14px] text-[11px] text-maison-clay">{error}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13.5px]">
      <span className="text-[#6C6358]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

/** Group digits in 4s, max 19 digits, for the card field. */
function formatCard(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}
