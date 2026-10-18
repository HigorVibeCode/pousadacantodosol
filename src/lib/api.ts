import { isDemo } from './nav';
// Na build de demonstração o módulo entra estaticamente (caminho relativo, funciona na prévia).
// Fora dela a constante é falsa e o bundler descarta o import.
const DEMO_BUILD = import.meta.env.PUBLIC_DEMO === '1';
import * as demo from './demo-api';

/** Chama a API do site. Na prévia estática, responde localmente (demo-api). */
export async function api(path: string, init?: RequestInit): Promise<any> {
  let res: Response;
  if (DEMO_BUILD && isDemo()) res = await demo.demoFetch(path, init);
  else res = await fetch(path, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } });
  const data = await res.json().catch(() => ({ error: 'Resposta inválida do servidor.' }));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Erro'), { status: res.status, data });
  return data;
}
export const post = (path: string, body: unknown) => api(path, { method: 'POST', body: JSON.stringify(body) });
export const resetDemo = () => demo.resetStore();
