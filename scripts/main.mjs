/**
 * Bases — Tormenta 20
 *
 * Ponto de entrada: registra a ficha para o tipo de Ator "bases" do sistema,
 * as configurações do mundo e os ganchos que levam os benefícios às fichas dos
 * residentes.
 *
 * Fonte das regras: Tormenta20 - Heróis de Arton (Jambô Editora). Material de
 * fã, não oficial.
 */

import { BaseSheet } from "./apps/base-sheet.mjs";
import { SeletorDoCatalogo } from "./apps/seletor-catalogo.mjs";
import { CONFIGS, FLAGS, MODULO, TIPO_BASE } from "./constants.mjs";
import { lerBase } from "./data/base.mjs";
import { COMODOS } from "./data/comodos.mjs";
import { MOBILIAS } from "./data/mobilias.mjs";
import * as Regras from "./data/regras.mjs";
import { TIPOS } from "./data/tipos.mjs";
import * as Beneficios from "./services/beneficios.mjs";
import * as Operacoes from "./services/operacoes.mjs";
import { registrarSocket, sincronizarComApoio } from "./services/socket.mjs";

Hooks.once("init", () => {
  registrarFicha();
  registrarConfiguracoes();
  carregarTemplates();

  console.log(`${MODULO} | regras de bases carregadas (Tormenta20 - Heróis de Arton, material de fã)`);
});

Hooks.once("ready", () => {
  registrarSocket();

  game.modules.get(MODULO).api = {
    COMODOS,
    MOBILIAS,
    TIPOS,
    Regras,
    Operacoes,
    Beneficios,
    lerBase,
    abrirCatalogo: (base, modo = "comodos") => new SeletorDoCatalogo(base, { modo }).render({ force: true }),
    /** Refaz os efeitos de todas as bases — útil depois de mudar configurações. */
    sincronizarTudo: async () => {
      for (const base of game.actors.filter((a) => a.type === TIPO_BASE)) await sincronizarComApoio(base);
    }
  };
});

/* -------------------------------------------- */
/*  Registros                                   */
/* -------------------------------------------- */

/**
 * A ficha do módulo vira a padrão das bases, mas a do sistema continua
 * registrada: quem preferir troca em "Configurar ficha".
 */
function registrarFicha() {
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, MODULO, BaseSheet, {
    types: [TIPO_BASE],
    makeDefault: true,
    label: "T20BAS.FichaBase"
  });
}

function registrarConfiguracoes() {
  game.settings.register(MODULO, CONFIGS.aplicarEfeitos, {
    name: "T20BAS.ConfigAplicarEfeitos",
    hint: "T20BAS.ConfigAplicarEfeitosHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: false,
    onChange: () => game.modules.get(MODULO)?.api?.sincronizarTudo?.()
  });

  game.settings.register(MODULO, CONFIGS.empreendimentoComoNegocio, {
    name: "T20BAS.ConfigEmpreendimentoNegocio",
    hint: "T20BAS.ConfigEmpreendimentoNegocioHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => {
      for (const app of foundry.applications.instances.values()) {
        if (app instanceof BaseSheet) app.render();
      }
    }
  });
}

/** Pré-carrega os parciais para que trocar de aba não pisque. */
function carregarTemplates() {
  foundry.applications.handlebars.loadTemplates([
    `modules/${MODULO}/templates/base/cabecalho.hbs`,
    `modules/${MODULO}/templates/base/abas.hbs`,
    `modules/${MODULO}/templates/base/tab-geral.hbs`,
    `modules/${MODULO}/templates/base/tab-comodos.hbs`,
    `modules/${MODULO}/templates/base/tab-residentes.hbs`,
    `modules/${MODULO}/templates/base/tab-registro.hbs`,
    `modules/${MODULO}/templates/chat/card.hbs`
  ]);
}

/* -------------------------------------------- */
/*  Sincronização                               */
/* -------------------------------------------- */

/**
 * Uma operação só (construir um cômodo, mover uma mobília) dispara vários
 * ganchos seguidos. A sincronização espera a poeira baixar e roda uma vez por
 * base.
 */
const pendentes = new Map();
function agendarSincronizacao(base) {
  if (!base || base.type !== TIPO_BASE) return;
  if (!pendentes.has(base.id)) {
    pendentes.set(base.id, foundry.utils.debounce(async () => {
      const atual = game.actors.get(base.id);
      if (atual) await sincronizarComApoio(atual);
    }, 300));
  }
  pendentes.get(base.id)();
}

/** A base de um Item ou de um efeito dentro de um Item, se houver. */
function baseDe(doc) {
  const ator = doc?.parent?.documentName === "Actor" ? doc.parent : doc?.parent?.parent;
  return ator?.type === TIPO_BASE ? ator : null;
}

/**
 * Mudanças na base se propagam para os residentes.
 *
 * Só o cliente que fez a mudança sincroniza. O gancho dispara em todos os
 * conectados, e deixar todos escreverem criaria efeitos duplicados na mesma
 * ficha.
 */
Hooks.on("updateActor", async (actor, mudancas, opcoes, userId) => {
  if (actor.type !== TIPO_BASE || userId !== game.user.id) return;
  const flags = mudancas.flags?.[MODULO] ?? {};

  // O tipo foi reescrito à mão (na ficha do sistema, por exemplo): a flag
  // antiga perde a vez, e o tipo passa a ser lido pelo nome.
  if (mudancas.system?.tipo !== undefined && !(FLAGS.tipo in flags)) await actor.unsetFlag(MODULO, FLAGS.tipo);

  const mudouTipo = FLAGS.tipo in flags || FLAGS.variante in flags || mudancas.system?.tipo !== undefined;
  if (mudouTipo) await Beneficios.sincronizarTipoNaBase(actor);

  const relevante = mudouTipo || "residentes" in (mudancas.system ?? {});
  if (relevante) agendarSincronizacao(actor);
});

for (const gancho of ["createItem", "updateItem", "deleteItem"]) {
  Hooks.on(gancho, (item, ...resto) => {
    const userId = resto.at(-1);
    if (userId !== game.user.id) return;
    agendarSincronizacao(baseDe(item));
  });
}

/** O mestre editou um efeito dentro de um cômodo: os residentes recebem a versão nova. */
for (const gancho of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
  Hooks.on(gancho, (efeito, ...resto) => {
    const userId = resto.at(-1);
    if (userId !== game.user.id || efeito.parent?.documentName !== "Item") return;
    agendarSincronizacao(baseDe(efeito));
  });
}

/**
 * Uma base excluída não pode deixar efeitos órfãos nas fichas. O Mestre é
 * quem limpa, porque só ele enxerga todos os atores do mundo.
 */
Hooks.on("deleteActor", async (actor) => {
  if (actor.type !== TIPO_BASE || !game.user.isGM) return;
  await Beneficios.limparEfeitos(actor.id, { somenteLocais: false });
});
