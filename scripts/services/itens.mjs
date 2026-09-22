/**
 * Monta os Itens de cômodo e mobília a partir do catálogo.
 *
 * O Item é a forma que o sistema Tormenta20 já tem de guardar um cômodo, e os
 * Active Effects dentro dele são os benefícios. O módulo usa a mesma convenção
 * do sistema para o alvo de cada efeito:
 *
 *  - `transfer: false` — o efeito é dos residentes. Fica no Item, e a
 *    sincronização copia para a ficha de cada um.
 *  - `transfer: true`  — o efeito é da própria base, como o bônus em segurança
 *    da guarita. O Foundry o aplica no Ator da base.
 *
 * Efeitos criados aqui levam a flag `gerado`, para que remontar o Item (a
 * mobília mudou de cômodo) não apague o que o mestre acrescentou à mão.
 *
 * Fonte das regras: Tormenta20 - Heróis de Arton (Jambô Editora). Material de
 * fã, não oficial.
 */

import { FLAGS, ITEM_COMODO, ITEM_MOBILIA, MODULO } from "../constants.mjs";
import { iconeDe } from "../data/comodos.mjs";
import { iconeDaMobilia } from "../data/mobilias.mjs";
import * as T20 from "./t20-adapter.mjs";

/** Flag dos efeitos que o módulo gerou dentro de um Item. */
export const GERADO = "gerado";

/** O contexto que o catálogo recebe para montar os benefícios. */
export function contextoDoCatalogo(extra = {}) {
  return { oficios: T20.chavesDeOficio(), ...extra };
}

/**
 * Converte as peças do catálogo em dados de Active Effect.
 *
 * @param {object[]} pecas   Saída de `def.residentes(ctx)`.
 * @param {object} opcoes    `{ nome, img, descricao, flags }`
 */
export function efeitosDasPecas(pecas, { nome, img, descricao = "", flags = {} }) {
  return (pecas ?? []).filter(Boolean).map((peca) => {
    const comum = {
      name: nome,
      img,
      transfer: false,
      description: `<p>${descricao}</p>`,
      flags: { [MODULO]: { [GERADO]: true, ...flags } }
    };

    if (peca.tipo === "ficha") return { ...comum, disabled: false, changes: peca.changes };

    // Efeito "ao usar": o sistema espera o efeito desligado — quem o liga é a
    // marcação no diálogo de rolagem. `names` limita a quais perícias ele
    // aparece; sem nomes, aparece em todas as rolagens daquele tipo.
    const { tipos, pericias, nomes, changes, automatico, custo } = peca.aoUsar;
    return {
      ...comum,
      disabled: true,
      system: {
        onuse: true,
        changes,
        abilityUse: {
          description: descricao,
          automatic: automatico ?? true,
          aumenta: false,
          custo: custo ?? null,
          names: [...nomes, ...pericias.map((chave) => T20.rotuloDePericia(null, chave))],
          types: tipos
        }
      }
    };
  });
}

/** O efeito que soma segurança no Ator da base. */
export function efeitoDeSeguranca(valor, { nome, img }) {
  return {
    name: game.i18n.format("T20BAS.EfeitoSeguranca", { nome }),
    img,
    transfer: true,
    disabled: false,
    changes: [{ key: "system.seguranca.bonus", mode: 2, type: "add", value: String(valor) }],
    flags: { [MODULO]: { [GERADO]: true } }
  };
}

/** Todos os efeitos que um cômodo ou mobília do catálogo leva dentro do Item. */
export function efeitosDoCatalogo(def, ctx, { nome = def.nome, img } = {}) {
  const efeitos = efeitosDasPecas(def.residentes?.(contextoDoCatalogo(ctx)) ?? [], {
    nome,
    img,
    descricao: def.efeito
  });
  if (def.seguranca) efeitos.push(efeitoDeSeguranca(def.seguranca, { nome, img }));
  return efeitos;
}

/** Dados de criação do Item de um cômodo do catálogo. */
export function dadosDoComodo(def) {
  const img = iconeDe(def);
  return {
    name: def.nome,
    type: ITEM_COMODO,
    img,
    system: {
      description: { value: descricaoHTML(def) },
      preco: 1000,
      residentes: true
    },
    effects: efeitosDoCatalogo(def, {}, { img }),
    flags: { [MODULO]: { [FLAGS.catalogo]: def.id } }
  };
}

/**
 * Dados de criação do Item de uma mobília do catálogo. Os efeitos dependem do
 * cômodo anfitrião, então só entram quando ele é conhecido.
 */
export function dadosDaMobilia(def, { anfitriao = null, escolha = "" } = {}) {
  const img = iconeDaMobilia(def);
  return {
    name: def.nome,
    type: ITEM_MOBILIA,
    img,
    system: {
      description: { value: descricaoHTML(def) },
      preco: def.preco,
      residentes: true
    },
    effects: efeitosDoCatalogo(def, { comodo: anfitriao, escolha }, { img }),
    flags: {
      [MODULO]: {
        [FLAGS.catalogo]: def.id,
        [FLAGS.escolha]: escolha
      }
    }
  };
}

/** A descrição que o Item mostra na ficha do sistema. */
function descricaoHTML(def) {
  const partes = [];
  if (def.resumo) partes.push(`<p><em>${def.resumo}</em></p>`);
  partes.push(`<p>${def.efeito}</p>`);
  if (def.nota) partes.push(`<p><small>${def.nota}</small></p>`);
  return partes.join("");
}

/** O efeito soma na segurança da base — e portanto é da base, não dos residentes? */
function ehDaBase(efeito) {
  return (efeito.changes ?? []).some((c) => c.key === "system.seguranca.bonus");
}

/**
 * O sistema decide o `transfer` de um efeito criado dentro de um cômodo a
 * partir do campo `residentes` do Item, e isso jogaria o bônus de segurança
 * para os residentes. Depois de criar, o módulo confere os efeitos que gerou e
 * corrige o que saiu diferente: segurança é da base, o resto é dos residentes.
 */
export async function corrigirTransfer(item) {
  const atualizar = item.effects
    .filter((e) => e.getFlag(MODULO, GERADO) && e.transfer !== ehDaBase(e))
    .map((e) => ({ _id: e.id, transfer: ehDaBase(e) }));
  if (atualizar.length) await item.updateEmbeddedDocuments("ActiveEffect", atualizar);
}

/**
 * Refaz os efeitos gerados de um Item — a mobília mudou de cômodo, ou de
 * escolha. Efeitos que o mestre acrescentou à mão ficam como estão.
 */
export async function remontarEfeitos(item, desejados) {
  const gerados = item.effects.filter((e) => e.getFlag(MODULO, GERADO)).map((e) => e.id);
  if (gerados.length) await item.deleteEmbeddedDocuments("ActiveEffect", gerados);
  if (!desejados.length) return;
  await item.createEmbeddedDocuments("ActiveEffect", desejados);
  await corrigirTransfer(item);
}

/**
 * Liga ou desliga os efeitos que um Item aplica na própria base — um cômodo
 * danificado deixa de fornecer seus bônus, inclusive o de segurança.
 */
export async function alternarEfeitosNaBase(item, ativos) {
  const atualizar = item.effects
    .filter((e) => e.transfer && !e.system?.onuse && e.disabled === ativos)
    .map((e) => ({ _id: e.id, disabled: !ativos }));
  if (atualizar.length) await item.updateEmbeddedDocuments("ActiveEffect", atualizar);
}
