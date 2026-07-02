import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Short, display-friendly order/entity id, e.g. "A1B2C3D4". */
export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
