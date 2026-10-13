# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Retomando o trabalho?** `docs/ANDAMENTO.md` tem o estado atual: o que está pronto, a fila das
> próximas aulas e as pendências abertas com o Prof. Ovidio.

## 1. O que é este repositório

Acervo de Computação do **Módulo 04 IN, Solução para IoT** (Graduação Inteli, turma GRAD IN04
2026-2B-T24, Prof. Ovidio Lopes da Cruz Netto): 12 Encontros de Instrução de 15/10 a 17/12/2026,
ancorados no case da Cerradinho (rastreamento IoT de equipamentos enviados à manutenção externa).
A T24 é turma-piloto do projeto institucional "IA no Currículo".

Site estático de decks Reveal.js, materiais de apoio, páginas de referências e laboratórios Wokwi,
publicado no GitHub Pages a partir de `canaldoovidio/2026-2B-M04`. Não há build nem gerenciador de
pacote de JavaScript. Edita-se HTML, CSS, JavaScript puro, Markdown, sketches Arduino e os scripts
Python de `tools/`. O molde (tema, validadores, runtime de widgets) veio do acervo do LBL 08
(`AD08-LBL/2026-2B-M08`), que por sua vez veio do M03 (ADR-001).

## 2. Comandos

```bash
# Ambiente: .venv com Playwright, pytest e openpyxl; arduino-cli com os cores arduino:avr e esp32:esp32
python3 -m venv .venv --system-site-packages && .venv/bin/python -m pip install playwright pytest openpyxl
.venv/bin/python -m playwright install chromium
brew install arduino-cli && arduino-cli config init && \
  arduino-cli config add board_manager.additional_urls https://espressif.github.io/arduino-esp32/package_esp32_index.json && \
  arduino-cli core update-index && arduino-cli core install arduino:avr esp32:esp32

# Preview (obrigatório por HTTP: decks usam caminhos relativos para assets/)
python3 -m http.server 8000      # http://localhost:8000/ e /aulas/aula01.html (?print-pdf para PDF)

# Suíte inteira e um teste isolado
.venv/bin/python -m pytest tools/tests -q
.venv/bin/python -m pytest tools/tests/test_labs.py::test_sketch_compila_para_a_placa_declarada -v

# Validadores (todos reprovam quando medem zero itens)
.venv/bin/python tools/check_brand.py
.venv/bin/python tools/check_links.py
.venv/bin/python tools/check_slides.py aulas/_fixture-tema.html aulas/aula01.html   # --shots DIR salva capturas
.venv/bin/python tools/check_widgets.py aulas/aula01.html materiais/aula01.html

# Geradores (o resultado é versionado e conferido em teste)
.venv/bin/python tools/gerar_portal.py > index.html                  # depois de criar qualquer artefato
.venv/bin/python tools/gerar_dados_case.py                           # regrava dados/*.csv
.venv/bin/python tools/extrair_autoestudos.py > docs/autoestudos-por-semana.md   # precisa do Turma.xlsx local
```

O `Turma.xlsx` (planilha da turma na Adalove, com dado pessoal de aluno) fica na raiz só localmente
e está no `.gitignore`, assim como qualquer arquivo com `TAPI` no nome e qualquer `.docx`.

## 3. Arquitetura de conteúdo em três camadas

1. **Planejamento, a fonte da verdade.** `PLANO_DE_ENSINO.md` (case, calendário, entregas e pesos
   citados da Adalove, frameworks, ponderadas, pendências P1 a P9) e `PLANEJAMENTO_AULA_A_AULA.md`
   (sete blocos de até 15 minutos por aula, cada um fechando em interação nomeada, travado em
   `tools/tests/test_planejamento.py`). Derivados: `docs/autoestudos-por-semana.md` (título exato,
   link e observação de validação de cada autoestudo) e `docs/frameworks-ia.md`. Nenhum artefato
   inventa data, título, autoestudo ou peso.
2. **Metodologia**, nas skills globais `inteli-course-design` e `inteli-deck-design`. Ler antes de
   criar ou mexer em qualquer aula ou slide.
3. **Materiais.** Cinco artefatos por aula (ADR-003): `aulas/aulaNN.html` (deck),
   `materiais/aulaNN.html` (Preparação com animações e autoverificação, aprofundamento, desafio),
   `referencias/aulaNN.html` (autoestudos com `data-autoestudo` e leitura complementar numerada),
   `labs/aulaNN/{sketch.ino,diagram.json}` mais `labs/aulaNN.html` (laboratório Wokwi pelas cinco
   etapas do 5C) e `docs/notas-do-professor/aulaNN.md` (perguntas socráticas, interno).

## 4. O case e os dados

O TAPI da Cerradinho pede um rastreador reutilizável: última localização válida, vínculo do ciclo
à NF, alertas de permanência (150 dias, configurável) e de lacre, atualização semanal, envio
posterior sem conexão e API para BI. O módulo constrói esse rastreador uma camada por aula (tabela
na seção 2 do plano). O TAPI não pressupõe Wi-Fi nas oficinas, e o kit ensina Wi-Fi e MQTT: essa
distância é conteúdo das Aulas 06 e 08.

Os dados da Cerradinho são restritos pelo TAPI. `dados/` é um conjunto **fictício** gerado com
semente fixa (ADR-006), com invariantes do TAPI travados em `tools/tests/test_dados_case.py` e três
ciclos abertos fixados (permanência longa, atraso, no prazo). Dicionário em `dados/README.md`.

## 5. Frameworks do projeto IA no Currículo

- **DAIA-E** (Afonso Brandão) organiza as sprints: S1 = SP1 e início de SP2, S2 = SP2, S3 = SP3,
  S4 = SP4, S5 = SP5. Toda aula declara a etapa no planejamento e no slide de amarração.
- **5C** (Murilo Zanini) estrutura cada atividade: todo laboratório tem uma seção por etapa
  (`id="contextualizar"` etc.), todo encontro tem um bloco de "Confronto com a IA", e o aluno
  registra o uso de IA em `PROCESSO.md` mais um ADR de sugestão rejeitada (ADR-008, modelos em
  `labs/modelos/`).
- **Ponderadas** seguem os enunciados da reescrita 5C do Prof. Ovidio, com pesos citados da Adalove
  (ADR-007). Divergências entre as duas fontes são as pendências P1 a P5.

## 6. Animações e laboratórios

**Animações** (ADR-005): widgets SVG em JavaScript puro, montados pelo runtime
`assets/js/inteli-widgets.js` (`IntelIWidgets.registrar(nome, fn)`, `data-pronto="sim"`), com
estilos em `assets/css/inteli-anim.css`, carregado pelo deck e pelo material. Regras:
- cor só por `var(--seg-*)`, nunca literal; texto monoespaçado pela classe `mono`;
- desenhar só pelo `viewBox`, nunca medir layout nem usar `getPointAtLength` (slide fora de cena tem
  `display: none`);
- o laço de animação pausa quando a `section` não tem a classe `present`;
- toda animação pede a previsão antes do primeiro controle (prever, observar, explicar).

**Laboratórios** (ADR-003): `labs/labs.json` declara placa (`fqbn`) e peça Wokwi de cada aula.
Arduino Uno nas Aulas 01 e 02, ESP32 a partir da Aula 03. `tools/tests/test_labs.py` compila cada
sketch com `arduino-cli`, confere placa do diagrama contra o manifesto, exige as cinco etapas do 5C
na página e exige que o código mostrado na página seja idêntico aos arquivos.

## 7. Armadilhas conhecidas

Herdadas do molde e ainda válidas: slide que estoura 720px não aparece em `scrollHeight` (usar
`check_slides.py`); a capa usa `conic-gradient`; classe de estado precisa vencer a especificidade
da regra base; `check_slides.py` é cego a estado pós-interação; screenshot de `?print-pdf` não
valida impressão; menos de cerca de 80px de folga vertical no macOS pode reprovar no Ubuntu do CI.

Deste acervo:

- **Servidor local dos validadores com fila de 5 conexões dava `ERR_CONNECTION_RESET`.** O Chromium
  abre uma rajada de conexões e o macOS recusa o excedente; um widget aleatório falhava em cerca de
  1 de 12 execuções. `tools/check_slides.servir()` usa `request_queue_size = 128`, com a regressão
  `test_rajada_de_conexoes_simultaneas_nao_recebe_reset`. A correção vale para os acervos M03 e M08.
- **Comentário de CSS com a palavra `font-family` reprova o `check_brand.py`.** O validador procura
  o texto, não a declaração.
- **Editar um `.py` in-place no mesmo segundo e com o mesmo tamanho deixa o `.pyc` desatualizado.**
  Limpar `__pycache__` antes de concluir que um teste mudou de resultado.
- **SVG descarta espaços iniciais do texto.** Código indentado dentro de `<text>` precisa de
  `white-space: pre`.
- **O GitHub Pages serve `.md` cru.** Link para `labs/modelos/*.md` aponta para o blob do GitHub
  (`REPO_BLOB` em `tools/check_links.py`), que o validador traduz de volta para o caminho local.
- **Critério de alerta é "maior que" em todo o acervo**: dias fora > 150 (permanência) e dias fora >
  prazo (atraso), como o TAPI ("acima do limiar"). `tools/tests/test_criterio_alertas.py` reprova
  `>=` em qualquer sketch, cabeçalho ou widget.
- **Mensagem de quiz é texto puro**: `inteli-quiz.js` usa `textContent`, então tag HTML em
  `data-correct-msg` aparece literal. `tools/tests/test_quiz_texto.py` reprova.
- **`wokwi-relay-module`**: com o padrão `"npn"`, IN em HIGH liga COM ao NO (testado no simulador em
  13/10/2026); o parágrafo de operação da documentação do Wokwi diz o contrário e está errado.
- **Pipe esconde falha de teste**: `pytest ... | tail` devolve o código do `tail`. Usar
  `set -o pipefail` antes de encadear um commit com `&&`.
- **Vários autoestudos usam Arduino Uno ou ESP8266 onde a aula usa ESP32**, e alguns não entregam o
  que o título promete. A coluna Observação de `docs/autoestudos-por-semana.md` registra cada caso,
  e a Preparação do material cobre a diferença.

## 8. Convenções editoriais

- Português do Brasil com acentuação completa, inclusive em comentários e commits.
- Proibidos: o travessão U+2014 (em código, `chr(0x2014)`), emoji, paralelismo negativo, antítese
  simétrica, escalada com dois-pontos e título de listicle.
- Título de slide analítico é frase completa com o número; slide de referência tem título curto e
  descritivo. Tabela antes de grade de cartões.
- Tom didático para iniciantes: analogia concreta antes da fórmula, sem frase de efeito.
- Peso citado da Adalove; autoestudo com título exato; o que falta vira pendência, nunca
  estimativa.

## 9. Commits e push

**Todo commit sai como `canaldoovidio`** (regra do usuário). O repositório local já tem
`user.name canaldoovidio` e `user.email canaldoovidio@users.noreply.github.com`; conferir com
`git log --format='%an <%ae>'` antes de push. O remoto `origin` é
`git@github.com:canaldoovidio/2026-2B-M04.git`, e o host `github.com` do `~/.ssh/config`
autentica como canaldoovidio. Conventional Commits em português, terminando com a linha de
coautoria. O `gh` local está autenticado como `josercf`: operações de API no repositório (Pages,
configurações) precisam da conta canaldoovidio.
