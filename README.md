# Pousada Orla do Sol · site

Site estático da Pousada Orla do Sol (Prado, BA), construído com [Astro](https://astro.build) e Tailwind CSS. Fase 1 da reconstrução digital: página de alta conversão com botão principal que abre o WhatsApp já com datas e hóspedes.

## Rodar

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # gera dist/
npm run preview   # serve dist/
```

## Publicar na Vercel

1. Importar este repositório na Vercel. O framework é detectado como Astro.
2. Em *Environment Variables*, copiar as chaves de `.env.example`:
   - `PUBLIC_SITE_URL`: a URL provisória da Vercel (ex.: `https://pousada-orla-do-sol.vercel.app`). Usada em canonical, sitemap e dados estruturados.
   - `PUBLIC_GTM_ID`: ID do Google Tag Manager. Vazio = nada é carregado.
   - `PUBLIC_BOOKING_MODE`: `whatsapp` (fase 1) ou `engine` (fase 2).
   - `PUBLIC_BOOKING_ENGINE_URL`: URL do motor de reservas com `{checkin}`, `{checkout}`, `{adults}`, `{children}`.
3. Atualizar `public/robots.txt` com a URL final do sitemap.

Os redirecionamentos 301 das URLs dos sites antigos estão em `vercel.json` (produção) e `astro.config.mjs` (build local).

## Onde editar o conteúdo

| Arquivo | O que tem |
|---|---|
| `src/data/pousada.ts` | Nome, endereço, WhatsApp, horários, nota do Google, comodidades, benefícios da reserva direta |
| `src/data/rooms.ts` | Categorias, capacidade, camas, tarifas, fotos |
| `src/data/reviews.ts` | Avaliações da home (as atuais são exemplos, trocar por reais) |
| `src/data/faq.ts` | Perguntas frequentes |
| `src/data/experiences.ts` | Cards de baleias, praias e centro |
| `public/images/` | Fotos (ver `public/images/README.md`) |

## Pendências antes do domínio final

- [ ] Fotos reais em `public/images/` (herói, quartos, prévia de compartilhamento)
- [ ] Tarifas por categoria em `src/data/rooms.ts` (`priceFrom`)
- [ ] Avaliações reais em `src/data/reviews.ts`
- [ ] E-mail e CNPJ em `src/data/pousada.ts`
- [ ] Confirmar coordenadas (`geo`) e nota/total do Google no dia da publicação
- [ ] Política de cancelamento, crianças e pets em `src/data/faq.ts`
- [ ] `PUBLIC_GTM_ID` configurado com GA4 e conversão do Google Ads no evento `reserva_clique`
- [ ] Enviar sitemap no Search Console

## Eventos de medição (dataLayer)

| Evento | Quando | Dados |
|---|---|---|
| `reserva_clique` | botão principal do formulário | `modo`, `noites`, `adultos`, `criancas`, `categoria` |
| `whatsapp_clique` | qualquer link de WhatsApp fora do formulário | `origem` |
| `telefone_clique` | qualquer link `tel:` | `origem` |

## Fase 2

Trocar `PUBLIC_BOOKING_MODE` para `engine` e informar `PUBLIC_BOOKING_ENGINE_URL`. O mesmo formulário passa a abrir o motor de reservas; o WhatsApp continua como canal secundário.
