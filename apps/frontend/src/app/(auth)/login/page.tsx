'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
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
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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
      <p className="mb-7 text-[14.5px] text-maison-subtle">Sign in to access your cart and orders.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col" noValidate>
        <label htmlFor="email" className="mb-1.5 text-[12.5px] font-semibold text-[#6C6358]">
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

        <label htmlFor="password" className="mb-1.5 mt-4 text-[12.5px] font-semibold text-[#6C6358]">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register('password')}
          aria-invalid={!!errors.password}
          className={fieldCls(!!errors.password)}
        />
        {errors.password && (
          <p className="mt-1.5 text-[12.5px] text-maison-clay">{errors.password.message}</p>
        )}

        {serverError && (
          <p className="mt-2.5 text-[12.5px] font-medium text-maison-clay">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-[22px] h-[52px] rounded-full bg-maison-clay text-[15.5px] font-semibold text-white shadow-[0_12px_28px_rgba(199,91,57,.3)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[12px] text-maison-faint">
        <span className="h-px flex-1 bg-maison-line-strong" />
        or
        <span className="h-px flex-1 bg-maison-line-strong" />
      </div>

      <Link
        href="/"
        className="flex h-[52px] items-center justify-center rounded-full border border-maison-line-strong text-[15.5px] font-semibold text-maison-ink transition-colors hover:bg-[#F4ECE0]"
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

function fieldCls(error: boolean) {
  return cn(
    'w-full rounded-xl border px-4 py-3.5 text-[14.5px] outline-none transition-colors',
    error ? 'border-maison-clay' : 'border-maison-line-strong focus:border-maison-clay',
  );
}
