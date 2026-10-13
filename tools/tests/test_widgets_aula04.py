"""Animações da Aula 04: montam sem erro, sem cor literal, e mostram os números certos."""
import os
import re
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_widgets_aula04.html"
NOMES = ("buffer-circular", "aritmetica-ponteiros")


def _fonte(nome):
    with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
        return fh.read()


def test_as_duas_animacoes_montam_sem_erro():
    saida = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "check_widgets.py"), FIXTURE],
                           cwd=RAIZ, capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr
    assert "2 montado(s)" in saida.stdout


def test_nenhuma_cor_literal_e_pausa_fora_de_cena():
    for nome in NOMES:
        fonte = _fonte(nome)
        assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", fonte), nome
        assert "closest('.reveal section')" in fonte, nome
        assert "getPointAtLength" not in fonte and "getBoundingClientRect" not in fonte, nome


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


def _painel(pg, nome):
    return pg.evaluate("""(n) => document.querySelector('[data-widget="' + n + '"] .anim-painel').textContent""", nome)


def _botao(pg, nome, rotulo_inicio, vezes=1):
    pg.evaluate("""([n, r, v]) => {
        const b = [...document.querySelectorAll('[data-widget="' + n + '"] button')]
            .find(x => x.textContent.startsWith(r));
        for (let i = 0; i < v; i++) b.click();
    }""", [nome, rotulo_inicio, vezes])


def test_previsao_vem_antes_do_primeiro_controle(pagina):
    for nome in NOMES:
        ordem = pagina.evaluate("""(n) => {
            const painel = document.querySelector('[data-widget="' + n + '"] .anim-painel');
            const nos = [...painel.querySelectorAll('p, input, button')];
            const prev = nos.findIndex(x => x.tagName === 'P' && x.textContent.startsWith('Antes de'));
            const ctrl = nos.findIndex(x => x.tagName !== 'P');
            return [prev, ctrl];
        }""", nome)
        assert 0 <= ordem[0] < ordem[1], (nome, ordem)


def test_buffer_vazio_comeca_com_os_dois_ponteiros_na_posicao_0(pagina):
    assert _medida(pagina, "buffer-circular") == "escrita [0] · leitura [0] · guardados 0"


def test_dez_eventos_em_8_posicoes_levam_a_escrita_para_a_posicao_2(pagina):
    """Política padrão: descartar o mais antigo. 10 mod 8 = 2; os eventos 1 e 2 se perdem."""
    _botao(pagina, "buffer-circular", "Gerar evento", 10)
    assert _medida(pagina, "buffer-circular") == "escrita [2] · leitura [2] · guardados 8"
    assert "perdidos: 1, 2" in _painel(pagina, "buffer-circular")


def test_descartar_o_mais_novo_mantem_a_escrita_na_posicao_0(pagina):
    _botao(pagina, "buffer-circular", "Ao encher")
    _botao(pagina, "buffer-circular", "Gerar evento", 10)
    assert _medida(pagina, "buffer-circular") == "escrita [0] · leitura [0] · guardados 8"
    assert "perdidos: 9, 10" in _painel(pagina, "buffer-circular")


def test_conexao_de_volta_entrega_na_ordem_de_chegada(pagina):
    _botao(pagina, "buffer-circular", "Gerar evento", 10)
    _botao(pagina, "buffer-circular", "Conexão")
    pagina.wait_for_function("""() => document.querySelector('[data-widget="buffer-circular"] .anim-medida')
        .textContent.endsWith('guardados 0')""", timeout=15000)
    assert "enviados: 3, 4, 5, 6, 7, 8, 9, 10" in _painel(pagina, "buffer-circular")
    assert _medida(pagina, "buffer-circular") == "escrita [2] · leitura [2] · guardados 0"


def test_arco_da_volta_continua_visivel_depois_de_piscar(pagina):
    """Regressão da revisão de 13/10/2026: limpar o estilo inline depois do destaque
    apagava o traço do arco que mostra a volta de [7] para [0]."""
    _botao(pagina, "buffer-circular", "Gerar evento", 8)
    pagina.wait_for_timeout(900)
    traco = pagina.evaluate("""() => { const a = [...document.querySelectorAll('[data-widget="buffer-circular"] svg path')]
        .find(p => (p.getAttribute('d') || '').startsWith('M 690'));
        return getComputedStyle(a).stroke; }""")
    assert traco not in ("", "none"), traco


def _k(pg, valor):
    pg.evaluate("""(v) => { const r = document.querySelector('[data-widget="aritmetica-ponteiros"] input');
        r.value = String(v); r.dispatchEvent(new Event('input')); }""", valor)


def test_p_mais_1_num_int_anda_4_bytes(pagina):
    _k(pagina, 1)
    assert _medida(pagina, "aritmetica-ponteiros") == "p + 1 = 0x3FFB0014"


def test_p_mais_3_num_evento_anda_24_bytes(pagina):
    _botao(pagina, "aritmetica-ponteiros", "Evento")
    _k(pagina, 3)
    assert _medida(pagina, "aritmetica-ponteiros") == "p + 3 = 0x3FFB0028"


def test_p_mais_1_num_char_anda_1_byte(pagina):
    _botao(pagina, "aritmetica-ponteiros", "char")
    _k(pagina, 1)
    assert _medida(pagina, "aritmetica-ponteiros") == "p + 1 = 0x3FFB0011"
