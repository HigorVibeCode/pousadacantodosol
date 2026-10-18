import type { APIRoute } from 'astro';
import { addBlock, removeBlock } from '../../../lib/engine';
import { json, readBody } from '../_json';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  const b = await readBody(request);
  try {
    if (b.acao === 'remover') await removeBlock(parseInt(b.id));
    else await addBlock({ room: b.room, start: b.start, end: b.end, qty: parseInt(b.qty) || 1, reason: b.reason });
    return json({ ok: true });
  } catch (e: any) { return json({ error: e?.message || 'Erro' }, 400); }
};
