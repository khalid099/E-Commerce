'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  /** Rating value 0–5; fractional values render a partial last star. */
  value: number;
  /** Star size in px. */
  size?: number;
  className?: string;
}

/**
 * Read-only star display with fractional fill. Decorative — callers pair it with
 * a visible numeric value / review count for assistive tech.
 */
export function StarRating({ value, size = 16, className }: StarRatingProps) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const gap = size * 0.12;

  return (
    <span className={cn('relative inline-flex', className)} aria-hidden="true">
      <span className="flex" style={{ gap }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className="flex-shrink-0 text-maison-line-strong"
            strokeWidth={1.5}
          />
        ))}
      </span>
      <span className="absolute inset-0 flex overflow-hidden" style={{ width: `${pct}%`, gap }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className="flex-shrink-0 fill-maison-clay text-maison-clay"
            strokeWidth={1.5}
          />
        ))}
      </span>
    </span>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  disabled?: boolean;
}

/** Interactive 1–5 star picker used in the review form (accessible radiogroup). */
export function StarRatingInput({ value, onChange, size = 30, disabled }: StarRatingInputProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      role="radiogroup"
      aria-label="Your rating"
      className="inline-flex gap-1.5"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          disabled={disabled}
          onMouseEnter={() => setHover(star)}
          onFocus={() => setHover(star)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(star)}
          className="rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maison-clay disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              'transition-colors',
              star <= shown ? 'fill-maison-clay text-maison-clay' : 'text-maison-line-strong',
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
