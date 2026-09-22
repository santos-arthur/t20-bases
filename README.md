# Bases — Tormenta 20

Um módulo para **Foundry VTT** que põe em jogo as regras de bases de
**Tormenta 20**. O grupo ergue uma torre, compra um casarão, herda o castelo do
vilão; a base cresce de porte, ganha cômodos e mobílias — e quem mora nela leva
os benefícios para a própria ficha, sem ninguém ter que lembrar de somar nada.

As regras de bases são da [**Jambô Editora**](https://jamboeditora.com.br) e
foram publicadas em
[**Tormenta20 - Heróis de Arton**](https://jamboeditora.com.br/produto/tormenta20-herois-de-arton/).
Este módulo não traz o livro — só põe as regras para rodar. Para entender o
sistema por completo, adquira o livro na
[loja da Jambô](https://jamboeditora.com.br/produto/tormenta20-herois-de-arton/).

> Módulo **não oficial**, feito por fã, sem vínculo com a Jambô Editora.
> Tormenta20 é marca da Jambô Editora.

---

## O que o módulo faz

- **Estende a base do próprio sistema.** O Tormenta20 para Foundry já tem o Ator
  do tipo Base, com cômodos e mobílias como Itens. O módulo acrescenta as
  regras por cima: bases que você já tinha continuam valendo.
- **Construir, comprar ou receber** a base, com o teste, o custo e o tipo.
- **Seis portes**, da tenda ao castelo, com custo e CD de ampliação calculados.
- **Seis tipos** — Centro de Poder, Empreendimento, Esconderijo, Fortificação,
  Móvel e Residência — e a reforma para trocar de um para outro.
- **Catálogo completo**: os 41 cômodos e as 25 mobílias do livro, com
  pré-requisitos, e mobílias que mudam de efeito conforme o cômodo.
- **Segurança** somada pelos cômodos, e o que ela significa contra invasores.
- **Manutenção** no início de cada aventura, com cômodos danificados e reparos.
- **Benefícios nos residentes**: na ficha ou no diálogo de rolagem, com o nome
  da base de onde vieram.
- **Registro** de tudo que aconteceu com a base, e cards no chat para cada teste.

Os detalhes de cada regra, e o que o módulo decidiu fazer com ela, estão em
[docs/regras.md](docs/regras.md).

---

## O princípio: a base não é um bônus permanente

Um personagem com acesso a uma biblioteca não tem +1 em Conhecimento. Ele tem
acesso a uma biblioteca.

Por isso os bônus de perícia e de ataque não entram somados na ficha: aparecem
**no diálogo de rolagem**, já marcados, com o nome da base de onde vieram. Você
desmarca quando o caso não se aplicar.

```
  Teste de Conhecimento
  ☑ Forte do Corvo: Biblioteca     +1
```

Bônus que valem sempre — PV, PM, Defesa, limite de carga — esses sim entram como
efeito comum na ficha.

O que o módulo não sabe decidir (proficiências, magias adicionais, parceiros,
usos por aventura) ele não automatiza: vira lembrete. Uma ficha silenciosamente
errada custa mais caro do que uma linha de texto que o jogador lê.

É o mesmo princípio do módulo irmão, [Negócios](https://github.com/santos-arthur/t20-negocios).

---

## Requisitos

| | |
|---|---|
| Foundry VTT | versão 14 |
| Sistema | [`tormenta20`](https://gitlab.com/vizael/Tormenta20), 1.6 ou maior |
| Outros módulos | nenhum |

Não funciona em outro sistema: a base é o Ator do Tormenta 20, os bônus vão para
campos da ficha dele e as janelas vestem o estilo dele.

---

## Instalação

No Foundry, vá em **Configurações → Gerenciar Módulos → Instalar Módulo** e cole
a URL do manifesto:

```
https://github.com/santos-arthur/t20-bases/releases/latest/download/module.json
```

Depois ative o módulo no mundo, em **Configurações do Mundo → Gerenciar
Módulos**. Toda vez que ele for atualizado, **dê F5**.

---

## Usando

Crie um Ator do tipo **Base** — o do próprio sistema. A ficha do módulo abre no
lugar da original, com quatro abas: **Visão geral**, **Cômodos**, **Residentes**
e **Registro**. Quem preferir a ficha do sistema troca em "Configurar ficha".

### Adquirindo e crescendo

Uma base nova oferece três caminhos: **construir** (T$ 1.000 e Nobreza contra CD
20, nasce mínima), **comprar pronta** (três vezes a tabela, em qualquer porte) ou
**registrar como recebida**. Depois, cada porte novo custa a diferença de preço e
um teste contra `CD 20 + os cômodos do novo porte`.

Os testes saem pela ficha do personagem, no diálogo de rolagem do próprio
sistema. O módulo não mexe no dinheiro: mostra o custo no card do chat, e a mesa
desconta da ficha de quem pagou. A aba **Registro** é só o log do que aconteceu
com a base, sem valores.

### Cômodos e mobílias

Na aba **Cômodos**, o catálogo mostra o que a base pode ter e o que falta para o
resto. Construir um cômodo custa T$ 1.000 e um teste contra
`CD 20 + os cômodos que a base comporta`. Mobílias se compram e se instalam num
cômodo compatível; mover uma de lugar ajusta os efeitos.

No início de cada aventura, use **Início de aventura** para pagar a manutenção —
ou deixar de pagar e ver um cômodo danificado.

### Residentes

Na aba **Residentes**, adicione quem mora na base. Cada um vê o que recebe na
ficha, o que aparece na rolagem e o que fica como lembrete. A sincronização
roda sozinha quando algo muda; o botão de setas refaz na hora.

> Não use também o botão "Adicionar Efeitos aos Residentes" da ficha do
> sistema: ele copia os mesmos efeitos, e os bônus sairiam em dobro.

### Quem pode o quê

| | Mestre | Proprietário | Demais |
|---|:---:|:---:|:---:|
| Ver a ficha | ✓ | ✓ | ✓ |
| Administrar a base | ✓ | ✓ | — |
| Escolher o proprietário | ✓ | — | — |
| Mudar o porte e pôr cômodos e mobílias livremente, sem teste nem custo | ✓ | — | — |
| Danificar um cômodo à mão | ✓ | — | — |
| Levar os benefícios às fichas | todas | todas | **só as suas** |

Ao escolher o proprietário, o Mestre dá aos jogadores dele o controle do Ator
da base.

### Configurações do mundo

| Configuração | O que muda |
|---|---|
| **Aplicar benefícios automaticamente** | Desligue para usar o módulo só como referência |
| **Usar as regras de Negócios no Empreendimento** | A base Empreendimento conta como um negócio de nível 1 ([regras de Jornada Heroica - Fim dos Tempos Arco 2: Valkaria](https://jamboeditora.com.br)), e a ficha pede para escolher qual negócio é o dela. ⚠ Exige o módulo [Negócios — Tormenta 20](https://github.com/santos-arthur/t20-negocios) ativo |

---

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| Os bônus não aparecem na ficha | Use o botão de setas na aba Residentes |
| Um bônus aparece em dobro | Alguém usou também o botão de efeitos da ficha do sistema; apague os efeitos repetidos na ficha do personagem |
| A opção do cômodo não aparece na rolagem | O teste precisa ser rolado **pela ficha**; um `/r` no chat não enxerga os efeitos |
| A suíte não dá PV a ninguém | Escolha os ocupantes dela, na aba Cômodos |
| Uma mobília não dá nada | Está guardada, ou num cômodo danificado |
| O jogador não consegue mexer na base | Ele não é o proprietário. O Mestre define no cabeçalho da ficha |

Encontrou um bug? Abra uma [issue no GitHub](https://github.com/santos-arthur/t20-bases/issues).

---

## Créditos e licença

- **Regras de bases:** [Jambô Editora](https://jamboeditora.com.br), em
  [*Tormenta20 - Heróis de Arton*](https://jamboeditora.com.br/produto/tormenta20-herois-de-arton/).
  Todos os direitos sobre as regras e sobre Tormenta20 pertencem à Jambô.
- **Sistema Tormenta20 para Foundry:** [vizael e colaboradores](https://gitlab.com/vizael/Tormenta20),
  de onde vêm o Ator de base, os cômodos e as mobílias que este módulo estende.
- **Módulo:** Arthur Santos — projeto pessoal, escrito para a própria mesa e
  liberado para quem quiser usar.

O código do módulo está sob a licença
[MIT](https://github.com/santos-arthur/t20-bases/blob/main/LICENSE). A licença
cobre apenas o código, não as regras nem a marca Tormenta 20.
