/**
 * Os tijolos com que o catálogo descreve um benefício.
 *
 * Um benefício de base chega à ficha de duas maneiras, e a diferença é de regra:
 *
 *  - `naFicha`: o que vale o tempo todo — PV, PM, Defesa, carga, deslocamento.
 *    Vira um Active Effect comum, somado na ficha.
 *  - `naRolagem`: bônus de perícia, de ataque, de custo de magia. Vira um efeito
 *    "ao usar" do sistema, oferecido no diálogo daquela rolagem, com o nome da
 *    base. Quem não está no caso desmarca.
 *
 * Nada aqui toca no Foundry: o catálogo é lido no import e conferido pelos
 * testes fora do jogo.
 */

/** CONST.ACTIVE_EFFECT_MODES.ADD — literal porque este arquivo é lido no import. */
const ADD = 2;

/**
 * Uma mudança somada na ficha. Leva `mode` e `type` porque o sistema olha
 * `type` para decidir onde somar deslocamento, e `mode` é o que o Foundry
 * sempre entendeu — o mesmo formato que o módulo de negócios usa.
 */
export const somar = (key, valor) => ({ key, mode: ADD, type: "add", value: String(valor) });

/** Bônus de PV ou PM, que o sistema lê como fórmula. */
export const recurso = (qual, formula) => somar(`system.attributes.${qual}.bonus.total`, formula);

/** As peças de um benefício. */
export const naFicha = (...changes) => ({ tipo: "ficha", changes });

/**
 * Bônus oferecido no diálogo de rolagem.
 *
 * `automatico` deixa a opção já marcada quando o caso comum é ela valer — a
 * Biblioteca em todo teste de Conhecimento. Um bônus que só vale às vezes (a
 * arma escolhida, uma busca, a magia do dia) começa desmarcado, senão seria
 * somado sem querer.
 *
 * `custo` é somado ao custo da habilidade: negativo é desconto de PM.
 */
export const naRolagem = ({
  tipos = ["skill"], pericias = [], nomes = [], chave = "roll", valor = null,
  automatico = true, custo = null
}) => ({
  tipo: "rolagem",
  aoUsar: {
    tipos,
    pericias,
    nomes,
    custo,
    automatico,
    changes: valor === null ? [] : [{ key: chave, value: String(valor), type: "add", priority: 0 }]
  }
});

/** Atalho para "+N em uma perícia", o benefício mais comum dos cômodos. */
export const pericia = (chaves, valor = 1, opcoes = {}) =>
  naRolagem({ pericias: [].concat(chaves), valor, ...opcoes });

/** Os três testes de resistência. */
export const RESISTENCIAS = ["fort", "refl", "vont"];

/** Perícias baseadas em Carisma, para o Espelho de Corpo numa suíte. */
export const PERICIAS_DE_CARISMA = ["ades", "atua", "dipl", "enga", "inti", "joga"];
