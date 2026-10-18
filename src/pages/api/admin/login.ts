import type { APIRoute } from 'astro';
import { checkPassword, sessionToken, COOKIE, adminEnabled } from '../../../lib/admin';
import { json, readBody } from '../_json';
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!adminEnabled()) return json({ error: 'Painel desativado: defina ADMIN_PASSWORD na Vercel.' }, 503);
  const b = await readBody(request);
  if (!checkPassword(b.password || '')) return json({ error: 'Senha incorreta.' }, 401);
  cookies.set(COOKIE, sessionToken(), { path: '/', httpOnly: true, sameSite: 'lax', secure: import.meta.env.PROD, maxAge: 60 * 60 * 24 * 30 });
  return json({ ok: true });
};
