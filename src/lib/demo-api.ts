/** Responde as rotas /api/* no navegador, para a prévia estática. Mesmo núcleo do servidor. */
import { load, save } from './demo-store';
import {
  occupancyFrom, availabilityFrom, calendarFrom, gridFrom, newCode, validateReservation, quoteJson, parseGuests,
  isIso, todayIso, addDays, monthRange, type ReservationRow,
} from './engine-core';
import { getRoom } from '../data/rooms';

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function demoFetch(path: string, init?: RequestInit): Promise<Response> {
  await sleep(150);
  const url = new URL(path, 'http://demo');
  const q = url.searchParams;
  const body: Record<string, string> = init?.body ? JSON.parse(String(init.body)) : {};
  const s = load();
  const occ = (ci: string, co: string) => occupancyFrom(s.reservations, s.blocks, ci, co);
  const p = url.pathname;

  if (p === '/api/disponibilidade') {
    const ci = q.get('checkin') || '', co = q.get('checkout') || '';
    if (!isIso(ci) || !isIso(co) || co <= ci) return json({ error: 'Datas inválidas.' }, 400);
    if (ci < todayIso()) return json({ error: 'A data de chegada já passou.' }, 400);
    const guests = parseGuests((k) => q.get(k));
    return json({ checkin: ci, checkout: co, ...guests, rooms: availabilityFrom(occ(ci, co), ci, co, guests).map(quoteJson) });
  }
  if (p === '/api/calendario') {
    const room = q.get('room') || '';
    const [y, m] = (q.get('month') || '').split('-').map(Number);
    if (!y || !m) return json({ error: 'Mês inválido' }, 400);
    const { start, end } = monthRange(y, m);
    const days = calendarFrom(room, y, m, occ(start, end));
    return days ? json({ room, days }) : json({ error: 'Tipo inválido' }, 404);
  }
  if (p === '/api/reservas') {
    const input = { room: body.room, checkin: body.checkin, checkout: body.checkout, ...parseGuests((k) => body[k]), name: body.name || '', phone: body.phone || '', email: body.email, notes: body.notes };
    try {
      if (!isIso(input.checkin) || !isIso(input.checkout) || input.checkout <= input.checkin) throw new Error('Datas inválidas.');
      const qt = validateReservation(input, availabilityFrom(occ(input.checkin, input.checkout), input.checkin, input.checkout, input));
      const row: ReservationRow = {
        id: ++s.seq, code: newCode(), room_type: qt.room.slug, checkin: input.checkin, checkout: input.checkout,
        adults: input.adults, kids6: input.kids6, kids7: input.kids7, guest_name: input.name.trim(), guest_phone: input.phone.replace(/\D/g, ''),
        guest_email: input.email?.trim() || null, total_cents: Math.round(qt.total * 100), status: 'pendente', notes: input.notes?.trim() || null, created_at: new Date().toISOString(),
      };
      s.reservations.push(row); save(s);
      return json({ code: row.code });
    } catch (e: any) { return json({ error: e.message }, 400); }
  }
  if (p === '/api/reserva') {
    const r = s.reservations.find((x) => x.code === (q.get('code') || '').toUpperCase());
    if (!r) return json({ error: 'Reserva não encontrada' }, 404);
    const { id, guest_email, ...pub } = r; return json(pub);
  }
  if (p === '/api/admin/login') { s.admin = true; save(s); return json({ ok: true, demo: true }); }
  if (p === '/api/admin/logout') { s.admin = false; save(s); return json({ ok: true }); }
  if (p.startsWith('/api/admin/') && !s.admin) return json({ error: 'Não autorizado', login: true }, 401);
  if (p === '/api/admin/painel') {
    const today = todayIso();
    return json({
      today,
      reservations: s.reservations.filter((r) => r.checkout > today).sort((a, b) => a.checkin.localeCompare(b.checkin)),
      blocks: s.blocks.filter((b) => b.end_date > today),
      grid: gridFrom(occ(today, addDays(today, 30)), today, 30),
      dbKind: 'demo',
    });
  }
  if (p === '/api/admin/status') {
    const r = s.reservations.find((x) => x.id === parseInt(body.id));
    if (!r || !['pendente', 'confirmada', 'cancelada'].includes(body.status)) return json({ error: 'Dados inválidos' }, 400);
    r.status = body.status; save(s); return json({ ok: true });
  }
  if (p === '/api/admin/bloqueio') {
    if (body.acao === 'remover') { s.blocks = s.blocks.filter((b) => b.id !== parseInt(body.id)); save(s); return json({ ok: true }); }
    if (!getRoom(body.room)) return json({ error: 'Tipo inválido' }, 400);
    if (!isIso(body.start) || !isIso(body.end) || body.end <= body.start) return json({ error: 'Datas inválidas.' }, 400);
    s.blocks.push({ id: ++s.seq, room_type: body.room, start_date: body.start, end_date: body.end, qty: Math.max(1, parseInt(body.qty) || 1), reason: body.reason?.trim() || null });
    save(s); return json({ ok: true });
  }
  return json({ error: 'Rota desconhecida' }, 404);
}
export { reset as resetStore } from './demo-store';
