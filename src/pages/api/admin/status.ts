import type { APIRoute } from 'astro';
import { setStatus } from '../../../lib/engine';
import { json, readBody } from '../_json';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  const b = await readBody(request);
  const id = parseInt(b.id); const status = b.status;
  if (!id || !['pendente', 'confirmada', 'cancelada'].includes(status)) return json({ error: 'Dados inválidos' }, 400);
  await setStatus(id, status as any);
  return json({ ok: true });
};
