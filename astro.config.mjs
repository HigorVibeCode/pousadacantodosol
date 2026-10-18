// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const site = process.env.PUBLIC_SITE_URL || 'https://pousada-orla-do-sol.vercel.app';

export default defineConfig({
  site,
  // Páginas são estáticas por padrão; rotas do motor (/reservar, /reserva, /admin, /api)
  // declaram `prerender = false` e rodam no servidor da Vercel.
  output: 'static',
  devToolbar: { enabled: false },
  adapter: vercel(),
  integrations: [sitemap({ filter: (p) => !/\/(admin|reserva|reservar|api)(\/|$)/.test(p) })],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  },
  // Redirecionamentos 301 das URLs dos dois sites antigos.
  redirects: {
    '/quartos': '/acomodacoes',
    '/acomodacoes-em-prado-ba': '/acomodacoes',
    '/a-pousada': '/',
    '/fotos': '/acomodacoes',
    '/o-que-fazer-em-prado-ba': '/localizacao',
  },
});
