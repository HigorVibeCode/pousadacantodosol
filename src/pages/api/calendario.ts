import type { APIRoute } from 'astro';
import { calendar } from '../../lib/engine';
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const room = url.searchParams.get('room') || '';
  const [y, m] = (url.searchParams.get('month') || '').split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return new Response(JSON.stringify({ error: 'Mês inválido' }), { status: 400 });
  const days = await calendar(room, y, m);
  if (!days) return new Response(JSON.stringify({ error: 'Categoria inválida' }), { status: 404 });
  return new Response(JSON.stringify({ room, month: `${y}-${String(m).padStart(2, '0')}`, days }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
};
