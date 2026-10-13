"""Animações da Aula 06: montam sem erro, sem cor literal, e mostram os números certos."""
import os
import re
import subprocess
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

FIXTURE = "tools/tests/fixture_widgets_aula06.html"
NOMES = ("mqtt-pubsub", "alcance-tecnologias")


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


def test_previsao_vem_antes_do_primeiro_controle(pagina):
    for nome in NOMES:
        ordem = pagina.evaluate("""n => {
            const painel = document.querySelector('[data-widget="' + n + '"] .anim-painel');
            const filhos = [...painel.querySelectorAll('p, input, button')];
            const prev = filhos.findIndex(e => e.textContent.startsWith('Antes de'));
            const ctrl = filhos.findIndex(e => e.tagName === 'INPUT' || e.tagName === 'BUTTON');
            return [prev, ctrl];
        }""", nome)
        assert 0 <= ordem[0] < ordem[1], (nome, ordem)


def test_curinga_mais_recebe_duas_das_quatro_publicacoes(pagina):
    assert _medida(pagina, "mqtt-pubsub").endswith("recebidas 0 de 0")
    _clicar(pagina, "mqtt-pubsub", "cerradinho/+/lacre")
    _clicar(pagina, "mqtt-pubsub", "Publicar as quatro")
    assert _medida(pagina, "mqtt-pubsub") == "cerradinho/+/lacre · recebidas 2 de 4"


def test_curinga_de_varios_niveis_recebe_todas(pagina):
    _clicar(pagina, "mqtt-pubsub", "cerradinho/#")
    _clicar(pagina, "mqtt-pubsub", "Publicar as quatro")
    assert _medida(pagina, "mqtt-pubsub") == "cerradinho/# · recebidas 4 de 4"


def test_filtro_exato_recebe_so_o_proprio_topico(pagina):
    _clicar(pagina, "mqtt-pubsub", "cerradinho/dv01/lacre")
    _clicar(pagina, "mqtt-pubsub", "Publicar as quatro")
    assert _medida(pagina, "mqtt-pubsub") == "cerradinho/dv01/lacre · recebidas 1 de 4"


def test_casamento_de_topicos_segue_a_especificacao(pagina):
    """Exemplos da seção 4.7.1 do MQTT 3.1.1 (OASIS)."""
    casos = pagina.evaluate("""() => {
        const c = window.IntelIMqtt.casa;
        return [c('sport/tennis/+', 'sport/tennis/player1'),
                c('sport/tennis/+', 'sport/tennis/player1/ranking'),
                c('sport/+', 'sport'), c('sport/+', 'sport/'), c('sport/#', 'sport'),
                c('#', 'a/b/c')];
    }""")
    assert casos == [True, False, False, True, True, True]


def _ajustar(pg, indice, valor):
    pg.evaluate("""([i, v]) => { const r = document.querySelectorAll('[data-widget="alcance-tecnologias"] input')[i];
        r.value = String(v); r.dispatchEvent(new Event('input')); }""", [indice, valor])


def test_alcance_com_110_db_todas_conectam(pagina):
    assert _medida(pagina, "alcance-tecnologias") == "perda 110 dB · conectam 4 de 4"


def test_tres_paredes_derrubam_so_o_wifi(pagina):
    _ajustar(pagina, 0, 100)
    _ajustar(pagina, 1, 3)
    assert _medida(pagina, "alcance-tecnologias") == "perda 130 dB · conectam 3 de 4"
    rotulos = pagina.evaluate("""() => [...document.querySelectorAll('[data-widget="alcance-tecnologias"] [data-tecnologia]')]
        .map(e => e.dataset.tecnologia + ':' + e.dataset.conecta)""")
    assert "Wi-Fi:nao" in rotulos and "NB-IoT:sim" in rotulos


def test_com_160_db_so_o_nb_iot_conecta(pagina):
    _ajustar(pagina, 0, 150)
    _ajustar(pagina, 1, 1)
    assert _medida(pagina, "alcance-tecnologias") == "perda 160 dB · conectam 1 de 4"


def test_orcamentos_citados_aparecem_no_desenho(pagina):
    texto = pagina.evaluate("() => document.querySelector('[data-widget=\"alcance-tecnologias\"] svg').textContent")
    for numero in ("116,5 dB", "155,7 dB", "157 dB", "164 dB"):
        assert numero in texto, numero


def test_mqtt_pubsub_para_o_laco_fora_de_cena(pagina):
    _clicar(pagina, "mqtt-pubsub", "Publicar as quatro")
    pagina.evaluate("Reveal.slide(1)")
    pagina.wait_for_timeout(600)
    chamadas = pagina.evaluate("""() => new Promise(ok => {
        let n = 0; const orig = window.requestAnimationFrame;
        window.requestAnimationFrame = f => { n++; return orig(f); };
        setTimeout(() => { window.requestAnimationFrame = orig; ok(n); }, 400); })""")
    assert chamadas == 0, chamadas
    pagina.evaluate("Reveal.slide(0)")
    pagina.wait_for_timeout(300)
    assert pagina.evaluate("document.querySelector('[data-widget=\"mqtt-pubsub\"] circle[r=\"10\"]').style.display") != "none"
