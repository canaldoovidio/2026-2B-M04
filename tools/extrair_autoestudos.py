#!/usr/bin/env python3
"""
Extrai da planilha da turma os encontros e autoestudos do Prof. Ovidio, por semana,
e junta a URL e a observação de cada autoestudo vindas da revisão IN04 2026.2B.

A planilha da turma tem dado pessoal de aluno e não é versionada. O derivado
publicável é docs/autoestudos-por-semana.md.

Uso:
    python3 tools/extrair_autoestudos.py [Turma.xlsx] > docs/autoestudos-por-semana.md
"""
import csv
import datetime
import os
import sys

import openpyxl

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PADRAO = os.path.join(RAIZ, "Turma.xlsx")
REVISAO = os.path.join(RAIZ, "docs", "fontes", "revisao-in04-2026-2b.csv")
PROFESSOR = "Ovidio"


def _data(valor):
    if isinstance(valor, datetime.datetime):
        return valor.strftime("%d/%m/%Y")
    return str(valor).strip() if valor else ""


def extrair(caminho_xlsx):
    wb = openpyxl.load_workbook(caminho_xlsx, data_only=True, read_only=True)
    linhas = wb.worksheets[0].iter_rows(values_only=True)
    cab = [str(c).strip() for c in next(linhas)]
    i = {nome: pos for pos, nome in enumerate(cab)}
    vistos, dados = set(), {}
    for linha in linhas:
        if PROFESSOR not in str(linha[i["Atividade_Professor_Nome"]] or ""):
            continue
        semana = str(linha[i["Atividade_Semana"]] or "").replace("Semana", "").strip().zfill(2)
        tipo = str(linha[i["Atividade_Tipo"]] or "").strip()
        titulo = str(linha[i["Atividade_Nome"]] or "").strip()
        data = _data(linha[i["Atividade_Data_Inicio"]])
        chave = (semana, tipo, titulo, data)
        if chave in vistos:
            continue
        vistos.add(chave)
        registro = dados.setdefault(semana, {"encontros": [], "autoestudos": []})
        if tipo == "Autoestudo":
            registro["autoestudos"].append(titulo)
        elif tipo == "Encontro de Instrução":
            registro["encontros"].append({"data": data, "titulo": titulo})
    if not dados:
        raise ValueError("nenhuma atividade do professor %s em %s" % (PROFESSOR, caminho_xlsx))
    for registro in dados.values():
        registro["autoestudos"].sort()
        registro["encontros"].sort(key=lambda e: e["data"].split("/")[::-1])
    return dict(sorted(dados.items()))


def ler_revisao(caminho_csv):
    with open(caminho_csv, encoding="utf-8") as fh:
        return {linha["titulo"]: linha for linha in csv.DictReader(fh)}


def renderizar(dados, revisao):
    saida = [
        "# Autoestudos e encontros do Prof. Ovidio por semana",
        "",
        "Gerado por `tools/extrair_autoestudos.py` a partir da planilha da turma (Adalove) e de",
        "`docs/fontes/revisao-in04-2026-2b.csv`. Não editar à mão.",
        "",
        "A coluna Observação registra a validação do conteúdo feita em 13/10/2026: placa diferente",
        "da usada em aula, conteúdo que não corresponde ao título ou acesso que exige login.",
        "",
    ]
    for semana, registro in dados.items():
        saida += ["## Semana %s" % semana, ""]
        for enc in registro["encontros"]:
            saida.append("- Encontro de Instrução, %s: %s" % (enc["data"], enc["titulo"]))
        saida += ["", "| Autoestudo | Formato | Link | Observação |", "|---|---|---|---|"]
        for titulo in registro["autoestudos"]:
            card = revisao[titulo]
            link = card["url"] or "Sem link"
            saida.append("| %s | %s | %s | %s |" % (titulo, card["formato"], link, card["observacao"]))
        saida.append("")
    return "\n".join(saida)


def main():
    caminho = sys.argv[1] if len(sys.argv) > 1 else PADRAO
    if not os.path.isfile(caminho):
        print("planilha da turma não encontrada em %s" % caminho, file=sys.stderr)
        return 1
    print(renderizar(extrair(caminho), ler_revisao(REVISAO)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
