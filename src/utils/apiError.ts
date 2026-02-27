import axios from 'axios';

/**
 * Returns a user-friendly message for API/network errors.
 * Use when showing errors from axios calls (e.g. in catch blocks).
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ERR_NETWORK' || !err.response) {
      return "Can't reach server. Check that the app is running and the URL is correct.";
    }
    const msg = err.response?.data?.error;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}
