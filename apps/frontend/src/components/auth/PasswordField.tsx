'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  registration: UseFormRegisterReturn;
  error?: string;
  /** Wrapper utility classes (e.g. top margin between fields). */
  className?: string;
}

/**
 * Password input with a show/hide eye toggle. Wraps a react-hook-form
 * registration so it drops into any auth form. Shared by login and register.
 */
export function PasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  registration,
  error,
  className,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-semibold text-[#6C6358]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          {...registration}
          className={cn(
            'w-full rounded-xl border px-4 py-3.5 pr-11 text-[14.5px] outline-none transition-colors',
            error ? 'border-maison-clay' : 'border-maison-line-strong focus:border-maison-clay',
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-maison-faint transition-colors hover:text-maison-ink"
        >
          {show ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-[12.5px] text-maison-clay">{error}</p>}
    </div>
  );
}
