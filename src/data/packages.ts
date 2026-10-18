/**
 * Pacotes completos. Preço = hospedagem da tabela com desconto + extras por pessoa (parceiros com margem)
 * + itens por reserva (ex.: espumante e café no quarto). Transporte interestadual não incluso.
 * Todo pacote inclui o transfer urbano da pousada: uma saída de manhã (9h) e uma à noite (19h).
 *
 * TODO: todos os valores de parceiros são ESTIMATIVAS até a lista oficial chegar.
 * TODO: confirmar datas dos eventos de 2027 (Carnaval, Moto Rock, Festival).
 */
import type { RoomType } from './pricing';

export type Audience = 'casais' | 'familia' | 'amigos' | 'todos';
export type Package = {
  slug: string;
  name: string;
  tagline: string;
  audience: Audience;
  group: 'casais' | 'familia' | 'eventos';
  /** noites permitidas */
  nights: number[];
  /** dias da semana permitidos para o check-in (0=dom … 6=sáb). Vazio = qualquer dia */
  startDays: number[];
  /** janelas em que o check-in pode cair (inclusive). Vazio = o ano todo */
  windows: { start: string; end: string; label: string }[];
  /** datas fixas (eventos). Se existir, só essas combinações são aceitas */
  fixedDates: { checkin: string; checkout: string; label: string }[];
  /** tipos de apartamento aceitos */
  rooms: RoomType[];
  /** desconto sobre a hospedagem da tabela (0.10 = 10%) */
  lodgingDiscount: number;
  /** extras de parceiros por pessoa (adulto ou criança de 7 a 12), para a estadia toda */
  perPerson: number;
  /** extras por criança até 6 anos */
  perChild6: number;
  /** itens por reserva (espumante, café no quarto na primeira manhã…) */
  perReservation: number;
  /** vagas por data (urgência real) */
  capacity: number;
  /** criança até 6 anos não paga a cama extra da hospedagem */
  child6BedFree?: boolean;
  includes: string[];
  itinerary: { day: string; title: string; text: string }[];
  photo: { src: string; alt: string };
  seasonLabel: string;
  featured?: boolean;
};

const TRANSFER = 'Transfer urbano da pousada: uma saída às 9h e outra às 19h, todos os dias';
const ROMANTIC = ['Espumante na chegada', 'Café da manhã servido no quarto na primeira manhã, com frutas da região'];
const BASE = ['Hospedagem com café da manhã', TRANSFER, 'Estacionamento e piscina'];

// Janelas de 2026/2027 (TODO confirmar datas dos eventos)
const BALEIAS = { start: '2026-07-01', end: '2026-11-12', label: 'Julho a novembro' };
const BALEIAS_27 = { start: '2027-07-01', end: '2027-11-12', label: 'Julho a novembro de 2027' };
const FESTIVAL = { start: '2026-10-08', end: '2026-10-31', label: 'Festival Gastronômico, 8 de outubro a 2 de novembro' };
const BAIXA = { start: '2027-03-08', end: '2027-06-30', label: 'Março a junho' };
const FERIAS_JAN = { start: '2027-01-04', end: '2027-01-31', label: 'Férias de janeiro' };
const FERIAS_JUL = { start: '2027-07-01', end: '2027-07-31', label: 'Férias de julho' };

export const packages: Package[] = [
  {
    slug: 'fim-de-semana-a-dois',
    name: 'Fim de semana a dois',
    tagline: 'Chegue na sexta, volte no domingo sem ter decidido nada além de onde sentar na areia.',
    audience: 'casais', group: 'casais', featured: true,
    nights: [2, 3], startDays: [4, 5], windows: [], fixedDates: [],
    rooms: ['com-varanda'], lodgingDiscount: 0.10, perPerson: 210, perChild6: 0, perReservation: 120, capacity: 6,
    includes: [...BASE, ...ROMANTIC, 'Um jantar ou almoço na beira da praia (restaurante parceiro)', 'Passeio de barco no fim de tarde', 'Saída até as 14h no último dia'],
    itinerary: [
      { day: 'Sexta', title: 'Chegada e espumante', text: 'Check-in a partir das 15h, espumante na varanda e fim de tarde na praia a dois minutos.' },
      { day: 'Sábado', title: 'Praia, barco e jantar', text: 'Café no quarto com frutas da região. Dia de praia. Passeio de barco no fim de tarde e jantar na beira-mar.' },
      { day: 'Domingo', title: 'Sem pressa', text: 'Café até as 10h, piscina, e saída até as 14h.' },
    ],
    photo: { src: '/images/pacotes/fim-de-semana-a-dois.jpg', alt: 'Quarto com varanda e rede' },
    seasonLabel: 'O ano todo, exceto feriados',
  },
  {
    slug: 'retiro-de-descanso',
    name: 'Retiro de descanso',
    tagline: 'Cinco dias de baixa temporada, praia vazia, massagem e nenhum compromisso.',
    audience: 'casais', group: 'casais',
    nights: [4, 5], startDays: [], windows: [BAIXA], fixedDates: [],
    rooms: ['com-varanda'], lodgingDiscount: 0.15, perPerson: 360, perChild6: 0, perReservation: 120, capacity: 4,
    includes: [...BASE, ...ROMANTIC, 'Uma massagem relaxante por pessoa (parceiro)', 'Trilha guiada ao nascer do sol nas falésias', 'Café no quarto todas as manhãs, se preferir', 'Saída até as 14h'],
    itinerary: [
      { day: 'Dia 1', title: 'Desligar', text: 'Chegada, espumante e orientação sobre as praias mais vazias da semana.' },
      { day: 'Dia 2', title: 'Massagem', text: 'Manhã de piscina e massagem relaxante à tarde.' },
      { day: 'Dia 3', title: 'Nascer do sol', text: 'Trilha guiada cedo nas falésias e dia livre.' },
      { day: 'Dias 4 e 5', title: 'Nada marcado', text: 'Praia, rede e o transfer para o centro à noite, se der vontade.' },
    ],
    photo: { src: '/images/pacotes/retiro-de-descanso.jpg', alt: 'Rede na varanda com vista para o mar' },
    seasonLabel: 'Março a junho',
  },
  {
    slug: 'semana-em-familia',
    name: 'Semana em família',
    tagline: 'Sete noites com os passeios já marcados e as crianças até 6 anos sem custo de cama.',
    audience: 'familia', group: 'familia', featured: true,
    nights: [7], startDays: [], windows: [FERIAS_JAN, FERIAS_JUL, BAIXA], fixedDates: [],
    rooms: ['com-varanda', 'normal'], lodgingDiscount: 0.15, perPerson: 460, perChild6: 150, perReservation: 0, capacity: 6, child6BedFree: true,
    includes: [...BASE, 'Dois almoços na beira da praia (restaurante parceiro)', 'Passeio 4x4 a Cumuruxatiba e Corumbau', 'Passeio de barco pelo rio e manguezal', 'Um dia no centro histórico com transfer ida e volta', 'Criança até 6 anos sem custo de cama extra'],
    itinerary: [
      { day: 'Dia 1', title: 'Chegada', text: 'Check-in, piscina e praia em frente.' },
      { day: 'Dia 2', title: 'Praia Novo Prado', text: 'Dia de praia com almoço na barraca parceira.' },
      { day: 'Dia 3', title: 'Cumuruxatiba e Corumbau', text: 'Passeio 4x4 pelas falésias coloridas e pela reserva de Corumbau.' },
      { day: 'Dia 4', title: 'Barco no rio', text: 'Passeio de barco pelo Jucuruçu e manguezal.' },
      { day: 'Dia 5', title: 'Centro histórico', text: 'Transfer para o centro, casario colonial e almoço na beira do rio.' },
      { day: 'Dias 6 e 7', title: 'Livres', text: 'Praia, piscina e o segundo almoço na beira-mar no dia que preferirem.' },
    ],
    photo: { src: '/images/pacotes/semana-em-familia.jpg', alt: 'Piscina da pousada com o mural das baleias' },
    seasonLabel: 'Férias de janeiro e julho, e baixa temporada',
  },
  {
    slug: 'temporada-das-baleias',
    name: 'Temporada das baleias',
    tagline: 'Três ou quatro noites na época em que as jubartes passam em frente a Prado.',
    audience: 'todos', group: 'eventos', featured: true,
    nights: [3, 4], startDays: [], windows: [BALEIAS, BALEIAS_27], fixedDates: [],
    rooms: ['com-varanda', 'normal'], lodgingDiscount: 0.10, perPerson: 380, perChild6: 120, perReservation: 0, capacity: 8,
    includes: [...BASE, 'Passeio de barco para observação de baleias com operador autorizado', 'Um almoço na beira da praia', 'Roteiro das falésias com transfer', 'Café mais cedo no dia do passeio'],
    itinerary: [
      { day: 'Dia 1', title: 'Chegada', text: 'Check-in e briefing sobre o passeio: horário, mar e o que levar.' },
      { day: 'Dia 2', title: 'Baleias', text: 'Café cedo, saída do cais e meio período no mar com as jubartes.' },
      { day: 'Dia 3', title: 'Falésias', text: 'Transfer para as falésias ao sul e almoço na praia.' },
      { day: 'Dia 4', title: 'Opcional', text: 'Dia livre de praia para quem escolheu quatro noites.' },
    ],
    photo: { src: '/images/pacotes/temporada-das-baleias.jpg', alt: 'Baleia-jubarte saltando no mar de Prado' },
    seasonLabel: 'Julho a novembro, pico em agosto e setembro',
  },
  {
    slug: 'festival-gastronomico',
    name: 'Festival Gastronômico',
    tagline: 'Duas ou três noites em outubro com jantar no festival e transfer para o centro todas as noites.',
    audience: 'todos', group: 'eventos',
    nights: [2, 3], startDays: [], windows: [FESTIVAL], fixedDates: [],
    rooms: ['com-varanda', 'normal'], lodgingDiscount: 0.10, perPerson: 170, perChild6: 60, perReservation: 0, capacity: 8,
    includes: [...BASE, 'Um jantar em restaurante participante do festival', 'Transfer noturno ao centro durante o festival', 'Guia dos restaurantes e das apresentações'],
    itinerary: [
      { day: 'Noite 1', title: 'Festival', text: 'Transfer às 19h para o centro e jantar no restaurante parceiro.' },
      { day: 'Dia 2', title: 'Praia e festival', text: 'Dia de praia e a programação da noite por conta própria, com o transfer.' },
    ],
    photo: { src: '/images/pacotes/festival-gastronomico.jpg', alt: 'Rua de restaurantes no centro histórico de Prado ao anoitecer' },
    seasonLabel: '8 de outubro a 2 de novembro',
  },
  {
    slug: 'reveillon',
    name: 'Réveillon em Prado',
    tagline: 'Quatro ou cinco noites com a virada na praia e café tardio no primeiro dia do ano.',
    audience: 'todos', group: 'eventos', featured: true,
    nights: [4, 5], startDays: [],
    windows: [], fixedDates: [
      { checkin: '2026-12-28', checkout: '2027-01-02', label: '5 noites · 28/12 a 02/01' },
      { checkin: '2026-12-29', checkout: '2027-01-02', label: '4 noites · 29/12 a 02/01' },
    ],
    rooms: ['com-varanda', 'normal'], lodgingDiscount: 0, perPerson: 90, perChild6: 30, perReservation: 120, capacity: 18,
    includes: [...BASE, 'Espumante para a virada', 'Transfer para a festa na praia e volta de madrugada', 'Café da manhã até as 12h no dia 1º', 'Um almoço na beira da praia'],
    itinerary: [
      { day: '31/12', title: 'Virada', text: 'Transfer para a orla às 21h, espumante, fogos, e volta de madrugada.' },
      { day: '01/01', title: 'Café tardio', text: 'Café servido até o meio-dia e praia à tarde.' },
    ],
    photo: { src: '/images/pacotes/reveillon.jpg', alt: 'Fogos sobre o mar' },
    seasonLabel: 'Pacotes de 4 e 5 noites',
  },
  {
    slug: 'carnaval',
    name: 'Carnaval em Prado',
    tagline: 'Carnaval de rua pequeno e seguro, a dois minutos da praia e com transfer noturno.',
    audience: 'amigos', group: 'eventos',
    nights: [4, 5], startDays: [],
    windows: [], fixedDates: [
      { checkin: '2027-02-05', checkout: '2027-02-10', label: '5 noites · 05/02 a 10/02' },
      { checkin: '2027-02-06', checkout: '2027-02-10', label: '4 noites · 06/02 a 10/02' },
    ],
    rooms: ['com-varanda', 'normal'], lodgingDiscount: 0, perPerson: 60, perChild6: 0, perReservation: 0, capacity: 18,
    includes: [...BASE, 'Transfer noturno para os blocos e volta de madrugada', 'Kit folião: água, protetor solar e guia dos blocos', 'Café da manhã até as 11h'],
    itinerary: [
      { day: 'Todas as noites', title: 'Blocos', text: 'Transfer às 19h para o centro e volta combinada de madrugada.' },
      { day: 'Todos os dias', title: 'Recuperação', text: 'Café até as 11h, piscina e praia em frente.' },
    ],
    photo: { src: '/images/pacotes/carnaval.jpg', alt: 'Rua do centro histórico de Prado' },
    seasonLabel: 'Pacotes de 4 e 5 noites · datas a confirmar',
  },
  {
    slug: 'prado-moto-rock',
    name: 'Prado Moto Rock',
    tagline: 'Estacionamento coberto para a moto, café cedo e transfer para o evento.',
    audience: 'amigos', group: 'eventos',
    nights: [2, 3], startDays: [],
    // TODO confirmar a data do evento em 2027
    windows: [{ start: '2027-05-13', end: '2027-05-15', label: 'Maio de 2027 (data a confirmar)' }], fixedDates: [],
    rooms: ['com-varanda', 'normal'], lodgingDiscount: 0.05, perPerson: 40, perChild6: 0, perReservation: 0, capacity: 18,
    includes: [...BASE, 'Vaga coberta e lavagem da moto', 'Café da manhã a partir das 6h30', 'Transfer para o evento às 19h e volta'],
    itinerary: [{ day: 'Evento', title: 'Moto Rock', text: 'Transfer para a arena à noite. Moto fica lavada e coberta na pousada.' }],
    photo: { src: '/images/pacotes/prado-moto-rock.jpg', alt: 'Motos estacionadas ao pôr do sol' },
    seasonLabel: 'Maio · data a confirmar',
  },
  {
    slug: 'feriado-prolongado',
    name: 'Feriado prolongado',
    tagline: 'Três ou quatro noites nos feriados de 2027 com almoço na praia e passeio de barco.',
    audience: 'todos', group: 'eventos',
    nights: [3, 4], startDays: [],
    windows: [
      { start: '2027-03-25', end: '2027-03-26', label: 'Semana Santa' },
      { start: '2027-04-17', end: '2027-04-21', label: 'Tiradentes' },
      { start: '2027-04-30', end: '2027-05-01', label: '1º de maio' },
      { start: '2027-05-26', end: '2027-05-27', label: 'Corpus Christi' },
      { start: '2027-09-03', end: '2027-09-07', label: '7 de setembro' },
      { start: '2027-10-08', end: '2027-10-12', label: '12 de outubro' },
      { start: '2027-10-29', end: '2027-11-02', label: 'Finados' },
      { start: '2027-11-12', end: '2027-11-15', label: 'Proclamação da República' },
    ], fixedDates: [],
    rooms: ['com-varanda', 'normal'], lodgingDiscount: 0.10, perPerson: 170, perChild6: 60, perReservation: 0, capacity: 8,
    includes: [...BASE, 'Um almoço na beira da praia', 'Passeio de barco pelo rio e manguezal'],
    itinerary: [{ day: 'Feriado', title: 'Praia e barco', text: 'Almoço na barraca parceira e passeio de barco no dia que preferir.' }],
    photo: { src: '/images/pacotes/feriado-prolongado.jpg', alt: 'Barco no rio Jucuruçu' },
    seasonLabel: 'Feriados de 2027',
  },
];

export const getPackage = (slug: string) => packages.find((p) => p.slug === slug);
export const featuredPackages = () => packages.filter((p) => p.featured);
