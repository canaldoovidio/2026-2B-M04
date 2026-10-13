"""Animações da Aula 05: montam sem erro, sem cor literal, e mostram os números certos."""
import os
import re
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_widgets_aula05.html"
NOMES = ("quantizacao-adc", "divisor-bateria", "acelerometro-eixos")


def test_as_tres_animacoes_montam_sem_erro():
    saida = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "check_widgets.py"), FIXTURE],
                           cwd=RAIZ, capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr
    assert "3 montado(s)" in saida.stdout


def test_nenhuma_cor_literal_e_pausa_fora_de_cena():
    for nome in NOMES:
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            codigo = fh.read()
        assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", codigo), nome
        assert "closest('.reveal section')" in codigo, nome
        assert "getBoundingClientRect" not in codigo and "getPointAtLength" not in codigo, nome


@pytest.fixture(scope="module")
def pagina():
    httpd = check_slides.servir(0)
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pg = navegador.new_page(viewport={"width": 1280, "height": 720})
        pg.goto("http://127.0.0.1:%d/%s" % (httpd.server_address[1], FIXTURE))
        pg.wait_for_function("document.querySelectorAll('[data-pronto=\"sim\"]').length === 3")
        yield pg
        navegador.close()
    httpd.shutdown()


def _medida(pg, nome):
    return pg.evaluate("n => document.querySelector('[data-widget=\"' + n + '\"] .anim-medida').textContent", nome)


def _clicar(pg, nome, rotulo):
    pg.evaluate("""([n, r]) => [...document.querySelectorAll('[data-widget="' + n + '"] button')]
        .find(b => b.textContent === r).click()""", [nome, rotulo])


def _niveis(pg):
    """Quantos patamares distintos a escada quantizada tem na janela desenhada."""
    return pg.evaluate("""() => {
        const d = document.querySelector('[data-widget="quantizacao-adc"] path.anim-escada').getAttribute('d');
        const ys = d.split(/[MHVL]/).filter(Boolean);
        return new Set(d.match(/V\\s*[\\d.]+/g).map(v => v.replace(/V\\s*/, ''))).size;
    }""")


def test_quantizacao_comeca_no_uno_com_degrau_de_4_88_mv(pagina):
    assert _medida(pagina, "quantizacao-adc") == "degrau 4,88 mV · 1024 níveis"


def test_quantizacao_no_esp32_tem_degrau_seis_vezes_menor(pagina):
    niveis_uno = _niveis(pagina)
    _clicar(pagina, "quantizacao-adc", "12 bits")
    _clicar(pagina, "quantizacao-adc", "3,3 V")
    assert _medida(pagina, "quantizacao-adc") == "degrau 0,81 mV · 4096 níveis"
    niveis_esp = _niveis(pagina)
    assert niveis_esp >= 5 * niveis_uno, (niveis_uno, niveis_esp)
    _clicar(pagina, "quantizacao-adc", "10 bits")
    assert _medida(pagina, "quantizacao-adc") == "degrau 3,22 mV · 1024 níveis"


def test_divisor_de_100k_e_100k_leva_4_2_v_a_2606(pagina):
    assert _medida(pagina, "divisor-bateria") == "pino 2,10 V · leitura 2606"
    _clicar(pagina, "divisor-bateria", "3,3 V")
    assert _medida(pagina, "divisor-bateria") == "pino 1,65 V · leitura 2048"


def test_divisor_avisa_fora_da_faixa_calibrada_e_satura(pagina):
    _clicar(pagina, "divisor-bateria", "4,2 V")
    pagina.evaluate("""() => { const r = document.querySelector('[data-widget="divisor-bateria"] input');
        r.value = '4'; r.dispatchEvent(new Event('input')); }""")   # R2 = 220 kΩ
    texto = pagina.evaluate("() => document.querySelector('[data-widget=\"divisor-bateria\"] .anim-painel').textContent")
    assert _medida(pagina, "divisor-bateria") == "pino 2,89 V · leitura 3584"
    assert "2450 mV" in texto
    pagina.evaluate("""() => { const r = document.querySelector('[data-widget="divisor-bateria"] input');
        r.value = '5'; r.dispatchEvent(new Event('input')); }""")   # R2 = 470 kΩ
    assert _medida(pagina, "divisor-bateria").endswith("leitura 4095")


def test_corrente_do_divisor_e_21_microampere(pagina):
    pagina.evaluate("""() => { const r = document.querySelector('[data-widget="divisor-bateria"] input');
        r.value = '2'; r.dispatchEvent(new Event('input')); }""")   # R2 = 100 kΩ
    _clicar(pagina, "divisor-bateria", "4,2 V")
    texto = pagina.evaluate("() => document.querySelector('[data-widget=\"divisor-bateria\"] svg').textContent")
    assert "21 µA" in texto, texto


def test_acelerometro_parado_tombado_e_em_transporte(pagina):
    assert _medida(pagina, "acelerometro-eixos") == "desvio 0,00 g · parado"
    _clicar(pagina, "acelerometro-eixos", "Tombado")
    assert _medida(pagina, "acelerometro-eixos") == "desvio 1,41 g · remoção"
    _clicar(pagina, "acelerometro-eixos", "Em transporte")
    pico = pagina.evaluate("() => document.querySelector('[data-widget=\"acelerometro-eixos\"]').dataset.pico")
    assert float(pico) > 0.26, pico
    _clicar(pagina, "acelerometro-eixos", "Parado")
    assert _medida(pagina, "acelerometro-eixos") == "desvio 0,00 g · parado"


def test_animacoes_pedem_previsao_antes_do_primeiro_controle(pagina):
    for nome in NOMES:
        ordem = pagina.evaluate("""n => {
            const painel = document.querySelector('[data-widget="' + n + '"] .anim-painel');
            const nos = [...painel.querySelectorAll('p, input, button')];
            const prev = nos.findIndex(e => e.tagName === 'P' && e.textContent.startsWith('Antes de'));
            const ctrl = nos.findIndex(e => e.tagName !== 'P');
            return [prev, ctrl];
        }""", nome)
        assert 0 <= ordem[0] < ordem[1], (nome, ordem)


def test_tombado_confirma_o_evento_em_tres_amostras_de_500_ms(pagina):
    """Regressão: o laço só amostrava em transporte, e tombar parava em 1 de 3."""
    pagina.evaluate("Reveal.slide(2)")
    pagina.wait_for_timeout(600)
    _clicar(pagina, "acelerometro-eixos", "Tombado")
    pagina.wait_for_timeout(1700)
    texto = pagina.evaluate("() => document.querySelector('[data-widget=\"acelerometro-eixos\"] .anim-painel').textContent")
    assert "3 de 3 · evento confirmado" in texto, texto
