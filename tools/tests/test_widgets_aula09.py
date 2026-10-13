"""Animações da Aula 09: montam sem erro, sem cor literal, e mostram os números certos."""
import os
import re
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_widgets_aula09.html"
NOMES = ("rele-carga", "caminho-alerta")


def test_as_duas_animacoes_montam_sem_erro():
    saida = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "check_widgets.py"), FIXTURE],
                           cwd=RAIZ, capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr
    assert "2 montado(s)" in saida.stdout


def test_nenhuma_cor_literal():
    for nome in NOMES:
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", fh.read()), nome


def test_widgets_seguem_as_regras_do_runtime():
    """visivel() pela section do Reveal, nada de medir layout, previsão antes do controle."""
    for nome in NOMES:
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            codigo = fh.read()
        assert "closest('.reveal section')" in codigo, nome
        assert "getBoundingClientRect" not in codigo and "getPointAtLength" not in codigo, nome
        assert "Antes de" in codigo, nome


@pytest.fixture()
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
    return pg.evaluate("""(n) => document.querySelector('[data-widget="' + n + '"] .anim-medida').textContent""", nome)


def _clicar(pg, nome, acao):
    pg.evaluate("""([n, a]) => document.querySelector('[data-widget="' + n + '"] button[data-acao="' + a + '"]').click()""",
                [nome, acao])


def _alerta(pg):
    return pg.evaluate("""() => { const a = document.querySelector('[data-widget="rele-carga"] .anim-alerta');
        return [a.textContent, a.classList.contains('anim-alerta-visivel')]; }""")


def test_bobina_puxa_71_4_ma_e_fecha_o_contato_no(pagina):
    assert _medida(pagina, "rele-carga") == "bobina 0 mA · NO aberto"
    _clicar(pagina, "rele-carga", "gpio")
    assert _medida(pagina, "rele-carga") == "bobina 71,4 mA · NO fechado"


def test_desligar_sem_diodo_avisa_pico_e_com_diodo_limita_a_0_7_v(pagina):
    _clicar(pagina, "rele-carga", "gpio")
    _clicar(pagina, "rele-carga", "gpio")
    texto, visivel = _alerta(pagina)
    assert visivel and "0,7 V" in texto, texto
    _clicar(pagina, "rele-carga", "diodo")          # retira o diodo
    _clicar(pagina, "rele-carga", "gpio")
    _clicar(pagina, "rele-carga", "gpio")
    texto, visivel = _alerta(pagina)
    assert visivel and "centenas de volts" in texto, texto
    assert _medida(pagina, "rele-carga") == "bobina 0 mA · NO aberto"


def test_rele_carga_separa_comando_de_potencia_e_marca_a_rede(pagina):
    texto = pagina.evaluate("""() => document.querySelector('[data-widget="rele-carga"] svg').textContent""")
    assert "Comando" in texto and "Potência" in texto
    assert "127/220 V" in texto


def _ir_ao_slide_do_caminho(pg):
    """O laço pausa fora de cena: o caminho-alerta está no segundo slide."""
    pg.evaluate("() => Reveal.slide(1)")
    pg.wait_for_function("() => document.querySelector('[data-widget=\"caminho-alerta\"]').closest('section').classList.contains('present')")


def test_caminho_com_confirmacao_da_7_saltos_e_liga_o_rele(pagina):
    _ir_ao_slide_do_caminho(pagina)
    assert _medida(pagina, "caminho-alerta") == "saltos 0 · relé desligado"
    confirmar = """() => document.querySelector('[data-widget="caminho-alerta"] button[data-acao="confirmar"]').disabled"""
    assert pagina.evaluate(confirmar), "confirmar habilitado sem alerta armado"
    _clicar(pagina, "caminho-alerta", "permanencia")
    pagina.wait_for_function("""() => document.querySelector('[data-widget="caminho-alerta"] .anim-medida')
        .textContent.indexOf('aguardando') >= 0""", timeout=10000)
    assert _medida(pagina, "caminho-alerta").startswith("saltos 4 ·")
    _clicar(pagina, "caminho-alerta", "confirmar")
    pagina.wait_for_function("""() => document.querySelector('[data-widget="caminho-alerta"] .anim-medida')
        .textContent === 'saltos 7 · relé ligado'""", timeout=10000)


def test_caminho_sem_confirmacao_desarma_e_o_rele_nao_liga(pagina):
    _ir_ao_slide_do_caminho(pagina)
    _clicar(pagina, "caminho-alerta", "lacre")
    pagina.wait_for_function("""() => document.querySelector('[data-widget="caminho-alerta"] .anim-medida')
        .textContent === 'saltos 4 · desarmado sem confirmação'""", timeout=15000)
    rotulos = pagina.evaluate("""() => document.querySelector('[data-widget="caminho-alerta"] svg').textContent""")
    assert "Broker" in rotulos and "Relé" in rotulos and "Operador" in rotulos
