"""Aula 09: amarrações visíveis no deck, referências fiéis à fonte, segurança elétrica
declarada e laboratório com confirmação humana e desarme automático."""
import json
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTEFATOS = (("aulas", "aula09.html"), ("materiais", "aula09.html"), ("referencias", "aula09.html"),
             ("labs", "aula09.html"), ("docs", "notas-do-professor", "aula09.md"),
             ("assets", "js", "widgets", "rele-carga.js"), ("assets", "js", "widgets", "caminho-alerta.js"))


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def _plano(*p):
    return " ".join(_ler(*p).split())


def test_deck_carrega_as_duas_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula09.html")
    for nome in ("rele-carga", "caminho-alerta"):
        assert 'data-widget="%s"' % nome in deck
        assert "widgets/%s.js" % nome in deck
    assert "inteli-quiz.js" in deck and "inteli-cronometro.js" in deck
    for termo in ("Sprint 4", "SP4", "Confronto com a IA", "04/12", "Código do projeto",
                  "Protótipo físico do projeto (online)", "peso 2"):
        assert termo in deck, termo


def test_referencias_citam_so_autoestudos_da_semana_08_e_os_seis_da_aula():
    refs = _ler("referencias", "aula09.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 08", 1)[1].split("## Semana", 1)[0]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    assert citados and citados <= oficiais, citados - oficiais
    for titulo in ("Sistema de disparo de atuadores - Exemplo prático", "Módulos Relé com ESP32",
                   "Ativação de atuadores via Mosquitto - I", "Ativação de atuadores via Mosquitto - II",
                   "Ativação de atuadores via Mosquitto - III", "Utilização de Atuadores."):
        assert titulo in citados, titulo
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_animacoes_e_autoverificacao():
    material = _ler("materiais", "aula09.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    for nome in ("rele-carga", "caminho-alerta"):
        assert 'data-widget="%s"' % nome in material


def test_preparacao_cobre_as_lacunas_dos_autoestudos():
    """P9: Mosquitto II e III não usam Mosquitto; Utilização de Atuadores trata de
    Arduino IoT Cloud com WS2812b."""
    prep = " ".join(_ler("materiais", "aula09.html").split('id="preparacao"', 1)[1]
                    .split('class="doc-secao"', 1)[0].split())
    assert "Mosquitto - II" in prep and "Mosquitto - III" in prep
    assert re.search(r"não usam (o )?Mosquitto", prep)
    assert "Arduino IoT Cloud" in prep and "WS2812b" in prep
    assert "P9" in prep


def test_seguranca_eletrica_diz_que_a_aula_nao_monta_com_tensao_de_rede():
    for partes in (("aulas", "aula09.html"), ("materiais", "aula09.html"), ("labs", "aula09.html")):
        texto = _plano(*partes)
        assert "127" in texto and "220 V" in texto, partes
        assert re.search(r"nenhuma montagem (desta aula )?(usa|com) tensão de rede", texto, flags=re.I), partes


def test_numeros_tecnicos_tem_origem():
    """71,4 mA sai de 5 V / 70 Ω (bobina do SRD-05VDC-SL-C); 40 mA da Tabela 5-3
    do datasheet do ESP32; os dois aparecem com a fonte no material."""
    material = _plano("materiais", "aula09.html")
    assert "71,4 mA" in material and "70 Ω" in material and "SRD-05VDC-SL-C" in material
    assert "40 mA" in material and "Tabela 5-3" in material
    refs = _ler("referencias", "aula09.html")
    for fonte in ("lcsc.com", "esp32_datasheet_en.pdf", "relay.pdf", "wokwi-relay-module"):
        assert fonte in refs, fonte


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula09.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in ARTEFATOS + (("labs", "aula09", "sketch.ino"),):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF☀-➿]", texto), partes


def test_laboratorio_declara_esp32_rele_e_pubsubclient():
    with open(os.path.join(RAIZ, "labs", "labs.json"), encoding="utf-8") as fh:
        entrada = json.load(fh)["aula09"]
    assert entrada == {"fqbn": "esp32:esp32:esp32", "wokwi": "board-esp32-devkit-c-v4",
                       "bibliotecas": ["PubSubClient"]}
    diagrama = json.loads(_ler("labs", "aula09", "diagram.json"))
    assert "wokwi-relay-module" in {p["type"] for p in diagrama["parts"]}


def test_sketch_tem_confirmacao_humana_e_desarme_automatico():
    sketch = _ler("labs", "aula09", "sketch.ino")
    assert 'WiFi.begin("Wokwi-GUEST", "", 6)' in sketch
    assert "broker.hivemq.com" in sketch and "1883" in sketch
    assert re.search(r"LIMIAR_DIAS\s*=\s*150\b", sketch)
    assert re.search(r"JANELA_CONFIRMACAO_MS\s*=\s*30000\b", sketch)
    for topico in ('"alerta"', '"confirmacao"', '"estado"'):
        assert topico in sketch, topico
    # O relé só liga dentro do tratamento da confirmação: um único digitalWrite de ligar.
    assert len(re.findall(r"digitalWrite\(PINO_RELE, RELE_LIGADO\)", sketch)) == 1
    trecho = sketch.split("void tratarConfirmacao", 1)[1].split("\n}\n", 1)[0]
    assert "digitalWrite(PINO_RELE, RELE_LIGADO)" in trecho


def test_aula09_nao_inventa_broker_de_sala():
    """P7: o broker de sala não está definido; o laboratório usa broker público."""
    for partes in (("aulas", "aula09.html"), ("labs", "aula09.html")):
        assert "P7" in _ler(*partes), partes


# Correções da revisão independente de 13/10/2026.

def _loop(sketch):
    return sketch.split("void loop()", 1)[1]


def test_rele_npn_com_high_ligando_conferido_no_wokwi():
    """Wokwi em 13/10/2026: com "npn", IN em HIGH acende o LED do NO e IN em LOW
    ou flutuante acende o do NC. A evidência fica registrada no lab e nas notas."""
    diagrama = json.loads(_ler("labs", "aula09", "diagram.json"))
    rele = [p for p in diagrama["parts"] if p["type"] == "wokwi-relay-module"][0]
    assert rele["attrs"].get("transistor") == "npn"
    sketch = _ler("labs", "aula09", "sketch.ino")
    assert re.search(r"RELE_LIGADO\s*=\s*HIGH", sketch)
    for partes in (("labs", "aula09.html"), ("docs", "notas-do-professor", "aula09.md")):
        texto = _plano(*partes)
        assert "13/10/2026" in texto and "Playwright" in texto, partes


def test_id_do_alerta_nao_recomeca_numa_constante_a_cada_boot():
    sketch = _ler("labs", "aula09", "sketch.ino")
    assert not re.search(r"proximoId\s*=\s*\d+\s*;", sketch)
    assert re.search(r"proximoId\s*=\s*[^;]*esp_random\(\)", sketch)
    assert "CONFIRMAR 1" not in _ler("labs", "aula09.html")


def test_confirmacao_so_e_assinada_depois_de_armar_e_alerta_sem_retain():
    sketch = _ler("labs", "aula09", "sketch.ino")
    conectar = sketch.split("void tentarConectar", 1)[1].split("\n}\n", 1)[0]
    assert "subscribe(TOPICO_CONFIRMACAO)" not in conectar.replace("if (estado != MONITORANDO) mqtt.subscribe(TOPICO_CONFIRMACAO)", "")
    armar = sketch.split("void tratarAlerta", 1)[1].split("\n}\n", 1)[0]
    assert "mqtt.subscribe(TOPICO_CONFIRMACAO)" in armar
    assert "mqtt.publish(TOPICO_ALERTA, mensagem, false)" in sketch


def test_permanencia_dispara_acima_do_limiar():
    sketch = _ler("labs", "aula09", "sketch.ino")
    assert "diasFora > LIMIAR_DIAS" in sketch and "diasFora >= LIMIAR_DIAS" not in sketch


def test_desarme_roda_antes_da_rede_e_conexao_nao_bloqueia():
    sketch = _ler("labs", "aula09", "sketch.ino")
    assert "while (!mqtt.connected())" not in sketch
    corpo = _loop(sketch)
    assert corpo.index("expirarSemConfirmacao()") < corpo.index("tentarConectar()") < corpo.index("mqtt.loop()")
    confirmacao = sketch.split("void tratarConfirmacao", 1)[1].split("\n}\n", 1)[0]
    assert "JANELA_CONFIRMACAO_MS" in confirmacao


def test_quiz_sem_mensagem_comecando_por_nao():
    assert not re.search(r'data-incorrect-msg="Não:', _ler("aulas", "aula09.html"))


def test_ressalvas_de_hardware_real_e_condicoes_do_gpio():
    for partes in (("aulas", "aula09.html"), ("materiais", "aula09.html")):
        texto = _plano(*partes)
        assert "optoacoplador" in texto and "flutuando" in texto, partes
        assert "2,64 V" in texto, partes
    assert "centenas a milhares de volts" in _ler("aulas", "aula09.html")
    lab = _plano("labs", "aula09.html")
    assert "SSL/TLS" in lab and "antes de iniciar a simulação" in lab
