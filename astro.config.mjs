// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const site = process.env.PUBLIC_SITE_URL || 'https://pousada-orla-do-sol.vercel.app';

export default defineConfig({
  site,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  // Redirecionamentos 301 das URLs dos dois sites antigos.
  // Em produção a Vercel aplica os mesmos via vercel.json.
  redirects: {
    '/quartos': '/acomodacoes',
    '/acomodacoes-em-prado-ba': '/acomodacoes',
    '/a-pousada': '/',
    '/fotos': '/acomodacoes',
    '/o-que-fazer-em-prado-ba': '/localizacao',
  },
});
