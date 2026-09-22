# Bases — Tormenta 20

Todo grupo de aventureiros sonha com um lar. Com este módulo, o seu grupo
constrói uma torre, compra um casarão ou herda o castelo do vilão — e vê a base
crescer, ganhar cômodos e mobílias, e devolver benefícios a quem mora nela, sem
ninguém ter que lembrar de somar nada na ficha.

As regras de bases são da [**Jambô Editora**](https://jamboeditora.com.br) e
foram publicadas em
[**Tormenta20 - Heróis de Arton**](https://jamboeditora.com.br/produto/tormenta20-herois-de-arton/).
O módulo não traz o livro, só põe as regras para rodar na sua mesa. Para
conhecer o sistema de bases por completo,
[adquira o livro na loja da Jambô](https://jamboeditora.com.br/produto/tormenta20-herois-de-arton/).

> Módulo **não oficial**, feito por fã, sem vínculo com a Jambô Editora.
> Tormenta20 é marca da Jambô Editora.

---

## O que você ganha

- **A ficha de base completa.** O Ator do tipo Base do sistema Tormenta20 ganha
  uma ficha nova, com as regras do livro. As bases que você já tinha continuam
  valendo.
- **Construir, comprar ou receber** a base, com o teste e o custo certos.
- **Seis portes**, da tenda reforçada ao castelo, e o que custa crescer.
- **Seis tipos** — Centro de Poder, Empreendimento, Esconderijo, Fortificação,
  Móvel e Residência — e a reforma para trocar de um para outro.
- **Todos os cômodos e mobílias do livro**: 41 cômodos e 25 mobílias, com
  pré-requisitos, e mobílias que mudam de efeito conforme o cômodo onde estão.
- **Segurança** calculada pelos cômodos, com o que ela significa contra
  invasores.
- **Manutenção** no início de cada aventura, com cômodos danificados e reparos.
- **Benefícios na ficha de quem mora na base**, com o nome da base de onde
  vieram.
- **Registro** do que aconteceu com a base, e mensagens no chat a cada teste.

---

## A base não é um bônus permanente

Um personagem com acesso a uma biblioteca não tem +1 em Conhecimento para
sempre: ele tem acesso a uma biblioteca.

Por isso, bônus de perícia e de ataque não são somados direto na ficha. Eles
aparecem **na janela de rolagem**, já marcados, com o nome da base. Quando o
caso não se aplica, é só desmarcar.

```
  Teste de Conhecimento
  ☑ Forte do Corvo: Biblioteca     +1
```

Bônus que valem sempre — PV, PM, Defesa, limite de carga — entram direto na
ficha.

O que depende de decisão da mesa (proficiências, magias extras, parceiros, usos
por aventura) aparece como **lembrete** para cada morador, em vez de virar um
número que ninguém sabe de onde veio.

---

## Requisitos

- **Foundry VTT** versão 14.
- Sistema **Tormenta20**, versão 1.6 ou maior.

---

## Instalação

Em **Configurações → Gerenciar Módulos → Instalar Módulo**, procure por
**Bases — Tormenta 20**, ou cole a URL do manifesto:

```
https://github.com/santos-arthur/t20-bases/releases/latest/download/module.json
```

Depois ative o módulo no mundo, em **Configurações do Mundo → Gerenciar
Módulos**.

---

## Como usar

### Criando a base

Crie um Ator do tipo **Base**. A ficha tem quatro abas: **Visão geral**,
**Cômodos**, **Residentes** e **Registro**.

Uma base nova pode ser:

- **Construída** — T$ 1.000 e um teste de Nobreza contra CD 20. Nasce mínima.
- **Comprada pronta** — três vezes o preço da tabela, em qualquer porte.
- **Recebida** — recompensa, tesouro, a torre do mago derrotado. Sem custo.

O Mestre escolhe o **proprietário** no cabeçalho da ficha. Os jogadores dele
passam a administrar a base.

### Crescendo

Na **Visão geral**, a seção Porte mostra onde a base está e quanto custa o
próximo passo. Ampliar custa a diferença de preço entre os portes e um teste
mais difícil a cada degrau.

Os testes saem pela ficha do personagem, na janela de rolagem do próprio
sistema. O módulo não mexe no dinheiro: o custo aparece no chat, e a mesa
desconta da ficha de quem pagou.

### Cômodos e mobílias

Na aba **Cômodos**, o catálogo mostra tudo o que a base pode ter — e o que falta
para o resto. Construir um cômodo pede um teste; mobílias são compradas e
instaladas num cômodo compatível. Uma mobília pode mudar de cômodo entre
aventuras.

A **suíte** só beneficia quem dorme nela: escolha os ocupantes pelo ícone de
cama.

### Início de aventura

Use o botão **Início de aventura** para pagar a manutenção. Sem pagar, um
cômodo fica danificado e para de funcionar até ser reparado.

### Residentes

Na aba **Residentes**, adicione quem mora na base. Cada morador mostra o que
recebe automaticamente, o que fica como lembrete e o que não vale para ele. Os
benefícios chegam às fichas sozinhos sempre que algo muda; o botão de setas
refaz na hora.

### O Mestre pode tudo

O Mestre muda o porte livremente e adiciona qualquer cômodo ou mobília sem
teste, sem custo e sem pré-requisito — para montar uma base recebida pronta ou
decidir algo pela história. Tudo fica no Registro.

### Quem pode o quê

| | Mestre | Proprietário | Demais jogadores |
|---|:---:|:---:|:---:|
| Ver a ficha | ✓ | ✓ | ✓ |
| Construir, ampliar, comprar mobílias | ✓ | ✓ | — |
| Escolher o proprietário | ✓ | — | — |
| Mudar o porte e adicionar cômodos e mobílias livremente | ✓ | — | — |
| Levar os benefícios às fichas | todas | todas | só as suas |

---

## Configurações do mundo

| Configuração | O que faz |
|---|---|
| **Aplicar benefícios automaticamente** | Desligue para usar o módulo só como consulta, sem mexer nas fichas. |
| **Usar as regras de Negócios no Empreendimento** | Para mesas que usam as regras de negócios de *Jornada Heroica - Fim dos Tempos Arco 2: Valkaria*: a base do tipo Empreendimento passa a ser um negócio, e a ficha pede para escolher qual. ⚠ Só funciona com o módulo [Negócios — Tormenta 20](https://github.com/santos-arthur/t20-negocios) ativo. |

---

## Dúvidas comuns

| O que acontece | O que fazer |
|---|---|
| Os bônus não apareceram na ficha | Clique no botão de setas, na aba Residentes. |
| Um bônus aparece em dobro | Não use o botão "Adicionar Efeitos aos Residentes" da ficha original do sistema junto com este módulo. Apague os efeitos repetidos na ficha do personagem. |
| O bônus não aparece na hora de rolar | Role o teste pela ficha do personagem; rolagens digitadas no chat não enxergam os bônus. |
| A suíte não dá PV a ninguém | Escolha os ocupantes dela, na aba Cômodos. |
| Uma mobília não dá nada | Ela está guardada, ou o cômodo dela está danificado. |
| O jogador não consegue mexer na base | Ele não é o proprietário. O Mestre define no cabeçalho da ficha. |
| Prefiro a ficha antiga do sistema | Troque em "Configurar ficha", no topo da janela. Nada se perde. |

As regras explicadas em detalhe, cômodo por cômodo, estão na
[documentação completa](https://github.com/santos-arthur/t20-bases/blob/main/docs/regras.md).

Encontrou um problema? Conte numa [issue no GitHub](https://github.com/santos-arthur/t20-bases/issues).

---

## Créditos

- **Regras de bases:** [Jambô Editora](https://jamboeditora.com.br), em
  [*Tormenta20 - Heróis de Arton*](https://jamboeditora.com.br/produto/tormenta20-herois-de-arton/).
  Todos os direitos sobre as regras e sobre Tormenta20 pertencem à Jambô.
- **Sistema Tormenta20 para Foundry:** [vizael e colaboradores](https://gitlab.com/vizael/Tormenta20).
- **Módulo:** Arthur Santos — feito para a própria mesa e liberado para quem
  quiser usar.

Código sob a licença
[MIT](https://github.com/santos-arthur/t20-bases/blob/main/LICENSE), que cobre
apenas o código — não as regras nem a marca Tormenta 20.
