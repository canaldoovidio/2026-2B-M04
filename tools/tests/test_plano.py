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


def test_plano_cita_os_pesos_da_adalove():
    plano = _ler("PLANO_DE_ENSINO.md")
    for entrega, peso in PESOS.items():
        linha = next((l for l in plano.splitlines() if entrega in l and l.startswith("|")), None)
        assert linha, entrega
        assert re.search(r"\|\s*%s\s*\|" % peso, linha), (entrega, linha)


def test_plano_tem_as_doze_pendencias_e_as_doze_aulas():
    plano = _ler("PLANO_DE_ENSINO.md")
    assert re.findall(r"^\| (P\d+) \|", plano, flags=re.M) == ["P%d" % i for i in range(1, 13)]
    assert len(re.findall(r"^\| \d\d \| \d\d/\d\d \|", plano, flags=re.M)) == 12


def test_frameworks_separa_fonte_de_adaptacao():
    texto = _ler("docs", "frameworks-ia.md")
    for termo in ("5C", "DAIA-E", "Contextualizar", "Consultar", "Confrontar", "Construir",
                  "Comprovar", "Escrito na fonte", "Adaptação deste acervo"):
        assert termo in texto, termo
    assert chr(0x2014) not in texto
