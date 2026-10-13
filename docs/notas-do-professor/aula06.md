# Notas do professor: Aula 06, 13/11/2026

Material interno de condução da aula. Perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- Conferir na véspera que o broker público responde: abrir o cliente MQTT web do HiveMQ, conectar e
  publicar em `cerradinho/t24d00/dv01/comando`. O broker de sala não está definido (P7); se o
  público estiver fora do ar, o laboratório fica só na leitura do código e da serial.
- Distribuir os identificadores de dupla (`t24d01` em diante) para o tópico. Sem isso as duplas
  leem as mensagens umas das outras.
- A ponderada começa em sala e depende do kit: LDR, resistor do divisor, três LEDs e lanterna (a do
  celular serve). Cada aluno escreve o limiar previsto antes de medir.
- O enunciado que vale é o da reescrita 5C. A Adalove ainda cobra interface online e tem barema
  diferente (P4). Confirmar com o professor responsável antes de corrigir.
- Os cartões de falha do item Comprovar da reescrita ainda não existem (P6). Sem eles, o item não
  pode ser aplicado no fim da montagem.
- Números de cobertura e consumo: usar só os da tabela do material (seções 5 e 6), cada um com
  fonte. Se a turma trouxer outro número, a pergunta é "de onde veio?".

## Perguntas socráticas

### 1. Bloco 1: o + casa com quantos níveis?

"Se o BI assina `cerradinho/+/lacre`, ele recebe `cerradinho/dv01/lacre/autorizada`?"

**Resposta esperada:** não. O + casa exatamente um nível, e esse tópico tem um nível a mais. Para
receber os dois, o filtro seria `cerradinho/+/lacre/#` ou `cerradinho/#`.

**Erro comum:** tratar o + como "qualquer coisa daqui para frente", que é o papel do #.

### 2. Bloco 2: o que o rastreador faz numa oficina sem Wi-Fi?

"O EQ-01 está há 190 dias numa oficina sem Wi-Fi. O lacre é rompido. O que acontece com o evento?"

**Resposta esperada:** com Wi-Fi como único canal, o evento fica guardado no buffer da Aula 04 até
haver conexão, e o alerta chega atrasado. O TAPI pede envio posterior e diz para não pressupor
Wi-Fi corporativo. A alternativa é uma tecnologia com cobertura própria, que a matriz compara.

**Erro comum:** responder "usa o Wi-Fi da oficina". A oficina é de terceiro, o TAPI não pressupõe esse
Wi-Fi e diz que não deverão ser exigidas modificações permanentes na infraestrutura de terceiros.

### 3. Bloco 3: o que significa tolerar 164 dB de perda?

"Por que comparar as tecnologias em dB?"

**Resposta esperada:** o alcance em quilômetros muda com terreno, prédios, antena e paredes. A perda
máxima tolerada é uma propriedade do rádio e permite comparar as quatro na mesma régua. A conversão
para distância exige medir no local, como o TAPI pede.

**Erro comum:** tomar o alcance rural da Semtech (30 milhas) como alcance numa oficina coberta de
metal. O número é ao ar livre.

### 4. Bloco 3: por que a barra do Wi-Fi é a menor?

"Se o Wi-Fi do ESP32 transmite a 19,5 dBm, por que ele perde para as outras?"

**Resposta esperada:** a cobertura depende também da sensibilidade do receptor. O Wi-Fi recebe até
&minus;97 dBm; as tecnologias de baixa potência e longo alcance trocam taxa de dados por
sensibilidade muito maior e repetição de mensagens.

**Erro comum:** achar que só a potência de transmissão define o alcance.

### 5. Bloco 4: por que o tópico tem o identificador da dupla?

"O que acontece se todas as duplas publicarem em `cerradinho/dv01/lacre`?"

**Resposta esperada:** o broker é público e compartilhado. Todas as mensagens chegam a todos os
assinantes desse tópico, e ninguém sabe qual violação é de qual dupla. O prefixo separa os
rastreadores, do mesmo jeito que o identificador do dispositivo separa os rastreadores da
Cerradinho.

**Erro comum:** achar que o broker separa as mensagens por quem publicou. Ele só olha o tópico.

### 6. Bloco 4: o tópico identifica o dispositivo ou o equipamento?

"O DV-01 sai do EQ-01 e vai para outro equipamento. O que muda no tópico?"

**Resposta esperada:** com o dispositivo no tópico, nada muda; o vínculo com equipamento e ciclo vai
no JSON e o histórico fica preservado, como o TAPI pede para a reutilização. Com o equipamento no
tópico, o firmware precisa ser reconfigurado a cada troca.

**Erro comum:** escolher o equipamento porque "é o que o BI quer ver". O BI agrupa pelo campo do
JSON, e o tópico só roteia a mensagem ao assinante.

### 7. Bloco 5: o número da IA tem fonte?

"O Gemini disse que LoRa alcança 15 km. A matriz aceita esse número?"

**Resposta esperada:** só com fonte e condição. A página da Semtech fala em 3 milhas urbano e 30
milhas rural, ao ar livre. Sem fonte e sem condição, a célula fica "sem fonte".

**Erro comum:** aceitar o número porque parece razoável ou porque está entre os da fonte.

### 8. Bloco 6: por que o limiar da IA não serve?

"A IA sugeriu limiar 2000 para o modo noturno. Por que não usar?"

**Resposta esperada:** a leitura depende do LDR, do resistor do divisor e da luz da sala. A IA não
mediu nada disso. O limiar sai das três medições do aluno, e a diferença para o valor da IA é parte
da entrega.

**Erro comum:** usar um único limiar no meio das medições. Sem histerese, o semáforo oscila quando a
luz fica perto do limiar.

## Fechamento

Amarração: a ponderada do Semáforo Inteligente (peso 2) começa hoje; o evento em JSON por MQTT entra
no Protótipo do Projeto com MQTT e I2C (peso 3); a matriz de tecnologias entra em Metodologia e
Arquitetura da solução (peso 3). Sprint 3, etapa SP3 do DAIA-E; Sprint Review 3 em 19/11. A Aula
07, em 18/11, acrescenta o display I2C.
