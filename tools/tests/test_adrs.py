"""ADRs e plano de ensino: estrutura mínima e pesos citados da fonte."""
import glob
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SECOES_ADR = ("**Data:**", "**Status:**", "**Decisores:**", "## Contexto", "## Decisão",
              "## Motivações", "## Riscos conhecidos", "## Consequências")
# Pesos da Adalove (planilha da turma, 03/11/2026). O plano cita, nunca calcula.
PESOS = {
    "ART. 1 - Domínio dos fundamentos de negócio": "3",
    "ART. 2 - Domínio dos fundamentos da experiência de usuário - Personas": "2",
    "ART. 4 - Requisitos Funcionais, Regras de Negócio e Matriz de Rastreabilidade": "2",
    "ART. 5 - Protótipo físico do projeto (offline)": "4",
    "ART. 6 - Requisitos Não Funcionais e Atualizações de Requisitos": "2",
    "ART. 8 - Protótipo do Projeto com MQTT e I2C": "4",
    "ART. 10 - Metodologia e Arquitetura da solução": "3",
    "ART. 12 - Protótipo físico do projeto (online)": "4",
    "ART. 16 - Protótipo final do projeto": "3",
    "ART. 19 - Apresentação final": "2",
    "Prova do Módulo": "20",
    "Atividade ponderada de Computação 1 - circuito RC": "3",
    "Atividade ponderada de Computação 2 - Semáforo com dois modos de operação": "5",
    "Atividade ponderada de Computação 3 - Mapa de Calor calculando dBm de sinal WiFi": "4",
}


def _ler(*partes):
    with open(os.path.join(RAIZ, *partes), encoding="utf-8") as fh:
        return fh.read()


def test_oito_adrs_de_fundacao_com_estrutura_minima():
    adrs = sorted(glob.glob(os.path.join(RAIZ, "docs", "adrs", "ADR-*.md")))
    assert [os.path.basename(a)[:7] for a in adrs][:8] == ["ADR-%03d" % i for i in range(1, 9)]
    for caminho in adrs:
        texto = open(caminho, encoding="utf-8").read()
        for secao in SECOES_ADR:
            assert secao in texto, (os.path.basename(caminho), secao)
        assert chr(0x2014) not in texto


