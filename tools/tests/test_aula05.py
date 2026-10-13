"""Aula 05: amarrações visíveis no deck, referências fiéis à fonte e números com origem."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ANIMACOES = ("quantizacao-adc", "divisor-bateria", "acelerometro-eixos")


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def test_deck_carrega_as_tres_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula05.html")
    for nome in ANIMACOES:
        assert 'data-widget="%s"' % nome in deck, nome
        assert "widgets/%s.js" % nome in deck, nome
    assert "inteli-quiz.js" in deck and "inteli-cronometro.js" in deck
    for termo in ("Sprint 2", "SP2", "Confronto com a IA", "06/11", "peso 2", "peso 4"):
        assert termo in deck, termo


def test_deck_numera_o_rodape_em_sequencia():
    deck = _ler("aulas", "aula05.html")
    paginas = [int(n) for n in re.findall(r'<p class="footer-page">(\d+)</p>', deck)]
    assert paginas == list(range(2, 2 + len(paginas))), paginas


def test_referencias_citam_so_autoestudos_da_semana_04_com_link():
    refs = _ler("referencias", "aula05.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 04", 1)[1].split("## Semana", 1)[0]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    assert citados == oficiais, oficiais ^ citados
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_as_tres_animacoes_e_autoverificacao():
    material = _ler("materiais", "aula05.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    for nome in ANIMACOES:
        assert 'data-widget="%s"' % nome in material, nome


def test_preparacao_cobre_a_diferenca_entre_uno_e_esp32_com_fonte():
    """Os vídeos de sensores analógicos usam o Uno (10 bits, 5 V); a aula usa o ESP32."""
    prep = _ler("materiais", "aula05.html").split('id="preparacao"', 1)[1].split('<section', 1)[0]
    for termo in ("Arduino Uno", "10 bits", "5 V", "12 bits", "4,88 mV", "0,81 mV",
                  "150", "2450", "não linear"):
        assert termo in prep, termo
    assert "Tabela 4-4" in prep and "datasheet" in prep.lower()


def test_material_mostra_os_dois_requisitos_nao_funcionais_mensuraveis():
    material = _ler("materiais", "aula05.html")
    for termo in ("RNF-01", "RNF-02", "ISO/IEC 25010", "0,2 V", "1,5 s"):
        assert termo in material, termo


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula05.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in (("aulas", "aula05.html"), ("materiais", "aula05.html"),
                   ("referencias", "aula05.html"), ("labs", "aula05.html"),
                   ("docs", "notas-do-professor", "aula05.md")):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF]", texto), partes


def test_constantes_do_sketch_batem_com_os_numeros_da_aula():
    """O divisor de 100 kΩ + 100 kΩ, a faixa 2,50 a 4,20 V do datasheet da célula
    e o limiar de 0,26 g (inclinar 15°) aparecem iguais no código e no material."""
    sketch = _ler("labs", "aula05", "sketch.ino")
    for trecho in ("R1_OHMS = 100000.0", "R2_OHMS = 100000.0", "V_CARGA_COMPLETA = 4.20",
                   "V_CORTE = 2.50", "LIMIAR_G = 0.26", "PINO_BATERIA = 34"):
        assert trecho in sketch, trecho
    import math
    assert abs(2 * math.sin(math.radians(15) / 2) - 0.26) < 0.005
    # 4,2 V no divisor 1:1 vira 2,10 V no pino: leitura nominal 2606 em 12 bits e 3,3 V
    assert int(4.2 / 2 / 3.3 * 4096) == 2606
    assert "2606" in _ler("materiais", "aula05.html") and "2606" in _ler("aulas", "aula05.html")


def test_laboratorio_usa_potenciometro_no_lugar_do_divisor_e_explica_por_que():
    """O Wokwi não faz simulação analógica completa: o potenciômetro entrega a tensão
    do ponto médio do divisor, e a página do laboratório diz isso."""
    import json
    diagrama = json.loads(_ler("labs", "aula05", "diagram.json"))
    tipos = {p["type"] for p in diagrama["parts"]}
    assert {"board-esp32-devkit-c-v4", "wokwi-potentiometer", "wokwi-mpu6050"} <= tipos
    ligacoes = {tuple(sorted(c[:2])) for c in diagrama["connections"]}
    pot = [p["id"] for p in diagrama["parts"] if p["type"] == "wokwi-potentiometer"][0]
    mpu = [p["id"] for p in diagrama["parts"] if p["type"] == "wokwi-mpu6050"][0]
    assert tuple(sorted(("esp:34", pot + ":SIG"))) in ligacoes
    assert tuple(sorted(("esp:21", mpu + ":SDA"))) in ligacoes
    assert tuple(sorted(("esp:22", mpu + ":SCL"))) in ligacoes
    pagina = _ler("labs", "aula05.html")
    assert "simulação analógica" in pagina and "potenciômetro" in pagina


def test_bateria_sai_da_leitura_calibrada():
    """Regressão: o erro de 60 mV da Tabela 4-4 vale para a leitura calibrada, então o
    RNF-01 só se mede se a bateria vier de analogReadMilliVolts."""
    sketch = _ler("labs", "aula05", "sketch.ino")
    assert "tensaoBateria(milivoltsPino)" in sketch
    assert "tensaoBateria(leitura)" not in sketch


def test_esp_idf_citada_com_dmax_4095_e_convencao_da_aula_separada():
    """A ESP-IDF v4.4 define Dmax = 4095; 4096 e 3,3 V são a convenção de conta da aula."""
    for partes in (("labs", "aula05", "sketch.ino"), ("docs", "notas-do-professor", "aula05.md"),
                   ("assets", "js", "widgets", "quantizacao-adc.js"), ("labs", "aula05.html")):
        texto = _ler(*partes)
        assert "Dmax = 4096" not in texto and "2 elevado ao número de bits" not in texto, partes
        assert "2^12 (ESP-IDF" not in texto, partes
    assert "Dmax = 4095" in _ler("docs", "notas-do-professor", "aula05.md")
    assert "convenção" in _ler("labs", "aula05", "sketch.ino")


def test_leituras_brutas_previstas_sao_declaradas_como_convencao():
    for partes in (("aulas", "aula05.html"), ("materiais", "aula05.html"), ("labs", "aula05.html")):
        assert "convenção da conta" in _ler(*partes), partes


def test_rnf02_tem_margem_e_o_wokwi_mede_so_a_latencia_de_confirmacao():
    sketch = _ler("labs", "aula05", "sketch.ino")
    assert "primeiraAcimaMs" in sketch and "latência de confirmação" in sketch
    for partes in (("aulas", "aula05.html"), ("materiais", "aula05.html")):
        texto = _ler(*partes)
        assert "em até 2 s" in texto, partes
    assert "latência de confirmação" in _ler("labs", "aula05.html")


def test_sketch_separa_remocao_de_movimento_pelo_modulo():
    sketch = _ler("labs", "aula05", "sketch.ino")
    assert "modulo" in sketch and "remoção ou movimento" not in sketch


def test_rnf01_declara_as_condicoes_da_garantia_de_60_mv():
    for partes in (("aulas", "aula05.html"), ("materiais", "aula05.html")):
        texto = _ler(*partes)
        for termo in ("100 nF", "eFuse", "Aula 06"):
            assert termo in texto, (partes, termo)
    assert "VIH" in _ler("aulas", "aula05.html")


def test_libraries_txt_sem_comentario():
    assert "#" not in _ler("labs", "aula05", "libraries.txt")
