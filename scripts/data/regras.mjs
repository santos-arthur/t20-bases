/**
 * As contas das regras de bases, como funções puras.
 *
 * Ficam separadas de propósito: funções sem Foundry por perto podem ser
 * conferidas contra a tabela do livro em `testes/regras.test.mjs`, sem abrir o
 * jogo. Tudo que é fórmula mora aqui — a ficha só exibe.
 *
 * Fonte das regras: Tormenta20 - Heróis de Arton (Jambô Editora), capítulo 3,
 * "Bases". Material de fã, não oficial.
 */

/**
 * Tabela 3-6: Características de Bases, na ordem de crescimento.
 *
 * As chaves são as mesmas que o sistema Tormenta20 grava em `system.porte` do
 * Ator de tipo "bases" — por isso `for` é Formidável, e não Fortificação.
 */
export const PORTES = [
  { id: "min", nome: "Mínima", custo: 1000, manutencao: 100, comodos: 0 },
  { id: "mod", nome: "Modesta", custo: 3000, manutencao: 300, comodos: 3 },
  { id: "bas", nome: "Básica", custo: 6000, manutencao: 600, comodos: 6 },
  { id: "for", nome: "Formidável", custo: 10000, manutencao: 1000, comodos: 9 },
  { id: "gra", nome: "Grandiosa", custo: 15000, manutencao: 1500, comodos: 12 },
  { id: "sup", nome: "Suprema", custo: 21000, manutencao: 2100, comodos: 15 }
];

/** O porte de uma base recém-construída. */
export const PORTE_INICIAL = "min";

/** CD do teste de Nobreza para construir uma base. */
export const CD_CONSTRUCAO = 20;

/** Custo de cada tentativa de construir uma base (o preço do porte mínimo). */
export const CUSTO_CONSTRUCAO = 1000;

/** Comprar uma base pronta custa três vezes o valor da tabela. */
export const MULTIPLICADOR_COMPRA = 3;

/** Custo de construir qualquer cômodo, a cada tentativa. */
export const CUSTO_COMODO = 1000;

/** Segurança: "um número de 0 a 20". */
export const SEGURANCA_MAXIMA = 20;

/**
 * Quantos pontos abaixo da segurança o ND de um invasor precisa estar para que
 * ele nem consiga entrar.
 */
export const MARGEM_INVASAO = 5;

/** Máximo de mobílias que a sala de estar comporta; os demais cômodos, uma. */
export const MOBILIAS_SALA_DE_ESTAR = 3;

/* -------------------------------------------- */
/*  Porte                                       */
/* -------------------------------------------- */

/** A linha da tabela de um porte, ou `null` se a chave não existir. */
export function porte(id) {
  return PORTES.find((p) => p.id === id) ?? null;
}

/** Posição do porte na escala (0 = mínima), ou -1 se não existir. */
export function indiceDoPorte(id) {
  return PORTES.findIndex((p) => p.id === id);
}

/** O porte seguinte, ou `null` quando a base já é suprema. */
export function proximoPorte(id) {
  const i = indiceDoPorte(id);
  return i >= 0 && i < PORTES.length - 1 ? PORTES[i + 1] : null;
}

/** O porte `id` é igual ou maior que `minimo`? */
export function porteAlcanca(id, minimo) {
  if (!minimo) return true;
  return indiceDoPorte(id) >= indiceDoPorte(minimo);
}

/** Quantos cômodos cabem numa base deste porte. */
export function comodosDisponiveis(id) {
  return porte(id)?.comodos ?? 0;
}

/** Manutenção paga no início de cada aventura. */
export function manutencao(id) {
  return porte(id)?.manutencao ?? 0;
}

/**
 * Metade do custo — o que o sítio sagrado do ermitão paga para ampliar o porte
 * e construir cômodos.
 */
function aplicarMetade(valor, metade) {
  return metade ? Math.floor(valor / 2) : valor;
}

/**
 * Ampliar o porte custa a diferença de preço entre o atual e o próximo.
 * `null` quando não há próximo.
 */
export function custoAmpliacao(id, { metade = false } = {}) {
  const atual = porte(id);
  const proximo = proximoPorte(id);
  if (!atual || !proximo) return null;
  return aplicarMetade(proximo.custo - atual.custo, metade);
}

/** CD para ampliar: 20 + o número de cômodos do novo porte. */
export function cdAmpliacao(id) {
  const proximo = proximoPorte(id);
  return proximo ? CD_CONSTRUCAO + proximo.comodos : null;
}

/** Preço de comprar uma base pronta deste porte. */
export function precoCompra(id) {
  const linha = porte(id);
  return linha ? linha.custo * MULTIPLICADOR_COMPRA : null;
}

/* -------------------------------------------- */
/*  Cômodos                                     */
/* -------------------------------------------- */

/** CD para construir um cômodo: 20 + o número de cômodos que a base pode ter. */
export function cdComodo(id) {
  return CD_CONSTRUCAO + comodosDisponiveis(id);
}

/** Custo de cada tentativa de construir um cômodo. */
export function custoComodo({ metade = false } = {}) {
  return aplicarMetade(CUSTO_COMODO, metade);
}

/**
 * Reparar um cômodo danificado custa metade do custo dele. O custo é o de
 * construção pago de fato — daí o sítio sagrado também entrar aqui.
 */
export function custoReparo({ metade = false } = {}) {
  return Math.floor(custoComodo({ metade }) / 2);
}

/* -------------------------------------------- */
/*  Reforma                                     */
/* -------------------------------------------- */

/** Trocar o tipo custa metade do custo de construção. */
export function custoReforma() {
  return Math.floor(CUSTO_CONSTRUCAO / 2);
}

/**
 * CD para reformar: "20 + seu número de cômodos". O módulo lê "seu número de
 * cômodos" como a capacidade do porte, igual à CD de construir um cômodo — o
 * texto não diz se são os construídos ou os que cabem (ver docs/regras.md).
 */
export function cdReforma(id) {
  return cdComodo(id);
}

/* -------------------------------------------- */
/*  Segurança                                   */
/* -------------------------------------------- */

/** A segurança efetiva fica entre 0 e 20, some o que somar. */
export function limitarSeguranca(valor) {
  return Math.min(SEGURANCA_MAXIMA, Math.max(0, Number(valor) || 0));
}

/**
 * Penalidade de um invasor em testes de perícia e rolagens de dano dentro da
 * base: a diferença entre a segurança e o ND dele, quando o ND é menor.
 */
export function penalidadeInvasor(nd, seguranca) {
  const diferenca = limitarSeguranca(seguranca) - Number(nd);
  return diferenca > 0 ? diferenca : 0;
}

/** Criaturas com ND 5 pontos abaixo da segurança não conseguem invadir. */
export function invasaoImpossivel(nd, seguranca) {
  return Number(nd) <= limitarSeguranca(seguranca) - MARGEM_INVASAO;
}

/* -------------------------------------------- */
/*  Mobílias                                    */
/* -------------------------------------------- */

/**
 * Quantas gárgulas animadas a base comporta: uma por categoria de porte acima
 * de básico — formidável 1, grandiosa 2, suprema 3.
 */
export function limiteDeGargulas(id) {
  return Math.max(0, indiceDoPorte(id) - indiceDoPorte("bas"));
}

/** Quantas mobílias um cômodo comporta. */
export function mobiliasPorComodo(comodoId) {
  return comodoId === "sala-de-estar" ? MOBILIAS_SALA_DE_ESTAR : 1;
}

/* -------------------------------------------- */
/*  Empreendimento                              */
/* -------------------------------------------- */

/**
 * O que uma base do tipo Empreendimento rende no intervalo entre aventuras: o
 * resultado do teste de Inteligência (que já soma o número de cômodos que a
 * base pode ter), em tibares de ouro. Quem gasta a própria ação administrando
 * recebe o dobro.
 *
 * O resultado volta em TO, que é a unidade do livro; `TO_EM_TIBARES` converte.
 */
export function rendimentoEmpreendimento(resultado, { dedicado = false } = {}) {
  const valor = Math.max(0, Number(resultado) || 0);
  return dedicado ? valor * 2 : valor;
}

/** Um tibar de ouro vale dez tibares. */
export const TO_EM_TIBARES = 10;
