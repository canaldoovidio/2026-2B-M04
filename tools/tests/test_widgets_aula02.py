"""Animações da Aula 02: montam sem erro, sem cor literal, e mostram os números certos."""
import os
import re
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_widgets_aula02.html"


def test_as_duas_animacoes_montam_sem_erro():
    saida = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "check_widgets.py"), FIXTURE],
                           cwd=RAIZ, capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr
    assert "2 montado(s)" in saida.stdout


def test_nenhuma_cor_literal():
    for nome in ("bounce-botao", "carga-rc"):
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", fh.read()), nome


@pytest.fixture(scope="module")
def pagina():
    httpd = check_slides.servir(0)
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pg = navegador.new_page(viewport={"width": 1280, "height": 720})
        pg.goto("http://127.0.0.1:%d/%s" % (httpd.server_address[1], FIXTURE))
        pg.wait_for_function("document.querySelectorAll('[data-pronto=\"sim\"]').length === 2")
        yield pg
        navegador.close()
    httpd.shutdown()


def _contagem(pg):
    return pg.evaluate("""() => document.querySelector('[data-widget="bounce-botao"] .anim-medida').textContent""")


def test_bounce_conta_seis_toques_sem_filtro_e_um_com_janela_de_2_ms(pagina):
    assert _contagem(pagina) == "bruto 6 · RC 6 · firmware 6"
    pagina.evaluate("""() => { const r = document.querySelectorAll('[data-widget="bounce-botao"] input')[1];
        r.value = '2'; r.dispatchEvent(new Event('input')); }""")
    assert _contagem(pagina).endswith("firmware 1")


def test_filtro_rc_de_2_ms_elimina_o_bounce(pagina):
    pagina.evaluate("""() => { const r = document.querySelectorAll('[data-widget="bounce-botao"] input')[0];
        r.value = '2'; r.dispatchEvent(new Event('input')); }""")
    assert re.search(r"RC 1 ·", _contagem(pagina)), _contagem(pagina)


def test_constante_de_tempo_de_10_kohm_e_100_uf_e_1_segundo(pagina):
    texto = pagina.evaluate("""() => document.querySelector('[data-widget="carga-rc"] .anim-medida').textContent""")
    assert texto.startswith("τ = 1,0 s"), texto
    pagina.evaluate("""() => { const c = document.querySelectorAll('[data-widget="carga-rc"] input')[1];
        c.value = '4'; c.dispatchEvent(new Event('input')); }""")
    texto = pagina.evaluate("""() => document.querySelector('[data-widget="carga-rc"] .anim-medida').textContent""")
    assert texto.startswith("τ = 2,2 s"), texto


def test_trilha_bruta_desce_quando_o_botao_e_apertado(pagina):
    """Com INPUT_PULLUP o pino fica em HIGH solto e cai para LOW apertado: a trilha
    do contato bruto começa no alto e está embaixo no meio do aperto (t = 20 ms)."""
    pontos = pagina.evaluate("""() => {
        const d = document.querySelector('[data-widget="bounce-botao"] svg path').getAttribute('d');
        return d.split(/[ML]/).filter(Boolean).map(p => p.trim().split(' ').map(Number));
    }""")
    inicio = pontos[0]
    meio = min(pontos, key=lambda p: abs(p[0] - (150 + 500 * 20 / 40)))
    assert meio[1] > inicio[1], (inicio, meio)   # y maior = mais baixo na tela


def test_limiares_de_entrada_rotulados(pagina):
    texto = pagina.evaluate("""() => document.querySelector('[data-widget="bounce-botao"] svg').textContent""")
    assert "0,6 Vcc" in texto and "0,3 Vcc" in texto
