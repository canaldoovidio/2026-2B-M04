# ADR-011: Página da Ponderada 1 incorporada ao acervo e adaptada à marca

**Data:** 19/10/2026
**Status:** Aceita
**Decisores:** Prof. José Romualdo, a pedido do Prof. Ovidio Lopes da Cruz Netto

## Contexto

O Prof. Ovidio pediu, em 19/10/2026, que a página da Ponderada 1 (circuito RC de carga) publicada
pelo Prof. Roberto Cândido em <https://robertocandido-inteli.github.io/ponderada-1/> fosse colocada
neste repositório para ele trabalhar na ponderada da semana 02 (Aula 02, 20/10/2026). O barema da
página é o mesmo da seção 6.1 do `PLANO_DE_ENSINO.md`.

A página original (commit `d5fc7ad` de `robertocandido-inteli/ponderada-1`) é autocontida: um
`index.html`, um `ponderada.css` com tema escuro e IBM Plex, um `ponderada.js` com calculadora,
registro da previsão, importação do Monitor Serial, gráfico em canvas e geração do `RELATORIO.md`.
Copiada sem alteração, ela reprovava o `tools/check_brand.py` com 60 violações (cor literal, fonte
fora do brand, o caractere de confirmação tratado como emoji) e tinha 22 travessões, o que trava a
publicação do site, condicionada à validação.

Três caminhos foram considerados: isentar a pasta do validador mantendo a cópia fiel, adaptar a
página à marca, ou não incorporar. O Prof. José Romualdo escolheu a adaptação.

## Decisão

A página fica em `ponderadas/ponderada-1/`, com o conteúdo, o layout, as classes e o comportamento do
original, e com cor e tipografia vindas de `assets/css/inteli-brand.css`, sem isenção no validador.

## Motivações

1. O acervo publicado segue uma marca só, e o `check_brand.py` continua valendo para todo arquivo.
2. A página ganha o mesmo tratamento das demais (validadores, teste no navegador, botão no portal).
3. O conteúdo didático e o barema não mudam, então o trabalho do Prof. Roberto é preservado.

## O que mudou em relação ao original

| Item | Original | Acervo |
|---|---|---|
| Tema | escuro, cores próprias | claro, `var(--seg-*)` e `var(--inteli-*)` |
| Tipografia | IBM Plex Sans e Mono pelo Google Fonts | Manrope, Platypi e Space Mono do brand |
| Canvas e SVG | cores e fontes literais no JS | lidas dos tokens por `getComputedStyle` |
| Confirmação | caractere de texto | ícone `check` do Material Symbols |
| Valor ausente no relatório | travessão | `n/d` |
| Logo | `assets/logo.png` próprio | `assets/img/inteli-logo-positiva.svg`, com link para o portal |
| Animação do esquema | largura negativa no primeiro quadro (erro de console) | largura limitada a zero |
| Rodapé | crédito ao autor | crédito ao autor e link para a página original |

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| O Prof. Roberto atualiza o original e a cópia fica para trás | o rodapé e este ADR registram o commit de origem; a atualização é manual |
| A adaptação quebra o fluxo do aluno | `tools/tests/test_ponderada1.py` preenche a previsão, registra, importa 40 pontos, confere o gráfico e baixa o relatório |
| Token lido vazio no canvas pinta tudo de preto sem erro | o mesmo teste mede pixels no verde do brand na curva teórica |
| Rascunho salvo pelo aluno na página original não aparece aqui | origens diferentes no navegador; a página nova começa vazia, sem perda no original |

## Consequências

**Positivas:** a ponderada entra no portal (botão no card da Aula 02) e passa pelos mesmos
validadores do acervo.

**Negativas:** a página deixa de ser idêntica à do autor, e mudanças futuras no original exigem
nova adaptação.

## ADRs relacionadas

ADR-005 (animações com cor só por token), ADR-007 (ponderadas pela reescrita 5C).
