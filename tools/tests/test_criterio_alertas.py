"""Critério único de alerta em todo o acervo.

O TAPI pede alerta de permanência "acima do limiar configurado" (referência de
150 dias) e separa o atraso frente ao prazo previsto. O acervo padroniza as duas
regras em "maior que": dias fora > limiar e dias fora > prazo. Com 150 dias
exatos não há alerta de permanência.

As Aulas 07, 09, 10 e 12 foram construídas em paralelo e chegaram a usar ">="
(revisões de 13/10/2026). Este teste varre o código de todos os laboratórios e
das animações e reprova qualquer comparação de limiar ou prazo com ">=" ou "<".
"""
import glob
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Nomes de limiar e prazo usados nos sketches e widgets do acervo.
NOMES = r"(?:LIMIAR\w*|limiar\w*|PRAZO\w*|prazo\w*)"
PROIBIDO = re.compile(r">=\s*(?:\w+\.)?%s\b|\b%s\s*<=" % (NOMES, NOMES))


def _sem_comentarios(codigo):
    codigo = re.sub(r"/\*.*?\*/", "", codigo, flags=re.S)
    return re.sub(r"//[^\n]*", "", codigo)


def _arquivos():
    padroes = ("labs/*/*.ino", "labs/*/*.h", "labs/*/testes/*.cpp", "assets/js/widgets/*.js")
    for padrao in padroes:
        for caminho in sorted(glob.glob(os.path.join(RAIZ, padrao))):
            # O arquivo de exemplo com testes fracos da Aula 10 é material de confronto.
            if caminho.endswith("testes_da_ia_exemplo.cpp"):
                continue
            yield caminho


def test_nenhum_codigo_compara_limiar_ou_prazo_com_maior_ou_igual():
    medidos = 0
    violacoes = []
    for caminho in _arquivos():
        with open(caminho, encoding="utf-8") as fh:
            codigo = _sem_comentarios(fh.read())
        medidos += 1
        for achado in PROIBIDO.finditer(codigo):
            linha = codigo.count("\n", 0, achado.start()) + 1
            violacoes.append("%s:%d %s" % (os.path.relpath(caminho, RAIZ), linha, achado.group(0)))
    assert medidos > 10, medidos
    assert violacoes == [], violacoes
