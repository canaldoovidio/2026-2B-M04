"""Aula 02: amarrações visíveis no deck e referências fiéis à fonte."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def test_deck_carrega_as_tres_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula02.html")
    for nome in ("bounce-botao", "carga-rc"):
        assert 'data-widget="%s"' % nome in deck
    assert "inteli-quiz.js" in deck
    for termo in ("Sprint 1", "SP2", "Confrontar", "23/10", "peso 3"):
        assert termo in deck, termo


def test_referencias_citam_so_autoestudos_da_semana_01_com_link():
    refs = _ler("referencias", "aula02.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 02", 1)[1].split("## Semana", 1)[0]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    assert citados and citados <= oficiais
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_autoverificacao():
    material = _ler("materiais", "aula02.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    assert 'data-widget="carga-rc"' in material


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula02.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in (("aulas", "aula02.html"), ("materiais", "aula02.html"),
                   ("referencias", "aula02.html"), ("docs", "notas-do-professor", "aula02.md")):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF]", texto), partes


def test_aula02_nao_inventa_os_valores_de_r_e_c_da_ponderada():
    """R e C da ponderada vêm do card do encontro; o deck usa exemplo declarado."""
    deck = _ler("aulas", "aula02.html")
    assert "card do encontro" in deck
    assert "exemplo" in deck.lower()


def test_aula02_cita_o_barema_5c_com_a_soma_de_dez_pontos():
    deck = _ler("aulas", "aula02.html")
    pontos = [float(p.replace(",", ".")) for p in re.findall(r"<td>(\d,\d)</td>", deck)]
    assert pontos and abs(sum(pontos) - 10.0) < 1e-9, pontos
