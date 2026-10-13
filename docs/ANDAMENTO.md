# Andamento do acervo

Atualizado em 13/10/2026, fim do dia.

## Pronto

As 12 aulas estão construídas, revisadas por revisor independente e corrigidas. Cada aula tem
deck, material de apoio com Preparação e animações, referências, laboratório Wokwi pelas cinco
etapas do 5C e notas do professor. As Aulas 10 e 11 tiveram também conferência das fontes
técnicas em Opus (correntes e autonomia; TLS, RFCs e NIST).

| Item | Onde |
|---|---|
| Design, plano da Fase 1 e ADR-001 a ADR-009 | `docs/superpowers/`, `docs/adrs/` |
| Plano de ensino com baremas 6.1 a 6.4 e pendências P1 a P10 | `PLANO_DE_ENSINO.md` |
| Planejamento das 12 aulas | `PLANEJAMENTO_AULA_A_AULA.md` |
| Aulas 01 a 12 | `aulas/`, `materiais/`, `referencias/`, `labs/`, `docs/notas-do-professor/` |
| Site | <https://canaldoovidio.github.io/2026-2B-M04/>, publicado só depois de "Validar o acervo" passar |

## Como as Aulas 03 a 12 foram construídas

Um agente por aula, em worktree isolada, com o brief comum (testes primeiro, regras de escrita,
fontes primárias, conferência do Wokwi na documentação). Depois, revisor independente por aula
(Opus nas Aulas 03 e 04, Sonnet nas demais), correções pelo próprio construtor, integração ao
`main` pelo coordenador e regeneração do portal. A lógica do `wokwi-relay-module` da Aula 09 foi
confirmada rodando o Wokwi por Playwright em 13/10/2026.

## O que conferir antes de cada aula

- Rodar o laboratório da aula no Wokwi uma vez: os sketches foram compilados no CI, e só o da
  Aula 09 foi executado no simulador.
- Aulas 06, 08, 09, 11 e 12 usam o broker público `broker.hivemq.com` (P7).
- Aula 11: o handshake TLS dentro do Wokwi não foi executado; se falhar, usar o ESP32 do kit.

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
