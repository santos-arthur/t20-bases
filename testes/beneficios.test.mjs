/*
 * Confere o caminho do catálogo até a ficha do residente:
 * `node testes/beneficios.test.mjs`.
 *
 * Monta uma base simulada — Ator, Itens de cômodo e mobília, efeitos — com os
 * dados que o módulo gera de verdade, e confere o que cada residente recebe:
 * a suíte só para quem dorme nela, o cômodo danificado sem nada, a mobília
 * guardada sem nada, a segurança fora das fichas.
 */

const textos = { "T20BAS.NomeDoEfeito": "{base}: {fonte}", "T20BAS.EfeitoSeguranca": "{nome}: segurança" };

globalThis.game = {
  system: { id: "tormenta20" },
  actors: new Map(),
  settings: { get: () => true },
  i18n: {
    localize: (k) => textos[k] ?? k,
    format: (k, d = {}) => (textos[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => d[n] ?? `{${n}}`)
  }
};
globalThis.CONFIG = { T20: { pericias: { conh: { label: "Conhecimento" }, vont: { label: "Vontade" } }, oficios: new Set(["arme"]) } };

const { MODULO } = await import("../scripts/constants.mjs");
const { lerBase } = await import("../scripts/data/base.mjs");
const { COMODOS } = await import("../scripts/data/comodos.mjs");
const { MOBILIAS } = await import("../scripts/data/mobilias.mjs");
const Itens = await import("../scripts/services/itens.mjs");
const Beneficios = await import("../scripts/services/beneficios.mjs");

/* -------------------------------------------- */
/*  Documentos simulados                        */
/* -------------------------------------------- */

let proximoId = 0;
const novoId = () => `id${String(++proximoId).padStart(13, "0")}`;
const lerFlagDe = (doc) => (chave) => doc.flags?.[MODULO]?.[chave];

function efeito(dados) {
  const e = { id: novoId(), ...structuredClone(dados) };
  e.getFlag = (_m, chave) => lerFlagDe(e)(chave);
  e.toObject = () => ({ ...structuredClone(dados), _id: e.id });
  return e;
}

function item(dados, flagsExtras = {}) {
  const i = { id: novoId(), sort: proximoId, ...structuredClone(dados) };
  i.flags[MODULO] = { ...i.flags[MODULO], ...flagsExtras };
  // O que o módulo faz depois de criar: segurança é da base, o resto dos residentes.
  i.effects = (dados.effects ?? []).map((d) => efeito({
    ...d, transfer: (d.changes ?? []).some((c) => c.key === "system.seguranca.bonus")
  }));
  i.getFlag = (_m, chave) => lerFlagDe(i)(chave);
  return i;
}

const ana = { id: "ana", name: "Ana", isOwner: true, effects: [] };
const bruno = { id: "bruno", name: "Bruno", isOwner: true, effects: [] };
game.actors.set("ana", ana);
game.actors.set("bruno", bruno);

const biblioteca = item(Itens.dadosDoComodo(COMODOS.biblioteca));
const guarita = item(Itens.dadosDoComodo(COMODOS.guarita));
const suite = item(Itens.dadosDoComodo(COMODOS.suite), { ocupantes: ["ana"] });
const despensa = item(Itens.dadosDoComodo(COMODOS.despensa), { danificado: true });
const colchao = item(Itens.dadosDaMobilia(MOBILIAS["colchao-de-penas-exoticas"], { anfitriao: "suite" }),
  { instaladaEm: suite.id });
const armadura = item(Itens.dadosDaMobilia(MOBILIAS["armadura-decorativa"], { anfitriao: "biblioteca" }),
  { instaladaEm: biblioteca.id });
const bau = item(Itens.dadosDaMobilia(MOBILIAS["bau-reforcado"], { anfitriao: "despensa" }),
  { instaladaEm: despensa.id });
const obra = item(Itens.dadosDaMobilia(MOBILIAS["obra-de-arte"]));

const base = {
  id: "base1",
  uuid: "Actor.base1",
  name: "Forte do Corvo",
  img: "forte.webp",
  type: "bases",
  system: { porte: "bas", tipo: "Fortificação", residentes: new Set(["ana", "bruno"]), seguranca: { base: 0, bonus: 9, total: 9 } },
  items: [biblioteca, guarita, suite, despensa, colchao, armadura, bau, obra],
  flags: { [MODULO]: {} },
  effects: []
};
base.getFlag = (_m, chave) => lerFlagDe(base)(chave);

/* -------------------------------------------- */
/*  Conferências                                */
/* -------------------------------------------- */

let falhas = 0;
const conferir = (nome, ok, detalhe = "") => {
  if (ok) console.log(`  ✓ ${nome}`);
  else { falhas++; console.log(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ""}`); }
};

console.log("\n— Itens gerados —");
conferir("a biblioteca leva um efeito \"ao usar\" em Conhecimento",
  biblioteca.effects.length === 1 && biblioteca.effects[0].system.onuse &&
  biblioteca.effects[0].system.abilityUse.names.includes("Conhecimento"));
conferir("a guarita leva só o efeito de segurança, que é da base",
  guarita.effects.length === 1 && guarita.effects[0].transfer === true);
conferir("a obra de arte, sem cômodo, não leva efeito nenhum (é lembrete)", obra.effects.length === 0);
conferir("o cômodo lembra de onde veio no catálogo", biblioteca.flags[MODULO].catalogo === "biblioteca");

console.log("\n— Leitura da base —");
const leitura = lerBase(base);
conferir("tipo lido pelo nome escrito no sistema", leitura.tipo?.id === "fortificacao");
conferir("capacidade de uma base básica: 6", leitura.capacidade === 6 && leitura.usados === 4 && leitura.vagasLivres === 2);
conferir("as mobílias vão para dentro dos cômodos",
  leitura.comodos.find((c) => c.id === suite.id).mobilias[0]?.id === colchao.id);
conferir("a obra de arte, sem cômodo, fica guardada", leitura.soltas.map((m) => m.id).join() === obra.id);
conferir("uma base com porte e cômodos conta como adquirida", leitura.adquirida);
conferir("residentes lidos do campo do sistema", leitura.residentes.map((a) => a.id).join() === "ana,bruno");

console.log("\n— O que cada residente recebe —");
const deAna = Beneficios.montarEfeitos(base, leitura, "ana");
const deBruno = Beneficios.montarEfeitos(base, leitura, "bruno");
const nomes = (efeitos) => efeitos.map((e) => e.name).sort();

conferir("Ana dorme na suíte: recebe suíte e colchão",
  nomes(deAna).includes("Forte do Corvo: Suíte") && nomes(deAna).includes("Forte do Corvo: Colchão de Penas Exóticas"),
  nomes(deAna).join(" | "));
conferir("Bruno não dorme lá: nem suíte, nem colchão",
  !nomes(deBruno).some((n) => n.includes("Suíte") || n.includes("Colchão")), nomes(deBruno).join(" | "));
conferir("todos recebem o tipo (+1 Defesa da Fortificação)",
  [deAna, deBruno].every((l) => l.some((e) => e.name === "Forte do Corvo: Fortificação")));
conferir("a despensa danificada não dá nada, nem o baú dentro dela",
  !nomes(deAna).some((n) => n.includes("Despensa") || n.includes("Baú")));
conferir("a segurança da guarita não vai para as fichas", !nomes(deAna).some((n) => n.includes("Guarita")));
conferir("a armadura decorativa, instalada, dá +1 na Defesa",
  deAna.some((e) => e.name.includes("Armadura") && e.changes?.[0]?.key === "system.attributes.defesa.bonus"));
conferir("todo efeito leva a base de origem e uma fonte única",
  deAna.every((e) => e.flags[MODULO].baseId === "base1" && e.flags[MODULO].fonte) &&
  new Set(deAna.map((e) => e.flags[MODULO].fonte)).size === deAna.length);
conferir("efeitos \"ao usar\" chegam desligados, como o sistema espera",
  deAna.filter((e) => e.system?.onuse).every((e) => e.disabled === true));

const resumo = Beneficios.beneficiosDe(leitura, "bruno");
conferir("o resumo explica por que a suíte não vale para Bruno",
  resumo.bloqueados.some((i) => i.nome === "Suíte" && i.motivo === "T20BAS.MotivoOutrosOcupantes"));
conferir("a obra de arte guardada aparece como ignorada",
  resumo.bloqueados.some((i) => i.nome === "Obra de Arte" && i.motivo === "T20BAS.MotivoNaoInstalada"));

console.log(falhas ? `\n${falhas} FALHA(S)\n` : "\nTudo passou.\n");
process.exit(falhas ? 1 : 0);
