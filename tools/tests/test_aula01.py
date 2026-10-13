"""Aula 01: amarrações visíveis no deck e referências fiéis à fonte."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def test_deck_carrega_as_tres_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula01.html")
    for nome in ("circuito-led", "protoboard", "setup-loop"):
        assert 'data-widget="%s"' % nome in deck
    assert "inteli-quiz.js" in deck
    for termo in ("Sprint 1", "SP1", "Confrontar", "23/10"):
        assert termo in deck, termo


def test_referencias_citam_so_autoestudos_da_semana_01_com_link():
    refs = _ler("referencias", "aula01.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 01", 1)[1].split("## Semana", 1)[0]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    assert citados and citados <= oficiais
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_autoverificacao():
    material = _ler("materiais", "aula01.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    assert 'data-widget="circuito-led"' in material


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula01.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in (("aulas", "aula01.html"), ("materiais", "aula01.html"),
                   ("referencias", "aula01.html"), ("docs", "notas-do-professor", "aula01.md")):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF]", texto), partes
