# Notas do professor: Aula 08, 27/11/2026

Material interno de condução da aula. Perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- A tabela de percursos por dígito do RA (pendência P6) precisa estar publicada no card do
  encontro. Sem ela, o item de coleta do barema (2,0 pontos, "percurso de outro RA recebe zero")
  não tem como ser aplicado. O acervo não define percurso nenhum.
- A plataforma da sala não está definida (P7). O laboratório usa `broker.hivemq.com` e o painel
  `labs/aula08-painel.html`. Confirmar antes da aula que a rede da sala libera a porta 1883 para o
  ESP32 e a 8884 (WebSocket seguro) para o navegador; se a rede bloquear, o painel não recebe nada
  e o laboratório no Wokwi continua funcionando, porque o tráfego do simulador sai pelo gateway do
  Wokwi.
- A pergunta de leitura numérica é item de comprovação idêntico entre turma-piloto e controle
  (P8). Usar exatamente a versão definida para o experimento; o deck traz o texto do enunciado da
  reescrita 5C.
- O Wokwi não simula variação de sinal: nenhum atributo de intensidade na documentação do
  Wokwi-GUEST nem na peça de ponto de acesso. Quem tentar "afastar" o ESP32 no diagrama não vai ver
  diferença. Toda medição de dBm da ponderada é na bancada e no percurso físico.
- O RSSI de `dados/leituras.csv` é sorteado pelo gerador (`tools/gerar_dados_case.py`, `randint`
  entre −92 e −55). Não deixar ninguém ajustar modelo de propagação a esse dado.
- A reescrita 5C registra peso 3 para esta atividade e a Adalove registra peso 2 (P3). O acervo
  cita a Adalove.

## Perguntas socráticas

### 1. Bloco 1: por que não dividir os dois números?

"Se −90 dividido por −60 dá 1,5, por que a resposta é 1000 vezes?"

**Resposta esperada:** o dBm é logarítmico. A diferença de 30 dB é que importa, e cada 10 dB é um
fator de 10 na potência: 10 × 10 × 10 = 1000.

**Erro comum:** tratar dBm como escala linear, ou achar que 30 dB de diferença são 30 vezes.

### 2. Bloco 1: por que o RSSI é negativo?

"Por que todo RSSI que vocês vão ver é negativo?"

**Resposta esperada:** o sinal recebido é muito menor que 1 mW, a referência do dBm. Logaritmo de
número menor que 1 é negativo: −60 dBm é um milionésimo de miliwatt.

**Erro comum:** achar que −80 é "mais sinal" que −55 porque 80 é maior que 55.

### 3. Bloco 2: o que o painel deveria mostrar quando o sinal some no galpão?

"O rastreador entrou num galpão de aço e parou de falar. O que o painel da Cerradinho mostra?"

**Resposta esperada:** a última comunicação, com a hora, e o status offline. O dado não se perde se
o rastreador guardar o evento no buffer da Aula 04 e enviar quando voltar a ter conexão. O TAPI
pede exibir a última comunicação e prever envio posterior sem conexão.

**Erro comum:** tratar ausência de sinal como "equipamento sumiu". Sem comunicação, o painel sabe só
quando foi o último contato.

### 4. Bloco 3: de onde sai a ordem prevista dos pontos?

"Por que você pôs o ponto 4 depois do ponto 3, se o 4 está mais perto do roteador?"

**Resposta esperada:** a ordem depende de distância e do que está no caminho: paredes de concreto,
portas metálicas, o próprio corpo de quem segura o ESP32. Distância sozinha só ordena no espaço
livre.

**Erro comum:** ordenar só pela distância em linha reta e não declarar a diferença perceptível em
dB, que o barema exige (1,5 ponto do Contextualizar).

### 5. Bloco 4: por que o RSSI não muda no Wokwi?

"Você arrastou o ESP32 no diagrama e o RSSI ficou igual. Está quebrado?"

**Resposta esperada:** não. O Wokwi oferece um ponto de acesso virtual e não modela distância nem
obstáculo. No simulador, o laboratório prova que a leitura, a conversão e a publicação funcionam; a
variação se mede na bancada.

**Erro comum:** concluir que o código está errado e trocar a leitura por um valor inventado.

### 6. Bloco 4: como o painel sabe que o ESP32 está dentro do elevador?

"Se o ESP32 está sem rede, quem avisa o painel?"

**Resposta esperada:** o broker. Na conexão, o ESP32 deixou uma mensagem de testamento (Last Will
and Testament, LWT: `offline` no tópico de status). Sem pacote em uma vez e meia o keep alive
(5 s no sketch, ou seja, 7,5 s), o broker desconecta o cliente e publica o testamento. Quem fica só
os 5 s do enunciado no elevador vê a lacuna na série, mas pode não ver o `offline`: para observar o
status, pedir pelo menos 10 s.

**Erro comum:** achar que o ESP32 manda um aviso antes de perder a rede.

### 7. Bloco 5: qual premissa do modelo da IA cai primeiro?

"O modelo da IA estimou 40 m para um ponto que está a 8 m. Qual premissa falhou?"

**Resposta esperada:** depende dos dados, e a pergunta é qual evidência mostra isso. Candidatas:
espaço livre (há paredes no caminho), γ fixo (o expoente muda de corredor para sala), sem reflexão
(metal reflete), RSSI de referência a 1 m nunca medido. A tabela do modelo log-distância registra
desvio-padrão de 7 a 14,1 dB em escritório: com γ = 3, 7 dB de erro já multiplicam a distância
estimada por cerca de 1,7.

**Erro comum:** dizer "o modelo erra porque é aproximado" sem apontar a premissa e o ponto medido
que a derruba. Pelo barema, reproduzir o modelo sem confrontar vale no máximo um terço.

### 8. Bloco 6: o que é uma queda de 3 dB?

"Seu sinal caiu 3 dB ao passar pela porta. Quanto de potência sobrou?"

**Resposta esperada:** metade. −3 dB é meia potência, pela nota da Cisco do autoestudo.

**Erro comum:** responder 3% ou "três vezes menos".

### 9. Bloco 7: qual intervalo de comunicação o grupo decide para a Cerradinho?

"No laboratório o ESP32 publica a cada 2 s. Vocês deixariam assim no rastreador?"

**Resposta esperada:** não. O TAPI pede atualização semanal, com frequência ajustável; 2 s serve
ao percurso da ponderada. Cada transmissão gasta bateria, e a decisão humana da SP4 é o intervalo,
registrado com a alternativa considerada.

**Erro comum:** escolher o intervalo pelo que "fica bonito no gráfico", sem olhar o requisito do
TAPI nem a autonomia.
