/**
 * Tipos de apartamento. O preço base cobre 1 ou 2 pessoas; a partir daí entra cama extra
 * (ver pricing.ts). Inventário: 18 quartos no total.
 * TODO confirmar com o proprietário: quantos são com varanda e quantos normais, e o máximo
 * de pessoas por apartamento (assumido 4: 2 + 2 camas extras).
 */
import { lowestRate, type RoomType } from './pricing';

export type Room = {
  slug: RoomType;
  name: string;
  short: string;
  description: string;
  /** unidades vendáveis por noite */
  units: number;
  /** pessoas no preço base */
  baseOccupancy: number;
  /** máximo de pessoas com camas extras */
  maxOccupancy: number;
  beds: string;
  amenities: string[];
  photos: { src: string; alt: string }[];
  ideal: string;
};

const common = [
  'Ar-condicionado split',
  'TV de tela plana',
  'Frigobar',
  'Banheiro privativo com ducha',
  'Wi-Fi gratuito',
  'Roupa de cama e banho',
  'Cama extra sob consulta',
];

export const rooms: Room[] = [
  {
    slug: 'com-varanda',
    name: 'Apartamento com Varanda',
    short: 'Com varanda',
    description:
      'Cama de casal, ar-condicionado e varanda privativa para o café ou o fim de tarde. Para 1 ou 2 pessoas, com cama extra para até 2 crianças ou acompanhantes.',
    units: 10,
    baseOccupancy: 2,
    maxOccupancy: 4,
    beds: '1 cama de casal + até 2 camas extras',
    amenities: ['Varanda privativa', ...common],
    photos: [
      { src: '/images/rooms/varanda-1.jpg', alt: 'Apartamento com cama de casal, forro de madeira e varanda com rede' },
      { src: '/images/rooms/varanda-2.jpg', alt: 'Varanda do apartamento' },
    ],
    ideal: 'Casais e famílias que querem varanda',
  },
  {
    slug: 'normal',
    name: 'Apartamento Padrão',
    short: 'Sem varanda',
    description:
      'Mesma cama de casal, mesmo ar-condicionado e mesmo café, sem a varanda. A opção de melhor preço para quem passa o dia na praia.',
    units: 8,
    baseOccupancy: 2,
    maxOccupancy: 4,
    beds: '1 cama de casal + até 2 camas extras',
    amenities: common,
    photos: [
      { src: '/images/rooms/normal-1.jpg', alt: 'Apartamento com cama de casal e cama de solteiro, ar-condicionado e TV' },
    ],
    ideal: 'Quem quer o melhor preço',
  },
];

export const getRoom = (slug: string) => rooms.find((r) => r.slug === slug);
export const priceFrom = (room: Room) => lowestRate(room.slug);
export const totalRooms = rooms.reduce((n, r) => n + r.units, 0);
