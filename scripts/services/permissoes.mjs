/**
 * Quem pode o quê.
 *
 * No módulo de negócios esta regra nasceu espalhada e foi doendo; aqui ela
 * mora num lugar só desde o começo.
 */

import { FLAGS, MODULO } from "../constants.mjs";

/**
 * Quem administra a base: o Mestre e o jogador do personagem proprietário. Os
 * demais abrem a ficha e leem — inclusive os residentes, que recebem os bônus,
 * porque morar não é administrar.
 *
 * Sem proprietário definido, administra quem tem ownership do Ator da base —
 * é assim que o sistema já funcionava antes do módulo. Com proprietário, é
 * preciso as duas coisas: ser dono do personagem proprietário e do Ator da base
 * (sem o segundo, o Foundry recusaria as gravações). Ao escolher o
 * proprietário, a ficha já concede esse ownership.
 */
export function podeAdministrar(base) {
  if (game.user.isGM) return true;
  if (!base?.isOwner) return false;
  const proprietarioId = base.getFlag?.(MODULO, FLAGS.proprietario);
  const proprietario = proprietarioId ? game.actors.get(proprietarioId) : null;
  return proprietario ? proprietario.isOwner : true;
}

/**
 * Dá aos jogadores do proprietário o controle do Ator da base, e deixa os
 * demais como observadores — todo mundo lê a ficha, só quem administra mexe.
 * Só o Mestre muda ownership.
 */
export function ownershipPara(proprietario, atual = {}) {
  const { OWNER, OBSERVER } = CONST.DOCUMENT_OWNERSHIP_LEVELS;
  const ownership = { ...atual, default: Math.max(atual.default ?? 0, OBSERVER) };
  if (!proprietario) return ownership;
  for (const [userId, nivel] of Object.entries(proprietario.ownership)) {
    if (userId !== "default" && nivel === OWNER) ownership[userId] = OWNER;
  }
  return ownership;
}
