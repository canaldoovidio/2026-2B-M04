# Fase 1 do acervo do M04: fundação e Aula 01

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o repositório `2026-2B-M04` publicado no GitHub Pages com a fundação validada, o planejamento das 12 aulas e a Aula 01 completa até 14/10/2026.

**Architecture:** Site estático sem build. Tema, validadores e runtime de widgets copiados do acervo `AD08-LBL/2026-2B-M08` (a versão mais recente do mesmo molde do M03), adaptados ao M04. Conteúdo em três camadas: documentos de planejamento (fonte da verdade), skills globais de metodologia e materiais. Laboratório por aula em Wokwi, compilado por `arduino-cli` nos testes.

**Tech Stack:** HTML, CSS e JS puro; Reveal.js 5.1.0 por CDN; Python 3.11 com openpyxl, pytest e Playwright; `arduino-cli` com os cores `arduino:avr` e `esp32:esp32`; GitHub Actions e Pages.

**Spec:** `docs/superpowers/specs/2026-10-13-modulo04-design.md`

## Global Constraints

- Todo commit com autor `canaldoovidio <canaldoovidio@users.noreply.github.com>` (configurado em `git config` local do repositório; conferir com `git log --format='%an <%ae>'` antes de cada push). Remoto `git@github.com:canaldoovidio/2026-2B-M04.git`.
- Mensagens de commit em Conventional Commits, em português, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Português do Brasil com acentuação completa em todo texto; nenhum caractere U+2014 (travessão em dash) em nenhum arquivo; nenhum emoji.
- Títulos de slide e de seção: frase completa que afirma o achado (slide analítico) ou descrição curta (slide de referência). Proibido paralelismo negativo, antítese simétrica, escalada com dois-pontos e título de listicle.
- Cor e família tipográfica só em `assets/css/inteli-brand.css`; o resto consome `var(--inteli-*)`, `var(--seg-*)` e `var(--fonte-*)`.
- Peso de entrega sempre citado da Adalove (`Turma.xlsx`), autoestudo sempre com título exato de `docs/autoestudos-por-semana.md`.
- Dados da Cerradinho nunca entram no repositório; o case usa o conjunto fictício de `dados/`. `Turma*.xlsx`, `*TAPI*` e `*.docx` ficam no `.gitignore`.
- Nada medido nunca lê como sucesso: todo validador reprova quando examina zero itens.
- Aulas 01 e 02 em Arduino Uno; Aulas 03 a 12 em ESP32.

## Review Focus

- Deck com animação que monta fora de cena (slide com `display: none`): a animação precisa medir pelo `viewBox` do SVG, nunca por `getBoundingClientRect`, e montar com `data-pronto="sim"` mesmo no slide 1 não visível.
- Laboratório cujo `diagram.json` declara uma placa e o manifesto declara outra: o teste de laboratório compara as duas e reprova.
- `arduino-cli` ausente na máquina ou no CI: o teste de compilação reprova com mensagem dizendo como instalar, nunca pula em silêncio.
- Planilha da turma reexportada com outra ordem de colunas ou linhas duplicadas por aluno: o extrator lê por nome de coluna e deduplica por (semana, tipo, título, data), e o teste usa uma planilha mínima com duas linhas iguais.
- Publicação no Pages com caminho relativo quebrado para `labs/aula01/sketch.ino`: o `check_links.py` confere o arquivo local e o portal aponta para a página `labs/aula01.html`, nunca para o `.ino` cru.

---

### Task 1: Fundação do repositório a partir do M08

**Files:**
- Create (copiados do M08 e adaptados): `assets/css/*.css`, `assets/js/{inteli-print,inteli-quiz,inteli-zoom,inteli-cronometro,inteli-escolha,inteli-widgets}.js`, `assets/js/widgets/barras-horizontais.js`, `assets/img/{inteli-grafismo-graduacao,inteli-logo-mono,inteli-logo-negativa,inteli-logo-positiva}.svg`, `aulas/_fixture-tema.html`, `assets/data/fixture-barras.json`, `tools/{check_brand,check_slides,check_links,check_widgets}.py`, `tools/tests/{__init__,test_check_brand,test_check_links,test_check_slides,test_check_widgets,test_servidor,test_assets_marca}.py`, `tools/tests/fixture_*.html` de layout e de widget, `requirements-ci.txt`, `pytest.ini`, `.nojekyll`, `.github/workflows/{validate,static}.yml`, `.claude/settings.json`
- Modify: `tools/check_links.py` (constante `REPO_BLOB`)

**Interfaces:**
- Produces: `tools/check_slides.py <deck>...`, `tools/check_widgets.py <deck>...`, `tools/check_brand.py`, `tools/check_links.py`, todos com saída 0 só quando mediram ao menos um item; runtime `window.IntelIWidgets.registrar(nome, fn(elemento, dados, api))` com `api.cor(nomeVar)`, `api.fonte(px, peso)`, `api.ponto(evento, canvas)`.

- [ ] **Step 1: Copiar os arquivos genéricos do M08**

```bash
M8=/Users/joseromualdocostafilho/Projects/Inteli/Graduacao/2026.2/AD08-LBL/2026-2B-M08
cd /Users/joseromualdocostafilho/Projects/Inteli/Graduacao/2026.2/2026-2B-M04
mkdir -p assets/css assets/js/widgets assets/img assets/data aulas tools/tests .github/workflows .claude
cp $M8/assets/css/*.css assets/css/
cp $M8/assets/js/{inteli-print,inteli-quiz,inteli-zoom,inteli-cronometro,inteli-escolha,inteli-widgets}.js assets/js/
cp $M8/assets/js/widgets/barras-horizontais.js assets/js/widgets/
cp $M8/assets/img/inteli-*.svg assets/img/
cp $M8/aulas/_fixture-tema.html aulas/
cp $M8/tools/{check_brand,check_slides,check_links,check_widgets}.py tools/
cp $M8/tools/tests/{__init__,test_check_brand,test_check_links,test_check_slides,test_check_widgets,test_servidor,test_assets_marca}.py tools/tests/
cp $M8/tools/tests/fixture_*.html tools/tests/
cp $M8/requirements-ci.txt $M8/pytest.ini $M8/.nojekyll . 2>/dev/null || true
cp $M8/.github/workflows/{validate,static}.yml .github/workflows/
cp $M8/.claude/settings.json .claude/
grep -rln "M08\|2026-2B-M08\|josercf\|cesta\|Markowitz" . --include=*.py --include=*.html --include=*.yml --include=*.js --include=*.json --include=*.ini | grep -v '^./docs'
```

Expected: a lista final mostra os arquivos com referência ao M08 que precisam de adaptação.

- [ ] **Step 2: Adaptar as referências ao M08**

Para cada arquivo listado: trocar `https://github.com/josercf/2026-2B-M08/blob/main/` por `https://github.com/canaldoovidio/2026-2B-M04/blob/main/` em `tools/check_links.py` e no teste correspondente; no `validate.yml`, remover a etapa de ffmpeg e a de notebooks, trocar `M08_OFFLINE` por `M04_OFFLINE` e acrescentar, antes da suíte de testes:

```yaml
      - name: Instalar o arduino-cli e os cores
        run: |
          curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=$HOME/.local/bin sh
          echo "$HOME/.local/bin" >> $GITHUB_PATH
          $HOME/.local/bin/arduino-cli config init --overwrite
          $HOME/.local/bin/arduino-cli config add board_manager.additional_urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
          $HOME/.local/bin/arduino-cli core update-index
          $HOME/.local/bin/arduino-cli core install arduino:avr esp32:esp32
```

No `requirements-ci.txt`, deixar só `playwright`, `pytest` e `openpyxl`. No fixture do tema e nos fixtures de widget que leem JSON de `assets/data/`, criar `assets/data/fixture-barras.json` com o mesmo formato usado pelo fixture do M08 (`{"titulo", "unidade", "itens": [{"rotulo", "valor"}]}`) e valores do conjunto fictício (dias fora por fornecedor, preenchidos na Task 3; até lá, `{"titulo": "Exemplo", "unidade": "dias", "itens": [{"rotulo": "A", "valor": 1}]}`).

- [ ] **Step 3: Instalar o ambiente local e rodar a suíte**

```bash
python3 -m venv .venv --system-site-packages
.venv/bin/python -m pip install -q playwright pytest openpyxl
.venv/bin/python -m playwright install chromium
brew install arduino-cli
arduino-cli config init --overwrite
arduino-cli config add board_manager.additional_urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli core update-index && arduino-cli core install arduino:avr esp32:esp32
.venv/bin/python -m pytest tools/tests -q
.venv/bin/python tools/check_brand.py && .venv/bin/python tools/check_links.py
.venv/bin/python tools/check_slides.py aulas/_fixture-tema.html && .venv/bin/python tools/check_widgets.py aulas/_fixture-tema.html
```

Expected: suíte verde; cada validador imprime a contagem de itens medidos maior que zero. `.venv/` está no `.gitignore`.

- [ ] **Step 4: Ver um teste de proteção falhando**

Apagar temporariamente `data-pronto` do runtime (`elemento.dataset.pronto = 'sim'` comentado em `assets/js/inteli-widgets.js`), rodar `.venv/bin/python -m pytest tools/tests/test_check_widgets.py -q`, confirmar FAIL, restaurar a linha e confirmar PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: fundação do acervo a partir do tema e dos validadores do M08

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Autoestudos por semana a partir da planilha da turma e da revisão IN04

**Files:**
- Create: `tools/extrair_autoestudos.py`, `docs/fontes/revisao-in04-2026-2b.csv`, `docs/autoestudos-por-semana.md`, `tools/tests/test_extrair_autoestudos.py`

**Interfaces:**
- Consumes: `Turma.xlsx` na raiz (fora do git; cópia de `~/Downloads/Turma (4).xlsx`); CSV da aba 2026.2B da planilha "Revisão IN04 2026.2B" (Drive `19mabLbEgluztdYBtLU-cZda2uo4sc49OE5gyTVLl4Tw`) com as colunas `titulo,url,formato,observacao`, só dos cards do Ovidio, exportado pelo conector do Drive e revisado à mão com as divergências do relatório de 13/10/2026.
- Produces: `extrair(caminho_xlsx) -> dict[str, dict]` com chaves `"01"`..`"10"` e valores `{"encontros": [{"data": "15/10/2026", "titulo": str}], "autoestudos": [str]}`; `ler_revisao(caminho_csv) -> dict[str, dict]` por título; `renderizar(dados, revisao) -> str`. O Markdown tem `## Semana NN`, a lista de encontros e uma tabela `| Autoestudo | Formato | Link | Observação |`.

- [ ] **Step 1: Escrever o teste com uma planilha mínima**

```python
"""Extrator de autoestudos: lê por nome de coluna, deduplica e filtra o Ovidio."""
import os

import openpyxl
import pytest

from tools import extrair_autoestudos as ex

CAB = ["Aluno_Nome", "Atividade_Nome", "Atividade_Semana", "Atividade_Tipo",
       "Atividade_Data_Inicio", "Atividade_Professor_Nome", "Atividade_Peso"]


def _planilha(tmp_path, linhas):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(CAB)
    for linha in linhas:
        ws.append(linha)
    caminho = os.path.join(tmp_path, "turma.xlsx")
    wb.save(caminho)
    return caminho


def test_deduplica_linhas_de_alunos_diferentes(tmp_path):
    caminho = _planilha(tmp_path, [
        ["A", "Como usar a Protoboard", "Semana 01", "Autoestudo", None, "Ovidio Lopes da Cruz Netto", 0],
        ["B", "Como usar a Protoboard", "Semana 01", "Autoestudo", None, "Ovidio Lopes da Cruz Netto", 0],
    ])
    assert ex.extrair(caminho)["01"]["autoestudos"] == ["Como usar a Protoboard"]


def test_ignora_outros_professores_e_le_por_nome_de_coluna(tmp_path):
    caminho = _planilha(tmp_path, [
        ["A", "Storyboards", "Semana 02", "Autoestudo", None, "Bruna Mayer Costa", 0],
        ["A", "Programação em Arduino e Eletrônica Básica", "Semana 01", "Encontro de Instrução",
         "15/10/2026", "Ovidio Lopes da Cruz Netto", 0],
    ])
    dados = ex.extrair(caminho)
    assert "02" not in dados
    assert dados["01"]["encontros"] == [
        {"data": "15/10/2026", "titulo": "Programação em Arduino e Eletrônica Básica"}]


def test_planilha_sem_linha_do_ovidio_reprova(tmp_path):
    caminho = _planilha(tmp_path, [["A", "Storyboards", "Semana 02", "Autoestudo", None, "Bruna", 0]])
    with pytest.raises(ValueError):
        ex.extrair(caminho)


def test_autoestudo_sem_url_na_revisao_reprova_a_renderizacao():
    dados = {"01": {"encontros": [], "autoestudos": ["Como usar a Protoboard"]}}
    with pytest.raises(KeyError):
        ex.renderizar(dados, {})


def test_derivado_versionado_cobre_as_dez_semanas_e_tem_url_por_autoestudo():
    raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    with open(os.path.join(raiz, "docs", "autoestudos-por-semana.md"), encoding="utf-8") as fh:
        texto = fh.read()
    for semana in ("01", "02", "03", "04", "05", "06", "07", "08", "09"):
        assert "## Semana %s" % semana in texto
    linhas = [l for l in texto.splitlines() if l.startswith("| ") and not l.startswith("| Autoestudo")
              and not l.startswith("|---")]
    assert len(linhas) > 70
    assert all("https://" in l or "Sem link" in l for l in linhas)
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `.venv/bin/python -m pytest tools/tests/test_extrair_autoestudos.py -v`
Expected: FAIL com `ModuleNotFoundError: tools.extrair_autoestudos`.

- [ ] **Step 3: Implementar o extrator**

```python
#!/usr/bin/env python3
"""
Extrai da planilha da turma os encontros e autoestudos do Prof. Ovidio, por semana,
e junta a URL e a observação de cada autoestudo vindas da revisão IN04 2026.2B.

A planilha da turma tem dado pessoal de aluno e não é versionada. O derivado
publicável é docs/autoestudos-por-semana.md.

Uso:
    python3 tools/extrair_autoestudos.py [Turma.xlsx] > docs/autoestudos-por-semana.md
"""
import csv
import datetime
import os
import sys

import openpyxl

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PADRAO = os.path.join(RAIZ, "Turma.xlsx")
REVISAO = os.path.join(RAIZ, "docs", "fontes", "revisao-in04-2026-2b.csv")
PROFESSOR = "Ovidio"


def _data(valor):
    if isinstance(valor, datetime.datetime):
        return valor.strftime("%d/%m/%Y")
    return str(valor).strip() if valor else ""


def extrair(caminho_xlsx):
    wb = openpyxl.load_workbook(caminho_xlsx, data_only=True, read_only=True)
    linhas = wb.worksheets[0].iter_rows(values_only=True)
    cab = [str(c).strip() for c in next(linhas)]
    i = {nome: pos for pos, nome in enumerate(cab)}
    vistos, dados = set(), {}
    for linha in linhas:
        if PROFESSOR not in str(linha[i["Atividade_Professor_Nome"]] or ""):
            continue
        semana = str(linha[i["Atividade_Semana"]] or "").replace("Semana", "").strip().zfill(2)
        tipo = str(linha[i["Atividade_Tipo"]] or "").strip()
        titulo = str(linha[i["Atividade_Nome"]] or "").strip()
        data = _data(linha[i["Atividade_Data_Inicio"]])
        chave = (semana, tipo, titulo, data)
        if chave in vistos:
            continue
        vistos.add(chave)
        registro = dados.setdefault(semana, {"encontros": [], "autoestudos": []})
        if tipo == "Autoestudo":
            registro["autoestudos"].append(titulo)
        elif tipo == "Encontro de Instrução":
            registro["encontros"].append({"data": data, "titulo": titulo})
    if not dados:
        raise ValueError("nenhuma atividade do professor %s em %s" % (PROFESSOR, caminho_xlsx))
    for registro in dados.values():
        registro["autoestudos"].sort()
        registro["encontros"].sort(key=lambda e: e["data"].split("/")[::-1])
    return dict(sorted(dados.items()))


def ler_revisao(caminho_csv):
    with open(caminho_csv, encoding="utf-8") as fh:
        return {linha["titulo"]: linha for linha in csv.DictReader(fh)}


def renderizar(dados, revisao):
    saida = [
        "# Autoestudos e encontros do Prof. Ovidio por semana",
        "",
        "Gerado por `tools/extrair_autoestudos.py` a partir da planilha da turma (Adalove) e de",
        "`docs/fontes/revisao-in04-2026-2b.csv`. Não editar à mão.",
        "",
        "A coluna Observação registra a validação do conteúdo feita em 13/10/2026: placa diferente",
        "da usada em aula, conteúdo que não corresponde ao título ou acesso que exige login.",
        "",
    ]
    for semana, registro in dados.items():
        saida += ["## Semana %s" % semana, ""]
        for enc in registro["encontros"]:
            saida.append("- Encontro de Instrução, %s: %s" % (enc["data"], enc["titulo"]))
        saida += ["", "| Autoestudo | Formato | Link | Observação |", "|---|---|---|---|"]
        for titulo in registro["autoestudos"]:
            card = revisao[titulo]
            link = card["url"] or "Sem link"
            saida.append("| %s | %s | %s | %s |" % (titulo, card["formato"], link, card["observacao"]))
        saida.append("")
    return "\n".join(saida)


def main():
    caminho = sys.argv[1] if len(sys.argv) > 1 else PADRAO
    if not os.path.isfile(caminho):
        print("planilha da turma não encontrada em %s" % caminho, file=sys.stderr)
        return 1
    print(renderizar(extrair(caminho), ler_revisao(REVISAO)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Montar o CSV da revisão e gerar o derivado**

Ler a aba `2026.2B` da planilha `19mabLbEgluztdYBtLU-cZda2uo4sc49OE5gyTVLl4Tw` com `mcp__claude_ai_Google_Drive__read_file_content`, filtrar os cards do Ovidio e gravar `docs/fontes/revisao-in04-2026-2b.csv` (`titulo,url,formato,observacao`). O título precisa ser idêntico ao da planilha da turma. A observação vem do relatório de validação de 13/10/2026 (por exemplo: "Usa Arduino Uno, ADC de 10 bits; a aula usa ESP32, 12 bits"). O card "Atividade ponderada de Computação 1 (em sala)" entra com `url` vazio e observação "Sem card próprio na revisão; equivale à ponderada do circuito RC de 20/10".

```bash
cp "/Users/joseromualdocostafilho/Downloads/Turma (4).xlsx" Turma.xlsx
.venv/bin/python tools/extrair_autoestudos.py > docs/autoestudos-por-semana.md
.venv/bin/python -m pytest tools/tests/test_extrair_autoestudos.py -v
git status --short | grep -i turma && echo "ERRO: planilha da turma no git" || echo "planilha fora do git"
```

Expected: 5 PASS; "planilha fora do git".

- [ ] **Step 5: Commit**

```bash
git add tools/extrair_autoestudos.py tools/tests/test_extrair_autoestudos.py docs/autoestudos-por-semana.md docs/fontes/revisao-in04-2026-2b.csv
git commit -m "feat: autoestudos do Ovidio por semana com link e observação de validação

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Conjunto de dados fictício do case

**Files:**
- Create: `tools/gerar_dados_case.py`, `tools/tests/test_dados_case.py`, `dados/*.csv`, `dados/README.md`
- Modify: `assets/data/fixture-barras.json` (dias fora por fornecedor, do conjunto gerado)

**Interfaces:**
- Produces: `gerar(semente: int = 4042) -> dict[str, list[dict]]` com as chaves `equipamentos`, `fornecedores`, `ciclos`, `leituras`, `eventos_lacre`; `gravar(tabelas, pasta) -> None`; constantes `DATA_REF = date(2026, 10, 1)` e `LIMIAR_DIAS = 150`. Colunas:
  - `equipamentos`: `id_equipamento` (EQ-01..), `tipo`, `largura_m`, `altura_m`, `profundidade_m`, `massa_kg`
  - `fornecedores`: `id_fornecedor` (FN-01..), `nome`, `regiao`, `prazo_medio_dias`
  - `ciclos`: `id_ciclo` (CI-001..), `id_equipamento`, `id_fornecedor`, `id_dispositivo` (DV-01..DV-08), `nf_remessa`, `data_saida`, `prazo_previsto`, `data_retorno` (vazio se aberto), `nf_retorno`
  - `leituras`: `id_ciclo`, `id_dispositivo`, `data_hora`, `x_km`, `y_km`, `posicao_valida`, `bateria_pct`, `rssi_dbm`
  - `eventos_lacre`: `id_ciclo`, `id_dispositivo`, `data_hora`, `tipo` (`violacao`, `retirada_autorizada`, `reaplicacao`)

Posição em quilômetros num plano fictício (`x_km`, `y_km`), sem latitude e longitude, para não sugerir localização real.

- [ ] **Step 1: Escrever os testes de invariante**

```python
"""Invariantes do conjunto fictício exigidos pelo TAPI (spec, seção 4)."""
from datetime import date, timedelta

import pytest

from tools import gerar_dados_case as g


@pytest.fixture(scope="module")
def t():
    return g.gerar()


def _d(texto):
    return date.fromisoformat(texto[:10]) if texto else None


def test_entre_dez_e_vinte_equipamentos(t):
    assert 10 <= len(t["equipamentos"]) <= 20


def test_geracao_deterministica():
    assert g.gerar(4042) == g.gerar(4042)
    assert g.gerar(4042) != g.gerar(7)


def test_retorno_nunca_antes_da_saida(t):
    for c in t["ciclos"]:
        if c["data_retorno"]:
            assert _d(c["data_retorno"]) >= _d(c["data_saida"]), c["id_ciclo"]


def _sem_sobreposicao(ciclos, chave):
    por = {}
    for c in ciclos:
        fim = _d(c["data_retorno"]) or g.DATA_REF
        por.setdefault(c[chave], []).append((_d(c["data_saida"]), fim, c["id_ciclo"]))
    for intervalos in por.values():
        intervalos.sort()
        for (_, fim_a, a), (ini_b, _, b) in zip(intervalos, intervalos[1:]):
            assert ini_b > fim_a, (a, b)


def test_dispositivo_nunca_em_dois_ciclos_ao_mesmo_tempo(t):
    _sem_sobreposicao(t["ciclos"], "id_dispositivo")


def test_equipamento_nunca_em_dois_ciclos_ao_mesmo_tempo(t):
    _sem_sobreposicao(t["ciclos"], "id_equipamento")


def test_atraso_e_permanencia_longa_aparecem_separados(t):
    abertos = [c for c in t["ciclos"] if not c["data_retorno"]]
    fora = {c["id_ciclo"]: (g.DATA_REF - _d(c["data_saida"])).days for c in abertos}
    atraso_curto = [c for c in abertos
                    if g.DATA_REF > _d(c["prazo_previsto"]) and fora[c["id_ciclo"]] < g.LIMIAR_DIAS]
    longos = [c for c in abertos if fora[c["id_ciclo"]] >= g.LIMIAR_DIAS]
    no_prazo = [c for c in abertos if g.DATA_REF <= _d(c["prazo_previsto"])]
    assert atraso_curto and longos and no_prazo


def test_leituras_semanais_dentro_do_ciclo(t):
    ciclos = {c["id_ciclo"]: c for c in t["ciclos"]}
    for l in t["leituras"]:
        c = ciclos[l["id_ciclo"]]
        dia = _d(l["data_hora"])
        assert _d(c["data_saida"]) <= dia <= (_d(c["data_retorno"]) or g.DATA_REF)
        assert l["id_dispositivo"] == c["id_dispositivo"]
        assert -95 <= l["rssi_dbm"] <= -30
        assert 0 <= l["bateria_pct"] <= 100


def test_bateria_nao_sobe_dentro_do_ciclo(t):
    por = {}
    for l in t["leituras"]:
        por.setdefault(l["id_ciclo"], []).append((l["data_hora"], l["bateria_pct"]))
    for serie in por.values():
        valores = [b for _, b in sorted(serie)]
        assert valores == sorted(valores, reverse=True)


def test_retirada_autorizada_sempre_seguida_de_reaplicacao(t):
    por = {}
    for e in t["eventos_lacre"]:
        por.setdefault(e["id_ciclo"], []).append((e["data_hora"], e["tipo"]))
    tipos = [e["tipo"] for e in t["eventos_lacre"]]
    assert "violacao" in tipos and "retirada_autorizada" in tipos
    for eventos in por.values():
        seq = [tipo for _, tipo in sorted(eventos)]
        for i, tipo in enumerate(seq):
            if tipo == "retirada_autorizada":
                assert "reaplicacao" in seq[i + 1:]


def test_csv_versionado_bate_com_o_gerador(tmp_path):
    import filecmp, os
    g.gravar(g.gerar(), str(tmp_path))
    raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    for nome in ("equipamentos", "fornecedores", "ciclos", "leituras", "eventos_lacre"):
        assert filecmp.cmp(os.path.join(tmp_path, nome + ".csv"),
                           os.path.join(raiz, "dados", nome + ".csv"), shallow=False), nome
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `.venv/bin/python -m pytest tools/tests/test_dados_case.py -v`
Expected: FAIL com `ModuleNotFoundError: tools.gerar_dados_case`.

- [ ] **Step 3: Implementar o gerador**

```python
#!/usr/bin/env python3
"""
Gera o conjunto fictício do case Cerradinho (ADR-006).

O TAPI classifica como restritos os cadastros, NFs, localizações e prazos da
Cerradinho. Nenhum valor aqui é real: nomes, regiões e coordenadas são inventados,
e a posição é um plano em quilômetros sem latitude e longitude.

Uso:
    python3 tools/gerar_dados_case.py        # regrava dados/*.csv
"""
import csv
import os
import random
from datetime import date, datetime, time, timedelta

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEMENTE = 4042
DATA_REF = date(2026, 10, 1)
INICIO = date(2025, 10, 1)
LIMIAR_DIAS = 150
TIPOS = ["bomba centrífuga", "redutor", "motor elétrico", "válvula de controle",
         "cilindro hidráulico", "painel elétrico"]
COLUNAS = {
    "equipamentos": ["id_equipamento", "tipo", "largura_m", "altura_m", "profundidade_m", "massa_kg"],
    "fornecedores": ["id_fornecedor", "nome", "regiao", "prazo_medio_dias"],
    "ciclos": ["id_ciclo", "id_equipamento", "id_fornecedor", "id_dispositivo", "nf_remessa",
               "data_saida", "prazo_previsto", "data_retorno", "nf_retorno"],
    "leituras": ["id_ciclo", "id_dispositivo", "data_hora", "x_km", "y_km", "posicao_valida",
                 "bateria_pct", "rssi_dbm"],
    "eventos_lacre": ["id_ciclo", "id_dispositivo", "data_hora", "tipo"],
}
# Três ciclos abertos fixados para garantir os casos que o TAPI pede analisar
# separadamente: (dispositivo, dias desde a saída, prazo previsto em dias).
ROTEIRO = [("DV-01", 190, 60),   # permanência longa: passou de 150 dias
           ("DV-02", 70, 30),    # atraso sem permanência longa
           ("DV-03", 12, 45)]    # no prazo


def _fornecedores(rnd):
    return [{"id_fornecedor": "FN-%02d" % i, "nome": "Oficina Fictícia %s" % chr(64 + i),
             "regiao": "Região %d" % ((i - 1) % 3 + 1), "prazo_medio_dias": rnd.choice([30, 45, 60, 90])}
            for i in range(1, 7)]


def _equipamentos(rnd):
    return [{"id_equipamento": "EQ-%02d" % i, "tipo": rnd.choice(TIPOS),
             "largura_m": round(rnd.uniform(0.6, 1.4), 2), "altura_m": round(rnd.uniform(0.6, 1.4), 2),
             "profundidade_m": round(rnd.uniform(0.6, 1.4), 2), "massa_kg": rnd.randint(80, 900)}
            for i in range(1, 17)]


def _livre(ocupado, chave, inicio, fim):
    return all(fim < a or inicio > b for a, b in ocupado.get(chave, []))


def _ciclos(rnd, equipamentos, fornecedores):
    ciclos, ocup_eq, n = [], {}, 0
    for i in range(1, 9):
        dv = "DV-%02d" % i
        roteiro = [r for r in ROTEIRO if r[0] == dv]
        cursor = INICIO + timedelta(days=rnd.randint(0, 20))
        limite_aberto = DATA_REF - timedelta(days=roteiro[0][1]) if roteiro else DATA_REF
        while True:
            forn = rnd.choice(fornecedores)
            duracao = max(10, int(rnd.gauss(forn["prazo_medio_dias"], 20)))
            fim = cursor + timedelta(days=duracao)
            if fim >= limite_aberto - timedelta(days=5):
                break
            eq = next((e for e in rnd.sample(equipamentos, len(equipamentos))
                       if _livre(ocup_eq, e["id_equipamento"], cursor, fim)), None)
            if eq:
                n += 1
                ocup_eq.setdefault(eq["id_equipamento"], []).append((cursor, fim))
                ciclos.append(_ciclo(n, eq, forn, dv, cursor, forn["prazo_medio_dias"], fim))
            cursor = fim + timedelta(days=rnd.randint(3, 25))
        if roteiro:
            _, dias_fora, prazo = roteiro[0]
            saida = DATA_REF - timedelta(days=dias_fora)
            eq = next(e for e in equipamentos if _livre(ocup_eq, e["id_equipamento"], saida, DATA_REF))
            ocup_eq.setdefault(eq["id_equipamento"], []).append((saida, DATA_REF))
            n += 1
            ciclos.append(_ciclo(n, eq, rnd.choice(fornecedores), dv, saida, prazo, None))
    return ciclos


def _ciclo(n, eq, forn, dv, saida, prazo, retorno):
    return {"id_ciclo": "CI-%03d" % n, "id_equipamento": eq["id_equipamento"],
            "id_fornecedor": forn["id_fornecedor"], "id_dispositivo": dv,
            "nf_remessa": "NF-R-%05d" % (10000 + n * 7), "data_saida": saida.isoformat(),
            "prazo_previsto": (saida + timedelta(days=prazo)).isoformat(),
            "data_retorno": retorno.isoformat() if retorno else "",
            "nf_retorno": "NF-D-%05d" % (20000 + n * 7) if retorno else ""}


def _leituras_e_lacre(rnd, ciclos, fornecedores):
    regiao = {f["id_fornecedor"]: int(f["regiao"][-1]) for f in fornecedores}
    leituras, eventos = [], []
    for c in ciclos:
        saida = date.fromisoformat(c["data_saida"])
        fim = date.fromisoformat(c["data_retorno"]) if c["data_retorno"] else DATA_REF
        destino = (40.0 * regiao[c["id_fornecedor"]], 25.0 * regiao[c["id_fornecedor"]])
        bateria, dia = 100, saida
        while dia <= fim:
            bateria = max(0, bateria - rnd.randint(1, 4))
            valida = rnd.random() > 0.12
            ultimo = leituras[-1] if leituras and leituras[-1]["id_ciclo"] == c["id_ciclo"] else None
            x, y = (destino if dia > saida + timedelta(days=2) else (0.0, 0.0))
            if not valida and ultimo:
                x, y = ultimo["x_km"], ultimo["y_km"]
            leituras.append({"id_ciclo": c["id_ciclo"], "id_dispositivo": c["id_dispositivo"],
                             "data_hora": datetime.combine(dia, time(9, 0)).isoformat(),
                             "x_km": round(x + rnd.uniform(-0.3, 0.3), 2), "y_km": round(y + rnd.uniform(-0.3, 0.3), 2),
                             "posicao_valida": valida, "bateria_pct": bateria,
                             "rssi_dbm": rnd.randint(-92, -55)})
            dia += timedelta(days=7)
        sorteio = rnd.random()
        meio = saida + (fim - saida) / 2
        if sorteio < 0.3:
            eventos.append(_evento(c, meio, "retirada_autorizada"))
            eventos.append(_evento(c, meio + timedelta(days=1), "reaplicacao"))
        elif sorteio < 0.4:
            eventos.append(_evento(c, meio, "violacao"))
    return leituras, eventos


def _evento(c, dia, tipo):
    return {"id_ciclo": c["id_ciclo"], "id_dispositivo": c["id_dispositivo"],
            "data_hora": datetime.combine(dia, time(14, 30)).isoformat(), "tipo": tipo}


def gerar(semente=SEMENTE):
    rnd = random.Random(semente)
    fornecedores = _fornecedores(rnd)
    equipamentos = _equipamentos(rnd)
    ciclos = _ciclos(rnd, equipamentos, fornecedores)
    leituras, eventos = _leituras_e_lacre(rnd, ciclos, fornecedores)
    if not any(e["tipo"] == "violacao" for e in eventos):
        eventos.append(_evento(ciclos[0], date.fromisoformat(ciclos[0]["data_saida"]) + timedelta(days=3), "violacao"))
    if not any(e["tipo"] == "retirada_autorizada" for e in eventos):
        base = date.fromisoformat(ciclos[1]["data_saida"]) + timedelta(days=4)
        eventos += [_evento(ciclos[1], base, "retirada_autorizada"),
                    _evento(ciclos[1], base + timedelta(days=1), "reaplicacao")]
    return {"equipamentos": equipamentos, "fornecedores": fornecedores, "ciclos": ciclos,
            "leituras": leituras, "eventos_lacre": eventos}


def gravar(tabelas, pasta):
    os.makedirs(pasta, exist_ok=True)
    for nome, linhas in tabelas.items():
        with open(os.path.join(pasta, nome + ".csv"), "w", encoding="utf-8", newline="") as fh:
            escritor = csv.DictWriter(fh, fieldnames=COLUNAS[nome], lineterminator="\n")
            escritor.writeheader()
            escritor.writerows(linhas)


if __name__ == "__main__":
    gravar(gerar(), os.path.join(RAIZ, "dados"))
```

- [ ] **Step 4: Gerar, rodar os testes e ver um teste falhar de propósito**

```bash
.venv/bin/python tools/gerar_dados_case.py
.venv/bin/python -m pytest tools/tests/test_dados_case.py -v
```

Expected: todos PASS. Depois trocar temporariamente `("DV-02", 70, 30)` por `("DV-02", 70, 90)`, rodar `test_atraso_e_permanencia_longa_aparecem_separados` e confirmar FAIL; restaurar e regenerar. Se algum invariante falhar com a semente 4042, corrigir o gerador (nunca o teste) e regenerar.

- [ ] **Step 5: Escrever `dados/README.md` e atualizar o JSON do fixture**

`dados/README.md`: por que o conjunto é fictício (restrição de conteúdo do TAPI, citada da seção "Conteúdo restrito"), dicionário de colunas de cada CSV, as três situações fixadas em `ROTEIRO` com o significado de cada uma, a data de referência 01/10/2026 e o comando de regeneração. `assets/data/fixture-barras.json`: dias fora dos três ciclos abertos do `ROTEIRO`, calculados a partir do CSV gerado.

- [ ] **Step 6: Commit**

```bash
git add tools/gerar_dados_case.py tools/tests/test_dados_case.py dados/ assets/data/fixture-barras.json
git commit -m "feat: conjunto fictício do case Cerradinho com invariantes do TAPI

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Plano de ensino, síntese dos frameworks e ADRs de fundação

**Files:**
- Create: `PLANO_DE_ENSINO.md`, `docs/frameworks-ia.md`, `docs/adrs/ADR-001-reveal-js-com-tema-inteli.md` a `docs/adrs/ADR-008-registro-de-uso-de-ia-por-processo-e-adr.md`, `tools/tests/test_adrs.py`, `tools/tests/test_plano.py`

**Interfaces:**
- Consumes: spec (seções 2 a 5, 11 e 13), `docs/autoestudos-por-semana.md`, planilha `Ponderadas_Computacao_M4_5C.xlsx` (Drive `1uUEJowhnhf88iM7C-_RTA0A-lyQDdVae`), Guia para Professores (Drive `1UtIe2rjvrl5H5CoJwKZ3iUai6PUSlenHdBG-b0sR98o`), Proposta 1 (Drive `1y0DZxAGOuv3lXYzYgcBBAzwuSyiTShuK`).
- Produces: `PLANO_DE_ENSINO.md` com as seções `## 1. Identificação`, `## 2. O case`, `## 3. Calendário`, `## 4. Entregas e pesos`, `## 5. Frameworks do projeto IA no Currículo`, `## 6. Ponderadas de Computação`, `## 7. Pendências`; tabela de pendências no formato `| P1 | texto |` até `P9`, consumida pelo teste de planejamento da Task 5.

- [ ] **Step 1: Escrever os testes de estrutura**

```python
"""ADRs e plano de ensino: estrutura mínima e pesos citados da fonte."""
import glob
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SECOES_ADR = ("**Data:**", "**Status:**", "**Decisores:**", "## Contexto", "## Decisão",
              "## Motivações", "## Riscos conhecidos", "## Consequências")
# Pesos da Adalove (planilha da turma, 13/10/2026). O plano cita, nunca calcula.
PESOS = {
    "Domínio dos fundamentos de negócio": "3",
    "Requisitos Funcionais, Regras de Negócio e Matriz de Rastreabilidade": "2",
    "Protótipo físico do projeto (offline)": "4",
    "Requisitos Não Funcionais": "2",
    "Protótipo do Projeto com MQTT e I2C": "3",
    "Metodologia e Arquitetura da solução": "3",
    "Protótipo físico do projeto (online)": "2",
    "Protótipo final do projeto": "3",
    "Prova do Módulo": "20",
    "Atividade - Semáforo Inteligente": "2",
    "Atividade - Mapa de Calor calculando dBm de sinal WiFi": "2",
}


def _ler(*partes):
    with open(os.path.join(RAIZ, *partes), encoding="utf-8") as fh:
        return fh.read()


def test_oito_adrs_de_fundacao_com_estrutura_minima():
    adrs = sorted(glob.glob(os.path.join(RAIZ, "docs", "adrs", "ADR-*.md")))
    assert [os.path.basename(a)[:7] for a in adrs][:8] == ["ADR-%03d" % i for i in range(1, 9)]
    for caminho in adrs:
        texto = open(caminho, encoding="utf-8").read()
        for secao in SECOES_ADR:
            assert secao in texto, (os.path.basename(caminho), secao)
        assert chr(0x2014) not in texto


def test_plano_cita_os_pesos_da_adalove():
    plano = _ler("PLANO_DE_ENSINO.md")
    for entrega, peso in PESOS.items():
        linha = next((l for l in plano.splitlines() if entrega in l and l.startswith("|")), None)
        assert linha, entrega
        assert re.search(r"\|\s*%s\s*\|" % peso, linha), (entrega, linha)


def test_plano_tem_as_nove_pendencias_e_as_doze_aulas():
    plano = _ler("PLANO_DE_ENSINO.md")
    assert re.findall(r"^\| (P\d) \|", plano, flags=re.M) == ["P%d" % i for i in range(1, 10)]
    assert len(re.findall(r"^\| \d\d \| \d\d/\d\d \|", plano, flags=re.M)) == 12


def test_frameworks_separa_fonte_de_adaptacao():
    texto = _ler("docs", "frameworks-ia.md")
    for termo in ("5C", "DAIA-E", "Contextualizar", "Consultar", "Confrontar", "Construir",
                  "Comprovar", "Escrito na fonte", "Adaptação deste acervo"):
        assert termo in texto, termo
    assert chr(0x2014) not in texto
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `.venv/bin/python -m pytest tools/tests/test_adrs.py tools/tests/test_plano.py -v`
Expected: FAIL (arquivos inexistentes).

- [ ] **Step 3: Ler as fontes do Drive e escrever os documentos**

Ler com `mcp__claude_ai_Google_Drive__read_file_content` a planilha 5C (abas Leia-me e das seis ponderadas), o Guia para Professores e a Proposta 1. Escrever:

- `PLANO_DE_ENSINO.md`, seção a seção: identificação (turma 2026-2B-T24, orientadora Camila Naves Arantes, piloto IA no Currículo); case (resumo do TAPI sem dado restrito, tabela de camadas por aula da spec, restrição de conectividade); calendário das 12 aulas no formato `| 01 | 15/10 | Semana 01 | Sprint 1 | título |`; entregas e pesos por sprint com a etapa DAIA-E (tabela da spec, seção 5.1, mais Prova do Módulo 20); frameworks (resumo e link para `docs/frameworks-ia.md`); ponderadas de Computação (para cada uma: aula, peso da Adalove, resumo do enunciado 5C, itens de comprovação idênticos entre turmas); pendências P1 a P9 (spec, seção 11, mesma ordem e texto).
- `docs/frameworks-ia.md`: para 5C, DAIA-E e trilha, duas subseções fixas, "Escrito na fonte" (com citação curta e documento de origem) e "Adaptação deste acervo"; inclui a tabela das cinco etapas do 5C com aluno, professor e evidência mínima, as cinco sprints DAIA-E e os três blocos da trilha com o conteúdo previsto para o M04.
- ADR-001 a ADR-008 com as decisões da spec, seção 13, cada uma com as oito seções exigidas pelo teste e "ADRs relacionadas" quando houver. A ADR-006 cita a seção "Conteúdo restrito" do TAPI; a ADR-007 cita a ata do workshop 3 ("Adoção do framework 5C para IA"); a ADR-008 cita a justificativa da planilha 5C (Elkhodr e Gide, 2026).

- [ ] **Step 4: Rodar os testes**

Run: `.venv/bin/python -m pytest tools/tests/test_adrs.py tools/tests/test_plano.py -v`
Expected: PASS. Trocar um peso no plano (3 por 4 em "Domínio dos fundamentos de negócio"), confirmar FAIL, restaurar.

- [ ] **Step 5: Commit**

```bash
git add PLANO_DE_ENSINO.md docs/frameworks-ia.md docs/adrs tools/tests/test_adrs.py tools/tests/test_plano.py
git commit -m "docs: plano de ensino, frameworks de IA e ADRs de fundação

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Planejamento aula a aula das 12 aulas

**Files:**
- Create: `PLANEJAMENTO_AULA_A_AULA.md`, `tools/tests/test_planejamento.py`

**Interfaces:**
- Consumes: `docs/autoestudos-por-semana.md` (títulos exatos), `PLANO_DE_ENSINO.md` (pendências P1 a P9), spec seções 4 a 7.
- Produces: seções `### Aula NN - DD/MM/2026 - Título exato da Adalove`, cada uma com as linhas `Semana:`, `Sprint:`, `Etapa DAIA-E:`, `Entrega que alimenta:`, `O que a aula anterior deixou pronto:`, `O que esta aula deixa pronto:`, `Camada do rastreador:`, `Trilha de IA:`, `Antes do encontro` (com `Autoestudo: título` e `Animação: nome`), `Daily da equipe`, `Metodologia ativa` (sete `Bloco N (a a b min)`), `Depois do encontro`. Os nomes de animação da Aula 01 são `circuito-led`, `protoboard` e `setup-loop`, usados pela Task 6.

- [ ] **Step 1: Escrever o teste**

```python
"""Planejamento das 12 aulas: títulos exatos, sete blocos, amarrações e 5C."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AULAS = {
    "01": ("15/10/2026", "Programação em Arduino e Eletrônica Básica"),
    "02": ("20/10/2026", "Sensores e Atuadores Básicos (Atividade Ponderada em Sala)"),
    "03": ("22/10/2026", "Programação básica usada em microcontroladores"),
    "04": ("30/10/2026", "Arquitetura de Microcontroladores e Ponteiros"),
    "05": ("05/11/2026", "Sensores e processamento de valores de entrada analógicos para digital"),
    "06": ("13/11/2026", "Comunicação à distância (Início de Atividade Ponderada)"),
    "07": ("18/11/2026", "Atuadores e saídas informacionais"),
    "08": ("27/11/2026", "Transmissão de Sinal e Dashboard (Atividade Ponderada em Sala)"),
    "09": ("02/12/2026", "Sistema de disparo de atuadores"),
    "10": ("03/12/2026", "Integração geral entre entrada, sensores e atuadores e a interface com o usuário"),
    "11": ("10/12/2026", "Visão Geral sobre Segurança em IoT (Atividade Ponderada em Sala)"),
    "12": ("17/12/2026", "Revisões finais do projeto"),
}
INTERACOES = {
    "Peer Instruction": r"Peer Instruction",
    "prever e observar": r"prev[êe]\b|prevendo\b|prever\b",
    "pensar e compartilhar": r"pensar e compartilhar",
    "dupla no Wokwi": r"[Dd]upla no Wokwi",
    "confronto com a IA": r"[Cc]onfronto com a IA",
    "quiz": r"[Qq]uiz",
    "pergunta disparada": r"[Pp]ergunta disparada",
}
ETAPAS = ("SP1", "SP2", "SP3", "SP4", "SP5")


def _ler(*partes):
    with open(os.path.join(RAIZ, *partes), encoding="utf-8") as fh:
        return fh.read()


def _secoes():
    partes = re.split(r"^### Aula (\d\d) - ", _ler("PLANEJAMENTO_AULA_A_AULA.md"), flags=re.M)
    return {partes[i]: partes[i + 1] for i in range(1, len(partes), 2)}


def _blocos(secao):
    corpo = secao.split("Metodologia ativa", 1)[1].split("Depois do encontro", 1)[0]
    partes = re.split(r"^\s+(Bloco \d) \(\d+ a \d+ min\)", corpo, flags=re.M)
    return [(partes[i], partes[i + 1]) for i in range(1, len(partes), 2)]


def _autoestudos_por_semana():
    por = {}
    texto = _ler("docs", "autoestudos-por-semana.md")
    for semana, corpo in re.findall(r"^## Semana (\d\d)\n(.*?)(?=^## Semana|\Z)", texto, flags=re.M | re.S):
        por[semana] = set(re.findall(r"^\| (.+?) \| [^|]+ \| [^|]+ \| [^|]* \|$", corpo, flags=re.M)) - {"Autoestudo"}
    return por


def test_doze_aulas_com_data_e_titulo_exatos():
    secoes = _secoes()
    assert sorted(secoes) == sorted(AULAS)
    for numero, (data, titulo) in AULAS.items():
        assert secoes[numero].splitlines()[0] == "%s - %s" % (data, titulo), numero


def test_cada_aula_tem_sete_blocos_de_ate_quinze_minutos_com_interacao():
    medidos = 0
    for numero, secao in _secoes().items():
        blocos = re.findall(r"^\s+Bloco (\d) \((\d+) a (\d+) min\)", secao, flags=re.M)
        assert [int(b[0]) for b in blocos] == list(range(1, 8)), numero
        for _, inicio, fim in blocos:
            assert 0 < int(fim) - int(inicio) <= 15, (numero, inicio, fim)
        for rotulo, corpo in _blocos(secao):
            assert any(re.search(f, corpo) for f in INTERACOES.values()), (numero, rotulo)
            medidos += 1
    assert medidos == 84


def test_cada_aula_declara_amarracoes_daia_e_e_5c():
    for numero, secao in _secoes().items():
        for rotulo in ("Semana:", "Sprint:", "Etapa DAIA-E:", "Entrega que alimenta:",
                       "O que a aula anterior deixou pronto:", "O que esta aula deixa pronto:",
                       "Camada do rastreador:", "Trilha de IA:", "Antes do encontro",
                       "Daily da equipe", "Metodologia ativa", "Depois do encontro"):
            assert rotulo in secao, (numero, rotulo)
        etapa = re.search(r"Etapa DAIA-E: (SP\d)", secao)
        assert etapa and etapa.group(1) in ETAPAS, numero
        assert re.search(r"[Cc]onfronto com a IA", secao), numero


def test_autoestudo_citado_e_da_semana_da_aula_com_titulo_exato():
    por_semana = _autoestudos_por_semana()
    medidos = 0
    for numero, secao in _secoes().items():
        semana = re.search(r"Semana: (\d\d)", secao).group(1)
        antes = secao.split("Antes do encontro", 1)[1].split("Daily da equipe", 1)[0]
        for citado in re.findall(r"^\s+Autoestudo: (.+)$", antes, flags=re.M):
            assert citado.strip() in por_semana.get(semana, set()), (numero, citado)
            medidos += 1
    assert medidos >= 24


def test_pendencias_citadas_existem_no_plano():
    plano = set(re.findall(r"^\| (P\d) \|", _ler("PLANO_DE_ENSINO.md"), flags=re.M))
    citadas = set(re.findall(r"\bP\d\b", _ler("PLANEJAMENTO_AULA_A_AULA.md")))
    assert citadas <= plano, sorted(citadas - plano)


def test_sem_travessao():
    assert chr(0x2014) not in _ler("PLANEJAMENTO_AULA_A_AULA.md")
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `.venv/bin/python -m pytest tools/tests/test_planejamento.py -v`
Expected: FAIL (arquivo inexistente).

- [ ] **Step 3: Escrever o planejamento**

Abertura do documento: como ler, a estrutura de três tempos, a lista de interações nomeadas aceitas (as sete do dicionário `INTERACOES`), a regra dos 15 minutos e a convenção "Confronto com a IA" para a etapa Confrontar do 5C. Depois as 12 seções no formato da interface acima, com:

- Antes do encontro: os autoestudos da semana relevantes ao encontro, com título exato; as animações da Preparação (nome do widget e o que mostra); a autoverificação de cinco perguntas.
- Metodologia ativa: sete blocos (`Bloco 1 (0 a 15 min)` a `Bloco 7 (90 a 105 min)`), o primeiro com Peer Instruction sobre o pré-aula, ao menos um com "Confronto com a IA" (a IA propõe um valor e a turma confere), ao menos um com "dupla no Wokwi", e o último com a amarração (sprint, etapa DAIA-E, entrega e data da review).
- Depois do encontro: desafio do laboratório, avanço do artefato, registro em `PROCESSO.md` e ADR.

A Aula 01 recebe o detalhamento completo (é a próxima a ser construída). As Aulas 02 a 12 recebem o mesmo formato, com o conteúdo derivado da tabela de camadas do rastreador e da tabela de animações da spec, e com as divergências de autoestudo tratadas na Preparação conforme a coluna Observação.

- [ ] **Step 4: Rodar o teste e ver uma regressão falhar**

Run: `.venv/bin/python -m pytest tools/tests/test_planejamento.py -v`
Expected: PASS. Mudar um bloco da Aula 05 para `(60 a 80 min)`, confirmar FAIL, restaurar.

- [ ] **Step 5: Commit**

```bash
git add PLANEJAMENTO_AULA_A_AULA.md tools/tests/test_planejamento.py
git commit -m "docs: planejamento aula a aula das doze instruções do Ovidio

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Animações da Aula 01

**Files:**
- Create: `assets/js/widgets/circuito-led.js`, `assets/js/widgets/protoboard.js`, `assets/js/widgets/setup-loop.js`, `tools/tests/fixture_widgets_aula01.html`, `tools/tests/test_widgets_aula01.py`
- Modify: `assets/css/inteli-theme.css` (classes `.anim`, `.anim-painel`, `.anim-controles`, sem cor literal)

**Interfaces:**
- Consumes: runtime `IntelIWidgets.registrar(nome, fn(elemento, dados, api))`, `api.cor('--seg-primaria' | '--seg-secundaria' | '--seg-destaque' | '--seg-superficie' | '--seg-texto')`.
- Produces: três widgets montáveis por `<div class="widget anim" data-widget="circuito-led"></div>` (idem `protoboard`, `setup-loop`), sem `data-fonte`, cada um gravando `data-pronto="sim"`.

Comportamento de cada widget:
- `circuito-led`: o protótipo aprovado em 13/10/2026 (`scratchpad/prototipo/circuito-led.html`) portado para o contrato: SVG com `viewBox="0 0 760 470"`, elétrons em `getPointAtLength`, controle de 0 a 1000 Ω, botões "220 Ω (kit)", "0 Ω" e "Pausar", leitura `I = (5 V − 2 V) ÷ R` em mA com vírgula decimal, alerta acima de 20 mA, "sem limite" com 0 Ω. Cores por `api.cor`.
- `protoboard`: grade de 30 colunas por 10 linhas mais trilhos; ao passar o ponteiro (ou ao clicar em "Próximo") destaca qual conjunto de furos está ligado internamente; terceiro passo mostra o LED atravessando a canaleta central e o erro comum de ligar as duas pernas na mesma coluna.
- `setup-loop`: dois blocos `setup()` e `loop()` com um marcador percorrendo as linhas do sketch do blink; `setup` executa uma vez e `loop` repete; um LED desenhado acende e apaga sincronizado com `digitalWrite`; controle de velocidade.

- [ ] **Step 1: Escrever o teste com o fixture**

`tools/tests/fixture_widgets_aula01.html`: página Reveal mínima com três slides, um widget por slide, carregando `../../assets/css/inteli-brand.css`, `../../assets/css/inteli-theme.css`, `inteli-widgets.js` e os três scripts.

```python
"""As três animações da Aula 01 montam, inclusive fora de cena, sem erro de console."""
import os
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_as_tres_animacoes_montam_sem_erro():
    fixture = os.path.join("tools", "tests", "fixture_widgets_aula01.html")
    saida = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "check_widgets.py"), fixture],
                           cwd=RAIZ, capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr
    assert "3 widget" in saida.stdout


def test_nenhuma_cor_literal_nos_widgets():
    import re
    for nome in ("circuito-led", "protoboard", "setup-loop"):
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            codigo = fh.read()
        assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", codigo), nome
```

Antes de escrever, conferir o formato exato da linha de resumo do `tools/check_widgets.py` copiado do M08 e ajustar a asserção `"3 widget"` a ele.

- [ ] **Step 2: Rodar e ver falhar**

Run: `.venv/bin/python -m pytest tools/tests/test_widgets_aula01.py -v`
Expected: FAIL (widget sem registro).

- [ ] **Step 3: Implementar os três widgets**

Estrutura comum de cada arquivo:

```javascript
// Animação da Aula 01: <o que mostra>. Prever, observar, explicar: a legenda pede
// a previsão antes do primeiro controle. Sem cor literal: tudo por api.cor.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function el(nome, atributos, pai) {
    var no = document.createElementNS(NS, nome);
    Object.keys(atributos || {}).forEach(function (k) { no.setAttribute(k, atributos[k]); });
    if (pai) pai.appendChild(no);
    return no;
  }

  IntelIWidgets.registrar('circuito-led', function (elemento, _dados, api) {
    var svg = el('svg', { viewBox: '0 0 760 470', role: 'img',
                          'aria-label': 'Circuito com fonte de 5 V, resistor e LED' }, elemento);
    // desenho e animação do protótipo, com api.cor('--seg-primaria') no lugar de #2e2640,
    // api.cor('--seg-secundaria') no lugar de #89cea5 e api.cor('--seg-destaque') no lugar de #ff4545
  });
})();
```

O desenho mede só pelo `viewBox` (nunca por `getBoundingClientRect`), porque o slide fora de cena tem `display: none`. O laço de animação usa `requestAnimationFrame` e pausa quando o slide não está visível (`elemento.closest('section').classList.contains('present')`).

- [ ] **Step 4: Rodar os testes e conferir visualmente**

```bash
.venv/bin/python -m pytest tools/tests/test_widgets_aula01.py -v
.venv/bin/python tools/check_brand.py
python3 -m http.server 8000 &   # abrir http://localhost:8000/tools/tests/fixture_widgets_aula01.html
```

Expected: PASS; check_brand sem cor literal; screenshot dos três slides conferido a olho (elétrons fluindo, protoboard destacando conexões, marcador percorrendo o sketch).

- [ ] **Step 5: Commit**

```bash
git add assets/js/widgets tools/tests/fixture_widgets_aula01.html tools/tests/test_widgets_aula01.py assets/css/inteli-theme.css
git commit -m "feat: animações da Aula 01 (corrente no LED, protoboard, setup e loop)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Infraestrutura de laboratório e laboratório da Aula 01

**Files:**
- Create: `labs/labs.json`, `labs/aula01/sketch.ino`, `labs/aula01/diagram.json`, `labs/aula01.html`, `labs/modelos/PROCESSO.md`, `labs/modelos/ADR-uso-de-ia.md`, `tools/tests/test_labs.py`

**Interfaces:**
- Produces: manifesto `labs/labs.json` no formato `{"aula01": {"fqbn": "arduino:avr:uno", "wokwi": "wokwi-arduino-uno"}}`; página `labs/aulaNN.html` com cinco seções de `id` `contextualizar`, `consultar`, `confrontar`, `construir`, `comprovar`, mais `desafio`.

- [ ] **Step 1: Escrever o teste**

```python
"""Laboratórios: manifesto, placa coerente, cinco etapas do 5C e compilação real."""
import json
import os
import re
import shutil
import subprocess

import pytest

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ETAPAS = ("contextualizar", "consultar", "confrontar", "construir", "comprovar", "desafio")


def _manifesto():
    with open(os.path.join(RAIZ, "labs", "labs.json"), encoding="utf-8") as fh:
        return json.load(fh)


def test_manifesto_nao_esta_vazio():
    assert _manifesto(), "nenhum laboratório declarado: nada medido não é sucesso"


@pytest.mark.parametrize("aula", sorted(_manifesto()))
def test_diagrama_declara_a_mesma_placa_do_manifesto(aula):
    with open(os.path.join(RAIZ, "labs", aula, "diagram.json"), encoding="utf-8") as fh:
        diagrama = json.load(fh)
    tipos = {p["type"] for p in diagrama["parts"]}
    assert _manifesto()[aula]["wokwi"] in tipos
    assert diagrama["connections"], aula


@pytest.mark.parametrize("aula", sorted(_manifesto()))
def test_pagina_do_lab_cobre_as_cinco_etapas_do_5c(aula):
    with open(os.path.join(RAIZ, "labs", aula + ".html"), encoding="utf-8") as fh:
        html = fh.read()
    for etapa in ETAPAS:
        assert 'id="%s"' % etapa in html, (aula, etapa)
    assert "PROCESSO.md" in html and "ADR" in html


@pytest.mark.parametrize("aula", sorted(_manifesto()))
def test_sketch_compila_para_a_placa_declarada(aula, tmp_path):
    cli = shutil.which("arduino-cli")
    assert cli, ("arduino-cli não encontrado. Instale com 'brew install arduino-cli' e os cores "
                 "'arduino:avr' e 'esp32:esp32' (ver docs/ANDAMENTO.md).")
    pasta = os.path.join(tmp_path, "sketch")
    os.makedirs(pasta)
    shutil.copy(os.path.join(RAIZ, "labs", aula, "sketch.ino"), os.path.join(pasta, "sketch.ino"))
    saida = subprocess.run([cli, "compile", "--fqbn", _manifesto()[aula]["fqbn"], pasta],
                           capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr


def test_modelos_de_registro_existem():
    processo = open(os.path.join(RAIZ, "labs", "modelos", "PROCESSO.md"), encoding="utf-8").read()
    for etapa in ("Contextualizar", "Consultar", "Confrontar", "Construir", "Comprovar"):
        assert "## " + etapa in processo
    adr = open(os.path.join(RAIZ, "labs", "modelos", "ADR-uso-de-ia.md"), encoding="utf-8").read()
    assert "Sugestão da IA" in adr and "rejeitada ou corrigida" in adr
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `.venv/bin/python -m pytest tools/tests/test_labs.py -v`
Expected: FAIL (`labs/labs.json` inexistente).

- [ ] **Step 3: Escrever o laboratório da Aula 01**

`labs/labs.json`:

```json
{"aula01": {"fqbn": "arduino:avr:uno", "wokwi": "wokwi-arduino-uno"}}
```

`labs/aula01/sketch.ino`:

```cpp
// Aula 01: LED de status do rastreador da Cerradinho.
// O LED pisca para dizer "o dispositivo está vivo". Pino 8, resistor de 220 ohms.
const int PINO_LED = 8;
const unsigned long LIGADO_MS = 200;    // pulso curto economiza energia
const unsigned long DESLIGADO_MS = 1800;

void setup() {
  pinMode(PINO_LED, OUTPUT);
}

void loop() {
  digitalWrite(PINO_LED, HIGH);
  delay(LIGADO_MS);
  digitalWrite(PINO_LED, LOW);
  delay(DESLIGADO_MS);
}
```

`labs/aula01/diagram.json`:

```json
{
  "version": 1,
  "author": "Acervo M04 IN",
  "editor": "wokwi",
  "parts": [
    {"type": "wokwi-arduino-uno", "id": "uno", "top": 0, "left": 0, "attrs": {}},
    {"type": "wokwi-resistor", "id": "r1", "top": -60, "left": 150, "rotate": 90, "attrs": {"value": "220"}},
    {"type": "wokwi-led", "id": "led1", "top": -120, "left": 190, "attrs": {"color": "red"}}
  ],
  "connections": [
    ["uno:8", "r1:1", "green", []],
    ["r1:2", "led1:A", "green", []],
    ["led1:C", "uno:GND.1", "black", []]
  ],
  "dependencies": {}
}
```

`labs/aula01.html`: página do material (tema `inteli-material.css`) com o passo a passo para abrir `https://wokwi.com/projects/new/arduino-uno`, colar `diagram.json` e `sketch.ino` (blocos de código com botão de copiar), e as seções 5C:
- `contextualizar`: o que o LED de status precisa comunicar no rastreador e o critério de sucesso (pulso de 200 ms a cada 2 s, corrente abaixo de 20 mA);
- `consultar`: pedir ao Gemini a hipótese do resistor para LED vermelho em 5 V, sem pedir o código pronto;
- `confrontar`: conferir a resposta com a lei de Ohm e com o datasheet do LED (queda de cerca de 2 V, corrente máxima de 20 mA) e com a corrente medida no simulador;
- `construir`: montar, rodar, versionar no GitHub;
- `comprovar`: explicar sem IA por que 0 Ω queima o LED e prever a corrente com 330 Ω;
- `desafio`: dois pulsos curtos seguidos de pausa (padrão de "alerta"), sem `delay` bloqueando a leitura futura do lacre (introdução a `millis()`).

`labs/modelos/PROCESSO.md` com uma seção `## Etapa` para cada uma das cinco, cada uma com as perguntas da evidência mínima do Guia. `labs/modelos/ADR-uso-de-ia.md` com Contexto, "Sugestão da IA", "Decisão (aceita, rejeitada ou corrigida)", "Verificação feita" e "Consequência no artefato".

- [ ] **Step 4: Rodar os testes**

Run: `.venv/bin/python -m pytest tools/tests/test_labs.py -v && .venv/bin/python tools/check_links.py`
Expected: PASS. Trocar `"wokwi-arduino-uno"` por `"board-esp32-devkit-c-v4"` no manifesto, confirmar FAIL no teste de placa, restaurar.

- [ ] **Step 5: Commit**

```bash
git add labs tools/tests/test_labs.py
git commit -m "feat: laboratório Wokwi da Aula 01 e modelos de registro do 5C

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Deck, material, referências e notas da Aula 01

**Files:**
- Create: `aulas/aula01.html`, `materiais/aula01.html`, `referencias/aula01.html`, `docs/notas-do-professor/aula01.md`, `tools/tests/test_aula01.py`

**Interfaces:**
- Consumes: seção da Aula 01 do `PLANEJAMENTO_AULA_A_AULA.md`, widgets `circuito-led`, `protoboard`, `setup-loop`, `labs/aula01.html`, `docs/autoestudos-por-semana.md` (Semana 01), skills `inteli-deck-design` e `inteli-course-design`.
- Produces: deck que passa em `check_slides.py` e `check_widgets.py`.

- [ ] **Step 1: Ler as skills e o fixture do tema**

Invocar `inteli-deck-design` (ordem canônica do deck, classes, quiz) e conferir `aulas/_fixture-tema.html` para o markup de cada classe.

- [ ] **Step 2: Escrever o teste da aula**

```python
"""Aula 01: amarrações visíveis no deck e referências fiéis à fonte."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def test_deck_carrega_as_tres_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula01.html")
    for nome in ("circuito-led", "protoboard", "setup-loop"):
        assert 'data-widget="%s"' % nome in deck
    assert "inteli-quiz.js" in deck
    for termo in ("Sprint 1", "SP1", "Confrontar", "23/10"):
        assert termo in deck, termo


def test_referencias_citam_so_autoestudos_da_semana_01_com_link():
    refs = _ler("referencias", "aula01.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 01", 1)[1].split("## Semana", 1)[0]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    assert citados and citados <= oficiais
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_autoverificacao():
    material = _ler("materiais", "aula01.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    assert 'data-widget="circuito-led"' in material


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula01.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in (("aulas", "aula01.html"), ("materiais", "aula01.html"),
                   ("referencias", "aula01.html"), ("docs", "notas-do-professor", "aula01.md")):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF]", texto), partes
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `.venv/bin/python -m pytest tools/tests/test_aula01.py -v`
Expected: FAIL (arquivos inexistentes).

- [ ] **Step 4: Escrever os quatro artefatos**

- **Deck** na ordem canônica da `inteli-deck-design`, seguindo os sete blocos da Aula 01 do planejamento: capa; o que a sprint 1 pede e a etapa SP1 do DAIA-E; Peer Instruction sobre o autoestudo ("Pode colocar resistor no negativo do LED?"); o rastreador da Cerradinho e a camada de hoje (LED de status); prever e observar com `circuito-led`; lei de Ohm com analogia de vazão antes da fórmula; protoboard com `protoboard`; `setup` e `loop` com `setup-loop`; dupla no Wokwi com cronômetro; Confronto com a IA (foto da montagem enviada ao Gemini, resposta conferida no datasheet, inspirado na "Super Máquina" do Murilo); o contrato de uso de IA (`PROCESSO.md` e ADR); quiz; amarração (Sprint 1, review de 23/10, entregas da sprint com pesos da Adalove).
- **Material** com seção `preparacao` (as três animações, explicação para iniciante, a diferença entre o tutorial no pino 13 e o lab no pino 8, autoverificação de cinco perguntas), aprofundamento (lei de Ohm, LED como diodo, por que 20 mA) e desafio.
- **Referências**: autoestudos da Semana 01 com título exato e link do `docs/autoestudos-por-semana.md`, cada item com `data-autoestudo="<título>"`; leitura complementar numerada.
- **Notas do professor**: ao menos seis perguntas socráticas, cada uma com resposta esperada e erro comum.

- [ ] **Step 5: Validar**

```bash
.venv/bin/python -m pytest tools/tests -q
.venv/bin/python tools/check_slides.py aulas/aula01.html --shots /tmp/m04-shots
.venv/bin/python tools/check_widgets.py aulas/aula01.html
.venv/bin/python tools/check_brand.py && .venv/bin/python tools/check_links.py
```

Expected: tudo verde. Conferir as screenshots, responder o quiz e revelar os fragments à mão (o validador não clica), e gerar o PDF por `?print-pdf` para conferir a impressão. Rodar o agente `revisor-slides` sobre o deck antes do commit.

- [ ] **Step 6: Commit**

```bash
git add aulas/aula01.html materiais/aula01.html referencias/aula01.html docs/notas-do-professor/aula01.md tools/tests/test_aula01.py
git commit -m "feat(aula01): deck, material, referências e notas da Aula 01

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Portal, documentação do repositório, publicação

**Files:**
- Create: `index.html`, `CLAUDE.md`, `README.md`, `docs/ANDAMENTO.md`, `.claude/agents/construtor-aulas.md`, `.claude/agents/revisor-slides.md`, `tools/tests/test_portal.py`

**Interfaces:**
- Consumes: todos os artefatos anteriores.
- Produces: site publicado em `https://canaldoovidio.github.io/2026-2B-M04/`.

- [ ] **Step 1: Escrever o teste do portal**

```python
"""Portal: doze cards, cinco botões por aula, botão desabilitado sem artefato."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTEFATOS = {"Deck": "aulas/aula%s.html", "Material": "materiais/aula%s.html",
             "Referências": "referencias/aula%s.html", "Laboratório": "labs/aula%s.html"}


def test_doze_cards_e_botao_so_habilitado_com_arquivo():
    html = open(os.path.join(RAIZ, "index.html"), encoding="utf-8").read()
    cards = re.findall(r'<article class="card-aula" data-aula="(\d\d)">(.*?)</article>', html, flags=re.S)
    assert [n for n, _ in cards] == ["%02d" % i for i in range(1, 13)]
    for numero, corpo in cards:
        for rotulo, molde in ARTEFATOS.items():
            caminho = molde % numero
            existe = os.path.isfile(os.path.join(RAIZ, caminho))
            habilitado = 'href="%s"' % caminho in corpo
            assert existe == habilitado, (numero, rotulo)
```

- [ ] **Step 2: Escrever portal, CLAUDE.md, README, ANDAMENTO e agentes**

`index.html` a partir do portal do M08 (cards agrupados por sprint, com data, título exato e etapa DAIA-E). `CLAUDE.md` no molde do `CLAUDE.md` do M03: o que é o repositório, comandos (inclusive `arduino-cli` e `tools/gerar_dados_case.py`), as três camadas, o case e o conjunto fictício, os frameworks, armadilhas, convenções e a regra de autor `canaldoovidio`. `docs/ANDAMENTO.md` com o estado da Fase 1 e a fila das Aulas 02 e 03 até 17/10. Agentes copiados do M08 e adaptados (laboratório Wokwi no lugar do notebook, 5C e DAIA-E nas amarrações).

- [ ] **Step 3: Rodar tudo**

```bash
.venv/bin/python -m pytest tools/tests -q && .venv/bin/python tools/check_brand.py && .venv/bin/python tools/check_links.py
git log --format='%an <%ae>' | sort -u
```

Expected: suíte verde; uma única linha de autor `canaldoovidio <canaldoovidio@users.noreply.github.com>`.

- [ ] **Step 4: Criar o repositório remoto e publicar**

Confirmar com o usuário antes de criar o repositório público e publicar. Depois:

```bash
gh auth status   # conferir que a conta ativa é canaldoovidio; se não for, pedir ao usuário
gh repo create canaldoovidio/2026-2B-M04 --public --source=. --remote=origin --push 2>/dev/null || git push -u origin main
gh api -X POST repos/canaldoovidio/2026-2B-M04/pages -f build_type=workflow || true
gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')
```

Expected: workflow de validação verde e Pages publicado. Abrir a URL e conferir a Aula 01.

- [ ] **Step 5: Commit**

```bash
git add index.html CLAUDE.md README.md docs/ANDAMENTO.md .claude/agents tools/tests/test_portal.py
git commit -m "docs: portal, guia do repositório e estado da Fase 1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```
