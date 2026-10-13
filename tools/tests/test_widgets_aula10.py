"""Animações da Aula 10: montam sem erro, sem cor literal, e mostram os números certos."""
import os
import re
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_widgets_aula10.html"
NOMES = ("consumo-deepsleep", "ciclo-integrado")


def test_as_duas_animacoes_montam_sem_erro():
    saida = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "check_widgets.py"), FIXTURE],
                           cwd=RAIZ, capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr
    assert "2 montado(s)" in saida.stdout


def test_nenhuma_cor_literal_e_previsao_antes_dos_controles():
    for nome in NOMES:
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            codigo = fh.read()
        assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", codigo), nome
        assert "Antes de mexer" in codigo, nome
        assert "closest('.reveal section')" in codigo, nome


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


def _texto(pg, widget, seletor=".anim-medida"):
    return pg.evaluate("""([w, s]) => document.querySelector('[data-widget="' + w + '"] ' + s).textContent""",
                       [widget, seletor])


def _clicar(pg, widget, acao):
    pg.evaluate("""([w, a]) => document.querySelector('[data-widget="' + w + '"] [data-acao="' + a + '"]').click()""",
                [widget, acao])


def _sono(pg, indice):
    pg.evaluate("""(i) => { const r = document.querySelector('[data-widget="consumo-deepsleep"] input[type=range]');
        r.value = String(i); r.dispatchEvent(new Event('input')); }""", indice)


def _pulsos(pg):
    return pg.evaluate("""() => document.querySelectorAll('[data-widget="consumo-deepsleep"] .anim-pulso').length""")


def test_uma_leitura_por_semana_com_10_ua_dura_7151_dias(pagina):
    assert _texto(pagina, "consumo-deepsleep") == "7.151 dias"
    detalhe = _texto(pagina, "consumo-deepsleep", ".anim-detalhe")
    assert "86%" in detalhe and "sono" in detalhe, detalhe
    assert _pulsos(pagina) == 1


def test_uma_leitura_por_hora_derruba_para_290_dias(pagina):
    _clicar(pagina, "consumo-deepsleep", "intervalo-3600")
    assert _texto(pagina, "consumo-deepsleep") == "290 dias"
    assert _pulsos(pagina) == 168


def test_placa_dormindo_em_1_ma_fica_abaixo_de_150_dias(pagina):
    rotulos = pagina.evaluate("""() => JSON.parse(document.querySelector(
        '[data-widget="consumo-deepsleep"] input[type=range]').dataset.rotulos)""")
    _sono(pagina, rotulos.index("1 mA"))
    assert _texto(pagina, "consumo-deepsleep") == "83 dias"
    assert "abaixo de 150 dias" in _texto(pagina, "consumo-deepsleep", ".anim-detalhe")


def test_transmitir_a_240_ma_reduz_a_autonomia(pagina):
    _clicar(pagina, "consumo-deepsleep", "ativa-240")
    assert _texto(pagina, "consumo-deepsleep") == "5.966 dias"


def test_tres_semanas_sem_rede_deixam_tres_eventos_na_fila(pagina):
    assert _texto(pagina, "ciclo-integrado") == "dia 0 · NO PRAZO · fila 0 · publicados 1"
    _clicar(pagina, "ciclo-integrado", "rede")
    for _ in range(3):
        _clicar(pagina, "ciclo-integrado", "avancar")
    assert _texto(pagina, "ciclo-integrado") == "dia 21 · NO PRAZO · fila 3 · publicados 1"
    _clicar(pagina, "ciclo-integrado", "rede")
    _clicar(pagina, "ciclo-integrado", "avancar")
    assert _texto(pagina, "ciclo-integrado") == "dia 28 · NO PRAZO · fila 0 · publicados 5"
    _clicar(pagina, "ciclo-integrado", "avancar")
    assert _texto(pagina, "ciclo-integrado") == "dia 35 · ATRASADO · fila 0 · publicados 7"


def test_lacre_rompido_entra_na_fila_no_despertar_seguinte(pagina):
    _clicar(pagina, "ciclo-integrado", "rede")
    _clicar(pagina, "ciclo-integrado", "lacre")
    _clicar(pagina, "ciclo-integrado", "avancar")
    assert _texto(pagina, "ciclo-integrado") == "dia 7 · NO PRAZO · fila 2 · publicados 1"
    caixas = pagina.evaluate("""() => Array.from(document.querySelectorAll(
        '[data-widget="ciclo-integrado"] .anim-evento')).map(e => e.textContent)""")
    assert "lacre" in caixas


def test_permanencia_longa_a_partir_de_150_dias(pagina):
    for _ in range(22):
        _clicar(pagina, "ciclo-integrado", "avancar")
    assert _texto(pagina, "ciclo-integrado").startswith("dia 154 · PERMANÊNCIA LONGA")
