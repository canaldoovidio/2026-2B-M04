# Notas do professor: Aula 12, 17/12/2026

Material interno de condução da aula. Perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- A Semana 10 não tem autoestudo na Adalove. A preparação é a seção 1 do material de apoio: a linha
  do tempo, o checklist do MVP e a autoverificação. Pedir a cada grupo a contagem do checklist na
  daily.
- O card do encontro descreve "acompanhamento geral do professor com os grupos, para ajustes finais
  no funcionamento do sistema IoT e sua documentação". Os blocos 4 a 6 acontecem com o professor
  circulando entre os grupos.
- Os Critérios de qualidade GITHUB (peso 2) estão no card da entrega na Adalove e não estão
  versionados no acervo. Ter o card aberto para mostrar aos grupos; não improvisar critérios.
- Conferir com antecedência se o gateway público do Wokwi alcança o `broker.hivemq.com` na rede da
  sala (P7). Se não alcançar, o roteiro roda com a chave de conexão desligada e os eventos ficam na
  fila: o passo 6 continua demonstrável.
- O TAPI tem seção de conteúdo restrito. Nada do texto integral vai para o projetor além dos
  resumos do deck.

## Perguntas socráticas

### 1. Bloco 1: o que transforma uma frase em desempenho medido?

"A frase 'em 10 violações provocadas no Wokwi, as 10 chegaram ao broker' é medida. O que ela tem
que 'a bateria dura 150 dias' não tem?"

**Resposta esperada:** ela diz onde o teste aconteceu, como foi provocado e quantas vezes. Quem lê
consegue repetir o teste e conferir. A frase da bateria é um cálculo sobre premissas que ninguém
observou por 150 dias.

**Erro comum:** achar que um número com casa decimal é medido. Casas decimais não dizem de onde o
número veio, e uma estimativa com três casas decimais continua sendo estimativa.

### 2. Bloco 2: por que declarar um requisito não atendido?

"Se o grupo não fez o teste de exposição à água, não seria melhor simplesmente não mencionar?"

**Resposta esperada:** o item está no MVP do TAPI e o responsável da Cerradinho vai procurá-lo. Quando
o grupo declara o motivo, o que fez no lugar e o que falta, o requisito vira plano de evolução e a
banca não precisa perguntar por ele. O TAPI pede limitações explícitas no relatório técnico.

**Erro comum:** declarar a limitação como desculpa ("faltou tempo") sem dizer o que falta para
atender. A quarta pergunta da limitação declarada é a que dá valor a ela.

### 3. Bloco 3: qual camada costuma ficar mais frágil?

"Na linha do tempo, que camada do seu rastreador você não mostraria de jeito nenhum amanhã? Por
quê?"

**Resposta esperada:** a que depende de algo que o grupo não controla na sala: a rede (Aulas 06 e
08), o envio posterior sem conexão (Aula 04, que muitos grupos não integraram) ou a segurança com
TLS (Aula 11). A resposta boa liga a fragilidade a um teste que falhou ou que não foi feito.

**Erro comum:** escolher a camada mais recente só porque é a mais recente. A pergunta pede
evidência de fragilidade, como um teste que falhou.

### 4. Bloco 4: o que o tempo do passo 7 prova?

"O alerta de permanência sai 30 s depois da saída na demonstração. Isso prova que o rastreador
alerta no dia 150 em campo?"

**Resposta esperada:** prova que a lógica do limiar dispara no dia simulado 150 (150 × 200 ms =
30 s), que é o teste com datas simuladas que o MVP pede. Não prova que o relógio do dispositivo
fica certo por 150 dias reais nem que haverá conexão naquele dia.

**Erro comum:** confundir o relógio acelerado com o tempo real e dizer que "o alerta leva 30 s".
O número 30 s é configuração da demonstração.

### 5. Bloco 4: o que acontece com 20 eventos sem conexão?

"Com a chave de conexão desligada, o lacre é rompido 20 vezes. Quantos eventos chegam ao broker
quando a conexão volta?"

**Resposta esperada:** 16, a capacidade da fila. Os 4 mais antigos são descartados e contados em
"perdidos com a fila cheia" no resumo. As leituras semanais também ocupam a fila, então na prática
chegam menos violações. O número de perdidos é dado medido do teste e entra no relatório.

**Erro comum:** responder 20, como se a memória do dispositivo fosse infinita. É a mesma discussão
do buffer circular da Aula 04.

### 6. Bloco 5: quando rejeitar uma sugestão da IA no manual?

"O Gemini sugeriu incluir no manual 'aperte o botão de reset por 5 s para reconfigurar o Wi-Fi'.
O grupo aceita?"

**Resposta esperada:** só se o firmware do grupo tiver essa função. A IA não viu o firmware nem a
bancada, e propõe procedimentos plausíveis que não existem. A sugestão é conferida contra o
rastreador real; se não existir, vira rejeitada no ADR, com a evidência.

**Erro comum:** aceitar sugestões de forma e de conteúdo no mesmo pacote. Uma sugestão de redação pode ser
aceita mesmo quando a sugestão de procedimento da mesma resposta é rejeitada.

### 7. Bloco 6: quem trata o alerta?

"O responsável da Cerradinho pergunta: 'o alerta chegou; e agora, quem faz o quê?'. O que o grupo
responde?"

**Resposta esperada:** o TAPI pede que a recomendação de escala contemple as responsabilidades pelo
tratamento dos alertas. O grupo nomeia o papel (por exemplo, a Gestão Patrimonial ou o responsável
cadastrado no ciclo), o prazo de resposta proposto e onde o alerta tratado fica registrado.

**Erro comum:** responder só com a parte técnica ("o alerta aparece no dashboard"). A pergunta é de
processo, e a redução de prazo que a Cerradinho espera depende de alguém tratar o alerta.

## Fechamento

- Quiz: autonomia como estimativa e o alcance de uma medição feita no simulador.
- Amarração: Protótipo final do projeto (peso 3), Código do projeto (versão final) (peso 1),
  Arquitetura refinada da solução (peso 1), Manual de instruções revisado (peso 1) e Critérios de
  qualidade GITHUB (peso 2), etapa SP5 do DAIA-E. Apresentação Final amanhã, 18/12.
