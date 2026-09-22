/**
 * Identificadores e constantes compartilhadas.
 *
 * Fonte das regras: ver `FONTE_REGRAS`.
 */

export const MODULO = "t20-bases";

/** O único sistema em que o módulo funciona. */
export const SISTEMA = "tormenta20";

/**
 * O livro de onde as regras saem, do jeito que deve ser citado na interface e
 * nos comentários. O módulo é material de fã, sem vínculo com a editora.
 */
export const FONTE_REGRAS = "Tormenta20 - Heróis de Arton";

/**
 * O tipo de Ator de base — o do próprio sistema Tormenta20. O módulo não cria
 * um tipo novo: estende o que o sistema já tem, e com isso as bases criadas
 * antes do módulo, os cômodos e as mobílias continuam valendo.
 */
export const TIPO_BASE = "bases";

/** Tipos de Item que o sistema aceita dentro de uma base. */
export const ITEM_COMODO = "comodo";
export const ITEM_MOBILIA = "mobilia";

/** Canal de socket usado para delegar gravações ao Mestre. */
export const SOCKET = `module.${MODULO}`;

/** Chaves de configuração do mundo. */
export const CONFIGS = {
  /** Aplicar Active Effects nos residentes. */
  aplicarEfeitos: "aplicarEfeitos",
  /**
   * A mesa usa as regras de negócios de Jornada Heroica - Fim dos Tempos Arco 2:
   * Valkaria: o Empreendimento vira um negócio do módulo t20-negocios.
   */
  empreendimentoComoNegocio: "empreendimentoComoNegocio"
};

/**
 * O módulo irmão de negócios, e o tipo de Ator que ele registra. Só servem à
 * opção `empreendimentoComoNegocio`; sem ele ativo, a opção não tem o que ligar.
 */
export const MODULO_NEGOCIOS = "t20-negocios";
export const TIPO_NEGOCIO = `${MODULO_NEGOCIOS}.negocio`;

/**
 * Flags que o módulo grava.
 *
 * No Ator da base: o que o schema do sistema não tem lugar para guardar.
 * Nos Itens: de onde o cômodo ou a mobília saiu e em que estado está.
 * Nos residentes: de onde veio cada Active Effect.
 */
export const FLAGS = {
  // Ator da base
  /** Id do personagem proprietário, que administra a base. */
  proprietario: "proprietario",
  /** Chave do tipo em TIPOS; `system.tipo` guarda o nome, para a ficha do sistema. */
  tipo: "tipo",
  /** Variante do tipo Móvel: terrestre ou aquático. */
  variante: "variante",
  /** A base já foi construída, comprada ou recebida. */
  adquirida: "adquirida",
  /** Sítio sagrado do ermitão: metade do custo de porte e cômodos. */
  sitioSagrado: "sitioSagrado",
  /** Linha do tempo da base. */
  registro: "registro",
  /** Id do negócio (t20-negocios) vinculado a uma base Empreendimento. */
  negocio: "negocio",

  // Itens
  /** Id do catálogo que originou o Item. */
  catalogo: "catalogo",
  /** O cômodo danificado por falta de manutenção. */
  danificado: "danificado",
  /** Ids dos residentes que ocupam uma suíte. */
  ocupantes: "ocupantes",
  /** Mobília: id do Item do cômodo que a recebe. */
  instaladaEm: "instaladaEm",
  /** A escolha feita ao instalar (patamar, perícia). */
  escolha: "escolha",

  // Efeitos
  /** Id da base que originou um Active Effect. */
  origem: "baseId",
  /** De onde, dentro da base, o efeito vem — há um efeito por fonte. */
  fonte: "fonte"
};

/** Chave de flag de fonte para os efeitos do tipo da base. */
export const FONTE_TIPO = "tipo";

/** Perícia padrão dos testes de construção. */
export const PERICIA_NOBREZA = "nobr";

/** Ícone padrão de uma base, quando o Ator ainda usa o do sistema. */
export const ICONE_PADRAO = "icons/environment/settlement/watchtower-cliff.webp";
