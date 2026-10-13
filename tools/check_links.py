#!/usr/bin/env python3
"""
Verifica que todo link local do acervo resolve para um arquivo que existe.

O portal e escrito a mao e aponta para quatro artefatos por aula, entao link
morto e a falha mais provavel do repositorio. Link externo nao e checado: a
rede nao pode derrubar o CI.

Uso:
    python3 tools/check_links.py
"""
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IGNORAR = {".git", ".claude", ".venv", "node_modules", "__pycache__", ".ipynb_checkpoints"}
EXTERNOS = ("http://", "https://", "mailto:", "tel:", "data:", "javascript:")

# Link para o proprio repositorio no GitHub. O botao "Notebook" do portal aponta
# para la, e nao para o caminho relativo, porque o GitHub Pages serve .ipynb como
# JSON cru: o navegador baixa o arquivo em vez de mostrar o notebook. Mas isso
# tirava o arquivo da checagem, porque link externo nao e verificado. Aqui a gente
# traduz a URL de volta para o caminho local e confere que o arquivo existe, sem
# depender de rede.
REPO_BLOB = "https://github.com/canaldoovidio/2026-2B-M04/blob/main/"

ATRIBUTO = re.compile(r"""(?:href|src)\s*=\s*["']([^"']+)["']""")


def coletar(raiz):
    """Todo link local declarado em href ou src, com arquivo e linha."""
    encontrados = []
    for pasta, subs, nomes in os.walk(raiz):
        subs[:] = [s for s in subs if s not in IGNORAR]
        for nome in sorted(nomes):
            if not nome.endswith(".html"):
                continue
            caminho = os.path.join(pasta, nome)
            with open(caminho, encoding="utf-8") as fh:
                for n, linha in enumerate(fh.read().splitlines(), start=1):
                    for href in ATRIBUTO.findall(linha):
                        alvo = href.strip()
                        if not alvo or alvo.startswith("#"):
                            continue
                        if alvo.startswith(REPO_BLOB):
                            pass  # do proprio repo: verificavel sem rede
                        elif alvo.lower().startswith(EXTERNOS):
                            continue
                        encontrados.append({
                            "arquivo": os.path.relpath(caminho, raiz),
                            "linha": n,
                            "href": alvo,
                            "base": pasta,
                        })
    return encontrados


def quebrados(raiz):
    """Subconjunto de coletar() cujo alvo nao existe no disco."""
    mortos = []
    for link in coletar(raiz):
        # Cortar query e ancora: aula01.html?print-pdf resolve para aula01.html
        alvo = link["href"].split("?")[0].split("#")[0]
        if not alvo:
            continue
        if alvo.startswith(REPO_BLOB):
            # URL do proprio repo: confere contra o arquivo local correspondente
            destino = os.path.join(raiz, alvo[len(REPO_BLOB):])
        else:
            destino = os.path.normpath(os.path.join(link["base"], alvo))
        if not os.path.exists(destino):
            mortos.append({k: link[k] for k in ("arquivo", "linha", "href")})
    return mortos


def main():
    mortos = quebrados(RAIZ)
    if not mortos:
        print("Links: todos os alvos locais existem.")
        return 0
    for m in mortos:
        print("%s:%d  alvo inexistente: %s" % (m["arquivo"], m["linha"], m["href"]))
    print("\n%d link(s) quebrado(s)." % len(mortos))
    return 1


if __name__ == "__main__":
    sys.exit(main())
