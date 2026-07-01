'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { User } from '@ecommerce/shared-types';

const schema = z
  .object({
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
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Live password requirements — each turns green as the rule is satisfied.
  const pw = watch('password') ?? '';
  const rules = [
    { label: 'At least 8 characters', met: pw.length >= 8 },
    { label: 'An uppercase letter', met: /[A-Z]/.test(pw) },
    { label: 'A lowercase letter', met: /[a-z]/.test(pw) },
    { label: 'A number', met: /\d/.test(pw) },
  ];

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
      headline="Join the KD Store list."
      sub="Create an account to save your cart, track orders and get early access to drops."
    >
      <h1 className="mb-1.5 font-serif text-[36px]">Create account</h1>
      <p className="mb-7 text-[14.5px] text-maison-subtle">
        Join KD Store to save your cart and track orders.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col" noValidate>
        <label htmlFor="fullName" className="mb-1.5 text-[12.5px] font-semibold text-maison-muted">
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

        <label htmlFor="email" className="mb-1.5 mt-4 text-[12.5px] font-semibold text-maison-muted">
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          registration={register('password')}
          error={errors.password?.message}
          className="mt-4"
        />

        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {rules.map((rule) => (
            <li
              key={rule.label}
              className={cn(
                'flex items-center gap-1.5 text-[11.5px] transition-colors',
                rule.met ? 'text-maison-leaf' : 'text-maison-subtle',
              )}
            >
              <span
                className={cn(
                  'flex h-[14px] w-[14px] flex-shrink-0 items-center justify-center rounded-full transition-colors',
                  rule.met ? 'animate-pop bg-maison-leaf text-white' : 'border border-maison-line-strong',
                )}
              >
                {rule.met && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              </span>
              {rule.label}
            </li>
          ))}
        </ul>

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          registration={register('confirmPassword')}
          error={errors.confirmPassword?.message}
          className="mt-4"
        />

        {serverError && (
          <p className="mt-2.5 text-[12.5px] font-medium text-maison-clay">{serverError}</p>
        )}

        <AuthSubmit
          label="Create account"
          pendingLabel="Creating account…"
          pending={isSubmitting}
          className="mt-[22px]"
        />
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
    'w-full rounded-xl border bg-[#FCFAF6] px-4 py-3.5 text-[14.5px] text-maison-ink outline-none transition-all duration-200 placeholder:text-maison-faint focus:bg-white focus:ring-4 dark:bg-maison-cream dark:focus:bg-maison-cream',
    error
      ? 'border-maison-clay ring-4 ring-maison-clay/10'
      : 'border-maison-line-strong focus:border-maison-clay focus:ring-maison-clay/[.09]',
  );
}
