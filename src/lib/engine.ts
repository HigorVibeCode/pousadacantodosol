/**
 * Regras do motor de reservas: noites, preço, vagas, cotação e criação de reserva.
 */
import { getDb } from './db';
import { rooms, getRoom, type Room } from '../data/rooms';
import { nightPrice, tierFor, type Guests } from '../data/pricing';
export type { Guests };

export const ACTIVE = ['pendente', 'confirmada'];

export const isIso = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
export const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bahia' });
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const nightsBetween = (ci: string, co: string): string[] => {
  const out: string[] = [];
  for (let d = ci; d < co; d = addDays(d, 1)) out.push(d);
  return out;
};
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`;
};
export const fmtDateLong = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' });
export const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export type Quote = {
  room: Room;
  nights: { date: string; price: number; base: number; extra: number; surcharge: number; tier: string }[];
  extraPerNight: number;
  surchargeTotal: number;
  total: number;
  minNights: number;
  nightsCount: number;
  available: number;
  fits: boolean;
  ok: boolean;
  reason?: string;
};

/** Unidades ocupadas por categoria e noite no intervalo (reservas ativas + bloqueios). */
async function occupancy(ci: string, co: string): Promise<Map<string, Map<string, number>>> {
  const db = await getDb();
  const map = new Map<string, Map<string, number>>();
  const bump = (room: string, date: string, n: number) => {
    if (!map.has(room)) map.set(room, new Map());
    const m = map.get(room)!; m.set(date, (m.get(date) || 0) + n);
  };
  const res = await db.query<{ room_type: string; checkin: string; checkout: string }>(
    `SELECT room_type, checkin, checkout FROM reservations WHERE status = ANY($1) AND checkin < $2 AND checkout > $3`,
    [ACTIVE, co, ci],
  );
  for (const r of res) for (const d of nightsBetween(r.checkin, r.checkout)) if (d >= ci && d < co) bump(r.room_type, d, 1);
  const blk = await db.query<{ room_type: string; start_date: string; end_date: string; qty: number }>(
    `SELECT room_type, start_date, end_date, qty FROM blocks WHERE start_date < $1 AND end_date > $2`,
    [co, ci],
  );
  for (const b of blk) for (const d of nightsBetween(b.start_date, b.end_date)) if (d >= ci && d < co) bump(b.room_type, d, b.qty);
  return map;
}

export function quoteRoom(room: Room, ci: string, co: string, guests: Guests, available: number): Quote {
  const dates = nightsBetween(ci, co);
  const nights = dates.map((date) => ({ date, ...nightPrice(room.slug, date, guests, dates.length) }));
  const total = nights.reduce((s, n) => s + n.price, 0);
  const minNights = Math.max(...dates.map((d) => tierFor(d).minNights), 1);
  const people = guests.adults + guests.kids6 + guests.kids7;
  const fits = guests.adults >= 1 && people <= room.maxOccupancy;
  let reason: string | undefined;
  if (!fits) reason = `Cabe até ${room.maxOccupancy} pessoas por apartamento`;
  else if (dates.length < minNights) reason = `Mínimo de ${minNights} noites nessas datas`;
  else if (available < 1) reason = 'Sem vaga nessas datas';
  return { room, nights, total, minNights, nightsCount: dates.length, available, fits, ok: !reason, reason, extraPerNight: nights[0]?.extra || 0, surchargeTotal: nights.reduce((s, n) => s + n.surcharge, 0) };
}

export async function availability(ci: string, co: string, guests: Guests): Promise<Quote[]> {
  const occ = await occupancy(ci, co);
  const dates = nightsBetween(ci, co);
  return rooms.map((room) => {
    const m = occ.get(room.slug);
    const available = Math.min(...dates.map((d) => room.units - (m?.get(d) || 0)), room.units);
    return quoteRoom(room, ci, co, guests, Math.max(0, available));
  });
}

/** Calendário mensal de uma categoria: preço e vagas por dia. */
export async function calendar(roomSlug: string, year: number, month: number) {
  const room = getRoom(roomSlug);
  if (!room) return null;
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const occ = await occupancy(start, end);
  const m = occ.get(room.slug);
  const today = todayIso();
  const two: Guests = { adults: 2, kids6: 0, kids7: 0 };
  return nightsBetween(start, end).map((date) => {
    const t = tierFor(date);
    // preço de referência: 2 pessoas, estadia de 4 noites nos pacotes (diária sem acréscimo de pernoite)
    const p = nightPrice(room.slug, date, two, t.minNights >= 4 ? 4 : 2);
    return { date, price: p.base, tier: t.tier, season: t.season, minNights: t.minNights, available: Math.max(0, room.units - (m?.get(date) || 0)), past: date < today };
  });
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newCode() {
  let s = '';
  for (let i = 0; i < 5; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return `ODS-${s}`;
}

export type NewReservation = {
  room: string; checkin: string; checkout: string; adults: number; kids6: number; kids7: number;
  name: string; phone: string; email?: string; notes?: string;
};

export async function createReservation(input: NewReservation) {
  const room = getRoom(input.room);
  if (!room) throw new Error('Categoria inválida.');
  if (!isIso(input.checkin) || !isIso(input.checkout) || input.checkout <= input.checkin) throw new Error('Datas inválidas.');
  if (input.checkin < todayIso()) throw new Error('A data de chegada já passou.');
  const [q] = (await availability(input.checkin, input.checkout, input)).filter((x) => x.room.slug === room.slug);
  if (!q.ok) throw new Error(q.reason || 'Sem disponibilidade.');
  const db = await getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    try {
      const [row] = await db.query(
        `INSERT INTO reservations (code, room_type, checkin, checkout, adults, kids6, kids7, guest_name, guest_phone, guest_email, total_cents, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [code, room.slug, input.checkin, input.checkout, input.adults, input.kids6, input.kids7, input.name.trim(), input.phone.trim(), input.email?.trim() || null, Math.round(q.total * 100), input.notes?.trim() || null],
      );
      return { reservation: row, quote: q };
    } catch (e: any) {
      if (!/unique|duplicate/i.test(String(e?.message))) throw e;
    }
  }
  throw new Error('Não foi possível gerar o código da reserva. Tente de novo.');
}

export async function getReservation(code: string) {
  const db = await getDb();
  const [row] = await db.query(`SELECT * FROM reservations WHERE code = $1`, [code.toUpperCase()]);
  return row || null;
}

export async function listReservations(opts: { from?: string; status?: string } = {}) {
  const db = await getDb();
  const where: string[] = []; const params: unknown[] = [];
  if (opts.from) { params.push(opts.from); where.push(`checkout > $${params.length}`); }
  if (opts.status) { params.push(opts.status); where.push(`status = $${params.length}`); }
  return db.query(`SELECT * FROM reservations ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY checkin ASC, created_at DESC LIMIT 300`, params);
}

export async function setStatus(id: number, status: 'pendente' | 'confirmada' | 'cancelada') {
  const db = await getDb();
  await db.query(`UPDATE reservations SET status = $1 WHERE id = $2`, [status, id]);
}

export async function addBlock(b: { room: string; start: string; end: string; qty: number; reason?: string }) {
  if (!getRoom(b.room)) throw new Error('Categoria inválida.');
  if (!isIso(b.start) || !isIso(b.end) || b.end <= b.start) throw new Error('Datas inválidas.');
  const db = await getDb();
  await db.query(`INSERT INTO blocks (room_type, start_date, end_date, qty, reason) VALUES ($1,$2,$3,$4,$5)`, [b.room, b.start, b.end, Math.max(1, b.qty | 0), b.reason?.trim() || null]);
}
export async function listBlocks(from: string) {
  const db = await getDb();
  return db.query(`SELECT * FROM blocks WHERE end_date > $1 ORDER BY start_date`, [from]);
}
export async function removeBlock(id: number) {
  const db = await getDb();
  await db.query(`DELETE FROM blocks WHERE id = $1`, [id]);
}

/** Grade de ocupação: vagas por categoria e dia nos próximos N dias. */
export async function occupancyGrid(from: string, days: number) {
  const to = addDays(from, days);
  const occ = await occupancy(from, to);
  const dates = nightsBetween(from, to);
  return {
    dates,
    rows: rooms.map((room) => ({ room, cells: dates.map((d) => ({ date: d, free: Math.max(0, room.units - (occ.get(room.slug)?.get(d) || 0)), units: room.units })) })),
  };
}

export const guestsLabel = (g: Guests) => {
  const parts = [`${g.adults} ${g.adults === 1 ? 'adulto' : 'adultos'}`];
  if (g.kids6) parts.push(`${g.kids6} ${g.kids6 === 1 ? 'criança' : 'crianças'} até 6 anos`);
  if (g.kids7) parts.push(`${g.kids7} ${g.kids7 === 1 ? 'criança' : 'crianças'} de 7 a 12`);
  return parts.join(', ');
};
export const parseGuests = (get: (k: string) => string | null): Guests => ({
  adults: Math.min(4, Math.max(1, parseInt(get('adults') || '2') || 2)),
  kids6: Math.min(3, Math.max(0, parseInt(get('kids6') || '0') || 0)),
  kids7: Math.min(3, Math.max(0, parseInt(get('kids7') || '0') || 0)),
});
