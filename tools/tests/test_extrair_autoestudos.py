"""Extrator de autoestudos: lê por nome de coluna, deduplica e filtra o Ovidio."""
import os
import re

import openpyxl
import pytest

from tools import extrair_autoestudos as ex

CAB = ["Aluno_Nome", "Atividade_Nome", "Atividade_Semana", "Atividade_Tipo",
       "Atividade_Data_Inicio", "Atividade_Professor_Nome", "Atividade_Peso"]


def _planilha(tmp_path, linhas):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(CAB)
    for linha in linhas:
        ws.append(linha)
    caminho = os.path.join(tmp_path, "turma.xlsx")
    wb.save(caminho)
    return caminho


def test_deduplica_linhas_de_alunos_diferentes(tmp_path):
    caminho = _planilha(tmp_path, [
        ["A", "Como usar a Protoboard", "Semana 01", "Autoestudo", None, "Ovidio Lopes da Cruz Netto", 0],
        ["B", "Como usar a Protoboard", "Semana 01", "Autoestudo", None, "Ovidio Lopes da Cruz Netto", 0],
    ])
    assert ex.extrair(caminho)["01"]["autoestudos"] == ["Como usar a Protoboard"]


def test_ignora_outros_professores_e_le_por_nome_de_coluna(tmp_path):
    caminho = _planilha(tmp_path, [
        ["A", "Storyboards", "Semana 02", "Autoestudo", None, "Bruna Mayer Costa", 0],
        ["A", "Programação em Arduino e Eletrônica Básica", "Semana 01", "Encontro de Instrução",
         "15/10/2026", "Ovidio Lopes da Cruz Netto", 0],
    ])
    dados = ex.extrair(caminho)
    assert "02" not in dados
    assert dados["01"]["encontros"] == [
        {"data": "15/10/2026", "titulo": "Programação em Arduino e Eletrônica Básica"}]


def test_planilha_sem_linha_do_ovidio_reprova(tmp_path):
    caminho = _planilha(tmp_path, [["A", "Storyboards", "Semana 02", "Autoestudo", None, "Bruna", 0]])
    with pytest.raises(ValueError):
        ex.extrair(caminho)


def test_autoestudo_sem_url_na_revisao_reprova_a_renderizacao():
    dados = {"01": {"encontros": [], "autoestudos": ["Como usar a Protoboard"]}}
    with pytest.raises(KeyError):
        ex.renderizar(dados, {})


def test_derivado_versionado_cobre_as_dez_semanas_e_tem_url_por_autoestudo():
    raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    with open(os.path.join(raiz, "docs", "autoestudos-por-semana.md"), encoding="utf-8") as fh:
        texto = fh.read()
    for semana in ("01", "02", "03", "04", "05", "06", "07", "08", "09"):
        assert "## Semana %s" % semana in texto
    linhas = [l for l in texto.splitlines() if l.startswith("| ") and not l.startswith("| Autoestudo")
              and not l.startswith("|---")]
    assert len(linhas) > 70
    assert all(re.search(r"\| https?://", l) or "Sem link" in l for l in linhas)


def test_le_por_nome_de_coluna_com_as_colunas_embaralhadas(tmp_path):
    """Planilha reexportada com outra ordem de colunas: o resultado não muda."""
    ordem = CAB[::-1]
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(ordem)
    linha = dict(zip(CAB, ["A", "Como usar a Protoboard", "Semana 01", "Autoestudo", None,
                           "Ovidio Lopes da Cruz Netto", 0]))
    ws.append([linha[c] for c in ordem])
    ws.append([linha[c] for c in ordem])
    caminho = os.path.join(tmp_path, "embaralhada.xlsx")
    wb.save(caminho)
    assert ex.extrair(caminho) == {"01": {"encontros": [], "autoestudos": ["Como usar a Protoboard"]}}
