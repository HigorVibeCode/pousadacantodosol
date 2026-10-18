import type { APIRoute } from 'astro';
import { getReservation } from '../../lib/engine';
import { json } from './_json';
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const code = (url.searchParams.get('code') || '').toUpperCase();
  if (!/^ODS-[A-Z0-9]{5}$/.test(code)) return json({ error: 'Código inválido' }, 400);
  const r = await getReservation(code);
  if (!r) return json({ error: 'Reserva não encontrada' }, 404);
  const { id, guest_email, ...pub } = r;
  return json(pub);
};
