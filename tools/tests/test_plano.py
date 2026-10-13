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


def test_plano_cita_os_pesos_da_adalove():
    plano = _ler("PLANO_DE_ENSINO.md")
    for entrega, peso in PESOS.items():
        linha = next((l for l in plano.splitlines() if entrega in l and l.startswith("|")), None)
        assert linha, entrega
        assert re.search(r"\|\s*%s\s*\|" % peso, linha), (entrega, linha)


def test_plano_tem_as_dez_pendencias_e_as_doze_aulas():
    plano = _ler("PLANO_DE_ENSINO.md")
    assert re.findall(r"^\| (P\d) \|", plano, flags=re.M) == ["P%d" % i for i in range(1, 11)]
    assert len(re.findall(r"^\| \d\d \| \d\d/\d\d \|", plano, flags=re.M)) == 12


def test_frameworks_separa_fonte_de_adaptacao():
    texto = _ler("docs", "frameworks-ia.md")
    for termo in ("5C", "DAIA-E", "Contextualizar", "Consultar", "Confrontar", "Construir",
                  "Comprovar", "Escrito na fonte", "Adaptação deste acervo"):
        assert termo in texto, termo
    assert chr(0x2014) not in texto
