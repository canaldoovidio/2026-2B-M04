"""ADRs e plano de ensino: estrutura mínima e pesos citados da fonte."""
import glob
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SECOES_ADR = ("**Data:**", "**Status:**", "**Decisores:**", "## Contexto", "## Decisão",
              "## Motivações", "## Riscos conhecidos", "## Consequências")
# Pesos da Adalove (planilha da turma, 13/10/2026). O plano cita, nunca calcula.
PESOS = {
    "Domínio dos fundamentos de negócio": "3",
    "Requisitos Funcionais, Regras de Negócio e Matriz de Rastreabilidade": "2",
    "Protótipo físico do projeto (offline)": "4",
    "Requisitos Não Funcionais": "2",
    "Protótipo do Projeto com MQTT e I2C": "3",
    "Metodologia e Arquitetura da solução": "3",
    "Protótipo físico do projeto (online)": "2",
    "Protótipo final do projeto": "3",
    "Prova do Módulo": "20",
    "Atividade - Semáforo Inteligente": "2",
    "Atividade - Mapa de Calor calculando dBm de sinal WiFi": "2",
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


