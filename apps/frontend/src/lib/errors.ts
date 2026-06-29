import axios from 'axios';

/**
 * Pull a human-readable message out of an API error. The backend's exception
 * filter returns `{ message: string | string[] }`; validation errors come back
 * as an array. Falls back to the provided default.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (typeof message === 'string') return message;
  }
  return fallback;
}
