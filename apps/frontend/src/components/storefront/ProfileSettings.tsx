'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCog, KeyRound } from 'lucide-react';
import { PasswordField } from '@/components/auth/PasswordField';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { updateProfile, changePassword } from '@/lib/profile';
import { getErrorMessage } from '@/lib/errors';
import { fieldCls } from '@/lib/formStyles';
import type { User } from '@ecommerce/shared-types';

const nameSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
});
type NameValues = z.infer<typeof nameSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/\d/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export function ProfileSettings({ user }: { user: User }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <NameForm user={user} />
      <PasswordForm />
    </div>
  );
}

function NameForm({ user }: { user: User }) {
  const setUser = useAuthStore((s) => s.setUser);
  const showToast = useUiStore((s) => s.showToast);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName },
  });

  const onSubmit = async (values: NameValues) => {
    setServerError('');
    try {
      const updated = await updateProfile(values);
      setUser(updated);
      reset({ firstName: updated.firstName, lastName: updated.lastName });
      showToast('Profile updated');
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not update your profile.'));
    }
  };

  return (
    <SettingsCard icon={<UserCog className="h-4 w-4" />} title="Personal details">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Field label="First name" htmlFor="firstName" error={errors.firstName?.message}>
          <input
            id="firstName"
            autoComplete="given-name"
            {...register('firstName')}
            aria-invalid={!!errors.firstName}
            className={fieldCls(!!errors.firstName, 'py-3 focus:shadow-none')}
          />
        </Field>
        <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
          <input
            id="lastName"
            autoComplete="family-name"
            {...register('lastName')}
            aria-invalid={!!errors.lastName}
            className={fieldCls(!!errors.lastName, 'py-3 focus:shadow-none')}
          />
        </Field>

        {serverError && <p className="text-[12.5px] font-medium text-maison-clay">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="mt-1 h-[46px] rounded-full bg-maison-ink text-[14px] font-semibold text-maison-cream transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </SettingsCard>
  );
}

function PasswordForm() {
  const showToast = useUiStore((s) => s.showToast);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (values: PasswordValues) => {
    setServerError('');
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed');
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not change your password.'));
    }
  };

  return (
    <SettingsCard icon={<KeyRound className="h-4 w-4" />} title="Change password">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <PasswordField
          id="currentPassword"
          label="Current password"
          placeholder="••••••••"
          autoComplete="current-password"
          registration={register('currentPassword')}
          error={errors.currentPassword?.message}
        />
        <PasswordField
          id="newPassword"
          label="New password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          registration={register('newPassword')}
          error={errors.newPassword?.message}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          placeholder="Re-enter new password"
          autoComplete="new-password"
          registration={register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        {serverError && <p className="text-[12.5px] font-medium text-maison-clay">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-[46px] rounded-full bg-maison-ink text-[14px] font-semibold text-maison-cream transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </SettingsCard>
  );
}

function SettingsCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-maison-line bg-white p-6 shadow-[0_1px_2px_rgba(120,90,60,.04)] dark:bg-maison-panel">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-maison-clay">{icon}</span>
        <h3 className="text-[13px] font-bold uppercase tracking-[.7px] text-maison-ink">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-semibold text-maison-muted">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-[12.5px] text-maison-clay">{error}</p>}
    </div>
  );
}
