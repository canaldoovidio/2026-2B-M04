"""Aula 07: amarrações visíveis no deck, dados do case no laboratório e referências fiéis à fonte."""
import csv
import json
import os
import re
from datetime import date

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def test_deck_carrega_as_duas_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula07.html")
    for nome in ("pwm-ciclo", "barramento-i2c"):
        assert 'data-widget="%s"' % nome in deck
        assert "widgets/%s.js" % nome in deck
    assert "inteli-quiz.js" in deck
    for termo in ("Sprint 3", "SP3", "Confronto com a IA", "19/11", "peso 3",
                  "Protótipo do Projeto com MQTT e I2C"):
        assert termo in deck, termo


def test_referencias_citam_todos_os_autoestudos_da_semana_06_e_so_eles():
    refs = _ler("referencias", "aula07.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 06", 1)[1].split("## Semana", 1)[0]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    assert citados == oficiais, oficiais ^ citados
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_autoverificacao_e_cobre_as_lacunas_do_autoestudo():
    material = _ler("materiais", "aula07.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    for nome in ("pwm-ciclo", "barramento-i2c"):
        assert 'data-widget="%s"' % nome in material
    prep = material.split('id="preparacao"', 1)[1].split('class="doc-secao"', 1)[0]
    # Lacunas registradas na coluna Observação da Semana 06.
    assert "analogRead" in prep and "touch" in prep
    assert "Arduino Uno" in prep
    assert "ESP-IDF" in prep
    assert "ledcAttach" in prep


def test_brilho_percebido_cita_fonte_quando_mencionado():
    for partes in (("aulas", "aula07.html"), ("materiais", "aula07.html")):
        texto = _ler(*partes)
        if "percebid" in texto:
            assert "CIE" in texto, partes


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula07.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in (("aulas", "aula07.html"), ("materiais", "aula07.html"),
                   ("referencias", "aula07.html"), ("labs", "aula07.html"),
                   ("labs", "aula07", "sketch.ino"), ("docs", "notas-do-professor", "aula07.md")):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF]", texto), partes


def _ciclos_abertos():
    """Dias fora em 01/10/2026, prazo em dias e bateria da última leitura de cada ciclo aberto."""
    ref = date(2026, 10, 1)
    abertos = {}
    with open(os.path.join(RAIZ, "dados", "ciclos.csv"), encoding="utf-8") as fh:
        for linha in csv.DictReader(fh):
            if not linha["data_retorno"]:
                saida = date.fromisoformat(linha["data_saida"])
                prazo = date.fromisoformat(linha["prazo_previsto"])
                abertos[linha["id_ciclo"]] = {"eq": linha["id_equipamento"],
                                              "dias": (ref - saida).days,
                                              "prazo": (prazo - saida).days}
    with open(os.path.join(RAIZ, "dados", "leituras.csv"), encoding="utf-8") as fh:
        for linha in csv.DictReader(fh):
            if linha["id_ciclo"] in abertos:
                abertos[linha["id_ciclo"]]["bateria"] = int(linha["bateria_pct"])
    return abertos


def test_sketch_exibe_os_tres_ciclos_abertos_com_os_valores_de_dados():
    sketch = _ler("labs", "aula07", "sketch.ino")
    abertos = _ciclos_abertos()
    assert len(abertos) == 3
    for ciclo, v in abertos.items():
        padrao = r'\{\s*"%s",\s*"%s",\s*%d,\s*%d,\s*%d\s*\}' % (ciclo, v["eq"], v["dias"], v["prazo"], v["bateria"])
        assert re.search(padrao, sketch), (ciclo, v)


def test_sketch_usa_a_api_de_pwm_do_core_3_e_nao_a_do_core_2():
    """Os comentários podem citar as funções removidas; o código, não."""
    codigo = re.sub(r"//[^\n]*", "", _ler("labs", "aula07", "sketch.ino"))
    assert "ledcAttach(" in codigo and "ledcWrite(" in codigo
    assert "ledcSetup" not in codigo and "ledcAttachPin" not in codigo


def test_diagrama_poe_lcd_i2c_e_mpu6050_no_mesmo_barramento():
    diagrama = json.loads(_ler("labs", "aula07", "diagram.json"))
    partes = list(diagrama["parts"])
    lcd = [p for p in partes if p["type"] == "wokwi-lcd1602"]
    imu = [p for p in partes if p["type"] == "wokwi-mpu6050"]
    assert lcd and lcd[0]["attrs"].get("pins") == "i2c"
    assert imu
    ligacoes = {tuple(sorted(c[:2])) for c in diagrama["connections"]}
    for parte in (lcd[0]["id"], imu[0]["id"]):
        assert tuple(sorted(("esp:21", parte + ":SDA"))) in ligacoes, parte
        assert tuple(sorted(("esp:22", parte + ":SCL"))) in ligacoes, parte


def test_manifesto_declara_a_biblioteca_do_lcd():
    manifesto = json.loads(_ler("labs", "labs.json"))
    assert manifesto["aula07"]["fqbn"] == "esp32:esp32:esp32"
    assert "LiquidCrystal I2C" in manifesto["aula07"]["bibliotecas"]


def test_pwm_de_8_bits_usa_base_256_e_255_e_99_6_por_cento():
    """Documentação LEDC da Espressif: com N bits o ciclo vai de 0 a 2^N."""
    for partes in (("aulas", "aula07.html"), ("materiais", "aula07.html")):
        texto = _ler(*partes)
        assert "/ 255" not in texto, partes
        assert "64 / 256" in texto and "128 / 256" in texto, partes
        assert "99,6%" in texto, partes
    sketch = _ler("labs", "aula07", "sketch.ino")
    assert "100%" not in sketch


def test_slide_do_confronto_traz_o_veredito_com_a_fonte_primaria():
    deck = _ler("aulas", "aula07.html")
    secao = [s for s in deck.split("<section") if "Confronto com a IA: o endereço do LCD" in s][0]
    for termo in ("ajustada", "confirmada", "errada", "PCF8574A", "0x3F", "0x27", "seção 7.1"):
        assert termo in secao, termo


def test_notas_distinguem_endereco_errado_de_contraste():
    notas = _ler("docs", "notas-do-professor", "aula07.md")
    assert "contraste" in notas and "sem luz" in notas


def test_permanencia_e_atraso_usam_maior_que_como_no_resto_do_acervo():
    """TAPI: alerta acima do limiar. Com 150 dias exatos não há permanência longa (Aula 03)."""
    codigo = re.sub(r"//[^\n]*", "", _ler("labs", "aula07", "sketch.ino"))
    assert not re.search(r"diasFora\s*>=", codigo)
    assert len(re.findall(r"diasFora\s*>\s*LIMIAR_PERMANENCIA_DIAS", codigo)) == 2
    assert len(re.findall(r"diasFora\s*>\s*c\.prazoDias", codigo)) == 2
