"""Aula 06: amarrações visíveis no deck, referências fiéis à fonte e números com origem."""
import json
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def test_deck_carrega_as_duas_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula06.html")
    for nome in ("mqtt-pubsub", "alcance-tecnologias"):
        assert 'data-widget="%s"' % nome in deck, nome
        assert "widgets/%s.js" % nome in deck, nome
    assert "inteli-quiz.js" in deck
    for termo in ("Sprint 3", "SP3", "19/11", "peso 2", "peso 3", "Confronto com a IA", "P4", "P7"):
        assert termo in deck, termo


def test_referencias_citam_so_autoestudos_da_semana_05_com_link():
    refs = _ler("referencias", "aula06.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 05", 1)[1].split("## Semana", 1)[0]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    for obrigatorio in ("Protocolo MQTT", "Publicando dados na Nuvem com ESP32 e MQTT",
                        "Arquiteturas de Comunicação com ESP32", "Atividade - Semáforo Inteligente"):
        assert obrigatorio in citados, obrigatorio
    assert citados <= oficiais, citados - oficiais
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_autoverificacao_e_as_lacunas_dos_cards():
    material = _ler("materiais", "aula06.html")
    preparacao = material.split('id="preparacao"', 1)[1].split('<section', 1)[0]
    assert material.count('class="autoverificacao-item"') == 5
    for nome in ("mqtt-pubsub", "alcance-tecnologias"):
        assert 'data-widget="%s"' % nome in preparacao, nome
    assert "Criando um Dashboard de IoT com o HiveMQ" in preparacao
    assert "cliente MQTT web" in preparacao
    assert "Introdução à Programação do ESP32" in preparacao
    assert "copiada" in preparacao


def test_numeros_de_alcance_e_consumo_tem_fonte_citada():
    """Todo número de cobertura ou consumo da aula aparece junto da fonte nas referências."""
    refs = _ler("referencias", "aula06.html")
    for fonte in ("espressif.com", "semtech.com", "vodafone", "docs.oasis-open.org",
                  "github.com/knolleary/pubsubclient", "mqtt-dashboard.com"):
        assert fonte in refs.lower(), fonte
    material = _ler("materiais", "aula06.html")
    for numero in ("116,5", "155,7", "157", "164", "240 mA", "10 µA"):
        assert numero in material, numero


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula06.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in (("aulas", "aula06.html"), ("materiais", "aula06.html"),
                   ("referencias", "aula06.html"), ("labs", "aula06.html"),
                   ("labs", "aula06", "sketch.ino"), ("docs", "notas-do-professor", "aula06.md")):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF☀-➿]", texto), partes


def test_barema_da_ponderada_soma_dez_no_deck_e_no_plano():
    deck = _ler("aulas", "aula06.html")
    pontos = [float(p.replace(",", ".")) for p in re.findall(r"<td>(\d,\d)</td>", deck)]
    assert pontos and abs(sum(pontos) - 10.0) < 1e-9, pontos
    plano = _ler("PLANO_DE_ENSINO.md")
    secao = re.split(r"\n### 6\.\d|\n## 7\.", plano.split("### 6.2", 1)[1])[0]
    pontos = [float(p.replace(",", ".")) for p in re.findall(r"\| (\d,\d) \|", secao)]
    assert len(pontos) == 6 and abs(sum(pontos) - 10.0) < 1e-9, pontos
    assert "P4" in secao and "interface online" in secao


def test_laboratorio_publica_json_no_broker_publico_pelo_wokwi():
    sketch = _ler("labs", "aula06", "sketch.ino")
    assert 'WiFi.begin("Wokwi-GUEST", "", 6)' in sketch
    assert '"broker.hivemq.com"' in sketch and "1883" in sketch
    assert "#include <PubSubClient.h>" in sketch
    assert "snprintf" in sketch and '\\"dias_fora\\"' in sketch
    manifesto = json.loads(_ler("labs", "labs.json"))
    assert manifesto["aula06"] == {"fqbn": "esp32:esp32:esp32", "wokwi": "board-esp32-devkit-c-v4",
                                   "bibliotecas": ["PubSubClient"]}


def test_json_do_evento_cabe_no_buffer_padrao_do_pubsubclient():
    """O PubSubClient limita o pacote a 256 bytes por padrão (README da biblioteca).
    Payload, tópico e os bytes de cabeçalho do PUBLISH precisam caber."""
    sketch = _ler("labs", "aula06", "sketch.ino")
    tamanho = int(re.search(r"char payload\[(\d+)\]", sketch).group(1))
    topico = int(re.search(r"char topico\[(\d+)\]", sketch).group(1))
    assert tamanho + topico + 5 <= 256, (tamanho, topico)


def _funcao(sketch, nome):
    inicio = sketch.index(nome)
    corpo = sketch[sketch.index("{", inicio):]
    nivel = 0
    for i, c in enumerate(corpo):
        nivel += c == "{"
        nivel -= c == "}"
        if nivel == 0:
            return corpo[:i + 1]
    raise AssertionError(nome)


def test_comando_piscar_nao_bloqueia_o_loop():
    """Com delay() no callback, mqtt.loop() e a leitura do lacre param por cerca de 3 s."""
    sketch = _ler("labs", "aula06", "sketch.ino")
    assert "delay(" not in _funcao(sketch, "void aoReceber(")
    assert "millis()" in _funcao(sketch, "void loop(")


def test_primeira_conexao_mqtt_nao_espera_o_intervalo_de_reconexao():
    """ultimaTentativaMs começa em 0; sem tratar a primeira tentativa, o rastreador
    só conectaria ao broker 5 s depois de ligar."""
    corpo = _funcao(_ler("labs", "aula06", "sketch.ino"), "void conectarMqtt(")
    guarda = corpo.split("return;", 1)[0]
    assert "tentouAntes &&" in guarda, guarda


def test_vereditos_do_confronto_usam_o_trio_do_acervo():
    for partes in (("aulas", "aula06.html"), ("labs", "aula06.html")):
        texto = _ler(*partes)
        for termo in ("confirmad", "ajustad", "errad"):
            assert termo in texto, (partes, termo)


def test_unidade_de_autonomia_segue_a_fonte():
    """A Vodafone escreve 200b/day, ambíguo entre bit e byte."""
    for partes in (("aulas", "aula06.html"), ("materiais", "aula06.html"),
                   ("assets", "js", "widgets", "alcance-tecnologias.js")):
        texto = _ler(*partes)
        assert "200 B/dia" not in texto and "200 bytes" not in texto, partes
        assert "200b/dia" in texto, partes
