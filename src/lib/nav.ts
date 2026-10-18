/** Navegação que funciona tanto no site (caminhos absolutos) quanto na prévia estática (relativos). */
export const isDemo = () => typeof document !== 'undefined' && document.documentElement.dataset.demo === '1';
const root = () => document.documentElement.dataset.root || '/';

export function href(path: string, params?: Record<string, string | number>) {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
  const [p, h] = path.split('#');
  const hash = h ? '#' + h : '';
  if (!isDemo()) return p + qs + hash;
  const clean = p.replace(/^\//, '').replace(/\/$/, '');
  return root() + (clean ? clean + '/index.html' : 'index.html') + qs + hash;
}
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
