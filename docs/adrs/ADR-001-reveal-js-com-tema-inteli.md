# ADR-001: Reveal.js com o tema Inteli herdado do M08

**Data:** 13/10/2026
**Status:** Aceita
**Decisores:** Prof. José Romualdo, para as aulas do Prof. Ovidio Lopes da Cruz Netto

## Contexto

O acervo precisa de decks publicáveis no GitHub Pages, sem build, com a identidade da Graduação Inteli. O acervo do LBL 08 (`AD08-LBL/2026-2B-M08`) já tem tema, validadores e runtime de widgets maduros, derivados do acervo do M03, com as armadilhas de layout corrigidas e documentadas.

## Decisão

Os decks usam Reveal.js 5.1.0 por CDN com o tema, os validadores (`check_brand`, `check_slides`, `check_links`, `check_widgets`) e o runtime de widgets copiados do acervo do M08.

## Motivações

1. Reaproveita correções já pagas: servidor com uma thread por conexão, contador de itens medidos, fonte mínima legível na projeção.
2. Mantém um único molde entre os acervos do professor, o que reduz o custo de manutenção das skills `inteli-deck-design` e `inteli-course-design`.

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| A cópia diverge do M08 com o tempo | as diferenças ficam registradas em ADR; correção de bug nos validadores é portada à mão |
| Fonte do Linux mede diferente da do macOS no CI | folga vertical de pelo menos 80 px por slide, conferida no CI |

## Consequências

**Positivas:** Decks autocontidos, sem bundler, validados no CI.

**Negativas:** Dependência de CDN para Reveal.js e Google Fonts durante a aula.

## ADRs relacionadas

ADR-002, ADR-005.
