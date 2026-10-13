"""O botão de exportar PDF não pode cobrir o número de página do rodapé.

Achado das revisões das Aulas 03 e 06 (13/10/2026): o botão flutuante ficava no
canto inferior direito, exatamente sobre o .footer-page de todo slide de conteúdo.
"""
import os
import sys

from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402


def test_botao_pdf_nao_cobre_o_numero_da_pagina():
    httpd = check_slides.servir(0)
    try:
        with sync_playwright() as p:
            navegador = p.chromium.launch()
            pg = navegador.new_page(viewport={"width": 1280, "height": 720})
            pg.goto("http://127.0.0.1:%d/aulas/aula01.html#/3" % httpd.server_address[1])
            pg.wait_for_selector(".print-button")
            pg.wait_for_timeout(600)
            caixas = pg.evaluate("""() => {
                const r = e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
                return [r(document.querySelector('.print-button')),
                        r(document.querySelector('section.present .footer-page'))];
            }""")
            navegador.close()
    finally:
        httpd.shutdown()
    (b0, b1, b2, b3), (f0, f1, f2, f3) = caixas
    sobrepoe = b0 < f2 and f0 < b2 and b1 < f3 and f1 < b3
    assert not sobrepoe, caixas
