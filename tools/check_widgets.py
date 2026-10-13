#!/usr/bin/env python3
"""
Valida os widgets interativos dos decks.

Para cada deck: conta no HTML os elementos com data-widget, abre a página no
Chromium do Playwright, espera cada widget terminar de montar e reprova se algum
não gravou data-pronto="sim", se houve erro de console ou exceção na página, ou
se o HTML declara widget e a página não tem nenhum para medir. Nada medido nunca
lê como sucesso: sem deck, ou com zero widget medido no total, o código de saída
é 1.

Uso:
    python3 tools/check_widgets.py aulas/_fixture-tema.html aulas/aula01.html
    python3 tools/check_widgets.py                # todos os aulas/aula*.html
"""
import glob
import os
import re
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from check_slides import porta_livre, servir  # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DECLARACAO = re.compile(r"\bdata-widget\s*=")
ESPERA_MS = 15000
JS_PRONTOS = "() => [...document.querySelectorAll('[data-widget]')].every(e => e.dataset.pronto)"
JS_ESTADOS = ("() => [...document.querySelectorAll('[data-widget]')]"
              ".map(e => ({nome: e.dataset.widget, pronto: e.dataset.pronto || null}))")


def declarados(caminho):
    with open(caminho, encoding="utf-8") as fh:
        return len(DECLARACAO.findall(fh.read()))


def _medir(navegador, url):
    pagina = navegador.new_page(viewport={"width": 1280, "height": 720})
    erros = []
    pagina.on("console", lambda msg: erros.append(msg.text) if msg.type == "error" else None)
    pagina.on("pageerror", lambda exc: erros.append(str(exc)))
    try:
        try:
            resposta = pagina.goto(url, wait_until="load")
        except Exception as erro:
            # goto() lança quando a navegação falha antes de qualquer resposta
            # HTTP existir (porta sem servidor, DNS, conexão recusada ou
            # resetada). Sem este except a exceção sobe crua por checar() e
            # main(), interrompe a lista inteira de decks no meio, e nenhum
            # deck seguinte chega a ser medido, em vez de reprovar só este.
            return None, ["página não carregou: %s" % erro]
        if resposta is None or not resposta.ok:
            return None, ["página não carregou: %s" % (resposta.status if resposta else "sem resposta")]
        try:
            pagina.wait_for_function(JS_PRONTOS, timeout=ESPERA_MS)
        except Exception:
            erros.append("tempo esgotado esperando os widgets montarem")
        return pagina.evaluate(JS_ESTADOS), erros
    finally:
        pagina.close()


def checar(caminhos, porta):
    resultados = []
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        try:
            for caminho in caminhos:
                rel = os.path.relpath(os.path.abspath(caminho), RAIZ).replace(os.sep, "/")
                n_declarados = declarados(caminho)
                estados, erros = _medir(navegador, "http://127.0.0.1:%d/%s" % (porta, rel))
                problemas = list(erros)
                if estados is not None:
                    if n_declarados and not estados:
                        problemas.append("HTML declara %d widget(s) e a página não tem nenhum para medir"
                                         % n_declarados)
                    for estado in estados:
                        if estado["pronto"] != "sim":
                            problemas.append("widget %s não montou (data-pronto=%s)"
                                             % (estado["nome"], estado["pronto"]))
                resultados.append({"deck": rel, "declarados": n_declarados,
                                   "medidos": len(estados or []), "problemas": problemas})
        finally:
            navegador.close()
    return resultados


def _descobrir():
    return sorted(glob.glob(os.path.join(RAIZ, "aulas", "aula*.html")))


def main(argv=None):
    caminhos = list(sys.argv[1:] if argv is None else argv) or _descobrir()
    if not caminhos:
        print("ERRO: nenhum deck encontrado, nada foi medido.")
        return 1
    inexistentes = [c for c in caminhos if not os.path.isfile(c)]
    if inexistentes:
        print("ERRO: deck inexistente: %s" % ", ".join(inexistentes))
        return 1
    porta = porta_livre()
    httpd = servir(porta)
    try:
        resultados = checar(caminhos, porta)
    finally:
        httpd.shutdown()
    falhou = False
    for resultado in resultados:
        for problema in resultado["problemas"]:
            print("%s  %s" % (resultado["deck"], problema))
            falhou = True
    medidos = sum(r["medidos"] for r in resultados)
    if falhou:
        return 1
    if medidos == 0:
        print("ERRO: nenhum widget medido em %d deck(s), nada foi validado." % len(resultados))
        return 1
    print("Widgets: %d montado(s) em %d deck(s), sem erro de console." % (medidos, len(resultados)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
