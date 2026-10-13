# Notas do professor: Aula 05, 05/11/2026

Material interno de condução da aula. Perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- Os vídeos de sensores analógicos da Semana 04 usam o Arduino Uno (10 bits, 5 V). A turma chega com
  as contas do Uno; a Preparação do material refaz tudo no ESP32. Quem não leu a nota vai responder
  4,88 mV na Peer Instruction.
- O autoestudo "Sensores analógicos - I - Leitura. Parte 1." é um PDF que não abriu na validação de
  13/10/2026 (P9). Não citar conteúdo dele em sala.
- A faixa calibrada do ADC (150 a 2450 mV, erro de até 60 mV) é da Tabela 4-4 do datasheet do ESP32
  v5.3. A documentação do Arduino-ESP32 dá 150 a 3100 mV como faixa medida em 11 dB. As duas fontes
  aparecem no material; se a sala perguntar qual vale, a de 2450 mV é a que tem erro garantido.
- O Wokwi não faz simulação analógica completa (documentação do potenciômetro). O potenciômetro do
  laboratório é o ponto médio do divisor, e o divisor de verdade só aparece na bancada.
- A Sprint Review 2 é no dia seguinte, 06/11. Os dois requisitos não funcionais precisam sair do
  encontro escritos com número, unidade e método de medição.

## Perguntas socráticas

### 1. Bloco 1: por que 4096 níveis e não 4095?

"Se a maior leitura do ESP32 é 4095, por que a conta divide por 4096?"

**Resposta esperada:** 12 bits representam 2<sup>12</sup> = 4096 valores, de 0 a 4095. Dividir 3,3 V
por 4096 é a convenção de conta da aula. A ESP-IDF v4.4 escreve Vout = Dout × Vmax / Dmax com
Dmax = 4095 e um Vmax que depende da atenuação, sem dar um Vmax numérico para 11 dB. As duas
contas diferem em menos de um degrau; o importante é declarar a convenção e usar a mesma no código
e na previsão, sabendo que o bruto real não segue a escala de 3,3 V.

**Erro comum:** tratar a diferença entre 4095 e 4096 como o ponto central da aula. Ela é menor que
o erro de 60 mV do datasheet, que é 74 degraus.

### 2. Bloco 1: resolução fina quer dizer leitura exata?

"O ESP32 distingue 0,81 mV. Então a bateria é medida com erro menor que 1 mV?"

**Resposta esperada:** não. O degrau é a resolução; a exatidão vem do datasheet, até ±60 mV no pino
entre 150 e 2450 mV, depois da calibração. A régua tem marcas finas e pode estar impressa torta.

**Erro comum:** escrever no requisito a resolução como se fosse exatidão ("a bateria é medida com
0,8 mV de precisão").

### 3. Bloco 2: o que torna um requisito não funcional mensurável?

"'A bateria deve ser exibida com precisão' é um requisito não funcional?"

**Resposta esperada:** ainda não. Falta número, unidade, faixa e método: "a tensão exibida difere da
medida no multímetro em no máximo 0,2 V entre 2,5 e 4,2 V, em cinco pontos de bancada". Na ISO/IEC
25010, isso é correção funcional, dentro de adequação funcional.

**Erro comum:** escrever o requisito com adjetivo ("rápido", "preciso", "confiável") e deixar a
medição para depois da Sprint Review.

### 4. Bloco 3: por que não ligar a bateria direto no pino?

"A bateria tem 4,2 V e o ESP32 lê até 3,3 V. O que acontece se eu ligar direto?"

**Resposta esperada:** 4,2 V passa do máximo de entrada do pino, VIH máximo = VDD + 0,3 V = 3,6 V
(Tabela 5-3),
e da faixa que o ADC mede. O divisor 1:1 leva 4,2 V para 2,10 V, dentro da faixa calibrada.

**Erro comum:** achar que a leitura apenas satura em 4095 sem dano. Acima de 3,6 V o pino está fora
da especificação do chip.

### 5. Bloco 3: por que 100 kΩ e não 10 kΩ?

"Os dois pares, 10 kΩ + 10 kΩ e 100 kΩ + 100 kΩ, dão a mesma tensão no pino. Qual escolher?"

**Resposta esperada:** os dois pares têm a mesma razão, e a corrente difere em 10 vezes: 4,2 V / 20 kΩ = 210 µA contra
4,2 V / 200 kΩ = 21 µA, tirados da bateria o tempo todo. Resistores maiores economizam bateria e
deixam o pino mais sensível a ruído, o que pede o capacitor de 100 nF na bancada.

**Erro comum:** escolher pelo valor que a IA sugeriu sem calcular a corrente. É exatamente o item da
corrente no Confronto do Bloco 5.

### 6. Bloco 5: a sugestão da IA passa no datasheet?

"O divisor que o Gemini sugeriu leva 4,2 V para 3,0 V no pino. Está certo?"

**Resposta esperada:** 3,0 V fica abaixo dos 3,6 V do VIH máximo do pino (Tabela 5-3) e acima da faixa calibrada de 2450 mV:
a leitura existe, com erro maior que os 60 mV garantidos. A sugestão é ajustada, com a Tabela 4-4
como evidência, e vira o ADR do aluno.

**Erro comum:** aceitar a sugestão porque "3,0 é menor que 3,3". A comparação certa é com a faixa
calibrada, que termina em 2450 mV.

### 7. Bloco 6: o eixo Z lê zero quando o equipamento tomba?

"Com o equipamento tombado de lado, o que lê o eixo Z?"

**Resposta esperada:** zero. Parado, o acelerômetro mede só a gravidade, no eixo que aponta para
cima. Tombado, esse eixo é outro (X, no laboratório), e o desvio da posição de instalação vai a
√2 = 1,41 g.

**Erro comum:** achar que o acelerômetro só mede movimento e que, parado, todos os eixos leem zero.

### 8. Bloco 6: por que esperar 3 amostras?

"Por que não gerar o evento na primeira amostra acima do limiar?"

**Resposta esperada:** um solavanco isolado no transporte passa do limiar por uma amostra e volta.
Três amostras seguidas filtram isso, ao custo de até 3 × 500 ms = 1,5 s de amostragem; o RNF-02
pede o evento em até 2 s, deixando 0,5 s de margem para o I2C e o laço.

**Erro comum:** tratar o atraso como defeito. Ele é o preço declarado do filtro, e o requisito
precisa dizer quanto atraso a Cerradinho aceita.

## Fechamento

Amarração: os dois requisitos não funcionais alimentam a entrega Requisitos Não Funcionais (peso 2) e
a bateria e o acelerômetro entram no Protótipo físico do projeto (offline) (peso 4), Sprint 2, etapa
SP2 do DAIA-E. A decisão humana da etapa é o grupo fixar 0,2 V, 15° e 2 s, ou outros valores, com
justificativa. Sprint Review 2 amanhã, 06/11. A Aula 06, em 13/11, publica o evento por Wi-Fi e MQTT,
e o GPIO34 continua lendo a bateria porque é do ADC1.
