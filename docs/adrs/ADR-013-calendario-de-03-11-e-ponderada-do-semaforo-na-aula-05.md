# ADR-013: Calendário de 03/11 e ponderada do Semáforo lançada na Aula 05

**Data:** 03/11/2026
**Status:** Aceita
**Decisores:** Prof. José Romualdo, para o Prof. Ovidio Lopes da Cruz Netto

## Contexto

A planilha da turma exportada da Adalove em 03/11/2026 mudou o calendário em relação à versão de
13/10/2026, que alimentava o acervo:

| Item | Planilha de 13/10/2026 | Planilha de 03/11/2026 |
|---|---|---|
| Aula 05, Sensores e processamento analógico | 05/11 | 03/11, em troca com o encontro de Matemática, que foi para 05/11 |
| Ponderada do Semáforo | "Atividade - Semáforo Inteligente", Semana 05, peso 2 | "Atividade ponderada de Computação 2 - Semáforo com dois modos de operação", Semana 04, peso 5 |
| Ponderada do Mapa de Calor | "Atividade - Mapa de Calor calculando dBm de sinal WiFi", peso 2 | "Atividade ponderada de Computação 3 - Mapa de Calor calculando dBm de sinal WiFi", peso 4 |
| Ponderada do circuito RC | "Atividade ponderada de Computação 1 (em sala)", sem professor | "Atividade ponderada de Computação 1 - circuito RC", peso 3 |
| Segurança em IoT | encontro "(Atividade Ponderada em Sala)", peso 2 | encontro sem a marca, peso 0 (P12) |
| Título da Aula 06 | "Comunicação à distância (Início de Atividade Ponderada)" | "Comunicação à distância" |
| Entregas do projeto | 19 entregas sem número | ART. 1 a ART. 20, com pesos e nomes alterados |
| Autoestudos das Semanas 02, 04, 05 e 07 | lista de 13/10 | cards novos sem link conferido e cards retirados (P11) |

A Semana 04 tem um só encontro de Computação, a Aula 05. A página da ponderada do Semáforo já existia
(ADR-012), presa à Aula 06.

## Decisão

A ponderada do Semáforo passa a ser lançada no Bloco 7 da Aula 05, pela página do portal, e a
medição do LDR em bancada continua no bloco da ponderada da Aula 06.

## Motivações

- A ponderada é da Semana 04 na Adalove, e o encontro da Semana 04 é a Aula 05.
- O título da Aula 06 deixou de anunciar o início da ponderada.
- O LDR é lido pelo mesmo ADC que a Aula 05 ensina; o plano do RA, o critério de transições e a
  previsão registrada não dependem de bancada.
- A calibração do LDR depende do kit e da montagem, e a Aula 06 já tem o bloco para isso.

## Riscos conhecidos

- O lançamento divide o Bloco 7 da Aula 05 com o quiz e a amarração. Mitigação: o slide tem
  cronômetro de 8 minutos e pede só o plano do RA e a previsão.
- O link do card renomeado foi copiado do card anterior sem conferência (P11). Mitigação: a página
  da ponderada e o barema da seção 6.2 do plano não dependem do card.
- O barema da Adalove pode ter mudado com o novo peso (P4). Mitigação: o acervo segue a reescrita
  5C, como antes.

## Consequências

- Positivas: o portal mostra o botão da ponderada no card da Aula 05, e os decks das Aulas 05 e 06
  apontam para a página; datas, títulos e pesos do plano, do planejamento e do portal batem com a
  planilha de 03/11/2026.
- Negativas: a Preparação das Aulas 06 e 08 ainda comenta cards retirados, e os decks e materiais
  das Aulas 07 a 12 ainda citam entregas pelos nomes e pesos de 13/10/2026 (por exemplo, "Código do
  projeto" e "Critérios de qualidade GITHUB"). Revisar antes de cada aula.

## ADRs relacionadas

- ADR-007: pesos citados da Adalove.
- ADR-012: páginas das demais ponderadas.
