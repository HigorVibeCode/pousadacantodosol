import type { APIRoute } from 'astro';
import { setStatus } from '../../../lib/engine';
export const prerender = false;
export const POST: APIRoute = async ({ request, redirect }) => {
  const f = await request.formData();
  const id = parseInt(String(f.get('id')));
  const status = String(f.get('status'));
  if (id && ['pendente', 'confirmada', 'cancelada'].includes(status)) await setStatus(id, status as any);
  return redirect('/admin#reservas', 303);
};
