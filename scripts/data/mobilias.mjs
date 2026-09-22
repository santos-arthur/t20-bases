/**
 * O catálogo de mobílias.
 *
 * Mobílias são itens comuns — compradas, fabricadas ou achadas como tesouro — e
 * cada uma é instalada num cômodo. Várias mudam de efeito conforme o cômodo que
 * as recebe (a Bigorna na oficina dá Ofício, na forjaria dá dano), então os
 * benefícios são funções do cômodo anfitrião: trocar a mobília de lugar remonta
 * os efeitos do Item.
 *
 * `onde` diz em que cômodos ela funciona. Sem `onde`, qualquer cômodo serve;
 * `"exterior"` é a gárgula, que fica do lado de fora e não ocupa cômodo.
 *
 * Fonte das regras: Tormenta20 - Heróis de Arton (Jambô Editora), Tabela 3-8.
 * Material de fã, não oficial.
 */

import { naFicha, naRolagem, PERICIAS_DE_CARISMA, pericia, recurso, RESISTENCIAS, somar } from "./efeitos.mjs";

/**
 * @typedef {object} Mobilia
 * @property {string} id
 * @property {string} nome
 * @property {string} icone
 * @property {number} preco
 * @property {string} efeito
 * @property {string[]|"exterior"} [onde] Cômodos onde funciona.
 * @property {number} [seguranca]
 * @property {Function} [residentes] `(ctx) => peças`; `ctx.comodo` é o anfitrião.
 * @property {object} [escolha]
 * @property {boolean} [lembrete]
 * @property {string} [nota]
 */

/** @type {Record<string, Mobilia>} */
export const MOBILIAS = {
  "armadura-decorativa": {
    id: "armadura-decorativa",
    nome: "Armadura Decorativa",
    icone: "icons/equipment/chest/breastplate-banded-steel-gold.webp",
    preco: 2000,
    efeito: "Os residentes recebem +1 na Defesa.",
    residentes: () => [naFicha(somar("system.attributes.defesa.bonus", 1))]
  },

  "armario-de-remedios": {
    id: "armario-de-remedios",
    nome: "Armário de Remédios",
    icone: "icons/consumables/potions/bottle-round-corked-red.webp",
    preco: 2000,
    onde: ["enfermaria", "estufa"],
    efeito: "Os preparados e poções de cura do grupo recuperam +1 PV por dado.",
    lembrete: true
  },

  banheira: {
    id: "banheira",
    nome: "Banheira",
    icone: "icons/containers/barrels/barrel-open-brown-red.webp",
    preco: 300,
    onde: ["suite"],
    efeito: "Afeta só quem dorme na suíte. Uma vez por aventura, permite rolar dois dados em um teste de " +
      "Fortitude e usar o melhor resultado.",
    lembrete: true
  },

  bar: {
    id: "bar",
    nome: "Bar",
    icone: "icons/consumables/drinks/wine-amphora-clay-pink.webp",
    preco: 1000,
    efeito: "Fornece +1 PM para os residentes.",
    residentes: () => [naFicha(recurso("pm", 1))],
    nota: "O livro cita a sala de estar, o salão de baile e a sala de jogos como exemplos; o módulo aceita " +
      "qualquer cômodo."
  },

  "bau-reforcado": {
    id: "bau-reforcado",
    nome: "Baú Reforçado",
    icone: "icons/containers/chest/chest-reinforced-steel-brown.webp",
    preco: 300,
    onde: ["despensa"],
    efeito: "Aumenta o bônus da despensa no limite de carga para 3 espaços.",
    residentes: () => [naFicha(somar("system.attributes.carga.bonus", 1))]
  },

  bigorna: {
    id: "bigorna",
    nome: "Bigorna",
    icone: "icons/tools/smithing/anvil.webp",
    preco: 500,
    onde: ["oficina-de-trabalho", "forjaria"],
    efeito: "Na oficina de trabalho, aumenta o bônus em Ofício para +3. Na forjaria, aumenta o bônus em dano " +
      "para +2.",
    // Soma o que falta sobre o bônus do próprio cômodo, desmarcado como ele.
    residentes: (ctx) => ctx.comodo === "forjaria"
      ? [naRolagem({ tipos: ["attack"], chave: "dano", valor: 1, automatico: false })]
      : [pericia(ctx.oficios ?? [], 2, { automatico: false })]
  },

  "colchao-de-penas-exoticas": {
    id: "colchao-de-penas-exoticas",
    nome: "Colchão de Penas Exóticas",
    icone: "icons/sundries/survival/bedroll-pink.webp",
    preco: 500,
    onde: ["suite"],
    efeito: "Aumenta os PV extras da suíte em +3.",
    residentes: () => [naFicha(recurso("pv", 3))]
  },

  "colmeia-de-pergaminhos": {
    id: "colmeia-de-pergaminhos",
    nome: "Colmeia de Pergaminhos",
    icone: "icons/sundries/scrolls/scroll-bound-sealed-blue.webp",
    preco: 2500,
    onde: ["biblioteca", "gabinete-mistico"],
    efeito: "Conjuradores arcanos aprendem uma magia de qualquer círculo que possam lançar.",
    lembrete: true
  },

  "criatura-empalhada": {
    id: "criatura-empalhada",
    nome: "Criatura Empalhada",
    icone: "icons/creatures/abilities/bull-head-horns-glowing.webp",
    preco: 1000,
    efeito: "Fornece bônus em rolagens de dano contra criaturas do mesmo tipo igual ao patamar da criatura " +
      "empalhada (uma serpe fornece +2 contra monstros). O grupo fornece a carcaça.",
    escolha: {
      tipo: "opcoes",
      label: "Patamar da criatura",
      opcoes: { 1: "Iniciante (+1)", 2: "Veterano (+2)", 3: "Campeão (+3)", 4: "Lenda (+4)" }
    },
    // Só contra o tipo da criatura: desmarcado. Anote o tipo no nome do item.
    residentes: (ctx) => [naRolagem({
      tipos: ["attack"], chave: "dano", valor: Number(ctx.escolha) || 1, automatico: false
    })]
  },

  "engenho-automatizado": {
    id: "engenho-automatizado",
    nome: "Engenho Automatizado",
    icone: "icons/commodities/tech/cog-brass.webp",
    preco: 3000,
    onde: ["oficina-de-trabalho"],
    efeito: "Diminui à metade o tempo de fabricação de itens não consumíveis e não mágicos na base.",
    lembrete: true
  },

  "espelho-de-corpo": {
    id: "espelho-de-corpo",
    nome: "Espelho de Corpo",
    icone: "icons/sundries/survival/mirror-plain.webp",
    preco: 2000,
    onde: ["chapelaria", "suite"],
    efeito: "Na chapelaria, permite usar mais um item vestido (total de dois adicionais). Numa suíte, concede " +
      "+1 em testes de perícias baseadas em Carisma.",
    residentes: (ctx) => ctx.comodo === "suite"
      ? [pericia(PERICIAS_DE_CARISMA)]
      : [naFicha(somar("system.equipamentos.limiteVestido", 1))]
  },

  "gargula-animada": {
    id: "gargula-animada",
    nome: "Gárgula Animada",
    icone: "icons/creatures/magical/construct-stone-earth-gray.webp",
    preco: 10000,
    onde: "exterior",
    efeito: "Instalada do lado de fora, não ocupa cômodo. Até uma por categoria de porte acima de básico; cada " +
      "uma dá +2 em segurança e pode acompanhar o grupo como um parceiro fortão e guardião veterano.",
    seguranca: 2,
    lembrete: true
  },

  "idolo-dourado": {
    id: "idolo-dourado",
    nome: "Ídolo Dourado",
    icone: "icons/commodities/treasure/figurine-idol.webp",
    preco: 1200,
    efeito: "Aumenta em +1 um dos bônus em perícias fornecidos pelo cômodo.",
    escolha: { tipo: "pericia", label: "Perícia reforçada" },
    residentes: (ctx) => (ctx.escolha ? [pericia(ctx.escolha)] : [])
  },

  lareira: {
    id: "lareira",
    nome: "Lareira",
    icone: "icons/magic/fire/flame-burning-campfire-orange.webp",
    preco: 2500,
    onde: ["sala-de-estar", "cozinha", "suite"],
    efeito: "Fornece +1 na CD de efeitos de fogo e redução de fogo 2.",
    lembrete: true,
    residentes: () => [naFicha(somar("system.tracos.resistencias.fogo.bonus", 2))]
  },

  "lustre-de-cristal": {
    id: "lustre-de-cristal",
    nome: "Lustre de Cristal",
    icone: "icons/commodities/gems/gem-rough-cushion-blue.webp",
    preco: 2500,
    onde: ["sala-de-estar", "salao-de-baile"],
    efeito: "Uma vez por aventura, aumenta um efeito de luz em +1 por dado.",
    lembrete: true
  },

  "mapa-mundi": {
    id: "mapa-mundi",
    nome: "Mapa-Múndi",
    icone: "icons/tools/navigation/map-simple-tree.webp",
    preco: 1500,
    onde: ["sala-de-guerra", "sala-de-mapas"],
    efeito: "Aumenta os bônus do cômodo em +1.",
    residentes: (ctx) => ctx.comodo === "sala-de-mapas"
      ? [naRolagem({ valor: 1, automatico: false })]
      : [pericia(["guer", "inic"])]
  },

  "mesa-de-reunioes": {
    id: "mesa-de-reunioes",
    nome: "Mesa de Reuniões",
    icone: "icons/environment/settlement/city-hall.webp",
    preco: 2000,
    onde: ["sala-de-guerra", "sala-de-estar"],
    efeito: "No início de cada combate, os personagens podem trocar entre si os valores de iniciativa rolados.",
    lembrete: true
  },

  "obra-de-arte": {
    id: "obra-de-arte",
    nome: "Obra de Arte",
    icone: "icons/commodities/treasure/bust-carved-stone.webp",
    preco: 2000,
    efeito: "Uma vez por aventura, cada residente pode curar PM igual ao seu patamar × a quantidade de obras " +
      "de arte na base.",
    lembrete: true
  },

  planetario: {
    id: "planetario",
    nome: "Planetário",
    icone: "icons/commodities/treasure/crystal-ball-blue-purple.webp",
    preco: 1500,
    onde: ["observatorio"],
    efeito: "Permite usar o bônus do observatório uma vez adicional por aventura.",
    lembrete: true
  },

  prataria: {
    id: "prataria",
    nome: "Prataria",
    icone: "icons/tools/cooking/fork-steel-tan.webp",
    preco: 2000,
    onde: ["cozinha"],
    efeito: "Permite preparar uma refeição para viagem adicional.",
    lembrete: true
  },

  "prateleiras-reforcadas": {
    id: "prateleiras-reforcadas",
    nome: "Prateleiras Reforçadas",
    icone: "icons/sundries/books/book-stack.webp",
    preco: 2000,
    onde: ["biblioteca"],
    efeito: "Fornecem uma perícia treinada.",
    lembrete: true
  },

  "quadro-de-diagramas": {
    id: "quadro-de-diagramas",
    nome: "Quadro de Diagramas",
    icone: "icons/sundries/documents/blueprint-axe.webp",
    preco: 3000,
    onde: ["oficina-de-trabalho"],
    efeito: "Reduz o custo para fabricar itens mundanos na base para um quarto do preço (em vez de um terço) e " +
      "para consertar para um oitavo (em vez de um sexto).",
    lembrete: true
  },

  "reliquia-abencoada": {
    id: "reliquia-abencoada",
    nome: "Relíquia Abençoada",
    icone: "icons/commodities/treasure/figurine-goddess.webp",
    preco: 2500,
    onde: ["oratorio", "sala-de-estar"],
    efeito: "No oratório, conjuradores divinos aprendem uma magia divina de qualquer círculo que possam " +
      "lançar. Na sala de estar, todos os residentes recebem +1 nos testes de resistência.",
    lembrete: true,
    residentes: (ctx) => (ctx.comodo === "sala-de-estar" ? [pericia(RESISTENCIAS)] : [])
  },

  retratos: {
    id: "retratos",
    nome: "Retratos",
    icone: "icons/sundries/documents/document-sealed-signatures-red.webp",
    preco: 1750,
    efeito: "Os residentes recebem +5 em testes de perícia para ajudar outros residentes.",
    // Ajudar pode ser qualquer perícia, e só às vezes: desmarcado.
    residentes: () => [naRolagem({ valor: 5, automatico: false })]
  },

  "roleta-ahleniense": {
    id: "roleta-ahleniense",
    nome: "Roleta Ahleniense",
    icone: "icons/sundries/gaming/dice-pair-white-green.webp",
    preco: 2000,
    onde: ["sala-de-jogos"],
    efeito: "Permite rolar novamente um teste de perícia por aventura.",
    lembrete: true
  }
};

/** Definição de uma mobília, ou `undefined`. */
export function mobilia(id) {
  return MOBILIAS[id];
}

/** Lista ordenada pelo nome. */
export function listarMobilias() {
  return Object.values(MOBILIAS).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** O ícone de uma mobília, com um padrão. */
export function iconeDaMobilia(def) {
  return def?.icone || "systems/tormenta20/icons/svg/armchair.svg";
}

/** A mobília fica do lado de fora, sem ocupar cômodo? */
export function ehExterior(def) {
  return def?.onde === "exterior";
}

/** A mobília funciona neste cômodo do catálogo? Mobília da casa vale em qualquer um. */
export function cabeEm(def, comodoId) {
  if (!def || !def.onde) return true;
  if (ehExterior(def)) return false;
  return def.onde.includes(comodoId);
}
