# ADR-012: Páginas das demais ponderadas no molde da Ponderada 1

**Data:** 19/10/2026
**Status:** Aceita
**Decisores:** Prof. José Romualdo, a pedido do Prof. Ovidio Lopes da Cruz Netto

## Contexto

Depois da incorporação da Ponderada 1 (ADR-011), o Prof. Ovidio pediu páginas do mesmo nível para as
demais ponderadas, onde fosse aplicável. O Prof. Roberto Cândido só publicou a página da Ponderada 1;
para as outras não há original a copiar. A fonte de cada página é o enunciado da reescrita 5C
(`Ponderadas_Computacao_M4_5C.xlsx`, aba "LBL Revisado M4 COMP") e o barema transcrito na seção 6 do
`PLANO_DE_ENSINO.md`.

A seção 6 lista seis atividades. A aplicabilidade de cada uma:

| Semana | Atividade | Página | Motivo |
|---|---|---|---|
| 01 | Tutorial LED interno | não | entregue em 15/10, peso 0 na Adalove (P1), entrega é o repositório do aluno com `PROCESSO.md` |
| 02 | Atividade ponderada de Computação 1 | `ponderadas/ponderada-1/` | ADR-011 |
| 03 | Semáforo offline | não | não existe no LBL da T24 (P2) |
| 05 | Atividade - Semáforo Inteligente | `ponderadas/semaforo-inteligente/` | calibração do LDR, limiar e histerese |
| 07 | Atividade - Mapa de Calor calculando dBm de sinal WiFi | `ponderadas/mapa-dbm/` | previsão da ordem dos pontos, coleta e confronto com o modelo |
| 09 | Visão Geral sobre Segurança em IoT | `ponderadas/seguranca-iot/` | modelo de ameaça, lista bruta da IA, triagem e risco |

## Decisão

As três ponderadas aplicáveis ganham página interativa no molde da Ponderada 1, sobre uma base comum
em `ponderadas/comum/` (folha de estilo e `ponderada-base.js`), com botão "Ponderada" no card da aula
correspondente do portal.

## Motivações

1. O padrão da Ponderada 1 transforma a regra do barema em verificação na página: a previsão
   registrada com horário antes da medição, a lista bruta da IA registrada antes da triagem, e o
   relatório em Markdown gerado com esse histórico.
2. A base comum evita três cópias do mesmo código de rascunho, registro, gráfico e download, e
   mantém as cores e fontes num só lugar, lidas dos tokens do brand.
3. Cada página segue o enunciado da reescrita 5C, que o acervo já adota (ADR-007).

## Limites de cada página

| Página | O que a página não entrega | Por quê |
|---|---|---|
| Semáforo Inteligente | código do modo noturno com histerese | é o item avaliado em Construir; a página mostra só o sketch de calibração |
| Mapa de Calor dBm | tabela de percursos por RA | ainda não produzida (P6); o aluno digita os pontos do card do encontro |
| Mapa de Calor dBm | sketch e plataforma próprios | reaproveita o laboratório da Aula 08 e o painel `labs/aula08-painel.html` enquanto a plataforma de sala está aberta (P7) |
| Segurança em IoT | código do servidor web e instruções de ataque | o código é do tutorial da Random Nerd Tutorials e fica no link; o grupo cola o código, e a página só estrutura o relatório |

## Correções na base que valem também para a Ponderada 1

A construção das três páginas encontrou três defeitos na folha e no JavaScript comuns, corrigidos na
base com teste em `tools/tests/test_ponderada_base.py`: o atributo `hidden` perdia para o
`display: flex` das classes (o aviso vazio do relatório aparecia como uma caixa com "!"), a caixa
alta de cabeçalhos e rótulos transformava τ e γ em Τ e Γ, e a legenda do gráfico quebrava linha
para dentro da área do gráfico.

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| A página diverge do barema da reescrita | cada teste confere os itens e pontos da página contra a seção 6 do `PLANO_DE_ENSINO.md` |
| Mudança na base comum quebra uma página | `tools/tests/test_ponderada_base.py` e um teste de navegador por página |
| Pendências P3, P4 e P6 mudam o enunciado | as páginas citam a pendência em nota curta; quando houver resposta, atualizar a página e o plano |
| Escala de risco de 1 a 3 lida como regra do enunciado | a página de segurança diz que a escala é adaptação do acervo, como as notas do professor da Aula 11 |

## Consequências

**Positivas:** as quatro ponderadas de Computação com entrega em 2026-2B têm página com o mesmo
fluxo, e o professor recebe relatórios no mesmo formato.

**Negativas:** a folha da Ponderada 1 mudou de lugar (`ponderadas/comum/ponderada.css`), e as
páginas das semanas 05, 07 e 09 são do acervo, sem revisão do Prof. Roberto.

## ADRs relacionadas

ADR-007 (ponderadas pela reescrita 5C), ADR-008 (registro de uso de IA e ADR do aluno), ADR-011
(Ponderada 1 incorporada e adaptada à marca).
