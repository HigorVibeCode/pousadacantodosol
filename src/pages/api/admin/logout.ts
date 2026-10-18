import type { APIRoute } from 'astro';
import { COOKIE } from '../../../lib/admin';
import { json } from '../_json';
export const prerender = false;
export const POST: APIRoute = async ({ cookies }) => { cookies.delete(COOKIE, { path: '/' }); return json({ ok: true }); };
