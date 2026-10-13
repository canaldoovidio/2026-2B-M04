"""Laboratórios: manifesto, placa coerente, cinco etapas do 5C e compilação real."""
import json
import os
import re
import shutil
import subprocess

import pytest

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ETAPAS = ("contextualizar", "consultar", "confrontar", "construir", "comprovar", "desafio")


def _manifesto():
    with open(os.path.join(RAIZ, "labs", "labs.json"), encoding="utf-8") as fh:
        return json.load(fh)


def test_manifesto_nao_esta_vazio():
    assert _manifesto(), "nenhum laboratório declarado: nada medido não é sucesso"


@pytest.mark.parametrize("aula", sorted(_manifesto()))
def test_diagrama_declara_a_mesma_placa_do_manifesto(aula):
    with open(os.path.join(RAIZ, "labs", aula, "diagram.json"), encoding="utf-8") as fh:
        diagrama = json.load(fh)
    tipos = {p["type"] for p in diagrama["parts"]}
    assert _manifesto()[aula]["wokwi"] in tipos
    assert diagrama["connections"], aula


@pytest.mark.parametrize("aula", sorted(_manifesto()))
def test_pagina_do_lab_cobre_as_cinco_etapas_do_5c(aula):
    with open(os.path.join(RAIZ, "labs", aula + ".html"), encoding="utf-8") as fh:
        html = fh.read()
    for etapa in ETAPAS:
        assert 'id="%s"' % etapa in html, (aula, etapa)
    assert "PROCESSO.md" in html and "ADR" in html


@pytest.mark.parametrize("aula", sorted(_manifesto()))
def test_sketch_compila_para_a_placa_declarada(aula, tmp_path):
    cli = shutil.which("arduino-cli")
    assert cli, ("arduino-cli não encontrado. Instale com 'brew install arduino-cli' e os cores "
                 "'arduino:avr' e 'esp32:esp32' (ver docs/ANDAMENTO.md).")
    pasta = os.path.join(tmp_path, "sketch")
    os.makedirs(pasta)
    shutil.copy(os.path.join(RAIZ, "labs", aula, "sketch.ino"), os.path.join(pasta, "sketch.ino"))
    saida = subprocess.run([cli, "compile", "--fqbn", _manifesto()[aula]["fqbn"], pasta],
                           capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr


def test_modelos_de_registro_existem():
    processo = open(os.path.join(RAIZ, "labs", "modelos", "PROCESSO.md"), encoding="utf-8").read()
    for etapa in ("Contextualizar", "Consultar", "Confrontar", "Construir", "Comprovar"):
        assert "## " + etapa in processo
    adr = open(os.path.join(RAIZ, "labs", "modelos", "ADR-uso-de-ia.md"), encoding="utf-8").read()
    assert "Sugestão da IA" in adr and "rejeitada ou corrigida" in adr


@pytest.mark.parametrize("aula", sorted(_manifesto()))
def test_codigo_exibido_na_pagina_e_o_mesmo_dos_arquivos(aula):
    """A página mostra o código para copiar; ele não pode divergir do que é compilado."""
    import html as _html
    with open(os.path.join(RAIZ, "labs", aula + ".html"), encoding="utf-8") as fh:
        pagina = fh.read()
    for id_, arquivo in (("sketch", "sketch.ino"), ("diagrama", "diagram.json")):
        achado = re.search(r'<pre class="doc-codigo" id="%s">(.*?)</pre>' % id_, pagina, flags=re.S)
        assert achado, (aula, id_)
        with open(os.path.join(RAIZ, "labs", aula, arquivo), encoding="utf-8") as fh:
            assert _html.unescape(achado.group(1)) == fh.read().rstrip("\n"), (aula, arquivo)


# Placa do Wokwi e núcleo do arduino-cli que a compila. Toda aula usa uma destas.
PLACAS = {"wokwi-arduino-uno": "arduino:avr:uno", "board-esp32-devkit-c-v4": "esp32:esp32:esp32"}


@pytest.mark.parametrize("aula", sorted(_manifesto()))
def test_manifesto_coerente_e_uma_unica_placa_no_diagrama(aula):
    entrada = _manifesto()[aula]
    assert PLACAS.get(entrada["wokwi"]) == entrada["fqbn"], entrada
    with open(os.path.join(RAIZ, "labs", aula, "diagram.json"), encoding="utf-8") as fh:
        tipos = [p["type"] for p in json.load(fh)["parts"]]
    assert [t for t in tipos if t in PLACAS] == [entrada["wokwi"]], tipos


@pytest.mark.parametrize("aula", sorted(_manifesto()))
def test_bibliotecas_declaradas_batem_com_o_libraries_txt_do_wokwi(aula):
    """O Wokwi instala bibliotecas pelo libraries.txt do projeto; a compilação dos
    testes e do CI instala pela lista do manifesto. As duas listas são a mesma."""
    declaradas = sorted(_manifesto()[aula].get("bibliotecas", []))
    caminho = os.path.join(RAIZ, "labs", aula, "libraries.txt")
    if not declaradas:
        assert not os.path.exists(caminho), aula
        return
    with open(caminho, encoding="utf-8") as fh:
        linhas = sorted(l.strip() for l in fh if l.strip() and not l.startswith("#"))
    assert linhas == declaradas, (aula, linhas, declaradas)
    with open(os.path.join(RAIZ, "labs", aula + ".html"), encoding="utf-8") as fh:
        assert 'id="bibliotecas"' in fh.read(), aula


def test_nenhuma_pagina_aponta_para_o_ino_cru():
    """O Pages serve .ino como texto cru; o código é mostrado na página do laboratório."""
    import glob
    for caminho in glob.glob(os.path.join(RAIZ, "**", "*.html"), recursive=True):
        if "/.venv/" in caminho or "/.superpowers/" in caminho:
            continue
        with open(caminho, encoding="utf-8") as fh:
            assert not re.search(r'href="[^"]+\.ino"', fh.read()), caminho


def test_instalador_de_bibliotecas_le_o_manifesto():
    import importlib.util
    spec = importlib.util.spec_from_file_location("instalar", os.path.join(RAIZ, "tools", "instalar_bibliotecas.py"))
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    assert modulo.bibliotecas({"a": {"bibliotecas": ["X", "Y"]}, "b": {"bibliotecas": ["Y"]}, "c": {}}) == ["X", "Y"]
