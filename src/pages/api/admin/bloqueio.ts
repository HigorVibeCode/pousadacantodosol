import type { APIRoute } from 'astro';
import { addBlock, removeBlock } from '../../../lib/engine';
export const prerender = false;
export const POST: APIRoute = async ({ request, redirect }) => {
  const f = await request.formData();
  const get = (k: string) => String(f.get(k) ?? '').trim();
  try {
    if (get('acao') === 'remover') await removeBlock(parseInt(get('id')));
    else await addBlock({ room: get('room'), start: get('start'), end: get('end'), qty: parseInt(get('qty')) || 1, reason: get('reason') });
    return redirect('/admin#bloqueios', 303);
  } catch (e: any) {
    return redirect('/admin?erro=' + encodeURIComponent(e?.message || 'Erro') + '#bloqueios', 303);
  }
};
