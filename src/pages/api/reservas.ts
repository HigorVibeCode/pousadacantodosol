import type { APIRoute } from 'astro';
import { createReservation, parseGuests } from '../../lib/engine';
import { json, readBody } from './_json';
export const prerender = false;

/** Cria o pedido de reserva (status pendente). Corpo JSON ou formulário. */
export const POST: APIRoute = async ({ request }) => {
  const b = await readBody(request);
  try {
    const { reservation } = await createReservation({
      room: b.room || '', checkin: b.checkin || '', checkout: b.checkout || '', ...parseGuests((k) => b[k]),
      name: b.name || '', phone: b.phone || '', email: b.email, notes: b.notes,
    });
    return json({ code: reservation.code });
  } catch (e: any) {
    return json({ error: e?.message || 'Não foi possível criar a reserva.' }, 400);
  }
};
