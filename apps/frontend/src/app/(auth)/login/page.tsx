'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthSubmit } from '@/components/auth/AuthSubmit';
import { PasswordField } from '@/components/auth/PasswordField';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { fieldCls } from '@/lib/formStyles';
import type { User } from '@ecommerce/shared-types';
import { UserRole } from '@ecommerce/shared-types';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Demo logins for quick testing — one tap fills the form.
  const fillDemo = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setServerError('');
  };

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await api.post<{ success: boolean; data: User }>('/auth/login', data);
      const user = res.data.data;
      setUser(user);
      router.push(user.role === UserRole.ADMIN ? '/admin/dashboard' : '/');
    } catch (err) {
      setServerError(getErrorMessage(err, 'Invalid email or password'));
    }
  };

  return (
    <AuthShell
      headline="Style that inspires living."
      sub="Sign in to pick up where you left off — your cart, orders and saved pieces."
    >
      <h1 className="mb-1.5 font-serif text-[36px]">Welcome back</h1>
      <p className="mb-5 text-[14.5px] text-maison-subtle">Sign in to access your cart and orders.</p>

      <div className="mb-6 rounded-xl border border-dashed border-maison-line-strong bg-[#F7F1E8] px-4 py-3 dark:bg-maison-panel">
        <div className="mb-2 text-[11.5px] font-bold uppercase tracking-[.6px] text-maison-clay-dark">
          Demo accounts — tap to fill
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fillDemo('customer@ecommerce.com', 'Customer@123456')}
            className="flex-1 rounded-lg border border-maison-line-strong bg-white px-3 py-2 text-[12.5px] font-semibold text-maison-ink transition-all duration-200 hover:-translate-y-px hover:border-maison-clay hover:text-maison-clay hover:shadow-[0_6px_16px_rgba(199,91,57,.12)] dark:bg-maison-cream"
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => fillDemo('admin@ecommerce.com', 'Admin@123456')}
            className="flex-1 rounded-lg border border-maison-line-strong bg-white px-3 py-2 text-[12.5px] font-semibold text-maison-ink transition-all duration-200 hover:-translate-y-px hover:border-maison-clay hover:text-maison-clay hover:shadow-[0_6px_16px_rgba(199,91,57,.12)] dark:bg-maison-cream"
          >
            Admin
          </button>
        </div>
        <div className="mt-2 text-[11px] text-maison-subtle">
          Test card at checkout: 4242 4242 4242 4242 · any future date · any CVC
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col" noValidate>
        <label htmlFor="email" className="mb-1.5 text-[12.5px] font-semibold text-maison-muted">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
          aria-invalid={!!errors.email}
          className={fieldCls(!!errors.email)}
        />
        {errors.email && <p className="mt-1.5 text-[12.5px] text-maison-clay">{errors.email.message}</p>}

        <PasswordField
          id="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          registration={register('password')}
          error={errors.password?.message}
          className="mt-4"
        />

        {serverError && (
          <p className="mt-2.5 text-[12.5px] font-medium text-maison-clay">{serverError}</p>
        )}

        <AuthSubmit label="Sign in" pendingLabel="Signing in…" pending={isSubmitting} className="mt-[22px]" />
      </form>

      <div className="my-5 flex items-center gap-3 text-[12px] text-maison-faint">
        <span className="h-px flex-1 bg-maison-line-strong" />
        or
        <span className="h-px flex-1 bg-maison-line-strong" />
      </div>

      <Link
        href="/"
        className="flex h-[52px] items-center justify-center rounded-full border border-maison-line-strong text-[15.5px] font-semibold text-maison-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-maison-clay/40 hover:bg-[#F4ECE0] dark:hover:bg-maison-panel"
      >
        Continue as guest
      </Link>

      <div className="mt-5 text-center text-sm text-maison-subtle">
        New here?{' '}
        <Link href="/register" className="font-semibold text-maison-clay">
          Create an account
        </Link>
      </div>
    </AuthShell>
  );
}
