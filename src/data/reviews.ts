/**
 * Avaliações exibidas na home.
 * ATENÇÃO: as entradas abaixo são EXEMPLOS de formato, baseadas nos temas
 * recorrentes das avaliações públicas (localização, café, piscina, atendimento).
 * Substituir por avaliações reais copiadas do Perfil Google / Booking, com
 * nome, cidade e data verdadeiros, antes de publicar no domínio final.
 */
export type Review = {
  author: string;
  origin: string;
  date: string; // AAAA-MM
  rating: number; // 1 a 5
  text: string;
  source: 'Google' | 'Booking' | 'Tripadvisor';
  sample?: boolean;
};

export const reviews: Review[] = [
  {
    author: 'Hóspede (exemplo)',
    origin: 'Belo Horizonte, MG',
    date: '2026-08',
    rating: 5,
    text: 'Localização perfeita: saímos a pé para a praia logo cedo e voltamos para a piscina à tarde. Café da manhã farto.',
    source: 'Google',
    sample: true,
  },
  {
    author: 'Hóspede (exemplo)',
    origin: 'Goiânia, GO',
    date: '2026-07',
    rating: 5,
    text: 'Viemos ver as baleias e a pousada indicou o passeio. Estacionamento dentro do terreno foi um alívio.',
    source: 'Google',
    sample: true,
  },
  {
    author: 'Hóspede (exemplo)',
    origin: 'Brasília, DF',
    date: '2026-01',
    rating: 4,
    text: 'Quarto simples, limpo e com ar bom. Equipe atenciosa com as crianças. Voltaríamos.',
    source: 'Booking',
    sample: true,
  },
];
