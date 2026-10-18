export const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
export const readBody = async (request: Request): Promise<Record<string, string>> => {
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) { const j = await request.json(); const o: Record<string, string> = {}; for (const k in j) o[k] = String(j[k] ?? ''); return o; }
  const f = await request.formData(); const o: Record<string, string> = {}; f.forEach((v, k) => (o[k] = String(v))); return o;
};
