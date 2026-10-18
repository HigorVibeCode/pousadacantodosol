import type { APIRoute } from 'astro';
import { calendar } from '../../lib/engine';
import { json } from './_json';
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const room = url.searchParams.get('room') || '';
  const [y, m] = (url.searchParams.get('month') || '').split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return json({ error: 'Mês inválido' }, 400);
  const days = await calendar(room, y, m);
  if (!days) return json({ error: 'Tipo inválido' }, 404);
  return json({ room, month: `${y}-${String(m).padStart(2, '0')}`, days });
};
