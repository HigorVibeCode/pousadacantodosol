# Pousada Orla do Sol · site

Site da Pousada Orla do Sol (Prado, BA), construído com [Astro](https://astro.build) e Tailwind CSS, com **motor de reservas próprio** (MVP): calendário de preço e vaga, cotação por ocupação, pedido de reserva e painel do dono.

## Rodar

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # gera dist/
npm run preview   # serve dist/
```

## Publicar na Vercel

1. Importar este repositório na Vercel. O framework é detectado como Astro.
2. **Banco de dados:** no projeto, aba *Storage → Create Database → Neon (Postgres)*, plano gratuito. A Vercel injeta `DATABASE_URL` sozinha. Sem isso o motor roda em memória e as reservas somem a cada reinício.
3. Em *Environment Variables*, copiar as chaves de `.env.example`:
   - `PUBLIC_SITE_URL`: a URL provisória da Vercel (ex.: `https://pousada-orla-do-sol.vercel.app`).
   - `ADMIN_PASSWORD`: senha do painel em `/admin`.
   - `PUBLIC_GTM_ID`: ID do Google Tag Manager. Vazio = nada é carregado.
   - `PUBLIC_BOOKING_MODE`: `interno` (motor próprio, padrão), `whatsapp` ou `engine` (fornecedor externo).
4. Atualizar `public/robots.txt` com a URL final do sitemap.

## Motor de reservas (MVP)

| Rota | O que faz |
|---|---|
| `/reservar` | Datas e hóspedes → preço e vaga por apartamento → dados do hóspede → pedido criado (status *pendente*) |
| `/reserva/ODS-XXXXX` | Resumo do pedido, código e botão para mandar o código no WhatsApp |
| `/acomodacoes/<tipo>` | Calendário mensal com preço e vaga por dia |
| `/admin` | Painel do dono: pedidos a confirmar, grade de vagas 30 dias, confirmar/cancelar, bloquear datas |
| `/api/disponibilidade`, `/api/calendario` | JSON usado pelas páginas |

**Regras de preço** (`src/data/pricing.ts`, conforme tabela do proprietário): o apartamento cobre 1 ou 2 pessoas; criança até 6 anos é cama extra de R$ 50/noite, pessoa acima de 6 anos R$ 130/noite; Ano Novo e Carnaval são pacotes de 4 ou 5 noites com diária própria; pernoite de 1 noite e fim de semana em temporada têm + R$ 20; sem taxa de serviço. As tarifas de baixa e alta fora dos feriados são **valores de demonstração** até o dono confirmar.

**Inventário** (`src/data/rooms.ts`): 10 com varanda + 8 padrão = 18. Ajustar quando o dono confirmar.

Pagamento ainda não está no MVP: a pousada responde no WhatsApp com Pix ou link de cartão e confirma no painel.

Os redirecionamentos 301 das URLs dos sites antigos estão em `vercel.json` (produção) e `astro.config.mjs` (build local).

## Onde editar o conteúdo

| Arquivo | O que tem |
|---|---|
| `src/data/pousada.ts` | Nome, endereço, WhatsApp, horários, nota do Google, comodidades, benefícios da reserva direta |
| `src/data/rooms.ts` | Tipos de apartamento, inventário, capacidade, fotos |
| `src/data/pricing.ts` | Tarifas, pacotes de feriado, cama extra, temporadas |
| `src/data/reviews.ts` | Avaliações da home (as atuais são exemplos, trocar por reais) |
| `src/data/faq.ts` | Perguntas frequentes |
| `src/data/experiences.ts` | Cards de baleias, praias e centro |
| `public/images/` | Fotos (ver `public/images/README.md`) |

## Pendências antes do domínio final

- [ ] Fotos reais em `public/images/` (herói, quartos, prévia de compartilhamento)
- [ ] Tarifas de baixa e alta temporada e datas dos pacotes em `src/data/pricing.ts`
- [ ] Quantos apartamentos têm varanda em `src/data/rooms.ts`
- [ ] Banco Neon e `ADMIN_PASSWORD` na Vercel
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

## Trocar por um motor de fornecedor

Trocar `PUBLIC_BOOKING_MODE` para `engine` e informar `PUBLIC_BOOKING_ENGINE_URL` com `{checkin}`, `{checkout}`, `{adults}`, `{children}`. O mesmo formulário passa a abrir o motor do fornecedor (Hospedin, Omnibees, Cloudbeds), necessário para Booking e links gratuitos do Google.
