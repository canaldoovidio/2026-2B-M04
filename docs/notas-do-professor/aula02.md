# Notas do professor: Aula 02, 20/10/2026

Material interno de condução da aula. Perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- Recolher a previsão da constante de tempo na entrada. Pela reescrita 5C, quem não entregou não
  recebe o kit, e previsão entregue depois da medição vale zero no item Contextualizar.
- Os valores nominais de R e C são os do card do encontro. O deck e o material usam 10 kΩ e
  100 µF apenas como exemplo declarado.
- A Adalove não tem barema para esta ponderada (pendência P5); o deck usa o barema da reescrita 5C,
  que soma 10 pontos. Confirmar com o professor responsável antes de aplicar.
- Organizar o rodízio da bancada: enquanto uma dupla mede o RC, as outras fazem o laboratório do
  lacre no Wokwi.
- A pergunta de transferência do fim da ponderada é item de comprovação idêntico entre turma-piloto
  e turma de controle (P8). Usar exatamente a versão definida para o experimento.

## Perguntas socráticas

### 1. Bloco 1: por que ler mais rápido não resolve o bounce?

"Se o Arduino lesse o botão mais devagar, o problema sumiria?"

**Resposta esperada:** ler mais devagar reduz a chance de cair numa quicada, sem eliminá-la, e cria
outro problema: apertos curtos podem passar despercebidos. O tratamento certo espera o sinal ficar
estável por um tempo definido.

**Erro comum:** atribuir o bounce ao código. Ele acontece no contato mecânico, antes de qualquer
leitura, e o código escolhe como tratá-lo.

### 2. Bloco 2: qual erro do lacre custa mais para a Cerradinho?

"Um alarme falso e uma violação sem alarme custam a mesma coisa?"

**Resposta esperada:** depende de quem paga cada erro. O alarme falso consome tempo da Gestão
Patrimonial com uma cobrança indevida ao fornecedor; a violação perdida deixa o equipamento
exposto sem registro. O grupo precisa escolher e registrar a prioridade na regra de negócio.

**Erro comum:** responder "os dois são ruins" e seguir. A pergunta pede uma escolha com
justificativa, que vira critério mensurável na Matriz de Rastreabilidade.

### 3. Bloco 3: de onde sai o número 63%?

"De onde sai o número 63% na constante de tempo?"

**Resposta esperada:** em t = τ, a fração carregada é 1 − e<sup>−1</sup> ≈ 0,632. O número sai da própria exponencial da carga.

**Erro comum:** tratar τ como o tempo até a carga completa. A carga é assintótica; na prática
considera-se completa depois de cerca de 5τ, quando passa de 99%.

### 4. Bloco 3: o que acontece com τ se o capacitor dobrar?

"Com o resistor fixo, o que muda na curva se o capacitor tiver o dobro da capacitância?"

**Resposta esperada:** τ dobra, e a curva inteira se estica no tempo; a tensão final continua a da
fonte. A animação carga-rc mostra isso movendo só o controle de C.

**Erro comum:** achar que um capacitor maior carrega até uma tensão maior. A tensão final continua
igual à da fonte, e o tempo para chegar a ela dobra.

### 5. Bloco 5: por que a constante de tempo medida difere da calculada?

"A diferença entre o τ teórico e o medido é só erro de leitura?"

**Resposta esperada:** há causas físicas com mecanismo próprio: tolerância do capacitor (±20% em
eletrolíticos comuns), tolerância do resistor, resistência de entrada do instrumento em paralelo
com o capacitor e fuga do dielétrico. Cada uma tem um teste que a confirma.

**Erro comum:** escrever "erro de medição" sem mecanismo. Pelo barema da reescrita 5C, essa resposta recebe metade.

### 6. Bloco 5: como tirar τ dos dados sem copiar a teoria?

"Você tem a tabela de tensão no tempo. Como encontra τ só com ela?"

**Resposta esperada:** pelo instante em que a tensão cruza 0,632 × Vs, interpolando entre os pontos
vizinhos, ou pela reta de ln(1 − Vc/Vs) contra o tempo, cuja inclinação é −1/τ.

**Erro comum:** escrever o τ calculado como se fosse experimental. O barema exige que ele seja
extraído dos dados.

### 7. Bloco 6: a IA acertou a dedução da equação de carga?

"A resposta da IA sobre Vc(t) está certa? Como você sabe?"

**Resposta esperada:** confrontando a equação com os pontos medidos na bancada: se a curva teórica
com os valores do card passa perto dos pontos, a resposta se confirma; se a forma da curva diverge,
a resposta precisa de ajuste. A evidência é o gráfico sobreposto.

**Erro comum:** aceitar a dedução porque ela parece matematicamente elegante. A etapa Confrontar
pede uma fonte primária, que aqui é a medição.

### 8. Laboratório: por que não usar delay() para o debounce?

"Esperar 20 ms com delay() depois de detectar o aperto não resolve?"

**Resposta esperada:** resolve o bounce, com o custo de travar o programa: durante a espera o
rastreador não pisca o LED de status nem atende outra entrada. O millis() mede o tempo sem parar o
loop.

**Erro comum:** achar que 20 ms é pouco demais para importar. O rastreador vai somar tarefas nas
próximas aulas, e cada delay() se acumula.

## Fechamento

Recolher os relatórios da ponderada ao fim da instrução. Amarração: a ponderada (peso 3) e a regra
de violação do lacre alimentam a Sprint 1, etapa SP2 do DAIA-E; a Sprint Review 1 é em 23/10. A
Aula 03, em 22/10, troca o Uno pelo ESP32.
