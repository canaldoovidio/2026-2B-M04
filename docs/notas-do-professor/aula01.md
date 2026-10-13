# Notas do professor: Aula 01, 15/10/2026

Material de condução, não de distribuição. São as perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- Medir o preparo no Bloco 1: anotar a proporção de acertos na primeira e na segunda votação da Peer
  Instruction. Se a primeira ficar abaixo de 30%, dedicar 5 minutos do Bloco 3 à animação
  circuito-led antes do cálculo.
- O Tutorial LED interno está com peso 0 na Adalove e é tratado como ponderada na reescrita 5C
  (pendência P1). Apresentar o `PROCESSO.md` como contrato do módulo sem afirmar peso até a
  confirmação.
- Ter pronta a foto da montagem com o LED invertido para o Bloco 6.

## Perguntas socráticas

### 1. Bloco 1: por que a posição do resistor não importa?

"Se a corrente passa primeiro pelo resistor, ela já chega ao LED reduzida. Então trocar o lado não
deveria mudar nada?"

**Resposta esperada:** num circuito em série há um único caminho, e a corrente é a mesma em todos os
pontos ao mesmo tempo. O resistor limita a corrente do circuito inteiro, não "a que chega" ao LED.

**Erro comum:** imaginar a corrente como algo que se gasta ao passar pelos componentes, como água
que vai acabando. O que cai ao longo do circuito é a tensão, não a corrente.

### 2. Bloco 2: o que o responsável precisa ver no dispositivo?

"Sem abrir sistema nenhum, o que a pessoa na oficina precisa saber olhando para o rastreador?"

**Resposta esperada:** se o dispositivo está ligado e funcionando. Bateria e lacre vêm depois; a
primeira informação é "estou vivo", e um pulso de luz resolve sem tela.

**Erro comum:** começar pela localização. A localização interessa à Cerradinho, não a quem está ao
lado do equipamento; separar quem consome cada informação é o exercício da etapa SP1 do DAIA-E.

### 3. Bloco 3: de onde vêm os 3 V?

"Por que a conta usa 3 V e não os 5 V do Arduino?"

**Resposta esperada:** o LED vermelho precisa de cerca de 2 V para conduzir. Dos 5 V, sobram 3 V
sobre o resistor, e é essa a tensão que define a corrente pela lei de Ohm.

**Erro comum:** calcular 5 V ÷ 220 Ω ≈ 22,7 mA e concluir que o resistor do kit deixa o LED acima do
limite. A diferença entre 13,6 mA e 22,7 mA é a queda do LED.

### 4. Bloco 3: o que acontece com 0 Ω?

"Na animação a corrente aparece como sem limite. Na placa real ela também seria infinita?"

**Resposta esperada:** não. Ela fica limitada pela resistência interna do pino, dos fios e do próprio
LED, mas passa muito dos 20 mA do datasheet, o suficiente para danificar o LED e forçar o pino da
placa.

**Erro comum:** levar a animação ao pé da letra. O modelo ideal ensina a tendência; o datasheet e a
medição dizem o valor. É a mesma lógica da etapa Confrontar.

### 5. Bloco 4: por que o LED não acende se o código está certo?

"O código compila e roda, a placa está ligada, e o LED continua apagado. Onde você olha primeiro?"

**Resposta esperada:** no circuito, antes do código. Polaridade do LED (perna longa no lado do pino),
pernas em meias colunas diferentes da protoboard e resistor de fato ligado ao pino 8.

**Erro comum:** reescrever o código. A falha mais frequente da primeira montagem é as duas pernas na
mesma meia coluna, que a animação da protoboard mostra no passo 6.

### 6. Bloco 4: quantas vezes o pinMode executa em 10 segundos?

"Em 10 segundos de placa ligada, quantas vezes cada linha do sketch roda?"

**Resposta esperada:** o `pinMode` roda uma vez, no `setup`. Cada linha do `loop` roda cinco vezes,
porque o ciclo dura 2 s (200 ms aceso mais 1800 ms apagado).

**Erro comum:** achar que o `setup` roda a cada volta. Perguntar o que aconteceria se o `pinMode`
estivesse dentro do `loop`: funcionaria, mas gastaria tempo repetindo uma configuração que não muda.

### 7. Bloco 6: a IA acertou sobre a foto?

"O Gemini disse que o circuito da foto vai funcionar. Como você confere sem acreditar nem
desacreditar de antemão?"

**Resposta esperada:** compara a afirmação com uma fonte primária: o datasheet do LED (perna longa é
o ânodo) e a posição das pernas na foto. O veredito é confirmada, ajustada ou errada, com o trecho
da fonte citado.

**Erro comum:** perguntar de novo para a IA, ou para outra IA, e tomar a segunda resposta como
verificação. Outra resposta de IA não é fonte primária.

### 8. Bloco 7: por que registrar o processo e não só entregar o código?

"Se o LED pisca, por que o PROCESSO.md importa?"

**Resposta esperada:** porque a avaliação do módulo passa a medir o que o aluno entendeu do que
construiu. A previsão escrita antes de rodar e a sugestão de IA rejeitada no ADR mostram
compreensão; o LED piscando mostra só que alguém fez funcionar.

**Erro comum:** preencher o `PROCESSO.md` depois de terminar, com a previsão já sabendo o resultado.
Pedir a data e o horário de cada etapa ajuda a perceber isso.

## Fechamento

Amarração: a Aula 01 alimenta o Protótipo inicial do projeto usando o simulador wokwi (peso 1) da
Sprint 1, que fecha na Sprint Review de 23/10. A próxima aula, em 20/10, tem a ponderada do circuito
RC, e a reescrita 5C pede a constante de tempo teórica entregue antes da aula.
