# Notas do professor: Aula 04, 30/10/2026

Material interno de condução da aula. Perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- O daily inclui o retorno da Sprint Review 1 (23/10). Reservar os 15 minutos inteiros para ele.
- O autoestudo de ponteiros é livro na Minha Biblioteca, com login. Perguntar na abertura quem
  conseguiu acessar; quem não conseguiu usa as seções 5 e 6 do material de apoio.
- Os cards "Microcontroladores" e "Microcontroladores - O ESP32 - parte 1" trazem exercícios antigos
  do repositório M4_SPRINTS. Se algum aluno entregou, avisar que não é pressuposto do encontro
  (pendência P9).
- Não há ponderada nesta aula. O "Semáforo offline" da reescrita 5C não está no LBL da T24
  (pendência P2); não anunciar nada sobre ele até a resposta.
- O endereço 0x3FFB0010 do deck e das animações é exemplo declarado. O endereço real sai da serial
  do laboratório e muda conforme a versão do núcleo.

## Perguntas socráticas

### 1. Bloco 1: por que p + 1 anda 4 bytes?

"Se o endereço é um número, por que somar 1 não dá o endereço seguinte?"

**Resposta esperada:** porque o compilador sabe o tipo apontado e soma o tamanho de um
elemento inteiro. Para `int` no ESP32, um elemento tem 4 bytes; para a struct `Evento`, 8.

**Erro comum:** confundir `p + 1` com `*p + 1`. A primeira mexe no endereço; a segunda soma 1 ao
conteúdo.

### 2. Bloco 2: quantos eventos cabem na memória?

"O ESP32 tem 520 KB de SRAM. Quantos eventos o rastreador consegue guardar?"

**Resposta esperada:** a conta é capacidade vezes `sizeof(Evento)`. Com 8 bytes por evento,
1 000 eventos ocupam 2,4% dos 327 680 bytes que a compilação informa para variáveis globais; quem
define a capacidade é o tempo sem conexão que o grupo quer cobrir e quantos eventos o rastreador gera
nesse tempo. A memória livre em execução é medida por `ESP.getFreeHeap()`.

**Erro comum:** dividir 520 KB por 8 e dar esse número como capacidade. Parte da SRAM é do sistema,
e a capacidade é uma decisão de projeto, com justificativa, que vai para o ADR do grupo.

### 3. Bloco 2: o que acontece com o buffer se a bateria acabar?

"Os eventos guardados sobrevivem a um desligamento?"

**Resposta esperada:** não. A SRAM perde o conteúdo quando a placa desliga. O buffer cobre a falta
de conexão; uma queda de energia apaga os eventos guardados, e guardar na flash é outra decisão.

**Erro comum:** achar que tudo o que está "no ESP32" fica gravado. Só o programa, na flash,
sobrevive ao desligamento.

### 4. Bloco 3: onde para a escrita depois de 10 eventos?

"Buffer de 8 posições, vazio, escrita em buffer[0], política de descartar o mais antigo. Chegam 10
eventos sem conexão. Onde está a escrita?"

**Resposta esperada:** em buffer[2]. Depois de buffer[7] o ponteiro volta para buffer[0]; 10 menos
8 dá 2. Os eventos 1 e 2 foram sobrescritos, e a leitura também está em buffer[2]. Com a outra
política, descartar o mais novo, a escrita fica em buffer[0] e os perdidos são 9 e 10: por isso a
pergunta declara a política.

**Erro comum:** responder buffer[10], esquecendo que o vetor só tem as posições 0 a 7.

### 5. Bloco 3: buffer vazio e buffer cheio parecem iguais?

"Com escrita e leitura na mesma posição, o buffer está vazio ou cheio?"

**Resposta esperada:** pode ser qualquer um dos dois. Os ponteiros sozinhos não distinguem; o
contador `guardados` resolve. Outra saída comum é deixar sempre uma posição vazia.

**Erro comum:** tratar escrita igual a leitura como "vazio" e perder o buffer inteiro quando ele
enche.

### 6. Bloco 4: por que o botão não pode ir no GPIO 35?

"Na placa física, uma dupla ligou o botão no GPIO 35 com `INPUT_PULLUP` e a serial registra eventos sozinha. Por quê?"

**Resposta esperada:** os GPIO 34 a 39 só leem e não têm pull-up interno, pelo datasheet do ESP32.
O `INPUT_PULLUP` não tem efeito ali, e, na placa física, o pino fica flutuando com o botão solto. O
simulador pode não reproduzir esse sintoma.

**Erro comum:** culpar o bounce. O debounce da Aula 02 não corrige um pino sem referência de
tensão.

### 7. Bloco 5: a IA acertou a aritmética de ponteiros?

"A resposta do Gemini sobre `p + 1` numa struct de dois `uint32_t` está certa? Como você sabe?"

**Resposta esperada:** comparando a diferença entre os endereços de buffer[0] e buffer[1] impressos
pela serial com o tamanho que a IA previu. Se a diferença for 8, a resposta se confirma.

**Erro comum:** aceitar a explicação porque ela cita `sizeof`. A etapa Confrontar pede a fonte
primária, que aqui é o endereço impresso.

### 8. Bloco 6: descartar o mais antigo ou o mais novo?

"Com o buffer cheio, qual evento o rastreador da Cerradinho deve perder?"

**Resposta esperada:** depende do que vale mais para a Gestão Patrimonial. Descartar o mais antigo
mantém a última localização atual e pode perder um rompimento do lacre do início do período sem
conexão; descartar o mais novo preserva esse rompimento e entrega uma localização velha. A escolha
vai para o ADR do grupo com o critério.

**Erro comum:** escolher sem critério ("o mais antigo, porque é o normal"). A pergunta pede o custo
de cada perda para o parceiro.

## Fechamento

Amarração: o buffer circular e a política de descarte entram no Protótipo físico do projeto
(offline), peso 4, da Sprint 2, etapa SP2 do DAIA-E, com a decisão humana sobre quantos eventos o
dispositivo guarda. A Sprint Review 2 é em 06/11. A Aula 05, em 05/11, lê a tensão da bateria pelo
ADC.
