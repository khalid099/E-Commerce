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

const schema = z.object({
  // Backend stores first/last separately; we collect one field and split it.
  fullName: z
    .string()
    .trim()
    .refine((v) => v.split(/\s+/).length >= 2, 'Enter your first and last name'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[a-z]/, 'Include a lowercase letter')
    .regex(/\d/, 'Include a number'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
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
    const parts = data.fullName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    try {
      const res = await api.post<{ success: boolean; data: User }>('/auth/register', {
        firstName,
        lastName,
        email: data.email,
        password: data.password,
      });
      setUser(res.data.data);
      router.push('/');
    } catch (err) {
      setServerError(getErrorMessage(err, 'Registration failed. Please try again.'));
    }
  };

  return (
    <AuthShell
      headline="Join the Maison list."
      sub="Create an account to save your cart, track orders and get early access to drops."
    >
      <h1 className="mb-1.5 font-serif text-[36px]">Create account</h1>
      <p className="mb-7 text-[14.5px] text-maison-subtle">
        Join Maison to save your cart and track orders.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col" noValidate>
        <label htmlFor="fullName" className="mb-1.5 text-[12.5px] font-semibold text-[#6C6358]">
          Full name
        </label>
        <input
          id="fullName"
          autoComplete="name"
          placeholder="Jane Doe"
          {...register('fullName')}
          aria-invalid={!!errors.fullName}
          className={fieldCls(!!errors.fullName)}
        />
        {errors.fullName && (
          <p className="mt-1.5 text-[12.5px] text-maison-clay">{errors.fullName.message}</p>
        )}

        <label htmlFor="email" className="mb-1.5 mt-4 text-[12.5px] font-semibold text-[#6C6358]">
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-maison-subtle">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-maison-clay">
          Sign in
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
