/**
 * Categorias de acomodação. Preços em BRL por diária, baixa temporada.
 * priceFrom = null mostra "Consultar tarifa" até o dono confirmar os valores.
 * TODO: confirmar categorias, capacidades, camas e tarifas com o proprietário.
 */
export type Room = {
  slug: string;
  name: string;
  short: string;
  description: string;
  capacity: { adults: number; children: number; total: number };
  beds: string;
  area: string | null;
  priceFrom: number | null;
  priceHigh: number | null;
  amenities: string[];
  photos: { src: string; alt: string }[];
  ideal: string;
};

const common = [
  'Ar-condicionado split',
  'Varanda privativa',
  'TV de tela plana',
  'Frigobar',
  'Banheiro privativo com ducha',
  'Wi-Fi gratuito',
  'Roupa de cama e banho',
];

export const rooms: Room[] = [
  {
    slug: 'duplo-varanda',
    name: 'Duplo com Varanda',
    short: 'Para casais',
    description:
      'Apartamento para duas pessoas com cama de casal queen, varanda privativa e ar-condicionado. A opção certa para casal que quer praia de manhã e piscina à tarde.',
    capacity: { adults: 2, children: 0, total: 2 },
    beds: '1 cama queen',
    area: null,
    priceFrom: null,
    priceHigh: null,
    amenities: common,
    photos: [
      { src: '/images/rooms/duplo-1.jpg', alt: 'Quarto duplo com cama queen e varanda' },
      { src: '/images/rooms/duplo-2.jpg', alt: 'Varanda do apartamento duplo' },
    ],
    ideal: 'Casais e viagens a dois',
  },
  {
    slug: 'triplo-varanda',
    name: 'Triplo com Varanda',
    short: 'Para casal com um filho',
    description:
      'Cama de casal e uma cama de solteiro no mesmo apartamento, com varanda e ar-condicionado. Cabe a família pequena sem apertar.',
    capacity: { adults: 3, children: 1, total: 3 },
    beds: '1 cama de casal + 1 de solteiro',
    area: null,
    priceFrom: null,
    priceHigh: null,
    amenities: common,
    photos: [
      { src: '/images/rooms/triplo-1.jpg', alt: 'Quarto triplo com cama de casal e de solteiro' },
    ],
    ideal: 'Casal com uma criança ou três amigos',
  },
  {
    slug: 'quadruplo-familia',
    name: 'Quádruplo Família',
    short: 'Para famílias',
    description:
      'Cama de casal e duas de solteiro, varanda, ar-condicionado e espaço para a mala de todo mundo. Pensado para quem vem de carro com as crianças.',
    capacity: { adults: 4, children: 2, total: 4 },
    beds: '1 cama de casal + 2 de solteiro',
    area: null,
    priceFrom: null,
    priceHigh: null,
    amenities: common,
    photos: [
      { src: '/images/rooms/quadruplo-1.jpg', alt: 'Quarto quádruplo com cama de casal e duas de solteiro' },
    ],
    ideal: 'Família com duas crianças ou grupo de quatro',
  },
  {
    slug: 'conjugado-familia',
    name: 'Conjugado para Grupos',
    short: 'Dois quartos ligados',
    description:
      'Dois apartamentos interligados por porta interna: privacidade para os adultos e as crianças ao lado. Ideal para duas famílias ou avós com netos.',
    capacity: { adults: 6, children: 2, total: 6 },
    beds: '2 camas de casal + 2 de solteiro',
    area: null,
    priceFrom: null,
    priceHigh: null,
    amenities: [...common, 'Dois banheiros', 'Porta interna entre os quartos'],
    photos: [
      { src: '/images/rooms/conjugado-1.jpg', alt: 'Apartamentos conjugados com porta interna' },
    ],
    ideal: 'Duas famílias ou grupos de até seis',
  },
];

export const getRoom = (slug: string) => rooms.find((r) => r.slug === slug);
