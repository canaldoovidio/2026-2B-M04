"""Base comum das páginas de ponderada (ADR-012): tokens lidos, registro com horário e rascunho."""
import os
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_ponderada_base.html"


def test_base_sem_travessao_nem_cor_literal():
    import re
    with open(os.path.join(RAIZ, "ponderadas", "comum", "ponderada-base.js"), encoding="utf-8") as fh:
        js = fh.read()
    assert chr(0x2014) not in js
    assert not re.search(r"'#[0-9a-fA-F]{3,6}'|rgba?\(", js)


@pytest.fixture()
def pagina():
    httpd = check_slides.servir(0)
    erros = []
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pg = navegador.new_page()
        pg.on("pageerror", lambda e: erros.append(str(e)))
        pg.goto("http://127.0.0.1:%d/%s" % (httpd.server_address[1], FIXTURE))
        pg.erros = erros
        yield pg
        navegador.close()
    httpd.shutdown()


def test_tokens_do_brand_chegam_ao_js(pagina):
    cores = pagina.evaluate("() => Ponderada.C")
    assert cores["roxo"].lower() == "#2e2640"
    assert cores["verde"].lower() == "#89cea5"
    assert cores["coral"].lower() == "#ff4545"
    assert "Space Mono" in pagina.evaluate("() => Ponderada.FM")


def test_formatacao_pt_br_e_valor_ausente(pagina):
    assert pagina.evaluate("() => Ponderada.fmt(1234.5, 1)") == "1.234,5"
    assert pagina.evaluate("() => Ponderada.num('3,5')") == 3.5
    assert pagina.evaluate("() => Ponderada.fmt(NaN)") == "n/d"
    assert pagina.evaluate("() => Ponderada.L('')") == "n/d"


def test_registro_exige_campos_e_marca_alteracao_posterior(pagina):
    pg = pagina
    pg.evaluate("""() => { window.t = Ponderada.trava({ etapa: document.getElementById('etapa'),
        botao: document.getElementById('btn'), status: document.getElementById('st'), rotulo: 'previsão' }); }""")
    pg.click("#btn")
    assert "campo(s) obrigatório(s)" in pg.text_content("#st")
    assert pg.evaluate("() => t.registrado()") is False
    pg.fill("[name=previsao]", "300")
    pg.click("#btn")
    assert pg.text_content("#st").startswith("Registrado(a) em")
    pg.fill("[name=previsao]", "310")
    assert pg.evaluate("() => t.estado().alterado") is True
    assert "alteração final não registrada" in pg.evaluate("() => t.historico()")
    assert pg.erros == []


def test_rascunho_sobrevive_a_recarga(pagina):
    pg = pagina
    pg.fill("[name=previsao]", "42")
    pg.evaluate("() => { const r = Ponderada.rascunho(document.getElementById('f'), 'teste-base'); r.salvar({ x: 1 }); }")
    pg.wait_for_timeout(400)
    pg.reload()
    extra = pg.evaluate("() => Ponderada.rascunho(document.getElementById('f'), 'teste-base').restaurar()")
    assert extra == {"x": 1}
    assert pg.input_value("[name=previsao]") == "42"


def test_eixos_desenham_no_canvas(pagina):
    n = pagina.evaluate("""() => {
        const { ctx, W, H } = Ponderada.prepararCanvas(document.getElementById('cv'));
        Ponderada.eixos(ctx, W, H, { x: [0, 10], y: [-90, -30], rotX: 'ponto', rotY: 'dBm' });
        const d = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
        let k = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 100 && d[i + 2] < 100) k++;
        return k; }""")
    assert n > 100
