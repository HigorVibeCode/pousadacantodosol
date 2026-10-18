/** Armazenamento da demonstração: fica só no navegador (localStorage). */
import { addDays, todayIso, type ReservationRow, type BlockRow } from './engine-core';

const KEY = 'ods:demo:v2';
export type Store = { reservations: ReservationRow[]; blocks: BlockRow[]; seq: number; admin: boolean };

function seed(): Store {
  const t = todayIso();
  const res = (id: number, code: string, room: string, a: number, b: number, status: string, name: string, phone: string, total: number, kids6 = 0): ReservationRow => ({
    id, code, room_type: room, checkin: addDays(t, a), checkout: addDays(t, b), adults: 2, kids6, kids7: 0, guest_name: name, guest_phone: phone,
    guest_email: null, total_cents: total * 100, status, notes: null, created_at: new Date().toISOString(),
  });
  return {
    seq: 10,
    admin: false,
    reservations: [
      res(1, 'ODS-EX4MP', 'com-varanda', 3, 6, 'confirmada', 'Ana Souza (exemplo)', '31988880001', 840),
      res(2, 'ODS-EX7QZ', 'normal', 10, 12, 'pendente', 'Carlos Lima (exemplo)', '62977770002', 580, 1),
    ],
    blocks: [
      { id: 1, room_type: 'com-varanda', start_date: addDays(t, 5), end_date: addDays(t, 7), qty: 8, reason: 'Exemplo: grupo por telefone' },
    ],
  };
}

export function load(): Store {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.reservations) return s; } catch { /* sem storage */ }
  const s = seed(); save(s); return s;
}
export function save(s: Store) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sem storage */ } }
export function reset() { try { localStorage.removeItem(KEY); } catch { /* sem storage */ } }
