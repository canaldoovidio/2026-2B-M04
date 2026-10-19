"""Ponderada 1 (circuito RC): página do Prof. Roberto Cândido adaptada à marca do acervo (ADR-011).

Confere que a adaptação não quebrou o fluxo do aluno (previsão, importação dos pontos, gráfico e
relatório) e que cores e fontes vêm dos tokens do brand, inclusive no canvas e no SVG, onde var()
não funciona e a leitura dos tokens precisa acontecer em JavaScript.
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

PASTA = os.path.join(RAIZ, "ponderadas", "ponderada-1")
PAGINA = "ponderadas/ponderada-1/index.html"


def _ler(nome):
    with open(os.path.join(PASTA, nome), encoding="utf-8") as fh:
        return fh.read()


@pytest.mark.parametrize("nome", ["index.html", "../comum/ponderada.css", "ponderada.js"])
def test_sem_travessao_nem_simbolo_de_texto(nome):
    texto = _ler(nome)
    assert chr(0x2014) not in texto
    assert chr(0x2713) not in texto


def test_js_sem_cor_nem_fonte_literal():
    js = _ler("ponderada.js")
    assert not re.search(r"'#[0-9a-fA-F]{3,6}'|rgba?\(", js)
    assert "IBM Plex" not in js


def test_pagina_carrega_o_brand_antes_da_folha_propria():
    html = _ler("index.html")
    assert html.index("assets/css/inteli-brand.css") < html.index("ponderada.css")
    assert "fonts.googleapis.com" not in html


def test_credito_ao_autor_original():
    html = _ler("index.html")
    assert "Roberto Cândido" in html
    assert "https://robertocandido-inteli.github.io/ponderada-1/" in html


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


def test_fontes_do_brand(pagina):
    corpo = pagina.evaluate("() => getComputedStyle(document.body).fontFamily")
    titulo = pagina.evaluate("() => getComputedStyle(document.querySelector('h1')).fontFamily")
    codigo = pagina.evaluate("() => getComputedStyle(document.querySelector('.code-pre')).fontFamily")
    assert "Manrope" in corpo
    assert "Platypi" in titulo
    assert "Space Mono" in codigo


def test_esquema_usa_o_roxo_do_brand(pagina):
    placa = pagina.evaluate("() => document.querySelector('#schematic rect').getAttribute('fill')")
    assert placa.lower() == "#2e2640"


def _pontos_teoricos(tau=1000.0, vs=5.0, n=40):
    linhas = ["t_ms,v"]
    for i in range(n):
        t = 5 * tau * (i / (n - 1)) ** 2
        linhas.append("%d,%.3f" % (t, vs * (1 - math.exp(-t / tau)) * 0.97))
    linhas.append("# fim")
    return "\n".join(linhas)


def test_fluxo_completo_gera_relatorio_sem_travessao(pagina):
    pg = pagina
    for nome, valor in [("nome", "Aluno Teste"), ("email", "aluno@inteli.edu.br"), ("turma", "T24"),
                        ("ctx_r", "10000"), ("ctx_c", "100"), ("ctx_vs", "5"), ("ctx_tau", "1000"),
                        ("ctx_tau_calc", "10000 x 100e-6 = 1 s"), ("ctx_v_tau", "3.16"), ("ctx_tol", "10"),
                        ("ctx_tol_just", "Tolerância de fábrica do eletrolítico.")]:
        pg.fill("[name=%s]" % nome, valor)
    # A conferência da previsão usa o ícone do Material Symbols, não um caractere de texto.
    assert pg.locator("#ctxCheck .ok .material-symbols-outlined").count() == 2

    pg.click("#btnLock")
    assert pg.text_content("#lockStatus").startswith("Previsão registrada em")

    pg.fill("#pasteBox", _pontos_teoricos())
    pg.click("#btnImport")
    assert pg.locator("#dataTable tbody tr").count() == 40

    # A curva teórica é desenhada no verde do brand (#89cea5) sobre o branco.
    verde = pg.evaluate("""() => {
        const cv = document.getElementById('chartTheory');
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4)
            if (Math.abs(d[i] - 0x89) < 6 && Math.abs(d[i + 1] - 0xce) < 6 && Math.abs(d[i + 2] - 0xa5) < 6) n++;
        return n;
    }""")
    assert verde > 200

    with pg.expect_download() as info:
        pg.click("#btnMd")
    with open(info.value.path(), encoding="utf-8") as fh:
        relatorio = fh.read()
    assert relatorio.startswith("# Relatório da Ponderada 1")
    assert chr(0x2014) not in relatorio
    assert pagina.erros == []
