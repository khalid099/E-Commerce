'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { ProductTone } from './ProductTone';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { getStripe } from '@/lib/stripe';
import { getErrorMessage } from '@/lib/errors';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { money } from '@/lib/storefront';
import { cn } from '@/lib/utils';
import type { ApiResponse, Order } from '@ecommerce/shared-types';

interface IntentData {
  clientSecret: string;
  paymentIntentId: string;
  subtotal: number;
  tax: number;
  amount: number;
}

const APPEARANCE: StripeElementsOptions['appearance'] = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#C75B39',
    colorText: '#2C2620',
    fontFamily: 'inherit',
    borderRadius: '10px',
  },
};

export function CheckoutContent() {
  const router = useRouter();
  const { cart, isLoading, fetchCart } = useCartStore();
  const [intent, setIntent] = useState<IntentData | null>(null);
  const [intentError, setIntentError] = useState('');

  useEffect(() => {
    fetchCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Once the cart is known, create the PaymentIntent (amount is computed server-side).
  useEffect(() => {
    if (!cart || intent) return;
    if (cart.items.length === 0) {
      router.push('/cart');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.post<ApiResponse<IntentData>>('/payments/create-intent');
        if (!cancelled) setIntent(res.data.data);
      } catch (err) {
        if (!cancelled) setIntentError(getErrorMessage(err, 'Could not initialise payment'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cart, intent, router]);

  if (isLoading && !cart) {
    return (
      <main className="mx-auto max-w-[1080px] px-5 pb-12 pt-9 sm:px-8">
        <Skeleton className="h-[600px] w-full rounded-[18px]" />
      </main>
    );
  }

  const subtotal = intent?.subtotal ?? cart?.subtotal ?? 0;
  const tax = intent?.tax ?? 0;
  const total = intent?.amount ?? subtotal + tax;

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
              <button
                onClick={() => router.push('/cart')}
                aria-label="Back to cart"
                className="text-maison-subtle"
              >
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
              <SummaryRow label="Tax" value={money(tax)} />
              <SummaryRow label="Shipping" value="Free" />
              <div className="mt-1.5 flex justify-between border-t border-[#EFEAE2] pt-3 text-[15px]">
                <span className="font-bold">Total due</span>
                <span className="font-bold">{money(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="p-10">
            {intentError ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-[#F0D9D3] bg-[#FBF1EE] px-5 py-10 text-center">
                <AlertCircle className="h-7 w-7 text-maison-clay" />
                <div className="text-sm font-semibold text-maison-clay-dark">{intentError}</div>
                <p className="text-[12.5px] text-maison-subtle">
                  Make sure Stripe test keys are configured, then try again.
                </p>
                <button
                  onClick={() => {
                    setIntentError('');
                    setIntent(null);
                  }}
                  className="mt-1 rounded-full bg-maison-ink px-5 py-2.5 text-[13px] font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            ) : !intent ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-[50px] w-full rounded-lg" />
              </div>
            ) : (
              <Elements stripe={getStripe()} options={{ clientSecret: intent.clientSecret, appearance: APPEARANCE }}>
                <CheckoutForm paymentIntentId={intent.paymentIntentId} total={total} />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

type Errors = Partial<Record<'email' | 'name' | 'address', string>>;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function CheckoutForm({ paymentIntentId, total }: { paymentIntentId: string; total: number }) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const user = useAuthStore((s) => s.user);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const showToast = useUiStore((s) => s.showToast);

  const [form, setForm] = useState({ email: '', name: '', address: '', city: '', zip: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [paying, setPaying] = useState(false);

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Errors = {};
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email.';
    if (!form.name.trim()) next.name = 'Enter your name.';
    if (!form.address.trim()) next.address = 'Enter your shipping address.';
    setErrors(next);
    if (Object.keys(next).length) return;
    if (!stripe || !elements) return;

    setPaying(true);
    try {
      // Confirm the card payment with Stripe (no redirect for cards).
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        showToast(error.message ?? 'Payment failed. Please check your card details.');
        setPaying(false);
        return;
      }
      if (paymentIntent?.status !== 'succeeded') {
        showToast('Payment was not completed.');
        setPaying(false);
        return;
      }

      // Payment succeeded — create the order against the verified PaymentIntent.
      const res = await api.post<ApiResponse<Order>>('/orders', {
        shippingAddress: {
          fullName: form.name.trim(),
          line1: form.address.trim(),
          city: form.city.trim() || '—',
          state: '—',
          postalCode: form.zip.trim() || '—',
          country: 'United States',
        },
        paymentIntentId,
      });
      await fetchCart();
      router.push(`/checkout/success?order=${res.data.data.id}`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Payment succeeded but the order could not be saved.'));
      setPaying(false);
    }
  };

  return (
    <form onSubmit={submit}>
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

      <div className="mb-2.5 mt-2 text-[13px] font-semibold">Payment details</div>
      <div className="mb-4">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      <button
        type="submit"
        disabled={!stripe || paying}
        className="h-[50px] w-full rounded-lg bg-[#3B3550] text-[15px] font-semibold text-white transition-colors hover:bg-[#2A2640] disabled:opacity-60"
      >
        {paying ? 'Processing…' : `Pay ${money(total)}`}
      </button>
      <div className="mt-3.5 text-center text-[11.5px] text-maison-subtle">
        Powered by <span className="font-bold text-[#635BFF]">stripe</span> &nbsp;·&nbsp; Test mode —
        use card <span className="font-semibold">4242 4242 4242 4242</span>.
      </div>
    </form>
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
