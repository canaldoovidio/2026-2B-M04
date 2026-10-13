# ADR-003: Cinco artefatos por aula, com laboratório Wokwi no lugar do notebook

**Data:** 13/10/2026
**Status:** Aceita
**Decisores:** Prof. José Romualdo, para as aulas do Prof. Ovidio Lopes da Cruz Netto

## Contexto

No M03 o quarto artefato de cada aula era um notebook Jupyter. No M04 a prática é firmware para Arduino Uno e ESP32, e nem todo aluno tem o kit fora da sala. Os autoestudos da semana 1 usam Tinkercad e os da semana 2 apresentam o Wokwi com ESP32.

## Decisão

Cada aula tem deck, material de apoio, referências, laboratório Wokwi (`labs/aulaNN/sketch.ino`, `labs/aulaNN/diagram.json` e `labs/aulaNN.html`) e notas do professor; Arduino Uno nas Aulas 01 e 02 e ESP32 a partir da Aula 03.

## Motivações

1. O aluno roda o laboratório sem hardware, e o mesmo código vale para a placa física.
2. O workshop 2 do projeto IA no Currículo registra o uso de simulador antes da bancada.
3. O sketch versionado pode ser compilado em teste, o que um projeto salvo só na conta Wokwi não permite.

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Sketch que não compila chega ao aluno | `tools/tests/test_labs.py` compila cada sketch com `arduino-cli` para a placa declarada |
| O Wokwi não importa projeto por URL | a página do laboratório traz botões de copiar para `diagram.json` e `sketch.ino` |
| Diferença entre simulador e hardware real | o material de apoio registra as diferenças conhecidas a cada aula |

## Consequências

**Positivas:** Prática reprodutível e testada.

**Negativas:** O CI passa a depender de `arduino-cli` e dos cores AVR e ESP32, com cache.

## ADRs relacionadas

ADR-007, ADR-008.
