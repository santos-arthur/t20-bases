/**
 * As ações que mudam uma base: construir, comprar, ampliar, erguer cômodos,
 * instalar mobílias, pagar a manutenção, reformar, apurar o Empreendimento.
 *
 * Cada função é o par "grava o resultado, registra no chat" — o teste já vem
 * rolado pela interface, porque a regra permite tentar de novo (gastando outra
 * ação e mais tibares) e essa decisão é do jogador, não do código.
 *
 * O dinheiro não é movimentado: o custo aparece no card do chat e a mesa
 * desconta da ficha de quem pagou. O registro da base é só o log do que
 * aconteceu, sem valores.
 *
 * Fonte das regras: Tormenta20 - Heróis de Arton (Jambô Editora). Material de
 * fã, não oficial.
 */

import { FLAGS, ITEM_COMODO, ITEM_MOBILIA, MODULO } from "../constants.mjs";
import { flag, lerBase } from "../data/base.mjs";
import { COMODOS } from "../data/comodos.mjs";
import { MOBILIAS } from "../data/mobilias.mjs";
import * as Regras from "../data/regras.mjs";
import { TIPOS } from "../data/tipos.mjs";
import * as Chat from "./chat.mjs";
import {
  alternarEfeitosNaBase, corrigirTransfer, dadosDaMobilia, dadosDoComodo, efeitosDoCatalogo, remontarEfeitos
} from "./itens.mjs";

/* -------------------------------------------- */
/*  Registro                                    */
/* -------------------------------------------- */

/**
 * Uma entrada na linha do tempo da base. É um log — o que aconteceu e quando;
 * quanto custou fica no card do chat de cada ação.
 *
 * @param {string} tipo   Chave do ícone (fundacao, ampliacao, comodo...).
 * @param {string} texto
 */
export function entrada(tipo, texto) {
  return { tipo, texto, timestamp: Date.now() };
}

/** O registro com as entradas novas no fim, pronto para gravar. */
function comRegistro(base, ...entradas) {
  return { [`flags.${MODULO}.${FLAGS.registro}`]: [...lerBase(base).registro, ...entradas] };
}

/** Linhas padrão do card de um teste. */
function linhasDoTeste(resultado, cd, custo) {
  return [
    { rotulo: game.i18n.localize("T20BAS.CD"), valor: String(cd) },
    { rotulo: game.i18n.localize("T20BAS.Resultado"), valor: String(resultado.total) },
    resultado.rotuloPericia && { rotulo: game.i18n.localize("T20BAS.Pericia"), valor: resultado.rotuloPericia },
    custo !== null && { rotulo: game.i18n.localize("T20BAS.Investimento"), valor: Chat.tibares(custo) }
  ];
}

/** O card de um teste, com o desfecho. */
function publicarTeste(base, { titulo, sucesso, falha, resultado, cd, custo }) {
  return Chat.publicar({
    base,
    titulo,
    texto: game.i18n.localize(resultado.sucesso ? sucesso : falha),
    linhas: linhasDoTeste(resultado, cd, custo),
    roll: resultado.roll,
    falante: resultado.actor,
    desfecho: resultado.sucesso ? "sucesso" : "falha"
  });
}

/* -------------------------------------------- */
/*  Aquisição                                   */
/* -------------------------------------------- */

/** As mudanças que gravam um tipo na base: a chave na flag, o nome no sistema. */
function dadosDoTipo(tipoId, variante) {
  const tipo = TIPOS[tipoId];
  return {
    "system.tipo": tipo?.nome ?? "",
    [`flags.${MODULO}.${FLAGS.tipo}`]: tipo?.id ?? null,
    [`flags.${MODULO}.${FLAGS.variante}`]: variante ?? "terrestre"
  };
}

/**
 * Constrói a base: ação entre aventuras, T$ 1.000 e Nobreza contra CD 20.
 * Passando, a base nasce mínima, do tipo escolhido.
 */
export async function construir(base, { tipoId, variante, resultado }) {
  const custo = Regras.CUSTO_CONSTRUCAO;
  const nomeTipo = TIPOS[tipoId]?.nome ?? "—";

  if (resultado.sucesso) {
    await base.update({
      ...dadosDoTipo(tipoId, variante),
      "system.porte": Regras.PORTE_INICIAL,
      "system.rooms": Regras.comodosDisponiveis(Regras.PORTE_INICIAL),
      [`flags.${MODULO}.${FLAGS.adquirida}`]: true,
      ...comRegistro(base, entrada("fundacao",
        game.i18n.format("T20BAS.RegistroConstrucao", { tipo: nomeTipo, resultado: resultado.total })))
    });
  } else {
    await base.update(comRegistro(base, entrada("falha",
      game.i18n.format("T20BAS.RegistroConstrucaoFalha", { resultado: resultado.total }))));
  }

  await publicarTeste(base, {
    titulo: game.i18n.format("T20BAS.ChatConstrucaoTitulo", { nome: base.name }),
    sucesso: "T20BAS.ChatConstrucaoSucesso",
    falha: "T20BAS.ChatConstrucaoFalha",
    resultado,
    cd: Regras.CD_CONSTRUCAO,
    custo
  });
  return resultado.sucesso;
}

/**
 * Uma base comprada pronta (três vezes o valor da tabela) ou recebida como
 * recompensa (de graça), em qualquer porte.
 */
export async function adquirirSemTeste(base, { modo, porteId, tipoId, variante }) {
  const porte = Regras.porte(porteId) ?? Regras.porte(Regras.PORTE_INICIAL);
  const custo = modo === "compra" ? Regras.precoCompra(porte.id) : 0;
  const chave = modo === "compra" ? "T20BAS.RegistroCompra" : "T20BAS.RegistroRecebida";
  const tipo = TIPOS[tipoId]?.nome ?? "—";

  await base.update({
    ...dadosDoTipo(tipoId, variante),
    "system.porte": porte.id,
    "system.rooms": porte.comodos,
    [`flags.${MODULO}.${FLAGS.adquirida}`]: true,
    ...comRegistro(base, entrada("fundacao", game.i18n.format(chave, { porte: porte.nome, tipo })))
  });

  await Chat.publicar({
    base,
    titulo: game.i18n.format(modo === "compra" ? "T20BAS.ChatCompraTitulo" : "T20BAS.ChatRecebidaTitulo",
      { nome: base.name }),
    linhas: [
      { rotulo: game.i18n.localize("T20BAS.CampoPorte"), valor: porte.nome },
      { rotulo: game.i18n.localize("T20BAS.CampoTipo"), valor: tipo },
      custo && { rotulo: game.i18n.localize("T20BAS.Investimento"), valor: Chat.tibares(custo) }
    ]
  });
}

/* -------------------------------------------- */
/*  Porte                                       */
/* -------------------------------------------- */

/**
 * Amplia o porte em uma categoria. Falhando, a ação e o dinheiro dos materiais
 * se perdem e a base fica como estava.
 */
export async function ampliar(base, resultado) {
  const leitura = lerBase(base);
  if (!leitura.proximo) return false;
  const custo = leitura.custoAmpliacao;
  const proximo = leitura.proximo;

  const mudancas = resultado.sucesso
    ? { "system.porte": proximo.id, "system.rooms": proximo.comodos }
    : {};

  await base.update({
    ...mudancas,
    ...comRegistro(base, entrada(resultado.sucesso ? "ampliacao" : "falha",
      game.i18n.format(resultado.sucesso ? "T20BAS.RegistroAmpliacao" : "T20BAS.RegistroAmpliacaoFalha",
        { porte: proximo.nome, resultado: resultado.total })))
  });

  await publicarTeste(base, {
    titulo: game.i18n.format("T20BAS.ChatAmpliacaoTitulo", { nome: base.name, porte: proximo.nome }),
    sucesso: "T20BAS.ChatAmpliacaoSucesso",
    falha: "T20BAS.ChatAmpliacaoFalha",
    resultado,
    cd: leitura.cdAmpliacao,
    custo
  });
  return resultado.sucesso;
}

/**
 * O Mestre muda o porte livremente, sem teste nem custo — para consertar um
 * engano, conceder crescimento pela história ou importar uma base que já
 * existia. Fica no registro, e a base passa a contar como adquirida: quem
 * definiu o porte à mão já decidiu que ela existe.
 */
export async function ajustarPorte(base, porteId) {
  const porte = Regras.porte(porteId);
  const antes = lerBase(base).porte;
  if (!porte || porte.id === antes.id) return;
  await base.update({
    "system.porte": porte.id,
    "system.rooms": porte.comodos,
    [`flags.${MODULO}.${FLAGS.adquirida}`]: true,
    ...comRegistro(base, entrada("ajuste",
      game.i18n.format("T20BAS.RegistroAjustePorte", { de: antes.nome, para: porte.nome })))
  });
}

/* -------------------------------------------- */
/*  Reforma                                     */
/* -------------------------------------------- */

/**
 * Troca o tipo da base. Cômodos que tenham o tipo anterior como pré-requisito
 * seriam destruídos — nenhum cômodo do livro tem, mas a conta fica pronta.
 */
export async function reformar(base, { tipoId, variante, resultado }) {
  const leitura = lerBase(base);
  const custo = leitura.custoReforma;
  const de = leitura.tipo?.nome ?? (leitura.tipoTexto || "—");
  const para = TIPOS[tipoId]?.nome ?? "—";

  await base.update({
    ...(resultado.sucesso ? dadosDoTipo(tipoId, variante) : {}),
    ...comRegistro(base, entrada(resultado.sucesso ? "reforma" : "falha",
      game.i18n.format(resultado.sucesso ? "T20BAS.RegistroReforma" : "T20BAS.RegistroReformaFalha",
        { de, para, resultado: resultado.total })))
  });

  await publicarTeste(base, {
    titulo: game.i18n.format("T20BAS.ChatReformaTitulo", { nome: base.name, tipo: para }),
    sucesso: "T20BAS.ChatReformaSucesso",
    falha: "T20BAS.ChatReformaFalha",
    resultado,
    cd: leitura.cdReforma,
    custo
  });
  return resultado.sucesso;
}

/* -------------------------------------------- */
/*  Cômodos                                     */
/* -------------------------------------------- */

/** Constrói um cômodo do catálogo: ação entre aventuras, T$ 1.000 e o teste. */
export async function construirComodo(base, comodoId, resultado) {
  const def = COMODOS[comodoId];
  if (!def) return null;
  const leitura = lerBase(base);
  const custo = leitura.custoComodo;
  let item = null;

  if (resultado.sucesso) {
    [item] = await base.createEmbeddedDocuments("Item", [dadosDoComodo(def)]);
    if (item) await corrigirTransfer(item);
  }

  await base.update(comRegistro(base, entrada(resultado.sucesso ? "comodo" : "falha",
    game.i18n.format(resultado.sucesso ? "T20BAS.RegistroComodo" : "T20BAS.RegistroComodoFalha",
      { comodo: def.nome, resultado: resultado.total }))));

  await publicarTeste(base, {
    titulo: game.i18n.format("T20BAS.ChatComodoTitulo", { comodo: def.nome }),
    sucesso: "T20BAS.ChatComodoSucesso",
    falha: "T20BAS.ChatComodoFalha",
    resultado,
    cd: leitura.cdComodo,
    custo
  });
  return item;
}

/**
 * O Mestre acrescenta um cômodo sem teste nem custo — o que já veio com uma
 * base recebida ou comprada pronta.
 */
export async function adicionarComodo(base, comodoId) {
  const def = COMODOS[comodoId];
  if (!def) return null;
  const [item] = await base.createEmbeddedDocuments("Item", [dadosDoComodo(def)]);
  if (item) await corrigirTransfer(item);
  await base.update(comRegistro(base, entrada("ajuste",
    game.i18n.format("T20BAS.RegistroComodoSemTeste", { comodo: def.nome }))));
  return item;
}

/**
 * Demole um cômodo. As mobílias dele não somem: ficam sem lugar, esperando ser
 * instaladas em outro cômodo.
 */
export async function demolirComodo(base, itemId) {
  const item = base.items.get(itemId);
  if (!item) return;
  const mobilias = base.items.filter((i) => i.type === ITEM_MOBILIA && flag(i, FLAGS.instaladaEm) === itemId);
  for (const m of mobilias) await desinstalarMobilia(base, m.id, { registrar: false });

  await base.deleteEmbeddedDocuments("Item", [itemId]);
  await base.update(comRegistro(base, entrada("demolicao",
    game.i18n.format("T20BAS.RegistroDemolicao", { comodo: item.name }))));
}

/** Escolhe quem dorme numa suíte. */
export async function definirOcupantes(base, itemId, ocupantes) {
  const item = base.items.get(itemId);
  if (!item) return;
  const limite = COMODOS[flag(item, FLAGS.catalogo)]?.ocupantes ?? ocupantes.length;
  await item.setFlag(MODULO, FLAGS.ocupantes, ocupantes.slice(0, limite));
}

/* -------------------------------------------- */
/*  Manutenção e dano                           */
/* -------------------------------------------- */

/**
 * O início de uma aventura: a manutenção é paga ou um dos cômodos se danifica.
 *
 * @param {Actor} base
 * @param {object} opcoes
 * @param {boolean} opcoes.pagar
 * @param {string} [opcoes.danificarId] Cômodo que se danifica, se não pagar.
 */
export async function iniciarAventura(base, { pagar, danificarId = null }) {
  const leitura = lerBase(base);
  const valor = leitura.manutencao;

  if (pagar) {
    await base.update(comRegistro(base, entrada("manutencao",
      game.i18n.format("T20BAS.RegistroManutencao", { porte: leitura.porte.nome }))));
    await Chat.publicar({
      base,
      titulo: game.i18n.format("T20BAS.ChatManutencaoTitulo", { nome: base.name }),
      texto: game.i18n.localize("T20BAS.ChatManutencaoPaga"),
      linhas: [{ rotulo: game.i18n.localize("T20BAS.CampoManutencao"), valor: Chat.tibares(valor) }],
      desfecho: "sucesso"
    });
    return;
  }

  const alvo = danificarId ? base.items.get(danificarId) : null;
  if (alvo) await danificar(base, alvo.id, { registrar: false });

  await base.update(comRegistro(base, entrada("dano", alvo
    ? game.i18n.format("T20BAS.RegistroManutencaoFalta", { comodo: alvo.name })
    : game.i18n.localize("T20BAS.RegistroManutencaoFaltaSemComodo"))));

  await Chat.publicar({
    base,
    titulo: game.i18n.format("T20BAS.ChatManutencaoTitulo", { nome: base.name }),
    texto: alvo
      ? game.i18n.format("T20BAS.ChatManutencaoFalta", { comodo: alvo.name })
      : game.i18n.localize("T20BAS.RegistroManutencaoFaltaSemComodo"),
    desfecho: "falha"
  });
}

/**
 * Marca um cômodo como danificado: ele e as mobílias dele deixam de fornecer
 * bônus — os dos residentes pela sincronização, e o de segurança aqui.
 */
export async function danificar(base, itemId, { registrar = true } = {}) {
  const item = base.items.get(itemId);
  if (!item) return;
  await item.setFlag(MODULO, FLAGS.danificado, true);
  await alternarEfeitosNaBase(item, false);
  for (const m of mobiliasDe(base, itemId)) await alternarEfeitosNaBase(m, false);

  if (registrar) {
    await base.update(comRegistro(base, entrada("dano",
      game.i18n.format("T20BAS.RegistroDanificado", { comodo: item.name }))));
  }
}

/** Repara um cômodo danificado: ação entre aventuras e metade do custo dele. */
export async function reparar(base, itemId) {
  const item = base.items.get(itemId);
  if (!item) return;
  const custo = lerBase(base).custoReparo;

  await item.unsetFlag(MODULO, FLAGS.danificado);
  await alternarEfeitosNaBase(item, true);
  for (const m of mobiliasDe(base, itemId)) await alternarEfeitosNaBase(m, true);

  await base.update(comRegistro(base, entrada("reparo",
    game.i18n.format("T20BAS.RegistroReparo", { comodo: item.name }))));

  await Chat.publicar({
    base,
    titulo: game.i18n.format("T20BAS.ChatReparoTitulo", { comodo: item.name }),
    linhas: [{ rotulo: game.i18n.localize("T20BAS.Investimento"), valor: Chat.tibares(custo) }],
    desfecho: "sucesso"
  });
}

/** As mobílias instaladas num cômodo. */
function mobiliasDe(base, comodoItemId) {
  return base.items.filter((i) => i.type === ITEM_MOBILIA && flag(i, FLAGS.instaladaEm) === comodoItemId);
}

/* -------------------------------------------- */
/*  Mobílias                                    */
/* -------------------------------------------- */

/**
 * Compra uma mobília do catálogo e a instala. Mobílias são itens comuns: o
 * preço vai para o registro, e quem fabricou ou achou a sua pode registrar
 * sem custo.
 */
export async function adquirirMobilia(base, mobiliaId, { anfitriaoId = null, escolha = "", pago = true } = {}) {
  const def = MOBILIAS[mobiliaId];
  if (!def) return null;
  const anfitriao = anfitriaoId ? base.items.get(anfitriaoId) : null;
  const catalogoDoAnfitriao = anfitriao ? flag(anfitriao, FLAGS.catalogo) : null;

  const dados = dadosDaMobilia(def, { anfitriao: catalogoDoAnfitriao, escolha });
  if (anfitriao) dados.flags[MODULO][FLAGS.instaladaEm] = anfitriao.id;
  // Instalada em lugar nenhum (e não é exterior), a mobília ainda não dá nada.
  if (!anfitriao && def.onde !== "exterior") dados.effects = [];

  const [item] = await base.createEmbeddedDocuments("Item", [dados]);
  if (item) await corrigirTransfer(item);

  await base.update(comRegistro(base, entrada("mobilia", anfitriao
    ? game.i18n.format("T20BAS.RegistroMobilia", { mobilia: def.nome, comodo: anfitriao.name })
    : game.i18n.format("T20BAS.RegistroMobiliaSolta", { mobilia: def.nome }))));

  await Chat.publicar({
    base,
    titulo: game.i18n.format("T20BAS.ChatMobiliaTitulo", { mobilia: def.nome }),
    texto: def.efeito,
    linhas: [
      anfitriao && { rotulo: game.i18n.localize("T20BAS.InstaladaEm"), valor: anfitriao.name },
      pago && { rotulo: game.i18n.localize("T20BAS.Preco"), valor: Chat.tibares(def.preco) }
    ]
  });
  return item;
}

/**
 * Move uma mobília para outro cômodo — só entre aventuras, e cada mobília afeta
 * um único cômodo por aventura. Os efeitos são remontados para o novo lugar.
 */
export async function instalarMobilia(base, itemId, anfitriaoId, { escolha = null } = {}) {
  const item = base.items.get(itemId);
  const anfitriao = base.items.get(anfitriaoId);
  if (!item || !anfitriao || anfitriao.type !== ITEM_COMODO) return;

  const novaEscolha = escolha ?? flag(item, FLAGS.escolha, "");
  await item.update({
    [`flags.${MODULO}.${FLAGS.instaladaEm}`]: anfitriao.id,
    [`flags.${MODULO}.${FLAGS.escolha}`]: novaEscolha
  });
  await remontarDoCatalogo(item, flag(anfitriao, FLAGS.catalogo), novaEscolha);

  await base.update(comRegistro(base, entrada("mobilia",
    game.i18n.format("T20BAS.RegistroMobiliaMovida", { mobilia: item.name, comodo: anfitriao.name }))));
}

/** Tira a mobília do cômodo; ela fica guardada, sem dar benefício. */
export async function desinstalarMobilia(base, itemId, { registrar = true } = {}) {
  const item = base.items.get(itemId);
  if (!item) return;
  await item.unsetFlag(MODULO, FLAGS.instaladaEm);
  await remontarDoCatalogo(item, null, flag(item, FLAGS.escolha, ""), { vazio: true });
  if (registrar) {
    await base.update(comRegistro(base, entrada("mobilia",
      game.i18n.format("T20BAS.RegistroMobiliaGuardada", { mobilia: item.name }))));
  }
}

/** Refaz os efeitos gerados de uma mobília do catálogo para o cômodo que a recebe. */
async function remontarDoCatalogo(item, catalogoDoAnfitriao, escolha, { vazio = false } = {}) {
  const def = MOBILIAS[flag(item, FLAGS.catalogo)];
  // Mobília da casa: os efeitos são do mestre, o módulo não mexe.
  if (!def) return;
  const desejados = vazio ? [] : efeitosDoCatalogo(def, { comodo: catalogoDoAnfitriao, escolha }, { img: item.img });
  await remontarEfeitos(item, desejados);
}

/* -------------------------------------------- */
/*  Empreendimento                              */
/* -------------------------------------------- */

/**
 * Liga a base Empreendimento a um negócio do módulo t20-negocios — a regra
 * alternativa do livro: a base conta como um negócio de nível 1, que recebe
 * níveis à parte. O negócio é quem rende; a base só aponta para ele.
 *
 * @param {string|null} negocioId `null` desfaz o vínculo.
 */
export async function vincularNegocio(base, negocioId) {
  const antes = lerBase(base).negocio;
  const depois = negocioId ? game.actors.get(negocioId) : null;
  if ((antes?.id ?? null) === (depois?.id ?? null)) return;

  await base.update({
    [`flags.${MODULO}.${FLAGS.negocio}`]: depois?.id ?? null,
    ...comRegistro(base, entrada("ajuste", depois
      ? game.i18n.format("T20BAS.RegistroNegocioVinculado", { negocio: depois.name })
      : game.i18n.format("T20BAS.RegistroNegocioDesvinculado", { negocio: antes?.name ?? "—" })))
  });
}

/**
 * O rendimento do intervalo entre aventuras de uma base Empreendimento: o
 * resultado do teste de Inteligência (com bônus igual ao número de cômodos que
 * a base pode ter) em tibares de ouro, em dobro para quem dedicou a ação.
 */
export async function apurarEmpreendimento(base, { roll, actor, dedicado }) {
  const to = Regras.rendimentoEmpreendimento(roll.total, { dedicado });
  const emTibares = to * Regras.TO_EM_TIBARES;

  await base.update(comRegistro(base, entrada("rendimento",
    game.i18n.format(dedicado ? "T20BAS.RegistroRendimentoDedicado" : "T20BAS.RegistroRendimento",
      { resultado: roll.total, to }))));

  await Chat.publicar({
    base,
    titulo: game.i18n.format("T20BAS.ChatRendimentoTitulo", { nome: base.name }),
    texto: game.i18n.localize(dedicado ? "T20BAS.ChatRendimentoDedicado" : "T20BAS.ChatRendimento"),
    linhas: [
      { rotulo: game.i18n.localize("T20BAS.Resultado"), valor: String(roll.total) },
      dedicado && { rotulo: game.i18n.localize("T20BAS.Dedicado"), valor: "×2" },
      { rotulo: game.i18n.localize("T20BAS.Rendimento"), valor: `${Chat.tibaresDeOuro(to)} (${Chat.tibares(emTibares)})` }
    ],
    roll,
    falante: actor,
    desfecho: "sucesso"
  });
  return to;
}
