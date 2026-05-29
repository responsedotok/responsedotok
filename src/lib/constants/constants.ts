export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,32}$/;
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const SESSION_COOKIE = process.env.SESSION_COOKIE ?? 'session';
export const API_URL = '';
export const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
  