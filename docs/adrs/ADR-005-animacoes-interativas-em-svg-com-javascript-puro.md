# ADR-005: Animações interativas em SVG com JavaScript puro

**Data:** 13/10/2026
**Status:** Aceita
**Decisores:** Prof. José Romualdo, para as aulas do Prof. Ovidio Lopes da Cruz Netto

## Contexto

As aulas pedem animações modernas que expliquem conceitos para iniciantes: corrente no circuito, quantização do ADC, PWM, publicação MQTT. O M08 usa MP4 gerado em matplotlib, adequado a gráfico de dados e pouco adequado a circuito e protocolo. Um protótipo em SVG (corrente no LED em função do resistor) foi aprovado em 13/10/2026.

## Decisão

As animações são widgets SVG interativos em JavaScript puro, sem biblioteca, montados pelo runtime `assets/js/inteli-widgets.js` e com cor lida dos tokens do tema.

## Motivações

1. Interatividade permite prever, observar e explicar: a turma registra a previsão antes de mexer no controle.
2. Cor e fonte vêm do tema, então o `check_brand.py` continua valendo.
3. Funciona sem rede e sem build, no deck e no material.

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Widget que mede o layout desenha em zero fora de cena | o desenho usa só o `viewBox` do SVG |
| Laço de animação consumindo CPU com o slide fora de cena | o laço pausa quando a seção não está presente |
| Widget quebrado em silêncio | `check_widgets.py` exige `data-pronto="sim"` e console sem erro |

## Consequências

**Positivas:** Animações leves, acessíveis e versionadas como código.

**Negativas:** Cada animação é código próprio, sem biblioteca para encurtar o caminho.

## ADRs relacionadas

ADR-001, ADR-004.
