/**
 * O seletor do catálogo: a vitrine de tudo que uma base pode ter.
 *
 * Mostra o catálogo inteiro, inclusive o que a base ainda não alcança — ver que
 * a Sauna exige base formidável é parte do planejamento de quem está ampliando
 * a casa. Serve aos dois catálogos: cômodos (construídos com teste) e mobílias
 * (compradas como itens comuns).
 */

import { MODULO } from "../constants.mjs";
import { checarComodo, destinosPara, lerBase } from "../data/base.mjs";
import { COMODOS, iconeDe, listarComodos } from "../data/comodos.mjs";
import { ehExterior, iconeDaMobilia, listarMobilias, MOBILIAS } from "../data/mobilias.mjs";
import * as Regras from "../data/regras.mjs";
import * as Chat from "../services/chat.mjs";
import * as Operacoes from "../services/operacoes.mjs";
import { podeAdministrar } from "../services/permissoes.mjs";
import { pedirTeste, perguntar } from "./dialogo-teste.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class SeletorDoCatalogo extends HandlebarsApplicationMixin(ApplicationV2) {
  /**
   * @param {Actor} base
   * @param {object} [opcoes]
   * @param {"comodos"|"mobilias"} [opcoes.modo]
   */
  constructor(base, { modo = "comodos", ...resto } = {}) {
    super(resto);
    this.base = base;
    this.modo = modo;
    this.filtro = { texto: "", soDisponiveis: false };
    /** Ids com os detalhes abertos. */
    this.abertos = new Set();
  }

  static DEFAULT_OPTIONS = {
    id: "t20bas-seletor-{id}",
    classes: ["tormenta20", "sheet", "actor", "t20bas", "themed", "theme-light"],
    tag: "div",
    window: { icon: "fa-solid fa-door-open", resizable: true },
    position: { width: 720, height: 640 },
    actions: {
      escolher: SeletorDoCatalogo.#escolher,
      adicionarSemTeste: SeletorDoCatalogo.#adicionarSemTeste,
      alternarDetalhe: SeletorDoCatalogo.#alternarDetalhe,
      alternarDisponiveis: SeletorDoCatalogo.#alternarDisponiveis
    }
  };

  static PARTS = {
    corpo: { template: `modules/${MODULO}/templates/seletor-catalogo.hbs`, scrollable: [".t20bas-bloco"] }
  };

  /** @override */
  get title() {
    return game.i18n.format(this.modo === "comodos" ? "T20BAS.SeletorComodos" : "T20BAS.SeletorMobilias",
      { nome: this.base.name });
  }

  /** @override */
  async _prepareContext() {
    const leitura = lerBase(this.base);
    const busca = this.filtro.texto.toLowerCase().trim();
    const todos = this.modo === "comodos" ? listarComodos() : listarMobilias();

    const itens = todos
      .map((def) => (this.modo === "comodos" ? this.#itemComodo(def, leitura) : this.#itemMobilia(def, leitura)))
      .filter((item) => {
        if (this.filtro.soDisponiveis && !item.disponivel) return false;
        if (!busca) return true;
        return `${item.nome} ${item.resumo} ${item.efeito}`.toLowerCase().includes(busca);
      })
      .map((item) => ({ ...item, aberto: this.abertos.has(item.id) }));

    return {
      itens,
      modo: this.modo,
      ehComodos: this.modo === "comodos",
      ehMestre: game.user.isGM,
      total: todos.length,
      filtro: this.filtro,
      resumo: this.modo === "comodos"
        ? game.i18n.format("T20BAS.SeletorResumoComodos", {
          livres: leitura.vagasLivres, cd: leitura.cdComodo, custo: Chat.tibares(leitura.custoComodo)
        })
        : game.i18n.localize("T20BAS.SeletorResumoMobilias"),
      semResultado: !itens.length,
      fonte: game.i18n.localize("T20BAS.Fonte")
    };
  }

  #itemComodo(def, leitura) {
    const { ok, faltando } = checarComodo(leitura, def.id);
    const semVaga = leitura.vagasLivres <= 0;
    return {
      id: def.id,
      nome: def.nome,
      icone: iconeDe(def),
      resumo: def.resumo,
      efeito: def.efeito,
      nota: def.nota,
      marcas: marcasDe(def),
      jaTem: faltando.jaTem,
      requisitos: descreverRequisitos(faltando),
      semVaga,
      disponivel: ok && !semVaga,
      rotuloAcao: game.i18n.localize("T20BAS.BotaoConstruir")
    };
  }

  #itemMobilia(def, leitura) {
    const exterior = ehExterior(def);
    const destinos = exterior ? [] : destinosPara(leitura, def).filter((d) => !d.cheio);
    const gargulasCheias = exterior && leitura.gargulas >= leitura.limiteGargulas;
    let requisitos = "";
    if (gargulasCheias) requisitos = game.i18n.format("T20BAS.LimiteGargulas", { max: leitura.limiteGargulas });
    else if (!exterior && def.onde) requisitos = game.i18n.format("T20BAS.SoEm", { lugares: nomesDe(def.onde) });

    return {
      id: def.id,
      nome: def.nome,
      icone: iconeDaMobilia(def),
      resumo: Chat.tibares(def.preco),
      efeito: def.efeito,
      nota: def.nota,
      marcas: marcasDe(def),
      jaTem: false,
      requisitos,
      // Sem cômodo compatível, dá para comprar e guardar; só a gárgula tem teto.
      disponivel: !gargulasCheias,
      semDestino: !exterior && !destinos.length,
      rotuloAcao: game.i18n.localize("T20BAS.BotaoComprar")
    };
  }

  /** @override */
  _onRender(contexto, opcoes) {
    super._onRender(contexto, opcoes);
    const busca = this.element.querySelector("[name=busca]");
    busca?.addEventListener("input", foundry.utils.debounce((evento) => {
      this.filtro.texto = evento.target.value;
      this.render({ parts: ["corpo"] });
    }, 200));
    if (this.filtro.texto && busca) {
      busca.focus();
      busca.setSelectionRange(busca.value.length, busca.value.length);
    }
  }

  /* -------------------------------------------- */

  #exigeAdministrar() {
    if (podeAdministrar(this.base)) return true;
    ui.notifications.warn(game.i18n.localize("T20BAS.AvisoSoProprietario"));
    return false;
  }

  static async #escolher(evento, alvo) {
    if (!this.#exigeAdministrar()) return;
    const id = alvo.dataset.id;
    this.close();
    if (this.modo === "comodos") await construirComTeste(this.base, id);
    else await comprarMobilia(this.base, id, { pago: true });
  }

  /**
   * Sem teste nem custo, só o Mestre. Ele adiciona o que quiser, livremente:
   * ignora pré-requisitos, vagas, o limite de gárgulas e em que cômodo a
   * mobília funciona — é o caso de uma base recebida pronta, de uma mobília
   * achada como tesouro, ou de uma decisão da mesa.
   */
  static async #adicionarSemTeste(evento, alvo) {
    if (!game.user.isGM) return;
    const id = alvo.dataset.id;
    this.close();
    if (this.modo === "comodos") await Operacoes.adicionarComodo(this.base, id);
    else await comprarMobilia(this.base, id, { pago: false, livre: true });
  }

  static #alternarDetalhe(evento, alvo) {
    const id = alvo.dataset.id;
    const linha = this.element.querySelector(`.t20bas-acordeon[data-id="${id}"]`);
    if (!linha) return;
    if (linha.classList.toggle("aberto")) this.abertos.add(id);
    else this.abertos.delete(id);
  }

  static #alternarDisponiveis() {
    this.filtro.soDisponiveis = !this.filtro.soDisponiveis;
    this.render({ parts: ["corpo"] });
  }
}

/* -------------------------------------------- */
/*  Fluxos                                      */
/* -------------------------------------------- */

/** Constrói um cômodo: o teste de sempre, contra a CD do porte atual. */
export async function construirComTeste(base, comodoId) {
  const def = COMODOS[comodoId];
  const leitura = lerBase(base);
  if (!def) return;
  if (leitura.vagasLivres <= 0) {
    ui.notifications.warn(game.i18n.localize("T20BAS.AvisoSemVagas"));
    return;
  }

  const resultado = await pedirTeste({
    titulo: game.i18n.format("T20BAS.ConstruirComodoTitulo", { comodo: def.nome }),
    descricao: def.efeito,
    caixas: [
      { rotulo: game.i18n.localize("T20BAS.ReqTempo"), valor: game.i18n.localize("T20BAS.UmaAcao"),
        nota: game.i18n.localize("T20BAS.AcaoEntreAventuras") },
      { rotulo: game.i18n.localize("T20BAS.ReqInvestimento"), valor: Chat.tibares(leitura.custoComodo),
        nota: game.i18n.localize("T20BAS.MesmoSeFalhar") },
      { rotulo: game.i18n.localize("T20BAS.CD"), valor: String(leitura.cdComodo),
        nota: game.i18n.localize("T20BAS.NobrezaOuOutra") }
    ],
    cd: leitura.cdComodo,
    sugerido: leitura.proprietario,
    rotuloBotao: game.i18n.localize("T20BAS.BotaoConstruir"),
    icone: "fa-solid fa-trowel-bricks"
  });
  if (!resultado) return;
  await Operacoes.construirComodo(base, comodoId, resultado);
}

/**
 * Compra (ou registra sem custo) uma mobília, perguntando onde ela fica e, se
 * for o caso, a escolha que a acompanha.
 */
export async function comprarMobilia(base, mobiliaId, { pago, livre = false }) {
  const def = MOBILIAS[mobiliaId];
  if (!def) return;
  const leitura = lerBase(base);

  let anfitriaoId = null;
  if (!ehExterior(def)) {
    anfitriaoId = await perguntarDestino(leitura, def, { livre });
    if (anfitriaoId === null) return;
  }

  const anfitriao = leitura.comodos.find((c) => c.id === anfitriaoId);
  const escolha = await perguntarEscolha(def, anfitriao);
  if (escolha === null) return;

  await Operacoes.adquirirMobilia(base, mobiliaId, { anfitriaoId: anfitriaoId || null, escolha, pago });
}

/**
 * Onde instalar a mobília. Devolve o id do Item do cômodo, `""` para guardar sem
 * instalar, ou `null` se a pessoa desistir.
 */
export async function perguntarDestino(leitura, def, { atual = null, ignorar = null, livre = false } = {}) {
  // Livre (o Mestre): qualquer cômodo, compatível ou não, cheio ou não.
  const destinos = livre
    ? leitura.comodos.map((comodo) => ({ comodo }))
    : destinosPara(leitura, def, { ignorar }).filter((d) => !d.cheio || d.comodo.id === atual);
  const opcoes = [
    ...destinos.map((d) => ({ valor: d.comodo.id, rotulo: d.comodo.nome })),
    { valor: "", rotulo: game.i18n.localize("T20BAS.GuardarSemInstalar") }
  ];
  const resposta = await perguntar({
    titulo: def.nome,
    texto: def.efeito,
    rotulo: game.i18n.localize("T20BAS.InstalarEm"),
    opcoes,
    valor: atual ?? opcoes[0].valor
  });
  return resposta;
}

/**
 * A escolha que acompanha a mobília: o patamar da criatura empalhada, a
 * perícia que o ídolo reforça. `""` quando não há o que escolher.
 */
export async function perguntarEscolha(def, anfitriao, { atual = "" } = {}) {
  if (!def.escolha) return "";

  if (def.escolha.tipo === "opcoes") {
    return perguntar({
      titulo: def.nome,
      rotulo: def.escolha.label,
      opcoes: Object.entries(def.escolha.opcoes).map(([valor, rotulo]) => ({ valor, rotulo })),
      valor: atual
    });
  }

  // Ídolo dourado: uma das perícias que o cômodo anfitrião já melhora.
  const pericias = periciasDoComodo(anfitriao);
  if (!pericias.length) {
    ui.notifications.warn(game.i18n.localize("T20BAS.AvisoIdoloSemPericia"));
    return "";
  }
  return perguntar({
    titulo: def.nome,
    rotulo: def.escolha.label,
    opcoes: pericias.map((key) => ({ valor: key, rotulo: game.i18n.localize(CONFIG.T20?.pericias?.[key]?.label ?? key) })),
    valor: atual
  });
}

/** As perícias que um cômodo do catálogo oferece na rolagem. */
function periciasDoComodo(anfitriao) {
  const pecas = anfitriao?.def?.residentes?.({ oficios: [] }) ?? [];
  return [...new Set(pecas.flatMap((p) => p.aoUsar?.pericias ?? []))];
}

/* -------------------------------------------- */
/*  Apresentação                                */
/* -------------------------------------------- */

/** As etiquetas que descrevem uma entrada do catálogo. */
function marcasDe(def) {
  const marcas = [];
  const pecas = def.residentes?.({ oficios: ["ofic"], comodo: def.onde?.[0], escolha: "1" }) ?? [];
  if (pecas.some((p) => p.tipo === "ficha")) {
    marcas.push({ texto: game.i18n.localize("T20BAS.MarcaFicha"), icone: "fa-wand-magic-sparkles", estilo: "ativo",
      dica: game.i18n.localize("T20BAS.MarcaFichaDica") });
  }
  if (pecas.some((p) => p.tipo === "rolagem")) {
    marcas.push({ texto: game.i18n.localize("T20BAS.MarcaRolagem"), icone: "fa-dice-d20", estilo: "ativo",
      dica: game.i18n.localize("T20BAS.MarcaRolagemDica") });
  }
  if (def.seguranca) {
    marcas.push({ texto: game.i18n.format("T20BAS.MarcaSeguranca", { valor: def.seguranca }), icone: "fa-shield-halved" });
  }
  if (def.lembrete) marcas.push({ texto: game.i18n.localize("T20BAS.MarcaLembrete"), icone: "fa-list-check" });
  if (def.repetivel) marcas.push({ texto: game.i18n.localize("T20BAS.MarcaRepetivel"), icone: "fa-clone" });
  if (def.ocupantes) {
    marcas.push({ texto: game.i18n.format("T20BAS.MarcaOcupantes", { n: def.ocupantes }), icone: "fa-bed" });
  }
  return marcas;
}

/** Os nomes de uma lista de cômodos do catálogo. */
function nomesDe(ids) {
  return ids.map((id) => COMODOS[id]?.nome ?? id).join(", ");
}

/**
 * O que falta para um cômodo ficar disponível, numa frase só: "Exige base
 * formidável e Guarita" se lê melhor do que duas etiquetas.
 */
export function descreverRequisitos(faltando) {
  if (faltando.jaTem) return game.i18n.localize("T20BAS.JaConstruido");
  const partes = [];
  if (faltando.porte) {
    partes.push(game.i18n.format("T20BAS.RequisitoPorte", { porte: Regras.porte(faltando.porte)?.nome ?? faltando.porte }));
  }
  for (const id of faltando.comodos) partes.push(COMODOS[id]?.nome ?? id);
  if (!partes.length) return "";
  const lista = partes.length === 1
    ? partes[0]
    : `${partes.slice(0, -1).join(", ")} ${game.i18n.localize("T20BAS.E")} ${partes.at(-1)}`;
  return game.i18n.format("T20BAS.Exige", { requisitos: lista });
}
