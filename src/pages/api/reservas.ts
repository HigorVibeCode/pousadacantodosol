import type { APIRoute } from 'astro';
import { createReservation, parseGuests } from '../../lib/engine';
export const prerender = false;

/** Recebe o formulário de dados do hóspede e cria a reserva (status pendente). */
export const POST: APIRoute = async ({ request, redirect }) => {
  const f = await request.formData();
  const get = (k: string) => String(f.get(k) ?? '').trim();
  const input = {
    room: get('room'), checkin: get('checkin'), checkout: get('checkout'),
    ...parseGuests(get),
    name: get('name'), phone: get('phone').replace(/\D/g, ''), email: get('email'), notes: get('notes'),
  };
  const back = `/reservar?checkin=${input.checkin}&checkout=${input.checkout}&adults=${input.adults}&kids6=${input.kids6}&kids7=${input.kids7}&room=${input.room}&erro=`;
  if (input.name.length < 3) return redirect(back + encodeURIComponent('Informe seu nome completo.'), 303);
  if (input.phone.length < 10) return redirect(back + encodeURIComponent('Informe um WhatsApp com DDD.'), 303);
  try {
    const { reservation } = await createReservation(input);
    return redirect(`/reserva/${reservation.code}?nova=1`, 303);
  } catch (e: any) {
    return redirect(back + encodeURIComponent(e?.message || 'Não foi possível criar a reserva.'), 303);
  }
};
