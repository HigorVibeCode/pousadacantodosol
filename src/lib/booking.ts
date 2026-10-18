/**
 * Formulário de reserva (datas + hóspedes). Roda no navegador.
 * interno: abre /reservar com datas e hóspedes (motor próprio).
 * whatsapp: monta a mensagem de WhatsApp com datas, hóspedes e categoria.
 * engine: abre o motor de um fornecedor externo com os parâmetros.
 */
import { createPicker } from './datepicker';
import { href } from './nav';
import { getRoom } from '../data/rooms';

type Cfg = { whatsapp: string; mode: 'interno' | 'whatsapp' | 'engine'; engineUrl: string };

const KEY = 'ods:busca';
const fmt = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const nights = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

declare global { interface Window { dataLayer?: Record<string, unknown>[] } }
const track = (event: string, data: Record<string, unknown> = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
};
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
const save = (v: unknown) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* sem storage */ } };
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bahia' });

export function initBooking(form: HTMLFormElement, cfg: Cfg) {
  const ci = form.querySelector<HTMLInputElement>('[name=checkin]')!;
  const co = form.querySelector<HTMLInputElement>('[name=checkout]')!;
  const ad = form.querySelector<HTMLSelectElement>('[name=adults]')!;
  const k6 = form.querySelector<HTMLSelectElement>('[name=kids6]')!;
  const k7 = form.querySelector<HTMLSelectElement>('[name=kids7]')!;
  const room = form.querySelector<HTMLInputElement>('[name=room]');
  const out = form.querySelector<HTMLElement>('[data-noites]');
  const err = form.querySelector<HTMLElement>('[data-erro]');

  // valores vindos da URL (ex.: voltar de /reservar) ou da última busca
  const q = new URLSearchParams(location.search);
  const prev = { ...(load() || {}), ...Object.fromEntries(['checkin', 'checkout', 'adults', 'kids6', 'kids7'].filter((k) => q.get(k)).map((k) => [k, q.get(k)!])) };
  if (prev.checkin && prev.checkin >= today()) ci.value = prev.checkin;
  if (prev.checkout && prev.checkout > ci.value) co.value = prev.checkout;
  if (prev.adults) ad.value = prev.adults;
  if (prev.kids6) k6.value = prev.kids6;
  if (prev.kids7) k7.value = prev.kids7;

  const refresh = () => {
    if (out) {
      const n = ci.value && co.value ? nights(ci.value, co.value) : 0;
      out.textContent = n > 0 ? `${n} ${n === 1 ? 'noite' : 'noites'}` : '';
    }
    if (err) err.hidden = true;
  };
  ci.addEventListener('change', refresh);
  co.addEventListener('change', refresh);
  refresh();

  const roomObj = form.dataset.roomSlug ? getRoom(form.dataset.roomSlug) : undefined;
  const inlineMount = form.querySelector<HTMLElement>('[data-inline-mount]');
  const triggers = { checkin: form.querySelector<HTMLElement>('[data-trigger=checkin]')!, checkout: form.querySelector<HTMLElement>('[data-trigger=checkout]')! };
  const picker = createPicker(inlineMount
    ? { checkin: ci, checkout: co, mount: inlineMount, room: roomObj, onChange: refresh }
    : { checkin: ci, checkout: co, triggers, room: roomObj, onChange: refresh });
  if (inlineMount) {
    triggers.checkin.addEventListener('click', () => inlineMount.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    triggers.checkout.addEventListener('click', () => inlineMount.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!ci.value || !co.value || co.value <= ci.value) {
      if (err) { err.hidden = false; err.textContent = 'Escolha a data de chegada e de saída.'; }
      if (!inlineMount) picker.open(ci.value ? 'out' : 'in');
      return;
    }
    const sel = { checkin: ci.value, checkout: co.value, adults: ad.value, kids6: k6.value, kids7: k7.value };
    save(sel);
    const n = nights(ci.value, co.value);
    const roomName = room?.value || '';
    track('reserva_clique', { modo: cfg.mode, noites: n, adultos: ad.value, criancas: String(+k6.value + +k7.value), categoria: roomName || 'qualquer' });

    if (cfg.mode === 'interno') {
      const p: Record<string, string> = { ...sel };
      if (room?.dataset.slug) p.room = room.dataset.slug;
      window.location.href = href('/reservar', p);
      return;
    }
    if (cfg.mode === 'engine' && cfg.engineUrl) {
      const url = cfg.engineUrl
        .replace('{checkin}', ci.value).replace('{checkout}', co.value)
        .replace('{adults}', ad.value).replace('{children}', String(+k6.value + +k7.value));
      window.open(url, '_blank', 'noopener');
      return;
    }
    const hosp = [`${ad.value} ${ad.value === '1' ? 'adulto' : 'adultos'}`];
    if (k6.value !== '0') hosp.push(`${k6.value} criança(s) até 6 anos`);
    if (k7.value !== '0') hosp.push(`${k7.value} criança(s) de 7 a 12`);
    const linhas = [
      `Olá! Quero reservar na Pousada Orla do Sol.`,
      `Chegada: ${fmt(ci.value)} · Saída: ${fmt(co.value)} (${n} ${n === 1 ? 'noite' : 'noites'})`,
      `Hóspedes: ${hosp.join(' e ')}`,
      roomName ? `Acomodação: ${roomName}` : `Acomodação: a que couber melhor`,
      `Vim pelo site.`,
    ];
    window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener');
  });
}

/** Rastreia cliques em telefone e WhatsApp fora do formulário. */
export function initContactTracking() {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me"], a[href^="tel:"]').forEach((a) => {
    a.addEventListener('click', () => {
      track(a.href.startsWith('tel:') ? 'telefone_clique' : 'whatsapp_clique', { origem: a.dataset.origem || 'link' });
    });
  });
}
