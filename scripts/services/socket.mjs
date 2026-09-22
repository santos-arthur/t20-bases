/**
 * Ponte para o Mestre.
 *
 * O proprietário administra a própria base, mas não pode escrever na ficha dos
 * outros residentes. Quando isso acontece, o pedido viaja por socket e o
 * primeiro Mestre conectado executa — e ele não executa às cegas: recalcula os
 * efeitos a partir do estado da própria base, então um cliente não consegue
 * pedir uma alteração que a base não justifique.
 */

import { MODULO, SOCKET } from "../constants.mjs";
import { limparEfeitos, sincronizar } from "./beneficios.mjs";

const ACOES = {
  sincronizar: "sincronizar",
  limpar: "limpar"
};

/** Este cliente é o Mestre responsável por atender pedidos? */
function souORelay() {
  if (!game.user.isGM) return false;
  const gms = game.users.filter((u) => u.isGM && u.active).sort((a, b) => a.id.localeCompare(b.id));
  return gms[0]?.id === game.user.id;
}

export function registrarSocket() {
  game.socket.on(SOCKET, async (pedido) => {
    if (!souORelay()) return;

    try {
      switch (pedido.acao) {
        case ACOES.sincronizar: {
          const base = game.actors.get(pedido.baseId);
          if (base) await sincronizar(base, { somenteLocais: false });
          break;
        }
        case ACOES.limpar:
          await limparEfeitos(pedido.baseId, { somenteLocais: false });
          break;
      }
    } catch (erro) {
      console.error(`${MODULO} | falha ao atender pedido via socket`, pedido, erro);
    }
  });
}

/** Há um Mestre conectado para atender pedidos? */
export function temMestreConectado() {
  return game.users.some((u) => u.isGM && u.active);
}

/**
 * Sincroniza o que der localmente e, quando autorizado, delega o restante ao
 * Mestre.
 *
 * Quem não administra a base pode sincronizar mesmo assim — mas só as fichas
 * que possui. É o residente querendo os bônus na própria ficha sem depender do
 * dono; delegar ali faria um jogador disparar escritas nas fichas dos outros.
 *
 * @returns {Promise<{delegado: boolean, pendentes: string[], aplicados: string[]}>}
 */
export async function sincronizarComApoio(base, { delegar = true } = {}) {
  const resultado = await sincronizar(base, { somenteLocais: !game.user.isGM });
  const pendentes = [...new Set(resultado.pendentes)];
  const aplicados = resultado.aplicados;

  if (!pendentes.length || !delegar || !temMestreConectado()) return { delegado: false, pendentes, aplicados };

  game.socket.emit(SOCKET, { acao: ACOES.sincronizar, baseId: base.id, de: game.user.id });
  return { delegado: true, pendentes, aplicados };
}

/** Pede a remoção dos efeitos de uma base excluída. */
export async function limparComApoio(baseId) {
  const pendentes = await limparEfeitos(baseId, { somenteLocais: !game.user.isGM });
  if (pendentes.length && temMestreConectado()) {
    game.socket.emit(SOCKET, { acao: ACOES.limpar, baseId, de: game.user.id });
  }
}
