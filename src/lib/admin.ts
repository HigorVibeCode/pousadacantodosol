import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'ods_admin';
const password = () => process.env.ADMIN_PASSWORD || import.meta.env.ADMIN_PASSWORD || (import.meta.env.DEV ? 'orladosol' : '');
const token = () => createHmac('sha256', password()).update('painel-orla-do-sol').digest('hex');

export const adminEnabled = () => !!password();
export function checkPassword(p: string) {
  const a = Buffer.from(p), b = Buffer.from(password());
  return a.length === b.length && b.length > 0 && timingSafeEqual(a, b);
}
export const sessionToken = () => token();
export function isAdmin(cookieValue: string | undefined) {
  if (!cookieValue || !adminEnabled()) return false;
  const a = Buffer.from(cookieValue), b = Buffer.from(token());
  return a.length === b.length && timingSafeEqual(a, b);
}
