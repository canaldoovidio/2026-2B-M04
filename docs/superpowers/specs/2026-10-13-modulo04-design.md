# Design do acervo do Módulo 04 IN, Solução para IoT

**Data:** 13/10/2026
**Status:** em revisão
**Decisores:** Prof. José Romualdo, para as aulas do Prof. Ovidio Lopes da Cruz Netto
**Repositório:** `canaldoovidio/2026-2B-M04`, publicado no GitHub Pages

## 1. Objetivo

Construir o acervo dos 12 Encontros de Instrução de Computação do Prof. Ovidio na turma GRAD IN04
2026-2B-T24 (15/10 a 17/12/2026), no mesmo padrão do acervo `2026-2A-M03`, ancorado no case da
Cerradinho e incorporando os frameworks definidos pelo projeto "IA no Currículo", do qual a T24 é
turma-piloto.

Critério de sucesso: cada aula chega ao aluno pelo menos uma semana antes da data, com seus
artefatos validados por teste, e a Aula 01 fica pronta até 14/10/2026.

## 2. Fontes e o que cada uma autoriza

| Fonte | Onde fica | O que autoriza |
|---|---|---|
| `Turma (4).xlsx` (Adalove, GRAD IN04 2026-2B) | fora do git, dado pessoal de aluno | datas, títulos dos encontros, títulos dos autoestudos, pesos de entrega |
| Planilha "Revisão IN04 2026.2B" (Drive `19mabLbEgluztdYBtLU-cZda2uo4sc49OE5gyTVLl4Tw`) | Drive | URL, descrição e barema de cada autoestudo e ponderada |
| `Ponderadas_Computacao_M4_5C.xlsx` (Drive `1uUEJowhnhf88iM7C-_RTA0A-lyQDdVae`, dono Ovidio) | Drive | enunciados e baremas das ponderadas pelo 5C |
| TAPI Cerradinho (`TAPI_Cerradinho_Rastreamento_Ativos_IoT-Vfinal.docx`) | fora do git, conteúdo restrito | escopo, requisitos e restrições do case |
| Guia para Professores: Ensino com IA, Proposta 1 IA no Currículo, atas dos workshops 1 a 4 | Drive | frameworks 5C, DAIA-E e trilha de IA |

Os derivados publicáveis entram no repositório: `PLANO_DE_ENSINO.md`,
`PLANEJAMENTO_AULA_A_AULA.md`, `docs/autoestudos-por-semana.md` (gerado por script a partir da
planilha) e `docs/frameworks-ia.md` (síntese citada das fontes do projeto IA no Currículo).

## 3. Calendário das aulas

| Aula | Data | Semana | Sprint | Título na Adalove |
|---|---|---|---|---|
| 01 | 15/10 | 01 | 1 | Programação em Arduino e Eletrônica Básica |
| 02 | 20/10 | 02 | 1 | Sensores e Atuadores Básicos (Atividade Ponderada em Sala) |
| 03 | 22/10 | 02 | 1 | Programação básica usada em microcontroladores |
| 04 | 30/10 | 03 | 2 | Arquitetura de Microcontroladores e Ponteiros |
| 05 | 05/11 | 04 | 2 | Sensores e processamento de valores de entrada analógicos para digital |
| 06 | 13/11 | 05 | 3 | Comunicação à distância (Início de Atividade Ponderada) |
| 07 | 18/11 | 06 | 3 | Atuadores e saídas informacionais |
| 08 | 27/11 | 07 | 4 | Transmissão de Sinal e Dashboard (Atividade Ponderada em Sala) |
| 09 | 02/12 | 08 | 4 | Sistema de disparo de atuadores |
| 10 | 03/12 | 08 | 4 | Integração geral entre entrada, sensores e atuadores e a interface com o usuário |
| 11 | 10/12 | 09 | 5 | Visão Geral sobre Segurança em IoT (Atividade Ponderada em Sala) |
| 12 | 17/12 | 10 | 5 | Revisões finais do projeto |

As sprints fecham nas reviews de 23/10, 06/11, 19/11 e 04/12, e na Apresentação Final de 18/12. A
Prova do Módulo (peso 20) acontece em 11/12, um dia depois da Aula 11.

## 4. O case: rastreador da Cerradinho

O TAPI pede um protótipo IoT reutilizável que acompanhe equipamentos enviados à manutenção externa,
vincule cada ciclo à NF de remessa, informe a última localização válida e gere alertas de
permanência (referência inicial de 150 dias, configurável) e de retirada ou rompimento do lacre,
com atualização semanal, armazenamento local sem conexão e API para BI.

**O dispositivo é a espinha dorsal do módulo.** Cada aula acrescenta uma camada ao mesmo
rastreador, e o aluno sai do encontro com essa camada funcionando no simulador:

| Aula | Camada do rastreador construída no encontro |
|---|---|
| 01 | LED de status indicando que o dispositivo está vivo: circuito, resistor e lei de Ohm |
| 02 | Lacre modelado como chave: violação aciona LED e buzzer, com debounce por RC e por firmware |
| 03 | ESP32 e máquina de estados do ciclo (cadastrado, em trânsito, no fornecedor, retornado), com limiar de permanência configurável |
| 04 | Memória e ponteiros: buffer circular que guarda eventos sem conexão e os envia depois |
| 05 | ADC: tensão da bateria por divisor resistivo e acelerômetro detectando remoção do equipamento |
| 06 | Wi-Fi e MQTT: publicação do evento do ciclo em JSON |
| 07 | Display I2C com dias fora, estado do lacre e bateria; PWM no indicador |
| 08 | RSSI em dBm, última comunicação e dashboard de acompanhamento |
| 09 | Alerta de permanência ou violação aciona atuador remoto via MQTT |
| 10 | Ciclo completo integrado, testes em C++ e deep sleep, com autonomia estimada a partir do consumo medido |
| 11 | Segurança: autenticação, MQTT com TLS, credenciais fora do código e o conteúdo restrito do TAPI |
| 12 | Revisão do rastreador contra os entregáveis finais do projeto |

**A restrição do TAPI que vira conteúdo.** O TAPI não pressupõe Wi-Fi corporativo nas oficinas dos
fornecedores e exclui posicionamento indoor preciso. O kit e os autoestudos do módulo ensinam
Wi-Fi e MQTT. Essa distância entre o que se ensina e o que o campo exige é discutida na Aula 06 e
na Aula 08 como comparação técnica entre Wi-Fi, LoRa e LTE-M/NB-IoT (cobertura, consumo, custo),
e alimenta a matriz comparativa de tecnologias que o TAPI pede como entregável.

**Dados do case.** O TAPI classifica como restritos os cadastros, NFs, localizações, rotas e prazos
da Cerradinho, e os dados da última safra ainda não foram disponibilizados. O acervo usa um
conjunto fictício gerado por `tools/gerar_dados_case.py` com semente fixa, registrado em ADR:

| Arquivo | Conteúdo |
|---|---|
| `dados/equipamentos.csv` | 16 equipamentos fictícios, com tipo, dimensões e identificador |
| `dados/fornecedores.csv` | fornecedores fictícios, com cidade genérica e prazo médio |
| `dados/ciclos.csv` | ciclos de remessa: NF fictícia, saída, prazo previsto, retorno, dispositivo vinculado |
| `dados/leituras.csv` | leituras semanais: posição aproximada, bateria, RSSI, horário da última comunicação |
| `dados/eventos_lacre.csv` | eventos de lacre: violação, retirada autorizada, reaplicação |

Invariantes travados em teste: entre 10 e 20 equipamentos (exigência do MVP do TAPI); nenhum
dispositivo vinculado a dois ciclos simultâneos; retorno nunca anterior à saída; presença de
ciclos em atraso (passaram do prazo previsto) separados de ciclos de permanência longa (passaram
de 150 dias), porque o TAPI pede que as duas coisas sejam analisadas separadamente; geração
determinística (mesma semente, mesmo arquivo). Se a Cerradinho liberar dado anonimizado, ele
substitui o fictício por nova ADR.

## 5. Frameworks do projeto IA no Currículo

A T24 é turma-piloto. O experimento compara turmas com a metodologia do projeto e turmas com a
metodologia tradicional, e as ponderadas são a métrica principal. Três frameworks entram no
acervo, cada um numa escala diferente.

### 5.1 DAIA-E (Afonso Brandão) organiza as sprints

Desenvolvimento Assistido por IA Orientado por Especificação: cinco etapas delimitadas por escopo,
cada uma fechada por uma decisão humana registrada (baseline). As entregas do M04 já seguem essa
sequência, e o acervo explicita a correspondência:

| Sprint do M04 | Etapa DAIA-E | Entregas da sprint (pesos da Adalove) |
|---|---|---|
| 1 | SP1 Negócio e início de SP2 | Domínio dos fundamentos de negócio (3); Personas (1); Protótipo inicial no Wokwi (1); Requisitos Funcionais, Regras de Negócio e Matriz de Rastreabilidade (2) |
| 2 | SP2 Requisitos | Protótipo físico offline (4); Requisitos Não Funcionais (2); Jornada do Usuário e Storyboard (2) |
| 3 | SP3 Especificação técnica | Protótipo com MQTT e I2C (3); Metodologia e Arquitetura da solução (3); Circuito RC (2) |
| 4 | SP4 Implementação | Protótipo físico online (2); Código do projeto (2); Manual de Instruções (2); Arquitetura do protótipo (2); Possibilidades de descarte (1) |
| 5 | SP5 Demonstração e validação | Protótipo final (3); Código final (1); Arquitetura refinada (1); Manual revisado (1); Critérios de qualidade GITHUB (2) |

Consequência para as aulas: o slide de amarração de cada encontro declara a etapa DAIA-E da
sprint e qual decisão humana aquele conteúdo prepara. Exemplo: a Aula 05 produz requisitos não
funcionais mensuráveis do rastreador (autonomia, intervalo de atualização, alcance) ligados à
matriz de rastreabilidade.

### 5.2 5C (Murilo Zanini) estrutura cada atividade

Contextualizar, Consultar, Confrontar, Construir e Comprovar, com papel do aluno, papel do professor
e evidência mínima em cada etapa (Guia para Professores, tabela do 5C-IA/PjBL).

- **Laboratório.** Todo laboratório Wokwi traz as cinco etapas explícitas no enunciado.
- **Encontro.** Pelo menos um bloco por aula demonstra Confrontar ao vivo: a IA propõe um valor
  (resistor, limiar do LDR, modelo de propagação) e a turma verifica contra datasheet, cálculo ou
  medição no simulador.
- **Registro de uso de IA.** O aluno entrega `PROCESSO.md` com as cinco etapas e um ADR com uma
  sugestão da IA que ele rejeitou ou corrigiu, conforme a planilha 5C do Ovidio (decisão de
  13/10/2026). O acervo fornece os dois modelos em `labs/modelos/`.
- **Ponderadas.** Enunciados e baremas da reescrita 5C do Ovidio; pesos citados da Adalove. As
  divergências entre as duas fontes ficam registradas como pendência (seção 11).

### 5.3 Trilha de uso de IA, compactada no M04

Três blocos, em doses curtas presas ao conteúdo técnico de cada aula, com Gemini e Antigravity como
ferramenta mínima:

| Bloco | Conteúdo previsto para o M04 (Proposta 1 e Guia) | Onde entra |
|---|---|---|
| Fundamentos | limites da geração de código diante de hardware, sinais e restrições físicas | Aulas 01, 03 e 05 |
| Workflows | firmware, logs, testes e monitoramento com confirmação humana e simulação antes de agir sobre hardware | Aulas 06, 09 e 10 |
| Ética e responsabilidade | segurança de pessoas e equipamentos, dados sensíveis captados por sensores, responsabilidade por falhas físicas | Aulas 09 e 11 |

A síntese citada dos três frameworks fica em `docs/frameworks-ia.md`, separando o que está escrito
nas fontes do que é adaptação deste acervo.

## 6. Sala de aula invertida em três tempos

Adotado do acervo do LBL 08 (`2026-2B-M08`, ADR-004):

| Tempo | Onde vive | Conteúdo |
|---|---|---|
| Antes | autoestudos na Adalove e seção "Preparação" do material de apoio | autoestudos da semana, duas a três animações interativas do conceito central, autoverificação de cinco perguntas sem nota |
| Durante | deck e laboratório | Peer Instruction de abertura medindo o preparo, blocos de até 15 minutos com prever, observar e explicar sobre as animações, prática em dupla no Wokwi, Confrontar do 5C ao vivo |
| Depois | material de apoio, laboratório e slide de amarração | avanço do artefato da sprint, desafio "ir além" do laboratório, leitura complementar |

O encontro mantém 2 horas: 15 minutos de daily e 105 minutos em sete blocos de até 15 minutos, cada
um fechando em interação nomeada.

**A Preparação cobre o que o autoestudo não entrega.** A validação dos autoestudos (13/10/2026)
mostrou cards que usam outra placa (Arduino Uno ou ESP8266 onde a aula usa ESP32) e cards cujo
conteúdo não corresponde ao título. A Preparação de cada aula trata a diferença de forma explícita
(por exemplo, ADC de 10 bits no Uno contra 12 bits no ESP32) e cobre o conceito que faltou. A
relação completa vive em `docs/autoestudos-por-semana.md`, com uma coluna de observação por card.

## 7. Linguagem e animações

**Tom didático.** Cada conceito entra por uma analogia concreta antes da fórmula (corrente como
vazão, resistor como estreitamento do cano, ADC como régua com marcas), seguida da aplicação ao
rastreador. As regras editoriais globais continuam valendo: títulos que afirmam o achado ou
descrevem o slide de referência, sem frase de efeito, sem paralelismo, sem travessão em dash, sem
emoji, acentuação completa.

**Animações em SVG com JavaScript puro**, sem biblioteca, com cor lida dos tokens do tema e fonte da
marca. Cada animação é interativa (controle deslizante, botões de passo, pausa) e funciona como
prever, observar e explicar: a tela pede a previsão antes do controle ser usado. Contrato de
montagem herdado do runtime de widgets do M08 (`data-widget`, `data-pronto="sim"`), validado por
`tools/check_widgets.py`. O protótipo aprovado em 13/10/2026 (corrente no LED em função do
resistor) é a referência visual.

Animações previstas por aula (duas a três cada, refinadas no planejamento aula a aula):

| Aula | Animações |
|---|---|
| 01 | corrente no LED em função do resistor; protoboard por dentro; ciclo `setup` e `loop` |
| 02 | bounce do botão no tempo; carga e descarga do RC com constante de tempo |
| 03 | máquina de estados do ciclo do equipamento; contador de dias contra o limiar |
| 04 | memória do ESP32 com ponteiro percorrendo um buffer circular |
| 05 | quantização do ADC em 10 e 12 bits; divisor de tensão da bateria; eixos do acelerômetro |
| 06 | publicação e assinatura no broker MQTT; alcance comparado de Wi-Fi, LoRa e LTE-M |
| 07 | ciclo de trabalho do PWM; endereçamento no barramento I2C |
| 08 | escala logarítmica de dBm; atenuação do sinal por distância e obstáculo |
| 09 | relé chaveando carga; caminho do alerta do sensor ao atuador remoto |
| 10 | consumo em deep sleep contra ativo e autonomia resultante |
| 11 | superfície de ataque do dispositivo; handshake TLS simplificado |
| 12 | linha do tempo do rastreador do módulo |

## 8. Artefatos de cada aula

| Artefato | Arquivo | Papel |
|---|---|---|
| Deck | `aulas/aulaNN.html` | o encontro, Reveal.js 1280x720 com o tema do M03 |
| Material de apoio | `materiais/aulaNN.html` | seção Preparação (animações e autoverificação), aprofundamento e desafio |
| Referências | `referencias/aulaNN.html` | autoestudos da semana com título exato e URL, leitura complementar numerada |
| Laboratório | `labs/aulaNN/sketch.ino`, `labs/aulaNN/diagram.json`, `labs/aulaNN.html` | projeto Wokwi do encontro: código, circuito, passo a passo pelas cinco etapas do 5C e desafio |
| Notas do professor | `docs/notas-do-professor/aulaNN.md` | perguntas socráticas, resposta esperada e erro comum; interno |

Plataforma do laboratório: Arduino Uno nas Aulas 01 e 02 (os autoestudos da semana 1 usam Uno com
Tinkercad e Arduino IDE), ESP32 a partir da Aula 03 (o autoestudo da semana 2 apresenta o Wokwi com
ESP32). Os laboratórios com MQTT usam broker público acessível pelo Wokwi; o broker local em
Raspberry Pi citado no workshop 2 fica como alternativa de sala, pendente de confirmação.

O portal `index.html` agrupa as aulas por sprint, com os cinco botões por aula, desabilitados
enquanto o artefato não existe.

## 9. Estrutura do repositório

```
index.html                     portal
PLANO_DE_ENSINO.md             case, calendário, entregas e pesos, frameworks, pendências
PLANEJAMENTO_AULA_A_AULA.md    roteiro minuto a minuto das 12 aulas
aulas/  materiais/  referencias/  labs/
assets/{css,js,img}/           tema do M03, runtime de widgets do M08, animações
dados/                         conjunto fictício do case e README
docs/adrs/                     decisões
docs/autoestudos-por-semana.md docs/frameworks-ia.md docs/ANDAMENTO.md
docs/notas-do-professor/
tools/                         validadores, geradores, testes
.github/workflows/             validate.yml e Pages
.claude/                       agentes construtor-aulas e revisor-slides, hook de validação
```

## 10. Verificação

| Teste | O que garante |
|---|---|
| `check_brand.py`, `check_slides.py`, `check_links.py` (herdados do M03) | paleta, tipografia, layout 1280x720, links locais |
| `check_widgets.py` (herdado do M08) | toda animação declarada monta e o console fica sem erro |
| `test_dados_case.py` | invariantes do conjunto fictício da seção 4 |
| `test_extrair_autoestudos.py` | o derivado bate com a planilha nos títulos e semanas |
| `test_planejamento.py` | regra dos 15 minutos, autoestudo citado com título exato, peso citado igual ao da fonte, etapa DAIA-E declarada por aula |
| `test_labs.py` | cada laboratório tem sketch e diagrama válidos, cobre as cinco etapas do 5C e compila com `arduino-cli` para a placa declarada |

Cada teste de proteção é visto falhando uma vez antes de ser aceito, e nenhum validador lê "nada
medido" como sucesso (`inteli-course-design`, seção 8). O CI instala `arduino-cli` com os cores
AVR e ESP32 em cache.

## 11. Pendências registradas para o Prof. Ovidio

Enviadas em 13/10/2026; até a resposta, o acervo segue as decisões entre parênteses.

1. Tutorial LED da semana 1 com peso 0 na Adalove, tratado como ponderada na planilha 5C (a Aula 01
   apresenta o contrato de uso de IA sem afirmar peso).
2. Semáforo offline da semana 3 ausente do LBL da T24 (a Aula 04 não depende dele).
3. Pesos divergentes entre o Leia-me da planilha 5C, a coluna de peso e a Adalove (o acervo cita
   a Adalove).
4. Interface online do Semáforo: removida na reescrita 5C, ainda cobrada na Adalove (a Aula 06 segue
   a reescrita e registra a divergência).
5. Ponderada da semana 2 sem barema na Adalove (a Aula 02 usa o barema 5C).
6. Insumos da reescrita 5C ainda a produzir: planos semafóricos por RA, cartões de falha, percursos
   Wi-Fi por RA.
7. Broker de sala: Ubidots, Adafruit IO ou Raspberry Pi local.
8. Turma de controle do experimento e itens de comprovação idênticos entre turmas.
9. Correções de cadastro de autoestudos na Adalove.

## 12. Ordem de construção

**Fase 1, até 14/10/2026.** Fundação do repositório (tema, validadores, runtime de widgets, CI,
agentes), `PLANO_DE_ENSINO.md`, `PLANEJAMENTO_AULA_A_AULA.md` completo das 12 aulas,
`docs/autoestudos-por-semana.md`, `docs/frameworks-ia.md`, gerador de dados com testes, ADRs de
fundação, portal e Aula 01 completa.

**Fase 2, uma aula por vez na ordem do calendário**, cada uma pronta pelo menos uma semana antes da
data. A semana 2 é a exceção: com a Aula 01 em 15/10, as Aulas 02 (20/10) e 03 (22/10) ficam
prontas até 17/10, com menos de uma semana de antecedência. A partir da Aula 04, vale a regra. As pendências da seção 11 entram na aula afetada assim que respondidas.

## 13. ADRs de fundação

| ADR | Decisão |
|---|---|
| ADR-001 | Reveal.js com o tema Inteli herdado do M03 |
| ADR-002 | Platypi no lugar da Azurio |
| ADR-003 | Cinco artefatos por aula, com laboratório Wokwi no lugar do notebook |
| ADR-004 | Sala de aula invertida em três tempos |
| ADR-005 | Animações interativas em SVG com JavaScript puro |
| ADR-006 | Conjunto de dados fictício do case por restrição do TAPI |
| ADR-007 | Frameworks do projeto IA no Currículo: DAIA-E nas sprints, 5C nas atividades, trilha compactada |
| ADR-008 | Registro de uso de IA por PROCESSO.md e ADR |

## 14. Fora de escopo

Aulas dos demais professores do módulo (Negócios, UX, Matemática e Física, Liderança); correção de
cards na Adalove; produção dos insumos sorteáveis da reescrita 5C antes da confirmação do Ovidio;
hardware real além do que o simulador cobre.
