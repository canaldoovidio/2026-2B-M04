"""Aula 08: amarrações visíveis no deck, referências fiéis à fonte e barema 5C versionado."""
import csv
import os
import re
from datetime import date

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTEFATOS = (("aulas", "aula08.html"), ("materiais", "aula08.html"), ("referencias", "aula08.html"),
             ("labs", "aula08.html"), ("labs", "aula08-painel.html"),
             ("docs", "notas-do-professor", "aula08.md"))


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def test_deck_carrega_as_duas_animacoes_o_quiz_e_as_amarracoes():
    deck = _ler("aulas", "aula08.html")
    for nome in ("escala-dbm", "atenuacao-sinal"):
        assert 'data-widget="%s"' % nome in deck, nome
        assert "widgets/%s.js" % nome in deck, nome
    assert "inteli-quiz.js" in deck and "inteli-cronometro.js" in deck
    for termo in ("Sprint 4", "SP4", "Confronto com a IA", "04/12", "peso 2",
                  "Atividade - Mapa de Calor calculando dBm de sinal WiFi",
                  "Protótipo físico do projeto (online)"):
        assert termo in deck, termo


def test_rodape_numerado_em_sequencia():
    deck = _ler("aulas", "aula08.html")
    numeros = [int(n) for n in re.findall(r'<p class="footer-page">(\d+)</p>', deck)]
    assert numeros == list(range(2, 2 + len(numeros))), numeros


def test_referencias_citam_so_autoestudos_da_semana_07_com_link():
    refs = _ler("referencias", "aula08.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 07", 1)[1].split("## Semana", 1)[0]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    assert citados and citados <= oficiais, citados - oficiais
    for obrigatorio in ("Intensidade do Sinal WiFi", "Valores de Potência de RF - Cisco",
                        "Atividade - Mapa de Calor calculando dBm de sinal WiFi"):
        assert obrigatorio in citados, obrigatorio
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_animacoes_e_autoverificacao():
    material = _ler("materiais", "aula08.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    for nome in ("escala-dbm", "atenuacao-sinal"):
        assert 'class="widget anim-empilhada" data-widget="%s"' % nome in material, nome


def test_preparacao_cobre_as_lacunas_dos_autoestudos():
    """Ubidots em ESP8266 e cadastro da Adafruit IO numa ESP32-S2 (P7, P9)."""
    prep = _ler("materiais", "aula08.html").split('id="preparacao"', 1)[1].split('<section', 1)[0]
    for termo in ("ESP8266", "Adafruit IO", "ESP32-S2", "P7", "P9", "Ubidots"):
        assert termo in prep, termo


def test_formulas_de_dbm_e_de_perda_tem_fonte_citada():
    material = _ler("materiais", "aula08.html")
    assert "10 × log" in material and "23231-powervalues" in material
    assert "Log-distance_path_loss_model" in material or "Rappaport" in material
    assert "Free-space_path_loss" in material


def test_wokwi_nao_e_usado_para_observar_variacao_de_sinal():
    for partes in (("labs", "aula08.html"), ("aulas", "aula08.html"), ("materiais", "aula08.html")):
        texto = _ler(*partes)
        assert "não simula" in texto, partes
        assert "bancada" in texto, partes


def test_percurso_por_ra_fica_pendente_sem_tabela_inventada():
    """P6: a tabela de percursos por dígito do RA ainda não existe."""
    for partes in (("aulas", "aula08.html"), ("materiais", "aula08.html"), ("labs", "aula08.html")):
        texto = _ler(*partes)
        assert "P6" in texto, partes
        assert not re.search(r"RA (terminado|final) em \d", texto), partes


def test_pergunta_de_leitura_numerica_e_idêntica_entre_turmas():
    deck = _ler("aulas", "aula08.html")
    assert "P8" in deck and "3 dB" in deck


def test_barema_da_semana_07_versionado_no_plano_com_dez_pontos():
    plano = _ler("PLANO_DE_ENSINO.md")
    secao = plano.split("### 6.3", 1)[1].split("\n## ", 1)[0].split("\n### ", 1)[0]
    assert "Mapa de Calor" in secao
    pontos = [float(p.replace(",", ".")) for p in re.findall(r"\| (\d,\d) \|", secao)]
    assert len(pontos) == 6 and abs(sum(pontos) - 10.0) < 1e-9, pontos


def test_deck_cita_o_barema_5c_com_a_soma_de_dez_pontos():
    deck = _ler("aulas", "aula08.html")
    barema = next(s for s in deck.split("<section") if "<h2>Barema" in s)
    pontos = [float(p.replace(",", ".")) for p in re.findall(r"<td>(\d,\d)</td>", barema)]
    assert pontos and abs(sum(pontos) - 10.0) < 1e-9, pontos


def test_ultima_comunicacao_dos_ciclos_abertos_bate_com_os_dados():
    """O deck afirma a data e o RSSI da última comunicação de cada ciclo aberto."""
    ciclos = {c["id_ciclo"]: c for c in csv.DictReader(open(os.path.join(RAIZ, "dados", "ciclos.csv"), encoding="utf-8"))}
    leituras = list(csv.DictReader(open(os.path.join(RAIZ, "dados", "leituras.csv"), encoding="utf-8")))
    deck = _ler("aulas", "aula08.html")
    abertos = [k for k, c in ciclos.items() if not c["data_retorno"]]
    assert len(abertos) == 3
    for ciclo in abertos:
        ultima = [l for l in leituras if l["id_ciclo"] == ciclo][-1]
        dia = date.fromisoformat(ultima["data_hora"][:10])
        dias = (date(2026, 10, 1) - dia).days
        linha = re.search(r"<tr><td>%s</td>(.*?)</tr>" % ciclo, deck)
        assert linha, ciclo
        celulas = re.findall(r"<td>(.*?)</td>", linha.group(1))
        assert dia.strftime("%d/%m/%Y") in celulas, (ciclo, celulas)
        assert "%s dBm" % ultima["rssi_dbm"].replace("-", "&minus;") in celulas, (ciclo, celulas)
        assert str(dias) in celulas, (ciclo, celulas)


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula08.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in ARTEFATOS:
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF]", texto), partes


def test_painel_assina_o_mesmo_topico_que_o_sketch_publica():
    sketch = _ler("labs", "aula08", "sketch.ino")
    painel = _ler("assets", "js", "painel-rssi.js")
    prefixo = re.search(r'PREFIXO_TOPICO = "([^"]+)"', sketch).group(1)
    assert "'%s'" % prefixo in painel
    assert "broker.hivemq.com" in sketch and "broker.hivemq.com" in painel
