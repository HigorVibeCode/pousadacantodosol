import type { APIRoute } from 'astro';
import { adminPanel } from '../../../lib/engine';
import { json } from '../_json';
export const prerender = false;
export const GET: APIRoute = async () => json(await adminPanel());
