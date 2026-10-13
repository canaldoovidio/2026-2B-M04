# Planejamento Aula a Aula: Módulo 04 IN, Computação

Roteiro dos 12 Encontros de Instrução do Prof. Ovidio na turma GRAD IN04 2026-2B-T24. Datas,
títulos, autoestudos e pesos descem do `PLANO_DE_ENSINO.md` e de `docs/autoestudos-por-semana.md`;
nada aqui é inventado. Pendências citadas como P1 a P9 estão na seção 7 do plano.

## Como ler

Cada aula tem três tempos (ADR-004):

- **Antes do encontro**: os autoestudos da Adalove que a aula pressupõe, com título exato, as
  animações da seção Preparação do material de apoio e uma autoverificação de cinco perguntas sem
  nota.
- **Durante**: daily de 15 minutos e 105 minutos de metodologia ativa em sete blocos de até 15
  minutos. Todo bloco fecha numa interação nomeada (Peer Instruction, prever e observar, pensar e
  compartilhar, dupla no Wokwi, confronto com a IA, quiz ou pergunta disparada) antes de abrir o
  seguinte.
- **Depois do encontro**: desafio do laboratório, avanço do artefato da sprint e registro do uso
  de IA em `PROCESSO.md` e ADR (ADR-008).

"Confronto com a IA" é a etapa Confrontar do 5C feita ao vivo: a IA propõe um valor ou uma
explicação, a turma registra a proposta e confere contra datasheet, cálculo ou medição no simulador.
Toda aula tem ao menos um.

"Etapa DAIA-E" indica a etapa do framework de Afonso Brandão que a sprint percorre (ADR-007).

---

### Aula 01 - 15/10/2026 - Programação em Arduino e Eletrônica Básica

Semana: 01
Sprint: 1
Etapa DAIA-E: SP1 (Negócio), com a primeira decisão humana do módulo: o que o rastreador da
Cerradinho precisa comunicar e para quem.
Entrega que alimenta: Protótipo inicial do projeto usando o simulador wokwi (peso 1) e o contrato de
uso de IA do Tutorial LED interno (P1).
O que a aula anterior deixou pronto: não há aula anterior; o Onboarding e Sprint Planning 1 de
14/10 apresentou o TAPI da Cerradinho e formou os grupos.
O que esta aula deixa pronto: o LED de status do rastreador piscando no Wokwi com resistor
dimensionado pela lei de Ohm, e o primeiro `PROCESSO.md` do aluno.
Camada do rastreador: LED de status indicando que o dispositivo está vivo.
Trilha de IA: Fundamentos. A IA analisa a foto de uma montagem e erra ou acerta; a turma mede
quanto da resposta se sustenta no datasheet.

Antes do encontro
  Autoestudo: Comece por aqui: Tutorial - LED interno (Tinkercad + Arduino IDE + GitHub)
  Autoestudo: Pode colocar resistor no negativo do LED?
  Autoestudo: Como usar a Protoboard
  Autoestudo: Fundamentos de Linguagem C/C++ (parte I)
  Autoestudo: Simulador Tinkercad
  Animação: circuito-led (corrente no LED em função do resistor, de 0 a 1000 Ω)
  Animação: protoboard (quais furos estão ligados por dentro e o erro de pôr as duas pernas do
    LED na mesma coluna)
  Animação: setup-loop (o `setup` roda uma vez e o `loop` repete, com o LED sincronizado ao
    `digitalWrite`)
  Autoverificação: cinco perguntas sobre resistor, protoboard, `setup`, `loop` e nível lógico.
  Nota de Preparação: o tutorial usa o LED interno no pino 13 do Arduino Uno; o laboratório usa um
  LED externo no pino 8 com resistor. A Preparação explica por que o LED interno dispensa resistor
  externo e o externo não.

Daily da equipe
  O que fiz, o que vou fazer, impedimentos. Primeira daily do módulo: conferir em cada grupo quem
  abriu o Wokwi e o Tinkercad e quem já tem conta no GitHub.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Abertura com Peer Instruction sobre o autoestudo "Pode colocar resistor no negativo do LED?".
    Pergunta de múltipla escolha: o que acontece com a corrente quando o resistor muda do lado
    positivo para o negativo do LED? Votação individual, discussão em dupla, segunda votação. O
    professor registra a proporção de acertos nas duas rodadas como medida do preparo.

  Bloco 2 (15 a 30 min)
    O case. A Cerradinho envia equipamentos para manutenção externa e não sabe onde eles estão.
    Apresentação do rastreador que o módulo vai construir em 12 camadas, e da camada de hoje: o LED
    que diz "estou vivo". Pergunta disparada: que informação mínima o responsável pelo equipamento
    precisa ver no próprio dispositivo, sem abrir sistema nenhum? Respostas no quadro, ligadas à
    etapa SP1 do DAIA-E.

  Bloco 3 (30 a 45 min)
    Lei de Ohm pela analogia da vazão: tensão é a pressão, corrente é a vazão, resistor é o
    estreitamento do cano. Antes de mexer no controle da animação circuito-led, cada aluno precisa
    prever e escrever: o que acontece com 0 Ω? Depois a turma observa os elétrons acelerarem e o alerta de
    20 mA acender, e explica o que viu. Cálculo no quadro: (5 V − 2 V) ÷ 220 Ω ≈ 13,6 mA.

  Bloco 4 (45 a 60 min)
    Protoboard e `setup`/`loop` com as animações protoboard e setup-loop. Pergunta disparada a cada
    passo da protoboard: este LED acende? Em seguida a turma prevê quantas vezes cada linha do
    sketch executa em 10 segundos, e a animação setup-loop confirma.

  Bloco 5 (60 a 75 min)
    Prática em dupla no Wokwi, com condutor e navegador: abrir o laboratório da Aula 01, colar o
    `diagram.json` e o `sketch.ino`, rodar e cronometrar dez ciclos do LED, conferindo o critério de 2 s por ciclo. Cronômetro visível de 12 minutos.

  Bloco 6 (75 a 90 min)
    Confronto com a IA, no formato da "Super Máquina" do workshop 3: o professor envia ao Gemini a
    foto de uma montagem na protoboard com um erro proposital (LED invertido) e pergunta se o
    circuito vai funcionar. A turma registra a resposta, confere no datasheet do LED e na animação
    protoboard, e decide se a afirmação da IA se confirma, precisa de ajuste ou está errada. Esse é
    o modelo da etapa Confrontar do `PROCESSO.md`.

  Bloco 7 (90 a 105 min)
    Quiz de cinco questões e amarração. O contrato de uso de IA do módulo: `PROCESSO.md` com as
    cinco etapas e ADR de sugestão rejeitada (P1). Amarração com a sprint: hoje fecha o primeiro
    pedaço do protótipo inicial no Wokwi (peso 1) da Sprint 1, etapa SP1 do DAIA-E; a Sprint Review
    1 é em 23/10.

Depois do encontro
  Desafio do laboratório: dois pulsos curtos e uma pausa, o padrão de "alerta" do rastreador,
  usando `millis()` em vez de `delay()` para não bloquear a leitura do lacre da Aula 02.
  Registro do processo no `PROCESSO.md` do repositório do grupo, com a resposta sobre o nível
  lógico do LED interno pedida no tutorial.

---

### Aula 02 - 20/10/2026 - Sensores e Atuadores Básicos (Atividade Ponderada em Sala)

Semana: 02
Sprint: 1
Etapa DAIA-E: SP2 (Requisitos), com a decisão humana sobre o critério de violação do lacre.
Entrega que alimenta: Atividade ponderada de Computação 1 (em sala), peso 3, com o enunciado da
reescrita 5C (P5); Requisitos Funcionais, Regras de Negócio e Matriz de Rastreabilidade (peso 2).
O que a aula anterior deixou pronto: o LED de status piscando com resistor dimensionado pela lei de
Ohm.
O que esta aula deixa pronto: o lacre modelado como chave, com violação acionando LED e buzzer, e
a constante de tempo do RC medida contra a prevista.
Camada do rastreador: lacre como chave, com debounce por RC e por firmware.
Trilha de IA: Fundamentos. A IA deduz a equação de carga do capacitor; a turma confere com a
medição.

Antes do encontro
  Autoestudo: Tratando ruídos de botões (implementando debounce no hardware e firmware)
  Autoestudo: Entendendo o circuito RC
  Autoestudo: Circuito RC: Relé Temporizado
  Animação: bounce-botao (o mesmo aperto lido no contato bruto, com filtro RC e com janela de
    debounce no firmware, com contagem de toques).
  Animação: carga-rc (curva de carga com a constante de tempo marcada em 63% e 5τ em 99%).
  Autoverificação: cinco perguntas sobre bounce, constante de tempo e pull-up.
  Nota de Preparação: o autoestudo "Entendendo o circuito RC" trata só de debounce; a Preparação
  cobre a constante de tempo, que a ponderada exige.
  Entrega antes da aula, pela reescrita 5C: constante de tempo teórica e esboço da curva com os
  valores de R e C do card.

Daily da equipe
  O que fiz, o que vou fazer, impedimentos. Conferir que cada aluno trouxe a previsão da constante
  de tempo, sem a qual não recebe o kit.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Peer Instruction sobre debounce: um botão lido a cada 1 ms registra quantos toques num único
    aperto? Votação, discussão em dupla, nova votação.

  Bloco 2 (15 a 30 min)
    O lacre do rastreador como chave que abre quando é rompido. Pergunta disparada: um falso
    alarme de violação custa o quê para a Cerradinho, e um alarme perdido custa o quê? A resposta
    vira a regra de negócio da Matriz de Rastreabilidade.

  Bloco 3 (30 a 45 min)
    Constante de tempo do RC. Antes de rodar a animação de carga, cada aluno precisa prever a tensão em
    t igual a uma constante de tempo; a animação confirma os 63%.

  Bloco 4 (45 a 60 min)
    Ponderada em sala, parte 1: coleta dos pontos de tensão no tempo na bancada, concentrando a
    amostragem no trecho inicial da curva. Quem aguarda a bancada trabalha em dupla no Wokwi no laboratório do lacre com debounce,
    porque o Wokwi simula o bounce do botão e não simula a carga do capacitor.

  Bloco 5 (60 a 75 min)
    Ponderada em sala, parte 2: curva teórica e pontos medidos no mesmo gráfico, e cálculo da
    constante de tempo experimental. Pensar e compartilhar: duas causas físicas para a divergência.

  Bloco 6 (75 a 90 min)
    Confronto com a IA: a dedução da equação de carga que cada aluno pediu ao Gemini é comparada
    com a medição. A turma classifica cada resposta como confirmada, ajustada ou errada.

  Bloco 7 (90 a 105 min)
    Quiz curto e pergunta de transferência da reescrita 5C, respondida na hora e sem consulta,
    idêntica entre turma-piloto e controle (P8). Amarração com a sprint: a ponderada (peso 3) e a regra de
    violação alimentam a matriz de rastreabilidade da Sprint 1, etapa SP2 do DAIA-E; a Sprint
    Review 1 é em 23/10.

Depois do encontro
  Desafio do laboratório: debounce por firmware com `millis()`, sem `delay()`.
  ADR do aluno: uma sugestão de IA sobre o RC que foi rejeitada ou corrigida.

---

### Aula 03 - 22/10/2026 - Programação básica usada em microcontroladores

Semana: 02
Sprint: 1
Etapa DAIA-E: SP2 (Requisitos), com a decisão humana sobre os estados do ciclo e o limiar de
permanência.
Entrega que alimenta: Protótipo inicial do projeto usando o simulador wokwi (peso 1); Requisitos
Funcionais, Regras de Negócio e Matriz de Rastreabilidade (peso 2).
O que a aula anterior deixou pronto: o lacre como chave com debounce.
O que esta aula deixa pronto: a máquina de estados do ciclo do equipamento rodando no ESP32 do
Wokwi, com o limiar de permanência configurável.
Camada do rastreador: ESP32 e máquina de estados do ciclo (cadastrado, em trânsito, no
fornecedor, retornado).
Trilha de IA: Fundamentos. A IA propõe uma máquina de estados; a turma testa transições
impossíveis.

Antes do encontro
  Autoestudo: Fundamentos de Linguagem C/C++ (parte II)
  Autoestudo: Programação OO em C++
  Autoestudo: Simulador Wokwi (ESP32)
  Autoestudo: Fundamentos de controle e automação
  Autoestudo: Desenvolvedor de Sistemas Embarcados
  Autoestudo: Aula Complementar: O que é um Sistema Embarcado? (opcional)
  Autoestudo: Aula Complementar: Tipos de dados e Operações com bits (opcional)
  Autoestudo: Aula Complementar: microcontroladores, interfaces e periféricos (opcional)
  Animação: maquina-estados (máquina de estados do ciclo, com a transição permitida acendendo e
    as proibidas recusadas sem mudar o estado).
  Animação: contador-permanencia (dias fora contra o prazo de cada ciclo e o limiar de 150 dias,
    com os três ciclos fixados do conjunto fictício, de 25/03 a 01/10/2026).
  Autoverificação: cinco perguntas sobre `switch`, `enum` e classes.
  Nota de Preparação: primeira aula em ESP32. A Preparação mostra o que muda do Uno para o ESP32
  (tensão de 3,3 V, pinos, `Serial.begin(115200)` e placa no Wokwi) e avisa que o vídeo
  "Simulador Wokwi (ESP32)" não nomeia o Wokwi no título (P9). No Wokwi, 150 dias não cabem na
  aula: o laboratório usa relógio acelerado, 1 dia simulado a cada 100 ms.

Daily da equipe
  O que fiz, o que vou fazer, impedimentos. Conferir a Sprint Review de amanhã.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Peer Instruction sobre o capítulo de funções do autoestudo de C/C++ (parte II): o que acontece
    com a variável passada por referência em `Estado &proximo`? O `switch` sem `break` volta como
    pergunta disparada no código da máquina de estados.

  Bloco 2 (15 a 30 min)
    Os estados do ciclo no TAPI: necessidade, cadastro, saída, acompanhamento, alertas, retorno e
    liberação do dispositivo. Pergunta disparada: quais transições não podem acontecer?

  Bloco 3 (30 a 45 min)
    Antes de rodar a animação, a turma prevê em que estado cada um dos três ciclos abertos do
    conjunto fictício está em 01/10/2026, e quais passaram do limiar.

  Bloco 4 (45 a 60 min)
    Dupla no Wokwi: máquina de estados com `enum class` no ESP32, com botões simulando os eventos.

  Bloco 5 (60 a 75 min)
    Confronto com a IA: o Gemini gera uma máquina de estados para o ciclo; a turma procura uma
    transição proibida que o código aceita.

  Bloco 6 (75 a 90 min)
    Pensar e compartilhar: atraso frente ao prazo e permanência acima de 150 dias são alertas
    diferentes, como o TAPI pede. Como o código distingue os dois?

  Bloco 7 (90 a 105 min)
    Quiz e amarração: a máquina de estados entra no protótipo inicial no Wokwi (peso 1) e na matriz
    de rastreabilidade (peso 2) da Sprint 1; Sprint Review 1 amanhã, 23/10.

Depois do encontro
  Desafio: limiar configurável pela serial, sem regravar o firmware.

---

### Aula 04 - 30/10/2026 - Arquitetura de Microcontroladores e Ponteiros

Semana: 03
Sprint: 2
Etapa DAIA-E: SP2 (Requisitos), com a decisão humana sobre quantos eventos o dispositivo guarda
sem conexão.
Entrega que alimenta: Protótipo físico do projeto (offline), peso 4.
O que a aula anterior deixou pronto: a máquina de estados do ciclo no ESP32.
O que esta aula deixa pronto: um buffer circular de eventos que guarda o que aconteceu sem conexão
e entrega na ordem certa quando a conexão volta.
Camada do rastreador: memória e ponteiros, armazenamento local e envio posterior.
Trilha de IA: Fundamentos. A IA explica ponteiros; a turma confere no endereço impresso pela
serial.

Antes do encontro
  Autoestudo: Fundamentos de Linguagem C/C++ (parte III)
  Autoestudo: Microcontroladores
  Autoestudo: Microcontroladores - O ESP32 - parte 1
  Animação: memória do ESP32 com um ponteiro percorrendo o buffer circular e dando a volta.
  Autoverificação: cinco perguntas sobre endereço, ponteiro e vetor.
  Nota de Preparação: as partes 1 e 2 de "Programação de microcontroladores - II - Inicialização"
  estão em ordem invertida na Adalove (P9).

Daily da equipe
  O que fiz, o que vou fazer, impedimentos. Retorno da Sprint Review 1.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Peer Instruction: o que `p + 1` aponta quando `p` é um ponteiro para `int` de 4 bytes?

  Bloco 2 (15 a 30 min)
    O TAPI pede "armazenamento de eventos e envio posterior em caso de indisponibilidade de
    conexão". Pergunta disparada: quantos eventos cabem na memória, e o que fazer quando ela enche?

  Bloco 3 (30 a 45 min)
    Antes de rodar a animação do buffer circular, a turma prevê onde o ponteiro de escrita estará
    depois de 10 eventos num buffer de 8 posições.

  Bloco 4 (45 a 60 min)
    Dupla no Wokwi: buffer circular com ponteiros de leitura e escrita, imprimindo endereços.

  Bloco 5 (60 a 75 min)
    Confronto com a IA: a explicação do Gemini sobre aritmética de ponteiros é conferida contra os
    endereços impressos.

  Bloco 6 (75 a 90 min)
    Pensar e compartilhar: descartar o evento mais antigo ou o mais novo quando o buffer enche? A
    escolha vira ADR do grupo.

  Bloco 7 (90 a 105 min)
    Quiz e amarração: o buffer entra no protótipo físico offline (peso 4) da Sprint 2, etapa SP2 do
    DAIA-E; Sprint Review 2 em 06/11. O Semáforo offline da reescrita 5C aguarda definição (P2).

Depois do encontro
  Desafio: contador de eventos perdidos quando o buffer enche.

---

### Aula 05 - 05/11/2026 - Sensores e processamento de valores de entrada analógicos para digital

Semana: 04
Sprint: 2
Etapa DAIA-E: SP2 (Requisitos), com a decisão humana sobre os requisitos não funcionais
mensuráveis do rastreador.
Entrega que alimenta: Requisitos Não Funcionais (peso 2) e Protótipo físico do projeto (offline)
(peso 4).
O que a aula anterior deixou pronto: o buffer circular de eventos sem conexão.
O que esta aula deixa pronto: leitura da tensão da bateria por divisor resistivo e detecção de
remoção do equipamento pelo acelerômetro, com dois requisitos não funcionais medidos.
Camada do rastreador: ADC, bateria e acelerômetro.
Trilha de IA: Fundamentos. A IA sugere a resolução do ADC e o divisor; a turma confere no datasheet
do ESP32.

Antes do encontro
  Autoestudo: Requisitos Não Funcionais
  Autoestudo: Sensores analógicos - I - Leitura. Parte 2.
  Autoestudo: Sensores digitais - II - Acelerômetro. Parte 1.
  Animação: quantização do mesmo sinal em 10 e em 12 bits.
  Animação: divisor de tensão da bateria, com o resistor ajustável.
  Animação: os três eixos do acelerômetro com o equipamento parado, tombado e em transporte.
  Autoverificação: cinco perguntas sobre resolução, referência e divisor.
  Nota de Preparação: os vídeos de sensores analógicos usam Arduino Uno, com ADC de 10 bits e
  referência de 5 V; o ESP32 tem ADC de 12 bits, com conversão nominal em 3,3 V e faixa calibrada
  de 150 a 2450 mV (datasheet do ESP32 v5.3, Tabela 4-4). A Preparação mostra o cálculo nos dois.

Daily da equipe
  O que fiz, o que vou fazer, impedimentos.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Peer Instruction: um ADC de 12 bits em 3,3 V distingue variações de quantos milivolts?

  Bloco 2 (15 a 30 min)
    O TAPI pede bateria visível e autonomia estimada a partir do consumo medido. Pergunta
    disparada: que requisito não funcional mensurável sai dessa frase?

  Bloco 3 (30 a 45 min)
    Antes de mover o resistor na animação do divisor, a turma prevê a leitura do ADC com a bateria
    em 4,2 V e em 3,3 V.

  Bloco 4 (45 a 60 min)
    Dupla no Wokwi: leitura do divisor com `analogRead` e conversão para volts e porcentagem. O
    Wokwi não faz simulação analógica completa: o potenciômetro entrega a tensão do ponto médio do
    divisor, e o firmware desfaz o divisor na conta.

  Bloco 5 (60 a 75 min)
    Confronto com a IA: o divisor sugerido pelo Gemini é conferido contra o limite de tensão do pino
    do ESP32.

  Bloco 6 (75 a 90 min)
    Dupla no Wokwi: acelerômetro MPU6050 com limiar de movimento para detectar remoção.

  Bloco 7 (90 a 105 min)
    Quiz e amarração: dois requisitos não funcionais mensuráveis entram no artefato de Requisitos
    Não Funcionais (peso 2) da Sprint 2, etapa SP2 do DAIA-E; Sprint Review 2 amanhã, 06/11.

Depois do encontro
  Desafio: média móvel para estabilizar a leitura da bateria.

---

### Aula 06 - 13/11/2026 - Comunicação à distância (Início de Atividade Ponderada)

Semana: 05
Sprint: 3
Etapa DAIA-E: SP3 (Especificação técnica), com a decisão humana sobre a tecnologia de comunicação.
Entrega que alimenta: Atividade - Semáforo Inteligente (peso 2), com o enunciado da reescrita 5C
(P4); Protótipo do Projeto com MQTT e I2C (peso 3); Metodologia e Arquitetura da solução (peso 3).
O que a aula anterior deixou pronto: bateria e acelerômetro lidos e convertidos.
O que esta aula deixa pronto: o evento do ciclo publicado em JSON num broker MQTT, e a comparação
entre Wi-Fi, LoRa e LTE-M para o uso real nas oficinas.
Camada do rastreador: Wi-Fi e MQTT.
Trilha de IA: Workflows. Simulação no Wokwi antes de publicar dado; confirmação humana do tópico.

Antes do encontro
  Autoestudo: Protocolo MQTT
  Autoestudo: Publicando dados na Nuvem com ESP32 e MQTT
  Autoestudo: Arquiteturas de Comunicação com ESP32
  Autoestudo: Atividade - Semáforo Inteligente
  Animação: mqtt-pubsub (publicação e assinatura no broker MQTT, com tópicos e os curingas + e #).
  Animação: alcance-tecnologias (perda máxima tolerada por Wi-Fi, LTE-M, LoRaWAN e NB-IoT contra a
    perda no caminho, com autonomia citada; números com fonte no material).
  Autoverificação: cinco perguntas sobre tópico, broker e QoS.
  Nota de Preparação: "Criando um Dashboard de IoT com o HiveMQ" é o cliente MQTT web, não um
  dashboard, e a descrição do card "Introdução à Programação do ESP32" foi copiada do card do
  Mosquitto (P9).

Daily da equipe
  O que fiz, o que vou fazer, impedimentos.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Peer Instruction: quem recebe uma mensagem publicada em `cerradinho/dv01/lacre` quando o
    assinante usa `cerradinho/+/lacre`? O tópico identifica o dispositivo, que é reutilizável.

  Bloco 2 (15 a 30 min)
    O TAPI diz para não pressupor Wi-Fi corporativo nas oficinas. Pergunta disparada: o que o
    rastreador faz numa oficina sem Wi-Fi?

  Bloco 3 (30 a 45 min)
    Antes de rodar a animação de alcance, a turma prevê quantas das quatro tecnologias ainda
    conectam com 100 dB de perda e três paredes de tijolo duplo. A animação compara perda tolerada
    em dB, porque as fontes citáveis dão cobertura em dB e o alcance em km depende do local.

  Bloco 4 (45 a 60 min)
    Dupla no Wokwi: publicar o evento do ciclo em JSON num broker público (P7).

  Bloco 5 (60 a 75 min)
    Confronto com a IA: o Gemini compara Wi-Fi, LoRa e LTE-M; a turma confere os números contra
    datasheets e preenche a matriz de tecnologias do TAPI.

  Bloco 6 (75 a 90 min)
    Início da ponderada Semáforo Inteligente, pela reescrita 5C: calibração do LDR, e cada aluno
    precisa prever o limiar antes da medição.

  Bloco 7 (90 a 105 min)
    Quiz e amarração: MQTT entra no Protótipo do Projeto com MQTT e I2C (peso 3) da Sprint 3, etapa
    SP3 do DAIA-E; Sprint Review 3 em 19/11.

Depois do encontro
  Desafio: reenviar os eventos do buffer da Aula 04 quando a conexão volta.

---

### Aula 07 - 18/11/2026 - Atuadores e saídas informacionais

Semana: 06
Sprint: 3
Etapa DAIA-E: SP3 (Especificação técnica), com a decisão humana sobre o que o dispositivo mostra
localmente.
Entrega que alimenta: Protótipo do Projeto com MQTT e I2C (peso 3).
O que a aula anterior deixou pronto: o evento do ciclo publicado via MQTT.
O que esta aula deixa pronto: display I2C mostrando dias fora, estado do lacre e bateria, e o LED
de status com brilho por PWM.
Camada do rastreador: display I2C e PWM.
Trilha de IA: Fundamentos. A IA sugere o endereço I2C; a turma confere com um scanner I2C.

Antes do encontro
  Autoestudo: Dispositivos de Saída II - I2C. Parte 2
  Autoestudo: Dispositivos de saída - I. Parte 1
  Autoestudo: Dispositivos de saída digital e analógica - II - PWM
  Animação: ciclo de trabalho do PWM e o brilho resultante.
  Animação: endereçamento no barramento I2C com dois dispositivos.
  Autoverificação: cinco perguntas sobre PWM, I2C e endereço.
  Nota de Preparação: os dois vídeos de "Dispositivos de saída digital e analógica - I" tratam de
  entrada (P9); o display do autoestudo usa Arduino.

Daily da equipe
  O que fiz, o que vou fazer, impedimentos.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Peer Instruction: um PWM com ciclo de trabalho de 25% entrega quanto da tensão média?

  Bloco 2 (15 a 30 min)
    O TAPI pede bateria, última comunicação e estado do lacre visíveis. Pergunta disparada: o que
    cabe numa tela de 16 por 2 caracteres?

  Bloco 3 (30 a 45 min)
    Antes de mover o controle da animação de PWM, a turma prevê o brilho percebido a 50%.

  Bloco 4 (45 a 60 min)
    Dupla no Wokwi: display I2C com os dados do ciclo.

  Bloco 5 (60 a 75 min)
    Confronto com a IA: o endereço I2C sugerido pelo Gemini é conferido com um scanner.

  Bloco 6 (75 a 90 min)
    Pensar e compartilhar: o display gasta bateria; quando ele deve acender?

  Bloco 7 (90 a 105 min)
    Quiz e amarração: display e PWM entram no protótipo com MQTT e I2C (peso 3) da Sprint 3, etapa
    SP3 do DAIA-E; Sprint Review 3 em 19/11.

Depois do encontro
  Desafio: o display alterna entre duas telas sem bloquear o loop.

---

### Aula 08 - 27/11/2026 - Transmissão de Sinal e Dashboard (Atividade Ponderada em Sala)

Semana: 07
Sprint: 4
Etapa DAIA-E: SP4 (Implementação), com a decisão humana sobre o intervalo de comunicação.
Entrega que alimenta: Atividade - Mapa de Calor calculando dBm de sinal WiFi (peso 2), com o
enunciado da reescrita 5C; Protótipo físico do projeto (online) (peso 2).
O que a aula anterior deixou pronto: display I2C e PWM.
O que esta aula deixa pronto: RSSI em dBm publicado e acompanhado num dashboard, com a última
comunicação visível.
Camada do rastreador: RSSI, última comunicação e dashboard.
Trilha de IA: Fundamentos. A IA propõe um modelo de propagação; a turma confronta com as medições.

Antes do encontro
  Autoestudo: Intensidade do Sinal WiFi
  Autoestudo: Valores de Potência de RF - Cisco
  Autoestudo: Atividade - Mapa de Calor calculando dBm de sinal WiFi
  Animação: escala-dbm (dBm contra mW em escala logarítmica, com as regras de 3 dB e 10 dB).
  Animação: atenuacao-sinal (queda em dB pela distância no modelo log-distância e por parede
    metálica, com a perda da parede declarada pelo aluno).
  Autoverificação: cinco perguntas sobre dBm, mW e atenuação.
  Nota de Preparação: os vídeos de Ubidots usam ESP8266, e o tutorial de cadastro indicado é da
  Adafruit IO (P7, P9).

Daily da equipe
  O que fiz, o que vou fazer, impedimentos.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Peer Instruction: -60 dBm é quantas vezes mais potência que -90 dBm?

  Bloco 2 (15 a 30 min)
    Equipamentos metálicos e oficinas cobertas, como o TAPI descreve. Pergunta disparada: o que
    acontece com o sinal dentro de um galpão de aço?

  Bloco 3 (30 a 45 min)
    Ponderada em sala, pela reescrita 5C: cada aluno prevê a ordem dos pontos do seu percurso
    por RSSI antes de medir (P6).

  Bloco 4 (45 a 60 min)
    Dupla no Wokwi e na bancada: RSSI impresso na serial e publicado via MQTT, acompanhado no
    painel da aula. O Wokwi não simula variação de sinal (o ponto de acesso virtual não tem
    atributo de intensidade): no simulador a dupla prova o código e o MQTT, e a variação de dBm é
    medida na bancada e no percurso com o ESP32 do kit.

  Bloco 5 (60 a 75 min)
    Confronto com a IA: o modelo de propagação proposto pelo Gemini é comparado com os dados
    medidos no percurso.

  Bloco 6 (75 a 90 min)
    Pergunta disparada de leitura numérica da reescrita 5C, idêntica entre turmas (P8), sobre a
    queda de 3 dB.

  Bloco 7 (90 a 105 min)
    Quiz e amarração: o dashboard entra no protótipo físico online (peso 2) da Sprint 4, etapa SP4
    do DAIA-E; Sprint Review 4 em 04/12.

Depois do encontro
  Desafio: alerta no dashboard quando a última comunicação passa de 8 dias.

---

### Aula 09 - 02/12/2026 - Sistema de disparo de atuadores

Semana: 08
Sprint: 4
Etapa DAIA-E: SP4 (Implementação), com a decisão humana sobre quem pode disparar o atuador.
Entrega que alimenta: Código do projeto (peso 2) e Protótipo físico do projeto (online) (peso 2).
O que a aula anterior deixou pronto: RSSI e dashboard.
O que esta aula deixa pronto: o alerta de permanência ou de violação acionando um atuador remoto
via MQTT, com confirmação humana antes do disparo.
Camada do rastreador: disparo remoto de atuador.
Trilha de IA: Workflows e Ética. Confirmação humana e simulação antes de qualquer ação sobre carga
real.

Antes do encontro
  Autoestudo: Sistema de disparo de atuadores - Exemplo prático
  Autoestudo: Módulos Relé com ESP32
  Autoestudo: Ativação de atuadores via Mosquitto - I
  Animação: relé chaveando uma carga, com a separação entre o circuito de comando e o de potência.
  Animação: caminho do alerta do sensor ao atuador remoto, passando pelo broker.
  Autoverificação: cinco perguntas sobre relé, diodo de proteção e tópico de comando.
  Nota de Preparação: "Ativação de atuadores via Mosquitto - II e III" não usam Mosquitto (P9).

Daily da equipe
  O que fiz, o que vou fazer, impedimentos.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Peer Instruction: por que o relé precisa de diodo em paralelo com a bobina?

  Bloco 2 (15 a 30 min)
    Pergunta disparada: quem na Cerradinho trata um alerta de permanência, e o que pode ser
    disparado automaticamente sem essa pessoa?

  Bloco 3 (30 a 45 min)
    Antes de rodar a animação do caminho do alerta, a turma prevê quantos saltos a mensagem dá até
    o atuador.

  Bloco 4 (45 a 60 min)
    Dupla no Wokwi: relé acionado por mensagem MQTT, com confirmação por um segundo tópico.

  Bloco 5 (60 a 75 min)
    Confronto com a IA: o código de disparo gerado pelo Gemini é revisado procurando disparo sem
    confirmação.

  Bloco 6 (75 a 90 min)
    Pensar e compartilhar: responsabilidade por falha física, segundo a trilha de ética.

  Bloco 7 (90 a 105 min)
    Quiz e amarração: o disparo entra no código do projeto (peso 2) da Sprint 4, etapa SP4 do
    DAIA-E; Sprint Review 4 em 04/12.

Depois do encontro
  Desafio: atuador desarma sozinho se a confirmação não chegar em 30 segundos.

---

### Aula 10 - 03/12/2026 - Integração geral entre entrada, sensores e atuadores e a interface com o usuário

Semana: 08
Sprint: 4
Etapa DAIA-E: SP4 (Implementação), com a decisão humana sobre a autonomia aceitável.
Entrega que alimenta: Código do projeto (peso 2), Arquitetura do protótipo (peso 2) e Manual de
Instruções (peso 2).
O que a aula anterior deixou pronto: disparo remoto com confirmação.
O que esta aula deixa pronto: o ciclo completo do rastreador integrado, com testes e autonomia
estimada a partir do consumo medido em deep sleep.
Camada do rastreador: integração, testes e deep sleep.
Trilha de IA: Workflows. A IA gera testes; a turma decide quais testam algo.

Antes do encontro
  Autoestudo: Testes e Integração em C++ (Parte 1)
  Autoestudo: (extra) Deep Sleep I
  Autoestudo: (extra) Tutorial de uso do Filesystem do ESP32
  Animação: consumo em deep sleep comparado ao modo ativo e a autonomia resultante.
  Autoverificação: cinco perguntas sobre deep sleep, wake-up e teste.
  Nota de Preparação: o tutorial de "Filesystem" ensina Preferences (NVS), não sistema de arquivos
  (P9).

Daily da equipe
  O que fiz, o que vou fazer, impedimentos.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Peer Instruction: um dispositivo que acorda uma vez por semana gasta mais bateria acordado ou
    dormindo?

  Bloco 2 (15 a 30 min)
    O TAPI avisa que "um ensaio curto não comprova operação por 150 dias". Pergunta disparada: como
    estimar autonomia sem esperar 150 dias?

  Bloco 3 (30 a 45 min)
    Antes de mover os controles da animação de consumo, a turma prevê a autonomia com uma leitura
    por semana.

  Bloco 4 (45 a 60 min)
    Dupla no Wokwi: ciclo completo integrado, do cadastro ao retorno.

  Bloco 5 (60 a 75 min)
    Confronto com a IA: testes gerados pelo Gemini são executados; a turma identifica os que passam
    sem testar nada.

  Bloco 6 (75 a 90 min)
    Pensar e compartilhar: o que entra no manual de instruções para quem fixa o dispositivo.

  Bloco 7 (90 a 105 min)
    Quiz e amarração: integração e autonomia entram no código e na arquitetura do protótipo (peso 2
    cada) da Sprint 4, etapa SP4 do DAIA-E; Sprint Review 4 amanhã, 04/12.

Depois do encontro
  Desafio: estimativa de autonomia documentada com as medidas e as premissas.

---

### Aula 11 - 10/12/2026 - Visão Geral sobre Segurança em IoT (Atividade Ponderada em Sala)

Semana: 09
Sprint: 5
Etapa DAIA-E: SP5 (Demonstração e validação), com a decisão humana sobre os riscos aceitos.
Entrega que alimenta: Visão Geral sobre Segurança em IoT (Atividade Ponderada em Sala), peso 2, com
o enunciado da reescrita 5C; Prova do Módulo em 11/12 (peso 20).
O que a aula anterior deixou pronto: o rastreador integrado com autonomia estimada.
O que esta aula deixa pronto: o modelo de ameaça do rastreador, com os riscos ordenados e as
defesas mínimas implementadas.
Camada do rastreador: autenticação, MQTT com TLS e credenciais fora do código.
Trilha de IA: Ética. Localização de equipamento como dado sensível, conforme o TAPI.

Antes do encontro
  Autoestudo: Segurança em IoT (Vídeo)
  Autoestudo: Estudo de Caso de Segurança em IoT (Livro)
  Autoestudo: Uso de Biometria - Métodos de Autenticação (NIST)
  Autoestudo: Implementando Biometria (Texto)
  Autoestudo: Implementando Biometria (Vídeo)
  Animação: superficie-ataque (superfície de ataque do rastreador, do sensor à API, com seis
    pontos de ataque e as defesas que fecham cada um).
  Animação: handshake-tls (handshake TLS simplificado, sem TLS, TLS 1.2 e TLS 1.3, com o que um
    observador da rede lê em cada mensagem).
  Autoverificação: cinco perguntas sobre ameaça, risco e TLS.
  Nota de Preparação: a seção 4.3 do NIST citada no card trata do nível AAL3 e só remete à
  biometria; biometria está na seção 5.2.3. Os dois materiais de Implementando Biometria usam
  Arduino, e o card diz ESP32 (P9).

Daily da equipe
  O que fiz, o que vou fazer, impedimentos. Lembrete da prova de amanhã.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Peer Instruction: uma senha de Wi-Fi gravada no código do firmware fica exposta a quem?

  Bloco 2 (15 a 30 min)
    Ponderada em sala, pela reescrita 5C: modelo de ameaça declarado antes de consultar a IA.
    Pergunta disparada: o que um atacante ganha sabendo onde estão os equipamentos?

  Bloco 3 (30 a 45 min)
    Confronto com a IA: a lista bruta de ataques gerada pelo Gemini, sem edição, é triada com pelo
    menos dois descartes justificados.

  Bloco 4 (45 a 60 min)
    Antes de rodar a animação do handshake, a turma prevê o que um observador da rede vê com e sem
    TLS.

  Bloco 5 (60 a 75 min)
    Dupla no Wokwi: credenciais fora do código e conexão ao broker com usuário e senha.

  Bloco 6 (75 a 90 min)
    Defesa oral da ordem de risco, pela reescrita 5C, em pensar e compartilhar entre grupos.

  Bloco 7 (90 a 105 min)
    Quiz de revisão para a Prova do Módulo e amarração: a ponderada (peso 2) e a prova (peso 20)
    fecham a parte individual; a Sprint 5, etapa SP5 do DAIA-E, termina na Apresentação Final de
    18/12.

Depois do encontro
  Desafio: tópicos MQTT com permissão de leitura e escrita separadas.

---

### Aula 12 - 17/12/2026 - Revisões finais do projeto

Semana: 10
Sprint: 5
Etapa DAIA-E: SP5 (Demonstração e validação), com a decisão humana sobre as limitações declaradas.
Entrega que alimenta: Protótipo final do projeto (peso 3), Código do projeto (versão final) (peso
1), Arquitetura refinada da solução (peso 1), Manual de instruções revisado (peso 1) e Critérios de
qualidade GITHUB (peso 2).
O que a aula anterior deixou pronto: o modelo de ameaça e as defesas mínimas.
O que esta aula deixa pronto: cada grupo com o rastreador revisado contra os entregáveis finais e o
roteiro da demonstração de 18/12.
Camada do rastreador: revisão do rastreador inteiro contra o TAPI.
Trilha de IA: Ética. Distinguir desempenho medido de estimativa, como o TAPI exige na recomendação
de escala.

Antes do encontro
  Animação: linha do tempo do rastreador ao longo das 12 aulas.
  Animação: checklist do MVP do TAPI, com cada item marcado como medido, estimado ou não atendido.
  Autoverificação: cinco perguntas sobre os requisitos do TAPI e o que cada grupo mediu.
  Nota de Preparação: a Semana 10 não tem autoestudo na Adalove; a preparação usa só as animações
  e a autoverificação.

Daily da equipe
  O que fiz, o que vou fazer, impedimentos. Último ajuste antes da apresentação.

Metodologia ativa

  Bloco 1 (0 a 15 min)
    Peer Instruction: qual frase do relatório é medida e qual é estimativa?

  Bloco 2 (15 a 30 min)
    Pergunta disparada: qual requisito do MVP do TAPI o grupo não atendeu, e como declarar isso?

  Bloco 3 (30 a 45 min)
    Antes de rodar a linha do tempo, cada grupo prevê qual camada do rastreador ficou mais frágil.

  Bloco 4 (45 a 60 min)
    Dupla no Wokwi: demonstração do ciclo completo cronometrada.

  Bloco 5 (60 a 75 min)
    Confronto com a IA: o Gemini revisa o manual de instruções; o grupo aceita, ajusta ou rejeita
    cada sugestão e registra no ADR.

  Bloco 6 (75 a 90 min)
    Pensar e compartilhar: o que um responsável da Cerradinho pergunta na demonstração.

  Bloco 7 (90 a 105 min)
    Quiz de fechamento e amarração: entregas finais da Sprint 5, etapa SP5 do DAIA-E; Apresentação
    Final amanhã, 18/12.

Depois do encontro
  Roteiro da demonstração final e checklist dos Critérios de qualidade GITHUB.
