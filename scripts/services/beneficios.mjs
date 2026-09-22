/**
 * Leva os benefícios da base às fichas dos residentes.
 *
 * As fontes são duas:
 *
 *  - o **tipo** da base, que vem do catálogo em código;
 *  - os **Itens** de cômodo e mobília: cada Active Effect com `transfer: false`
 *    dentro deles é um benefício dos residentes. Vale para os Itens do catálogo
 *    e para os cômodos da casa que o mestre criar com o próprio sistema.
 *
 * Um cômodo danificado não fornece nada, e as mobílias dele também não. Uma
 * mobília só funciona instalada num cômodo (ou do lado de fora, a gárgula). Uma
 * suíte só beneficia seus ocupantes, e as mobílias dela idem.
 *
 * O que não vira efeito vira lembrete — o texto do cômodo, na aba Residentes.
 *
 * Benefícios de base são benefícios de estruturas: acumulam entre si, mas não
 * com outras estruturas (dádivas, domínios, negócios). O módulo avisa; quem
 * decide é a mesa.
 *
 * Fonte das regras: Tormenta20 - Heróis de Arton (Jambô Editora). Material de
 * fã, não oficial.
 */

import { CONFIGS, FLAGS, FONTE_TIPO, MODULO } from "../constants.mjs";
import { flag, lerBase } from "../data/base.mjs";
import { contextoDoCatalogo, efeitosDasPecas } from "./itens.mjs";

/** Ícone do efeito criado nas fichas, quando a base não tem imagem. */
const ICONE_EFEITO = "icons/environment/settlement/watchtower-cliff.webp";

/**
 * As fontes de benefício que valem para um residente, cada uma com os efeitos
 * que carrega e se tem algo que fica com a mesa.
 *
 * @returns {{fontes: object[], ignoradas: object[]}}
 */
export function fontesPara(leitura, actorId) {
  const fontes = [];
  const ignoradas = [];

  const tipo = leitura.tipo;
  if (tipo) {
    const efeitos = efeitosDasPecas(tipo.residentes?.(contextoDoCatalogo({ variante: leitura.variante })) ?? [], {
      nome: tipo.nome,
      img: leitura.actor.img || ICONE_EFEITO,
      descricao: tipo.efeito
    });
    fontes.push({ chave: FONTE_TIPO, nome: tipo.nome, efeito: tipo.efeito, efeitos, lembrete: !!tipo.lembrete });
  }

  for (const c of leitura.comodos) {
    const motivo = motivoParaIgnorar(c, actorId);
    if (motivo) {
      ignoradas.push({ nome: c.nome, motivo });
      continue;
    }
    fontes.push(fonteDoItem(c));

    for (const m of c.mobilias) fontes.push(fonteDoItem(m));
  }

  for (const m of leitura.exteriores) fontes.push(fonteDoItem(m));
  for (const m of leitura.soltas) ignoradas.push({ nome: m.nome, motivo: "T20BAS.MotivoNaoInstalada" });

  return { fontes, ignoradas };
}

/** Por que um cômodo não beneficia este residente, ou `null` se beneficia. */
function motivoParaIgnorar(comodo, actorId) {
  if (comodo.danificado) return "T20BAS.MotivoDanificado";
  if (comodo.limiteOcupantes && !comodo.ocupantes.includes(actorId)) return "T20BAS.MotivoOutrosOcupantes";
  return null;
}

/** Os efeitos que um Item passa aos residentes, prontos para copiar. */
function fonteDoItem(entrada) {
  const item = entrada.item;
  const efeitos = [...item.effects]
    .filter((e) => !e.transfer)
    .map((e) => {
      const dados = e.toObject();
      // Id e metadados são do efeito dentro do Item; a cópia na ficha é outro documento.
      delete dados._id;
      delete dados._stats;
      dados.flags ??= {};
      dados.flags[MODULO] = { ...(dados.flags[MODULO] ?? {}), [FLAGS.fonte]: `${item.id}.${e.id}` };
      return dados;
    });

  const texto = entrada.def?.efeito ?? textoDe(item);
  return {
    chave: item.id,
    nome: item.name,
    efeito: texto,
    efeitos,
    // Um cômodo da casa sem nenhum efeito é, por inteiro, um lembrete.
    lembrete: entrada.def ? !!entrada.def.lembrete : !efeitos.length
  };
}

/** A descrição de um Item, sem HTML, para servir de lembrete. */
function textoDe(item) {
  const html = item.system?.description?.value ?? "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * O resumo do que um residente recebe, para a aba Residentes — nas mesmas três
 * metades da aba Benefícios do módulo de negócios:
 *
 *  - `automaticos`: o que o módulo aplica, na ficha ou no diálogo de rolagem;
 *  - `lembretes`: o que fica com a mesa (uma fonte pode estar nas duas listas,
 *    como a Enfermaria: o +1 em Cura é automático, o sangramento é lembrete);
 *  - `bloqueados`: o que existe na base mas não vale para este residente.
 *
 * @returns {{automaticos: object[], lembretes: object[], bloqueados: object[]}}
 */
export function beneficiosDe(leitura, actorId) {
  const { fontes, ignoradas } = fontesPara(leitura, actorId);
  const automaticos = [];
  const lembretes = [];

  for (const fonte of fontes) {
    const naRolagem = fonte.efeitos.some((e) => e.system?.onuse);
    const naFicha = fonte.efeitos.some((e) => !e.system?.onuse);
    const entrada = { nome: fonte.nome, efeito: fonte.efeito, naFicha, naRolagem };
    if (naFicha || naRolagem) automaticos.push(entrada);
    if (fonte.lembrete || (!naFicha && !naRolagem)) lembretes.push(entrada);
  }

  return { automaticos, lembretes, bloqueados: ignoradas };
}

/**
 * Os Active Effects que um residente deve ter por causa desta base — um por
 * efeito de cada fonte, com o nome da base na frente.
 */
export function montarEfeitos(base, leitura, actorId) {
  const { fontes } = fontesPara(leitura, actorId);
  const efeitos = [];

  for (const fonte of fontes) {
    fonte.efeitos.forEach((efeito, indice) => {
      const chave = efeito.flags?.[MODULO]?.[FLAGS.fonte] ?? `${fonte.chave}.${indice}`;
      efeitos.push({
        ...efeito,
        name: game.i18n.format("T20BAS.NomeDoEfeito", { base: base.name, fonte: efeito.name || fonte.nome }),
        img: efeito.img || base.img || ICONE_EFEITO,
        origin: base.uuid,
        transfer: false,
        flags: {
          ...(efeito.flags ?? {}),
          [MODULO]: { ...(efeito.flags?.[MODULO] ?? {}), [FLAGS.origem]: base.id, [FLAGS.fonte]: chave }
        }
      });
    });
  }

  return efeitos;
}

/** Os Active Effects que esta base já criou num ator. */
export function efeitosExistentes(actor, baseId) {
  return actor.effects.filter((e) => e.getFlag(MODULO, FLAGS.origem) === baseId);
}

/**
 * Sincroniza as fichas dos residentes com o estado atual da base: cria,
 * atualiza ou remove os efeitos de cada um.
 *
 * Só toca em atores que o usuário atual pode editar. Os demais voltam em
 * `pendentes` para a camada de socket pedir ao Mestre.
 *
 * @returns {Promise<{aplicados: string[], removidos: string[], pendentes: string[]}>}
 */
export async function sincronizar(base, { somenteLocais = true } = {}) {
  const resultado = { aplicados: [], removidos: [], pendentes: [] };
  if (!game.settings.get(MODULO, CONFIGS.aplicarEfeitos)) return resultado;

  const leitura = lerBase(base);
  const residentes = new Set(leitura.residentes.map((a) => a.id));

  for (const actor of leitura.residentes) {
    if (somenteLocais && !actor.isOwner) {
      resultado.pendentes.push(actor.id);
      continue;
    }
    await reconciliar(actor, base.id, montarEfeitos(base, leitura, actor.id));
    resultado.aplicados.push(actor.id);
  }

  // Quem deixou de morar na base perde os efeitos.
  for (const actor of game.actors) {
    if (residentes.has(actor.id)) continue;
    const orfaos = efeitosExistentes(actor, base.id);
    if (!orfaos.length) continue;
    if (somenteLocais && !actor.isOwner) {
      resultado.pendentes.push(actor.id);
      continue;
    }
    await actor.deleteEmbeddedDocuments("ActiveEffect", orfaos.map((e) => e.id));
    resultado.removidos.push(actor.id);
  }

  return resultado;
}

/**
 * Deixa os efeitos da base na ficha exatamente como devem estar. Reconciliar
 * em vez de apagar e recriar preserva os ids — e com eles o que o jogador
 * ajustou à mão, como desligar um efeito.
 */
async function reconciliar(actor, baseId, desejados) {
  const atuais = new Map(efeitosExistentes(actor, baseId).map((e) => [e.getFlag(MODULO, FLAGS.fonte), e]));
  const criar = [];
  const atualizar = [];

  for (const efeito of desejados) {
    const chave = efeito.flags[MODULO][FLAGS.fonte];
    const atual = atuais.get(chave);
    if (atual) {
      // `disabled` não entra: se o jogador desligou o efeito, ele fica desligado.
      const { disabled, ...resto } = efeito;
      atualizar.push({ ...resto, _id: atual.id });
      atuais.delete(chave);
    } else {
      criar.push(efeito);
    }
  }

  const apagar = [...atuais.values()].map((e) => e.id);
  if (apagar.length) await actor.deleteEmbeddedDocuments("ActiveEffect", apagar);
  if (atualizar.length) await actor.updateEmbeddedDocuments("ActiveEffect", atualizar);
  if (criar.length) await actor.createEmbeddedDocuments("ActiveEffect", criar);
}

/** Remove os efeitos desta base de todas as fichas — usado ao excluí-la. */
export async function limparEfeitos(baseId, { somenteLocais = true } = {}) {
  const pendentes = [];
  for (const actor of game.actors) {
    const efeitos = efeitosExistentes(actor, baseId);
    if (!efeitos.length) continue;
    if (somenteLocais && !actor.isOwner) {
      pendentes.push(actor.id);
      continue;
    }
    await actor.deleteEmbeddedDocuments("ActiveEffect", efeitos.map((e) => e.id));
  }
  return pendentes;
}

/**
 * O efeito do tipo aplicado na própria base — o deslocamento de uma base Móvel,
 * a segurança de uma Fortificação. Mora no Ator da base, e é refeito quando o
 * tipo muda.
 */
export async function sincronizarTipoNaBase(base) {
  if (!base.isOwner) return;
  const leitura = lerBase(base);
  const tipo = leitura.tipo;

  const changes = [...(tipo?.base?.({ variante: leitura.variante }) ?? [])];
  if (tipo?.seguranca) {
    changes.push({ key: "system.seguranca.bonus", mode: 2, type: "add", value: String(tipo.seguranca) });
  }

  const atual = base.effects.find((e) => flag(e, FLAGS.fonte) === FONTE_TIPO);
  if (!changes.length) {
    if (atual) await base.deleteEmbeddedDocuments("ActiveEffect", [atual.id]);
    return;
  }

  const dados = {
    name: game.i18n.format("T20BAS.EfeitoDoTipo", { tipo: tipo.nome }),
    img: base.img || ICONE_EFEITO,
    disabled: false,
    transfer: true,
    changes,
    flags: { [MODULO]: { [FLAGS.fonte]: FONTE_TIPO } }
  };
  if (atual) await base.updateEmbeddedDocuments("ActiveEffect", [{ ...dados, _id: atual.id }]);
  else await base.createEmbeddedDocuments("ActiveEffect", [dados]);
}
