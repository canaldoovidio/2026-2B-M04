"""Animações da Aula 03: montam sem erro, sem cor literal, e seguem as regras do ciclo.

maquina-estados: cada estado aceita um único evento; os outros três são recusados e
o estado não muda. contador-permanencia: os três ciclos abertos de dados/ciclos.csv
(190, 70 e 12 dias fora; prazos de 60, 30 e 45 dias) contra o limiar configurável,
com atraso e permanência contados separadamente.
"""
import os
import re
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_widgets_aula03.html"
NOMES = ("maquina-estados", "contador-permanencia")


def test_as_duas_animacoes_montam_sem_erro():
    saida = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "check_widgets.py"), FIXTURE],
                           cwd=RAIZ, capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr
    assert "2 montado(s)" in saida.stdout


def test_nenhuma_cor_literal_e_pausa_fora_de_cena():
    for nome in NOMES:
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            codigo = fh.read()
        assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", codigo), nome
        assert "closest('.reveal section')" in codigo, nome
        assert "getPointAtLength" not in codigo and "getBoundingClientRect" not in codigo, nome


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
    return pg.evaluate("n => document.querySelector('[data-widget=\"' + n + '\"] .anim-medida').textContent", nome)


def _clicar(pg, nome, rotulo):
    pg.evaluate("""([n, r]) => [...document.querySelectorAll('[data-widget="' + n + '"] button')]
        .find(b => b.textContent.trim() === r).click()""", [nome, rotulo])


def test_maquina_comeca_em_cadastrado_e_pede_previsao_antes_dos_botoes(pagina):
    assert _medida(pagina, "maquina-estados") == "cadastrado · aceitas 0 · recusadas 0"
    ordem = pagina.evaluate("""() => { const p = document.querySelector('[data-widget="maquina-estados"] .anim-painel');
        const filhos = [...p.querySelectorAll('p, button')];
        return [filhos.findIndex(e => e.textContent.startsWith('Antes de')),
                filhos.findIndex(e => e.tagName === 'BUTTON')]; }""")
    assert 0 <= ordem[0] < ordem[1], ordem


def test_evento_proibido_e_recusado_e_o_estado_nao_muda(pagina):
    _clicar(pagina, "maquina-estados", "Retorno")
    assert _medida(pagina, "maquina-estados") == "cadastrado · aceitas 0 · recusadas 1"
    alerta = pagina.evaluate("""() => document.querySelector('[data-widget="maquina-estados"] .anim-alerta').className""")
    assert "anim-alerta-visivel" in alerta


def test_quatro_eventos_permitidos_fecham_o_ciclo(pagina):
    estados = []
    for rotulo in ("Saída", "Chegada", "Retorno", "Liberação"):
        _clicar(pagina, "maquina-estados", rotulo)
        estados.append(_medida(pagina, "maquina-estados").split(" · ")[0])
    assert estados == ["em trânsito", "no fornecedor", "retornado", "cadastrado"]
    assert _medida(pagina, "maquina-estados").endswith("aceitas 4 · recusadas 0")


def test_so_as_transicoes_que_saem_do_estado_atual_acendem(pagina):
    def acesas():
        return pagina.evaluate("""() => [...document.querySelectorAll('[data-widget="maquina-estados"] [data-transicao]')]
            .filter(s => s.classList.contains('acesa')).map(s => s.dataset.transicao)""")
    assert acesas() == ["saida"]
    _clicar(pagina, "maquina-estados", "Saída")
    assert acesas() == ["chegada"]


def test_contador_comeca_na_saida_do_ci_003_e_pula_para_01_10(pagina):
    """O calendário começa em 25/03/2026, saída do CI-003, e cada ciclo só conta a
    partir da própria saída (CI-009 em 23/07, CI-015 em 19/09)."""
    assert _medida(pagina, "contador-permanencia") == "25/03/2026 · acima do limiar 0 · em atraso 0"
    ordem = pagina.evaluate("""() => { const p = document.querySelector('[data-widget="contador-permanencia"] .anim-painel');
        const filhos = [...p.querySelectorAll('p, button, input')];
        return [filhos.findIndex(e => e.textContent.startsWith('Antes de')),
                filhos.findIndex(e => e.tagName !== 'P')]; }""")
    assert 0 <= ordem[0] < ordem[1], ordem
    _clicar(pagina, "contador-permanencia", "Pular para 01/10/2026")
    assert _medida(pagina, "contador-permanencia") == "01/10/2026 · acima do limiar 1 · em atraso 2"


def test_limiar_muda_a_permanencia_e_nao_muda_o_atraso(pagina):
    _clicar(pagina, "contador-permanencia", "Pular para 01/10/2026")
    pagina.evaluate("""() => { const r = document.querySelector('[data-widget="contador-permanencia"] input');
        r.value = '60'; r.dispatchEvent(new Event('input')); }""")
    assert _medida(pagina, "contador-permanencia") == "01/10/2026 · acima do limiar 2 · em atraso 2"
    pagina.evaluate("""() => { const r = document.querySelector('[data-widget="contador-permanencia"] input');
        r.value = '200'; r.dispatchEvent(new Event('input')); }""")
    assert _medida(pagina, "contador-permanencia") == "01/10/2026 · acima do limiar 0 · em atraso 2"


def test_limiar_padrao_e_150_e_rotulos_dos_tres_ciclos(pagina):
    texto = pagina.evaluate("""() => document.querySelector('[data-widget="contador-permanencia"]').textContent""")
    for termo in ("CI-003", "CI-009", "CI-015", "150 dias"):
        assert termo in texto, termo
    _clicar(pagina, "contador-permanencia", "Pular para 01/10/2026")
    svg = pagina.evaluate("""() => document.querySelector('[data-widget="contador-permanencia"] svg').textContent""")
    for termo in ("190 dias", "70 dias", "12 dias"):
        assert termo in svg, termo


def test_contagem_animada_pausa_fora_de_cena_e_avanca_no_slide(pagina):
    """No fixture o contador está no segundo slide: fora de cena o laço pausa."""
    _clicar(pagina, "contador-permanencia", "Contar os dias")
    pagina.wait_for_timeout(600)
    assert _medida(pagina, "contador-permanencia").startswith("25/03/2026")
    pagina.evaluate("() => Reveal.slide(1)")
    pagina.wait_for_timeout(900)
    data = _medida(pagina, "contador-permanencia").split(" · ")[0]
    assert re.fullmatch(r"\d\d/\d\d/2026", data) and data not in ("25/03/2026", "01/10/2026"), data


def test_ci_009_entra_em_atraso_31_dias_depois_da_saida(pagina):
    """CI-009 sai em 23/07 com prazo de 30 dias: em 22/08 (30 dias) ainda está no
    prazo; em 23/08 (31 dias) passa a contar como atraso."""
    def em(dias_desde_inicio):
        pagina.evaluate("""d => document.querySelector('[data-widget="contador-permanencia"]').irParaDia(d)""",
                        dias_desde_inicio)
        return _medida(pagina, "contador-permanencia")
    # 25/03 + 120 = 23/07 (saída do CI-009); o CI-003 já está em atraso desde 25/05.
    # No mesmo 23/08 o CI-003 completa 151 dias e passa do limiar: dois alertas
    # diferentes, de ciclos diferentes, no mesmo dia.
    assert em(120 + 30) == "22/08/2026 · acima do limiar 0 · em atraso 1"
    assert em(120 + 31) == "23/08/2026 · acima do limiar 1 · em atraso 2"
    assert em(60) == "24/05/2026 · acima do limiar 0 · em atraso 0"
    assert em(61) == "25/05/2026 · acima do limiar 0 · em atraso 1"
