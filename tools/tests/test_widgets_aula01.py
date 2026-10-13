"""As três animações da Aula 01 montam, inclusive fora de cena, sem erro de console."""
import os
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_as_tres_animacoes_montam_sem_erro():
    fixture = os.path.join("tools", "tests", "fixture_widgets_aula01.html")
    saida = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "check_widgets.py"), fixture],
                           cwd=RAIZ, capture_output=True, text=True)
    assert saida.returncode == 0, saida.stdout + saida.stderr
    assert "3 montado(s)" in saida.stdout


def test_nenhuma_cor_literal_nos_widgets():
    import re
    for nome in ("circuito-led", "protoboard", "setup-loop"):
        with open(os.path.join(RAIZ, "assets", "js", "widgets", nome + ".js"), encoding="utf-8") as fh:
            codigo = fh.read()
        assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(", codigo), nome
