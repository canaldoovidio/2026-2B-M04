"""Atividade - Semáforo Inteligente (Aula 06): página de ponderada no molde da Ponderada 1 (ADR-012).

Confere o barema contra a seção 6.2 do plano, o sketch de calibração compilando para o ESP32, o
simulador de histerese (limiar único troca mais de modo que a histerese) e o fluxo do aluno:
previsão registrada, leituras das três condições, verificações, limiares e downloads.
"""
import html as html_mod
import os
import re
import shutil
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

PASTA = os.path.join(RAIZ, "ponderadas", "semaforo-inteligente")
PAGINA = "ponderadas/semaforo-inteligente/index.html"


def _ler(*partes):
    with open(os.path.join(*partes), encoding="utf-8") as fh:
        return fh.read()


@pytest.mark.parametrize("nome", ["index.html", "semaforo.js", "semaforo.css"])
def test_sem_travessao_nem_simbolo_de_texto(nome):
    texto = _ler(PASTA, nome)
    assert chr(0x2014) not in texto
    assert chr(0x2713) not in texto


def test_js_sem_cor_nem_fonte_literal():
    js = _ler(PASTA, "semaforo.js")
    assert not re.search(r"'#[0-9a-fA-F]{3,6}'|rgba?\(", js)
    assert "IBM Plex" not in js


def test_ordem_das_folhas_e_scripts():
    pagina = _ler(PASTA, "index.html")
    assert pagina.index("assets/css/inteli-brand.css") < pagina.index("comum/ponderada.css") < pagina.index("semaforo.css")
    assert pagina.index("comum/ponderada-base.js") < pagina.index("semaforo.js")
    assert "fonts.googleapis.com" not in pagina


def test_titulo_com_o_nome_da_adalove():
    assert "<h1>Atividade - Semáforo Inteligente</h1>" in _ler(PASTA, "index.html")


def test_barema_da_secao_6_2_transcrito():
    plano = _ler(RAIZ, "PLANO_DE_ENSINO.md")
    secao = plano.split("### 6.2", 1)[1].split("### 6.3", 1)[0]
    itens = re.findall(r"^\| ([^|]+?) \| ([^|]+?) \| (\d,\d) \| [^|]+ \|$", secao, flags=re.M)
    assert len(itens) == 6
    pagina = _ler(PASTA, "index.html")
    linhas = re.findall(r"<tr><th>(.*?)</th><td class=\"pts\">(.*?)</td><td>(.*?)</td></tr>", pagina)
    assert len(linhas) == 6
    for (etapa, item, pontos), (etapa_p, pontos_p, texto_p) in zip(itens, linhas):
        assert etapa_p == etapa
        assert pontos_p == pontos
        assert item.lower() in re.sub(r"<[^>]+>", "", texto_p).lower()


def _codigo_da_pagina():
    pagina = _ler(PASTA, "index.html")
    bruto = re.search(r'<pre class="code-pre" id="codeLDR">(.*?)</pre>', pagina, flags=re.S).group(1)
    return html_mod.unescape(re.sub(r"<[^>]+>", "", bruto))


def test_sketch_so_calibra_e_nao_entrega_a_histerese():
    codigo = _codigo_da_pagina()
    assert "analogRead(PINO_LDR)" in codigo
    assert "PINO_LDR = 34" in codigo
    assert "noturno" not in codigo.lower()


def test_sketch_da_pagina_compila_para_o_esp32(tmp_path):
    if not shutil.which("arduino-cli"):
        pytest.skip("arduino-cli ausente")
    pasta = tmp_path / "calibracao_ldr"
    pasta.mkdir()
    (pasta / "calibracao_ldr.ino").write_text(_codigo_da_pagina(), encoding="utf-8")
    saida = subprocess.run(["arduino-cli", "compile", "--fqbn", "esp32:esp32:esp32", str(pasta)],
                           capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr


def test_nenhum_link_para_ino():
    assert not re.search(r'href="[^"]+\.ino"', _ler(PASTA, "index.html"))


@pytest.fixture(scope="module")
def pagina():
    httpd = check_slides.servir(0)
    erros = []
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pg = navegador.new_page(viewport={"width": 1280, "height": 900}, accept_downloads=True)
        pg.on("pageerror", lambda e: erros.append(str(e)))
        pg.on("console", lambda m: m.type == "error" and erros.append(m.text))
        pg.goto("http://127.0.0.1:%d/%s" % (httpd.server_address[1], PAGINA))
        pg.evaluate("() => document.fonts.ready")
        pg.erros = erros
        yield pg
        navegador.close()
    httpd.shutdown()


def test_carrega_sem_erro_de_console(pagina):
    assert pagina.erros == []


def test_simulador_limiar_unico_troca_mais_que_histerese(pagina):
    r = pagina.evaluate("""() => SemaforoSim.simular({ semente: 11, ruido: 60, sobe: true,
        claro: 2400, escuro: 900, entrada: 1550, saida: 1750 })""")
    assert r["unico"] > r["histerese"]
    assert r["histerese"] == 2
    # Mesma semente, mesma sequência.
    r2 = pagina.evaluate("""() => SemaforoSim.simular({ semente: 11, ruido: 60, sobe: true,
        claro: 2400, escuro: 900, entrada: 1550, saida: 1750 })""")
    assert r2["unico"] == r["unico"]


def test_simulador_respeita_sentido_invertido(pagina):
    r = pagina.evaluate("""() => SemaforoSim.simular({ semente: 3, ruido: 50, sobe: false,
        claro: 900, escuro: 2600, entrada: 1850, saida: 1650 })""")
    assert r["histerese"] == 2 and r["unico"] > 2


def test_simulador_so_libera_controles_depois_da_previsao(pagina):
    assert pagina.locator("#simCtrl").is_hidden()
    pagina.fill("#prevUnico", "8")
    pagina.fill("#prevHist", "2")
    pagina.click("#btnPrev")
    assert pagina.locator("#simCtrl").is_visible()


def test_plano_do_ra(pagina):
    pagina.fill("#raDigito", "4")
    texto = pagina.text_content("#outPlano")
    assert "9 s · 5 s · 2 s" in texto and "ciclo de 16 s" in texto
    pagina.fill("#raDigito", "7")
    assert "12 s · 6 s · 2 s" in pagina.text_content("#outPlano")


def _leituras(cond, centro, n=20, passo=7):
    return "\n".join("%s,%d" % (cond, centro + ((i * passo) % 41) - 20) for i in range(n))


def test_fluxo_completo(pagina):
    pg = pagina
    for nome, valor in [("grupo", "G3"), ("turma", "T24"), ("integrantes", "Ana\nBruno"), ("autor", "Ana Teste"),
                        ("email", "ana@inteli.edu.br"), ("ctx_transicoes", "1"), ("ctx_limiar", "1500"),
                        ("ctx_transicoes_just", "Uma troca por passagem da luz."),
                        ("ctx_limiar_just", "Metade da escala."), ("ctx_delega", "Explicação da técnica.")]:
        pg.fill("[name=%s]" % nome, valor)
    pg.click("#btnLock")
    assert pg.text_content("#lockStatus").startswith("Registrado(a) em")

    pg.select_option("[name=con_ferramenta]", "Gemini")
    for nome, valor in [("con_pergunta", "Como evitar oscilação perto de um limiar?"),
                        ("con_estrategia", "Dois limiares."), ("con_tecnica", "Histerese")]:
        pg.fill("[name=%s]" % nome, valor)
    pg.fill("[name=con_limiar_ia]", "2390")
    saida = "# digite a, s ou l\ncondicao,leitura\n" + "\n".join(
        [_leituras("ambiente", 2387), _leituras("sombra", 903), _leituras("lanterna", 3861), "# fim da condicao"])
    pg.fill("#pasteBox", saida)
    pg.click("#btnImport")
    celulas = pg.locator("#statTable tbody tr").all_inner_texts()
    assert len(celulas) == 3
    assert celulas[0].split("\t")[:2] == ["ambiente", "20"]
    texto = pg.text_content("#dataCheck")
    assert "sobe com a luz" in texto
    assert "múltiplas de 10" not in texto
    cmp = pg.text_content("#cmpCheck")
    assert "Limiar previsto (1.500) fica entre a faixa de sombra e a de ambiente" in cmp
    assert "Limiar sugerido pela IA (2.390) cai dentro da faixa medida em ambiente iluminado" in cmp

    # Entrada maior que a saída com a leitura subindo com a luz: ordem incoerente.
    pg.fill("[name=cons_entrada]", "1700")
    pg.fill("[name=cons_saida]", "1500")
    assert "precisa ser menor" in pg.text_content("#limCheck")
    # Folga menor que o ruído medido (amplitude de 40 contagens).
    pg.fill("[name=cons_entrada]", "1500")
    pg.fill("[name=cons_saida]", "1520")
    assert "menor ou igual ao ruído" in pg.text_content("#limCheck")
    pg.fill("[name=cons_saida]", "1800")
    lim = pg.text_content("#limCheck")
    assert "Ordem coerente" in lim and "maior que o ruído" in lim
    assert pg.text_content("#simFonte") == "com as medições e os limiares do grupo"

    pg.fill("[name=cons_ra]", "4")
    for nome, valor in [("conf_divergencia", "A IA não conhecia o sensor."), ("cons_justificativa", "Meio da região."),
                        ("comp_video", "https://exemplo.org/v"), ("comp_trocas", "1"), ("comp_frase", "A folga é maior que o ruído."),
                        ("adr_decisao", "Histerese de 300."), ("adr_alternativa", "Média móvel."),
                        ("adr_sugestao", "Limiar 2048."), ("adr_razao", "Cai na faixa do ambiente.")]:
        pg.fill("[name=%s]" % nome, valor)

    with pg.expect_download() as info:
        pg.click("#btnMd")
    relatorio = open(info.value.path(), encoding="utf-8").read()
    assert relatorio.startswith("# Relatório · Atividade - Semáforo Inteligente")
    assert "| ambiente | 20 |" in relatorio
    assert "ambiente,2367" in relatorio
    assert "previsão registrada antes da primeira leitura" in relatorio
    assert "9 s, 5 s, 2 s" in relatorio
    assert chr(0x2014) not in relatorio
    assert pg.locator("#formStatus").is_hidden(), pg.text_content("#formStatus")

    with pg.expect_download() as info:
        pg.click("#btnAdr")
    adr = open(info.value.path(), encoding="utf-8").read()
    assert "## Sugestão de IA rejeitada ou corrigida\n\nLimiar 2048." in adr
    assert chr(0x2014) not in adr

    with pg.expect_download() as info:
        pg.click("#btnPng")
    assert info.value.suggested_filename == "grafico-calibracao.png"
    assert pagina.erros == []


def test_valores_redondos_sao_apontados(pagina):
    pg = pagina
    pg.click("#btnClearData")
    redondos = "\n".join("sombra,%d" % (900 + 10 * (i % 3)) for i in range(12))
    pg.fill("#pasteBox", redondos)
    pg.click("#btnImport")
    assert "múltiplas de 10" in pg.text_content("#dataCheck")


def test_grafico_pinta_as_leituras_em_roxo(pagina):
    n = pagina.evaluate("""() => {
        const cv = document.getElementById('chartCal');
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let k = 0;
        for (let i = 0; i < d.length; i += 4)
            if (Math.abs(d[i] - 0x2e) < 6 && Math.abs(d[i + 1] - 0x26) < 6 && Math.abs(d[i + 2] - 0x40) < 6) k++;
        return k; }""")
    assert n > 200
