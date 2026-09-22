/**
 * A ficha de uma base.
 *
 * Registrada para o tipo de Ator "bases" do próprio sistema Tormenta20: lê e
 * grava os mesmos campos da ficha original (porte, segurança, residentes, os
 * Itens de cômodo e mobília), e acrescenta as regras. Quem preferir a ficha do
 * sistema troca em "Configurar ficha", e nada se perde.
 *
 * Quatro abas, cada uma respondendo a uma pergunta que aparece na mesa:
 *   Visão geral — o que esta base é, e o que custa para ela crescer?
 *   Cômodos     — o que a base tem, e o que ainda pode ter?
 *   Residentes  — quem mora aqui, e o que ganha com isso?
 *   Registro    — o que já aconteceu com ela?
 *
 * As abas são controladas à mão, e não pela API de abas do Foundry: trocar de
 * aba vira uma troca de classe no DOM, sem re-renderizar a ficha inteira.
 *
 * Fonte das regras: Tormenta20 - Heróis de Arton (Jambô Editora). Material de
 * fã, não oficial.
 */

import { CONFIGS, FLAGS, MODULO, MODULO_NEGOCIOS, TIPO_NEGOCIO } from "../constants.mjs";
import { lerBase } from "../data/base.mjs";
import { dependentesDe, iconeDe } from "../data/comodos.mjs";
import { iconeDaMobilia } from "../data/mobilias.mjs";
import * as Regras from "../data/regras.mjs";
import { listarTipos, TIPOS } from "../data/tipos.mjs";
import * as Beneficios from "../services/beneficios.mjs";
import * as Chat from "../services/chat.mjs";
import * as Operacoes from "../services/operacoes.mjs";
import { ownershipPara, podeAdministrar } from "../services/permissoes.mjs";
import { sincronizarComApoio } from "../services/socket.mjs";
import * as T20 from "../services/t20-adapter.mjs";
import { CLASSES_DIALOGO, pedirTeste, perguntar } from "./dialogo-teste.mjs";
import { perguntarDestino, perguntarEscolha, SeletorDoCatalogo } from "./seletor-catalogo.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const ABAS = ["geral", "comodos", "residentes", "registro"];

/** Um ícone por tipo de evento, para a lista do registro se ler de relance. */
const ICONES_DE_EVENTO = {
  fundacao: "fa-house",
  ampliacao: "fa-arrow-trend-up",
  comodo: "fa-door-open",
  demolicao: "fa-person-digging",
  mobilia: "fa-couch",
  manutencao: "fa-broom",
  dano: "fa-house-crack",
  reparo: "fa-screwdriver-wrench",
  reforma: "fa-paint-roller",
  rendimento: "fa-coins",
  falha: "fa-circle-xmark",
  ajuste: "fa-wrench",
  nota: "fa-feather"
};

export class BaseSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  constructor(...args) {
    super(...args);
    this.abaAtiva = "geral";
    /** Ids dos cômodos com os detalhes abertos. */
    this.abertos = new Set();
    /** Ids dos residentes com os detalhes abertos. */
    this.pessoasAbertas = new Set();
  }

  static DEFAULT_OPTIONS = {
    classes: ["tormenta20", "sheet", "actor", "t20bas", "themed", "theme-light"],
    position: { width: 740, height: 720 },
    window: { icon: "fa-solid fa-house", resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      trocarAba: BaseSheet.#trocarAba,
      alternar: BaseSheet.#alternar,
      alternarPessoa: BaseSheet.#alternarPessoa,
      alternarTodos: BaseSheet.#alternarTodos,
      construirBase: BaseSheet.#construirBase,
      adquirirPronta: BaseSheet.#adquirirPronta,
      ampliar: BaseSheet.#ampliar,
      ajustarPorte: BaseSheet.#ajustarPorte,
      reformar: BaseSheet.#reformar,
      iniciarAventura: BaseSheet.#iniciarAventura,
      apurarEmpreendimento: BaseSheet.#apurarEmpreendimento,
      abrirCatalogo: BaseSheet.#abrirCatalogo,
      abrirItem: BaseSheet.#abrirItem,
      demolir: BaseSheet.#demolir,
      danificar: BaseSheet.#danificar,
      reparar: BaseSheet.#reparar,
      ocupantes: BaseSheet.#ocupantes,
      moverMobilia: BaseSheet.#moverMobilia,
      guardarMobilia: BaseSheet.#guardarMobilia,
      removerMobilia: BaseSheet.#removerMobilia,
      adicionarResidente: BaseSheet.#adicionarResidente,
      removerResidente: BaseSheet.#removerResidente,
      sincronizar: BaseSheet.#sincronizar,
      abrirAtor: BaseSheet.#abrirAtor,
      abrirNegocio: BaseSheet.#abrirNegocio,
      adicionarNota: BaseSheet.#adicionarNota,
      limparRegistro: BaseSheet.#limparRegistro
    }
  };

  static PARTS = {
    cabecalho: { template: `modules/${MODULO}/templates/base/cabecalho.hbs` },
    abas: { template: `modules/${MODULO}/templates/base/abas.hbs` },
    geral: { template: `modules/${MODULO}/templates/base/tab-geral.hbs`, scrollable: [""] },
    comodos: { template: `modules/${MODULO}/templates/base/tab-comodos.hbs`, scrollable: [""] },
    residentes: { template: `modules/${MODULO}/templates/base/tab-residentes.hbs`, scrollable: [""] },
    registro: { template: `modules/${MODULO}/templates/base/tab-registro.hbs`, scrollable: [""] }
  };

  get podeAdministrar() {
    return podeAdministrar(this.actor);
  }

  /**
   * Ownership do documento não basta: o Foundry o concede a quem precisa só
   * enxergar a ficha. A edição segue `podeAdministrar`.
   */
  get isEditable() {
    return super.isEditable && this.podeAdministrar;
  }

  /** Barra a ação e avisa quando quem clicou não administra a base. */
  #exigeAdministrar() {
    if (this.podeAdministrar) return true;
    ui.notifications.warn(game.i18n.localize("T20BAS.AvisoSoProprietario"));
    return false;
  }

  /* -------------------------------------------- */
  /*  Contexto                                    */
  /* -------------------------------------------- */

  async _prepareContext(opcoes) {
    const contexto = await super._prepareContext(opcoes);
    this.leitura = lerBase(this.actor);

    return Object.assign(contexto, {
      base: this.actor,
      sistema: this.actor.system,
      leitura: this.leitura,
      editavel: this.isEditable,
      ehMestre: game.user.isGM,
      abas: ABAS.map((id) => ({
        id,
        label: game.i18n.localize(`T20BAS.Aba${id.charAt(0).toUpperCase()}${id.slice(1)}`),
        ativa: this.abaAtiva === id
      })),
      fonte: game.i18n.localize("T20BAS.Fonte")
    });
  }

  async _preparePartContext(parte, contexto, opcoes) {
    contexto = await super._preparePartContext(parte, contexto, opcoes);
    if (ABAS.includes(parte)) contexto.ativa = this.abaAtiva === parte;

    switch (parte) {
      case "cabecalho": return Object.assign(contexto, this.#contextoCabecalho());
      case "geral": return Object.assign(contexto, this.#contextoGeral());
      case "comodos": return Object.assign(contexto, this.#contextoComodos());
      case "residentes": return Object.assign(contexto, this.#contextoResidentes());
      case "registro": return Object.assign(contexto, this.#contextoRegistro());
      default: return contexto;
    }
  }

  #contextoCabecalho() {
    const l = this.leitura;
    return {
      porteNome: l.porte.nome,
      portes: Regras.PORTES.map((p) => ({ id: p.id, nome: p.nome, selecionado: p.id === l.porteId })),
      tipoNome: l.tipo ? this.#nomeDoTipo(l) : (l.tipoTexto || game.i18n.localize("T20BAS.SemTipo")),
      segurancaDica: game.i18n.format("T20BAS.SegurancaDica", { base: l.seguranca.base, bonus: l.seguranca.bonus }),
      manutencao: Chat.tibares(l.manutencao),
      proprietariosPossiveis: game.actors
        .filter((a) => a.type === "character")
        .map((a) => ({ id: a.id, nome: a.name, selecionado: a.id === l.proprietarioId }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    };
  }

  #nomeDoTipo(l) {
    if (l.tipo?.id !== "movel") return l.tipo?.nome ?? "";
    return `${l.tipo.nome} (${TIPOS.movel.variantes[l.variante]?.nome ?? ""})`;
  }

  #contextoGeral() {
    const l = this.leitura;
    const indice = Regras.indiceDoPorte(l.porteId);

    return {
      adquirida: l.adquirida,
      custoConstrucao: Chat.tibares(Regras.CUSTO_CONSTRUCAO),
      cdConstrucao: Regras.CD_CONSTRUCAO,

      // O Mestre vê o porte (e o ajusta) mesmo antes de a base existir em regras.
      mostrarPorte: l.adquirida || game.user.isGM,
      porteNome: l.porte.nome,
      posicao: indice + 1,
      capacidade: l.capacidade,
      podeDiminuir: indice > 0,
      trilha: Regras.PORTES.map((p, i) => ({ nome: p.nome, cheio: i <= indice, comodos: p.comodos })),
      proximo: l.proximo,
      custoAmpliacao: l.custoAmpliacao === null ? null : Chat.tibares(l.custoAmpliacao),
      cdAmpliacao: l.cdAmpliacao,
      maisComodos: l.proximo ? l.proximo.comodos - l.capacidade : 0,
      sitioSagrado: l.sitioSagrado,

      tipo: l.tipo,
      tipoNome: l.tipo ? this.#nomeDoTipo(l) : null,
      tipoDaCasa: !l.tipo && !!l.tipoTexto,
      tipoTexto: l.tipoTexto,
      custoReforma: Chat.tibares(l.custoReforma),
      cdReforma: l.cdReforma,
      ehEmpreendimento: l.tipo?.id === "empreendimento",
      bonusEmpreendimento: l.capacidade,
      ...this.#contextoNegocio(l),

      seguranca: l.seguranca,
      invasao: game.i18n.format("T20BAS.SegurancaExplicacao", {
        seg: l.seguranca.efetiva, limite: l.seguranca.efetiva - Regras.MARGEM_INVASAO
      }),
      semSeguranca: l.seguranca.efetiva === 0,

      manutencao: Chat.tibares(l.manutencao),
      danificados: l.comodos.filter((c) => c.danificado).length,
      notas: this.actor.system.detalhes?.biography?.value ?? ""
    };
  }

  /**
   * A regra alternativa do Empreendimento: com a configuração ligada, a base
   * aponta para um negócio do módulo t20-negocios em vez de render sozinha.
   * Sem o módulo ativo, a opção fica só como aviso.
   */
  #contextoNegocio(l) {
    const usaNegocios = game.settings.get(MODULO, CONFIGS.empreendimentoComoNegocio);
    if (!usaNegocios) return { usaNegocios: false };

    const moduloAtivo = !!game.modules.get(MODULO_NEGOCIOS)?.active;
    const negocios = moduloAtivo
      ? game.actors
        .filter((a) => a.type === TIPO_NEGOCIO)
        .map((a) => ({ id: a.id, nome: a.name, nivel: a.system?.nivel, selecionado: a.id === l.negocio?.id }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      : [];

    return {
      usaNegocios: true,
      moduloNegociosAtivo: moduloAtivo,
      negocios,
      semNegocios: moduloAtivo && !negocios.length,
      negocioVinculado: l.negocio
        ? { id: l.negocio.id, nome: l.negocio.name, nivel: l.negocio.system?.nivel ?? 1 }
        : null,
      // Um id que ficou para trás: o negócio foi apagado depois do vínculo.
      negocioPerdido: !!l.negocioId && !l.negocio
    };
  }

  #contextoComodos() {
    const l = this.leitura;
    const podeGerir = this.isEditable;

    const construidos = l.comodos.map((c, indice) => ({
      id: c.id,
      vaga: indice + 1,
      nome: c.nome,
      icone: c.item.img || iconeDe(c.def),
      efeito: c.def?.efeito ?? textoDe(c.item),
      daCasa: !c.def,
      danificado: c.danificado,
      aberto: this.abertos.has(c.id),
      suite: !!c.limiteOcupantes,
      ocupantes: c.ocupantes.map((id) => game.actors.get(id)?.name).filter(Boolean).join(", "),
      travadoPor: c.catalogo ? dependentesDe(c.catalogo, l.idsCatalogo).map((d) => d.nome).join(", ") : "",
      limiteMobilias: Regras.mobiliasPorComodo(c.catalogo),
      mobilias: c.mobilias.map((m) => this.#linhaMobilia(m))
    }));

    return {
      construidos,
      vazios: Array.from({ length: l.vagasLivres }, (_, i) => l.comodos.length + i + 1),
      usadas: l.usados,
      vagas: l.capacidade,
      excedentes: l.excedentes,
      podeConstruir: podeGerir && (l.adquirida || game.user.isGM),
      ehMestre: game.user.isGM,
      semVagas: l.vagasLivres === 0,
      soltas: l.soltas.map((m) => this.#linhaMobilia(m)),
      exteriores: l.exteriores.map((m) => this.#linhaMobilia(m)),
      limiteGargulas: l.limiteGargulas,
      gargulas: l.gargulas,
      algumAberto: this.abertos.size > 0
    };
  }

  #linhaMobilia(m) {
    const incompativel = m.def && m.anfitriao?.catalogo && m.def.onde && m.def.onde !== "exterior" &&
      !m.def.onde.includes(m.anfitriao.catalogo);
    return {
      id: m.id,
      nome: m.nome,
      icone: m.item.img || iconeDaMobilia(m.def),
      efeito: m.def?.efeito ?? textoDe(m.item),
      escolha: m.def?.escolha ? rotuloDaEscolha(m) : null,
      daCasa: !m.def,
      exterior: m.exterior,
      incompativel
    };
  }

  #contextoResidentes() {
    const l = this.leitura;
    const aplicando = game.settings.get(MODULO, CONFIGS.aplicarEfeitos);

    const pessoas = l.residentes.map((actor) => {
      const { automaticos, lembretes, bloqueados } = Beneficios.beneficiosDe(l, actor.id);
      const esperados = Beneficios.montarEfeitos(this.actor, l, actor.id).length;
      return {
        actorId: actor.id,
        nome: actor.name,
        img: actor.img,
        aberto: this.pessoasAbertas.has(actor.id),
        editavelPorMim: actor.isOwner,
        // As suítes em que dorme: a única "condição" de um residente, no lugar
        // das caixas de conjurador e devoto do módulo de negócios.
        suites: l.comodos.filter((c) => c.limiteOcupantes && c.ocupantes.includes(actor.id)).map((c) => c.nome),
        automaticos,
        lembretes,
        bloqueados: bloqueados.map((b) => ({ nome: b.nome, motivo: game.i18n.localize(b.motivo) })),
        // Só interessa quando algo está fora do lugar: há bônus a aplicar, a
        // aplicação está ligada, mas os efeitos não chegaram à ficha.
        faltaSincronizar: aplicando && esperados > 0 &&
          Beneficios.efeitosExistentes(actor, this.actor.id).length !== esperados
      };
    });

    const jaSao = new Set(l.residentes.map((a) => a.id));
    const candidatos = game.actors
      .filter((a) => a.type === "character" && !jaSao.has(a.id))
      .map((a) => ({ id: a.id, nome: a.name }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    return {
      pessoas,
      aplicando,
      semResidentes: !pessoas.length,
      candidatos,
      podeAdicionar: this.isEditable && candidatos.length > 0,
      algumAberto: this.pessoasAbertas.size > 0
    };
  }

  /**
   * O registro é um log: o que aconteceu e quando, agrupado por dia como no
   * módulo de negócios. O dinheiro fica nos cards do chat de cada ação.
   */
  #contextoRegistro() {
    const registro = this.leitura.registro;
    const dias = [];
    for (const e of [...registro].sort((a, b) => b.timestamp - a.timestamp)) {
      const data = new Date(e.timestamp).toLocaleDateString("pt-BR");
      let dia = dias.at(-1);
      if (dia?.data !== data) {
        dia = { data, entradas: [] };
        dias.push(dia);
      }
      dia.entradas.push({
        tipo: e.tipo,
        texto: e.texto,
        icone: ICONES_DE_EVENTO[e.tipo] ?? ICONES_DE_EVENTO.nota,
        hora: new Date(e.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      });
    }
    return { dias, total: registro.length, vazio: !registro.length };
  }

  /* -------------------------------------------- */
  /*  Abas e acordeões                            */
  /* -------------------------------------------- */

  static #trocarAba(evento, alvo) {
    const aba = alvo.dataset.tab;
    if (!ABAS.includes(aba) || aba === this.abaAtiva) return;
    this.abaAtiva = aba;
    this.#aplicarAba();
  }

  #aplicarAba() {
    for (const painel of this.element.querySelectorAll(".tab[data-tab]")) {
      painel.classList.toggle("active", painel.dataset.tab === this.abaAtiva);
    }
    for (const botao of this.element.querySelectorAll(".sheet-tabs .item")) {
      botao.classList.toggle("active", botao.dataset.tab === this.abaAtiva);
    }
  }

  static #alternar(evento, alvo) {
    const id = alvo.dataset.id;
    const linha = alvo.closest(".t20bas-acordeon");
    if (!id || !linha) return;
    if (linha.classList.toggle("aberto")) this.abertos.add(id);
    else this.abertos.delete(id);
    this.#sincronizarBotaoTodos();
  }

  static #alternarPessoa(evento, alvo) {
    const id = alvo.dataset.actorId;
    const linha = this.element.querySelector(`.t20bas-acordeon[data-actor-id="${id}"]`);
    if (!linha) return;
    if (linha.classList.toggle("aberto")) this.pessoasAbertas.add(id);
    else this.pessoasAbertas.delete(id);
    this.#sincronizarBotaoTodos();
  }

  /**
   * Abre ou fecha tudo na aba visível. Cada aba tem o seu conjunto de abertos,
   * então o botão age sobre o que está à vista.
   */
  static #alternarTodos() {
    const linhas = [...this.element.querySelectorAll(".tab.active .t20bas-acordeon")];
    const residentes = this.abaAtiva === "residentes";
    const conjunto = residentes ? this.pessoasAbertas : this.abertos;
    const abrir = conjunto.size === 0;

    conjunto.clear();
    for (const linha of linhas) {
      linha.classList.toggle("aberto", abrir);
      const id = residentes ? linha.dataset.actorId : linha.querySelector("[data-id]")?.dataset.id;
      if (abrir && id) conjunto.add(id);
    }
    this.#sincronizarBotaoTodos();
  }

  /** Mantém o ícone de expandir/recolher coerente com o estado das linhas. */
  #sincronizarBotaoTodos() {
    const botao = this.element.querySelector('.tab.active [data-action="alternarTodos"]');
    if (!botao) return;
    const algum = (this.abaAtiva === "residentes" ? this.pessoasAbertas : this.abertos).size > 0;
    botao.querySelector("i")?.classList.toggle("fa-compress-alt", algum);
    botao.querySelector("i")?.classList.toggle("fa-expand-alt", !algum);
    botao.dataset.tooltip = game.i18n.localize(algum ? "T20BAS.RecolherTodos" : "T20BAS.ExpandirTodos");
  }

  /* -------------------------------------------- */
  /*  Aquisição, porte e tipo                     */
  /* -------------------------------------------- */

  /** Campos de tipo (e variante do Móvel) para os diálogos que o escolhem. */
  #camposDeTipo(atual = null) {
    const opcoesTipo = listarTipos().map((t) => ({ valor: t.id, rotulo: t.nome, selecionado: t.id === atual }));
    const variantes = Object.entries(TIPOS.movel.variantes).map(([valor, v]) => ({
      valor, rotulo: v.nome, selecionado: valor === this.leitura?.variante
    }));
    return [
      { nome: "tipo", rotulo: game.i18n.localize("T20BAS.CampoTipo"), opcoes: opcoesTipo },
      { nome: "variante", rotulo: game.i18n.localize("T20BAS.CampoVarianteMovel"), opcoes: variantes }
    ];
  }

  static async #construirBase() {
    if (!this.#exigeAdministrar()) return;
    const resultado = await pedirTeste({
      titulo: game.i18n.format("T20BAS.ConstruirBaseTitulo", { nome: this.actor.name }),
      descricao: game.i18n.localize("T20BAS.ConstruirBaseDescricao"),
      caixas: [
        { rotulo: game.i18n.localize("T20BAS.ReqTempo"), valor: game.i18n.localize("T20BAS.UmaAcao"),
          nota: game.i18n.localize("T20BAS.AcaoEntreAventuras") },
        { rotulo: game.i18n.localize("T20BAS.ReqInvestimento"), valor: Chat.tibares(Regras.CUSTO_CONSTRUCAO),
          nota: game.i18n.localize("T20BAS.MesmoSeFalhar") },
        { rotulo: game.i18n.localize("T20BAS.CD"), valor: String(Regras.CD_CONSTRUCAO),
          nota: game.i18n.localize("T20BAS.NobrezaOuOutra") }
      ],
      campos: this.#camposDeTipo(this.leitura.tipo?.id),
      cd: Regras.CD_CONSTRUCAO,
      sugerido: this.leitura.proprietario,
      rotuloBotao: game.i18n.localize("T20BAS.BotaoConstruir"),
      icone: "fa-solid fa-trowel-bricks"
    });
    if (!resultado) return;
    await Operacoes.construir(this.actor, {
      tipoId: resultado.extras.tipo, variante: resultado.extras.variante, resultado
    });
  }

  /** Comprada pronta ou recebida como recompensa: sem teste, em qualquer porte. */
  static async #adquirirPronta(evento, alvo) {
    if (!this.#exigeAdministrar()) return;
    const modo = alvo.dataset.modo;
    const esc = foundry.utils.escapeHTML;
    const selectDe = (nome, opcoes) => `<select name="${nome}">${opcoes
      .map((o) => `<option value="${esc(o.valor)}">${esc(o.rotulo)}</option>`).join("")}</select>`;

    const portes = Regras.PORTES.map((p) => ({
      valor: p.id,
      rotulo: modo === "compra" ? `${p.nome} — ${Chat.tibares(Regras.precoCompra(p.id))}` : p.nome
    }));
    const [campoTipo, campoVariante] = this.#camposDeTipo(this.leitura.tipo?.id);

    const escolha = await DialogV2.wait({
      window: { title: game.i18n.localize(modo === "compra" ? "T20BAS.BotaoComprarPronta" : "T20BAS.BotaoRecebida"),
        icon: "fa-solid fa-key" },
      classes: CLASSES_DIALOGO,
      position: { width: 440 },
      content: `<div class="t20bas-form">
        <p>${game.i18n.localize(modo === "compra" ? "T20BAS.CompraDescricao" : "T20BAS.RecebidaDescricao")}</p>
        <div class="form-group"><label>${game.i18n.localize("T20BAS.CampoPorte")}</label>
          <div class="form-fields">${selectDe("porte", portes)}</div></div>
        <div class="form-group"><label>${campoTipo.rotulo}</label>
          <div class="form-fields">${selectDe("tipo", campoTipo.opcoes)}</div></div>
        <div class="form-group"><label>${campoVariante.rotulo}</label>
          <div class="form-fields">${selectDe("variante", campoVariante.opcoes)}</div></div>
      </div>`,
      buttons: [
        {
          action: "ok",
          label: game.i18n.localize("T20BAS.BotaoConfirmar"),
          default: true,
          callback: (_e, botao) => ({
            porteId: botao.form.elements.porte.value,
            tipoId: botao.form.elements.tipo.value,
            variante: botao.form.elements.variante.value
          })
        },
        { action: "cancelar", label: game.i18n.localize("T20BAS.BotaoCancelar") }
      ],
      rejectClose: false
    });
    if (!escolha || escolha === "cancelar") return;
    await Operacoes.adquirirSemTeste(this.actor, { modo, ...escolha });
  }

  static async #ampliar() {
    if (!this.#exigeAdministrar()) return;
    const l = this.leitura;
    if (!l.proximo) {
      ui.notifications.info(game.i18n.localize("T20BAS.AvisoPorteMaximo"));
      return;
    }

    const resultado = await pedirTeste({
      titulo: game.i18n.format("T20BAS.AmpliarTitulo", { nome: this.actor.name }),
      descricao: game.i18n.format("T20BAS.AmpliarDescricao", { porte: l.proximo.nome, comodos: l.proximo.comodos }),
      caixas: [
        { rotulo: game.i18n.localize("T20BAS.ReqTempo"), valor: game.i18n.localize("T20BAS.UmaAcao"),
          nota: game.i18n.localize("T20BAS.AcaoEntreAventuras") },
        { rotulo: game.i18n.localize("T20BAS.ReqInvestimento"), valor: Chat.tibares(l.custoAmpliacao),
          nota: game.i18n.localize(l.sitioSagrado ? "T20BAS.MetadeSitioSagrado" : "T20BAS.DiferencaDePreco") },
        { rotulo: game.i18n.localize("T20BAS.CD"), valor: String(l.cdAmpliacao),
          nota: game.i18n.localize("T20BAS.NobrezaOuOutra") }
      ],
      cd: l.cdAmpliacao,
      sugerido: l.proprietario,
      rotuloBotao: game.i18n.format("T20BAS.BotaoAmpliarPara", { porte: l.proximo.nome }),
      icone: "fa-solid fa-arrow-up"
    });
    if (!resultado) return;
    await Operacoes.ampliar(this.actor, resultado);
  }

  /**
   * O Mestre sobe ou desce o porte um degrau, sem teste nem custo — como o
   * ajuste de nível do módulo de negócios. Fica no registro.
   */
  static async #ajustarPorte(evento, alvo) {
    if (!game.user.isGM) return;
    const indice = Regras.indiceDoPorte(this.leitura.porteId) + Number(alvo.dataset.delta ?? 1);
    const destino = Regras.PORTES[Math.clamp(indice, 0, Regras.PORTES.length - 1)];
    await Operacoes.ajustarPorte(this.actor, destino.id);
  }

  static async #reformar() {
    if (!this.#exigeAdministrar()) return;
    const l = this.leitura;
    const resultado = await pedirTeste({
      titulo: game.i18n.format("T20BAS.ReformarTitulo", { nome: this.actor.name }),
      descricao: game.i18n.localize("T20BAS.ReformarDescricao"),
      caixas: [
        { rotulo: game.i18n.localize("T20BAS.ReqTempo"), valor: game.i18n.localize("T20BAS.UmaAcao"),
          nota: game.i18n.localize("T20BAS.AcaoEntreAventuras") },
        { rotulo: game.i18n.localize("T20BAS.ReqInvestimento"), valor: Chat.tibares(l.custoReforma),
          nota: game.i18n.localize("T20BAS.MetadeDaConstrucao") },
        { rotulo: game.i18n.localize("T20BAS.CD"), valor: String(l.cdReforma),
          nota: game.i18n.localize("T20BAS.NobrezaOuOutra") }
      ],
      campos: this.#camposDeTipo(l.tipo?.id),
      cd: l.cdReforma,
      sugerido: l.proprietario,
      rotuloBotao: game.i18n.localize("T20BAS.BotaoReformar"),
      icone: "fa-solid fa-paint-roller"
    });
    if (!resultado) return;
    await Operacoes.reformar(this.actor, {
      tipoId: resultado.extras.tipo, variante: resultado.extras.variante, resultado
    });
  }

  /* -------------------------------------------- */
  /*  Manutenção e Empreendimento                 */
  /* -------------------------------------------- */

  /**
   * O início de uma aventura: paga-se a manutenção, ou um cômodo se danifica.
   * Quem escolhe o cômodo é quem administra — sorteado, se preferir.
   */
  static async #iniciarAventura() {
    if (!this.#exigeAdministrar()) return;
    const l = this.leitura;
    const inteiros = l.comodos.filter((c) => !c.danificado);
    const esc = foundry.utils.escapeHTML;

    const opcoesDano = [
      { valor: "sorteio", rotulo: game.i18n.localize("T20BAS.SortearComodo") },
      ...inteiros.map((c) => ({ valor: c.id, rotulo: c.nome }))
    ];

    const escolha = await DialogV2.wait({
      window: { title: game.i18n.localize("T20BAS.InicioAventuraTitulo"), icon: "fa-solid fa-flag" },
      classes: CLASSES_DIALOGO,
      position: { width: 460 },
      content: `<div class="t20bas-form">
        <p>${game.i18n.format("T20BAS.InicioAventuraTexto", { valor: Chat.tibares(l.manutencao), porte: l.porte.nome })}</p>
        ${inteiros.length ? `<div class="form-group"><label>${game.i18n.localize("T20BAS.SeNaoPagar")}</label>
          <div class="form-fields"><select name="danificar">${opcoesDano
            .map((o) => `<option value="${esc(o.valor)}">${esc(o.rotulo)}</option>`).join("")}</select></div></div>` : ""}
      </div>`,
      buttons: [
        { action: "pagar", label: game.i18n.localize("T20BAS.BotaoPagarManutencao"), icon: "fa-solid fa-coins",
          default: true, callback: () => ({ pagar: true }) },
        { action: "naoPagar", label: game.i18n.localize("T20BAS.BotaoNaoPagar"), icon: "fa-solid fa-house-crack",
          callback: (_e, botao) => ({ pagar: false, danificar: botao.form.elements.danificar?.value ?? null }) },
        { action: "cancelar", label: game.i18n.localize("T20BAS.BotaoCancelar") }
      ],
      rejectClose: false
    });
    if (!escolha || escolha === "cancelar") return;

    let danificarId = escolha.danificar;
    if (danificarId === "sorteio" && inteiros.length) {
      danificarId = inteiros[Math.floor(Math.random() * inteiros.length)].id;
    }
    await Operacoes.iniciarAventura(this.actor, { pagar: escolha.pagar, danificarId: danificarId || null });
  }

  static async #apurarEmpreendimento() {
    if (!this.#exigeAdministrar()) return;
    const l = this.leitura;
    const candidatos = l.residentes.filter((a) => a.isOwner);
    if (!candidatos.length) {
      ui.notifications.warn(game.i18n.localize("T20BAS.AvisoSemResidenteParaRolar"));
      return;
    }
    const esc = foundry.utils.escapeHTML;

    const escolha = await DialogV2.wait({
      window: { title: game.i18n.format("T20BAS.RendimentoTitulo", { nome: this.actor.name }), icon: "fa-solid fa-coins" },
      classes: CLASSES_DIALOGO,
      position: { width: 460 },
      content: `<div class="t20bas-form">
        <p>${game.i18n.format("T20BAS.RendimentoDescricao", { bonus: l.capacidade })}</p>
        <div class="form-group"><label>${game.i18n.localize("T20BAS.CampoQuemAdministra")}</label>
          <div class="form-fields"><select name="actorId">${candidatos
            .map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select></div></div>
        <div class="form-group"><label class="checkbox"><input type="checkbox" name="dedicado" />
          ${game.i18n.localize("T20BAS.RendimentoDedicado")}</label></div>
      </div>`,
      buttons: [
        { action: "ok", label: game.i18n.localize("T20BAS.BotaoRolar"), icon: "fa-solid fa-dice-d20", default: true,
          callback: (_e, botao) => ({
            actorId: botao.form.elements.actorId.value, dedicado: botao.form.elements.dedicado.checked
          }) },
        { action: "cancelar", label: game.i18n.localize("T20BAS.BotaoCancelar") }
      ],
      rejectClose: false
    });
    if (!escolha || escolha === "cancelar") return;

    const actor = game.actors.get(escolha.actorId);
    const roll = await T20.rolarInteligencia(actor, l.capacidade)
      ?? (await T20.rolarManual({ bonus: l.capacidade, cd: 0 })).roll;
    if (!roll) return;
    await Operacoes.apurarEmpreendimento(this.actor, { roll, actor, dedicado: escolha.dedicado });
  }

  /* -------------------------------------------- */
  /*  Cômodos e mobílias                          */
  /* -------------------------------------------- */

  static #abrirCatalogo(evento, alvo) {
    if (!this.#exigeAdministrar()) return;
    const modo = alvo.dataset.modo ?? "comodos";
    if (modo === "comodos" && this.leitura.vagasLivres <= 0 && !game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("T20BAS.AvisoSemVagas"));
      return;
    }
    new SeletorDoCatalogo(this.actor, { modo }).render({ force: true });
  }

  static #abrirItem(evento, alvo) {
    this.actor.items.get(alvo.dataset.id)?.sheet?.render({ force: true });
  }

  static async #demolir(evento, alvo) {
    if (!this.#exigeAdministrar()) return;
    const c = this.leitura.comodos.find((x) => x.id === alvo.dataset.id);
    if (!c) return;
    const dependentes = c.catalogo ? dependentesDe(c.catalogo, this.leitura.idsCatalogo) : [];
    const aviso = dependentes.length
      ? `<p class="t20bas-alerta">${game.i18n.format("T20BAS.AvisoDependentes",
        { comodos: dependentes.map((d) => d.nome).join(", ") })}</p>`
      : "";

    const confirmado = await DialogV2.confirm({
      window: { title: game.i18n.format("T20BAS.DemolirTitulo", { comodo: c.nome }) },
      classes: CLASSES_DIALOGO,
      content: `<p>${game.i18n.localize("T20BAS.DemolirTexto")}</p>${aviso}`,
      rejectClose: false
    });
    if (!confirmado) return;
    this.abertos.delete(c.id);
    await Operacoes.demolirComodo(this.actor, c.id);
  }

  /** Marca à mão um cômodo como danificado — o Mestre, por um ataque à base. */
  static async #danificar(evento, alvo) {
    if (!game.user.isGM) return;
    await Operacoes.danificar(this.actor, alvo.dataset.id);
  }

  static async #reparar(evento, alvo) {
    if (!this.#exigeAdministrar()) return;
    const c = this.leitura.comodos.find((x) => x.id === alvo.dataset.id);
    if (!c) return;
    const confirmado = await DialogV2.confirm({
      window: { title: game.i18n.format("T20BAS.RepararTitulo", { comodo: c.nome }) },
      classes: CLASSES_DIALOGO,
      content: `<p>${game.i18n.format("T20BAS.RepararTexto", { custo: Chat.tibares(this.leitura.custoReparo) })}</p>`,
      rejectClose: false
    });
    if (confirmado) await Operacoes.reparar(this.actor, c.id);
  }

  /** Quem dorme numa suíte: até dois residentes. */
  static async #ocupantes(evento, alvo) {
    if (!this.#exigeAdministrar()) return;
    const c = this.leitura.comodos.find((x) => x.id === alvo.dataset.id);
    if (!c) return;
    if (!this.leitura.residentes.length) {
      ui.notifications.warn(game.i18n.localize("T20BAS.AvisoSemResidentes"));
      return;
    }
    const resposta = await perguntar({
      titulo: game.i18n.format("T20BAS.OcupantesTitulo", { comodo: c.nome }),
      rotulo: game.i18n.localize("T20BAS.Ocupantes"),
      multiplo: true,
      limite: c.limiteOcupantes,
      opcoes: this.leitura.residentes.map((a) => ({ valor: a.id, rotulo: a.name, marcado: c.ocupantes.includes(a.id) }))
    });
    if (resposta === null) return;
    await Operacoes.definirOcupantes(this.actor, c.id, resposta);
  }

  static async #moverMobilia(evento, alvo) {
    if (!this.#exigeAdministrar()) return;
    const m = this.leitura.mobilias.find((x) => x.id === alvo.dataset.id);
    if (!m) return;
    const def = m.def ?? { nome: m.nome, efeito: "" };
    const destino = await perguntarDestino(this.leitura, def, {
      atual: m.instaladaEm, ignorar: m.id, livre: game.user.isGM
    });
    if (destino === null) return;
    if (!destino) {
      await Operacoes.desinstalarMobilia(this.actor, m.id);
      return;
    }
    const anfitriao = this.leitura.comodos.find((c) => c.id === destino);
    const escolha = m.def ? await perguntarEscolha(m.def, anfitriao, { atual: m.escolha }) : "";
    if (escolha === null) return;
    await Operacoes.instalarMobilia(this.actor, m.id, destino, { escolha });
  }

  static async #guardarMobilia(evento, alvo) {
    if (!this.#exigeAdministrar()) return;
    await Operacoes.desinstalarMobilia(this.actor, alvo.dataset.id);
  }

  static async #removerMobilia(evento, alvo) {
    if (!this.#exigeAdministrar()) return;
    const item = this.actor.items.get(alvo.dataset.id);
    if (!item) return;
    const confirmado = await DialogV2.confirm({
      window: { title: game.i18n.format("T20BAS.RemoverMobiliaTitulo", { mobilia: item.name }) },
      classes: CLASSES_DIALOGO,
      content: `<p>${game.i18n.localize("T20BAS.RemoverMobiliaTexto")}</p>`,
      rejectClose: false
    });
    if (!confirmado) return;
    await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
  }

  /* -------------------------------------------- */
  /*  Residentes                                  */
  /* -------------------------------------------- */

  static async #adicionarResidente() {
    if (!this.#exigeAdministrar()) return;
    const actorId = this.element.querySelector("[data-campo=novoResidente]")?.value;
    if (!actorId) return;
    const residentes = new Set(this.actor.system.residentes ?? []);
    residentes.add(actorId);
    await this.actor.update({ "system.residentes": [...residentes] });
  }

  static async #removerResidente(evento, alvo) {
    if (!this.#exigeAdministrar()) return;
    const actorId = alvo.dataset.actorId;
    this.pessoasAbertas.delete(actorId);
    const residentes = [...(this.actor.system.residentes ?? [])].filter((id) => id !== actorId);
    await this.actor.update({ "system.residentes": residentes });

    // Quem se muda deixa de ocupar as suítes.
    for (const c of this.leitura.comodos.filter((x) => x.ocupantes.includes(actorId))) {
      await Operacoes.definirOcupantes(this.actor, c.id, c.ocupantes.filter((id) => id !== actorId));
    }
  }

  /**
   * Sincronizar não exige administrar a base: qualquer residente pode trazer os
   * bônus para a própria ficha. Só quem administra pede ao Mestre as dos outros.
   */
  static async #sincronizar() {
    const { delegado, pendentes, aplicados } = await sincronizarComApoio(this.actor, {
      delegar: this.podeAdministrar
    });

    if (delegado) ui.notifications.info(game.i18n.localize("T20BAS.AvisoSincronizadoComMestre"));
    else if (pendentes.length && this.podeAdministrar) ui.notifications.warn(game.i18n.localize("T20BAS.AvisoSemMestre"));
    else if (pendentes.length) {
      ui.notifications.info(game.i18n.format("T20BAS.AvisoSincronizadoSuas", { total: aplicados.length }));
    } else ui.notifications.info(game.i18n.localize("T20BAS.AvisoSincronizado"));

    this.render();
  }

  static #abrirNegocio() {
    this.leitura.negocio?.sheet?.render({ force: true });
  }

  static #abrirAtor(evento, alvo) {
    game.actors.get(alvo.dataset.actorId)?.sheet?.render({ force: true });
  }

  /* -------------------------------------------- */
  /*  Registro                                    */
  /* -------------------------------------------- */

  /** Uma anotação do mestre ou do jogador na linha do tempo da base. */
  static async #adicionarNota() {
    if (!this.#exigeAdministrar()) return;

    const texto = await DialogV2.wait({
      window: { title: game.i18n.localize("T20BAS.BotaoAdicionarNota"), icon: "fa-solid fa-feather" },
      classes: CLASSES_DIALOGO,
      content: `<div class="t20bas-form"><div class="form-group">
        <label>${game.i18n.localize("T20BAS.CampoNota")}</label>
        <div class="form-fields"><input type="text" name="texto" autofocus
          placeholder="${game.i18n.localize("T20BAS.ExemploNota")}" /></div>
      </div></div>`,
      buttons: [
        {
          action: "ok",
          label: game.i18n.localize("T20BAS.BotaoAnotar"),
          default: true,
          callback: (_e, botao) => botao.form.elements.texto.value.trim()
        },
        { action: "cancelar", label: game.i18n.localize("T20BAS.BotaoCancelar") }
      ],
      rejectClose: false
    });

    if (!texto || texto === "cancelar") return;
    await this.actor.setFlag(MODULO, FLAGS.registro, [...this.leitura.registro, Operacoes.entrada("nota", texto)]);
  }

  static async #limparRegistro() {
    if (!this.#exigeAdministrar()) return;
    const confirmado = await DialogV2.confirm({
      window: { title: game.i18n.localize("T20BAS.LimparRegistroTitulo") },
      classes: CLASSES_DIALOGO,
      content: `<p>${game.i18n.localize("T20BAS.LimparRegistroTexto")}</p>`,
      rejectClose: false
    });
    if (confirmado) await this.actor.setFlag(MODULO, FLAGS.registro, []);
  }

  /* -------------------------------------------- */
  /*  Formulário e render                         */
  /* -------------------------------------------- */

  _onRender(contexto, opcoes) {
    super._onRender(contexto, opcoes);
    this.#aplicarAba();

    // O proprietário não é campo do sistema: vai para a flag, e o Mestre
    // aproveita para dar ao jogador o controle do Ator da base.
    this.element.querySelector("[data-campo=proprietario]")?.addEventListener("change", async (evento) => {
      if (!game.user.isGM) return;
      const id = evento.currentTarget.value || null;
      const proprietario = id ? game.actors.get(id) : null;
      await this.actor.update({
        [`flags.${MODULO}.${FLAGS.proprietario}`]: id,
        ownership: ownershipPara(proprietario, this.actor.ownership)
      });
    });

    // O Mestre muda o porte livremente, sem teste nem custo; a mudança fica
    // no registro, porque um porte que muda sem rastro vira discussão na mesa.
    this.element.querySelector("[data-campo=porte]")?.addEventListener("change", async (evento) => {
      if (!game.user.isGM) return;
      await Operacoes.ajustarPorte(this.actor, evento.currentTarget.value);
    });

    this.element.querySelector("[data-campo=negocio]")?.addEventListener("change", async (evento) => {
      if (!this.#exigeAdministrar()) return;
      await Operacoes.vincularNegocio(this.actor, evento.currentTarget.value || null);
    });

    this.element.querySelector("[data-campo=sitioSagrado]")?.addEventListener("change", async (evento) => {
      if (!this.#exigeAdministrar()) return;
      await this.actor.setFlag(MODULO, FLAGS.sitioSagrado, evento.currentTarget.checked);
    });
  }
}

/** A descrição de um Item sem HTML. */
function textoDe(item) {
  return (item.system?.description?.value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** O rótulo da escolha de uma mobília: "Veterano (+2)", "Conhecimento". */
function rotuloDaEscolha(m) {
  if (!m.escolha) return game.i18n.localize("T20BAS.NaoDefinido");
  const def = m.def.escolha;
  if (def.tipo === "opcoes") return def.opcoes[m.escolha] ?? m.escolha;
  return game.i18n.localize(CONFIG.T20?.pericias?.[m.escolha]?.label ?? m.escolha);
}
