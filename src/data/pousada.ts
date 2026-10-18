/**
 * Dados oficiais da pousada. Fonte única: tudo que aparece em rodapé,
 * dados estruturados, WhatsApp e páginas vem daqui.
 * Os mesmos valores devem ser usados no Perfil Google, OTAs e Instagram.
 */
export const pousada = {
  name: 'Pousada Orla do Sol',
  shortName: 'Orla do Sol',
  tagline: 'Pousada em Prado a 2 minutos a pé da Praia Novo Prado',
  description:
    'Pousada familiar em Prado, Bahia, a 2 minutos a pé da Praia Novo Prado. 18 apartamentos com ar-condicionado, com ou sem varanda, piscina, café da manhã incluso e estacionamento gratuito.',
  roomsTotal: 18,
  checkIn: '15:00',
  checkOut: '11:00',
  whatsapp: '5573999182458', // somente dígitos, com DDI
  phoneDisplay: '(73) 99918-2458',
  email: '', // TODO confirmar e-mail oficial; vazio = não aparece
  instagram: 'pousadaorladosolprado',
  cnpj: '', // TODO preencher; vazio = não aparece
  address: {
    street: 'Rua Moisés Santos Almeida, 4',
    neighborhood: 'Novo Prado',
    city: 'Prado',
    state: 'BA',
    postalCode: '45980-000',
    country: 'BR',
  },
  // TODO confirmar coordenadas exatas no Google Maps antes de publicar o domínio final
  geo: { lat: -17.3298, lng: -39.2143 },
  mapsQuery: 'Pousada Orla do Sol, Rua Moisés Santos Almeida, 4, Prado - BA',
  distances: [
    { label: 'Praia Novo Prado', value: '2 min a pé' },
    { label: 'Centro histórico', value: '12 min a pé' },
    { label: 'Praia do Centro', value: '12 min a pé' },
    { label: 'Aeroporto de Porto Seguro', value: '2h30 de carro' },
  ],
  // TODO confirmar nota e total no Perfil Google no dia da publicação
  rating: { value: 4.5, count: 148, source: 'Google' },
  amenities: [
    'Piscina ao ar livre',
    'Café da manhã incluso',
    'Estacionamento gratuito',
    'Recepção 24 horas',
    'Wi-Fi gratuito',
    'Ar-condicionado em todos os quartos',
    'Varanda em parte dos apartamentos',
    'Jardim e área de convivência',
    'Bar e lanchonete',
  ],
  directBenefits: [
    {
      title: 'Melhor tarifa garantida',
      text: 'Reservando direto você não paga a comissão que as plataformas cobram da pousada. Esse valor fica com você.',
    },
    {
      title: 'Atendimento com quem conhece Prado',
      text: 'Quem responde é a equipe da pousada. Dica de praia, passeio de baleia e restaurante vêm de quem mora aqui.',
    },
    {
      title: 'Flexibilidade de verdade',
      text: 'Chegou mais cedo ou precisa sair mais tarde? Direto com a gente é mais fácil ajustar.',
    },
  ],
} as const;

export const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://pousada-orla-do-sol.vercel.app';
export const gtmId: string = import.meta.env.PUBLIC_GTM_ID || '';
export type BookingMode = 'interno' | 'whatsapp' | 'engine';
const m = import.meta.env.PUBLIC_BOOKING_MODE;
export const bookingMode: BookingMode = m === 'whatsapp' || m === 'engine' ? m : 'interno';
export const bookingEngineUrl: string = import.meta.env.PUBLIC_BOOKING_ENGINE_URL || '';
