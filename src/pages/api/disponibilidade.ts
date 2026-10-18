import type { APIRoute } from 'astro';
import { availability, isIso, todayIso, parseGuests, quoteJson } from '../../lib/engine';
import { json } from './_json';
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const ci = url.searchParams.get('checkin') || '';
  const co = url.searchParams.get('checkout') || '';
  const guests = parseGuests((k) => url.searchParams.get(k));
  if (!isIso(ci) || !isIso(co) || co <= ci) return json({ error: 'Datas inválidas.' }, 400);
  if (ci < todayIso()) return json({ error: 'A data de chegada já passou.' }, 400);
  const quotes = await availability(ci, co, guests);
  return json({ checkin: ci, checkout: co, ...guests, rooms: quotes.map(quoteJson) });
};
