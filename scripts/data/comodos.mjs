/**
 * O catálogo de cômodos de uma base.
 *
 * Cada entrada descreve o que o cômodo é e o que ele faz. Ao ser construído, o
 * cômodo vira um Item do tipo "comodo" do sistema dentro da base, com os Active
 * Effects já montados — e daí em diante é o Item que manda: o mestre pode
 * editar os efeitos, ou criar cômodos da casa do jeito que o sistema já permite.
 *
 * O que o módulo consegue aplicar sozinho vira efeito; o que depende de
 * julgamento (proficiências, magias, parceiros, permissões narrativas) fica
 * como lembrete — uma ficha silenciosamente errada custa mais caro do que uma
 * linha de texto.
 *
 * `efeito` resume a regra; não substitui o livro.
 *
 * Fonte das regras: Tormenta20 - Heróis de Arton (Jambô Editora), Tabela 3-7.
 * Material de fã, não oficial.
 */

import { naFicha, naRolagem, pericia, recurso, RESISTENCIAS, somar } from "./efeitos.mjs";

/**
 * @typedef {object} Comodo
 * @property {string} id
 * @property {string} nome
 * @property {string} icone
 * @property {string} resumo         Como o cômodo se parece na ficção.
 * @property {string} efeito         O que ele faz em regras, sem rodeios.
 * @property {object} [requisitos]   `{ porte, comodos: [ids] }` — porte mínimo.
 * @property {number} [seguranca]    Bônus na segurança da base.
 * @property {Function} [residentes] `(ctx) => peças` — ver efeitos.mjs.
 * @property {boolean} [lembrete]    Parte do efeito fica com a mesa.
 * @property {boolean} [repetivel]   Pode ser construído mais de uma vez.
 * @property {number} [ocupantes]    Só beneficia os residentes designados, até N.
 * @property {string} [nota]         Observação do módulo sobre o texto da regra.
 */

/** @type {Record<string, Comodo>} */
export const COMODOS = {
  adega: {
    id: "adega",
    nome: "Adega",
    icone: "icons/containers/barrels/barrel-hogshead-cask-oak-brown.webp",
    resumo: "Um espaço subterrâneo cheio de barris e garrafas, que educa o paladar dos moradores.",
    efeito: "O efeito de qualquer preparado ou poção ingerido pelos residentes aumenta em +1 por dado.",
    lembrete: true
  },

  "ala-dos-criados": {
    id: "ala-dos-criados",
    nome: "Ala dos Criados",
    icone: "icons/environment/people/group.webp",
    resumo: "Pajens e aias que ajudam os heróis a partir para cada busca nas melhores condições.",
    efeito: "No início de cada aventura, cada residente recebe 1d4 PM temporários por patamar, que duram até " +
      "serem gastos.",
    requisitos: { porte: "for" },
    lembrete: true
  },

  armorial: {
    id: "armorial",
    nome: "Armorial",
    icone: "icons/equipment/chest/breastplate-banded-steel.webp",
    resumo: "Uma sala repleta de armas e armaduras de todos os tipos.",
    efeito: "Fornece proficiência com um item à escolha de cada residente, que pode ser trocado no início de " +
      "cada aventura.",
    lembrete: true
  },

  biblioteca: {
    id: "biblioteca",
    nome: "Biblioteca",
    icone: "icons/sundries/books/book-embossed-bound-brown.webp",
    resumo: "Estantes recheadas de livros e pergaminhos.",
    efeito: "Os residentes recebem +1 em Conhecimento.",
    residentes: () => [pericia("conh")]
  },

  calabouco: {
    id: "calabouco",
    nome: "Calabouço",
    icone: "icons/sundries/survival/cuffs-shackles-steel.webp",
    resumo: "Onde o grupo tranca criminosos, inimigos ou pessoas inconvenientes.",
    efeito: "Os residentes recebem +1 em Intimidação e na CD de seus efeitos de medo.",
    lembrete: true,
    residentes: () => [pericia("inti")]
  },

  "camara-de-meditacao": {
    id: "camara-de-meditacao",
    nome: "Câmara de Meditação",
    icone: "icons/magic/holy/meditation-chi-focus-blue.webp",
    resumo: "Um aposento isolado e quase vazio — um tapete, alguns incensários.",
    efeito: "Os residentes recebem +1 em Vontade.",
    residentes: () => [pericia("vont")]
  },

  "casa-da-guarda": {
    id: "casa-da-guarda",
    nome: "Casa da Guarda",
    icone: "icons/environment/settlement/watchtower-stone.webp",
    resumo: "Abriga uma guarnição que protege a base.",
    efeito: "O bônus em segurança fornecido pela guarita aumenta em +4. Os guardas podem acompanhar o grupo " +
      "como um pelotão de infantaria veterano (um parceiro capanga, p. 241) junto a um dos personagens.",
    requisitos: { porte: "for", comodos: ["guarita"] },
    seguranca: 4,
    lembrete: true
  },

  chapelaria: {
    id: "chapelaria",
    nome: "Chapelaria",
    icone: "icons/equipment/head/hat-belted-grey.webp",
    resumo: "Perto da entrada, chapéus, casacos e outras peças guardados de forma organizada.",
    efeito: "Os residentes podem se beneficiar de um item vestido adicional.",
    requisitos: { porte: "for" },
    residentes: () => [naFicha(somar("system.equipamentos.limiteVestido", 1))]
  },

  cozinha: {
    id: "cozinha",
    nome: "Cozinha",
    icone: "icons/tools/cooking/cauldron-empty.webp",
    resumo: "Forno a lenha, ingredientes frescos e os utensílios para saciar a fome dos aventureiros.",
    efeito: "No início de cada aventura, escolha dois pratos especiais (Tormenta20, p. 162). Os residentes os " +
      "recebem embalados para viagem: cada um ocupa 0,5 espaço e dura até o fim da aventura ou ser consumido.",
    lembrete: true
  },

  "domo-protetor": {
    id: "domo-protetor",
    nome: "Domo Protetor",
    icone: "icons/magic/defensive/barrier-shield-dome-blue-purple.webp",
    resumo: "Uma cúpula física ou mágica ao redor da base.",
    efeito: "A base recebe +2 na segurança e, se for móvel, pode entrar em ambientes inóspitos, como debaixo " +
      "d'água, sem colocar seus ocupantes em risco.",
    requisitos: { comodos: ["gabinete-mistico"] },
    seguranca: 2,
    lembrete: true,
    nota: "O tipo Móvel chama este cômodo de \"cúpula protetora\"; é o mesmo."
  },

  despensa: {
    id: "despensa",
    nome: "Despensa",
    icone: "icons/containers/barrels/barrels-simple-stacked-white.webp",
    resumo: "Onde as provisões do grupo ficam guardadas de forma organizada.",
    efeito: "O limite de carga dos residentes aumenta em 2 espaços.",
    residentes: () => [naFicha(somar("system.attributes.carga.bonus", 2))]
  },

  enfermaria: {
    id: "enfermaria",
    nome: "Enfermaria",
    icone: "icons/tools/laboratory/mortar-powder-green.webp",
    resumo: "Um espaço para curativos e para tratar doenças e outras mazelas.",
    efeito: "Os residentes recebem +1 em Cura e em testes para estancar sangramentos ou testes de morte " +
      "(p. 300).",
    lembrete: true,
    residentes: () => [pericia("cura")]
  },

  estabulo: {
    id: "estabulo",
    nome: "Estábulo",
    icone: "icons/environment/settlement/stable.webp",
    resumo: "Abrigo confortável e seguro para animais.",
    efeito: "Cada parceiro animal ou monstro aumenta um bônus que fornece em +1, à escolha do personagem. Uma " +
      "montaria pode, em vez disso, fornecer +3m de deslocamento.",
    lembrete: true
  },

  estufa: {
    id: "estufa",
    nome: "Estufa",
    icone: "icons/tools/laboratory/bowl-herbs-green.webp",
    resumo: "Uma construção envidraçada para cultivar plantas e ervas raras.",
    efeito: "Fornece +1 na CD de todos os seus preparados e poções.",
    lembrete: true
  },

  forjaria: {
    id: "forjaria",
    nome: "Forjaria",
    icone: "icons/tools/smithing/furnace-fire-metal-orange.webp",
    resumo: "A extensão da oficina onde se trabalha o metal das armas.",
    efeito: "Os residentes recebem +1 nas rolagens de dano com uma arma empunhada à escolha, que pode ser " +
      "trocada no início de cada aventura.",
    requisitos: { comodos: ["oficina-de-trabalho"] },
    // Vem desmarcado: vale só com a arma escolhida, e o sistema não sabe qual é.
    residentes: () => [naRolagem({ tipos: ["attack"], chave: "dano", valor: 1, automatico: false })]
  },

  "gabinete-mistico": {
    id: "gabinete-mistico",
    nome: "Gabinete Místico",
    icone: "icons/sundries/books/book-embossed-spiral-purple-white.webp",
    resumo: "Um escritório isolado, com escrivaninhas e apetrechos para estudos arcanos.",
    efeito: "Os residentes recebem +1 em Misticismo.",
    residentes: () => [pericia("mist")]
  },

  ginasio: {
    id: "ginasio",
    nome: "Ginásio",
    icone: "icons/skills/melee/unarmed-punch-fist.webp",
    resumo: "Equipamentos facilmente confundíveis com instrumentos de tortura.",
    efeito: "Os residentes recebem +1 em Atletismo e nas rolagens de dano com ataques desarmados e armas " +
      "naturais.",
    // O dano vem desmarcado: o diálogo de ataque não distingue um soco de uma espada.
    residentes: () => [
      pericia("atle"),
      naRolagem({ tipos: ["attack"], chave: "dano", valor: 1, automatico: false })
    ]
  },

  guarita: {
    id: "guarita",
    nome: "Guarita",
    icone: "icons/environment/settlement/watchtower-cliff.webp",
    resumo: "De onde um porteiro ou guarda acompanha quem entra e sai.",
    efeito: "A base recebe +4 em segurança.",
    seguranca: 4
  },

  "jardim-ornamental": {
    id: "jardim-ornamental",
    nome: "Jardim Ornamental",
    icone: "icons/environment/settlement/gazebo.webp",
    resumo: "Arbustos, flores e bancos de pedra, propícios a conversas discretas.",
    efeito: "Fornece +1 em testes de Enganação.",
    residentes: () => [pericia("enga")]
  },

  "laboratorio-arcano": {
    id: "laboratorio-arcano",
    nome: "Laboratório Arcano",
    icone: "icons/tools/laboratory/alembic-glass-ball-blue.webp",
    resumo: "Uma ampliação do gabinete místico, com quadro para fórmulas e instrumentos de experimentação.",
    efeito: "No início de cada aventura, cada residente escolhe uma de suas magias arcanas. Até o fim da " +
      "aventura, o custo dela diminui em –1 PM.",
    requisitos: { comodos: ["gabinete-mistico"] },
    // Oferecido em toda magia, desmarcado: quem lança a magia escolhida marca.
    residentes: () => [naRolagem({ tipos: ["spell"], custo: -1, automatico: false })]
  },

  lavanderia: {
    id: "lavanderia",
    nome: "Lavanderia",
    icone: "icons/equipment/chest/shirt-simple-white.webp",
    resumo: "Onde as roupas dos heróis são remendadas, limpas, perfumadas e engomadas.",
    efeito: "Cada residente escolhe um item de vestuário que modifique uma perícia: ele fornece +1 nessa " +
      "perícia (ou aumenta o bônus em +1). O item pode ser trocado no início de cada aventura.",
    lembrete: true
  },

  memorial: {
    id: "memorial",
    nome: "Memorial",
    icone: "icons/environment/settlement/graveyard.webp",
    resumo: "Retratos e pertences de companheiros caídos, para que nunca sejam esquecidos.",
    efeito: "Caso um residente morra, o próximo personagem do mesmo jogador recebe +1 em um atributo.",
    lembrete: true
  },

  observatorio: {
    id: "observatorio",
    nome: "Observatório",
    icone: "icons/tools/navigation/spyglass-telescope-brass.webp",
    resumo: "Num ponto elevado, para observar os astros e vislumbrar o futuro.",
    efeito: "Se for treinado em Misticismo, uma vez por aventura você pode rolar dois dados e escolher o " +
      "melhor resultado em um teste de perícia.",
    lembrete: true
  },

  "oficina-de-trabalho": {
    id: "oficina-de-trabalho",
    nome: "Oficina de Trabalho",
    icone: "icons/tools/hand/hammer-and-nail.webp",
    resumo: "Ferramentas e bancadas que auxiliam as lides de qualquer artesão.",
    efeito: "Cada residente recebe +1 em um Ofício à escolha, que pode ser trocado no início de cada aventura.",
    // Um Ofício só, à escolha de cada residente: oferecido em todos, desmarcado.
    residentes: (ctx) => [pericia(ctx.oficios ?? [], 1, { automatico: false })]
  },

  oratorio: {
    id: "oratorio",
    nome: "Oratório",
    icone: "icons/magic/holy/prayer-hands-glowing-yellow.webp",
    resumo: "Um cômodo preparado para orações e meditação.",
    efeito: "Os residentes recebem +1 em Religião.",
    residentes: () => [pericia("reli")]
  },

  "patio-de-treinamento": {
    id: "patio-de-treinamento",
    nome: "Pátio de Treinamento",
    icone: "icons/skills/targeting/target-strike-triple-blue.webp",
    resumo: "Um espaço aberto com alvos e bonecos de palha.",
    efeito: "Os residentes recebem +1 nos testes de ataque com uma arma à escolha, que pode ser trocada no " +
      "início de cada aventura.",
    residentes: () => [naRolagem({ tipos: ["attack"], chave: "ataque", valor: 1, automatico: false })]
  },

  "quarto-do-capitao": {
    id: "quarto-do-capitao",
    nome: "Quarto do Capitão",
    icone: "icons/equipment/head/helm-barbute-horned.webp",
    resumo: "A casa da guarda ganha os aposentos de um oficial.",
    efeito: "O bônus em segurança fornecido pela guarita aumenta em +2 (total de +10). O capitão conta como " +
      "um parceiro veterano — atirador, combatente, fortão ou guardião, definido ao construir — que pode " +
      "acompanhar um dos residentes.",
    requisitos: { comodos: ["casa-da-guarda"] },
    seguranca: 2,
    lembrete: true,
    nota: "O livro dá como pré-requisito \"sala da guarda\"; o módulo lê como a Casa da Guarda."
  },

  sacada: {
    id: "sacada",
    nome: "Sacada",
    icone: "icons/environment/settlement/house-two-stories.webp",
    resumo: "Uma área aberta, para olhar a paisagem e conversar.",
    efeito: "Cada residente recebe +1 em Diplomacia.",
    residentes: () => [pericia("dipl")]
  },

  "sala-de-estar": {
    id: "sala-de-estar",
    nome: "Sala de Estar",
    icone: "icons/environment/settlement/house-manor.webp",
    resumo: "O coração da base, onde o grupo conversa, joga Cavillan e relembra as aventuras.",
    efeito: "A sala de estar pode possuir e receber os benefícios de até três mobílias diferentes."
    // Sem efeito próprio: o que ela muda é a regra de instalação de mobílias.
  },

  "sala-de-guerra": {
    id: "sala-de-guerra",
    nome: "Sala de Guerra",
    icone: "icons/tools/navigation/map-chart-tan.webp",
    resumo: "Mesa grande, mapas e miniaturas para estudar batalhas históricas.",
    efeito: "Os residentes recebem +1 em Guerra e Iniciativa.",
    residentes: () => [pericia(["guer", "inic"])]
  },

  "sala-de-jogos": {
    id: "sala-de-jogos",
    nome: "Sala de Jogos",
    icone: "icons/sundries/gaming/dice-runed-brown.webp",
    resumo: "Um ambiente de lazer com jogos de azar e de habilidade.",
    efeito: "Os residentes recebem +1 em Jogatina e recuperam 1 PM sempre que rolam um 1 natural em um teste " +
      "relevante, a critério do mestre.",
    lembrete: true,
    residentes: () => [pericia("joga")]
  },

  "sala-de-mapas": {
    id: "sala-de-mapas",
    nome: "Sala de Mapas",
    icone: "icons/tools/navigation/map-marked-green.webp",
    resumo: "Para arquivar e consultar mapas, cartilhas e instrumentos de navegação.",
    efeito: "Os residentes recebem +2 em testes de buscas (Tormenta20, p. 278) e em testes de perigos " +
      "complexos relacionados a viagens (como Jornada pelos Ermos).",
    // Qualquer perícia pode ser a da busca: oferecido em todas, desmarcado.
    residentes: () => [naRolagem({ valor: 2, automatico: false })]
  },

  "sala-de-perigo": {
    id: "sala-de-perigo",
    nome: "Sala de Perigo",
    icone: "icons/environment/traps/trap-jaw-tan.webp",
    resumo: "Bonecos, construtos e obstáculos para treinar atividades aventurescas.",
    efeito: "Os residentes recebem +2 em testes da ação treinamento (Tormenta20, p. 277).",
    requisitos: { comodos: ["sistema-de-seguranca"] },
    residentes: () => [naRolagem({ valor: 2, automatico: false })]
  },

  "sala-do-tesouro": {
    id: "sala-do-tesouro",
    nome: "Sala do Tesouro",
    icone: "icons/containers/chest/chest-reinforced-steel-cherry.webp",
    resumo: "Uma pesada porta metálica guardando os espólios do grupo.",
    efeito: "Qualquer rolagem de d% para definir tesouros aleatórios recebe +5%.",
    lembrete: true
  },

  "salao-de-baile": {
    id: "salao-de-baile",
    nome: "Salão de Baile",
    icone: "icons/environment/settlement/palast.webp",
    resumo: "Um aposento amplo, de piso de madeira ou mármore, para festas elegantes.",
    efeito: "Os residentes recebem +1 em Nobreza.",
    residentes: () => [pericia("nobr")]
  },

  sauna: {
    id: "sauna",
    nome: "Sauna",
    icone: "icons/environment/wilderness/cave-entrance-vulcano.webp",
    resumo: "Salas de vapor, piscinas quentes e frias e espaço para massagens.",
    efeito: "Uma vez por aventura, quando fizer um teste de resistência, cada residente pode rolar dois dados e " +
      "usar o melhor resultado.",
    requisitos: { porte: "for" },
    lembrete: true,
    nota: "A Tabela 3-7 resume a sauna como \"previne condições de cansaço\"; o módulo segue o texto completo."
  },

  "sistema-de-seguranca": {
    id: "sistema-de-seguranca",
    nome: "Sistema de Segurança",
    icone: "icons/environment/traps/pressure-plate.webp",
    resumo: "Armadilhas mundanas ou mágicas na entrada e nos cômodos — e os residentes sabem as senhas.",
    efeito: "A base recebe +4 de segurança. Os residentes recebem +2 em testes de resistência contra " +
      "armadilhas.",
    seguranca: 4,
    // Só contra armadilhas: oferecido nas resistências, desmarcado.
    residentes: () => [pericia(RESISTENCIAS, 2, { automatico: false })]
  },

  suite: {
    id: "suite",
    nome: "Suíte",
    icone: "icons/sundries/survival/bedroll-blue-red.webp",
    resumo: "Um quarto amplo e aconchegante, de sono mais reparador.",
    efeito: "Até dois residentes (que durmam juntos!) recebem +3 PV e as condições de descanso na base se " +
      "tornam confortáveis. Pode ser construída várias vezes.",
    requisitos: { porte: "bas" },
    repetivel: true,
    ocupantes: 2,
    lembrete: true,
    residentes: () => [naFicha(recurso("pv", 3))]
  },

  tabernaculo: {
    id: "tabernaculo",
    nome: "Tabernáculo",
    icone: "icons/sundries/books/book-purple-cross.webp",
    resumo: "Uma ampliação do oratório, com pergaminhos e textos sacros.",
    efeito: "No início de cada aventura, cada residente escolhe uma de suas magias divinas. Até o fim da " +
      "aventura, o custo dela diminui em –1 PM.",
    requisitos: { comodos: ["oratorio"] },
    residentes: () => [naRolagem({ tipos: ["spell"], custo: -1, automatico: false })]
  },

  tablado: {
    id: "tablado",
    nome: "Tablado",
    icone: "icons/tools/instruments/lute-gold-brown.webp",
    resumo: "Um palco para ensaiar peças, músicas e outras artes.",
    efeito: "Os residentes recebem +1 em Atuação.",
    residentes: () => [pericia("atua")]
  },

  vergel: {
    id: "vergel",
    nome: "Vergel",
    icone: "icons/environment/wilderness/tree-oak.webp",
    resumo: "Um ambiente externo de árvores e vegetação.",
    efeito: "Fornece +1 em Sobrevivência.",
    residentes: () => [pericia("sobr")]
  }
};

/** Definição de um cômodo, ou `undefined` se o id não existir. */
export function comodo(id) {
  return COMODOS[id];
}

/** Lista ordenada pelo nome. */
export function listarComodos() {
  return Object.values(COMODOS).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** O ícone de um cômodo, com um padrão para quando o catálogo não disser. */
export function iconeDe(def) {
  return def?.icone || "systems/tormenta20/icons/svg/door.svg";
}

/**
 * Os requisitos de um cômodo estão satisfeitos?
 *
 * `jaTem` barra um segundo cômodo igual — só a suíte pode se repetir.
 *
 * @param {Comodo} def
 * @param {object} estado `{ porte, comodosExistentes: [ids], porteAlcanca }`
 * @returns {{ok: boolean, faltando: {porte: string|null, comodos: string[], jaTem: boolean}}}
 */
export function checarRequisitos(def, { porte, comodosExistentes = [], porteAlcanca }) {
  const faltando = {
    porte: def?.requisitos?.porte && !porteAlcanca(porte, def.requisitos.porte) ? def.requisitos.porte : null,
    comodos: (def?.requisitos?.comodos ?? []).filter((id) => !comodosExistentes.includes(id)),
    jaTem: !def?.repetivel && comodosExistentes.includes(def?.id)
  };
  return { ok: !faltando.porte && !faltando.comodos.length && !faltando.jaTem, faltando };
}

/** Cômodos construídos que exigem este — para avisar antes de demolir. */
export function dependentesDe(id, comodosExistentes) {
  return [...new Set(comodosExistentes)]
    .filter((outro) => (COMODOS[outro]?.requisitos?.comodos ?? []).includes(id))
    .map((outro) => COMODOS[outro]);
}
