/**
 * O diálogo dos testes de construção — Nobreza, ou outra perícia que a mesa
 * aprove.
 *
 * É o mesmo diálogo para construir a base, ampliar o porte, erguer um cômodo e
 * reformar, porque em regras é sempre o mesmo teste. Muda o que está em jogo,
 * que o chamador descreve nas caixas do topo — e, quando preciso, pergunta
 * alguma coisa junto (o tipo da base, por exemplo).
 *
 * A rolagem sai pela ficha do personagem, no diálogo do próprio sistema: é ele
 * que conhece os efeitos ativos, o gasto de mana e as opções de rolagem.
 */

import { MODULO } from "../constants.mjs";
import * as T20 from "../services/t20-adapter.mjs";

const { DialogV2 } = foundry.applications.api;

/** As classes de todo diálogo do módulo. */
export const CLASSES_DIALOGO = ["tormenta20", "t20bas", "t20bas-dialogo", "themed", "theme-light"];

/**
 * Abre o diálogo e devolve o resultado do teste, ou `null` se cancelado — aqui
 * ou no diálogo de rolagem do sistema.
 *
 * @param {object} opcoes
 * @param {string} opcoes.titulo
 * @param {string} opcoes.descricao
 * @param {number} opcoes.cd
 * @param {object[]} [opcoes.caixas]    `[{ rotulo, valor, nota }]`
 * @param {object[]} [opcoes.campos]    Selects extras: `[{ nome, rotulo, opcoes: [{ valor, rotulo }] }]`
 * @param {Actor} [opcoes.sugerido]     Personagem que aparece primeiro.
 * @param {string} [opcoes.rotuloBotao]
 * @param {string} [opcoes.icone]
 * @returns {Promise<object|null>} O resultado, com `extras` = valores dos campos.
 */
export async function pedirTeste({
  titulo, descricao, cd, caixas = [], campos = [], sugerido = null, rotuloBotao, icone = "fa-solid fa-dice-d20"
}) {
  const candidatos = game.actors
    .filter((a) => a.type === "character" && a.isOwner)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  if (sugerido && !candidatos.includes(sugerido) && sugerido.isOwner) candidatos.unshift(sugerido);
  const inicial = (sugerido && candidatos.includes(sugerido)) ? sugerido : candidatos[0] ?? null;

  const content = await foundry.applications.handlebars.renderTemplate(
    `modules/${MODULO}/templates/dialogo-teste.hbs`,
    {
      descricao,
      caixas,
      campos,
      temSistema: T20.temSistemaT20() && candidatos.length > 0,
      atores: candidatos.map((a) => ({ id: a.id, nome: a.name, selecionado: a.id === inicial?.id })),
      pericias: periciasDe(inicial)
    }
  );

  const escolha = await DialogV2.wait({
    window: { title: titulo, icon: "fa-solid fa-hammer" },
    classes: CLASSES_DIALOGO,
    position: { width: 480 },
    content,
    buttons: [
      {
        action: "rolar",
        label: rotuloBotao ?? game.i18n.localize("T20BAS.BotaoRolar"),
        icon: icone,
        default: true,
        callback: (_evento, botao) => {
          const form = botao.form;
          return {
            actorId: form.elements.actorId?.value || null,
            pericia: form.elements.pericia?.value || null,
            bonus: Number(form.elements.bonus?.value ?? 0),
            extras: Object.fromEntries(campos.map((c) => [c.nome, form.elements[c.nome]?.value ?? ""]))
          };
        }
      },
      { action: "cancelar", label: game.i18n.localize("T20BAS.BotaoCancelar"), icon: "fa-solid fa-xmark" }
    ],
    render: (_evento, dialogo) => ligarCampos(dialogo.element),
    rejectClose: false
  });

  if (!escolha || escolha === "cancelar") return null;

  const actor = escolha.actorId ? game.actors.get(escolha.actorId) : null;
  const pelaFicha = await T20.rolarPelaFicha(actor, escolha.pericia, { cd, titulo });
  if (pelaFicha.cancelado) return null;
  if (pelaFicha.resultado) return { ...pelaFicha.resultado, extras: escolha.extras };

  // Sem ficha para rolar, o bônus vem digitado à mão.
  const resultado = await T20.rolarManual({ bonus: escolha.bonus, cd, titulo });
  return { ...resultado, extras: escolha.extras };
}

/** Opções de perícia para um ator, com o bônus da ficha. */
export function periciasDe(actor) {
  return T20.periciasDeConstrucao(actor).map((p, i) => ({
    ...p,
    rotulo: `${p.label} (${p.valor >= 0 ? "+" : ""}${p.valor})`,
    selecionado: i === 0
  }));
}

/**
 * Trocar de personagem recarrega as perícias. Sem isso o jogador rolaria com o
 * bônus de outro personagem sem perceber.
 */
function ligarCampos(root) {
  const seletorAtor = root.querySelector("[name=actorId]");
  const seletorPericia = root.querySelector("[name=pericia]");
  if (!seletorAtor || !seletorPericia) return;

  seletorAtor.addEventListener("change", () => {
    const actor = game.actors.get(seletorAtor.value);
    seletorPericia.innerHTML = periciasDe(actor)
      .map((p) => `<option value="${p.key}">${foundry.utils.escapeHTML(p.rotulo)}</option>`)
      .join("");
  });
}

/**
 * Uma pergunta simples, com um campo só. Devolve o valor, ou `null` se a
 * pessoa desistir.
 *
 * @param {object} opcoes
 * @param {string} opcoes.titulo
 * @param {string} [opcoes.texto]
 * @param {string} opcoes.rotulo
 * @param {object[]} [opcoes.opcoes]  `[{ valor, rotulo }]`; sem opções, é um campo de texto.
 * @param {boolean} [opcoes.multiplo] Caixas de seleção em vez de select; devolve um array.
 * @param {number} [opcoes.limite]    Máximo de caixas marcadas.
 */
export async function perguntar({ titulo, texto = "", rotulo, opcoes = null, multiplo = false, limite = null,
  valor = "", rotuloBotao = null }) {
  const esc = foundry.utils.escapeHTML;
  let campo;
  if (multiplo) {
    campo = `<div class="t20bas-escolhas">${(opcoes ?? []).map((o) =>
      `<label class="checkbox"><input type="checkbox" name="escolha" value="${esc(String(o.valor))}"
        ${o.marcado ? "checked" : ""} />${esc(o.rotulo)}</label>`).join("")}</div>`;
  } else if (opcoes) {
    campo = `<select name="escolha">${opcoes.map((o) =>
      `<option value="${esc(String(o.valor))}" ${String(o.valor) === String(valor) ? "selected" : ""}>${esc(o.rotulo)}</option>`)
      .join("")}</select>`;
  } else {
    campo = `<input type="text" name="escolha" value="${esc(String(valor))}" autofocus />`;
  }

  const resposta = await DialogV2.wait({
    window: { title: titulo, icon: "fa-solid fa-pen" },
    classes: CLASSES_DIALOGO,
    position: { width: 440 },
    content: `<div class="t20bas-form">${texto ? `<p>${texto}</p>` : ""}
      ${limite ? `<p class="hint">${game.i18n.format("T20BAS.AteN", { n: limite })}</p>` : ""}
      <div class="form-group"><label>${esc(rotulo)}</label><div class="form-fields">${campo}</div></div></div>`,
    buttons: [
      {
        action: "ok",
        label: rotuloBotao ?? game.i18n.localize("T20BAS.BotaoConfirmar"),
        default: true,
        callback: (_e, botao) => (multiplo
          ? [...botao.form.querySelectorAll("[name=escolha]:checked")].map((c) => c.value)
          : botao.form.elements.escolha.value)
      },
      { action: "cancelar", label: game.i18n.localize("T20BAS.BotaoCancelar") }
    ],
    rejectClose: false
  });

  if (resposta === null || resposta === undefined || resposta === "cancelar") return null;
  return multiplo && limite ? resposta.slice(0, limite) : resposta;
}
