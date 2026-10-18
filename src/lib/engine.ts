/**
 * Motor de reservas no servidor: banco + núcleo puro (engine-core).
 */
import { getDb } from './db';
import { getRoom } from '../data/rooms';
import {
  occupancyFrom, availabilityFrom, calendarFrom, gridFrom, newCode, validateReservation, todayIso, isIso, addDays, monthRange,
  type Guests, type NewReservation, type ReservationRow, type BlockRow,
} from './engine-core';
export * from './engine-core';

async function occupancy(ci: string, co: string) {
  const db = await getDb();
  const res = await db.query<ReservationRow>(`SELECT room_type, checkin, checkout, status FROM reservations WHERE status = ANY($1) AND checkin < $2 AND checkout > $3`, [['pendente', 'confirmada'], co, ci]);
  const blk = await db.query<BlockRow>(`SELECT room_type, start_date, end_date, qty FROM blocks WHERE start_date < $1 AND end_date > $2`, [co, ci]);
  return occupancyFrom(res, blk, ci, co);
}

export async function availability(ci: string, co: string, guests: Guests) {
  return availabilityFrom(await occupancy(ci, co), ci, co, guests);
}

export async function calendar(roomSlug: string, year: number, month: number) {
  if (!getRoom(roomSlug)) return null;
  const { start, end } = monthRange(year, month);
  return calendarFrom(roomSlug, year, month, await occupancy(start, end));
}

export async function createReservation(input: NewReservation) {
  if (!isIso(input.checkin) || !isIso(input.checkout) || input.checkout <= input.checkin) throw new Error('Datas inválidas.');
  const q = validateReservation(input, await availability(input.checkin, input.checkout, input));
  const db = await getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    try {
      const [row] = await db.query<ReservationRow>(
        `INSERT INTO reservations (code, room_type, checkin, checkout, adults, kids6, kids7, guest_name, guest_phone, guest_email, total_cents, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [code, q.room.slug, input.checkin, input.checkout, input.adults, input.kids6, input.kids7, input.name.trim(), input.phone.replace(/\D/g, ''), input.email?.trim() || null, Math.round(q.total * 100), input.notes?.trim() || null],
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
  const [row] = await db.query<ReservationRow>(`SELECT * FROM reservations WHERE code = $1`, [code.toUpperCase()]);
  return row || null;
}

export async function listReservations(opts: { from?: string } = {}) {
  const db = await getDb();
  const params: unknown[] = [];
  let where = '';
  if (opts.from) { params.push(opts.from); where = `WHERE checkout > $1`; }
  return db.query<ReservationRow>(`SELECT * FROM reservations ${where} ORDER BY checkin ASC, created_at DESC LIMIT 300`, params);
}

export async function setStatus(id: number, status: 'pendente' | 'confirmada' | 'cancelada') {
  const db = await getDb();
  await db.query(`UPDATE reservations SET status = $1 WHERE id = $2`, [status, id]);
}

export async function addBlock(b: { room: string; start: string; end: string; qty: number; reason?: string }) {
  if (!getRoom(b.room)) throw new Error('Tipo de apartamento inválido.');
  if (!isIso(b.start) || !isIso(b.end) || b.end <= b.start) throw new Error('Datas inválidas.');
  const db = await getDb();
  await db.query(`INSERT INTO blocks (room_type, start_date, end_date, qty, reason) VALUES ($1,$2,$3,$4,$5)`, [b.room, b.start, b.end, Math.max(1, b.qty | 0), b.reason?.trim() || null]);
}
export async function listBlocks(from: string) {
  const db = await getDb();
  return db.query<BlockRow>(`SELECT * FROM blocks WHERE end_date > $1 ORDER BY start_date`, [from]);
}
export async function removeBlock(id: number) {
  const db = await getDb();
  await db.query(`DELETE FROM blocks WHERE id = $1`, [id]);
}

export async function occupancyGrid(from: string, days: number) {
  return gridFrom(await occupancy(from, addDays(from, days)), from, days);
}

/** Tudo que o painel precisa, em uma chamada. */
export async function adminPanel() {
  const today = todayIso();
  const [reservations, blocks, grid, db] = await Promise.all([listReservations({ from: today }), listBlocks(today), occupancyGrid(today, 30), getDb()]);
  return { today, reservations, blocks, grid, dbKind: db.kind };
}
