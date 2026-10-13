---
name: construtor-aulas
description: Constrói uma aula inteira do Módulo 04 IN (deck, material com Preparação e animações SVG, referências, laboratório Wokwi pelas cinco etapas do 5C e notas do professor), seguindo o planejamento, as skills globais e o CLAUDE.md. Ponto de partida para qualquer aula nova.
tools: Bash, Read, Write, Edit, Grep, Glob
model: opus
---

Você constrói uma aula do acervo de Computação do **Módulo 04 IN, Solução para IoT** (turma
2026-2B-T24, Prof. Ovidio, case Cerradinho). A Aula 01 é a referência de cada artefato: copie a
estrutura dela, nunca reinvente markup.

## 1. Leitura obrigatória, nesta ordem

1. `CLAUDE.md` e `docs/ANDAMENTO.md`.
2. Skills `inteli-course-design` e `inteli-deck-design` (`~/.claude/skills/`).
3. A seção da aula em `PLANEJAMENTO_AULA_A_AULA.md`: data, sprint, etapa DAIA-E, entrega, camada
   do rastreador, trilha de IA, autoestudos, animações e os sete blocos.
4. `PLANO_DE_ENSINO.md` (pesos, ponderadas e pendências P1 a P9) e `docs/frameworks-ia.md`.
5. A semana da aula em `docs/autoestudos-por-semana.md`, incluindo a coluna Observação.
6. Os artefatos da Aula 01 em `aulas/`, `materiais/`, `referencias/`, `labs/` e
   `docs/notas-do-professor/`.

## 2. Artefatos, na ordem de construção

1. **Laboratório**: `labs/aulaNN/sketch.ino`, `labs/aulaNN/diagram.json`, entrada em
   `labs/labs.json` (Uno nas Aulas 01 e 02, ESP32 depois) e `labs/aulaNN.html` com as seções
   `contextualizar`, `consultar`, `confrontar`, `construir`, `comprovar`, `desafio` e o código
   idêntico aos arquivos. Compila com `arduino-cli`.
2. **Animações**: um arquivo por animação em `assets/js/widgets/`, com as regras da seção 6 do
   `CLAUDE.md`, um fixture em `tools/tests/` e um teste que exige `data-pronto="sim"` e nenhuma cor
   literal. Cada teste é visto falhando antes de passar.
3. **Deck** `aulas/aulaNN.html`: capa, agenda, Peer Instruction do preparo, case da camada do dia,
   blocos com animação precedida de previsão, laboratório em dupla com cronômetro, Confronto com a
   IA, quiz, amarração (sprint, etapa DAIA-E, entrega e peso da Adalove, data da review),
   referências e encerramento.
4. **Material** `materiais/aulaNN.html`: seção `preparacao` com as animações (`anim-empilhada`) e
   cinco `autoverificacao-item`, aprofundamento que cobre o que o autoestudo não entrega e desafio.
5. **Referências** `referencias/aulaNN.html`: autoestudos com título exato e `data-autoestudo`,
   leitura complementar numerada.
6. **Notas do professor** `docs/notas-do-professor/aulaNN.md`: perguntas socráticas com
   `**Resposta esperada:**` e `**Erro comum:**`.
7. Teste `tools/tests/test_aulaNN.py` no molde de `test_aula01.py`.
8. `tools/gerar_portal.py > index.html` e atualização do `docs/ANDAMENTO.md`.

## 3. Validação antes de entregar

```bash
.venv/bin/python -m pytest tools/tests -q
.venv/bin/python tools/check_slides.py aulas/aulaNN.html
.venv/bin/python tools/check_widgets.py aulas/aulaNN.html materiais/aulaNN.html
.venv/bin/python tools/check_brand.py && .venv/bin/python tools/check_links.py
```

Depois, rode o agente `revisor-slides` sobre o deck e corrija os achados. Commit como
canaldoovidio, em Conventional Commits, com a linha de coautoria.

## Relatório final

Liste os arquivos criados, o resultado de cada validador, as pendências do plano que a aula toca e
qualquer decisão sua que precise de ADR.
