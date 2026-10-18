/**
 * Núcleo puro do motor de reservas: sem banco, roda no servidor e no navegador (modo demonstração).
 */
import { rooms, getRoom, type Room } from '../data/rooms';
import { nightPrice, tierFor, extras as pricingExtras, type Guests } from '../data/pricing';
import { getPackage, type Package } from '../data/packages';
import { getExtra } from '../data/extras';
export type { Guests, Package };

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
export const fmtDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
export const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export type ReservationRow = {
  id: number; code: string; room_type: string; checkin: string; checkout: string;
  adults: number; kids6: number; kids7: number; guest_name: string; guest_phone: string; guest_email: string | null;
  total_cents: number; status: string; notes: string | null; created_at: string;
  package?: string | null; extras?: string | null;
};
export type BlockRow = { id: number; room_type: string; start_date: string; end_date: string; qty: number; reason: string | null };

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
  /** presente quando a cotação é de um pacote */
  pkg?: { slug: string; name: string; lodging: number; discount: number; extras: number; perReservation: number; child6Free: number };
};

/** Mapa categoria → noite → unidades ocupadas, a partir de reservas ativas e bloqueios. */
export function occupancyFrom(res: Pick<ReservationRow, 'room_type' | 'checkin' | 'checkout' | 'status'>[], blocks: Pick<BlockRow, 'room_type' | 'start_date' | 'end_date' | 'qty'>[], ci: string, co: string) {
  const map = new Map<string, Map<string, number>>();
  const bump = (room: string, date: string, n: number) => {
    if (!map.has(room)) map.set(room, new Map());
    const m = map.get(room)!; m.set(date, (m.get(date) || 0) + n);
  };
  for (const r of res) if (ACTIVE.includes(r.status) && r.checkin < co && r.checkout > ci)
    for (const d of nightsBetween(r.checkin, r.checkout)) if (d >= ci && d < co) bump(r.room_type, d, 1);
  for (const b of blocks) if (b.start_date < co && b.end_date > ci)
    for (const d of nightsBetween(b.start_date, b.end_date)) if (d >= ci && d < co) bump(b.room_type, d, b.qty);
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

export function availabilityFrom(occ: Map<string, Map<string, number>>, ci: string, co: string, guests: Guests, pkg?: Package | null): Quote[] {
  const dates = nightsBetween(ci, co);
  return rooms.map((room) => {
    const m = occ.get(room.slug);
    const available = Math.min(...dates.map((d) => room.units - (m?.get(d) || 0)), room.units);
    const q = quoteRoom(room, ci, co, guests, Math.max(0, available));
    return pkg ? applyPackage(q, pkg, guests, ci, co) : q;
  });
}

/* ---------- Pacotes ---------- */
const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const weekday = (iso: string) => new Date(iso + 'T12:00:00Z').getUTCDay();

/** Motivo pelo qual as datas não servem para o pacote, ou null se servem. */
export function packageDateIssue(pkg: Package, ci: string, co: string): string | null {
  const n = nightsBetween(ci, co).length;
  if (pkg.fixedDates.length) {
    return pkg.fixedDates.some((f) => f.checkin === ci && f.checkout === co) ? null : 'Este pacote tem datas fixas. Escolha uma das opções.';
  }
  if (!pkg.nights.includes(n)) return `Este pacote é de ${pkg.nights.join(' ou ')} noites.`;
  if (pkg.windows.length && !pkg.windows.some((w) => ci >= w.start && ci <= w.end)) return 'Fora do período deste pacote.';
  if (pkg.startDays.length && !pkg.startDays.includes(weekday(ci))) return `Check-in de ${pkg.startDays.map((d) => WEEKDAYS[d]).join(' ou ')}.`;
  return null;
}

/** Aplica desconto de hospedagem e extras do pacote a uma cotação de apartamento. */
export function applyPackage(q: Quote, pkg: Package, guests: Guests, ci: string, co: string): Quote {
  const nights = q.nightsCount;
  const child6Free = pkg.child6BedFree ? guests.kids6 * pricingExtras.child6 * nights : 0;
  const lodging = q.total - child6Free;
  const discount = Math.round(lodging * pkg.lodgingDiscount);
  const people = guests.adults + guests.kids7;
  const extras = pkg.perPerson * people + pkg.perChild6 * guests.kids6;
  const total = lodging - discount + extras + pkg.perReservation;
  let reason = q.reason;
  if (!pkg.rooms.includes(q.room.slug)) reason = 'Este pacote não inclui este tipo de apartamento.';
  const issue = packageDateIssue(pkg, ci, co);
  if (!reason && issue) reason = issue;
  return { ...q, total, ok: !reason, reason, pkg: { slug: pkg.slug, name: pkg.name, lodging, discount, extras, perReservation: pkg.perReservation, child6Free } };
}

/** "A partir de R$ X por pessoa": menor noite, apartamento mais barato aceito, 2 adultos, primeira data válida. */
export function packageFromPrice(pkg: Package): number {
  const nights = Math.min(...pkg.nights);
  let ci: string;
  if (pkg.fixedDates.length) ci = pkg.fixedDates[pkg.fixedDates.length - 1].checkin;
  else {
    ci = pkg.windows.length ? pkg.windows[0].start : addDays(todayIso(), 30);
    if (pkg.startDays.length) for (let i = 0; i < 7 && !pkg.startDays.includes(weekday(ci)); i++) ci = addDays(ci, 1);
  }
  const dates = nightsBetween(ci, pkg.fixedDates.length ? pkg.fixedDates[pkg.fixedDates.length - 1].checkout : addDays(ci, nights));
  const two: Guests = { adults: 2, kids6: 0, kids7: 0 };
  const lodging = Math.min(...pkg.rooms.map((r) => dates.reduce((s, d) => s + nightPrice(r, d, two, dates.length).price, 0)));
  const total = Math.round(lodging * (1 - pkg.lodgingDiscount)) + pkg.perPerson * 2 + pkg.perReservation;
  return Math.ceil(total / 2 / 10) * 10;
}

/* ---------- Extras avulsos ---------- */
export function extrasTotal(ids: string[], guests: Guests) {
  const people = guests.adults + guests.kids7;
  const items = ids.map((id) => getExtra(id)).filter(Boolean).map((e) => {
    const qty = e!.per === 'pessoa' ? people : 1;
    return { id: e!.id, name: e!.name, price: e!.price, per: e!.per, qty, subtotal: e!.price * qty };
  });
  return { items, total: items.reduce((s, i) => s + i.subtotal, 0) };
}
export const parseExtras = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String).filter((x) => getExtra(x));
  if (typeof v === 'string' && v) return v.split(',').map((x) => x.trim()).filter((x) => getExtra(x));
  return [];
};

export const monthRange = (year: number, month: number) => ({
  start: `${year}-${String(month).padStart(2, '0')}-01`,
  end: month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`,
});

export function calendarFrom(roomSlug: string, year: number, month: number, occ: Map<string, Map<string, number>>, today = todayIso()) {
  const room = getRoom(roomSlug);
  if (!room) return null;
  const { start, end } = monthRange(year, month);
  const m = occ.get(room.slug);
  const two: Guests = { adults: 2, kids6: 0, kids7: 0 };
  return nightsBetween(start, end).map((date) => {
    const t = tierFor(date);
    const p = nightPrice(room.slug, date, two, t.minNights >= 4 ? 4 : 2);
    return { date, price: p.base, tier: t.tier, season: t.season, minNights: t.minNights, available: Math.max(0, room.units - (m?.get(date) || 0)), past: date < today };
  });
}

export function gridFrom(occ: Map<string, Map<string, number>>, from: string, days: number) {
  const dates = nightsBetween(from, addDays(from, days));
  return {
    dates,
    rows: rooms.map((room) => ({ slug: room.slug, name: room.name, units: room.units, cells: dates.map((d) => ({ date: d, free: Math.max(0, room.units - (occ.get(room.slug)?.get(d) || 0)) })) })),
  };
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
  package?: string; extras?: string[];
};

/** Resolve pacote pelo slug; lança se não existir. */
export function resolvePackage(slug?: string): Package | null {
  if (!slug) return null;
  const pkg = getPackage(slug);
  if (!pkg) throw new Error('Pacote não encontrado.');
  return pkg;
}

/** Valida o pedido e devolve a cotação; lança erro com mensagem para o hóspede. */
export function validateReservation(input: NewReservation, quotes: Quote[]) {
  const room = getRoom(input.room);
  if (!room) throw new Error('Tipo de apartamento inválido.');
  if (!isIso(input.checkin) || !isIso(input.checkout) || input.checkout <= input.checkin) throw new Error('Datas inválidas.');
  if (input.checkin < todayIso()) throw new Error('A data de chegada já passou.');
  if (input.name.trim().length < 3) throw new Error('Informe seu nome completo.');
  if (input.phone.replace(/\D/g, '').length < 10) throw new Error('Informe um WhatsApp com DDD.');
  const q = quotes.find((x) => x.room.slug === room.slug);
  if (!q) throw new Error('Tipo de apartamento inválido.');
  if (!q.ok) throw new Error(q.reason || 'Sem disponibilidade.');
  return q;
}

export const guestsLabel = (g: Guests) => {
  const parts = [`${g.adults} ${g.adults === 1 ? 'adulto' : 'adultos'}`];
  if (g.kids6) parts.push(`${g.kids6} ${g.kids6 === 1 ? 'criança' : 'crianças'} até 6 anos`);
  if (g.kids7) parts.push(`${g.kids7} ${g.kids7 === 1 ? 'criança' : 'crianças'} de 7 a 12`);
  return parts.join(', ');
};
export const parseGuests = (get: (k: string) => string | null | undefined): Guests => ({
  adults: Math.min(4, Math.max(1, parseInt(get('adults') || '2') || 2)),
  kids6: Math.min(3, Math.max(0, parseInt(get('kids6') || '0') || 0)),
  kids7: Math.min(3, Math.max(0, parseInt(get('kids7') || '0') || 0)),
});

/** Formato público de uma cotação (JSON das APIs). */
export const quoteJson = (q: Quote) => ({
  slug: q.room.slug, name: q.room.name, short: q.room.short, description: q.room.description, beds: q.room.beds, photo: q.room.photos[0],
  maxOccupancy: q.room.maxOccupancy, available: q.available, total: q.total, extraPerNight: q.extraPerNight, nights: q.nights, nightsCount: q.nightsCount, minNights: q.minNights, ok: q.ok, reason: q.reason,
  pkg: q.pkg,
});
