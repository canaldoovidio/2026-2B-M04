"""Aula 03: amarrações visíveis no deck, referências fiéis à fonte e números de dados/."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def test_deck_carrega_as_duas_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula03.html")
    for nome in ("maquina-estados", "contador-permanencia"):
        assert 'data-widget="%s"' % nome in deck
        assert "widgets/%s.js" % nome in deck
    assert "inteli-quiz.js" in deck
    for termo in ("Sprint 1", "SP2", "Confronto com a IA", "23/10", "peso 1", "peso 2"):
        assert termo in deck, termo


def test_rodape_numerado_em_sequencia():
    deck = _ler("aulas", "aula03.html")
    paginas = [int(n) for n in re.findall(r'<p class="footer-page">(\d+)</p>', deck)]
    assert paginas and paginas == list(range(2, 2 + len(paginas))), paginas


def test_referencias_citam_os_autoestudos_da_aula_03_com_titulo_exato():
    refs = _ler("referencias", "aula03.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 02", 1)[1].split("## Semana", 1)[0]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    esperados = {"Fundamentos de Linguagem C/C++ (parte II)", "Programação OO em C++",
                 "Simulador Wokwi (ESP32)", "Fundamentos de controle e automação",
                 "Desenvolvedor de Sistemas Embarcados",
                 "Aula Complementar: O que é um Sistema Embarcado? (opcional)",
                 "Aula Complementar: Tipos de dados e Operações com bits (opcional)",
                 "Aula Complementar: microcontroladores, interfaces e periféricos (opcional)"}
    assert esperados <= oficiais
    assert citados == esperados, citados ^ esperados
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_esp32_e_autoverificacao():
    material = _ler("materiais", "aula03.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    for nome in ("maquina-estados", "contador-permanencia"):
        assert 'data-widget="%s"' % nome in material
    preparacao = material.split('id="preparacao"', 1)[1].split('class="doc-secao"', 1)[0]
    for termo in ("3,3 V", "Serial.begin(115200)", "Simulador Wokwi (ESP32)", "não nomeia o Wokwi"):
        assert termo in preparacao, termo


def test_tres_ciclos_abertos_batem_com_dados():
    """Os números da aula vêm de dados/ciclos.csv, com data de referência 01/10/2026."""
    import csv
    from datetime import date
    with open(os.path.join(RAIZ, "dados", "ciclos.csv"), encoding="utf-8") as fh:
        abertos = {l["id_ciclo"]: l for l in csv.DictReader(fh) if not l["data_retorno"]}
    ref = date(2026, 10, 1)
    medidos = {}
    for id_, l in abertos.items():
        saida = date.fromisoformat(l["data_saida"])
        medidos[id_] = ((ref - saida).days, (date.fromisoformat(l["prazo_previsto"]) - saida).days)
    assert medidos == {"CI-003": (190, 60), "CI-009": (70, 30), "CI-015": (12, 45)}
    sketch = _ler("labs", "aula03", "sketch.ino")
    for id_, (dias, prazo) in medidos.items():
        assert 'Ciclo("%s", %d, %d' % (id_, prazo, dias) in sketch, id_
    widget = _ler("assets", "js", "widgets", "contador-permanencia.js")
    for id_, (dias, prazo) in medidos.items():
        assert re.search(r"'%s',\s*dias:\s*%d,\s*prazo:\s*%d" % (id_, dias, prazo), widget), id_


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula03.md")
    assert notas.count("**Resposta esperada:**") >= 7
    assert notas.count("**Erro comum:**") >= 7


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in (("aulas", "aula03.html"), ("materiais", "aula03.html"),
                   ("referencias", "aula03.html"), ("labs", "aula03.html"),
                   ("labs", "aula03", "sketch.ino"), ("docs", "notas-do-professor", "aula03.md"),
                   ("assets", "js", "widgets", "maquina-estados.js"),
                   ("assets", "js", "widgets", "contador-permanencia.js")):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF☀-➿]", texto), partes


def test_laboratorio_da_aula_03_e_em_esp32_a_115200():
    import json
    manifesto = json.loads(_ler("labs", "labs.json"))
    assert manifesto["aula03"] == {"fqbn": "esp32:esp32:esp32", "wokwi": "board-esp32-devkit-c-v4"}
    sketch = _ler("labs", "aula03", "sketch.ino")
    assert "Serial.begin(115200)" in sketch
    assert "enum class Estado" in sketch and "class Ciclo" in sketch
    assert "limiarDias = 150" in sketch
