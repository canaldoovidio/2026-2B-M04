"""Aula 04: amarrações visíveis no deck e referências fiéis à fonte."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def _semana_03():
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 03", 1)[1].split("## Semana", 1)[0]
    return set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}


def test_deck_carrega_as_duas_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula04.html")
    for nome in ("buffer-circular", "aritmetica-ponteiros"):
        assert 'data-widget="%s"' % nome in deck
        assert "widgets/%s.js" % nome in deck
    assert "inteli-quiz.js" in deck and "inteli-cronometro.js" in deck


def test_deck_amarra_sprint_etapa_entrega_peso_review_e_pendencia():
    deck = _ler("aulas", "aula04.html")
    for termo in ("Sprint 2", "SP2", "Protótipo físico do projeto (offline)", "peso 4", "06/11",
                  "P2", "Semáforo offline", "Confronto com a IA"):
        assert termo in deck, termo


def test_referencias_citam_todos_os_autoestudos_da_semana_03_e_so_eles():
    """A Semana 03 tem um único encontro, a Aula 04: todos os autoestudos dela vêm para cá."""
    refs = _ler("referencias", "aula04.html")
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    assert citados == _semana_03()
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_autoverificacao_e_as_lacunas_dos_autoestudos():
    material = _ler("materiais", "aula04.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    for nome in ("buffer-circular", "aritmetica-ponteiros"):
        assert 'data-widget="%s"' % nome in material
    preparacao = material.split('id="preparacao"', 1)[1].split('<section', 1)[0]
    assert "ordem invertida" in preparacao
    assert "M4_SPRINTS" in preparacao
    assert "Minha Biblioteca" in preparacao
    assert "P9" in preparacao


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula04.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in (("aulas", "aula04.html"), ("materiais", "aula04.html"), ("referencias", "aula04.html"),
                   ("labs", "aula04.html"), ("docs", "notas-do-professor", "aula04.md"),
                   ("assets", "js", "widgets", "buffer-circular.js"),
                   ("assets", "js", "widgets", "aritmetica-ponteiros.js")):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF]", texto), partes


def test_rodape_numerado_em_sequencia():
    deck = _ler("aulas", "aula04.html")
    paginas = [int(n) for n in re.findall(r'<p class="footer-page">(\d+)</p>', deck)]
    assert paginas == list(range(2, 2 + len(paginas))), paginas


def test_numeros_do_esp32_citam_o_datasheet():
    """520 KB de SRAM e GPIO 34 a 39 sem pull-up vêm do datasheet; o deck diz de onde."""
    deck = _ler("aulas", "aula04.html")
    assert "520 KB" in deck and "34 a 39" in deck
    assert "datasheet" in deck.lower()


def test_buffer_do_laboratorio_tem_8_posicoes_como_a_previsao_do_bloco_3():
    sketch = _ler("labs", "aula04", "sketch.ino")
    assert "const int CAPACIDADE = 8;" in sketch
    assert "Evento *escrita" in sketch and "Evento *leitura" in sketch
    assert "%p" in sketch
