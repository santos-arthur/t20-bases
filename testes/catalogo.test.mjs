/*
 * Confere a integridade do catálogo: `node testes/catalogo.test.mjs`.
 *
 * Um pré-requisito que aponta para um id que não existe, uma mobília que só
 * cabe num cômodo com o nome errado, uma chave de perícia inventada — nada
 * disso quebra o carregamento do módulo. Quebra só na mesa, quando alguém
 * tenta construir o cômodo. Aqui quebra antes.
 */

import { COMODOS, checarRequisitos, dependentesDe } from "../scripts/data/comodos.mjs";
import { cabeEm, MOBILIAS } from "../scripts/data/mobilias.mjs";
import * as Regras from "../scripts/data/regras.mjs";
import { TIPOS, tipoPeloNome } from "../scripts/data/tipos.mjs";

let falhas = 0;
const conferir = (nome, ok, detalhe = "") => {
  if (ok) console.log(`  ✓ ${nome}`);
  else { falhas++; console.log(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ""}`); }
};

/** As perícias do sistema Tormenta20, e mais a chave genérica de ofício. */
const PERICIAS = new Set([
  "acro", "ades", "atle", "atua", "cava", "conh", "cura", "dipl", "enga", "fort", "furt", "guer", "inic", "inti",
  "intu", "inve", "joga", "ladi", "luta", "mist", "nobr", "perc", "pilo", "pont", "refl", "reli", "sobr", "vont",
  "ofic"
]);

/** Os campos da ficha que o catálogo pode somar. */
const CAMPOS = new Set([
  "system.attributes.pv.bonus.total",
  "system.attributes.pm.bonus.total",
  "system.attributes.defesa.bonus",
  "system.attributes.carga.bonus",
  "system.attributes.movement.walk",
  "system.equipamentos.limiteVestido",
  "system.tracos.resistencias.fogo.bonus"
]);

/** Confere as peças que uma entrada devolve, em todos os contextos plausíveis. */
function conferirPecas(nome, def) {
  if (!def.residentes) return [];
  const problemas = [];
  const contextos = [
    { oficios: ["ofic"], escolha: "conh" },
    ...(Array.isArray(def.onde) ? def.onde.map((comodo) => ({ oficios: ["ofic"], comodo, escolha: "conh" })) : [])
  ];
  for (const ctx of contextos) {
    for (const peca of def.residentes(ctx)) {
      if (peca.tipo === "ficha") {
        for (const c of peca.changes) if (!CAMPOS.has(c.key)) problemas.push(`${nome}: campo ${c.key}`);
      } else if (peca.tipo === "rolagem") {
        for (const p of peca.aoUsar.pericias) if (!PERICIAS.has(p)) problemas.push(`${nome}: perícia ${p}`);
        if (!peca.aoUsar.changes.length && peca.aoUsar.custo === null) problemas.push(`${nome}: rolagem sem efeito`);
      } else {
        problemas.push(`${nome}: peça de tipo ${peca.tipo}`);
      }
    }
  }
  return problemas;
}

console.log("\n— Tamanho do catálogo (Tabelas 3-7 e 3-8) —");
conferir("41 cômodos", Object.keys(COMODOS).length === 41, `são ${Object.keys(COMODOS).length}`);
conferir("25 mobílias", Object.keys(MOBILIAS).length === 25, `são ${Object.keys(MOBILIAS).length}`);
conferir("6 tipos", Object.keys(TIPOS).length === 6, `são ${Object.keys(TIPOS).length}`);

console.log("\n— Identidade —");
for (const [nome, catalogo] of [["cômodo", COMODOS], ["mobília", MOBILIAS], ["tipo", TIPOS]]) {
  const errados = Object.entries(catalogo).filter(([chave, def]) => chave !== def.id).map(([c]) => c);
  conferir(`todo ${nome} tem id igual à chave`, !errados.length, errados.join(", "));
  const semTexto = Object.values(catalogo).filter((d) => !d.nome || !d.efeito).map((d) => d.id);
  conferir(`todo ${nome} tem nome e efeito`, !semTexto.length, semTexto.join(", "));
}

console.log("\n— Pré-requisitos —");
const portes = new Set(Regras.PORTES.map((p) => p.id));
const reqRuins = Object.values(COMODOS).flatMap((d) => [
  ...(d.requisitos?.porte && !portes.has(d.requisitos.porte) ? [`${d.id}: porte ${d.requisitos.porte}`] : []),
  ...(d.requisitos?.comodos ?? []).filter((id) => !COMODOS[id]).map((id) => `${d.id}: cômodo ${id}`)
]);
conferir("todo pré-requisito aponta para algo que existe", !reqRuins.length, reqRuins.join("; "));
conferir("formidável exigida pela ala dos criados, chapelaria e sauna",
  ["ala-dos-criados", "chapelaria", "sauna"].every((id) => COMODOS[id].requisitos?.porte === "for"));
conferir("a suíte exige base básica e pode se repetir",
  COMODOS.suite.requisitos.porte === "bas" && COMODOS.suite.repetivel && COMODOS.suite.ocupantes === 2);

const estado = (porte, comodosExistentes) => ({ porte, comodosExistentes, porteAlcanca: Regras.porteAlcanca });
conferir("casa da guarda precisa de guarita",
  !checarRequisitos(COMODOS["casa-da-guarda"], estado("for", [])).ok &&
  checarRequisitos(COMODOS["casa-da-guarda"], estado("for", ["guarita"])).ok);
conferir("casa da guarda precisa de base formidável",
  !checarRequisitos(COMODOS["casa-da-guarda"], estado("bas", ["guarita"])).ok);
conferir("um cômodo comum não se repete", checarRequisitos(COMODOS.biblioteca, estado("mod", ["biblioteca"])).faltando.jaTem);
conferir("a suíte se repete", checarRequisitos(COMODOS.suite, estado("bas", ["suite"])).ok);
conferir("demolir a oficina avisa da forjaria",
  dependentesDe("oficina-de-trabalho", ["oficina-de-trabalho", "forjaria"]).map((d) => d.id).join() === "forjaria");

console.log("\n— Mobílias —");
const ondeRuins = Object.values(MOBILIAS).flatMap((d) =>
  Array.isArray(d.onde) ? d.onde.filter((id) => !COMODOS[id]).map((id) => `${d.id}: ${id}`) : []);
conferir("todo cômodo de destino existe", !ondeRuins.length, ondeRuins.join("; "));
conferir("todo preço é positivo", Object.values(MOBILIAS).every((d) => d.preco > 0));
conferir("a bigorna cabe na oficina e na forjaria, e não na biblioteca",
  cabeEm(MOBILIAS.bigorna, "oficina-de-trabalho") && cabeEm(MOBILIAS.bigorna, "forjaria") &&
  !cabeEm(MOBILIAS.bigorna, "biblioteca"));
conferir("a gárgula não ocupa cômodo", !cabeEm(MOBILIAS["gargula-animada"], "sala-de-estar"));
conferir("a armadura decorativa cabe em qualquer cômodo", cabeEm(MOBILIAS["armadura-decorativa"], "vergel"));
conferir("a bigorna muda de efeito com o cômodo",
  MOBILIAS.bigorna.residentes({ comodo: "forjaria", oficios: [] })[0].aoUsar.tipos[0] === "attack" &&
  MOBILIAS.bigorna.residentes({ comodo: "oficina-de-trabalho", oficios: ["ofic"] })[0].aoUsar.tipos[0] === "skill");

console.log("\n— Benefícios —");
const problemas = [
  ...Object.values(COMODOS).flatMap((d) => conferirPecas(d.id, d)),
  ...Object.values(MOBILIAS).flatMap((d) => conferirPecas(d.id, d)),
  ...Object.values(TIPOS).flatMap((d) => conferirPecas(d.id, d))
];
conferir("todo benefício usa campos e perícias que o sistema conhece", !problemas.length, problemas.join("; "));
const semNada = [...Object.values(COMODOS), ...Object.values(MOBILIAS)]
  .filter((d) => !d.residentes && !d.seguranca && !d.lembrete && d.id !== "sala-de-estar")
  .map((d) => d.id);
conferir("toda entrada automatiza algo ou é lembrete", !semNada.length, semNada.join(", "));

console.log("\n— Segurança —");
const cadeiaDaGuarita = ["guarita", "casa-da-guarda", "quarto-do-capitao"].reduce((s, id) => s + COMODOS[id].seguranca, 0);
conferir("guarita + casa da guarda + quarto do capitão = +10, como diz o livro", cadeiaDaGuarita === 10, `deu ${cadeiaDaGuarita}`);
conferir("Fortificação dá +5", TIPOS.fortificacao.seguranca === 5);
const tudo = cadeiaDaGuarita + COMODOS["sistema-de-seguranca"].seguranca + COMODOS["domo-protetor"].seguranca +
  TIPOS.fortificacao.seguranca;
conferir("com tudo, a segurança passa de 20 e fica em 20", tudo > 20 && Regras.limitarSeguranca(tudo) === 20);

console.log("\n— Tipos —");
conferir("o tipo é achado pelo nome, sem acento nem caixa",
  tipoPeloNome("fortificacao")?.id === "fortificacao" && tipoPeloNome(" Móvel ")?.id === "movel");
conferir("texto livre não vira tipo", tipoPeloNome("Torre do mago") === null);
conferir("a base Móvel se desloca por terra ou por água",
  TIPOS.movel.base({ variante: "aquatico" })[0].key === "system.attributes.movement.swim" &&
  TIPOS.movel.base({ variante: "terrestre" })[0].key === "system.attributes.movement.walk");

console.log(falhas ? `\n${falhas} FALHA(S)\n` : "\nTudo passou.\n");
process.exit(falhas ? 1 : 0);
