/** Tela /reserva?code=ODS-XXXXX: resumo do pedido. */
import { api } from './api';
import { href, esc } from './nav';
import { brl, fmtDate, guestsLabel } from './engine-core';
import { getRoom } from '../data/rooms';

export async function mountReserva(app: HTMLElement) {
  const q = new URLSearchParams(location.search);
  const code = (q.get('code') || '').toUpperCase();
  const nova = q.get('nova') === '1';
  const cfg = { wa: app.dataset.wa!, phone: app.dataset.phone!, checkIn: app.dataset.checkin!, checkOut: app.dataset.checkout! };
  let r: any;
  try { r = await api(`/api/reserva?code=${encodeURIComponent(code)}`); }
  catch (e: any) { app.innerHTML = `<h1 class="text-3xl font-extrabold">Reserva não encontrada</h1><p class="mt-3 text-mar/80">${esc(e.message)}</p><a href="${href('/')}" class="btn-linha mt-6 text-sm">Voltar ao início</a>`; return; }
  const room = getRoom(r.room_type);
  const total = r.total_cents / 100;
  const hosp = guestsLabel({ adults: r.adults, kids6: r.kids6, kids7: r.kids7 });
  const statusLabel: Record<string, string> = { pendente: 'Aguardando confirmação da pousada', confirmada: 'Confirmada', cancelada: 'Cancelada' };
  const statusCls = r.status === 'confirmada' ? 'bg-palmeira/15 text-palmeira' : r.status === 'cancelada' ? 'bg-falesia/10 text-falesia' : 'bg-sol/20 text-mar';
  const wa = `https://wa.me/${cfg.wa}?text=${encodeURIComponent(`Olá! Acabei de fazer o pedido de reserva ${code} pelo site: ${room?.name}, ${fmtDate(r.checkin)} a ${fmtDate(r.checkout)}, ${hosp}. Total ${brl(total)}. Como faço o pagamento?`)}`;
  app.innerHTML = `
    <p class="eyebrow">${nova ? 'Pedido recebido' : 'Sua reserva'}</p>
    <h1 class="mt-2 text-3xl font-extrabold md:text-4xl">${nova ? 'Quase lá. Agora é com a gente.' : `Reserva ${esc(code)}`}</h1>
    <p class="mt-3 text-mar/85">${nova ? 'Seu pedido chegou na pousada. Respondemos no WhatsApp com a forma de pagamento. Para agilizar, mande uma mensagem com o código abaixo.' : 'Guarde este código para falar com a pousada.'}</p>
    <div class="ficha mt-6 p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="display text-3xl font-extrabold tracking-wide">${esc(code)}</p>
        <span class="rounded-full px-3 py-1 text-xs font-semibold ${statusCls}">${esc(statusLabel[r.status] || r.status)}</span>
      </div>
      <dl class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt class="text-neblina">Acomodação</dt><dd class="font-semibold">${esc(room?.name)}</dd></div>
        <div><dt class="text-neblina">Hóspedes</dt><dd class="font-semibold">${esc(hosp)}</dd></div>
        <div><dt class="text-neblina">Chegada</dt><dd class="font-semibold">${fmtDate(r.checkin)} a partir das ${cfg.checkIn}</dd></div>
        <div><dt class="text-neblina">Saída</dt><dd class="font-semibold">${fmtDate(r.checkout)} até ${cfg.checkOut}</dd></div>
        <div><dt class="text-neblina">Nome</dt><dd class="font-semibold">${esc(r.guest_name)}</dd></div>
        <div><dt class="text-neblina">Total com café</dt><dd class="text-xl font-extrabold">${brl(total)}</dd></div>
      </dl>
      ${r.notes ? `<p class="mt-4 text-sm text-mar/80"><span class="text-neblina">Observação:</span> ${esc(r.notes)}</p>` : ''}
    </div>
    ${r.status !== 'cancelada' ? `<a href="${wa}" class="btn-sol mt-6 w-full sm:w-auto" data-origem="confirmacao" target="_blank" rel="noopener">Enviar o código pelo WhatsApp</a>` : ''}
    <div class="mt-8 rounded-[var(--radius-ficha)] bg-areia-clara p-5 text-sm text-mar/85">
      <p class="font-bold">O que acontece agora</p>
      <ol class="mt-2 list-decimal space-y-1 pl-5">
        <li>A pousada confere o pedido e responde no WhatsApp ${esc(cfg.phone)}.</li>
        <li>Você recebe a chave Pix ou o link de cartão e paga o sinal.</li>
        <li>A reserva muda para "Confirmada" e você recebe as instruções de chegada.</li>
      </ol>
    </div>
    <p class="mt-6 text-sm"><a href="${href('/')}" class="text-mar-claro underline-offset-4 hover:underline">Voltar ao início</a></p>`;
}
