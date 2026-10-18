/**
 * Extras avulsos oferecidos no funil de reserva (sem pacote). Valores estimados. TODO confirmar com parceiros.
 */
export type Extra = { id: string; name: string; text: string; price: number; per: 'pessoa' | 'reserva' };
export const extras: Extra[] = [
  { id: 'barco-baleias', name: 'Passeio de barco para ver baleias', text: 'Julho a novembro, meio período, operador autorizado.', price: 200, per: 'pessoa' },
  { id: 'almoco-praia', name: 'Almoço na beira da praia', text: 'Prato principal e bebida em restaurante parceiro.', price: 90, per: 'pessoa' },
  { id: 'cafe-no-quarto', name: 'Café no quarto com frutas da região', text: 'Servido na primeira manhã, com espumante.', price: 120, per: 'reserva' },
  { id: 'transfer-aeroporto', name: 'Transfer do aeroporto de Porto Seguro', text: 'Carro particular, ida e volta, até 4 pessoas.', price: 700, per: 'reserva' },
  { id: 'passeio-4x4', name: 'Passeio 4x4 a Cumuruxatiba e Corumbau', text: 'Dia inteiro pelas falésias e pela reserva.', price: 180, per: 'pessoa' },
];
export const getExtra = (id: string) => extras.find((e) => e.id === id);
