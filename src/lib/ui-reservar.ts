/** Tela /reservar: resultados por apartamento e dados do hóspede. Renderiza no navegador. */
import { api, post } from './api';
import { href, esc } from './nav';
import { brl, fmtDate, guestsLabel, parseGuests, isIso, todayIso, extrasTotal } from './engine-core';
import { extras as pricingExtras } from '../data/pricing';
import { extras as addons } from '../data/extras';
import { getPackage } from '../data/packages';
import { initBooking } from './booking';

const waLink = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

export async function mountReservar(app: HTMLElement) {
  const q = new URLSearchParams(location.search);
  const ci = q.get('checkin') || '', co = q.get('checkout') || '';
  const guests = parseGuests((k) => q.get(k));
  const chosen = q.get('room') || '';
  const pkgSlug = q.get('package') || '';
  const pkg = pkgSlug ? getPackage(pkgSlug) : undefined;
  const cfg = { wa: app.dataset.wa!, checkIn: app.dataset.checkin!, checkOut: app.dataset.checkout! };
  const params: Record<string, string | number> = { checkin: ci, checkout: co, adults: guests.adults, kids6: guests.kids6, kids7: guests.kids7 };
  if (pkg) params.package = pkg.slug;
  const validDates = isIso(ci) && isIso(co) && co > ci && ci >= todayIso();
  const gl = guestsLabel(guests);
  const backHref = pkg ? href('/pacotes/' + pkg.slug) : href('/reservar');

  const steps = (step: number) => `
    <ol class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neblina" aria-label="Etapas">
      ${['Datas', 'Acomodação', 'Seus dados'].map((s, i) => `
        <li class="flex items-center gap-2 ${step === i + 1 ? 'text-mar' : ''}">
          <span class="grid h-6 w-6 place-items-center rounded-full text-[11px] ${step > i + 1 ? 'bg-palmeira text-white' : step === i + 1 ? 'bg-sol text-mar-fundo' : 'bg-mar/10'}">${step > i + 1 ? '✓' : i + 1}</span>${s}
          ${i < 2 ? '<span class="mx-1 h-px w-6 bg-mar/15"></span>' : ''}
        </li>`).join('')}
    </ol>
    ${pkg ? `<p class="mt-3 inline-flex items-center gap-2 rounded-full bg-sol/20 px-3 py-1 text-xs font-semibold text-mar">Pacote: ${esc(pkg.name)} <a href="${href('/pacotes/' + pkg.slug)}" class="underline underline-offset-2 font-normal">ver detalhes</a></p>` : ''}`;
  const alert = (m: string) => `<p class="mt-4 rounded-lg bg-falesia/10 px-3 py-2 text-sm text-falesia">${esc(m)}</p>`;

  // Etapa 1: datas
  if (!validDates) {
    const tpl = document.getElementById('tpl-booking') as HTMLTemplateElement;
    app.innerHTML = `${steps(1)}<div class="mt-6"><h1 class="text-3xl font-extrabold md:text-4xl">Quando você vem?</h1>
      <p class="mt-2 text-mar/80">Escolha as datas e o número de hóspedes. Você vê preço e vaga na hora.</p>
      ${(ci || co) ? alert('Confira as datas: a saída precisa ser depois da chegada, e a chegada não pode estar no passado.') : ''}
      ${pkg ? `<p class="mt-3 text-sm"><a href="${href('/pacotes/' + pkg.slug)}" class="text-mar-claro underline-offset-4 hover:underline">Escolher as datas na página do pacote</a></p>` : ''}
      <div class="mt-6" data-form></div></div>`;
    const holder = app.querySelector('[data-form]')!;
    holder.appendChild(tpl.content.cloneNode(true));
    const form = holder.querySelector<HTMLFormElement>('form[data-booking]')!;
    if (pkg) { const i = document.createElement('input'); i.type = 'hidden'; i.name = 'package'; i.value = pkg.slug; form.appendChild(i); }
    initBooking(form, JSON.parse(form.dataset.cfg || '{}'));
    return;
  }

  // Etapa 2 e 3: consulta
  app.innerHTML = `${steps(2)}<p class="mt-8 text-sm text-neblina">Consultando preço e vaga…</p>`;
  let data: any;
  try { data = await api(`/api/disponibilidade?${new URLSearchParams(params as any)}`); }
  catch (e: any) { app.innerHTML = `${steps(2)}${alert(e.message)}<a href="${backHref}" class="btn-linha mt-4 text-sm">Mudar datas</a>`; return; }
  const rooms: any[] = data.rooms;
  const n = rooms[0]?.nightsCount || 0;
  const selected = chosen ? rooms.find((r) => r.slug === chosen && r.ok) : null;

  const priceBlock = (x: any) => x.pkg
    ? `<p class="text-xs text-neblina">Hospedagem ${brl(x.pkg.lodging)}${x.pkg.discount ? ` − ${brl(x.pkg.discount)} de desconto` : ''} + passeios e extras ${brl(x.pkg.extras + x.pkg.perReservation)}</p><p class="text-2xl font-extrabold">${brl(x.total)} <span class="text-xs font-normal text-neblina">pacote completo</span></p>`
    : `<p class="text-xs text-neblina">${x.nightsCount} ${x.nightsCount === 1 ? 'noite' : 'noites'} · ${brl(x.total / x.nightsCount)} por noite${x.extraPerNight ? ` (inclui ${brl(x.extraPerNight)} de cama extra)` : ''}</p><p class="text-2xl font-extrabold">${brl(x.total)} <span class="text-xs font-normal text-neblina">total</span></p>`;

  if (!selected) {
    const ok = rooms.filter((r) => r.ok);
    const waAlt = waLink(cfg.wa, `Olá! Procurei no site de ${fmtDate(ci)} a ${fmtDate(co)} para ${gl}${pkg ? `, pacote ${pkg.name},` : ''} e quero ajuda para encontrar uma opção.`);
    app.innerHTML = `${steps(2)}
      <div class="mt-6">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div><h1 class="text-3xl font-extrabold md:text-4xl">${fmtDate(ci)} a ${fmtDate(co)}</h1>
          <p class="mt-1 text-mar/80">${n} ${n === 1 ? 'noite' : 'noites'} · ${esc(gl)} · café da manhã incluso</p></div>
          <a href="${backHref}" class="btn-linha !py-2 !px-4 text-sm">Mudar datas</a>
        </div>
        ${q.get('erro') ? alert(q.get('erro')!) : ''}
        <ul class="mt-6 space-y-4">
          ${rooms.map((x) => `
            <li class="ficha overflow-hidden md:flex ${x.ok ? '' : 'opacity-60'}">
              <div class="foto-placeholder relative aspect-[4/3] md:w-56 md:shrink-0 md:aspect-auto"><img src="${href('/')}${esc(x.photo.src.replace(/^\//, ''))}" alt="${esc(x.photo.alt)}" class="h-full w-full object-cover" loading="lazy" onerror="this.remove()" /></div>
              <div class="flex flex-1 flex-col p-5">
                <div class="flex items-start justify-between gap-3">
                  <div><h2 class="text-xl font-bold">${esc(x.name)}</h2><p class="text-sm text-neblina">${esc(x.beds)}</p></div>
                  ${x.ok && x.available <= 2 ? `<span class="rounded-full bg-falesia/10 px-2.5 py-1 text-xs font-semibold text-falesia">${x.available === 1 ? 'Última vaga' : `Restam ${x.available}`}</span>` : ''}
                </div>
                <p class="mt-2 line-clamp-2 text-sm text-mar/80">${esc(x.description)}</p>
                <div class="mt-4 flex flex-wrap items-end justify-between gap-3">
                  <div>${x.ok ? priceBlock(x) : `<p class="text-sm font-semibold text-falesia">${esc(x.reason)}</p>`}</div>
                  ${x.ok
                    ? `<a href="${href('/reservar', { ...params, room: x.slug })}" class="btn-sol text-sm">Reservar este</a>`
                    : pkg ? '' : `<a href="${href('/acomodacoes/' + x.slug)}" class="btn-linha !py-2 !px-4 text-sm">Ver outras datas</a>`}
                </div>
              </div>
            </li>`).join('')}
        </ul>
        ${ok.length === 0 ? `<div class="mt-6 rounded-[var(--radius-ficha)] bg-areia-clara p-6"><p class="font-bold">Nada disponível para essa combinação.</p><p class="mt-1 text-sm text-mar/80">${pkg ? 'Confira as regras de datas do pacote ou fale com a gente.' : 'Tente outras datas, ou fale com a gente: às vezes conseguimos montar uma opção com dois apartamentos.'}</p><a href="${waAlt}" class="btn-mar mt-4 text-sm" data-origem="sem-vaga">Pedir ajuda no WhatsApp</a></div>` : ''}
        <p class="mt-6 text-xs text-neblina">Valores em reais, por apartamento, com café da manhã. Sem taxa de serviço. ${pkg ? 'Valores estimados; a pousada confirma no WhatsApp.' : `Cama extra: ${brl(pricingExtras.child6)} por noite até 6 anos, ${brl(pricingExtras.person)} acima disso.`}</p>
      </div>`;
    return;
  }

  // Etapa 3: dados do hóspede (+ extras avulsos quando não é pacote)
  const r = selected;
  const chosenExtras = new Set<string>();
  const renderSummary = () => {
    const ex = pkg ? { items: [], total: 0 } : extrasTotal([...chosenExtras], guests);
    const total = r.total + ex.total;
    return `
      <p class="eyebrow">Resumo</p>
      <p class="mt-2 text-lg font-bold">${esc(r.name)}</p>
      <p class="text-sm text-neblina">${esc(r.beds)}</p>
      ${pkg ? `<p class="mt-2 inline-block rounded-full bg-sol/20 px-2.5 py-0.5 text-xs font-semibold">Pacote ${esc(pkg.name)}</p>` : ''}
      <dl class="mt-4 space-y-2 text-sm">
        <div class="flex justify-between"><dt class="text-neblina">Chegada</dt><dd class="font-semibold">${fmtDate(ci)} às ${cfg.checkIn}</dd></div>
        <div class="flex justify-between"><dt class="text-neblina">Saída</dt><dd class="font-semibold">${fmtDate(co)} até ${cfg.checkOut}</dd></div>
        <div class="flex justify-between"><dt class="text-neblina">Hóspedes</dt><dd class="font-semibold text-right">${esc(gl)}</dd></div>
      </dl>
      ${r.pkg ? `<dl class="mt-4 space-y-1 border-t border-mar/10 pt-3 text-sm">
        <div class="flex justify-between"><dt class="text-neblina">Hospedagem (${r.nightsCount} noites)</dt><dd>${brl(r.pkg.lodging)}</dd></div>
        ${r.pkg.discount ? `<div class="flex justify-between text-palmeira"><dt>Desconto do pacote</dt><dd>− ${brl(r.pkg.discount)}</dd></div>` : ''}
        ${r.pkg.child6Free ? `<div class="flex justify-between text-palmeira"><dt>Cama extra até 6 anos</dt><dd>grátis</dd></div>` : ''}
        <div class="flex justify-between"><dt class="text-neblina">Extras do pacote</dt><dd>${brl(r.pkg.extras)}</dd></div>
        ${r.pkg.perReservation ? `<div class="flex justify-between"><dt class="text-neblina">Mimos no quarto</dt><dd>${brl(r.pkg.perReservation)}</dd></div>` : ''}
      </dl>` : `<details class="mt-4 text-sm"><summary class="flex items-center justify-between font-semibold">${r.nightsCount} ${r.nightsCount === 1 ? 'noite' : 'noites'} <span class="text-mar-claro text-xs">ver por dia</span></summary>
        <ul class="mt-2 space-y-1 text-neblina">${r.nights.map((x: any) => `<li class="flex justify-between"><span>${fmtDate(x.date)}</span><span>${brl(x.price)}${x.extra || x.surcharge ? `<span class="text-[11px]"> (${brl(x.base)}${x.extra ? ` + ${brl(x.extra)} extra` : ''}${x.surcharge ? ` + ${brl(x.surcharge)}` : ''})</span>` : ''}</span></li>`).join('')}</ul>
      </details>
      ${ex.items.length ? `<ul class="mt-3 space-y-1 border-t border-mar/10 pt-3 text-sm">${ex.items.map((i) => `<li class="flex justify-between"><span class="text-neblina">${esc(i.name)}${i.qty > 1 ? ` × ${i.qty}` : ''}</span><span>${brl(i.subtotal)}</span></li>`).join('')}</ul>` : ''}`}
      <div class="mt-4 flex items-baseline justify-between border-t border-mar/10 pt-4"><span class="font-semibold">Total</span><span class="text-2xl font-extrabold" data-total>${brl(total)}</span></div>
      <p class="mt-1 text-xs text-neblina">Café da manhã e estacionamento inclusos.</p>
      <a href="${href('/reservar', params)}" class="mt-4 inline-block text-sm text-mar-claro underline-offset-4 hover:underline">Trocar acomodação</a>`;
  };

  app.innerHTML = `${steps(3)}
    <div class="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
      <form class="ficha p-5 md:p-6" data-guest novalidate>
        <h1 class="text-2xl font-extrabold md:text-3xl">Quem vai se hospedar?</h1>
        <p class="mt-1 text-sm text-mar/80">Só o essencial. A confirmação chega no seu WhatsApp.</p>
        <div data-erro></div>
        <div class="mt-5 grid gap-4">
          <div><label class="rotulo" for="name">Nome completo</label><input class="campo" id="name" name="name" required minlength="3" autocomplete="name" /></div>
          <div><label class="rotulo" for="phone">WhatsApp com DDD</label><input class="campo" id="phone" name="phone" required inputmode="tel" autocomplete="tel" placeholder="(31) 99999-9999" /></div>
          <div><label class="rotulo" for="email">E-mail <span class="font-normal normal-case tracking-normal">(opcional)</span></label><input class="campo" id="email" name="email" type="email" autocomplete="email" /></div>
          <div><label class="rotulo" for="notes">Alguma observação? <span class="font-normal normal-case tracking-normal">(horário de chegada, pet, cama extra)</span></label><textarea class="campo" id="notes" name="notes" rows="3"></textarea></div>
        </div>
        ${pkg ? '' : `
        <fieldset class="mt-6 rounded-xl border border-mar/10 p-4">
          <legend class="px-1 text-sm font-bold">Quer incluir algo? <span class="font-normal text-neblina">(opcional)</span></legend>
          <ul class="mt-2 space-y-2">
            ${addons.map((a) => `<li><label class="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-espuma">
              <input type="checkbox" name="extras" value="${a.id}" class="mt-1 h-4 w-4 accent-[var(--color-sol)]" />
              <span class="flex-1"><span class="font-semibold">${esc(a.name)}</span> <span class="text-sm text-neblina">· ${brl(a.price)} por ${a.per}</span><br /><span class="text-xs text-neblina">${esc(a.text)}</span></span>
            </label></li>`).join('')}
          </ul>
        </fieldset>`}
        <button type="submit" class="btn-sol mt-6 w-full">Confirmar pedido de reserva</button>
        <p class="mt-3 text-xs text-neblina">Ao enviar, a pousada recebe o pedido e responde no WhatsApp com a forma de pagamento (Pix ou cartão). Nada é cobrado agora.</p>
      </form>
      <aside class="ficha h-fit p-5 md:sticky md:top-24" data-summary>${renderSummary()}</aside>
    </div>`;
  const form = app.querySelector<HTMLFormElement>('form[data-guest]')!;
  const errBox = form.querySelector<HTMLElement>('[data-erro]')!;
  form.querySelectorAll<HTMLInputElement>('input[name=extras]').forEach((c) => c.addEventListener('change', () => {
    c.checked ? chosenExtras.add(c.value) : chosenExtras.delete(c.value);
    app.querySelector('[data-summary]')!.innerHTML = renderSummary();
  }));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
    btn.disabled = true; btn.textContent = 'Enviando…'; errBox.innerHTML = '';
    try {
      const res = await post('/api/reservas', { room: r.slug, ...params, name: f.get('name'), phone: f.get('phone'), email: f.get('email'), notes: f.get('notes'), extras: [...chosenExtras].join(',') });
      window.dataLayer?.push({ event: 'reserva_pedido', codigo: res.code, total: r.total, pacote: pkg?.slug || '' });
      location.href = href('/reserva', { code: res.code, nova: 1 });
    } catch (err: any) {
      errBox.innerHTML = alert(err.message); btn.disabled = false; btn.textContent = 'Confirmar pedido de reserva';
      errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}
