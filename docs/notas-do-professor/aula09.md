# Notas do professor: Aula 09, 02/12/2026

Material interno de condução da aula. Perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- Nenhuma montagem desta aula usa tensão de rede, nem no Wokwi nem na bancada. Se um grupo trouxer
  relé ligado a 127 V ou 220 V, a montagem não entra em sala. A carga é sempre um LED.
- O broker do laboratório é o público `broker.hivemq.com`, porta 1883, porque o broker de sala
  ainda não foi definido (P7). Pedir que cada dupla troque `dupla00` por um código próprio antes de
  rodar; duas duplas com o mesmo prefixo disparam o relé uma da outra, o que também serve de
  exemplo para a pergunta 6.
- A documentação do `wokwi-relay-module` se contradiz sobre o nível de `IN` que liga o COM ao NO.
  O laboratório tem um LED em cada contato e pede a conferência na etapa Confrontar. Rodar o
  laboratório antes da aula e anotar o resultado, para responder com evidência.
- Três autoestudos da semana não entregam o título (P9): "Ativação de atuadores via Mosquitto - II"
  e "III" não usam Mosquitto, e "Utilização de Atuadores." trata de Arduino IoT Cloud com WS2812b.
  A Preparação do material cobre as lacunas.
- Medir o preparo no Bloco 1: anotar a proporção de acertos nas duas votações da Peer Instruction.

## Perguntas socráticas

### 1. Bloco 1: por que o relé precisa de diodo em paralelo com a bobina?

"O diodo não conduz enquanto a bobina está ligada. Então para que ele está ali?"

**Resposta esperada:** a bobina é um indutor e resiste à queda brusca da corrente. No
desligamento, a tensão sobe para manter a corrente fluindo (V = L × di/dt) e pode chegar a centenas
de volts, segundo as notas "Relay Basics" da UNLV. O diodo dá caminho a essa corrente e prende a
tensão na bobina em cerca de 0,7 V. A animação rele-carga mostra os dois casos.

**Erro comum:** achar que o diodo protege a carga da rede ou retifica corrente alternada. Ele fica
no lado do comando, em paralelo com a bobina de corrente contínua.

### 2. Bloco 1: por que o GPIO não liga a bobina direto?

"A bobina é de 5 V e o ESP32 tem 5 V na placa. Por que precisa de transistor?"

**Resposta esperada:** porque a corrente não fecha a conta. A bobina de 70 Ω do SRD-05VDC-SL-C
puxa 5 V ÷ 70 Ω = 71,4 mA, e um GPIO do ESP32 fornece 40 mA (datasheet, Tabela 5-3). O transistor
liga a bobina à fonte de 5 V, e o GPIO só controla o transistor.

**Erro comum:** olhar só para a tensão. O limite que reprova a ligação direta é de corrente.

### 3. Bloco 2: quem trata o alerta de 190 dias?

"O ciclo CI-003 está há 190 dias fora. O rastreador pode cobrar o fornecedor sozinho?"

**Resposta esperada:** não. O TAPI diz que os alertas orientam ações dos responsáveis e pede que o
projeto defina quem trata cada alerta; a Gestão Patrimonial é a principal área de negócio. O que
pode ser automático é o aviso (sinalizador, mensagem, registro); a ação sobre fornecedor ou
equipamento é humana. Essa fronteira é a decisão humana da etapa SP4.

**Erro comum:** automatizar tudo porque "o sistema já sabe". O sistema sabe o número de dias, sem
saber se há prazo renegociado, retirada autorizada ou erro de cadastro.

### 4. Bloco 3: quantos saltos a mensagem dá até o atuador?

"Do lacre rompido até o relé ligar, quantas vezes a mensagem muda de mãos?"

**Resposta esperada:** sete, contando o fio e a rede: sensor ao rastreador, rastreador ao broker,
broker à central e broker ao operador, operador ao broker, broker à central e central ao relé.
Cinco passam pela rede. Sem confirmação, a mensagem para no quarto salto e a central desarma.

**Erro comum:** contar dois saltos, rastreador e relé, como se o rastreador falasse direto com o
atuador. No MQTT toda mensagem passa pelo broker.

### 5. Laboratório: por que o setup desliga o relé antes do Wi-Fi?

"Se o relé começa desligado por padrão, por que escrever isso no setup?"

**Resposta esperada:** para que a placa reiniciada nunca acorde com a carga ligada, seja qual for
o estado do pino no boot ou o que chegar do broker logo na conexão. O estado seguro vem antes de
qualquer mensagem.

**Erro comum:** confiar no estado padrão do pino. A lógica do módulo pode ser invertida, como
mostra a contradição da documentação do relé do Wokwi.

### 6. Laboratório: por que a confirmação leva o id do alerta?

"Não bastaria publicar CONFIRMAR?"

**Resposta esperada:** não. Uma confirmação sem id vale para qualquer alerta, inclusive para um que
ainda nem aconteceu: uma mensagem retida no broker, uma confirmação atrasada ou a de outra dupla no
broker público disparariam o relé. Com o id, só a confirmação do alerta em vigor dispara.

**Erro comum:** achar que o broker só entrega mensagens do próprio grupo. O broker é público e
qualquer pessoa que souber o tópico publica nele; a autenticação é a Aula 11.

### 7. Bloco 5: o código da IA dispara sem confirmação?

"Onde, no código do Gemini, o relé liga? Que mensagem leva até ali?"

**Resposta esperada:** a dupla aponta cada `digitalWrite` que liga o relé e a condição que o
precede. Se qualquer mensagem no tópico liga o relé, ou se o alerta liga direto, o código dispara
sem confirmação. A evidência é o trecho marcado e o teste no Wokwi com uma mensagem qualquer.

**Erro comum:** aprovar o código porque ele compila e liga o relé. Compilar mostra que a sintaxe
está certa e nada diz sobre quem autorizou o disparo.

### 8. Bloco 6: se o Wi-Fi cair com o relé ligado, o que acontece?

"A central está em DISPARADO e o Wi-Fi cai. O relé desliga?"

**Resposta esperada:** não. O pino mantém o último estado e, no sketch do laboratório, o `loop`
fica preso tentando reconectar. A carga continua ligada sem supervisão. O desafio da aula trata
disso: com o relé ligado, a confirmação precisa ser renovada a cada 30 s, e a falta dela desliga a
carga.

**Erro comum:** supor que perder a rede desliga tudo. Falha de comunicação deixa o atuador no
último estado, e o projeto precisa decidir qual é o estado seguro.

### 9. Bloco 6: quem responde pela falha física?

"O sinalizador ligou sozinho na Gestão Patrimonial. De quem é a responsabilidade?"

**Resposta esperada:** de quem colocou o código no dispositivo, inclusive quando o código veio da
IA. A trilha de IA põe a "responsabilidade por falhas físicas e digitais" no bloco de Ética e pede
confirmação humana e simulação antes de agir sobre hardware. O registro no `PROCESSO.md` e no ADR
mostra quem revisou o quê.

**Erro comum:** atribuir a falha à ferramenta. A IA não assina o commit nem responde pela carga.

## Fechamento

Amarração: o disparo com confirmação entra no Código do projeto (peso 2) e o atuador remoto no
Protótipo físico do projeto (online) (peso 2), Sprint 4, etapa SP4 do DAIA-E. A Sprint Review 4 é
em 04/12. A Aula 10, em 03/12, integra o ciclo completo com testes em C++ e deep sleep.
