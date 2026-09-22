/**
 * Tudo que o módulo sabe sobre o sistema Tormenta20 mora aqui.
 *
 * O resto do código pergunta "qual o bônus de Nobreza desse ator?" sem saber
 * onde o sistema guarda isso. Se o sistema mudar de schema, só este arquivo
 * precisa mudar, e as funções degradam para um modo manual em vez de quebrar a
 * interface.
 */

import { PERICIA_NOBREZA, SISTEMA } from "../constants.mjs";

/** O sistema Tormenta20 está ativo e com a estrutura que esperamos? */
export function temSistemaT20() {
  return game.system?.id === SISTEMA && !!CONFIG.T20?.pericias;
}

/** Chaves das perícias de Ofício conhecidas pelo sistema. */
export function chavesDeOficio() {
  if (!temSistemaT20()) return [];
  return [...(CONFIG.T20.oficios ?? [])];
}

/** Rótulo legível de uma perícia, com carinho para as personalizadas. */
export function rotuloDePericia(actor, key) {
  const custom = actor?.system?.pericias?.[key];
  if (custom?.custom && custom.label) return custom.label;
  const config = CONFIG.T20?.pericias?.[key];
  return config ? game.i18n.localize(config.label) : key;
}

/**
 * As perícias com que se constrói: Nobreza primeiro, e depois qualquer outra —
 * o livro aceita "outra perícia que você possa justificar e seja aprovada pelo
 * mestre", e quem aprova é a mesa, não o módulo.
 *
 * @returns {{key: string, label: string, valor: number}[]}
 */
export function periciasDeConstrucao(actor) {
  if (!temSistemaT20()) return [];
  const valor = (key) => Number(actor?.system?.pericias?.[key]?.value ?? 0);

  const outras = Object.keys(actor?.system?.pericias ?? CONFIG.T20.pericias)
    .filter((key) => key !== PERICIA_NOBREZA)
    .map((key) => ({ key, label: rotuloDePericia(actor, key), valor: valor(key) }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  return [{ key: PERICIA_NOBREZA, label: rotuloDePericia(actor, PERICIA_NOBREZA), valor: valor(PERICIA_NOBREZA) },
    ...outras];
}

/**
 * Rola uma perícia pela ficha do personagem, abrindo o diálogo de rolagem do
 * próprio sistema — com os bônus, efeitos e modificadores que ele já conhece.
 *
 * @returns {Promise<{suportado: boolean, cancelado: boolean, resultado: object|null}>}
 */
export async function rolarPelaFicha(actor, pericia, { cd, titulo }) {
  if (!temSistemaT20() || !pericia || typeof actor?.rollPericia !== "function") {
    return { suportado: false, cancelado: false, resultado: null };
  }

  // `message: false` devolve a Roll em vez de publicar um card do sistema —
  // quem publica é o módulo, com o contexto da base.
  const roll = await actor.rollPericia(pericia, { message: false });
  if (!roll) return { suportado: true, cancelado: true, resultado: null };

  return {
    suportado: true,
    cancelado: false,
    resultado: {
      roll,
      total: roll.total,
      sucesso: roll.total >= cd,
      cd,
      titulo,
      actor,
      pericia,
      rotuloPericia: rotuloDePericia(actor, pericia)
    }
  };
}

/**
 * Teste de Inteligência pela ficha, com um bônus extra — o do Empreendimento,
 * igual ao número de cômodos que a base pode ter.
 */
export async function rolarInteligencia(actor, bonus) {
  if (!temSistemaT20() || typeof actor?.rollAtributo !== "function") return null;
  const roll = await actor.rollAtributo("int", { message: false, parts: [String(bonus)] });
  return roll ?? null;
}

/** Rola um teste com bônus digitado à mão, para quando não há ficha para ler. */
export async function rolarManual({ bonus = 0, cd, titulo }) {
  const formula = bonus >= 0 ? `1d20 + ${bonus}` : `1d20 - ${Math.abs(bonus)}`;
  const roll = await new Roll(formula).evaluate();
  return { roll, total: roll.total, sucesso: roll.total >= cd, cd, titulo, actor: null, pericia: null };
}
