"""Animações da Aula 11: montam sem erro, sem cor literal, e contam o que o modelo de ameaça diz."""
import os
import re
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_widgets_aula11.html"
SUP = '[data-widget="superficie-ataque"]'
HS = '[data-widget="handshake-tls"]'


def test_as_duas_animacoes_montam_sem_erro():
    saida = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "check_widgets.py"), FIXTURE],
                           cwd=RAIZ, capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr
    assert "2 montado(s)" in saida.stdout


def test_nenhuma_cor_literal():
    for nome in ("superficie-ataque", "handshake-tls"):
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", fh.read()), nome


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


def _texto(pg, seletor):
    return pg.evaluate("(s) => document.querySelector(s).textContent", seletor)


def _defesa(pg, chave):
    pg.evaluate("(k) => document.querySelector('%s button[data-defesa=\"' + k + '\"]').click()" % SUP, chave)


def test_previsao_vem_antes_do_primeiro_controle(pagina):
    for seletor in (SUP, HS):
        ordem = pagina.evaluate("""(s) => {
            const painel = document.querySelector(s + ' .anim-painel');
            const nos = [...painel.querySelectorAll('p, button, input')];
            const previsao = nos.findIndex(n => n.tagName === 'P' && n.textContent.startsWith('Antes de'));
            const controle = nos.findIndex(n => n.tagName !== 'P');
            return [previsao, controle];
        }""", seletor)
        assert 0 <= ordem[0] < ordem[1], (seletor, ordem)


def test_sem_defesa_os_seis_pontos_estao_abertos(pagina):
    assert _texto(pagina, SUP + " .anim-medida") == "6 de 6 pontos abertos"
    assert pagina.evaluate("document.querySelectorAll('%s [data-ponto][data-aberto=\"sim\"]').length" % SUP) == 6


def test_tls_fecha_os_dois_pontos_da_rede(pagina):
    _defesa(pagina, "tls")
    assert _texto(pagina, SUP + " .anim-medida") == "4 de 6 pontos abertos"


def test_senha_sem_tls_nao_fecha_o_broker(pagina):
    """Sem TLS, a senha do CONNECT viaja em texto claro na porta 1883."""
    _defesa(pagina, "senha")
    assert _texto(pagina, SUP + " .anim-medida") == "6 de 6 pontos abertos"
    _defesa(pagina, "tls")
    assert _texto(pagina, SUP + " .anim-medida") == "3 de 6 pontos abertos"


def test_cinco_defesas_fecham_os_seis_pontos_e_o_botao_desliga(pagina):
    for chave in ("repositorio", "flash", "tls", "senha", "api"):
        _defesa(pagina, chave)
    assert _texto(pagina, SUP + " .anim-medida") == "0 de 6 pontos abertos"
    _defesa(pagina, "repositorio")
    assert _texto(pagina, SUP + " .anim-medida") == "1 de 6 pontos abertos"


def _modo(pg, modo):
    pg.evaluate("(m) => document.querySelector('%s button[data-modo=\"' + m + '\"]').click()" % HS, modo)


def _avancar(pg, vezes):
    for _ in range(vezes):
        pg.evaluate("() => document.querySelector('%s button[data-acao=\"proxima\"]').click()" % HS)


def test_sem_tls_o_observador_le_a_senha_do_connect(pagina):
    _modo(pagina, "sem-tls")
    _avancar(pagina, 1)
    assert "mensagem 1 de 3" in _texto(pagina, HS + " .anim-medida")
    assert "senha legíveis" in _texto(pagina, HS + " .anim-observador")


def test_tls12_leva_duas_idas_e_voltas_e_mostra_o_certificado(pagina):
    _modo(pagina, "tls12")
    _avancar(pagina, 2)
    assert "certificado legível" in _texto(pagina, HS + " .anim-observador")
    _avancar(pagina, 3)
    medida = _texto(pagina, HS + " .anim-medida")
    assert "mensagem 5 de 6" in medida and "2 idas e voltas" in medida, medida
    assert "cifrado" in _texto(pagina, HS + " .anim-observador")


def test_tls13_leva_uma_ida_e_volta_e_cifra_o_certificado(pagina):
    _modo(pagina, "tls13")
    _avancar(pagina, 2)
    assert "certificado cifrado" in _texto(pagina, HS + " .anim-observador")
    medida = _texto(pagina, HS + " .anim-medida")
    assert "de 5" in medida and "1 ida e volta" in medida, medida


def test_ponto_5_so_fecha_com_o_broker_de_sala_que_confere_a_senha(pagina):
    """O broker público aceitou senha inventada com CONNACK 0: a defesa do ponto 5 é
    o broker de sala (P7), e o rótulo precisa dizer isso."""
    rotulo = _texto(pagina, SUP + ' button[data-defesa="senha"]')
    assert "broker de sala" in rotulo.lower() and "P7" in rotulo, rotulo
    _defesa(pagina, "senha")
    _defesa(pagina, "tls")
    linha5 = pagina.evaluate("() => [...document.querySelectorAll('%s svg text')]"
                             ".map(t => t.textContent).find(t => t.startsWith('5.'))" % SUP)
    assert "fechado" in linha5 and "P7" in linha5, linha5


def test_tls12_o_server_key_exchange_expoe_a_chave_temporaria_do_servidor(pagina):
    _modo(pagina, "tls12")
    _avancar(pagina, 2)
    obs = _texto(pagina, HS + " .anim-observador")
    assert "ServerKeyExchange" in obs and "servidor" in obs, obs


def test_texto_das_mensagens_tem_ao_menos_14_px(pagina):
    _modo(pagina, "tls13")
    _avancar(pagina, 5)
    tamanhos = pagina.evaluate("() => [...document.querySelectorAll('%s svg text')]"
                               ".map(t => parseFloat(getComputedStyle(t).fontSize))" % HS)
    assert tamanhos and min(tamanhos) >= 14, tamanhos


def test_no_print_pdf_o_handshake_sai_completo_em_tls12():
    """Na impressão não há clique: o slide precisa sair com o TLS 1.2 desenhado inteiro."""
    httpd = check_slides.servir(0)
    try:
        with sync_playwright() as p:
            navegador = p.chromium.launch()
            pg = navegador.new_page(viewport={"width": 1280, "height": 720})
            pg.goto("http://127.0.0.1:%d/%s?print-pdf" % (httpd.server_address[1], FIXTURE))
            pg.wait_for_function("document.querySelectorAll('[data-pronto=\"sim\"]').length === 2")
            medida = _texto(pg, HS + " .anim-medida")
            assert "TLS 1.2" in medida and "mensagem 6 de 6" in medida, medida
            navegador.close()
    finally:
        httpd.shutdown()
