import { pousada } from '../data/pousada';

export const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

/** Link de WhatsApp com mensagem pronta e origem rastreável. */
export const waLink = (text: string) =>
  `https://wa.me/${pousada.whatsapp}?text=${encodeURIComponent(text)}`;

export const waDefault = (context = 'o site') =>
  waLink(`Olá! Vi a Pousada Orla do Sol em ${context} e quero saber disponibilidade e valores.`);

export const fullAddress = () => {
  const a = pousada.address;
  return `${a.street}, ${a.neighborhood}, ${a.city} - ${a.state}, ${a.postalCode}`;
};
