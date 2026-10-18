import { defineMiddleware } from 'astro:middleware';
import { isAdmin, COOKIE } from './lib/admin';

/** Protege as APIs do painel. As páginas são estáticas e pedem login pela API. */
export const onRequest = defineMiddleware((ctx, next) => {
  const p = ctx.url.pathname;
  const open = p === '/api/admin/login' || p === '/api/admin/logout';
  if (p.startsWith('/api/admin/') && !open && !isAdmin(ctx.cookies.get(COOKIE)?.value)) {
    return new Response(JSON.stringify({ error: 'Não autorizado', login: true }), { status: 401, headers: { 'content-type': 'application/json' } });
  }
  return next();
});
