# Andamento do acervo

Atualizado em 13/10/2026, fim do dia.

## Pronto

| Item | Onde |
|---|---|
| Design e plano da Fase 1 | `docs/superpowers/specs/2026-10-13-modulo04-design.md`, `docs/superpowers/plans/2026-10-13-fase1-fundacao-e-aula01.md` |
| Tema, validadores, runtime de widgets e CI | `assets/`, `tools/`, `.github/workflows/` |
| Autoestudos do Ovidio com link e validação de conteúdo | `docs/autoestudos-por-semana.md` |
| Conjunto fictício do case | `dados/`, `tools/gerar_dados_case.py` |
| Plano de ensino, frameworks de IA e ADR-001 a ADR-008 | `PLANO_DE_ENSINO.md`, `docs/frameworks-ia.md`, `docs/adrs/` |
| Planejamento das 12 aulas | `PLANEJAMENTO_AULA_A_AULA.md` |
| Aula 01 completa (15/10), publicada | deck, material, referências, laboratório e notas |
| Aula 02 completa (20/10) | deck, material, referências, laboratório do lacre com debounce e notas |
| Site publicado | <https://canaldoovidio.github.io/2026-2B-M04/>, só depois de "Validar o acervo" passar |
| Portal gerado | `index.html`, `tools/gerar_portal.py` |

## Fila

Cada aula fica pronta pelo menos uma semana antes da data, com exceção da semana 2.

| Aula | Data | Pronta até | Observação |
|---|---|---|---|
| 02 | 20/10 | pronta | ponderada do RC usa o barema 5C (P5); R e C dependem do card do encontro |
| 03 | 22/10 | 17/10 | primeira aula em ESP32 |
| 04 | 30/10 | 23/10 | depende de P2 (Semáforo offline) |
| 05 | 05/11 | 29/10 | |
| 06 | 13/11 | 06/11 | depende de P4 (interface do Semáforo) e P7 (broker) |
| 07 | 18/11 | 11/11 | |
| 08 | 27/11 | 20/11 | depende de P6 (percursos por RA) e P7 |
| 09 | 02/12 | 25/11 | |
| 10 | 03/12 | 26/11 | |
| 11 | 10/12 | 03/12 | véspera da Prova do Módulo |
| 12 | 17/12 | 10/12 | |

## Pendências com o Prof. Ovidio

P1 a P9 na seção 7 do `PLANO_DE_ENSINO.md`, enviadas por WhatsApp em 13/10/2026. Quando uma for
respondida: atualizar a tabela do plano, a aula afetada e, se mudar decisão, a ADR-007.

## Fora do repositório

- `Turma.xlsx` local, cópia de `~/Downloads/Turma (4).xlsx`, para regerar os autoestudos.
- TAPI da Cerradinho em `~/Downloads/`, conteúdo restrito.
- Canal do Slack `C0BN3UC7E4F` citado pelo usuário: não acessível pelo conector em 13/10/2026.

## Decisões da revisão final de 13/10/2026 ainda abertas

Itens menores registrados e não corrigidos (ver o ledger em `.superpowers/`, fora do git):
`test_labs.py` aceita diagrama com duas placas; extrator não explica coluna ausente; período do
plano (14/10 a 18/12) e do portal (15/10 a 17/12) com rótulos iguais; feedback de opção errada do
quiz discreto no projetor; datasheet do LED do kit ainda não citado.

## Limites do simulador que moldam as aulas

O Wokwi simula o bounce do botão e não simula a carga de capacitor, o brilho do LED em função do
resistor nem a corrente no Uno. Conferências desse tipo vão para cálculo, animação ou bancada.
