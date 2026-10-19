"""Portal: doze cards, cinco botões por aula, botão desabilitado sem artefato."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTEFATOS = {"Deck": "aulas/aula%s.html", "Material": "materiais/aula%s.html",
             "Referências": "referencias/aula%s.html", "Laboratório": "labs/aula%s.html"}


def test_doze_cards_e_botao_so_habilitado_com_arquivo():
    html = open(os.path.join(RAIZ, "index.html"), encoding="utf-8").read()
    cards = re.findall(r'<article class="card-aula" data-aula="(\d\d)">(.*?)</article>', html, flags=re.S)
    assert [n for n, _ in cards] == ["%02d" % i for i in range(1, 13)]
    for numero, corpo in cards:
        for rotulo, molde in ARTEFATOS.items():
            caminho = molde % numero
            existe = os.path.isfile(os.path.join(RAIZ, caminho))
            habilitado = 'href="%s"' % caminho in corpo
            assert existe == habilitado, (numero, rotulo)


def test_portal_versionado_e_o_que_o_gerador_produz():
    """index.html é gerado por tools/gerar_portal.py; editar à mão diverge."""
    import sys
    sys.path.insert(0, RAIZ)
    from tools import gerar_portal
    with open(os.path.join(RAIZ, "index.html"), encoding="utf-8") as fh:
        assert fh.read() == gerar_portal.renderizar()


def test_botao_de_ponderada_so_na_aula_da_ponderada():
    """Páginas de ponderada (ADR-011, ADR-012) aparecem como botão extra só no card da sua aula."""
    import sys
    sys.path.insert(0, RAIZ)
    from tools import gerar_portal
    html = open(os.path.join(RAIZ, "index.html"), encoding="utf-8").read()
    cards = dict(re.findall(r'<article class="card-aula" data-aula="(\d\d)">(.*?)</article>', html, flags=re.S))
    assert "02" in gerar_portal.PONDERADAS
    for aula, (_, _, caminho) in gerar_portal.PONDERADAS.items():
        alvo = 'href="%s"' % caminho
        existe = os.path.isfile(os.path.join(RAIZ, caminho))
        com_botao = [n for n, corpo in cards.items() if alvo in corpo]
        assert com_botao == ([aula] if existe else []), (aula, caminho)
