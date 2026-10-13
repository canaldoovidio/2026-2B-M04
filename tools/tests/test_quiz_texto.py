"""O inteli-quiz.js escreve o feedback com textContent: tag HTML apareceria literal."""
import glob
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_mensagens_de_quiz_sem_tag_html():
    decks = sorted(glob.glob(os.path.join(RAIZ, "aulas", "aula*.html")))
    assert decks
    medidas = 0
    for deck in decks:
        with open(deck, encoding="utf-8") as fh:
            texto = fh.read()
        for msg in re.findall(r'data-(?:in)?correct-msg="([^"]*)"', texto):
            medidas += 1
            assert not re.search(r"<\s*/?[a-zA-Z]", msg), (os.path.basename(deck), msg)
    assert medidas > 0
