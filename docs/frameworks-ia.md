# Frameworks do projeto IA no Currículo aplicados ao M04

Síntese das fontes do projeto IA no Currículo lidas em 13/10/2026, com a forma como este acervo as
aplica. Cada framework tem duas partes: "Escrito na fonte", com citação curta e documento de
origem, e "Adaptação deste acervo", que é decisão nossa e pode ser revista.

Fontes:

| Documento | Data | Onde |
|---|---|---|
| Atas e transcrições dos workshops 1 a 4 | 06/08 a 27/08/2026 | Drive, notas do Gemini |
| Guia para Professores: Ensino com IA | 27/08 a 03/09/2026 | Drive `1UtIe2rjvrl5H5CoJwKZ3iUai6PUSlenHdBG-b0sR98o` |
| Proposta 1 - IA no Currículo | 21/09/2026 | Drive `1y0DZxAGOuv3lXYzYgcBBAzwuSyiTShuK` |
| Ponderadas_Computacao_M4_5C (Prof. Ovidio) | 13/10/2026 | Drive `1uUEJowhnhf88iM7C-_RTA0A-lyQDdVae` |
| Ementa e slides da trilha de IA | julho a setembro de 2026 | Drive, pasta do projeto |

A transcrição automática do Gemini atribui algumas falas à pessoa errada. Para autoria, este
documento segue os slides e o Guia, que creditam o 5C a Murilo Zanini e o DAIA-E a Afonso Brandão.

## 1. Framework 5C (Murilo Zanini)

### Escrito na fonte

Cinco etapas: Contextualizar, Consultar, Confrontar, Construir e Comprovar (Proposta 1). A tabela do
Guia ("Framework 5C-IA/PjBL") define, para cada etapa, o papel do aluno, o do professor e a
evidência mínima:

| Etapa | Aluno | Professor | Evidência mínima |
|---|---|---|---|
| Contextualizar | interpreta o problema, explicita requisitos e critérios de sucesso | entrega briefing, define limites de IA e testes de aceitação | mapa do problema, arquitetura inicial |
| Consultar | formula dúvida delimitada, pede hipóteses e não solução pronta | modela boas perguntas, aponta documentação primária | registro da dúvida, contexto e fonte |
| Confrontar | compara a resposta da IA com documentação, testes e medições | questiona pressupostos, pede contraprovas | fonte primária e teste que confirma ou rejeita |
| Construir | adapta, integra, refatora, justifica decisões | faz checkpoints, não entrega solução integral | artefato versionado e justificativa técnica |
| Comprovar | demonstra, explica, resolve variação sem IA | aplica rubrica, argui individualmente | demonstração, explicação e tarefa de transferência |

Decisão registrada na ata do workshop 3: "a reestruturação das atividades, ponderadas e artefatos
será realizada utilizando o framework 5C". O Guia propõe um "registro mínimo de interação com IA"
de cinco perguntas (dúvida, orientação recebida, verificação feita, aceita, modificada ou rejeitada,
e o que mudou no artefato). A reescrita das ponderadas do Prof. Ovidio usa outro instrumento:
`PROCESSO.md` com as cinco etapas e um ADR com uma sugestão de IA rejeitada ou corrigida, com a
justificativa "Registro autodeclarado de IA é inauditável" (Elkhodr e Gide, 2026).

Ressalva registrada no workshop 3: "a gente não precisa contextualizar tudo em termos dele".

### Adaptação deste acervo

- Todo laboratório `labs/aulaNN.html` tem uma seção por etapa, com `id` igual ao nome da etapa.
- Todo encontro tem ao menos um bloco de "Confronto com a IA": a IA propõe um valor ou uma
  explicação e a turma verifica contra datasheet, cálculo ou medição no simulador.
- O registro de uso de IA é o da reescrita do Prof. Ovidio (ADR-008), com modelos em
  `labs/modelos/PROCESSO.md` e `labs/modelos/ADR-uso-de-ia.md`.
- As ponderadas seguem os enunciados da reescrita 5C, com pesos citados da Adalove.

## 2. Framework DAIA-E (Afonso Brandão)

### Escrito na fonte

"DAIA-E, Desenvolvimento Assistido por Inteligência Artificial Orientado por Especificação"
(Proposta 1), em que "a geração de código é restringida por especificações previamente
estabelecidas e verificáveis". O Guia descreve cinco sprints "delimitadas por escopo, não por
tempo", em que "nenhuma baseline é encerrada sem uma decisão humana registrada":

| Sprint | Nome | Conteúdo, segundo o Guia |
|---|---|---|
| SP1 | Negócio (BABOK) | por que o sistema deve existir, para quem e com qual hipótese; modelo de negócio, IDEF0, direcionadores, mapa de stakeholders |
| SP2 | Requisitos (SWEBOK, ISO/IEC 25010:2023) | requisitos funcionais e não funcionais mensuráveis como cenários de qualidade, ligados por matriz de rastreabilidade |
| SP3 | Especificação técnica (SEBoK, ISO/IEC/IEEE 42010, RM-ODP) | arquitetura, decisões registradas, esqueleto do projeto, testes inicialmente falhos |
| SP4 | Implementação (SWEBOK) | código a partir da especificação, testes e refinamento até as metas ou até as limitações ficarem explícitas |
| SP5 | Demonstração e validação (SEBoK) | confronto com a hipótese inicial, release, roteiro de demonstração, evidências, métricas e limitações |

No workshop 4, Sergio Venancio sobre o M04: "o módulo quatro já meio que está preparado para isso",
e a cobrança passa a ser de "rastreabilidade de requisito" mais do que de código.

### Adaptação deste acervo

As sprints do M04 foram mapeadas para as etapas (tabela da seção 4 do `PLANO_DE_ENSINO.md`): a
sprint 1 cobre SP1 e o início de SP2, a sprint 2 fecha SP2, e as sprints 3, 4 e 5 correspondem a
SP3, SP4 e SP5. Cada aula declara sua etapa no planejamento e no slide de amarração, junto com a
decisão humana que aquele conteúdo prepara.

## 3. Trilha de uso de IA

### Escrito na fonte

Ementa de cinco blocos (fundamentos de LLMs; especificação e interação; revisão crítica de código
gerado; workflows e ferramentas agênticas; ética e responsabilidade). Ata do workshop 4: os blocos
de prática "serão incorporados diretamente nas atividades e projetos", com três blocos principais
de conteúdo (fundamentos, fluxo de trabalho, ética e responsabilidade), em "doses homeopáticas".
Conteúdo previsto para o M04 (Proposta 1 e comentário no Guia):

- Fundamentos: "Limites da geração de código diante de hardware, sinais e restrições físicas."
- Workflows: "O estudante avalia o risco antes de automatizar, define confirmações humanas e
  garante simulação e teste seguro antes de qualquer ação sobre hardware ou dados sensíveis."
- Ética: "Segurança de pessoas, equipamentos e ambiente. Dados sensíveis captados por sensores e
  biometria, segurança de dispositivos conectados e responsabilidade por falhas físicas e digitais."
- Ferramenta mínima: Gemini e Antigravity.

### Adaptação deste acervo

| Bloco | Aulas | Forma |
|---|---|---|
| Fundamentos | 01, 03, 05 | a IA analisa a foto de uma montagem ou propõe um valor físico, e a turma mede o erro |
| Workflows | 06, 09, 10 | confirmação humana e simulação no Wokwi antes de acionar atuador ou publicar dado |
| Ética e responsabilidade | 09, 11 | relé chaveando carga real, dado de localização de equipamento como dado sensível |

## 4. Outras decisões do grupo que afetam o acervo

- Avaliação individual com perguntas geradas a partir do GitLab e dos autoestudos de cada aluno
  (workshop 4); o `PROCESSO.md` e o ADR do aluno servem de roteiro de arguição.
- Review como rito técnico, sem pitch comercial (workshop 2).
- Simulador antes da bancada (workshop 2): todo laboratório roda no Wokwi antes do kit.
- Exercícios de hardware do Murilo usados como referência (workshop 3): "Super Máquina" com foto da
  montagem consultada na IA, "bichinho virtual" com sensor e display, MQTT com Node-RED local.
