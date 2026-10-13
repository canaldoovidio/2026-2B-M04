# Notas do professor: Aula 03, 22/10/2026

Material interno de condução da aula. Perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- Primeira aula em ESP32. Conferir no daily que cada dupla consegue abrir um projeto novo em
  wokwi.com/projects/new/esp32; o vídeo "Simulador Wokwi (ESP32)" não nomeia o Wokwi no título
  (P9), e parte da turma pode não ter associado o vídeo ao simulador.
- A Sprint Review 1 é amanhã, 23/10. O daily serve também para conferir o que cada grupo leva:
  esta aula entrega a máquina de estados para o Protótipo inicial no Wokwi (peso 1) e as
  transições e limiares para a Matriz de Rastreabilidade (peso 2).
- Os números do bloco 3 vêm de `dados/ciclos.csv` (fictício, ADR-006), com data de referência
  01/10/2026: CI-003 com 190 dias fora e prazo de 60; CI-009 com 70 e prazo de 30; CI-015 com 12
  e prazo de 45. Não usar dado da Cerradinho, que é restrito pelo TAPI.
- O laboratório acelera o relógio (1 dia simulado = 100 ms). Avisar antes de a dupla começar a
  cronometrar.

## Perguntas socráticas

### 1. Bloco 1: por que `transicao` recebe `proximo` por referência?

"A função já devolve um `bool`. Como ela entrega também o novo estado?"

**Resposta esperada:** pelo parâmetro `Estado &proximo`. O `&` faz o parâmetro ser a própria
variável de quem chamou, então o que a função grava ali aparece em `aplicar()`. O `bool` diz se a
transição foi aceita, e a referência leva o estado novo.

**Erro comum:** achar que toda função recebe cópias. Isso vale para `atual` e `evento`, passados
por valor; sem o `&`, o estado novo se perderia ao fim da função.

### 1b. Slide do switch: por que a linguagem deixa o switch cair no caso seguinte?

"Se esquecer o `break` é um erro tão comum, por que o compilador não reclama?"

**Resposta esperada:** porque cair no caso seguinte é permitido e às vezes desejado, por exemplo
quando dois casos fazem a mesma coisa. O compilador aceita as duas formas, e só o teste mostra se
o programa faz o que o programador pretendia.

**Erro comum:** achar que o `switch` executa só o caso escolhido por natureza. Ele salta para o
caso e segue em frente até um `break`, um `return` ou o fim do bloco.

### 2. Bloco 2: qual transição proibida custa mais para a Cerradinho?

"Dê um exemplo de transição que não pode acontecer e diga quem paga se o sistema aceitar."

**Resposta esperada:** liberação com o equipamento ainda no fornecedor, por exemplo. O dispositivo
seria vinculado a outro equipamento enquanto o primeiro continua fora, e a Gestão Patrimonial
perderia o rastro dele. O TAPI pede justamente impedir vínculos simultâneos indevidos.

**Erro comum:** listar transições proibidas sem dizer o custo. Sem o custo, o grupo não consegue
priorizar qual regra testar primeiro na Matriz de Rastreabilidade.

### 3. Bloco 2: o fluxo do TAPI tem sete etapas; por que o rastreador tem quatro estados?

"Necessidade, aprovação e conferência não viram estado. Por quê?"

**Resposta esperada:** o rastreador guarda o que muda o comportamento dele. Necessidade e aprovação
acontecem antes de o dispositivo ser vinculado; conferência acontece com o equipamento já de
volta. O que importa ao dispositivo é se os dias fora contam ou não.

**Erro comum:** querer um estado por etapa administrativa. Isso multiplica as transições a testar
sem mudar nenhum alerta.

### 4. Bloco 3: os três ciclos estão no mesmo estado. Por que os alertas diferem?

"CI-003, CI-009 e CI-015 estão todos no fornecedor em 01/10/2026. Por que só um passa do limiar?"

**Resposta esperada:** os alertas dependem do número de dias fora, e o estado só decide se esses dias contam. CI-003
tem 190 dias, acima de 150; CI-009 tem 70; CI-015 tem 12.

**Erro comum:** responder que o CI-003 está "em atraso" e por isso passou do limiar. Atraso e
permanência são comparações diferentes: o CI-009 também está atrasado e não passou do limiar.

### 5. Bloco 4: por que os LEDs não acendem na hora da saída?

"A dupla apertou saída e chegada, e nada acendeu. O código está errado?"

**Resposta esperada:** não. Com prazo de 30 dias e 100 ms por dia, o LED de atraso acende cerca de
3,1 s depois da saída (31.º dia), e o de permanência cerca de 15,1 s depois (151.º dia), em tempo
simulado. A simulação do ESP32 pode rodar abaixo do tempo real: a leitura é pela barra da simulação
do Wokwi ou pelos instantes `[ms]` impressos na serial, nunca por cronômetro de mão.

**Erro comum:** apertar chegada antes de saída e concluir que o relógio não anda. Chegada em
cadastrado é recusada, e em cadastrado os dias fora não contam.

### 6. Bloco 5: como provar que o código da IA aceita uma transição proibida?

"Você diz que o código do Gemini está errado. Qual teste mostra isso?"

**Resposta esperada:** um estado, um evento e o estado resultante. Por exemplo: em retornado,
aplicar chegada; o esperado é continuar em retornado. Se o código da IA muda de estado, a evidência
é essa linha na tabela do laboratório.

**Erro comum:** classificar a resposta da IA como errada por estilo ("ficou grande", "usa if em vez
de switch") sem mostrar uma transição que falha.

### 7. Bloco 6: por que o TAPI pede atraso e permanência separados?

"Se os dois são contagem de dias, por que não um alerta só?"

**Resposta esperada:** os dois usam os mesmos dias fora contra referências diferentes. O atraso
usa o prazo combinado com cada fornecedor e orienta a cobrança. A permanência usa um limiar único
da empresa, 150 dias de referência, e aponta equipamentos parados há tempo demais mesmo quando o
prazo combinado é longo. Um ciclo com prazo de 200 dias e 160 dias fora tem permanência sem
atraso.

**Erro comum:** achar que a permanência é um atraso grande. Com prazo maior que o limiar, a
permanência acende antes do atraso.

### 8. Bloco 6: 150 dias exatos dispara o alerta?

"O ciclo completou 150 dias hoje. O LED de permanência acende?"

**Resposta esperada:** no laboratório, não: a regra é `diasFora > limiarDias`, seguindo o texto do
TAPI sobre equipamentos acima do limiar. É uma decisão de regra de negócio, e o grupo pode
escolher outra, desde que a registre na Matriz de Rastreabilidade.

**Erro comum:** tratar a escolha entre `>` e `>=` como detalhe de código. Ela muda o dia em que a
Gestão Patrimonial recebe o alerta.

### 9. Bloco 7: por que o atributo estado é privado?

"O que impediria alguém de escrever `ciclo.estado = Estado::Retornado` direto?"

**Resposta esperada:** o `private`. Só os métodos da classe mudam o estado, e todos passam por
`transicao`. Se o atributo fosse público, qualquer trecho do programa poderia pular a regra.

**Erro comum:** tratar o `private` como detalhe de estilo. No laboratório, o `private` impede que
uma transição proibida entre por outro caminho além de `transicao`.

## Depois do encontro

- Desafio: limiar configurável pela serial, sem regravar o firmware.
- ADR do aluno: uma sugestão da IA sobre a máquina de estados que foi rejeitada ou corrigida, com o
  teste que a derrubou.
