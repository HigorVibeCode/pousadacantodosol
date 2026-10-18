/** Ajudantes de apresentação dos pacotes (servidor e navegador). */
import type { Package } from '../data/packages';
const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const fmt = (iso: string) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };

export const nightsLabel = (p: Package) => p.nights.length === 1 ? `${p.nights[0]} noites` : `${p.nights.join(' ou ')} noites`;

export function rulesLabel(p: Package) {
  if (p.fixedDates.length) return 'Datas fixas: ' + p.fixedDates.map((f) => f.label).join(' · ');
  const parts = [nightsLabel(p)];
  if (p.startDays.length) parts.push('check-in de ' + p.startDays.map((d) => WEEKDAYS[d]).join(' ou '));
  if (p.windows.length) parts.push(p.windows.length <= 2 ? p.windows.map((w) => `${fmt(w.start)} a ${fmt(w.end)}`).join(' e ') : `${p.windows.length} períodos em 2027`);
  return parts.join(' · ');
}

export const audienceLabel: Record<Package['audience'], string> = { casais: 'Para casais', familia: 'Para famílias', amigos: 'Para grupos de amigos', todos: 'Para todos' };
export const groupLabel: Record<Package['group'], string> = { casais: 'Para casais', familia: 'Para famílias', eventos: 'Eventos e temporadas' };
