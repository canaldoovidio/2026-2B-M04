#!/usr/bin/env python3
"""
Instala no arduino-cli as bibliotecas declaradas em labs/labs.json.

Cada laboratório pode declarar "bibliotecas": nomes do Library Manager do
Arduino, os mesmos do labs/aulaNN/libraries.txt que o Wokwi lê. O CI roda este
script antes da suíte, e quem desenvolve roda uma vez depois de puxar uma aula
nova:

    python3 tools/instalar_bibliotecas.py
"""
import json
import os
import shutil
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def bibliotecas(manifesto):
    """União ordenada das bibliotecas de todos os laboratórios."""
    return sorted({nome for entrada in manifesto.values() for nome in entrada.get("bibliotecas", [])})


def main():
    with open(os.path.join(RAIZ, "labs", "labs.json"), encoding="utf-8") as fh:
        nomes = bibliotecas(json.load(fh))
    if not nomes:
        print("nenhuma biblioteca declarada em labs/labs.json")
        return 0
    cli = shutil.which("arduino-cli")
    if not cli:
        print("arduino-cli não encontrado; ver CLAUDE.md, seção 2", file=sys.stderr)
        return 1
    return subprocess.call([cli, "lib", "install"] + nomes)


if __name__ == "__main__":
    sys.exit(main())
