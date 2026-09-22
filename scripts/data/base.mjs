/**
 * Leitura de uma base do sistema Tormenta20, com tudo que o módulo deriva dela.
 *
 * O Ator de tipo "bases" é do sistema: ele guarda porte, segurança, residentes
 * e os Itens de cômodo e mobília. O que o schema dele não tem — proprietário,
 * tipo do catálogo, registro — o módulo guarda em flags. Esta função junta as
 * duas coisas num objeto só, para a ficha e as operações não precisarem saber
 * onde cada dado mora.
 *
 * É uma leitura, e não um DataModel, porque o documento não é do módulo.
 *
 * Fonte das regras: Tormenta20 - Heróis de Arton (Jambô Editora). Material de
 * fã, não oficial.
 */

import { FLAGS, ITEM_COMODO, ITEM_MOBILIA, MODULO, TIPO_NEGOCIO } from "../constants.mjs";
import { COMODOS, checarRequisitos } from "./comodos.mjs";
import { cabeEm, ehExterior, MOBILIAS } from "./mobilias.mjs";
import * as Regras from "./regras.mjs";
import { TIPOS, tipoPeloNome } from "./tipos.mjs";

/** Uma flag do módulo num documento, com valor padrão. */
export function flag(doc, chave, padrao = null) {
  return doc?.getFlag?.(MODULO, chave) ?? doc?.flags?.[MODULO]?.[chave] ?? padrao;
}

/** O tipo do catálogo de uma base: a flag, ou o nome escrito em `system.tipo`. */
export function tipoDaBase(actor) {
  const chave = flag(actor, FLAGS.tipo);
  if (chave && TIPOS[chave]) return TIPOS[chave];
  return tipoPeloNome(actor?.system?.tipo);
}

/** Um cômodo da base, já com o catálogo e o estado. */
function lerComodo(item) {
  const id = flag(item, FLAGS.catalogo);
  const def = COMODOS[id] ?? null;
  return {
    item,
    id: item.id,
    catalogo: def ? id : null,
    def,
    nome: item.name,
    danificado: !!flag(item, FLAGS.danificado),
    ocupantes: flag(item, FLAGS.ocupantes, []) ?? [],
    limiteOcupantes: def?.ocupantes ?? null,
    mobilias: []
  };
}

/** Uma mobília da base, com o cômodo que a recebe resolvido depois. */
function lerMobilia(item) {
  const id = flag(item, FLAGS.catalogo);
  const def = MOBILIAS[id] ?? null;
  return {
    item,
    id: item.id,
    catalogo: def ? id : null,
    def,
    nome: item.name,
    exterior: ehExterior(def),
    instaladaEm: flag(item, FLAGS.instaladaEm),
    escolha: flag(item, FLAGS.escolha, ""),
    anfitriao: null
  };
}

/**
 * Tudo que a interface e as operações precisam saber de uma base.
 *
 * @param {Actor} actor Um Ator de tipo "bases".
 */
export function lerBase(actor) {
  const sistema = actor.system ?? {};
  const porteId = Regras.porte(sistema.porte) ? sistema.porte : Regras.PORTE_INICIAL;
  const porte = Regras.porte(porteId);
  const proximo = Regras.proximoPorte(porteId);
  const sitioSagrado = !!flag(actor, FLAGS.sitioSagrado);

  const itens = [...(actor.items ?? [])];
  const comodos = itens.filter((i) => i.type === ITEM_COMODO)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map(lerComodo);
  const mobilias = itens.filter((i) => i.type === ITEM_MOBILIA)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map(lerMobilia);

  // Cada mobília instalada vai para dentro do seu cômodo.
  for (const m of mobilias) {
    const anfitriao = comodos.find((c) => c.id === m.instaladaEm);
    if (!anfitriao || m.exterior) continue;
    m.anfitriao = anfitriao;
    anfitriao.mobilias.push(m);
  }

  const idsCatalogo = comodos.map((c) => c.catalogo).filter(Boolean);
  const capacidade = Regras.comodosDisponiveis(porteId);
  const tipo = tipoDaBase(actor);

  const seguranca = sistema.seguranca ?? {};
  const segurancaTotal = Number(seguranca.total ?? (seguranca.base ?? 0) + (seguranca.bonus ?? 0)) || 0;

  const residentes = [...(sistema.residentes ?? [])]
    .map((id) => game.actors?.get(id))
    .filter(Boolean);

  const proprietarioId = flag(actor, FLAGS.proprietario);
  const negocioId = flag(actor, FLAGS.negocio);
  const negocio = negocioId ? game.actors?.get(negocioId) ?? null : null;

  return {
    actor,
    porteId,
    porte,
    proximo,
    capacidade,
    usados: comodos.length,
    vagasLivres: Math.max(0, capacidade - comodos.length),
    excedentes: Math.max(0, comodos.length - capacidade),
    comodos,
    mobilias,
    soltas: mobilias.filter((m) => !m.anfitriao && !m.exterior),
    exteriores: mobilias.filter((m) => m.exterior),
    idsCatalogo,
    tipo,
    tipoTexto: sistema.tipo ?? "",
    variante: flag(actor, FLAGS.variante, "terrestre"),
    sitioSagrado,
    seguranca: {
      base: Number(seguranca.base ?? 0) || 0,
      bonus: Number(seguranca.bonus ?? 0) || 0,
      total: segurancaTotal,
      efetiva: Regras.limitarSeguranca(segurancaTotal),
      excedeu: segurancaTotal > Regras.SEGURANCA_MAXIMA
    },
    manutencao: Regras.manutencao(porteId),
    residentes,
    proprietarioId,
    proprietario: proprietarioId ? game.actors?.get(proprietarioId) ?? null : null,
    // Uma base que já tem porte ou cômodos existia antes do módulo: conta como
    // adquirida, em vez de pedir um teste de construção que ninguém fez.
    adquirida: !!flag(actor, FLAGS.adquirida) || porteId !== Regras.PORTE_INICIAL || itens.length > 0,
    registro: flag(actor, FLAGS.registro, []) ?? [],
    negocioId,
    // Só vale se ainda existir e ainda for um negócio: um id órfão não é vínculo.
    negocio: negocio?.type === TIPO_NEGOCIO ? negocio : null,

    // Contas prontas para a interface
    custoAmpliacao: Regras.custoAmpliacao(porteId, { metade: sitioSagrado }),
    cdAmpliacao: Regras.cdAmpliacao(porteId),
    cdComodo: Regras.cdComodo(porteId),
    custoComodo: Regras.custoComodo({ metade: sitioSagrado }),
    custoReparo: Regras.custoReparo({ metade: sitioSagrado }),
    cdReforma: Regras.cdReforma(porteId),
    custoReforma: Regras.custoReforma(),
    limiteGargulas: Regras.limiteDeGargulas(porteId),
    gargulas: mobilias.filter((m) => m.catalogo === "gargula-animada").length
  };
}

/** Um cômodo do catálogo pode ser construído nesta base agora? */
export function checarComodo(leitura, id) {
  const def = COMODOS[id];
  if (!def) return { ok: false, faltando: { porte: null, comodos: [], jaTem: false } };
  return checarRequisitos(def, {
    porte: leitura.porteId,
    comodosExistentes: leitura.idsCatalogo,
    porteAlcanca: Regras.porteAlcanca
  });
}

/**
 * Onde uma mobília pode ser instalada: os cômodos compatíveis, com a contagem
 * de mobílias que cada um já tem.
 *
 * @returns {{comodo: object, cheio: boolean}[]}
 */
export function destinosPara(leitura, defMobilia, { ignorar = null } = {}) {
  return leitura.comodos
    .filter((c) => !c.catalogo || cabeEm(defMobilia, c.catalogo))
    .map((c) => {
      const outras = c.mobilias.filter((m) => m.id !== ignorar);
      const limite = Regras.mobiliasPorComodo(c.catalogo);
      // Na sala de estar, as três precisam ser diferentes.
      const repetida = c.catalogo === "sala-de-estar" && defMobilia &&
        outras.some((m) => m.catalogo === defMobilia.id);
      return { comodo: c, cheio: outras.length >= limite || repetida };
    });
}
