# ADR-010: Gabarito distribuído nos quizzes e registro de IA no início do laboratório

**Data:** 17/10/2026
**Status:** Aceita
**Decisores:** Prof. José Romualdo, a partir do retorno do Prof. Ovidio Lopes da Cruz Netto sobre a Aula 01

## Contexto

O Prof. Ovidio relatou dois problemas depois da Aula 01 (15/10/2026). Primeiro, todas as perguntas de
checkpoint tinham a resposta certa na alternativa A; a medição confirmou o mesmo padrão nos 42 quizzes
das 12 aulas. Segundo, no laboratório a seção "Registro do uso de IA" era a última (item 8), e os
alunos, que seguiram o roteiro em ordem, só souberam do `PROCESSO.md` no fim, embora cada etapa do 5C
peça um registro nele.

## Decisão

A resposta certa de cada quiz fica numa posição sorteada com semente fixa, sem repetir a posição em
dois quizzes seguidos, e a seção "Registro do uso de IA" passa a ser a primeira de todo laboratório,
com a instrução de criar o `PROCESSO.md` antes de abrir o Wokwi.

## Motivações

1. Gabarito numa letra só permite acertar sem ler a pergunta, e o Peer Instruction perde a medida.
2. O `PROCESSO.md` acompanha as cinco etapas (ADR-008); ele precisa existir antes da primeira.

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Aula nova volta a pôr a resposta certa em primeiro | `tools/tests/test_quiz_gabarito.py` reprova repetição seguida e distribuição fora de 15% a 35% |
| Laboratório novo volta a deixar o registro no fim | `test_registro_do_uso_de_ia_abre_o_roteiro` em `tools/tests/test_labs.py` |
| Texto que cita seção do laboratório pelo número fica errado | as citações foram conferidas; a única, na Aula 11, foi atualizada |

## Consequências

**Positivas:** o quiz mede a compreensão, e o registro de IA começa junto com o laboratório.

**Negativas:** a numeração das seções dos laboratórios mudou, e quem guardou o número antigo de uma
seção precisa conferir.

## ADRs relacionadas

ADR-003 (cinco artefatos por aula, laboratório pelas cinco etapas do 5C), ADR-008 (registro de uso de
IA por PROCESSO.md e ADR).
