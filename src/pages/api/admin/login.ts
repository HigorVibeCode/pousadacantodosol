import type { APIRoute } from 'astro';
import { checkPassword, sessionToken, COOKIE } from '../../../lib/admin';
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const f = await request.formData();
  const next = String(f.get('next') || '/admin');
  if (!checkPassword(String(f.get('password') || ''))) return redirect('/admin/login?erro=1&next=' + encodeURIComponent(next), 303);
  cookies.set(COOKIE, sessionToken(), { path: '/', httpOnly: true, sameSite: 'lax', secure: import.meta.env.PROD, maxAge: 60 * 60 * 24 * 30 });
  return redirect(next.startsWith('/') ? next : '/admin', 303);
};
