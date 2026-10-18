import { defineMiddleware } from 'astro:middleware';
import { isAdmin, COOKIE } from './lib/admin';

export const onRequest = defineMiddleware((ctx, next) => {
  const p = ctx.url.pathname;
  const open = p === '/admin/login' || p === '/api/admin/login' || p === '/api/admin/logout';
  const protectedPath = !open && (p.startsWith('/admin') || p.startsWith('/api/admin/'));
  if (protectedPath && !isAdmin(ctx.cookies.get(COOKIE)?.value)) {
    if (p.startsWith('/api/')) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { 'content-type': 'application/json' } });
    return ctx.redirect('/admin/login?next=' + encodeURIComponent(p));
  }
  return next();
});
