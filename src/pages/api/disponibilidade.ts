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
  try {
    const pkgSlug = url.searchParams.get('package') || undefined;
    const quotes = await availability(ci, co, guests, pkgSlug);
    return json({ checkin: ci, checkout: co, ...guests, package: pkgSlug || null, rooms: quotes.map(quoteJson) });
  } catch (e: any) { return json({ error: e?.message || 'Erro' }, 404); }
};
