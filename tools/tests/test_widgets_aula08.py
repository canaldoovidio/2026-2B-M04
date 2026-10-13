"""Animações e painel da Aula 08: montam sem erro, sem cor literal, e mostram os números certos."""
import os
import re
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_widgets_aula08.html"
PAINEL = "labs/aula08-painel.html?offline=1"


def test_as_duas_animacoes_montam_sem_erro():
    saida = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "check_widgets.py"), FIXTURE],
                           cwd=RAIZ, capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr
    assert "2 montado(s)" in saida.stdout


def test_nenhuma_cor_literal():
    for caminho in (("widgets", "escala-dbm.js"), ("widgets", "atenuacao-sinal.js"), ("painel-rssi.js",)):
        with open(os.path.join(RAIZ, "assets", "js", *caminho), encoding="utf-8") as fh:
            assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", fh.read()), caminho


def test_animacoes_pausam_fora_de_cena_e_pedem_previsao():
    for nome in ("escala-dbm", "atenuacao-sinal"):
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            codigo = fh.read()
        if "requestAnimationFrame" in codigo:
            assert "closest('.reveal section')" in codigo, nome
        assert "Antes de mexer" in codigo, nome
        assert "getBoundingClientRect" not in codigo and "getPointAtLength" not in codigo, nome


@pytest.fixture(scope="module")
def servidor():
    httpd = check_slides.servir(0)
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        yield navegador, "http://127.0.0.1:%d/" % httpd.server_address[1]
        navegador.close()
    httpd.shutdown()


@pytest.fixture(scope="module")
def pagina(servidor):
    navegador, base = servidor
    pg = navegador.new_page(viewport={"width": 1280, "height": 720})
    pg.goto(base + FIXTURE)
    pg.wait_for_function("document.querySelectorAll('[data-pronto=\"sim\"]').length === 2")
    return pg


def _medida(pg, nome):
    return pg.evaluate("""(n) => document.querySelector('[data-widget="' + n + '"] .anim-medida').textContent""", nome)


def _faixa(pg, nome, indice, valor):
    pg.evaluate("""([n, i, v]) => { const r = document.querySelectorAll('[data-widget="' + n + '"] input')[i];
        r.value = String(v); r.dispatchEvent(new Event('input')); }""", [nome, indice, valor])


def _botao(pg, nome, texto):
    pg.evaluate("""([n, t]) => Array.from(document.querySelectorAll('[data-widget="' + n + '"] button'))
        .find(b => b.textContent.startsWith(t)).click()""", [nome, texto])


def test_menos_60_contra_menos_90_dbm_e_mil_vezes(pagina):
    assert _medida(pagina, "escala-dbm") == "Δ 30 dB · 1000 ×"


def test_tres_db_dobram_e_dez_db_multiplicam_por_dez(pagina):
    _faixa(pagina, "escala-dbm", 1, -63)
    assert _medida(pagina, "escala-dbm") == "Δ 3 dB · 2,0 ×"
    _botao(pagina, "escala-dbm", "−10 dB")
    assert _medida(pagina, "escala-dbm") == "Δ 13 dB · 20 ×"


def test_eixo_rotula_potencias_de_dez_em_mw(pagina):
    texto = pagina.evaluate("""() => document.querySelector('[data-widget="escala-dbm"] svg').textContent""")
    for rotulo in ("10−6", "10−9", "−60", "dBm", "mW"):
        assert rotulo in texto, rotulo


def test_dez_metros_em_espaco_livre_custam_20_db(pagina):
    assert _medida(pagina, "atenuacao-sinal").startswith("queda 20,0 dB · ÷ 100")


def test_dobrar_a_distancia_custa_6_db_com_gama_2_e_9_db_com_gama_3(pagina):
    _faixa(pagina, "atenuacao-sinal", 0, 2)
    assert _medida(pagina, "atenuacao-sinal").startswith("queda 6,0 dB · ÷ 4,0")
    _botao(pagina, "atenuacao-sinal", "γ 3,0")
    assert _medida(pagina, "atenuacao-sinal").startswith("queda 9,0 dB")


def test_parede_metalica_soma_a_perda_declarada(pagina):
    _faixa(pagina, "atenuacao-sinal", 1, 10)
    assert _medida(pagina, "atenuacao-sinal").startswith("queda 19,0 dB")


@pytest.fixture(scope="module")
def painel(servidor):
    navegador, base = servidor
    pg = navegador.new_page(viewport={"width": 1280, "height": 900})
    pg.goto(base + PAINEL)
    pg.wait_for_function("document.querySelectorAll('#ultima-comunicacao tbody tr').length === 3")
    return pg


def test_painel_lista_a_ultima_comunicacao_dos_tres_ciclos_abertos(painel):
    linhas = painel.evaluate("""() => Array.from(document.querySelectorAll('#ultima-comunicacao tbody tr'))
        .map(tr => Array.from(tr.cells).map(td => td.textContent.trim()))""")
    por_ciclo = {l[0]: l for l in linhas}
    assert set(por_ciclo) == {"CI-003", "CI-009", "CI-015"}
    assert por_ciclo["CI-015"][2:5] == ["26/09/2026", "5", "−57 dBm"], por_ciclo["CI-015"]
    assert por_ciclo["CI-009"][2:5] == ["01/10/2026", "0", "−85 dBm"], por_ciclo["CI-009"]


def test_painel_interpreta_a_mensagem_do_sketch(painel):
    ok = painel.evaluate("""() => PainelRssi.interpretar('{"dispositivo":"DV-01","seq":7,"rssi_dbm":-61,"uptime_s":14}')""")
    assert ok == {"dispositivo": "DV-01", "seq": 7, "rssi_dbm": -61, "uptime_s": 14}
    assert painel.evaluate("() => PainelRssi.interpretar('texto solto')") is None
    assert painel.evaluate("""() => PainelRssi.interpretar('{"rssi_dbm":"forte"}')""") is None


def test_painel_desenha_cada_leitura_recebida_e_marca_o_status(painel):
    painel.evaluate("""() => {
        PainelRssi.receber('inteli-m04/t24/dupla00/DV-01/rssi', '{"dispositivo":"DV-01","seq":1,"rssi_dbm":-61,"uptime_s":2}');
        PainelRssi.receber('inteli-m04/t24/dupla00/DV-01/rssi', '{"dispositivo":"DV-01","seq":2,"rssi_dbm":-64,"uptime_s":4}');
    }""")
    assert painel.evaluate("() => document.querySelectorAll('#grafico-rssi circle').length") == 2
    assert painel.text_content("#leitura-atual").strip() == "−64 dBm"
    painel.evaluate("() => PainelRssi.receber('inteli-m04/t24/dupla00/DV-01/status', 'offline')")
    assert painel.text_content("#status-dispositivo").strip() == "offline"
