# Notas do professor: Aula 10, 03/12/2026

Material interno de condução da aula. Perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- Correntes da aula: ESP32 Series Datasheet v5.3 da Espressif, Tabela 4-2 (p. 30, deep sleep de
  10 µA, hibernação de 5 µA, light sleep de 0,8 mA) e Tabela 5-4 (p. 52, recepção de 95 a 100 mA,
  transmissão 802.11b de 240 mA). A bateria de 2000 mAh e os 10 s acordado são premissas declaradas;
  1 mA para a placa inteira é hipótese para mostrar sensibilidade, sem fonte de medição.
- O Wokwi não mede corrente. Não pedir medição de corrente no simulador; a medição é o desafio, na
  bancada, com o multímetro em série.
- Deep sleep no Wokwi: o despertar por timer é suportado desde 03/03/2026 (issue 441 do
  wokwi-features). A preservação da memória RTC e o despertar por pino não estão confirmados. Se o
  contador "Despertar N" ficar em 1, orientar a dupla a usar `USAR_DEEP_SLEEP 0` e registrar.
- Ter o `g++` ou o `clang++` funcionando numa máquina da sala para o Bloco 5: quem não tiver
  compilador roda em dupla com quem tem.
- Os livros de testes em C++ exigem login na Minha Biblioteca (P9). Perguntar no Bloco 1 quem
  conseguiu abrir; o material, seção 6, cobre a prática.
- Sprint Review 4 é amanhã, 04/12. Reservar os últimos minutos para o que cada grupo leva.

## Perguntas socráticas

### 1. Bloco 1: onde o rastreador gasta mais carga?

"Acordado ele consome 10 000 vezes mais. Como pode gastar mais dormindo?"

**Resposta esperada:** carga é corrente vezes tempo. Acordado: 100 mA × 10 s = 0,28 mAh. Dormindo:
0,01 mA × 604 790 s = 1,68 mAh. No envio semanal, a carga dormindo é cerca de 6 vezes a carga acordado.

**Erro comum:** comparar só as correntes. Também aparece "em deep sleep o consumo é zero", que a
Tabela 4-2 desmente.

### 2. Bloco 2: como estimar 150 dias sem esperar 150 dias?

"O TAPI diz que um ensaio curto não comprova 150 dias. Então o que comprova?"

**Resposta esperada:** um cálculo com as correntes medidas em cada modo, o tempo em cada modo e a
capacidade da bateria, com as premissas escritas. O ensaio curto serve para medir as correntes que
entram na conta.

**Erro comum:** deixar o protótipo ligado por uma tarde e extrapolar a queda da porcentagem de
bateria. A curva de descarga de uma célula de íon-lítio não é reta, e a leitura do ADC tem resolução
grosseira para isso.

### 3. Bloco 3: por que o eixo da corrente é logarítmico?

"Por que a animação não usa um eixo comum, de 0 a 100 mA?"

**Resposta esperada:** 10 µA num eixo de 0 a 100 mA ficaria a 0,01% da altura, colado no zero. O
eixo logarítmico dá o mesmo espaço a cada fator de 10 e mostra as duas correntes na mesma figura.

**Erro comum:** ler a altura no gráfico como proporcional à corrente.

### 4. Bloco 3: o que muda quando o envio passa a ser por hora?

"Com um envio por hora, a autonomia cai de 7.151 para 290 dias. Qual parcela cresceu?"

**Resposta esperada:** a parcela acordado, que é multiplicada por 168 despertares por semana: 46,7
mAh contra 1,68 mAh dormindo. O sono passa de 86% para cerca de 3% da carga.

**Erro comum:** achar que o sono ficou mais caro. A corrente de sono não mudou.

### 5. Bloco 3: os 7.151 dias são a autonomia do protótipo?

"Podemos escrever no relatório que o rastreador dura 19 anos?"

**Resposta esperada:** não podem. É o teto ideal do chip: a conta ignora a autodescarga da bateria, a
temperatura, o regulador e o conversor USB-serial da placa e as reconexões sem rede. Com a placa
dormindo em 1 mA, o mesmo envio semanal dá 83 dias.

**Erro comum:** copiar o número do datasheet como desempenho medido. O TAPI pede distinguir
desempenho medido de estimativa.

### 6. Bloco 4: por que a fila fica na memória RTC e o cadastro em Preferences?

"Se a memória RTC sobrevive ao sono, por que não guardar tudo nela?"

**Resposta esperada:** a memória RTC perde tudo quando a energia é cortada, por exemplo na troca de
bateria. O cadastro do ciclo precisa sobreviver a isso e vai para a flash (NVS). A fila muda a cada
despertar, e gravar na flash toda semana gasta ciclos de escrita.

**Erro comum:** tratar Preferences como sistema de arquivos. O título do autoestudo diz
"Filesystem", e o conteúdo é a biblioteca Preferences.

### 7. Bloco 4: por que a bateria está no GPIO 34?

"Qualquer pino analógico serve para ler a bateria?"

**Resposta esperada:** o GPIO 34 é do ADC1. A documentação do ADC da Espressif registra que o ADC2
também é usado pelo Wi-Fi, e a leitura acontece justamente no despertar que publica.

**Erro comum:** escolher o pino pela posição na placa e descobrir a disputa só quando a leitura
falha com o Wi-Fi ligado.

### 8. Bloco 5: este teste da IA testa alguma coisa?

"O teste passou. Isso prova que a função está certa?"

**Resposta esperada:** prova só que o teste não achou erro. Para saber se ele acharia, quebra-se o
código de propósito (trocar `>` por `>=` no limiar, o que antecipa o alerta para o dia 150) e roda-se
de novo; se continuar passando, ele não
verifica aquele ponto.

**Erro comum:** contar testes passando como medida de qualidade. Os cinco testes do exemplo passam
contra o código quebrado. O critério do acervo é "maior que": com 150 dias exatos não há alerta, e
só a verificação `estadoDoCiclo(150, 30, 150, false) == ATRASADO` separa `>` de `>=`.

### 9. Bloco 6: quem lê o manual?

"Para quem vocês estão escrevendo o Manual de Instruções?"

**Resposta esperada:** para quem fixa o dispositivo e para quem recebe o equipamento de volta, na
Cerradinho ou no fornecedor. O manual responde onde fixar sem dano, como aplicar e retirar o lacre
com autorização, o que o display mostra e o que acontece sem rede.

**Erro comum:** escrever o manual para o programador, com pinagem e bibliotecas, que vão para a
Arquitetura do protótipo.

## Limitações aceitas no laboratório

- O campo `lacre` do JSON publicado usa o estado do lacre no despertar da publicação para todos os
  eventos da fila, inclusive os guardados em semanas anteriores.
- `lacreRegistrado` não é zerado no novo cadastro: um lacre que continua rompido ao fim de um ciclo
  não gera novo evento no ciclo seguinte até ser reaplicado.
- A fila de 8 posições descarta o evento mais antigo, inclusive alertas (seção 2 do material).

## Fechamento

Amarração: integração, testes e autonomia entram no Código do projeto e na Arquitetura do protótipo,
e a seção 7 do material alimenta o Manual de Instruções, peso 2 cada, Sprint 4, etapa SP4 do DAIA-E.
A decisão humana da etapa é a autonomia aceitável, com as premissas assinadas pelo grupo. Sprint
Review 4 amanhã, 04/12. A Aula 11, em 10/12, trata de segurança: autenticação, MQTT com TLS e
credenciais fora do código.
