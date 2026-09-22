# As regras, e o que o módulo faz com elas

> **Material de fã, não oficial.** As regras de bases são da
> [**Jambô Editora**](https://jamboeditora.com.br) e foram publicadas em
> [**Tormenta20 - Heróis de Arton**](https://jamboeditora.com.br/produto/tormenta20-herois-de-arton/),
> capítulo 3, "Arsenal dos Heróis", seção "Bases" (p. 244–251). Este módulo não
> tem vínculo com a Jambô e não substitui o livro: aqui está só o suficiente
> para explicar o que virou código e por quê. Para jogar com as regras
> completas, [adquira o livro na loja da Jambô](https://jamboeditora.com.br/produto/tormenta20-herois-de-arton/).
> Tormenta20 é marca da Jambô Editora.

Este arquivo é o par do código: para cada regra de bases, um resumo do que
*Tormenta20 - Heróis de Arton* estabelece e a decisão de implementação que ela
gerou — o que virou conta, o que virou Active Effect, o que virou lembrete.
As páginas citadas são as do livro; "Tormenta20, p. X" é o livro básico.

## Sumário

- [A base é a do sistema](#a-base-é-a-do-sistema)
- [Adquirindo uma base](#adquirindo-uma-base)
- [Porte](#porte)
- [Tipos](#tipos)
- [Segurança](#segurança)
- [Manutenção e cômodos danificados](#manutenção-e-cômodos-danificados)
- [Reforma](#reforma)
- [Cômodos](#cômodos)
- [Mobílias](#mobílias)
- [Como os benefícios chegam às fichas](#como-os-benefícios-chegam-às-fichas)
- [Benefícios de estruturas](#benefícios-de-estruturas)
- [Outras regras do livro que tocam em bases](#outras-regras-do-livro-que-tocam-em-bases)
- [Leituras do texto](#leituras-do-texto)
- [O que fica com a mesa](#o-que-fica-com-a-mesa)

---

## A base é a do sistema

O sistema [Tormenta20 para Foundry](https://gitlab.com/vizael/Tormenta20) já
tem um tipo de Ator **Base** (`bases`), com porte, segurança, residentes e Itens
de **cômodo** e **mobília** que carregam Active Effects. O que ele não tem são as
regras: catálogo, custos, testes, pré-requisitos, manutenção.

O módulo **estende esse tipo** em vez de criar outro. Consequências:

- Bases criadas antes do módulo continuam valendo, com os mesmos dados.
- A ficha do módulo vira a padrão das bases, mas a do sistema continua
  registrada — "Configurar ficha" troca entre elas sem perder nada.
- O que o schema do sistema não guarda (proprietário, tipo do catálogo,
  registro, estado de cada cômodo) vai em flags do módulo.
- Um cômodo construído é um Item do sistema, com os efeitos já montados. Daí em
  diante **o Item manda**: o mestre pode editar os efeitos, e cômodos ou
  mobílias da casa criados pelo sistema também chegam às fichas.

| Dado | Onde fica |
| --- | --- |
| Porte | `system.porte` (`min`, `mod`, `bas`, `for`, `gra`, `sup`) |
| Número de cômodos | `system.rooms`, mantido em dia pelo módulo |
| Segurança | `system.seguranca.base` (ajuste do mestre) + `system.seguranca.bonus` (efeitos) |
| Residentes | `system.residentes` |
| Tipo | `system.tipo` guarda o nome, para a ficha do sistema; a chave vai em `flags.t20-bases.tipo` |
| Proprietário, registro, sítio sagrado | `flags.t20-bases.*` no Ator |
| Cômodo danificado, ocupantes da suíte, cômodo da mobília | `flags.t20-bases.*` no Item |

## Adquirindo uma base

*Heróis de Arton, p. 244.* Três caminhos:

- **Construir.** Uma ação entre aventuras (Tormenta20, p. 276), T$ 1.000 e um
  teste de **Nobreza** — ou outra perícia justificada e aprovada pelo mestre —
  contra **CD 20**. Outros personagens podem ajudar gastando as próprias ações.
  Falhando, tenta-se de novo pagando outra ação e outros T$ 1.000. Passando,
  nasce uma base **mínima** do tipo escolhido.
- **Receber** como recompensa ou tesouro, em qualquer porte.
- **Comprar pronta**, por **três vezes** o valor da tabela, em qualquer porte.

No módulo, uma base nova abre com os três caminhos na Visão geral. O teste sai
pela ficha do personagem, no diálogo de rolagem do sistema, e o diálogo oferece
Nobreza primeiro e todas as outras perícias depois — quem aprova a troca é a
mesa. A ajuda de outros personagens é a regra de ajuda do próprio sistema.

Uma base que já tem porte acima de mínima ou algum Item conta como adquirida:
é uma base de antes do módulo, e não faz sentido pedir um teste que ninguém fez.

## Porte

*Heróis de Arton, p. 244–245, Tabela 3-6.*

| Porte | Custo | Manutenção | Cômodos | Exemplos |
| --- | --- | --- | --- | --- |
| Mínima | T$ 1.000 | T$ 100 | 0 | quarto de estalagem, tenda reforçada |
| Modesta | T$ 3.000 | T$ 300 | 3 | casebre, gruta, barcaça |
| Básica | T$ 6.000 | T$ 600 | 6 | casa, torre pequena, veleiro |
| Formidável | T$ 10.000 | T$ 1.000 | 9 | casarão, torre média, nau |
| Grandiosa | T$ 15.000 | T$ 1.500 | 12 | forte, torre grande, galeão |
| Suprema | T$ 21.000 | T$ 2.100 | 15 | castelo, cidadela |

Ampliar custa uma ação entre aventuras, a **diferença de preço** entre o porte
atual e o próximo (T$ 2.000 de mínima para modesta, como no exemplo do livro) e o
mesmo teste, com **CD 20 + o número de cômodos do novo porte**. Um porte por vez.

A ficha mostra a trilha dos seis portes, o custo e a CD do próximo, e o botão de
ampliar. O mestre muda o porte livremente, sem teste nem custo — pelos botões
−/+ da seção Porte, como o nível no módulo de negócios, ou pela lista no
cabeçalho — para corrigir um engano, conceder crescimento pela história ou
importar uma base que já existia. A mudança fica no registro, e a base passa a
contar como adquirida.

As contas estão em `scripts/data/regras.mjs` e são conferidas contra a tabela em
`testes/regras.test.mjs`.

## Tipos

*Heróis de Arton, p. 245.* O tipo é a forma e a função da base, escolhido ao
criá-la e trocado só por reforma.

| Tipo | Benefício | O módulo faz |
| --- | --- | --- |
| Centro de Poder | residentes +1 PM | +1 PM na ficha |
| Empreendimento | rende TO no intervalo entre aventuras (ver abaixo) | ação "Apurar" na Visão geral |
| Esconderijo | residentes +1 em testes de resistência | +1 oferecido nas rolagens de Fortitude, Reflexos e Vontade |
| Fortificação | +5 em segurança; residentes +1 na Defesa | +5 na segurança da base; +1 Defesa na ficha |
| Móvel | veículo terrestre (12m) ou aquático (natação 12m); residentes +1,5m de deslocamento | deslocamento da base no campo do sistema; +1,5m na ficha |
| Residência | residentes +3 PV; um prato especial (Tormenta20, p. 162) por aventura | +3 PV na ficha; o prato é lembrete |

O efeito do tipo **na própria base** (a segurança da Fortificação, o
deslocamento da base Móvel) é um Active Effect no Ator da base, refeito quando o
tipo muda.

Um tipo escrito à mão que não bate com nenhum destes é um tipo da casa: o módulo
o mostra e não aplica nada. Escrever o nome de um tipo do livro na ficha do
sistema funciona — o módulo reconhece o nome, sem acento nem caixa.

### Empreendimento

Uma vez por intervalo entre aventuras, um residente faz um teste de
**Inteligência** com bônus igual ao **número de cômodos que a base pode ter**; a
base rende o resultado em **tibares de ouro**. Quem gasta a própria ação do
intervalo administrando recebe **o dobro**.

O módulo rola o teste pela ficha (`rollAtributo` do sistema, com o bônus como
parcela extra) e registra o valor em TO e em T$ (1 TO = T$ 10).

O livro oferece uma alternativa para quem usa as regras de negócios de
*Jornada Heroica - Fim dos Tempos Arco 2: Valkaria*, também da
[Jambô Editora](https://jamboeditora.com.br): em vez de render sozinha, a base
conta como um **negócio de nível 1**, que sobe de nível à parte.

Para isso existe a configuração do mundo **"Usar as regras de Negócios no
Empreendimento"**. Ligada, a base Empreendimento troca o botão "Apurar" por uma
lista dos negócios do mundo, para escolher qual é o dela; o rendimento passa a
sair pela ficha do negócio, e o vínculo fica no registro da base.

> ⚠ **Só funciona com o módulo irmão
> [Negócios — Tormenta 20](https://github.com/santos-arthur/t20-negocios)
> (`t20-negocios`) instalado e ativo**, porque os negócios são Atores dele. Com a
> configuração ligada e o módulo desativado, a ficha mostra um aviso no lugar da
> lista.

O vínculo aponta para o negócio; o módulo de bases não mexe no nível nem no
cofre dele.

## Segurança

*Heróis de Arton, p. 246.* Um número de **0 a 20** que representa as defesas da
base; começa em 0.

- Invasores com ND **abaixo** da segurança sofrem penalidade em testes de
  perícia e rolagens de dano dentro da base igual à diferença.
- Criaturas com ND **5 pontos abaixo** não conseguem invadir.

| Fonte | Bônus |
| --- | --- |
| Tipo Fortificação | +5 |
| Guarita | +4 |
| Casa da Guarda | +4 (sobre a guarita) |
| Quarto do Capitão | +2 (total de +10 com guarita e casa da guarda) |
| Sistema de Segurança | +4 |
| Domo Protetor | +2 |
| Gárgula Animada | +2 cada |

Cada fonte é um Active Effect que soma em `system.seguranca.bonus` — o mesmo
campo que o sistema já soma no total e mostra no tooltip. O mestre ainda tem o
campo base para ajustes. A ficha exibe o valor efetivo, limitado a 20, e
explica o que ele significa contra invasores.

## Manutenção e cômodos danificados

*Heróis de Arton, p. 246.* A manutenção depende do porte e é paga **no início
de cada aventura**. Sem pagar, **um dos cômodos é danificado** e para de fornecer
seus bônus até ser reparado — o que exige uma ação entre aventuras e **metade do
custo do cômodo**.

O botão "Início de aventura" pergunta: pagar, ou não pagar e danificar qual
cômodo (escolhido ou sorteado). Um cômodo danificado:

- sai da sincronização — os residentes perdem os bônus dele;
- tem os efeitos que aplica na base desligados — a guarita danificada deixa de
  somar segurança;
- leva junto as mobílias instaladas nele (leitura do módulo: elas complementam
  o cômodo, e o cômodo parou de funcionar).

O reparo custa T$ 500 (metade dos T$ 1.000 de um cômodo). O mestre também pode
marcar um cômodo como danificado à mão — um ataque à base, por exemplo.

## Reforma

*Heróis de Arton, p. 245, quadro "Reformando a Base".* A critério do mestre, a
base troca de tipo: é o teste de construção, com **metade do custo de
construção** (T$ 500) e **CD 20 + seu número de cômodos**. Cômodos que tenham o
tipo anterior como pré-requisito são destruídos — nenhum cômodo do livro tem
esse pré-requisito, então hoje nada é destruído.

## Cômodos

*Heróis de Arton, p. 246–248, Tabela 3-7.* Cada base comporta um número máximo
de cômodos, conforme o porte. Construir um custa **uma ação entre aventuras,
T$ 1.000** e o teste de sempre contra **CD 20 + o número de cômodos que a base
pode ter**. Falhando, tenta-se de novo. Salvo menção em contrário, os benefícios
valem para **todos os residentes**.

No módulo, o catálogo mostra os 41 cômodos, inclusive os que a base ainda não
alcança, com o que falta para cada um.

O **mestre constrói livremente**: o botão "Adicionar" do catálogo põe qualquer
cômodo ou mobília na base sem teste nem custo, ignorando pré-requisitos, vagas,
o limite de gárgulas e em que cômodo a mobília funciona — uma base recebida
pronta, uma decisão da mesa. Fica no registro.

### O que cada cômodo vira

- **ficha** — Active Effect somado na ficha o tempo todo.
- **rolagem** — efeito "ao usar" do sistema: aparece no diálogo daquela
  rolagem, com o nome da base. Vem **marcado** quando o caso comum é valer (a
  Biblioteca em todo teste de Conhecimento) e **desmarcado** quando só vale às
  vezes (a arma escolhida, uma busca, a magia do dia).
- **segurança** — soma na segurança da própria base.
- **lembrete** — a parte que depende de julgamento, listada para cada residente.

| Cômodo | Pré-requisito | O módulo faz |
| --- | --- | --- |
| Adega | — | lembrete |
| Ala dos Criados | base formidável | lembrete (1d4 PM temporários por patamar no início da aventura) |
| Armorial | — | lembrete (proficiência à escolha) |
| Biblioteca | — | rolagem: +1 em Conhecimento |
| Calabouço | — | rolagem: +1 em Intimidação; lembrete (+1 na CD de medo) |
| Câmara de Meditação | — | rolagem: +1 em Vontade |
| Casa da Guarda | base formidável, Guarita | segurança +4; lembrete (pelotão como parceiro capanga) |
| Chapelaria | base formidável | ficha: +1 item vestido |
| Cozinha | — | lembrete |
| Despensa | — | ficha: +2 espaços de carga |
| Domo Protetor | Gabinete Místico | segurança +2; lembrete |
| Enfermaria | — | rolagem: +1 em Cura; lembrete (sangramento, testes de morte) |
| Estábulo | — | lembrete |
| Estufa | — | lembrete (+1 na CD de preparados e poções) |
| Forjaria | Oficina de Trabalho | rolagem (desmarcado): +1 no dano |
| Gabinete Místico | — | rolagem: +1 em Misticismo |
| Ginásio | — | rolagem: +1 em Atletismo; rolagem (desmarcado): +1 no dano |
| Guarita | — | segurança +4 |
| Jardim Ornamental | — | rolagem: +1 em Enganação |
| Laboratório Arcano | Gabinete Místico | rolagem (desmarcado): −1 PM em magias |
| Lavanderia | — | lembrete |
| Memorial | — | lembrete |
| Observatório | — | lembrete |
| Oficina de Trabalho | — | rolagem (desmarcado): +1 em cada Ofício |
| Oratório | — | rolagem: +1 em Religião |
| Pátio de Treinamento | — | rolagem (desmarcado): +1 no ataque |
| Quarto do Capitão | Casa da Guarda | segurança +2; lembrete (capitão como parceiro veterano) |
| Sacada | — | rolagem: +1 em Diplomacia |
| Sala de Estar | — | comporta até três mobílias diferentes |
| Sala de Guerra | — | rolagem: +1 em Guerra e Iniciativa |
| Sala de Jogos | — | rolagem: +1 em Jogatina; lembrete (PM no 1 natural) |
| Sala de Mapas | — | rolagem (desmarcado): +2 em qualquer perícia |
| Sala de Perigo | Sistema de Segurança | rolagem (desmarcado): +2 em qualquer perícia |
| Sala do Tesouro | — | lembrete (+5% em tesouro aleatório) |
| Salão de Baile | — | rolagem: +1 em Nobreza |
| Sauna | base formidável | lembrete |
| Sistema de Segurança | — | segurança +4; rolagem (desmarcado): +2 nas resistências |
| Suíte | base básica | ficha: +3 PV, só para os ocupantes; lembrete (descanso confortável) |
| Tabernáculo | Oratório | rolagem (desmarcado): −1 PM em magias |
| Tablado | — | rolagem: +1 em Atuação |
| Vergel | — | rolagem: +1 em Sobrevivência |

### Escolhas por residente

Vários cômodos pedem que **cada residente** escolha algo, trocável no início de
cada aventura: a arma do Pátio de Treinamento e da Forjaria, o Ofício da
Oficina, a magia do Laboratório Arcano e do Tabernáculo. O módulo não guarda
essas escolhas: oferece o bônus **desmarcado** em todas as rolagens do tipo
certo, e o jogador marca quando for a arma, o Ofício ou a magia escolhida. É o
mesmo mecanismo que o sistema usa para os bônus condicionais, e deixa a escolha
visível no momento em que importa.

### A suíte

A suíte é o único cômodo que pode ser construído **várias vezes**, e só
beneficia **até dois residentes** — os que dormem nela. Na ficha, cada suíte tem
seus ocupantes; sem ocupantes, ela não beneficia ninguém. As mobílias de uma
suíte (banheira, colchão, espelho, lareira) seguem os mesmos ocupantes.

## Mobílias

*Heróis de Arton, p. 250–251, Tabela 3-8.* Mobílias são **itens comuns** —
compradas, fabricadas (como equipamento de aventura) ou achadas como tesouro — e
cada **cômodo comporta uma**; a **sala de estar**, até **três diferentes**. Os
efeitos da mobília se somam aos do cômodo. Mobílias podem mudar de cômodo entre
aventuras, mas cada uma afeta um único cômodo por aventura.

No módulo, uma mobília é um Item "mobília" do sistema com a flag do cômodo que a
recebe. Muitas mudam de efeito conforme o cômodo, então **mover a mobília
remonta os efeitos** do Item. Guardada, sem cômodo, ela não dá nada. Uma mobília
fabricada ou achada como tesouro entra pelo botão "Adicionar" do mestre, sem
custo.

| Mobília | Preço | Onde | O módulo faz |
| --- | --- | --- | --- |
| Armadura Decorativa | T$ 2.000 | qualquer cômodo | ficha: +1 Defesa |
| Armário de Remédios | T$ 2.000 | Enfermaria, Estufa | lembrete |
| Banheira | T$ 300 | Suíte | lembrete |
| Bar | T$ 1.000 | qualquer cômodo | ficha: +1 PM |
| Baú Reforçado | T$ 300 | Despensa | ficha: +1 espaço de carga (total +3 com a despensa) |
| Bigorna | T$ 500 | Oficina de Trabalho, Forjaria | oficina: rolagem (desmarcado) +2 em Ofício (total +3); forjaria: rolagem (desmarcado) +1 no dano (total +2) |
| Colchão de Penas Exóticas | T$ 500 | Suíte | ficha: +3 PV para os ocupantes |
| Colmeia de Pergaminhos | T$ 2.500 | Biblioteca, Gabinete Místico | lembrete (magia arcana) |
| Criatura Empalhada | T$ 1.000 | qualquer cômodo | rolagem (desmarcado): + patamar da criatura no dano |
| Engenho Automatizado | T$ 3.000 | Oficina de Trabalho | lembrete |
| Espelho de Corpo | T$ 2.000 | Chapelaria, Suíte | chapelaria: ficha +1 item vestido; suíte: rolagem +1 nas perícias de Carisma |
| Gárgula Animada | T$ 10.000 | lado de fora | segurança +2; lembrete (parceiro); uma por porte acima de básico |
| Ídolo Dourado | T$ 1.200 | qualquer cômodo | rolagem: +1 numa perícia que o cômodo já melhora |
| Lareira | T$ 2.500 | Sala de Estar, Cozinha, Suíte | ficha: redução de fogo 2; lembrete (+1 na CD de fogo) |
| Lustre de Cristal | T$ 2.500 | Sala de Estar, Salão de Baile | lembrete |
| Mapa-Múndi | T$ 1.500 | Sala de Guerra, Sala de Mapas | +1 nos bônus do cômodo, do mesmo jeito que o cômodo |
| Mesa de Reuniões | T$ 2.000 | Sala de Guerra, Sala de Estar | lembrete |
| Obra de Arte | T$ 2.000 | qualquer cômodo | lembrete |
| Planetário | T$ 1.500 | Observatório | lembrete |
| Prataria | T$ 2.000 | Cozinha | lembrete |
| Prateleiras Reforçadas | T$ 2.000 | Biblioteca | lembrete (perícia treinada) |
| Quadro de Diagramas | T$ 3.000 | Oficina de Trabalho | lembrete |
| Relíquia Abençoada | T$ 2.500 | Oratório, Sala de Estar | oratório: lembrete (magia divina); sala de estar: rolagem +1 nas resistências |
| Retratos | T$ 1.750 | qualquer cômodo | rolagem (desmarcado): +5 para ajudar |
| Roleta Ahleniense | T$ 2.000 | Sala de Jogos | lembrete |

O quadro "Tesouro ou Mobília?" (p. 251) permite que tesouros sirvam de mobília,
com benefícios decididos pelo mestre. No módulo, isso é uma mobília da casa:
crie um Item "mobília" no sistema, com os efeitos que a mesa decidir, arraste
para a base e instale num cômodo.

## Como os benefícios chegam às fichas

A regra de ouro, a mesma do módulo irmão de negócios: **a base não é um bônus
permanente**. Um personagem com acesso a uma biblioteca não tem +1 em
Conhecimento; tem acesso a uma biblioteca. Por isso:

- Bônus que valem sempre — PV, PM, Defesa, carga, deslocamento, itens vestidos,
  redução de dano — viram Active Effects comuns na ficha.
- Bônus de perícia, de ataque, de dano e de custo de magia aparecem **no diálogo
  de rolagem**, com o nome da base, e o jogador desmarca quando não se aplicam.
  Isso depende de a rolagem sair pela ficha; um `/r` no chat não enxerga esses
  efeitos.
- O resto — proficiências, magias, parceiros, usos por aventura, efeitos
  narrativos — vira lembrete na aba Residentes.

A sincronização copia para cada residente os efeitos dos Itens da base que são
dos residentes (`transfer: false`, a mesma convenção do sistema), mais os do
tipo. Um efeito por fonte, com o nome da base na frente, para o jogador ver de
onde cada bônus vem e poder desligar um sem perder os outros. Desligar à mão é
respeitado nas sincronizações seguintes.

Ela roda sozinha quando algo muda na base — residentes, tipo, cômodos,
mobílias, efeitos dentro dos Itens — pelo cliente que fez a mudança. Fichas que
esse cliente não controla são atualizadas pelo mestre conectado, por socket.

> **Não use também o botão "Adicionar Efeitos aos Residentes" da ficha do
> sistema.** Ele copia os mesmos efeitos por conta própria, e os bônus sairiam em
> dobro.

## Benefícios de estruturas

*Heróis de Arton, p. 245.* Os benefícios do tipo, dos cômodos e das mobílias
**se acumulam entre si**, mas contam como **benefícios de estruturas** e não se
acumulam com os de outras estruturas — dádivas, domínios e negócios.

O módulo avisa na aba Residentes, mas não tem como verificar o acúmulo com
estruturas que ele não controla: quem decide é a mesa. Na prática, um Salão de
Baile na base e outro num negócio não somam +2 em Nobreza.

## Outras regras do livro que tocam em bases

- **Ermitão, sítio sagrado** (variante de druida, p. 30): o sítio sagrado conta
  como uma base básica e paga **metade do custo** para ampliar o porte e
  construir cômodos. A Visão geral tem a caixa "Sítio sagrado do ermitão", que
  corta esses custos (e o do reparo, que é metade do custo do cômodo).
- **Senescal** (poder de nobre, p. 76): +1 por patamar nos testes para resolver
  ações de base e uma ação de estrutura adicional. É um poder da ficha do
  personagem; o módulo não o aplica.
- **Roupão Elegante** (vestuário, p. 233): +5 em Diplomacia dentro de uma das
  suas estruturas. É um item do personagem; o módulo não o aplica.
- **Objetivo Heroico "Obra"** (p. 293): a conclusão pode render uma base, a
  critério do mestre — use "Recebida".

## Leituras do texto

Pontos em que o texto deixa margem, e como o módulo leu. Todos são fáceis de
mudar se a mesa ler diferente.

| Ponto | Leitura do módulo |
| --- | --- |
| "CD 20 + seu número de cômodos" na reforma | O número de cômodos que a base **pode ter** (a capacidade), como na construção de cômodos. |
| Quarto do Capitão exige "sala da guarda" | É a **Casa da Guarda**. |
| Tipo Móvel cita a "cúpula protetora" | É o **Domo Protetor**. |
| Sauna: a tabela diz "previne condições de cansaço" | Vale o texto completo: rolar dois dados num teste de resistência, uma vez por aventura. |
| Casa da Guarda: "base formidável" como pré-requisito | Formidável **ou melhor**, como os demais. |
| Bar: "pode ser instalado em diversos cômodos, como…" | Qualquer cômodo. |
| Retratos: "em um cômodo qualquer de uso comum" | Qualquer cômodo. |
| Mobílias num cômodo danificado | Param junto com ele. |
| Reparo com sítio sagrado | Metade do custo pago pelo cômodo, portanto T$ 250. |

## O que fica com a mesa

- Quem conta como residente, e quando alguém deixa de ser.
- A escolha de cada residente nos cômodos "à escolha" (arma, Ofício, magia).
- O acúmulo com outras estruturas.
- Usos por aventura (observatório, sauna, obra de arte, roleta…).
- Parceiros: o pelotão da casa da guarda, o capitão, a gárgula.
- O dinheiro: o módulo **mostra** custos e rendimentos nos cards do chat, e a
  mesa desconta ou credita na ficha de quem pagou. A aba Registro é só o log do
  que aconteceu com a base, sem valores.
- Tudo que é narrativo: onde fica a base, quem a vendeu, o que é preciso para
  mantê-la em segredo.

---

*Tormenta20* e *Tormenta20 - Heróis de Arton* são da
[Jambô Editora](https://jamboeditora.com.br). Este documento resume regras para
explicar um módulo de fã, não oficial e sem vínculo com a editora. Para as
regras completas, [adquira o livro](https://jamboeditora.com.br/produto/tormenta20-herois-de-arton/).
