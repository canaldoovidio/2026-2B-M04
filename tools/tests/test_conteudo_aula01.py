"""Regressões de conteúdo da Aula 01 apontadas na revisão de 13/10/2026."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTEFATOS = (("aulas", "aula01.html"), ("materiais", "aula01.html"), ("labs", "aula01.html"),
             ("referencias", "aula01.html"), ("PLANEJAMENTO_AULA_A_AULA.md",),
             ("docs", "notas-do-professor", "aula01.md"), ("assets", "js", "widgets", "protoboard.js"),
             ("assets", "js", "widgets", "circuito-led.js"))


def _ler(*partes):
    with open(os.path.join(RAIZ, *partes), encoding="utf-8") as fh:
        return " ".join(fh.read().split())


def test_nada_pede_ao_wokwi_corrente_ou_brilho_por_resistor():
    """O LED do Wokwi não muda de brilho com o resistor e o Uno simulado não mede
    corrente: a conferência é por cálculo e pela animação circuito-led."""
    proibidos = (r"corrente indicada pelo simulador", r"observe o brilho",
                 r"anote o brilho e a corrente", r"que o simulador reproduz",
                 r"testar no simulador e depois o que observou")
    for partes in ARTEFATOS:
        texto = _ler(*partes)
        for padrao in proibidos:
            assert not re.search(padrao, texto, flags=re.I), (partes, padrao)


def test_vinte_miliamperes_e_corrente_recomendada_e_nao_limite_absoluto():
    for partes in ARTEFATOS:
        texto = _ler(*partes)
        assert not re.search(r"corrente máxima contínua de 20 mA", texto), partes
        assert not re.search(r"Acima de 20 mA o LED passa do limite do datasheet e pode queimar", texto), partes


def test_protoboard_nao_diz_que_o_led_atravessa_a_canaleta():
    assert "o circuito integrado e o LED atravessam a canaleta" not in _ler("assets", "js", "widgets", "protoboard.js")


def test_sem_paralelismo_negativo_nos_textos_da_aula():
    """Construções do tipo "X, não Y" e antíteses espelhadas que a revisão encontrou."""
    trechos = ("é a tensão, não a corrente", "não \"a que chega\"", "não a quem está ao lado",
               "ensina a tendência; o datasheet", "o LED piscando mostra só",
               "não queima, mas também não avisa")
    for partes in ARTEFATOS:
        texto = _ler(*partes)
        for trecho in trechos:
            assert trecho not in texto, (partes, trecho)
