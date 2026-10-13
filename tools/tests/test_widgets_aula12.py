"""Animações da Aula 12: montam sem erro, sem cor literal, e mostram os dados do plano."""
import os
import re
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_widgets_aula12.html"
NOMES = ("linha-tempo-rastreador", "checklist-mvp")
LT = '[data-widget="linha-tempo-rastreador"]'
CK = '[data-widget="checklist-mvp"]'


def _camadas_do_plano():
    with open(os.path.join(RAIZ, "PLANO_DE_ENSINO.md"), encoding="utf-8") as fh:
        plano = fh.read()
    return dict(re.findall(r"^\| (\d\d) \| ([^|]+?) \|$", plano, flags=re.M))


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
        if nome == "linha-tempo-rastreador":   # a única com laço de animação
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


def _texto(pg, seletor):
    return pg.evaluate("(s) => document.querySelector(s).textContent", seletor)


def _botao(pg, raiz, rotulo):
    pg.evaluate("""([r, t]) => [...document.querySelectorAll(r + ' button')]
        .find(b => b.textContent === t).click()""", [raiz, rotulo])


def test_previsao_vem_antes_do_primeiro_controle(pagina):
    for raiz in (LT, CK):
        ordem = pagina.evaluate("""(r) => {
            const nos = [...document.querySelectorAll(r + ' .anim-painel > *')];
            const prev = nos.findIndex(n => n.textContent.startsWith('Antes de'));
            const ctrl = nos.findIndex(n => n.matches('.widget-controles, input'));
            return [prev, ctrl];
        }""", raiz)
        assert 0 <= ordem[0] < ordem[1] or ordem[1] == -1 and ordem[0] >= 0, (raiz, ordem)


def test_linha_do_tempo_comeca_vazia_e_chega_as_12_camadas_do_plano(pagina):
    camadas = _camadas_do_plano()
    assert len(camadas) == 12
    assert _texto(pagina, LT + " .anim-medida") == "0 de 12 camadas"
    assert pagina.evaluate("(r) => document.querySelectorAll(r + ' svg rect.camada').length", LT) == 12
    for n in range(1, 13):
        _botao(pagina, LT, "Próxima")
        assert _texto(pagina, LT + " .anim-medida") == "%d de 12 camadas" % n
        assert _texto(pagina, LT + " .anim-camada").endswith(camadas["%02d" % n]), n
        construidas = pagina.evaluate("(r) => document.querySelectorAll(r + ' svg rect.camada.construida').length", LT)
        assert construidas == n


def test_linha_do_tempo_mostra_a_entrega_e_a_data_de_cada_sprint(pagina):
    for _ in range(3):
        _botao(pagina, LT, "Próxima")
    sprint = _texto(pagina, LT + " .anim-sprint")
    assert "Sprint 1" in sprint and "23/10" in sprint
    _botao(pagina, LT, "Próxima")
    assert "Protótipo físico do projeto (offline), peso 4" in _texto(pagina, LT + " .anim-sprint")
    for _ in range(8):
        _botao(pagina, LT, "Próxima")
    sprint = _texto(pagina, LT + " .anim-sprint")
    assert "Sprint 5" in sprint and "18/12" in sprint
    assert "Critérios de qualidade GITHUB, peso 2" in sprint
    _botao(pagina, LT, "Anterior")
    assert _texto(pagina, LT + " .anim-medida") == "11 de 12 camadas"


def test_reproduzir_avanca_sozinho(pagina):
    _botao(pagina, LT, "Reproduzir")
    pagina.wait_for_timeout(2500)
    n = int(_texto(pagina, LT + " .anim-medida").split()[0])
    assert n >= 2, n


def test_clicar_numa_camada_marca_a_camada_fragil(pagina):
    pagina.evaluate("(r) => document.querySelector(r + ' svg rect.camada[data-aula=\"04\"]')"
                    ".dispatchEvent(new MouseEvent('click', {bubbles: true}))", LT)
    assert pagina.evaluate("(r) => document.querySelectorAll(r + ' svg rect.camada.fragil').length", LT) == 1
    assert "Aula 04" in _texto(pagina, LT + " .anim-fragil")


def _clicar_item(pg, indice, vezes=1):
    for _ in range(vezes):
        pg.evaluate("""([r, i]) => document.querySelectorAll(r + ' svg g.item-mvp')[i]
            .dispatchEvent(new MouseEvent('click', {bubbles: true}))""", [CK, indice])


def _estado(pg, indice):
    return pg.evaluate("([r, i]) => document.querySelectorAll(r + ' svg g.item-mvp')[i].dataset.estado", [CK, indice])


def test_checklist_tem_oito_itens_e_conta_cada_origem(pagina):
    assert pagina.evaluate("(r) => document.querySelectorAll(r + ' svg g.item-mvp').length", CK) == 8
    assert _texto(pagina, CK + " .anim-medida") == "bancada 0 · simulador 0 · estimado 0 · não atendido 0"
    _clicar_item(pagina, 0, 1)          # pendente -> bancada
    _clicar_item(pagina, 1, 2)          # pendente -> bancada -> simulador
    _clicar_item(pagina, 2, 3)          # ... -> estimado
    _clicar_item(pagina, 3, 4)          # ... -> não atendido
    assert _texto(pagina, CK + " .anim-medida") == "bancada 1 · simulador 1 · estimado 1 · não atendido 1"
    _clicar_item(pagina, 3, 1)          # não atendido -> pendente
    assert _texto(pagina, CK + " .anim-medida") == "bancada 1 · simulador 1 · estimado 1 · não atendido 0"


def test_itens_7_e_8_nunca_ficam_medidos_no_simulador(pagina):
    """Fixação, água, consumo e autonomia não se medem no Wokwi."""
    for indice in (6, 7):
        vistos = []
        for _ in range(4):
            _clicar_item(pagina, indice, 1)
            vistos.append(_estado(pagina, indice))
        assert "simulador" not in vistos, (indice, vistos)
        assert vistos == ["bancada", "estimado", "não atendido", "pendente"], vistos


def test_itens_do_mvp_completos(pagina):
    textos = pagina.evaluate("(r) => [...document.querySelectorAll(r + ' svg g.item-mvp')].map(g => g.textContent)", CK)
    for termo in ("comunicação", "fixação", "reutilização", "consumo", "água", "ciclo completo"):
        assert termo in textos[6], termo
    for termo in ("localização", "dias fora", "prazo", "bateria", "lacre", "histórico", "API"):
        assert termo in textos[5], termo


def test_autonomia_marcada_como_medida_dispara_o_aviso_do_tapi(pagina):
    alerta = CK + " .anim-alerta"
    visivel = "(s) => document.querySelector(s).classList.contains('anim-alerta-visivel')"
    assert not pagina.evaluate(visivel, alerta)
    _clicar_item(pagina, 7, 1)          # bancada
    assert pagina.evaluate(visivel, alerta)
    assert "150 dias" in _texto(pagina, alerta)
    _clicar_item(pagina, 7, 1)          # estimado: o aviso some
    assert not pagina.evaluate(visivel, alerta)
