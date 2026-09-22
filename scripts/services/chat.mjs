/**
 * Publicação dos resultados no chat.
 *
 * Todo teste e todo gasto vira uma mensagem — não por enfeite, mas porque uma
 * base é combinada entre mestre e jogadores ao longo de muitas aventuras, e o
 * log do chat é onde essa combinação fica registrada.
 */

import { MODULO } from "../constants.mjs";
import * as Regras from "../data/regras.mjs";

const TEMPLATE = `modules/${MODULO}/templates/chat/card.hbs`;

/**
 * Publica um card do módulo.
 *
 * @param {object} opcoes
 * @param {Actor} opcoes.base
 * @param {string} opcoes.titulo
 * @param {string} [opcoes.texto]      Parágrafo de contexto.
 * @param {object[]} [opcoes.linhas]   `[{ rotulo, valor }]`
 * @param {Roll} [opcoes.roll]         Rolagem a anexar à mensagem.
 * @param {Actor} [opcoes.falante]     Quem fala; o proprietário, por padrão.
 * @param {"sucesso"|"falha"|null} [opcoes.desfecho]
 */
export async function publicar({ base, titulo, texto = "", linhas = [], roll = null, falante = null, desfecho = null }) {
  const content = await foundry.applications.handlebars.renderTemplate(TEMPLATE, {
    titulo,
    texto,
    linhas: linhas.filter(Boolean),
    desfecho,
    base: { nome: base?.name, img: base?.img, porte: Regras.porte(base?.system?.porte)?.nome ?? "" },
    fonte: game.i18n.localize("T20BAS.Fonte")
  });

  const dados = {
    content,
    speaker: ChatMessage.getSpeaker({ actor: falante ?? undefined }),
    flags: { [MODULO]: { card: true } }
  };

  if (roll) {
    dados.rolls = [roll];
    dados.sound = CONFIG.sounds.dice;
  }

  return ChatMessage.create(dados);
}

/** Formata um valor em tibares para exibição. */
export function tibares(valor) {
  const n = Math.abs(Math.round(valor));
  const sinal = valor < 0 ? "−" : "";
  return `${sinal}T$ ${n.toLocaleString("pt-BR")}`;
}

/** Formata um valor em tibares de ouro. */
export function tibaresDeOuro(valor) {
  return `TO ${Math.round(valor).toLocaleString("pt-BR")}`;
}
