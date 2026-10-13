"""Animações da Aula 07: montam sem erro, sem cor literal, e mostram os números certos."""
import os
import re
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_widgets_aula07.html"
NOMES = ("pwm-ciclo", "barramento-i2c")


def test_as_duas_animacoes_montam_sem_erro():
    saida = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "check_widgets.py"), FIXTURE],
                           cwd=RAIZ, capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr
    assert "2 montado(s)" in saida.stdout


def test_nenhuma_cor_literal():
    for nome in NOMES:
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", fh.read()), nome


def test_cada_animacao_pede_previsao_e_pausa_fora_de_cena():
    for nome in NOMES:
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            codigo = fh.read()
        assert "Antes de mexer" in codigo, nome
        assert "closest('.reveal section')" in codigo, nome


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


def _medida(pg, nome):
    return pg.evaluate("""(n) => document.querySelector('[data-widget="' + n + '"] .anim-medida').textContent""",
                       nome)


def _ciclo(pg, valor):
    pg.evaluate("""(v) => { const r = document.querySelector('[data-widget="pwm-ciclo"] input');
        r.value = String(v); r.dispatchEvent(new Event('input')); }""", valor)


def test_pwm_de_25_por_cento_entrega_um_quarto_de_3v3(pagina):
    _ciclo(pagina, 25)
    assert _medida(pagina, "pwm-ciclo") == "25% · média 0,83 V"


def test_pwm_de_50_por_cento_tem_luminosidade_cie_de_76(pagina):
    _ciclo(pagina, 50)
    assert _medida(pagina, "pwm-ciclo") == "50% · média 1,65 V"
    painel = pagina.evaluate("""() => document.querySelector('[data-widget="pwm-ciclo"]').textContent""")
    assert "L* = 76" in painel, painel


def test_onda_tem_largura_alta_proporcional_ao_ciclo(pagina):
    """No ciclo de 50% o trecho em nível alto de cada período ocupa metade do período."""
    _ciclo(pagina, 50)
    d = pagina.evaluate("""() => document.querySelector('[data-widget="pwm-ciclo"] path.pwm-onda').getAttribute('d')""")
    pontos = [tuple(map(float, p.strip().split(" "))) for p in re.split(r"[ML]", d) if p.strip()]
    ys = sorted({y for _, y in pontos})
    alto = ys[0]
    xs_alto = [x for x, y in pontos if y == alto]
    largura_alta = xs_alto[1] - xs_alto[0]
    _ciclo(pagina, 25)
    d = pagina.evaluate("""() => document.querySelector('[data-widget="pwm-ciclo"] path.pwm-onda').getAttribute('d')""")
    pontos = [tuple(map(float, p.strip().split(" "))) for p in re.split(r"[ML]", d) if p.strip()]
    xs_alto25 = [x for x, y in pontos if y == alto]
    assert abs((xs_alto25[1] - xs_alto25[0]) * 2 - largura_alta) < 0.5


def _clicar(pg, rotulo):
    pg.evaluate("""(r) => Array.from(document.querySelectorAll('[data-widget="barramento-i2c"] button'))
        .find(b => b.textContent === r).click()""", rotulo)


def _esperar_resultado(pg):
    pg.wait_for_function("""() => /ACK/.test(document.querySelector(
        '[data-widget="barramento-i2c"] .anim-medida').textContent)""", timeout=10000)


def test_endereco_do_lcd_recebe_ack_so_quando_o_pulso_chega(pagina):
    """O resultado não aparece no clique, para não antecipar a previsão."""
    pagina.evaluate("() => Reveal.slide(1)")
    _clicar(pagina, "0x27")
    assert _medida(pagina, "barramento-i2c") == "0x27 · 0100111"
    _esperar_resultado(pagina)
    assert _medida(pagina, "barramento-i2c") == "0x27 · 0100111 · ACK"


def test_endereco_sugerido_errado_recebe_nack_ao_fim_do_pulso(pagina):
    pagina.evaluate("() => Reveal.slide(1)")
    _clicar(pagina, "0x3F")
    assert _medida(pagina, "barramento-i2c") == "0x3F · 0111111"
    _esperar_resultado(pagina)
    assert _medida(pagina, "barramento-i2c") == "0x3F · 0111111 · NACK"


def test_varredura_acha_os_dois_dispositivos(pagina):
    """A varredura anima endereço por endereço e só anda com o slide em cena."""
    pagina.evaluate("() => Reveal.slide(1)")
    _clicar(pagina, "Varrer")
    assert _medida(pagina, "barramento-i2c").startswith("varrendo")
    pagina.wait_for_function("""() => document.querySelector('[data-widget="barramento-i2c"] .anim-medida')
        .textContent.indexOf('dispositivos') >= 0""", timeout=15000)
    assert _medida(pagina, "barramento-i2c") == "2 dispositivos: 0x27, 0x68"


def test_varredura_pausa_com_o_slide_fora_de_cena(pagina):
    pagina.evaluate("() => Reveal.slide(0)")
    _clicar(pagina, "Varrer")
    pagina.wait_for_timeout(3500)
    assert _medida(pagina, "barramento-i2c") == "varrendo 0x08"
