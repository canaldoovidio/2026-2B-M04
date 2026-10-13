# Notas do professor: Aula 07, 18/11/2026

Material interno de condução da aula. Perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- O laboratório compila com o core `esp32:esp32` 3.3.12 e a biblioteca LiquidCrystal I2C 1.1.2.
  O `arduino-cli` avisa que a biblioteca declara só a arquitetura AVR; o código compila e roda
  mesmo assim. No Wokwi, a biblioteca entra pela aba Library Manager.
- Os valores do display são os três ciclos abertos de `dados/` (fictícios, ADR-006) na data de
  referência 01/10/2026: CI-003 (190 dias, prazo 60, bateria 43%), CI-009 (70, 30, 70%) e CI-015
  (12, 45, 96%).
- Os dois vídeos de "Dispositivos de saída digital e analógica - I" tratam de entrada (pendência
  P9). Quem só viu esses vídeos chega sem a ideia de ciclo de trabalho: a Peer Instruction de
  abertura mostra isso rápido.
- Ter em mãos a seção 7.1 do datasheet NXP do PCF8574 para o Confronto com a IA. O Gemini costuma
  responder 0x27 ou 0x3F; os dois existem, em chips diferentes.
- A afirmação sobre brilho percebido usa a luminosidade L* da CIE 1976 como modelo. Não apresentar
  os valores de L* como medição do LED do kit.

## Perguntas socráticas

### 1. Bloco 1: de onde sai a tensão média de 0,83 V?

"O pino só conhece 0 V e 3,3 V. Como ele pode entregar 0,83 V?"

**Resposta esperada:** ele não entrega 0,83 V em nenhum instante. Fica em 3,3 V durante 25% de
cada período e em 0 V no resto, e a média no tempo é 0,25 × 3,3 V = 0,825 V. Quem enxerga a média
é o olho, ou um filtro, ou um multímetro lento.

**Erro comum:** confundir ciclo de trabalho com tensão, e responder 0,25 V. O ciclo é uma fração
do tempo; a tensão média é essa fração vezes o nível alto.

### 2. Bloco 2: o que fica de fora da tela de 16 por 2?

"O TAPI pede bateria, última comunicação e lacre visíveis. Cabem os três em 32 caracteres, junto
com o equipamento e os dias fora?"

**Resposta esperada:** não cabem com folga. O laboratório escolhe equipamento, dias, situação,
lacre e bateria, e deixa a última comunicação para uma segunda tela (o desafio). A escolha é uma
decisão humana da etapa SP3 e precisa estar justificada no `PROCESSO.md`.

**Erro comum:** abreviar tudo até caber e perder a leitura. Quem está na oficina precisa entender a
tela sem manual; uma segunda tela é melhor do que uma tela ilegível.

### 3. Bloco 3: por que 50% de ciclo não parece metade do brilho?

"A turma previu metade do brilho a 50%. Por que a animação mostra L* de 76?"

**Resposta esperada:** a tensão média é linear no ciclo, e a percepção de claridade não é. Pela
luminosidade L* da CIE 1976, L* = 116 × Y^(1/3) − 16, metade da luz já parece três quartos do
brilho. O LED do Wokwi também aplica correção gama de 2,8 por padrão.

**Erro comum:** concluir que o PWM "erra" a tensão. A média de 1,65 V está certa; o que não é
linear é o olho.

### 4. Bloco 4: o display acendeu, mas sem texto. O que conferir primeiro?

"A luz de fundo acendeu e as linhas estão vazias. Por onde começar?"

**Resposta esperada:** pela varredura do monitor serial. Se o endereço em `ENDERECO_LCD` não
aparece na lista, o ESP32 está chamando um endereço que ninguém tem. Depois, SDA no 21 e SCL no 22.

**Erro comum:** trocar a biblioteca ou o código inteiro antes de olhar a serial. A varredura existe
para separar problema de endereço de problema de fiação.

### 5. Bloco 5: a IA errou ao responder 0x3F?

"O Gemini disse 0x3F e a varredura mostrou 0x27. A IA errou?"

**Resposta esperada:** a resposta estava incompleta. 0x3F é um endereço válido do PCF8574A; 0x27
é do PCF8574 com A2, A1 e A0 em nível alto (datasheet NXP, seção 7.1). A pergunta não dizia qual
chip, e a varredura mede o chip que está de fato no módulo. A classificação é "ajustada", com a
varredura como evidência.

**Erro comum:** classificar como "errada" sem nomear o mecanismo, ou aceitar o valor da IA sem
rodar a varredura. Os dois pulam a etapa Confrontar.

### 6. Bloco 5: por que dois dispositivos não brigam no mesmo fio?

"O LCD e o MPU6050 estão nos mesmos SDA e SCL. Por que um não atrapalha o outro?"

**Resposta esperada:** cada um só responde ao próprio endereço, e as linhas são de dreno aberto
com pull-up: os dispositivos só puxam a linha para 0 V, nunca forçam 3,3 V. Ninguém fala sem ser
chamado.

**Erro comum:** achar que é preciso um par de fios por dispositivo, como nos pinos digitais. O
barramento serve justamente para economizar pinos.

### 7. Bloco 6: quando o display deve acender?

"O display gasta bateria. Qual política vocês defendem para a pessoa da oficina?"

**Resposta esperada:** uma política com quem lê e quando: por exemplo, acender por alguns
segundos com um botão ou quando o acelerômetro da Aula 05 detecta movimento, e apagar a luz de
fundo no resto do tempo. O consumo medido entra na Aula 10, com deep sleep e autonomia estimada.

**Erro comum:** citar um número de consumo sem fonte. A pergunta pede a política; o número vem da
medição na Aula 10.

### 8. Laboratório: por que redesenhar o LCD só quando algo muda?

"Por que não chamar `desenharTela()` a cada volta do `loop()`?"

**Resposta esperada:** cada escrita ocupa o barramento I2C e o tempo do loop, e reescrever o mesmo
texto o tempo todo faz o display piscar. A bandeira `telaDesatualizada` só manda escrever depois
de um evento.

**Erro comum:** usar `lcd.clear()` antes de cada escrita. O `clear` apaga a tela inteira e
aumenta o piscar; o laboratório sobrescreve as linhas com largura fixa.

## Fechamento

Amarração: display I2C e LED de status por PWM entram no Protótipo do Projeto com MQTT e I2C
(peso 3, citado da Adalove), Sprint 3, etapa SP3 do DAIA-E. A Sprint Review 3 é em 19/11, no dia
seguinte. A Aula 08, em 27/11, trata de RSSI em dBm, última comunicação e dashboard.
