import type { APIRoute } from 'astro';
import { availability, isIso, todayIso, parseGuests } from '../../lib/engine';
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const ci = url.searchParams.get('checkin') || '';
  const co = url.searchParams.get('checkout') || '';
  const guests = parseGuests((k) => url.searchParams.get(k));
  if (!isIso(ci) || !isIso(co) || co <= ci) return json({ error: 'Datas inválidas.' }, 400);
  if (ci < todayIso()) return json({ error: 'A data de chegada já passou.' }, 400);
  const quotes = await availability(ci, co, guests);
  return json({ checkin: ci, checkout: co, ...guests, rooms: quotes.map((q) => ({ slug: q.room.slug, name: q.room.name, available: q.available, total: q.total, extraPerNight: q.extraPerNight, nights: q.nights, minNights: q.minNights, ok: q.ok, reason: q.reason })) });
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
