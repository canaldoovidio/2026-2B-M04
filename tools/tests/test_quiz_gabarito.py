"""Posição da alternativa correta nos quizzes dos decks (ADR-010).

Na Aula 01 todas as respostas certas estavam na primeira alternativa, e a turma percebeu.
"""
import collections
import glob
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _posicoes(caminho):
    with open(caminho, encoding="utf-8") as fh:
        texto = fh.read()
    posicoes = []
    for bloco in re.findall(r'<ul class="quiz-options">(.*?)</ul>', texto, flags=re.S):
        itens = re.findall(r"<li\b[^>]*>", bloco)
        certas = [i for i, li in enumerate(itens) if 'data-correct="true"' in li]
        assert len(certas) == 1, (os.path.basename(caminho), certas)
        posicoes.append(certas[0])
    return posicoes


def _decks():
    decks = sorted(glob.glob(os.path.join(RAIZ, "aulas", "aula[0-9][0-9].html")))
    assert decks
    return decks


def test_quizzes_seguidos_nao_repetem_a_posicao_da_resposta():
    for deck in _decks():
        posicoes = _posicoes(deck)
        for a, b in zip(posicoes, posicoes[1:]):
            assert a != b, (os.path.basename(deck), posicoes)


def test_resposta_certa_distribuida_entre_as_quatro_alternativas():
    todas = [p for deck in _decks() for p in _posicoes(deck)]
    assert len(todas) >= 12
    contagem = collections.Counter(todas)
    for posicao in range(4):
        # Cada alternativa recebe entre 15% e 35% das respostas certas do acervo.
        assert 0.15 <= contagem[posicao] / len(todas) <= 0.35, contagem


def test_regressao_aula01_sem_gabarito_todo_na_mesma_letra():
    assert len(set(_posicoes(os.path.join(RAIZ, "aulas", "aula01.html")))) >= 3
