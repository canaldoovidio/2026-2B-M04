"""Aula 11: amarrações visíveis no deck, ponderada fiel à reescrita 5C e defesas do laboratório."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def test_deck_carrega_as_duas_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula11.html")
    for nome in ("superficie-ataque", "handshake-tls"):
        assert 'data-widget="%s"' % nome in deck
        assert "widgets/%s.js" % nome in deck
    assert "inteli-quiz.js" in deck
    for termo in ("Sprint 5", "SP5", "Confrontar", "11/12", "18/12", "peso 2", "peso 20"):
        assert termo in deck, termo


def test_deck_tem_quiz_de_revisao_para_a_prova():
    deck = _ler("aulas", "aula11.html")
    assert deck.count('class="quiz-slide"') >= 4
    assert "Revisão para a prova" in deck


def test_rodape_numerado_em_sequencia():
    deck = _ler("aulas", "aula11.html")
    paginas = [int(n) for n in re.findall(r'<p class="footer-page">(\d+)</p>', deck)]
    assert paginas == list(range(2, 2 + len(paginas))), paginas


def test_referencias_citam_so_autoestudos_da_semana_09():
    refs = _ler("referencias", "aula11.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 09", 1)[1].split("## Semana", 1)[0]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    assert citados == oficiais, (citados, oficiais)
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_autoverificacao_e_as_lacunas_do_card():
    material = _ler("materiais", "aula11.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    for nome in ("superficie-ataque", "handshake-tls"):
        assert 'data-widget="%s"' % nome in material
    preparacao = material.split('id="preparacao"', 1)[1].split('class="doc-secao"', 1)[0]
    assert "4.3" in preparacao and "5.2.3" in preparacao
    assert "Arduino" in preparacao and "ESP32" in preparacao and "P9" in preparacao


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula11.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in (("aulas", "aula11.html"), ("materiais", "aula11.html"),
                   ("referencias", "aula11.html"), ("labs", "aula11.html"),
                   ("labs", "aula11", "sketch.ino"), ("docs", "notas-do-professor", "aula11.md")):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF]", texto), partes


def test_barema_da_ponderada_no_deck_soma_dez_pontos():
    deck = _ler("aulas", "aula11.html")
    pontos = [float(p.replace(",", ".")) for p in re.findall(r"<td>(\d,\d)</td>", deck)]
    assert pontos and abs(sum(pontos) - 10.0) < 1e-9, pontos


def test_plano_versiona_o_barema_da_semana_09_na_subsecao_6_4():
    plano = _ler("PLANO_DE_ENSINO.md")
    secao = plano.split("### 6.4 ", 1)[1].split("\n## ", 1)[0].split("\n### ", 1)[0]
    assert "semana 09" in secao.splitlines()[0]
    pontos = [float(p.replace(",", ".")) for p in re.findall(r"\| (\d,\d) \|", secao)]
    assert len(pontos) == 6 and abs(sum(pontos) - 10.0) < 1e-9, pontos
    for etapa in ("Contextualizar", "Consultar", "Confrontar", "Construir", "Comprovar"):
        assert etapa in secao, etapa


def test_sketch_tira_credenciais_do_codigo_e_usa_tls_verificado():
    sketch = _ler("labs", "aula11", "sketch.ino")
    assert '__has_include("secrets.h")' in sketch
    assert "8883" in sketch and "setCACert" in sketch
    assert "setInsecure" not in sketch
    assert re.search(r"mqtt\.connect\(.*, MQTT_USUARIO, MQTT_SENHA\)", sketch)


def test_pagina_do_lab_mostra_o_secrets_de_exemplo_e_as_bibliotecas():
    pagina = _ler("labs", "aula11.html")
    assert 'id="segredos"' in pagina and 'id="bibliotecas"' in pagina
    assert ".gitignore" in pagina
