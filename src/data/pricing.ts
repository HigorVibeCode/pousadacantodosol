/**
 * Tarifário conforme tabela do proprietário (out/2026). Valores em reais por noite, café incluso.
 *
 * Modelo: o apartamento é vendido para 1 ou 2 pessoas; a partir daí entra cama extra:
 *   - criança até 6 anos: R$ 50 por noite
 *   - pessoa acima de 6 anos (criança maior ou adulto): R$ 130 por noite
 * Ano Novo e Carnaval são pacotes de 4 ou 5 noites, com diária diferente para cada duração.
 * Não cobramos taxa de serviço de 10%. Café extra (hóspede ou visita): R$ 30.
 * Fim de semana / balcão / pernoite em temporada: + R$ 20 na diária.
 *
 * TODO confirmar com o proprietário: tarifas de baixa e alta temporada (a tabela só trouxe
 * os feriados), datas exatas dos pacotes, e se estadias acima de 5 noites usam a diária de 5.
 */
export type RoomType = 'com-varanda' | 'normal';
export type Occupancy = 1 | 2;
export type Tier = 'baixa' | 'alta' | 'ano-novo' | 'carnaval';

type Nightly = Record<RoomType, Record<Occupancy, number>>;

/** Diárias fora dos pacotes. TODO: valores de demonstração até o dono confirmar. */
export const nightly: Record<'baixa' | 'alta', Nightly> = {
  baixa: { 'com-varanda': { 1: 220, 2: 280 }, normal: { 1: 200, 2: 240 } },
  alta:  { 'com-varanda': { 1: 300, 2: 380 }, normal: { 1: 270, 2: 330 } },
};

/** Pacotes de feriado: diária por duração (4 noites ou 5 noites), conforme a tabela. */
export const packages: Record<'ano-novo' | 'carnaval', Record<4 | 5, Nightly>> = {
  'ano-novo': {
    4: { 'com-varanda': { 1: 430, 2: 550 }, normal: { 1: 420, 2: 500 } },
    5: { 'com-varanda': { 1: 395, 2: 480 }, normal: { 1: 380, 2: 460 } },
  },
  carnaval: {
    4: { 'com-varanda': { 1: 430, 2: 500 }, normal: { 1: 380, 2: 420 } },
    5: { 'com-varanda': { 1: 395, 2: 450 }, normal: { 1: 350, 2: 390 } },
  },
};

export const extras = {
  child6: 50,   // criança até 6 anos, por noite
  person: 130,  // pessoa acima de 6 anos além das 2 do apartamento, por noite
  breakfastExtra: 30,
  weekendSurcharge: 20,
  serviceFee: 0,
};

/** Períodos. Datas inclusivas (noites), formato AAAA-MM-DD. O primeiro que contém a data vence. */
export const seasons: { name: string; start: string; end: string; tier: Tier; minNights: number }[] = [
  // TODO confirmar datas dos pacotes
  { name: 'Ano Novo',               start: '2026-12-27', end: '2027-01-02', tier: 'ano-novo', minNights: 4 },
  { name: 'Carnaval',               start: '2027-02-05', end: '2027-02-10', tier: 'carnaval', minNights: 4 },
  { name: 'Verão',                  start: '2026-12-15', end: '2027-03-07', tier: 'alta',     minNights: 3 },
  { name: 'Temporada das baleias',  start: '2026-07-01', end: '2026-11-15', tier: 'alta',     minNights: 2 },
  { name: 'Festival Gastronômico',  start: '2026-10-08', end: '2026-11-02', tier: 'alta',     minNights: 2 },
  { name: 'Julho (férias)',         start: '2027-07-01', end: '2027-07-31', tier: 'alta',     minNights: 2 },
];

export function tierFor(date: string): { tier: Tier; minNights: number; season?: string } {
  for (const s of seasons) if (date >= s.start && date <= s.end) return { tier: s.tier, minNights: s.minNights, season: s.name };
  return { tier: 'baixa', minNights: 1 };
}

const isWeekendNight = (date: string) => { const d = new Date(date + 'T12:00:00Z').getUTCDay(); return d === 5 || d === 6; };

export type Guests = { adults: number; kids6: number; kids7: number };

/** Diária base (1 ou 2 pessoas) para uma noite, dado o tipo, a ocupação e a duração da estadia. */
export function baseNightly(room: RoomType, date: string, occupancy: Occupancy, stayNights: number): number {
  const t = tierFor(date).tier;
  if (t === 'ano-novo' || t === 'carnaval') return packages[t][stayNights >= 5 ? 5 : 4][room][occupancy];
  return nightly[t][room][occupancy];
}

/** Preço completo de uma noite, com camas extras e acréscimo de fim de semana/pernoite. */
export function nightPrice(room: RoomType, date: string, guests: Guests, stayNights: number) {
  const persons = guests.adults + guests.kids7;          // contam como "pessoa"
  const occupancy: Occupancy = persons >= 2 ? 2 : 1;
  const extraPersons = Math.max(0, persons - 2);
  const base = baseNightly(room, date, occupancy, stayNights);
  const extra = extraPersons * extras.person + guests.kids6 * extras.child6;
  const t = tierFor(date).tier;
  const surcharge = (stayNights === 1 || (t !== 'baixa' && isWeekendNight(date))) && t !== 'ano-novo' && t !== 'carnaval' ? extras.weekendSurcharge : 0;
  return { base, extra, surcharge, price: base + extra + surcharge, tier: t };
}

/** Menor diária possível (1 pessoa, baixa) e diária de referência (2 pessoas, baixa). */
export const lowestRate = (room: RoomType) => nightly.baixa[room][2];
