# Plano de Ensino: Módulo 04 IN, Solução para IoT (Computação, Prof. Ovidio)

Este documento e o `PLANEJAMENTO_AULA_A_AULA.md` são a fonte da verdade do acervo. Nenhum deck,
material de apoio, página de referências, laboratório ou card do portal inventa data, título,
escopo ou peso de entrega: tudo desce destes dois arquivos, que por sua vez descem da planilha da
turma na Adalove (cronograma, autoestudos e pesos), da planilha "Revisão IN04 2026.2B" (links e
enunciados), da reescrita 5C das ponderadas feita pelo Prof. Ovidio e do TAPI da Cerradinho (escopo
do case). A planilha da turma e o TAPI não são versionados: a primeira tem dado pessoal de aluno e
o segundo tem seção de conteúdo restrito.

## 1. Identificação

| Campo | Valor |
|---|---|
| Módulo | 04 IN, Solução para IoT |
| Turma | GRAD IN04 · 2026-2B · T24 |
| Professor de Computação | Prof. Ovidio Lopes da Cruz Netto |
| Orientadora | Profa. Camila Naves Arantes |
| Período | 14/10/2026 a 18/12/2026 |
| Duração | 10 semanas, 5 sprints, 12 Encontros de Instrução de Computação |
| Parceiro do case | Cerradinho (bioenergia) |
| Projeto institucional | turma-piloto do projeto "IA no Currículo" (ver seção 5) |

## 2. O case: rastreamento de equipamentos em manutenção externa

**O que o TAPI pede.** A Cerradinho envia equipamentos industriais e agrícolas para reparo em
fornecedores externos e hoje acompanha cada remessa por registros e contatos manuais. O TAPI pede um
protótipo IoT reutilizável que acompanhe esses equipamentos, vincule cada ciclo à nota fiscal de
remessa, informe a última localização válida e gere alertas de permanência e de retirada ou
rompimento do lacre. Requisitos citados do TAPI: atualização semanal com frequência ajustável,
alerta de permanência configurável com referência inicial de 150 dias, prazo previsto registrado
para diferenciar atraso de permanência prolongada, armazenamento de eventos e envio posterior sem
conexão, exibição de bateria e última comunicação, resistência à água, fixação sem dano em
equipamento de referência de 1 × 1 × 1 m e API documentada para o BI.

**O que o TAPI exclui.** Posicionamento indoor preciso, rastreamento contínuo em tempo real,
integração produtiva com ERP ou BI corporativo, rastreamento de pessoas e certificação de hardware.

**O dispositivo é a espinha dorsal do módulo.** Cada aula acrescenta uma camada ao mesmo
rastreador:

| Aula | Camada do rastreador construída no encontro |
|---|---|
| 01 | LED de status indicando que o dispositivo está vivo: circuito, resistor e lei de Ohm |
| 02 | Lacre modelado como chave: violação aciona LED e buzzer, com debounce por RC e por firmware |
| 03 | ESP32 e máquina de estados do ciclo, com limiar de permanência configurável |
| 04 | Memória e ponteiros: buffer circular que guarda eventos sem conexão e os envia depois |
| 05 | ADC: tensão da bateria por divisor resistivo e acelerômetro detectando remoção |
| 06 | Wi-Fi e MQTT: publicação do evento do ciclo em JSON |
| 07 | Display I2C com dias fora, estado do lacre e bateria; PWM no indicador |
| 08 | RSSI em dBm, última comunicação e dashboard de acompanhamento |
| 09 | Alerta de permanência ou violação aciona atuador remoto via MQTT |
| 10 | Ciclo completo integrado, testes em C++ e deep sleep, com autonomia estimada |
| 11 | Segurança: autenticação, MQTT com TLS, credenciais fora do código |
| 12 | Revisão do rastreador contra os entregáveis finais |

**A restrição que organiza o módulo.** O TAPI pede comunicação "sem pressupor disponibilidade de
Wi-Fi corporativo nas oficinas". O kit e os autoestudos ensinam Wi-Fi e MQTT. Essa distância é
tratada como conteúdo nas Aulas 06 e 08, numa comparação entre Wi-Fi, LoRa e LTE-M/NB-IoT por
cobertura, consumo e custo, que alimenta a matriz comparativa de tecnologias que o TAPI lista entre
os entregáveis.

**Dados.** O TAPI classifica como restritos os cadastros, NFs, localizações e prazos da Cerradinho.
O acervo usa o conjunto fictício de `dados/`, gerado por `tools/gerar_dados_case.py` (ADR-006),
com três ciclos abertos fixados: permanência longa (190 dias fora), atraso sem permanência longa
(70 dias fora, prazo de 30) e ciclo no prazo (12 dias fora, prazo de 45).

## 3. Calendário

| Aula | Data | Semana | Sprint | Título na Adalove |
|---|---|---|---|---|
| 01 | 15/10 | Semana 01 | Sprint 1 | Programação em Arduino e Eletrônica Básica |
| 02 | 20/10 | Semana 02 | Sprint 1 | Sensores e Atuadores Básicos (Atividade Ponderada em Sala) |
| 03 | 22/10 | Semana 02 | Sprint 1 | Programação básica usada em microcontroladores |
| 04 | 30/10 | Semana 03 | Sprint 2 | Arquitetura de Microcontroladores e Ponteiros |
| 05 | 05/11 | Semana 04 | Sprint 2 | Sensores e processamento de valores de entrada analógicos para digital |
| 06 | 13/11 | Semana 05 | Sprint 3 | Comunicação à distância (Início de Atividade Ponderada) |
| 07 | 18/11 | Semana 06 | Sprint 3 | Atuadores e saídas informacionais |
| 08 | 27/11 | Semana 07 | Sprint 4 | Transmissão de Sinal e Dashboard (Atividade Ponderada em Sala) |
| 09 | 02/12 | Semana 08 | Sprint 4 | Sistema de disparo de atuadores |
| 10 | 03/12 | Semana 08 | Sprint 4 | Integração geral entre entrada, sensores e atuadores e a interface com o usuário |
| 11 | 10/12 | Semana 09 | Sprint 5 | Visão Geral sobre Segurança em IoT (Atividade Ponderada em Sala) |
| 12 | 17/12 | Semana 10 | Sprint 5 | Revisões finais do projeto |

Ritos de orientação: Sprint Review 1 em 23/10, 2 em 06/11, 3 em 19/11, 4 em 04/12; Prova do
Módulo em 11/12; Apresentação Final em 18/12.

## 4. Entregas do projeto e pesos

Pesos citados da planilha da turma na Adalove em 13/10/2026. A coluna "Etapa DAIA-E" é a
correspondência adotada por este acervo (ADR-007).

| Sprint | Etapa DAIA-E | Entrega | Peso |
|---|---|---|---|
| 1 | SP1 Negócio | Domínio dos fundamentos de negócio | 3 |
| 1 | SP1 Negócio | Domínio dos fundamentos da experiência de usuário - Personas | 1 |
| 1 | SP2 Requisitos | Protótipo inicial do projeto usando o simulador wokwi | 1 |
| 1 | SP2 Requisitos | Requisitos Funcionais, Regras de Negócio e Matriz de Rastreabilidade | 2 |
| 2 | SP2 Requisitos | Protótipo físico do projeto (offline) | 4 |
| 2 | SP2 Requisitos | Requisitos Não Funcionais | 2 |
| 2 | SP2 Requisitos | Domínio dos fundamentos da experiência de usuário - Jornada do Usuário e Storyboard | 2 |
| 3 | SP3 Especificação técnica | Protótipo do Projeto com MQTT e I2C | 3 |
| 3 | SP3 Especificação técnica | Metodologia e Arquitetura da solução | 3 |
| 3 | SP3 Especificação técnica | Circuito RC | 2 |
| 4 | SP4 Implementação | Protótipo físico do projeto (online) | 2 |
| 4 | SP4 Implementação | Código do projeto | 2 |
| 4 | SP4 Implementação | Manual de Instruções | 2 |
| 4 | SP4 Implementação | Arquitetura do protótipo | 2 |
| 4 | SP4 Implementação | Possibilidades de descarte | 1 |
| 5 | SP5 Demonstração e validação | Protótipo final do projeto | 3 |
| 5 | SP5 Demonstração e validação | Código do projeto (versão final) | 1 |
| 5 | SP5 Demonstração e validação | Arquitetura refinada da solução | 1 |
| 5 | SP5 Demonstração e validação | Manual de instruções revisado | 1 |
| 5 | SP5 Demonstração e validação | Critérios de qualidade GITHUB | 2 |
| 5 | | Prova do Módulo | 20 |

## 5. Frameworks do projeto IA no Currículo

A T24 é uma das duas turmas-piloto do projeto (Proposta 1, "Público: 2 turmas de 1º ano (T24 e
T26)"). O experimento compara turmas com a metodologia do projeto e turmas com a metodologia
tradicional, e as ponderadas são a métrica principal (ata do workshop 4). Três frameworks entram no
acervo, cada um numa escala:

| Framework | Autor | Escala | Uso no acervo |
|---|---|---|---|
| DAIA-E | Afonso Brandão | módulo | cada sprint corresponde a uma etapa; o slide de amarração declara a etapa e a decisão humana que fecha a baseline |
| 5C | Murilo Zanini | atividade | todo laboratório segue as cinco etapas; todo encontro tem ao menos um "Confronto com a IA"; o aluno registra o uso de IA em `PROCESSO.md` e ADR |
| Trilha de uso de IA | Flávia Santoro | módulo, compactada | doses curtas de fundamentos, workflows e ética presas ao conteúdo técnico |

A síntese completa, separando o que está escrito nas fontes do que é adaptação deste acervo, fica
em `docs/frameworks-ia.md`.

## 6. Ponderadas de Computação

Enunciados e baremas da reescrita 5C do Prof. Ovidio (`Ponderadas_Computacao_M4_5C.xlsx`), pesos
citados da Adalove (decisão de 13/10/2026, ADR-007). Onde as duas fontes divergem, a divergência é
uma pendência da seção 7.

| Semana | Aula | Atividade | Peso | Resumo do enunciado 5C | Item de comprovação idêntico entre turmas |
|---|---|---|---|---|---|
| 01 | 01 | Comece por aqui: Tutorial - LED interno (Tinkercad + Arduino IDE + GitHub) | 0 | contrato de uso de IA do módulo: desafio do tutorial com `PROCESSO.md` nas cinco etapas e explicação do nível lógico do LED interno (P1) | |
| 02 | 02 | Atividade ponderada de Computação 1 (em sala) | 3 | circuito RC de carga: constante de tempo prevista antes da medição, curva teórica e pontos medidos no mesmo gráfico, análise da divergência (P5) | pergunta de transferência respondida na hora, sem consulta |
| 03 | 04 | Semáforo offline | | plano semafórico por dígito do RA, previsão contra medição, cartão de falha sorteado e ADR com sugestão de IA rejeitada (P2, P6) | conjunto de cartões de falha |
| 05 | 06 | Atividade - Semáforo Inteligente | 2 | calibração do LDR em três condições, limiar e histerese derivados das medições e confrontados com o valor sugerido pela IA (P4) | |
| 07 | 08 | Atividade - Mapa de Calor calculando dBm de sinal WiFi | 2 | percurso por RA, previsão da ordem dos pontos, confronto do modelo de propagação da IA com os dados medidos | pergunta de leitura numérica |
| 09 | 11 | Visão Geral sobre Segurança em IoT (Atividade Ponderada em Sala) | 2 | modelo de ameaça declarado antes, lista bruta da IA sem edição, triagem com descartes justificados, defesa oral da ordem de risco | |

### 6.1 Barema da ponderada da semana 02 (reescrita 5C)

Transcrito da `Ponderadas_Computacao_M4_5C.xlsx` (Prof. Ovidio, Drive
`1uUEJowhnhf88iM7C-_RTA0A-lyQDdVae`) em 13/10/2026. Total de 10 pontos; cada item é avaliado como
contempla, contempla parcialmente ou não contempla. A Adalove não tem barema para esta atividade
(P5).

| Etapa do 5C | Item | Pontos | Regra registrada na fonte |
|---|---|---|---|
| Contextualizar | previsão teórica entregue antes da medição | 2,0 | previsão entregue depois da medição recebe zero |
| Construir | coleta de dados | 2,0 | pontos suficientes, com amostragem concentrada no trecho inicial e tabela com unidades |
| Confrontar | gráfico sobreposto e constante experimental | 2,0 | constante extraída dos dados, sem cópia da teoria |
| Comprovar | análise da divergência | 2,5 | respostas genéricas do tipo erro de medição, sem mecanismo físico nomeado, recebem metade |
| Comprovar | pergunta de transferência respondida em sala | 1,5 | resposta parcialmente correta com raciocínio visível recebe metade |

### 6.2 Barema da ponderada da semana 05 (reescrita 5C)

Transcrito da aba Baremas da `Ponderadas_Computacao_M4_5C.xlsx` em 13/10/2026. Na reescrita a
atividade se chama "Atividade - Semáforo com dois modos de operação"; na Adalove, "Atividade -
Semáforo Inteligente", peso 2. Total de 10 pontos; cada item é avaliado como contempla, contempla
parcialmente ou não contempla. A atividade é iniciada em sala, porque depende de montagem física e
de medição com o sensor.

Divergência com a Adalove (P4): o barema da Adalove dá 3 pontos à configuração da interface online
(interatividade e estética) e 1 ponto à eficiência do código, além de 1 ponto extra pela conexão
dos dois semáforos a um dashboard. A reescrita tira a interface online e a publicação dos dados
desta ponderada e as leva para o artefato da sprint 4. A Aula 06 segue a reescrita.

O enunciado da reescrita também prevê o plano semafórico por dígito do RA (vermelho de 5 s mais o
dígito, verde de 3 s mais a metade do dígito arredondada para baixo, amarelo de 2 s) e um cartão de
falha sorteado no item Comprovar, cujo conjunto ainda não foi produzido (P6).

| Etapa do 5C | Item | Pontos | Regra registrada na fonte |
|---|---|---|---|
| Construir | montagem e integração do LDR | 1,5 | LDR conectado corretamente com o divisor de tensão adequado, leitura chegando ao microcontrolador de forma estável |
| Construir | lógica do semáforo e modo noturno | 1,5 | as fases do semáforo continuam corretas e o modo noturno altera o comportamento conforme especificado |
| Confrontar | tabela de calibração | 2,0 | as três condições medidas, com os valores brutos do conversor; tabela ausente ou com valores redondos sem medição recebe zero |
| Contextualizar e Confrontar | limiar e histerese justificados | 2,0 | limiares de entrada e saída derivados das medições do próprio grupo, critério de aceitação declarado antes, divergência do valor sugerido pela IA explicada |
| Comprovar | demonstração de robustez | 2,0 | vídeo com a transição provocada devagar em torno do limiar, sem oscilação, e explicação correta de por que a histerese resolve |
| Comprovar (registro individual) | decisão própria e sugestão de IA rejeitada ou corrigida | 1,0 | registro individual de uma decisão com alternativa considerada e de uma sugestão de IA rejeitada ou corrigida, com razão técnica |

### 6.3 Barema da ponderada da semana 07 (reescrita 5C)

"Atividade - Mapa de Calor calculando dBm de sinal WiFi", transcrito da
`Ponderadas_Computacao_M4_5C.xlsx` (Prof. Ovidio) em 13/10/2026. Total de 10 pontos; cada item é
avaliado como contempla, contempla parcialmente ou não contempla. A reescrita registra peso 3 e a
Adalove peso 2; o acervo cita a Adalove (P3). O percurso de cada aluno sai da tabela de percursos
por dígito do RA, ainda não produzida (P6), e a pergunta de leitura numérica é item idêntico entre
turmas (P8).

| Etapa do 5C | Item | Pontos | Regra registrada na fonte |
|---|---|---|---|
| Construir | pipeline completo funcionando | 2,0 | ESP32 no Wi-Fi, dBm na porta serial, MQTT publicando e reação visível na plataforma online; sem publicação, no máximo metade |
| Contextualizar | previsão registrada antes da coleta | 1,5 | ordem dos cinco pontos escrita antes de medir, justificada por distância, obstáculos ou material, e diferença perceptível em dB declarada |
| Construir | coleta do percurso do seu RA | 2,0 | cinco pontos do percurso correto e bloqueio no elevador registrado na plataforma e visível no vídeo; percurso de outro RA recebe zero |
| Confrontar | modelo de propagação contra dados medidos | 2,5 | modelo da IA aplicado aos dados reais, com ao menos uma premissa não sustentável no ambiente interno e a evidência nos dados; reproduzir o modelo sem confrontar recebe no máximo um terço |
| Comprovar | leitura numérica no vídeo | 1,0 | dois valores medidos lidos e interpretados, com o significado correto de uma queda de 3 dB em potência |
| Comprovar (registro individual) | decisão própria e sugestão de IA rejeitada ou corrigida | 1,0 | decisão técnica com alternativa considerada e sugestão de IA rejeitada ou corrigida, com razão técnica |

## 7. Pendências

P1 a P9 enviadas ao Prof. Ovidio em 13/10/2026; P10 registrada na construção da Aula 12. Até a resposta, o acervo segue a decisão entre parênteses.

| Nº | Pendência |
|---|---|
| P1 | O Tutorial LED da semana 1 tem peso 0 na Adalove e é tratado como ponderada na reescrita 5C (a Aula 01 apresenta o contrato de uso de IA sem afirmar peso). |
| P2 | O Semáforo offline da semana 3 não existe no LBL da T24 (a Aula 04 não depende dele). |
| P3 | Os pesos divergem entre o Leia-me da reescrita 5C, a coluna de peso da reescrita e a Adalove (o acervo cita a Adalove). |
| P4 | A reescrita 5C tira a interface online do Semáforo Inteligente, e a Adalove ainda a cobra (a Aula 06 segue a reescrita e registra a divergência). |
| P5 | A ponderada da semana 2 não tem barema na Adalove (a Aula 02 usa o barema 5C). |
| P6 | Faltam os insumos da reescrita 5C: planos semafóricos por RA, cartões de falha e percursos Wi-Fi por RA (as aulas não os citam até existirem). |
| P7 | O broker de sala não está definido entre Ubidots, Adafruit IO e Raspberry Pi local (os laboratórios usam broker público acessível pelo Wokwi). |
| P8 | A turma de controle do experimento e a lista final de itens de comprovação idênticos não estão confirmadas (o acervo mantém os três itens da reescrita 5C). |
| P9 | Há erros de cadastro de autoestudos na Adalove, listados na coluna Observação de `docs/autoestudos-por-semana.md` (a seção Preparação de cada aula cobre o conteúdo que falta). |
| P10 | Os "Critérios de qualidade GITHUB" (entrega da Sprint 5, peso 2) não estão descritos em nenhuma fonte do acervo nem na revisão IN04 (a Aula 12 manda conferir o repositório contra o card da Adalove, sem inventar critérios). |
