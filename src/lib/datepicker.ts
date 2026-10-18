/**
 * Calendário de datas com preço e vaga por dia. Substitui o <input type=date> nativo.
 * Um toque marca a chegada, outro a saída. No celular abre como folha no rodapé; no desktop, abaixo dos campos.
 * Também funciona embutido na página (inline), como na página do apartamento.
 */
import { api } from './api';
import { nightPrice, tierFor } from '../data/pricing';
import { rooms, type Room } from '../data/rooms';
import { addDays, nightsBetween, todayIso } from './engine-core';

type Day = { date: string; available: number; past: boolean };
const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const brl = (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
export const fmtShort = (iso: string) => {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '').replace('.', '');
};

/** Menor diária base para 2 pessoas numa data (ou de um tipo específico). */
function dayPrice(date: string, room?: Room) {
  const list = room ? [room] : rooms;
  const stay = tierFor(date).minNights >= 4 ? 4 : 2;
  return Math.min(...list.map((r) => nightPrice(r.slug, date, { adults: 2, kids6: 0, kids7: 0 }, stay).base));
}

export type PickerOpts = {
  /** inputs escondidos que recebem as datas ISO */
  checkin: HTMLInputElement;
  checkout: HTMLInputElement;
  /** botões que mostram as datas escolhidas (modo popover) */
  triggers?: { checkin: HTMLElement; checkout: HTMLElement };
  /** onde desenhar (modo inline) */
  mount?: HTMLElement;
  room?: Room;
  onChange?: () => void;
};

export function createPicker(o: PickerOpts) {
  const inline = !!o.mount;
  const today = todayIso();
  let view = (o.checkin.value || today).slice(0, 7); // AAAA-MM
  let picking: 'in' | 'out' = 'in';
  const avail = new Map<string, Day>();
  const loading = new Set<string>();

  const el = document.createElement('div');
  el.className = inline ? 'ficha p-4 text-mar' : 'picker-sheet ficha p-4 text-mar';
  if (!inline) el.hidden = true;
  (o.mount || o.triggers!.checkin.closest('form')!).appendChild(el);

  const label = (which: 'in' | 'out') => {
    const v = which === 'in' ? o.checkin.value : o.checkout.value;
    const t = which === 'in' ? o.triggers?.checkin : o.triggers?.checkout;
    if (t) {
      t.querySelector('[data-val]')!.textContent = v ? fmtShort(v) : which === 'in' ? 'Escolher' : 'Escolher';
      t.classList.toggle('has-value', !!v);
    }
  };

  async function fetchMonth(ym: string) {
    if (loading.has(ym)) return;
    loading.add(ym);
    const room = o.room?.slug || rooms[0].slug;
    try {
      const slugs = o.room ? [o.room.slug] : rooms.map((r) => r.slug);
      const results = await Promise.all(slugs.map((s) => api(`/api/calendario?room=${s}&month=${ym}`)));
      // vaga = soma das vagas dos tipos considerados
      const byDate = new Map<string, number>();
      for (const r of results) for (const d of r.days) byDate.set(d.date, (byDate.get(d.date) || 0) + d.available);
      for (const [date, available] of byDate) avail.set(date, { date, available, past: date < today });
      void room;
    } catch { /* sem rede: mostra só preços */ }
    if (view === ym) render();
  }

  function render() {
    const [y, m] = view.split('-').map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const days = nightsBetween(`${view}-01`, m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`);
    const ci = o.checkin.value, co = o.checkout.value;
    const n = ci && co ? nightsBetween(ci, co).length : 0;
    const minN = ci ? Math.max(...(co ? nightsBetween(ci, co) : [ci]).map((d) => tierFor(d).minNights)) : 1;
    const est = ci && co ? nightsBetween(ci, co).reduce((s, d) => s + dayPrice(d, o.room), 0) : 0;
    const canPrev = view > today.slice(0, 7);
    el.innerHTML = `
      <div class="flex items-center justify-between">
        <button type="button" class="btn-linha !px-3 !py-1.5 text-sm" data-prev ${canPrev ? '' : 'disabled'} aria-label="Mês anterior">‹</button>
        <p class="font-bold capitalize">${MONTHS[m - 1]} ${y}</p>
        <button type="button" class="btn-linha !px-3 !py-1.5 text-sm" data-next aria-label="Próximo mês">›</button>
      </div>
      <p class="mt-2 text-center text-xs font-semibold text-mar-claro" data-hint>${!ci ? 'Toque no dia da chegada' : !co ? 'Agora toque no dia da saída' : `${n} ${n === 1 ? 'noite' : 'noites'}${minN > n ? ` · mínimo de ${minN} nessas datas` : ''}`}</p>
      <div class="mt-2 grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wider text-neblina">${WEEK.map((w) => `<span>${w}</span>`).join('')}</div>
      <div class="mt-1 grid grid-cols-7 gap-1" data-grid>
        ${'<span></span>'.repeat(first)}
        ${days.map((d) => {
          const a = avail.get(d);
          const off = d < today || (a ? a.available < 1 : false);
          const sel = d === ci || d === co;
          const between = ci && co && d > ci && d < co;
          const t = tierFor(d).tier;
          const price = dayPrice(d, o.room);
          const cls = [
            'flex min-h-11 flex-col items-center justify-center rounded-lg border text-[10px] leading-tight transition',
            off ? 'cursor-not-allowed border-transparent bg-mar/5 text-neblina/60 line-through' : 'border-mar/10 hover:border-mar/50',
            !off && t !== 'baixa' ? 'bg-sol/15' : '',
            sel ? '!bg-mar !text-espuma !border-mar' : between ? '!bg-mar/15' : '',
          ].join(' ');
          const title = off ? (d < today ? 'Data passada' : 'Sem vaga') : `${brl(price)} por noite${a ? ` · ${a.available} vaga(s)` : ''}`;
          return `<button type="button" data-day="${d}" class="${cls}" ${off ? 'disabled' : ''} title="${title}"><span class="text-sm font-bold">${+d.slice(-2)}</span><span>${off ? '' : brl(price)}</span></button>`;
        }).join('')}
      </div>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-mar/10 pt-3 text-xs text-neblina">
        <span><span class="inline-block h-2.5 w-2.5 rounded-sm bg-sol/60 align-middle"></span> temporada · <span class="inline-block h-2.5 w-2.5 rounded-sm bg-mar/10 align-middle"></span> sem vaga${o.room ? '' : ' · preços a partir de, para 2 pessoas'}</span>
        ${est ? `<span class="font-semibold text-mar">a partir de ${brl(est)}</span>` : ''}
      </div>
      ${inline ? '' : `<div class="mt-3 flex gap-2"><button type="button" class="btn-linha !py-2 text-sm" data-clear>Limpar</button><button type="button" class="btn-sol !py-2 flex-1 text-sm" data-ok ${n > 0 ? '' : 'disabled'}>Confirmar datas</button></div>`}
    `;
    if (!avail.has(`${view}-01`) && !avail.has(`${view}-15`)) fetchMonth(view);
    label('in'); label('out');
  }

  function pick(d: string) {
    const ci = o.checkin.value;
    if (picking === 'in' || !ci || d <= ci) { o.checkin.value = d; o.checkout.value = ''; picking = 'out'; }
    else {
      // bloqueia se houver dia sem vaga no meio
      const blocked = nightsBetween(ci, d).some((x) => (avail.get(x)?.available ?? 1) < 1);
      if (blocked) { o.checkin.value = d; o.checkout.value = ''; picking = 'out'; }
      else { o.checkout.value = d; picking = 'in'; }
    }
    o.checkin.dispatchEvent(new Event('change'));
    o.checkout.dispatchEvent(new Event('change'));
    o.onChange?.();
    render();
    if (inline && o.checkin.value && o.checkout.value) o.checkin.closest('form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  el.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
    if (!t || t.disabled) return;
    if (t.dataset.day) pick(t.dataset.day);
    else if (t.hasAttribute('data-prev')) { view = addDays(`${view}-01`, -1).slice(0, 7); render(); }
    else if (t.hasAttribute('data-next')) { const [y, m] = view.split('-').map(Number); view = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`; render(); }
    else if (t.hasAttribute('data-clear')) { o.checkin.value = ''; o.checkout.value = ''; picking = 'in'; o.onChange?.(); render(); }
    else if (t.hasAttribute('data-ok')) close();
  });

  function open(which: 'in' | 'out') {
    picking = which === 'out' && o.checkin.value ? 'out' : 'in';
    if (o.checkin.value) view = o.checkin.value.slice(0, 7);
    render();
    el.hidden = false;
    document.body.classList.add('picker-open');
    setTimeout(() => document.addEventListener('click', outside), 0);
  }
  function close() {
    el.hidden = true;
    document.body.classList.remove('picker-open');
    document.removeEventListener('click', outside);
  }
  function outside(e: Event) {
    // usa o caminho do evento: o alvo pode ter sido redesenhado antes de o clique chegar aqui
    const path = e.composedPath();
    if (path.includes(el) || (o.triggers && (path.includes(o.triggers.checkin) || path.includes(o.triggers.checkout)))) return;
    close();
  }

  if (o.triggers) {
    o.triggers.checkin.addEventListener('click', () => (el.hidden ? open('in') : close()));
    o.triggers.checkout.addEventListener('click', () => (el.hidden ? open('out') : close()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }
  render();
  return { open, close, render };
}
