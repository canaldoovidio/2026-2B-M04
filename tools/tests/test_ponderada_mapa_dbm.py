"""Página da ponderada do Mapa de Calor dBm (semana 07, Aula 08), no molde da Ponderada 1 (ADR-012).

Confere o barema contra o plano de ensino, a ausência de percurso inventado (P6), as contas de dB,
a importação da serial do laboratório da Aula 08, o ajuste do expoente e o fluxo do aluno até os
downloads do relatório e do ADR.
"""
import math
import os
import re
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

PASTA = os.path.join(RAIZ, "ponderadas", "mapa-dbm")
PAGINA = "ponderadas/mapa-dbm/index.html"


def _ler(*partes):
    with open(os.path.join(*partes), encoding="utf-8") as fh:
        return fh.read()


@pytest.mark.parametrize("nome", ["index.html", "mapa.js", "mapa.css"])
def test_sem_travessao_nem_simbolo_de_texto(nome):
    texto = _ler(PASTA, nome)
    assert chr(0x2014) not in texto
    assert chr(0x2713) not in texto


def test_js_e_css_sem_cor_nem_fonte_literal():
    js = _ler(PASTA, "mapa.js")
    assert not re.search(r"'#[0-9a-fA-F]{3,6}'|rgba?\(", js)
    css = _ler(PASTA, "mapa.css")
    assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", css)
    assert "font-family" not in css


def test_ordem_dos_estilos_e_scripts():
    html = _ler(PASTA, "index.html")
    assert html.index("assets/css/inteli-brand.css") < html.index("comum/ponderada.css") < html.index("mapa.css")
    assert html.index("comum/ponderada-base.js") < html.index("mapa.js")


def test_titulo_e_o_nome_exato_da_adalove():
    assert "<h1>Atividade - Mapa de Calor calculando dBm de sinal WiFi</h1>" in _ler(PASTA, "index.html")


def _barema_do_plano():
    plano = _ler(RAIZ, "PLANO_DE_ENSINO.md")
    secao = plano.split("### 6.3", 1)[1].split("### 6.4", 1)[0]
    return re.findall(r"^\| ([^|]+?) \| ([^|]+?) \| (\d,\d) \|", secao, flags=re.M)


def test_barema_bate_com_a_secao_6_3_do_plano():
    linhas = _barema_do_plano()
    assert len(linhas) == 6
    html = _ler(PASTA, "index.html")
    barema = html.split('id="barema"', 1)[1].split("</section>", 1)[0]
    pagina = re.findall(r"<tr><th>([^<]+)</th><td class=\"pts\">(\d,\d)</td><td><b>([^<:]+):</b>", barema)
    assert [(e, p, i.lower()) for e, p, i in pagina] == [(e, p, i.lower()) for e, i, p in linhas]
    assert sum(float(p.replace(",", ".")) for _, _, p in linhas) == 10


def test_nenhum_percurso_inventado():
    """Os percursos por RA ainda não existem no acervo (P6): só o elevador tem nome fixo."""
    html = _ler(PASTA, "index.html")
    js = _ler(PASTA, "mapa.js")
    assert "P6" in html
    assert "card do encontro" in html
    nomes_fixos = re.findall(r'name="p\d_nome" value="([^"]*)"', js) + re.findall(r'value="\$\{([A-Z]+)\}"', js)
    assert nomes_fixos == ["ELEVADOR"]
    assert "const ELEVADOR = 'interior do elevador';" in js


def test_pagina_aponta_para_o_laboratorio_sem_duplicar_o_sketch():
    html = _ler(PASTA, "index.html")
    assert 'href="../../labs/aula08.html"' in html
    assert "WiFi.begin" not in html and "PubSubClient" not in html


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


def test_razao_de_potencia(pagina):
    assert pagina.evaluate("() => MapaDbm.razao(-60 - (-90))") == pytest.approx(1000)
    assert pagina.evaluate("() => MapaDbm.razao(3)") == pytest.approx(1.995, abs=0.001)
    assert "1.000 ×" in pagina.text_content("#outRazao")


def test_parser_aceita_os_dois_formatos_e_conta_sem_conexao(pagina):
    texto = "Conectando ao Wi-Fi.... conectado.\\nRSSI -63 dBm = 5.01e-07 mW\\nRSSI −64 dBm = 3.98e-07 mW\\n-65\\n−66\\n0\\nSem Wi-Fi: leitura não enviada.\\nMQTT conectado."
    r = pagina.evaluate("t => MapaDbm.lerSerial(t)", texto.replace("\\n", "\n"))
    assert r["valores"] == [-63, -64, -65, -66]
    assert r["semConexao"] == 2
    assert r["ignoradas"] == 2


def test_ajuste_recupera_o_expoente_sem_ruido(pagina):
    dist = [1, 2, 4, 8, 16]
    rssi = [-40 - 10 * 3.0 * math.log10(d) for d in dist]
    livre = pagina.evaluate("([d, r]) => MapaDbm.ajustarGama(d, r, NaN)", [dist, rssi])
    assert livre["gama"] == pytest.approx(3.0)
    assert livre["rssi0"] == pytest.approx(-40)
    fixo = pagina.evaluate("([d, r]) => MapaDbm.ajustarGama(d, r, -40)", [dist, rssi])
    assert fixo["gama"] == pytest.approx(3.0)
    assert fixo["rmse"] == pytest.approx(0, abs=1e-9)


def test_ordem_com_empate(pagina):
    # P1 e P2 diferem 2 dB, abaixo da diferença perceptível de 3 dB: empate, sem contradição.
    r = pagina.evaluate("() => MapaDbm.compararOrdem([1, 2, 3, 4, 5], [-50, -48, -60, -70, -85], 3)")
    assert r["empates"] == 1 and r["contradizem"] == 0 and r["concordam"] == 9
    assert r["medida"] == [2, 1, 3, 4, 5]
    r = pagina.evaluate("() => MapaDbm.compararOrdem([1, 2, 3, 4, 5], [-50, -48, -60, -70, -85], 1)")
    assert r["contradizem"] == 1 and r["contradicoes"] == [[1, 2]]


def test_posicao_repetida_e_apontada(pagina):
    pagina.select_option("[name=p1_ordem]", "1")
    pagina.select_option("[name=p2_ordem]", "1")
    assert "usada em mais de um ponto" in pagina.text_content("#ctxCheck")
    pagina.select_option("[name=p2_ordem]", "")


def test_fluxo_completo_gera_relatorio_e_adr_sem_travessao(pagina):
    pg = pagina
    campos = {"nome": "Aluno Teste", "email": "aluno@inteli.edu.br", "turma": "T24", "ra_digito": "4",
              "plataforma": "https://exemplo.org/painel", "ctx_db": "3",
              "ctx_just": "Distância e paredes de alvenaria até o elevador metálico."}
    pontos = [("Ponto A do card", 2, 0), ("Ponto B do card", 5, 1), ("Ponto C do card", 10, 2), ("Ponto D do card", 20, 3)]
    for k, (nome, d, paredes) in enumerate(pontos, start=1):
        campos["p%d_nome" % k] = nome
        campos["p%d_dist" % k] = str(d)
        campos["p%d_paredes" % k] = str(paredes)
    campos["p5_dist"] = "25"
    campos["p5_paredes"] = "3"
    for nome, valor in campos.items():
        pg.fill("[name=%s]" % nome, valor)
    for k in range(1, 6):
        pg.select_option("[name=p%d_ordem]" % k, str(k))
    pg.click("#btnLock")
    assert pg.text_content("#lockStatus").startswith("Registrado(a) em")

    pg.select_option("[name=con_ferramenta]", "Gemini")
    for nome, valor in {"con_pergunta": "Como estimar distância pelo RSSI?", "con_modelo": "log-distância",
                        "con_premissas": "espaço livre", "con_rssi0": "-40", "con_gama": "2"}.items():
        pg.fill("[name=%s]" % nome, valor)

    for k, d in enumerate([2, 5, 10, 20], start=1):
        v = round(-40 - 30 * math.log10(d))
        pg.fill("[name=col_p%d]" % k, "\n".join("RSSI %d dBm = 1.00e-07 mW" % (v + j) for j in (-1, 0, 1)))
    pg.fill("[name=col_p5]", "RSSI -84 dBm = 3.98e-09 mW\nSem Wi-Fi: leitura não enviada.\nSem Wi-Fi: leitura não enviada.\nRSSI -86 dBm = 2.51e-09 mW")
    assert pg.locator("#tabMed tbody tr").count() == 5
    assert "Os cinco pontos do percurso têm leituras" in pg.text_content("#dataCheck")
    assert "2 leitura(s) sem conexão" in pg.text_content("#dataCheck")
    pg.select_option("[name=elev_bloqueio]", index=1)
    pg.fill("[name=elev_tempo]", "8")

    # O modelo da IA (γ = 2) subestima a queda dos dados (γ = 3): o ajuste mostra o expoente real.
    assert "2,00" in pg.text_content("#ajusteOut")
    ajustado = pg.evaluate("() => MapaDbm.ajustarGama([2,5,10,20], [-49,-61,-70,-79], -40).gama")
    assert ajustado == pytest.approx(3.0, abs=0.1)

    # A curva do modelo sai no verde do brand e os pontos medidos no coral.
    cores = pg.evaluate("""() => {
        const cv = document.getElementById('chartMain');
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let verde = 0, coral = 0;
        for (let i = 0; i < d.length; i += 4) {
            if (Math.abs(d[i] - 0x89) < 6 && Math.abs(d[i + 1] - 0xce) < 6 && Math.abs(d[i + 2] - 0xa5) < 6) verde++;
            if (Math.abs(d[i] - 0xff) < 6 && Math.abs(d[i + 1] - 0x45) < 6 && Math.abs(d[i + 2] - 0x45) < 6) coral++;
        }
        return [verde, coral]; }""")
    assert cores[0] > 200 and cores[1] > 50

    for nome, valor in {"conf_acertos": "Perto do roteador.", "conf_premissa": "Espaço livre.",
                        "conf_evidencia": "Erro de 20 dB no P4.", "comp_va": "-60", "comp_vb": "-63",
                        "comp_3db": "Metade da potência.", "comp_video": "https://drive.google.com/x",
                        "adr_titulo": "Intervalo de 2 s", "adr_decisao": "Manter 2 s.", "adr_alternativa": "10 s.",
                        "adr_sugestao": "Média de 100 leituras.", "adr_razao": "Ficaria 200 s parado.",
                        "adr_consequencia": "Coleta de 10 leituras por ponto."}.items():
        pg.fill("[name=%s]" % nome, valor)
    pg.select_option("[name=adr_tipo]", "Rejeitada")
    pg.check("[name=decl]")
    assert "+3,0 dB" in pg.text_content("#leituraOut")
    assert "1,995 ×" in pg.text_content("#leituraOut")

    with pg.expect_download() as info:
        pg.click("#btnMd")
    with open(info.value.path(), encoding="utf-8") as fh:
        relatorio = fh.read()
    assert relatorio.startswith("# Relatório · Atividade - Mapa de Calor calculando dBm de sinal WiFi")
    assert "| P5 | interior do elevador | 25,0 | 3 | 5 | 2 | -85,0 |" in relatorio
    assert "previsão registrada antes do primeiro dado" in relatorio
    assert chr(0x2014) not in relatorio
    # Formulário completo: o aviso de pendências fica oculto (regressão de .note com display: flex).
    assert pg.is_hidden("#formStatus")

    with pg.expect_download() as info:
        pg.click("#btnAdr")
    with open(info.value.path(), encoding="utf-8") as fh:
        adr = fh.read()
    assert adr.startswith("# ADR: Intervalo de 2 s")
    assert "## Decisão sobre a sugestão (rejeitada)" in adr
    assert chr(0x2014) not in adr

    with pg.expect_download() as info:
        pg.click("#btnPng2")
    assert info.value.suggested_filename == "grafico-dbm.png"
    assert pagina.erros == []
