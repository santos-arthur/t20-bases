/**
 * Os tipos de base: a forma física e a função principal, escolhidas ao criar a
 * base e trocadas só por reforma.
 *
 * O sistema guarda o tipo como texto livre em `system.tipo`. O módulo grava ali
 * o nome do tipo, para a ficha do sistema continuar legível, e a chave numa
 * flag — texto que não bate com nenhum tipo é um tipo da casa, sem benefícios
 * automáticos.
 *
 * Fonte das regras: Tormenta20 - Heróis de Arton (Jambô Editora). Material de
 * fã, não oficial.
 */

import { naFicha, naRolagem, recurso, RESISTENCIAS, somar } from "./efeitos.mjs";

/**
 * @typedef {object} Tipo
 * @property {string} id
 * @property {string} nome
 * @property {string} efeito        O que o tipo faz, em regras.
 * @property {number} [seguranca]   Bônus na segurança da base.
 * @property {Function} [residentes] `(ctx) => peças` — ver efeitos.mjs.
 * @property {Function} [base]      `(ctx) => changes` aplicados no Ator da base.
 * @property {boolean} [lembrete]   Parte do efeito fica com a mesa.
 * @property {object} [variantes]   Escolha feita junto com o tipo.
 */

/** @type {Record<string, Tipo>} */
export const TIPOS = {
  "centro-de-poder": {
    id: "centro-de-poder",
    nome: "Centro de Poder",
    efeito: "Construída sobre um centro de energias mágicas. Os residentes recebem +1 PM.",
    residentes: () => [naFicha(recurso("pm", 1))]
  },

  empreendimento: {
    id: "empreendimento",
    nome: "Empreendimento",
    efeito: "Parte de um negócio. Uma vez a cada intervalo entre aventuras, um residente faz um teste de " +
      "Inteligência com bônus igual ao número de cômodos que a base pode ter; a base rende esse resultado em " +
      "tibares de ouro. Quem gasta a própria ação no intervalo administrando recebe o dobro. Com as regras de " +
      "negócios de Fim dos Tempos Arco 2: Valkaria, em vez disso a base conta como um negócio de nível 1.",
    lembrete: true
    // Sem efeito na ficha: o rendimento é uma ação da aba Visão geral.
  },

  esconderijo: {
    id: "esconderijo",
    nome: "Esconderijo",
    efeito: "Local oculto ou disfarçado. Os residentes recebem +1 em testes de resistência.",
    residentes: () => [naRolagem({ pericias: RESISTENCIAS, valor: 1 })]
  },

  fortificacao: {
    id: "fortificacao",
    nome: "Fortificação",
    efeito: "Estrutura fortificada ou de difícil acesso. A base recebe +5 em segurança e os residentes " +
      "recebem +1 na Defesa.",
    seguranca: 5,
    residentes: () => [naFicha(somar("system.attributes.defesa.bonus", 1))]
  },

  movel: {
    id: "movel",
    nome: "Móvel",
    efeito: "Um veículo terrestre (deslocamento 12m) ou aquático (natação 12m), que não submerge sem o domo " +
      "protetor. Os residentes recebem +1,5m em seu deslocamento.",
    variantes: {
      terrestre: { nome: "Terrestre", deslocamento: "walk" },
      aquatico: { nome: "Aquático", deslocamento: "swim" }
    },
    residentes: () => [naFicha(somar("system.attributes.movement.walk", 1.5))],
    // O deslocamento da própria base, no campo que o sistema já tem para isso.
    base: (ctx) => {
      const tipo = TIPOS.movel.variantes[ctx.variante]?.deslocamento ?? "walk";
      return [somar(`system.attributes.movement.${tipo}`, 12)];
    }
  },

  residencia: {
    id: "residencia",
    nome: "Residência",
    efeito: "Local confortável e aconchegante. Cada residente recebe +3 PV e, uma vez por aventura, pode " +
      "receber os benefícios de um prato especial (Tormenta20, p. 162).",
    lembrete: true,
    residentes: () => [naFicha(recurso("pv", 3))]
  }
};

/** Normaliza um nome para comparação: sem acento, sem caixa, sem espaço sobrando. */
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** O tipo cujo nome bate com um texto livre, ou `null`. */
export function tipoPeloNome(texto) {
  const alvo = normalizar(texto);
  if (!alvo) return null;
  return Object.values(TIPOS).find((t) => normalizar(t.nome) === alvo || t.id === alvo) ?? null;
}

/** Lista para seletores, na ordem do livro. */
export function listarTipos() {
  return Object.values(TIPOS);
}
