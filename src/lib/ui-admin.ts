/** Painel do dono. Renderiza no navegador a partir de /api/admin/painel. */
import { api, post, resetDemo } from './api';
import { href, esc, isDemo } from './nav';
import { brl, fmtDate, addDays } from './engine-core';
import { rooms, getRoom, totalRooms } from '../data/rooms';
import { getPackage } from '../data/packages';
import { getExtra } from '../data/extras';

const dia = (iso: string) => iso.slice(-2);
const dow = (iso: string) => ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][new Date(iso + 'T12:00:00Z').getUTCDay()];
const statusCls: Record<string, string> = { pendente: 'bg-sol/20 text-mar', confirmada: 'bg-palmeira/15 text-palmeira', cancelada: 'bg-falesia/10 text-falesia' };

export async function mountAdmin(app: HTMLElement) {
  const notice = (m: string, cls = 'bg-falesia/10 text-falesia') => `<p class="mt-4 rounded-lg px-3 py-2 text-sm ${cls}">${m}</p>`;

  async function load() {
    app.innerHTML = `<p class="mt-8 text-sm text-neblina">Carregando painel…</p>`;
    let d: any;
    try { d = await api('/api/admin/painel'); }
    catch (e: any) { if (e.status === 401 || e.status === 503) return login(e.message); app.innerHTML = notice(esc(e.message)); return; }
    render(d);
  }

  function login(msg = '') {
    app.innerHTML = `
      <div class="max-w-sm">
        <p class="eyebrow">Painel da pousada</p>
        <h1 class="mt-2 text-3xl font-extrabold">Entrar</h1>
        ${isDemo() ? notice('Demonstração: qualquer senha entra.', 'bg-sol/15 text-mar') : ''}
        <form class="ficha mt-6 p-5" data-login>
          <div data-erro>${msg && msg !== 'Não autorizado' ? notice(esc(msg)) : ''}</div>
          <label class="rotulo" for="password">Senha</label>
          <input class="campo" id="password" name="password" type="password" required autofocus />
          <button type="submit" class="btn-mar mt-4 w-full">Entrar</button>
        </form>
      </div>`;
    app.querySelector('form[data-login]')!.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = (app.querySelector('#password') as HTMLInputElement).value;
      try { await post('/api/admin/login', { password: pw }); load(); }
      catch (err: any) { app.querySelector('[data-erro]')!.innerHTML = notice(esc(err.message)); }
    });
  }

  function render(d: any) {
    const reservas: any[] = d.reservations, bloqueios: any[] = d.blocks, grade = d.grid, today: string = d.today;
    const pendentes = reservas.filter((r) => r.status === 'pendente').length;
    const hoje = reservas.filter((r) => r.status !== 'cancelada' && r.checkin <= today && r.checkout > today).length;
    const receita = reservas.filter((r) => r.status === 'confirmada').reduce((s, r) => s + r.total_cents, 0) / 100;
    app.innerHTML = `
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><p class="eyebrow">Painel da pousada</p><h1 class="mt-1 text-3xl font-extrabold">Reservas e ocupação</h1></div>
        <div class="flex gap-2">${isDemo() ? '<button type="button" class="btn-linha !py-2 !px-4 text-sm" data-reset>Zerar demonstração</button>' : ''}<button type="button" class="btn-linha !py-2 !px-4 text-sm" data-logout>Sair</button></div>
      </div>
      ${d.dbKind === 'pglite-memory' ? notice('Banco em memória: as reservas somem a cada reinício. Crie um Postgres (Neon) na Vercel e defina DATABASE_URL.') : ''}
      ${d.dbKind === 'demo' ? notice('Demonstração: as reservas ficam só neste navegador. Duas reservas e um bloqueio de exemplo já estão carregados.', 'bg-sol/15 text-mar') : ''}
      <div data-msg></div>
      <ul class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <li class="ficha p-4"><p class="text-xs text-neblina">Pedidos a confirmar</p><p class="text-3xl font-extrabold">${pendentes}</p></li>
        <li class="ficha p-4"><p class="text-xs text-neblina">Hospedados hoje</p><p class="text-3xl font-extrabold">${hoje}<span class="text-sm font-normal text-neblina"> / ${totalRooms} quartos</span></p></li>
        <li class="ficha p-4"><p class="text-xs text-neblina">Reservas futuras</p><p class="text-3xl font-extrabold">${reservas.filter((r) => r.status !== 'cancelada').length}</p></li>
        <li class="ficha p-4"><p class="text-xs text-neblina">Receita confirmada</p><p class="text-3xl font-extrabold">${brl(receita)}</p></li>
      </ul>

      <h2 class="mt-10 text-xl font-bold" id="ocupacao">Vagas nos próximos 30 dias</h2>
      <p class="text-sm text-neblina">Cada célula mostra quantos apartamentos do tipo ainda estão livres naquela noite.</p>
      <div class="mt-3 overflow-x-auto rounded-[var(--radius-ficha)] border border-mar/10 bg-white">
        <table class="text-xs"><thead><tr><th class="sticky left-0 bg-white px-3 py-2 text-left">Tipo</th>${grade.dates.map((x: string) => `<th class="px-1 py-2 text-center font-normal text-neblina"><span class="block">${dow(x)}</span><span class="font-semibold text-mar">${dia(x)}</span></th>`).join('')}</tr></thead>
        <tbody>${grade.rows.map((row: any) => `<tr class="border-t border-mar/10"><td class="sticky left-0 bg-white px-3 py-2 font-semibold whitespace-nowrap">${esc(row.name)} <span class="text-neblina">(${row.units})</span></td>${row.cells.map((c: any) => `<td class="px-0.5 py-1 text-center"><span class="inline-block w-7 rounded py-1 font-semibold ${c.free === 0 ? 'bg-falesia text-white' : c.free < row.units ? 'bg-sol/40' : 'bg-palmeira/15 text-palmeira'}">${c.free}</span></td>`).join('')}</tr>`).join('')}</tbody></table>
      </div>

      <h2 class="mt-10 text-xl font-bold" id="reservas">Reservas</h2>
      ${reservas.length === 0 ? '<p class="mt-2 text-sm text-neblina">Nenhuma reserva futura ainda. Quando um hóspede reservar pelo site, ela aparece aqui.</p>' : `
      <div class="mt-3 overflow-x-auto rounded-[var(--radius-ficha)] border border-mar/10 bg-white">
        <table class="w-full min-w-[720px] text-sm">
          <thead class="bg-espuma text-xs uppercase tracking-wider text-neblina"><tr><th class="px-3 py-2 text-left">Código</th><th class="px-3 py-2 text-left">Hóspede</th><th class="px-3 py-2 text-left">Apartamento</th><th class="px-3 py-2 text-left">Datas</th><th class="px-3 py-2 text-right">Total</th><th class="px-3 py-2 text-left">Status</th><th class="px-3 py-2"></th></tr></thead>
          <tbody class="divide-y divide-mar/10">${reservas.map((r) => `
            <tr>
              <td class="px-3 py-2 font-semibold"><a href="${href('/reserva', { code: r.code })}" class="underline-offset-4 hover:underline">${esc(r.code)}</a></td>
              <td class="px-3 py-2">${esc(r.guest_name)}<br /><a href="https://wa.me/55${esc(String(r.guest_phone).replace(/^55/, ''))}" target="_blank" rel="noopener" class="text-xs text-mar-claro">${esc(r.guest_phone)}</a>${r.notes ? `<p class="text-xs text-neblina">${esc(r.notes)}</p>` : ''}</td>
              <td class="px-3 py-2">${esc(getRoom(r.room_type)?.name)}<br /><span class="text-xs text-neblina">${r.adults} ad.${r.kids6 ? ` + ${r.kids6} cr. ≤6` : ''}${r.kids7 ? ` + ${r.kids7} cr. 7+` : ''}</span>${r.package ? `<br /><span class="inline-block rounded-full bg-sol/20 px-2 py-0.5 text-[11px] font-semibold">Pacote ${esc(getPackage(r.package)?.name || r.package)}</span>` : ''}${r.extras ? `<br /><span class="text-[11px] text-neblina">+ ${esc((() => { try { return (JSON.parse(r.extras) as string[]).map((id) => getExtra(id)?.name || id).join(', '); } catch { return r.extras; } })())}</span>` : ''}</td>
              <td class="px-3 py-2 whitespace-nowrap">${fmtDate(r.checkin)} → ${fmtDate(r.checkout)}</td>
              <td class="px-3 py-2 text-right font-semibold">${brl(r.total_cents / 100)}</td>
              <td class="px-3 py-2"><span class="rounded-full px-2 py-0.5 text-xs font-semibold ${statusCls[r.status] || ''}">${esc(r.status)}</span></td>
              <td class="px-3 py-2"><div class="flex gap-1">
                ${r.status !== 'confirmada' ? `<button type="button" data-status="confirmada" data-id="${r.id}" class="rounded-full bg-palmeira px-2.5 py-1 text-xs font-semibold text-white">Confirmar</button>` : ''}
                ${r.status !== 'cancelada' ? `<button type="button" data-status="cancelada" data-id="${r.id}" class="rounded-full border border-falesia/40 px-2.5 py-1 text-xs font-semibold text-falesia">Cancelar</button>` : ''}
                ${r.status === 'cancelada' ? `<button type="button" data-status="pendente" data-id="${r.id}" class="rounded-full border border-mar/20 px-2.5 py-1 text-xs font-semibold">Reabrir</button>` : ''}
              </div></td>
            </tr>`).join('')}</tbody>
        </table>
      </div>`}

      <h2 class="mt-10 text-xl font-bold" id="bloqueios">Bloquear datas</h2>
      <p class="text-sm text-neblina">Para manutenção, uso próprio ou reservas feitas por telefone e pela Booking. O bloqueio tira apartamentos da venda no site.</p>
      <form class="ficha mt-3 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_0.6fr_1.2fr_auto] lg:items-end" data-block>
        <div><label class="rotulo">Tipo</label><select class="campo" name="room">${rooms.map((r) => `<option value="${r.slug}">${esc(r.name)}</option>`).join('')}</select></div>
        <div><label class="rotulo">De (noite)</label><input class="campo" type="date" name="start" required min="${today}" /></div>
        <div><label class="rotulo">Até (saída)</label><input class="campo" type="date" name="end" required min="${addDays(today, 1)}" /></div>
        <div><label class="rotulo">Unid.</label><input class="campo" type="number" name="qty" value="1" min="1" /></div>
        <div><label class="rotulo">Motivo</label><input class="campo" name="reason" placeholder="Ex.: reserva por telefone, Maria" /></div>
        <button class="btn-mar text-sm">Bloquear</button>
      </form>
      ${bloqueios.length ? `<ul class="mt-3 divide-y divide-mar/10 rounded-[var(--radius-ficha)] border border-mar/10 bg-white text-sm">${bloqueios.map((b) => `
        <li class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"><span><strong>${esc(getRoom(b.room_type)?.name)}</strong> · ${b.qty} unid. · ${fmtDate(b.start_date)} → ${fmtDate(b.end_date)}${b.reason ? ` <span class="text-neblina">· ${esc(b.reason)}</span>` : ''}</span><button type="button" data-remove="${b.id}" class="text-xs font-semibold text-falesia">Remover</button></li>`).join('')}</ul>` : ''}`;

    const msg = app.querySelector<HTMLElement>('[data-msg]')!;
    const fail = (e: any) => { msg.innerHTML = notice(esc(e.message)); msg.scrollIntoView({ block: 'center' }); };
    app.querySelectorAll<HTMLButtonElement>('[data-status]').forEach((b) => b.addEventListener('click', async () => {
      try { await post('/api/admin/status', { id: b.dataset.id, status: b.dataset.status }); load(); } catch (e) { fail(e); }
    }));
    app.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((b) => b.addEventListener('click', async () => {
      try { await post('/api/admin/bloqueio', { acao: 'remover', id: b.dataset.remove }); load(); } catch (e) { fail(e); }
    }));
    app.querySelector('form[data-block]')!.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target as HTMLFormElement) as any);
      try { await post('/api/admin/bloqueio', f); load(); } catch (err) { fail(err); }
    });
    app.querySelector('[data-logout]')!.addEventListener('click', async () => { await post('/api/admin/logout', {}); load(); });
    app.querySelector('[data-reset]')?.addEventListener('click', () => { resetDemo(); load(); });
  }

  load();
}
