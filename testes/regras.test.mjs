/*
 * Confere as contas contra o livro: `node testes/regras.test.mjs`.
 *
 * Cada número aqui vem de Tormenta20 - Heróis de Arton (Jambô Editora),
 * capítulo 3, "Bases" — a Tabela 3-6 e os exemplos do texto. Se uma errata
 * mudar um valor, este é o teste que deve quebrar primeiro.
 */

import * as Regras from "../scripts/data/regras.mjs";

let falhas = 0;
const igual = (nome, obtido, esperado) => {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) console.log(`  ✓ ${nome}`);
  else { falhas++; console.log(`  ✗ ${nome}\n      esperado ${JSON.stringify(esperado)}, obtido ${JSON.stringify(obtido)}`); }
};

console.log("\n— Tabela 3-6: Características de Bases —");
igual("seis portes, na ordem", Regras.PORTES.map((p) => p.id), ["min", "mod", "bas", "for", "gra", "sup"]);
igual("custos", Regras.PORTES.map((p) => p.custo), [1000, 3000, 6000, 10000, 15000, 21000]);
igual("manutenções", Regras.PORTES.map((p) => p.manutencao), [100, 300, 600, 1000, 1500, 2100]);
igual("cômodos", Regras.PORTES.map((p) => p.comodos), [0, 3, 6, 9, 12, 15]);

console.log("\n— Adquirindo uma base —");
igual("construir: CD 20", Regras.CD_CONSTRUCAO, 20);
igual("construir: T$ 1.000", Regras.CUSTO_CONSTRUCAO, 1000);
igual("nasce mínima", Regras.PORTE_INICIAL, "min");
igual("comprar pronta: três vezes a tabela (básica)", Regras.precoCompra("bas"), 18000);
igual("comprar pronta: três vezes a tabela (suprema)", Regras.precoCompra("sup"), 63000);

console.log("\n— Porte —");
igual("exemplo do livro: T$ 2.000 de mínima para modesta", Regras.custoAmpliacao("min"), 2000);
igual("de formidável para grandiosa: T$ 5.000", Regras.custoAmpliacao("for"), 5000);
igual("CD 20 + cômodos do novo porte (modesta)", Regras.cdAmpliacao("min"), 23);
igual("CD 20 + cômodos do novo porte (suprema)", Regras.cdAmpliacao("gra"), 35);
igual("suprema não amplia", [Regras.custoAmpliacao("sup"), Regras.cdAmpliacao("sup")], [null, null]);
igual("sítio sagrado: metade do custo", Regras.custoAmpliacao("min", { metade: true }), 1000);
igual("porte alcança: formidável ≥ básica", Regras.porteAlcanca("for", "bas"), true);
igual("porte alcança: modesta < formidável", Regras.porteAlcanca("mod", "for"), false);

console.log("\n— Cômodos —");
igual("CD 20 + cômodos que a base pode ter (básica)", Regras.cdComodo("bas"), 26);
igual("custo T$ 1.000", Regras.custoComodo(), 1000);
igual("sítio sagrado: T$ 500", Regras.custoComodo({ metade: true }), 500);
igual("reparo: metade do custo do cômodo", Regras.custoReparo(), 500);

console.log("\n— Reforma —");
igual("metade do custo de construção", Regras.custoReforma(), 500);
igual("CD 20 + cômodos (formidável)", Regras.cdReforma("for"), 29);

console.log("\n— Segurança —");
igual("entre 0 e 20", [Regras.limitarSeguranca(-3), Regras.limitarSeguranca(12), Regras.limitarSeguranca(25)], [0, 12, 20]);
igual("penalidade = segurança − ND", Regras.penalidadeInvasor(3, 10), 7);
igual("sem penalidade com ND igual ou maior", Regras.penalidadeInvasor(10, 10), 0);
igual("ND 5 abaixo não invade", Regras.invasaoImpossivel(5, 10), true);
igual("ND 4 abaixo invade", Regras.invasaoImpossivel(6, 10), false);

console.log("\n— Mobílias —");
igual("gárgulas: uma por porte acima de básico",
  Regras.PORTES.map((p) => Regras.limiteDeGargulas(p.id)), [0, 0, 0, 1, 2, 3]);
igual("sala de estar comporta três", Regras.mobiliasPorComodo("sala-de-estar"), 3);
igual("os demais, uma", Regras.mobiliasPorComodo("biblioteca"), 1);

console.log("\n— Empreendimento —");
igual("rende o resultado em TO", Regras.rendimentoEmpreendimento(17), 17);
igual("o dobro com a ação dedicada", Regras.rendimentoEmpreendimento(17, { dedicado: true }), 34);

console.log(falhas ? `\n${falhas} FALHA(S)\n` : "\nTudo passou.\n");
process.exit(falhas ? 1 : 0);
