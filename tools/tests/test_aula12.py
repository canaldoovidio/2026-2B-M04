"""Aula 12: amarrações visíveis no deck, referências sem autoestudo e roteiro coerente."""
import json
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def _entregas_sprint5():
    """(entrega, peso) da Sprint 5 na seção 4 do plano, sem a Prova do Módulo."""
    plano = _ler("PLANO_DE_ENSINO.md")
    linhas = re.findall(r"^\| 5 \| SP5 [^|]+\| ([^|]+?) \| (\d+) \|$", plano, flags=re.M)
    assert len(linhas) == 5, linhas
    return linhas


def test_deck_carrega_as_duas_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula12.html")
    for nome in ("linha-tempo-rastreador", "checklist-mvp"):
        assert 'data-widget="%s"' % nome in deck
    assert "inteli-quiz.js" in deck
    for termo in ("Sprint 5", "SP5", "18/12", "Confronto com a IA", "Pensar e compartilhar"):
        assert termo in deck, termo


def test_amarracao_cita_as_cinco_entregas_da_sprint_5_com_o_peso_do_plano():
    deck = _ler("aulas", "aula12.html")
    for entrega, peso in _entregas_sprint5():
        assert re.search(r"<td>%s</td><td>%s</td>" % (re.escape(entrega), peso), deck), (entrega, peso)


def test_referencias_declaram_que_a_semana_10_nao_tem_autoestudo():
    refs = _ler("referencias", "aula12.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 10", 1)[1]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    assert not oficiais, "a Semana 10 passou a ter autoestudo: atualizar a página"
    assert "data-autoestudo" not in refs
    assert "não tem autoestudo" in refs
    assert "Leitura complementar" in refs
    assert len(re.findall(r"<li><a href=", refs)) >= 4


def test_material_tem_preparacao_com_autoverificacao_e_as_duas_animacoes():
    material = _ler("materiais", "aula12.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    for nome in ("linha-tempo-rastreador", "checklist-mvp"):
        assert 'data-widget="%s"' % nome in material


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula12.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in (("aulas", "aula12.html"), ("materiais", "aula12.html"), ("referencias", "aula12.html"),
                   ("labs", "aula12.html"), ("labs", "aula12", "sketch.ino"),
                   ("docs", "notas-do-professor", "aula12.md")):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF☀-➿]", texto), partes


def _passos(html, id_tabela):
    tabela = re.search(r'<table[^>]*id="%s".*?</table>' % id_tabela, html, flags=re.S)
    assert tabela, id_tabela
    return re.findall(r"<tr><td>(\d)</td><td>([^<]+)</td>", tabela.group(0))


def test_roteiro_da_demonstracao_e_o_mesmo_no_deck_e_no_laboratorio():
    deck = _passos(_ler("aulas", "aula12.html"), "roteiro-demo")
    lab = _passos(_ler("labs", "aula12.html"), "roteiro-demo")
    assert len(lab) == 8, lab
    assert deck == lab


def test_laboratorio_tem_coluna_de_tempo_medido_e_previsto():
    lab = _ler("labs", "aula12.html")
    tabela = re.search(r'<table[^>]*id="roteiro-demo".*?</table>', lab, flags=re.S).group(0)
    assert "Tempo previsto" in tabela and "Tempo medido" in tabela


def test_sketch_marca_a_origem_de_cada_numero_e_nao_mede_autonomia():
    sketch = _ler("labs", "aula12", "sketch.ino")
    assert sketch.count("[medido no simulador]") >= 4
    assert "[configurado]" in sketch
    linha = [l for l in sketch.splitlines() if "autonomia" in l.lower() and "Serial" in l]
    assert linha and all("estimativa" in l for l in linha), linha


def test_sketch_usa_o_ciclo_ci_009_do_conjunto_ficticio():
    """O prazo e os identificadores da demonstração vêm de dados/ciclos.csv."""
    from datetime import date
    sketch = _ler("labs", "aula12", "sketch.ino")
    ciclo = [l.split(",") for l in _ler("dados", "ciclos.csv").splitlines() if l.startswith("CI-009,")][0]
    for valor in ciclo[:5]:
        assert '"%s"' % valor in sketch, valor
    prazo = (date.fromisoformat(ciclo[6]) - date.fromisoformat(ciclo[5])).days
    assert re.search(r"PRAZO_PREVISTO_DIAS = %d;" % prazo, sketch), prazo
    assert "LIMIAR_PERMANENCIA_DIAS = 150;" in sketch


def test_manifesto_declara_esp32_e_pubsubclient():
    with open(os.path.join(RAIZ, "labs", "labs.json"), encoding="utf-8") as fh:
        entrada = json.load(fh)["aula12"]
    assert entrada["fqbn"] == "esp32:esp32:esp32"
    assert entrada["wokwi"] == "board-esp32-devkit-c-v4"
    assert entrada["bibliotecas"] == ["PubSubClient"]


def test_permanencia_dispara_acima_do_limiar_como_no_resto_do_acervo():
    """TAPI: 'acima do limiar'; a Aula 03 usa diasFora > limiar. 150 dias exatos não alertam."""
    sketch = _ler("labs", "aula12", "sketch.ino")
    assert "dias > LIMIAR_PERMANENCIA_DIAS" in sketch
    assert ">= LIMIAR_PERMANENCIA_DIAS" not in sketch
    for partes in (("aulas", "aula12.html"), ("labs", "aula12.html")):
        texto = _ler(*partes)
        assert "30,2 s" in texto, partes
        assert "151" in texto, partes


ROTULOS = ("[configurado]", "[simulado]", "[medido no simulador]")


def test_toda_linha_da_serial_com_numero_leva_o_rotulo_da_origem():
    sketch = _ler("labs", "aula12", "sketch.ino")
    # Números só saem pela função imprimir(rotulo, formato, ...), com rótulo conhecido.
    chamadas = re.findall(r'imprimir\(("[^"]*")', sketch)
    assert len(chamadas) >= 8, chamadas
    for rotulo in chamadas:
        assert rotulo.strip('"') in ROTULOS, rotulo
    # Serial.print direto só com texto literal e sem algarismo.
    for arg in re.findall(r"Serial\.print(?:ln)?\((.*?)\);", sketch):
        if arg.startswith('"'):
            assert not re.search(r"\d", arg), arg
        else:
            assert arg in ("linhaPronta",), arg
    assert '\\"origem\\":\\"simulado\\"' in sketch


def test_tempo_de_publicacao_nao_promete_chegada_ao_broker():
    sketch = _ler("labs", "aula12", "sketch.ino")
    assert "QoS 0, sem confirmação" in sketch
    assert "debounce" in sketch.split("void registrar", 1)[1].split("void manterConexao", 1)[0]
    assert "setSocketTimeout(2)" in sketch
    for partes in (("aulas", "aula12.html"), ("docs", "notas-do-professor", "aula12.md")):
        assert "chegaram ao broker" not in _ler(*partes), partes


def test_item_7_do_mvp_completo_no_deck():
    deck = _ler("aulas", "aula12.html")
    linha = re.search(r"<tr><td>7</td><td>([^<]+)</td>", deck).group(1)
    for termo in ("comunicação", "fixação", "reutilização", "consumo", "água", "ciclo completo"):
        assert termo in linha, termo
