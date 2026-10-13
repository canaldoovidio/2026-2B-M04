"""Aula 10: amarrações no deck, referências fiéis à fonte e testes em C++ que testam algo."""
import html as _html
import os
import re
import shutil
import subprocess

import pytest

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LAB = os.path.join(RAIZ, "labs", "aula10")


def _ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as fh:
        return fh.read()


def test_deck_carrega_as_animacoes_e_o_quiz():
    deck = _ler("aulas", "aula10.html")
    for nome in ("consumo-deepsleep", "ciclo-integrado"):
        assert 'data-widget="%s"' % nome in deck
        assert "widgets/%s.js" % nome in deck
    assert "inteli-quiz.js" in deck
    for termo in ("Sprint 4", "SP4", "Confronto com a IA", "04/12", "Peer Instruction"):
        assert termo in deck, termo


def test_amarracao_cita_as_entregas_da_sprint_4_com_peso_da_adalove():
    deck = _ler("aulas", "aula10.html")
    plano = _ler("PLANO_DE_ENSINO.md")
    for entrega in ("Código do projeto", "Arquitetura do protótipo", "Manual de Instruções"):
        peso = re.search(r"\| 4 \| SP4 Implementação \| %s \| (\d+) \|" % re.escape(entrega), plano).group(1)
        assert re.search(r"<td>%s</td><td>%s</td>" % (re.escape(entrega), peso), deck), entrega


def test_referencias_citam_so_autoestudos_da_semana_08_com_link():
    refs = _ler("referencias", "aula10.html")
    semana = _ler("docs", "autoestudos-por-semana.md").split("## Semana 08", 1)[1].split("## Semana", 1)[0]
    oficiais = set(re.findall(r"^\| (.+?) \| ", semana, flags=re.M)) - {"Autoestudo", "---"}
    citados = set(re.findall(r'data-autoestudo="([^"]+)"', refs))
    assert citados and citados <= oficiais
    for titulo in ("Testes e Integração em C++ (Parte 1)", "(extra) Deep Sleep I",
                   "(extra) Tutorial de uso do Filesystem do ESP32"):
        assert titulo in citados, titulo
    assert "Leitura complementar" in refs


def test_material_tem_preparacao_com_autoverificacao_e_as_lacunas_dos_autoestudos():
    material = _ler("materiais", "aula10.html")
    assert 'id="preparacao"' in material
    assert material.count('class="autoverificacao-item"') == 5
    for nome in ("consumo-deepsleep", "ciclo-integrado"):
        assert 'data-widget="%s"' % nome in material
    preparacao = material.split('id="preparacao"', 1)[1].split('class="doc-secao"', 1)[0]
    assert "Preferences" in preparacao and "NVS" in preparacao
    assert "login" in preparacao and "P9" in preparacao


def test_correntes_citam_o_datasheet_da_espressif():
    """10 µA e 95 ~ 100 mA vêm das Tabelas 4-2 e 5-4 do ESP32 Series Datasheet v5.3."""
    for partes in (("aulas", "aula10.html"), ("materiais", "aula10.html")):
        texto = _ler(*partes)
        assert "Tabela 4-2" in texto and "Tabela 5-4" in texto, partes
        assert "v5.3" in texto, partes
    refs = _ler("referencias", "aula10.html")
    assert "esp32_datasheet_en.pdf" in refs


def test_capacidade_da_bateria_e_exemplo_declarado():
    for partes in (("aulas", "aula10.html"), ("materiais", "aula10.html")):
        texto = _ler(*partes)
        assert "2000 mAh" in texto and "exemplo" in texto.lower(), partes


def test_laboratorio_nao_pede_medir_corrente_no_wokwi():
    pagina = _ler("labs", "aula10.html")
    assert "não mede corrente" in pagina
    assert "deep sleep" in pagina.lower()


def test_notas_do_professor_tem_perguntas_com_resposta_e_erro_comum():
    notas = _ler("docs", "notas-do-professor", "aula10.md")
    assert notas.count("**Resposta esperada:**") >= 6
    assert notas.count("**Erro comum:**") >= 6


def test_nenhum_artefato_da_aula_tem_travessao_ou_emoji():
    for partes in (("aulas", "aula10.html"), ("materiais", "aula10.html"), ("referencias", "aula10.html"),
                   ("labs", "aula10.html"), ("labs", "aula10", "sketch.ino"), ("labs", "aula10", "rastreador.h"),
                   ("labs", "aula10", "testes", "teste_rastreador.cpp"),
                   ("labs", "aula10", "testes", "testes_da_ia_exemplo.cpp"),
                   ("docs", "notas-do-professor", "aula10.md")):
        texto = _ler(*partes)
        assert chr(0x2014) not in texto, partes
        assert not re.search("[\U0001F300-\U0001FAFF]", texto), partes


def test_pagina_do_lab_mostra_o_cabecalho_identico_ao_arquivo():
    pagina = _ler("labs", "aula10.html")
    for id_, partes in (("cabecalho", ("rastreador.h",)), ("testes", ("testes", "teste_rastreador.cpp")),
                        ("testes-ia", ("testes", "testes_da_ia_exemplo.cpp"))):
        achado = re.search(r'<pre class="doc-codigo" id="%s">(.*?)</pre>' % id_, pagina, flags=re.S)
        assert achado, id_
        assert _html.unescape(achado.group(1)) == _ler("labs", "aula10", *partes).rstrip("\n"), id_


def test_sketch_usa_o_cabecalho_e_dorme_por_timer():
    sketch = _ler("labs", "aula10", "sketch.ino")
    assert '#include "rastreador.h"' in sketch
    assert "esp_sleep_enable_timer_wakeup" in sketch and "esp_deep_sleep_start" in sketch
    assert "RTC_DATA_ATTR" in sketch
    cabecalho = _ler("labs", "aula10", "rastreador.h")
    assert "Arduino.h" not in cabecalho, "a lógica pura não pode depender do Arduino"


def _compilador():
    return shutil.which("c++") or shutil.which("g++") or shutil.which("clang++")


def _compilar_e_rodar(fonte, pasta_cabecalho, tmp_path, nome):
    cc = _compilador()
    assert cc, "nenhum compilador C++ no PATH"
    binario = os.path.join(tmp_path, nome + ".bin")
    # O teste inclui "../rastreador.h": copia a suíte para uma subpasta da pasta do cabeçalho.
    pasta_testes = os.path.join(pasta_cabecalho, "testes")
    os.makedirs(pasta_testes, exist_ok=True)
    shutil.copy(os.path.join(LAB, "testes", fonte), os.path.join(pasta_testes, fonte))
    compilado = subprocess.run([cc, "-std=c++17", "-Wall", "-Werror", "-o", binario,
                                os.path.join(pasta_testes, fonte)], capture_output=True, text=True)
    assert compilado.returncode == 0, compilado.stderr
    return subprocess.run([binario], capture_output=True, text=True)


def _cabecalho_em(tmp_path, nome, trocar=None):
    pasta = os.path.join(tmp_path, nome)
    os.makedirs(pasta)
    texto = _ler("labs", "aula10", "rastreador.h")
    if trocar:
        antigo, novo = trocar
        assert texto.count(antigo) == 1, antigo
        texto = texto.replace(antigo, novo)
    with open(os.path.join(pasta, "rastreador.h"), "w", encoding="utf-8") as fh:
        fh.write(texto)
    return pasta


def test_suite_do_laboratorio_passa_contra_o_cabecalho_real(tmp_path):
    saida = _compilar_e_rodar("teste_rastreador.cpp", _cabecalho_em(tmp_path, "real"), tmp_path, "real")
    assert saida.returncode == 0, saida.stdout + saida.stderr
    medidos = int(re.search(r"(\d+) verificações", saida.stdout).group(1))
    assert medidos >= 20, saida.stdout
    assert "0 falha" in saida.stdout


MUTANTES = {
    "limiar": ("diasFora > limiarDias", "diasFora >= limiarDias"),
    "prazo": ("diasFora > prazoDias", "diasFora >= prazoDias"),
    "fila": ("f.perdidos++;", ""),
}


@pytest.mark.parametrize("mutante", sorted(MUTANTES))
def test_suite_do_laboratorio_reprova_o_cabecalho_quebrado(mutante, tmp_path):
    """Um teste que não falha contra o código quebrado não testa nada (lição 8.2 da skill)."""
    pasta = _cabecalho_em(tmp_path, mutante, MUTANTES[mutante])
    saida = _compilar_e_rodar("teste_rastreador.cpp", pasta, tmp_path, mutante)
    assert saida.returncode != 0, saida.stdout


def test_testes_de_exemplo_da_ia_passam_ate_contra_o_cabecalho_quebrado(tmp_path):
    """É o material do Confrontar: os testes passam com o código certo e com o errado."""
    for nome, troca in (("real", None), ("mutante", MUTANTES["limiar"])):
        saida = _compilar_e_rodar("testes_da_ia_exemplo.cpp", _cabecalho_em(tmp_path, "ia-" + nome, troca),
                                  tmp_path, "ia-" + nome)
        assert saida.returncode == 0, (nome, saida.stdout)


def test_numeros_de_autonomia_do_deck_batem_com_o_calculo():
    """Premissas: 100 mA acordado por 10 s, 10 µA dormindo, bateria de exemplo de 2000 mAh."""
    semana = 7 * 24 * 3600

    def dias(intervalo_s, sono_ma):
        n = semana / intervalo_s
        carga = (100 * 10 * n + sono_ma * (semana - 10 * n)) / 3600
        return 2000 / carga * 7

    deck = _ler("aulas", "aula10.html")
    assert "%d dias" % round(dias(semana, 0.01)) in deck.replace(".", "")
    assert "%d dias" % round(dias(3600, 0.01)) in deck
    assert "%d dias" % round(dias(semana, 1.0)) in deck
