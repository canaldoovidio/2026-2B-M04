"""As animações se movem de fato, no deck e no material, e no sentido físico certo.

O check_widgets só confere a montagem (data-pronto="sim"); uma animação montada
e parada passava. Regressão de 13/10/2026: no material, fora do Reveal, o laço
esperava a classe "present" de uma section que nunca a recebe.
"""
import os
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

LER_ELETRON = """() => {
  const c = document.querySelector('[data-widget="circuito-led"] svg circle[r="7"]');
  return [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))];
}"""
LER_RELOGIO = """() => document.querySelector('[data-widget="setup-loop"] .anim-medida').textContent"""


@pytest.fixture(scope="module")
def pagina():
    httpd = check_slides.servir(0)
    porta = httpd.server_address[1]
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        yield navegador, porta
        navegador.close()
    httpd.shutdown()


def _abrir(pagina, caminho):
    navegador, porta = pagina
    pg = navegador.new_page(viewport={"width": 1280, "height": 720})
    pg.goto("http://127.0.0.1:%d/%s" % (porta, caminho))
    pg.wait_for_function("document.querySelectorAll('[data-pronto=\"sim\"]').length >= 3")
    return pg


def test_animacoes_do_material_se_movem(pagina):
    pg = _abrir(pagina, "materiais/aula01.html")
    antes = pg.evaluate(LER_ELETRON)
    relogio_antes = pg.evaluate(LER_RELOGIO)
    pg.wait_for_timeout(1200)
    assert pg.evaluate(LER_ELETRON) != antes
    assert pg.evaluate(LER_RELOGIO) != relogio_antes
    pg.close()


def test_eletrons_andam_do_negativo_para_o_positivo(pagina):
    """Elétrons saem do terminal negativo (embaixo da fonte), passam pelo LED do
    cátodo para o ânodo (de baixo para cima, à direita) e atravessam o resistor da
    direita para a esquerda: sentido anti-horário no desenho."""
    pg = _abrir(pagina, "materiais/aula01.html")
    pg.evaluate("""() => document.querySelectorAll('[data-widget="circuito-led"] button')[2].click()""")
    pg.wait_for_timeout(100)
    pg.evaluate("""() => document.querySelectorAll('[data-widget="circuito-led"] button')[2].click()""")
    amostras = []
    for _ in range(12):
        amostras.append(pg.evaluate("""() => [...document.querySelectorAll('[data-widget="circuito-led"] svg circle[r="7"]')]
            .map(c => [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))])"""))
        pg.wait_for_timeout(60)
    sentidos = []
    for a, b in zip(amostras, amostras[1:]):
        for (x1, y1), (x2, y2) in zip(a, b):
            if abs(y1 - 80) < 1 and abs(y2 - 80) < 1 and x1 != x2:
                sentidos.append(x2 < x1)   # trecho de cima: anti-horário anda para a esquerda
    assert sentidos, "nenhum elétron medido no trecho de cima"
    assert all(sentidos), sentidos
    pg.close()


def test_relogio_do_setup_loop_bate_com_o_sketch(pagina):
    """O sketch fica 200 ms aceso e 1800 ms apagado: uma volta do loop a cada 2,0 s.

    Dez amostras ao longo de 20 s simulados; em cada uma, as voltas completas são
    o relógio dividido por 2,0 s. A única folga é logo depois de um múltiplo de
    2 s, quando o marcador ainda está na chave de fechamento do loop."""
    import re
    pg = _abrir(pagina, "materiais/aula01.html")
    pg.evaluate("""() => [...document.querySelectorAll('[data-widget="setup-loop"] button')]
        .find(b => b.textContent === '4x').click()""")
    amostras = []
    for _ in range(10):
        pg.wait_for_timeout(500)
        texto = pg.evaluate("""() => document.querySelector('[data-widget="setup-loop"]').textContent""")
        relogio = float(pg.evaluate(LER_RELOGIO).replace(" s", "").replace(",", "."))
        voltas = int(re.search(r"loop: (\d+)", texto).group(1))
        amostras.append((relogio, voltas))
    # Piso de progresso, não de velocidade: no Ubuntu do CI (17/10/2026) o relógio chegou a
    # 15,0 s em vez de cerca de 20 s, com todas as voltas certas. Seis voltas bastam.
    assert amostras[-1][0] >= 12, amostras
    for relogio, voltas in amostras:
        esperado = int(relogio // 2.0)
        folga = (relogio % 2.0) < 0.15
        assert voltas == esperado or (folga and voltas == esperado - 1), (relogio, voltas, amostras)
    pg.close()
