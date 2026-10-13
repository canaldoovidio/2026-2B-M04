"""Planejamento das 12 aulas: títulos exatos, sete blocos, amarrações e 5C."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AULAS = {
    "01": ("15/10/2026", "Programação em Arduino e Eletrônica Básica"),
    "02": ("20/10/2026", "Sensores e Atuadores Básicos (Atividade Ponderada em Sala)"),
    "03": ("22/10/2026", "Programação básica usada em microcontroladores"),
    "04": ("30/10/2026", "Arquitetura de Microcontroladores e Ponteiros"),
    "05": ("05/11/2026", "Sensores e processamento de valores de entrada analógicos para digital"),
    "06": ("13/11/2026", "Comunicação à distância (Início de Atividade Ponderada)"),
    "07": ("18/11/2026", "Atuadores e saídas informacionais"),
    "08": ("27/11/2026", "Transmissão de Sinal e Dashboard (Atividade Ponderada em Sala)"),
    "09": ("02/12/2026", "Sistema de disparo de atuadores"),
    "10": ("03/12/2026", "Integração geral entre entrada, sensores e atuadores e a interface com o usuário"),
    "11": ("10/12/2026", "Visão Geral sobre Segurança em IoT (Atividade Ponderada em Sala)"),
    "12": ("17/12/2026", "Revisões finais do projeto"),
}
INTERACOES = {
    "Peer Instruction": r"Peer Instruction",
    "prever e observar": r"prev[êe]\b|prevendo\b|prever\b",
    "pensar e compartilhar": r"[Pp]ensar e compartilhar",
    "dupla no Wokwi": r"[Dd]upla no Wokwi",
    "confronto com a IA": r"[Cc]onfronto com a IA",
    "quiz": r"[Qq]uiz",
    "pergunta disparada": r"[Pp]ergunta disparada",
}
ETAPAS = ("SP1", "SP2", "SP3", "SP4", "SP5")


def _ler(*partes):
    with open(os.path.join(RAIZ, *partes), encoding="utf-8") as fh:
        return fh.read()


def _secoes():
    partes = re.split(r"^### Aula (\d\d) - ", _ler("PLANEJAMENTO_AULA_A_AULA.md"), flags=re.M)
    return {partes[i]: partes[i + 1] for i in range(1, len(partes), 2)}


def _blocos(secao):
    corpo = secao.split("Metodologia ativa", 1)[1].split("Depois do encontro", 1)[0]
    partes = re.split(r"^\s+(Bloco \d) \(\d+ a \d+ min\)", corpo, flags=re.M)
    return [(partes[i], partes[i + 1]) for i in range(1, len(partes), 2)]


def _autoestudos_por_semana():
    por = {}
    texto = _ler("docs", "autoestudos-por-semana.md")
    for semana, corpo in re.findall(r"^## Semana (\d\d)\n(.*?)(?=^## Semana|\Z)", texto, flags=re.M | re.S):
        por[semana] = set(re.findall(r"^\| (.+?) \| [^|]+ \| [^|]+ \| [^|]* \|$", corpo, flags=re.M)) - {"Autoestudo"}
    return por


def test_doze_aulas_com_data_e_titulo_exatos():
    secoes = _secoes()
    assert sorted(secoes) == sorted(AULAS)
    for numero, (data, titulo) in AULAS.items():
        assert secoes[numero].splitlines()[0] == "%s - %s" % (data, titulo), numero


def test_cada_aula_tem_sete_blocos_de_ate_quinze_minutos_com_interacao():
    medidos = 0
    for numero, secao in _secoes().items():
        blocos = re.findall(r"^\s+Bloco (\d) \((\d+) a (\d+) min\)", secao, flags=re.M)
        assert [int(b[0]) for b in blocos] == list(range(1, 8)), numero
        for _, inicio, fim in blocos:
            assert 0 < int(fim) - int(inicio) <= 15, (numero, inicio, fim)
        for rotulo, corpo in _blocos(secao):
            corrido = " ".join(corpo.split())
            assert any(re.search(f, corrido) for f in INTERACOES.values()), (numero, rotulo)
            medidos += 1
    assert medidos == 84


def test_cada_aula_declara_amarracoes_daia_e_e_5c():
    for numero, secao in _secoes().items():
        for rotulo in ("Semana:", "Sprint:", "Etapa DAIA-E:", "Entrega que alimenta:",
                       "O que a aula anterior deixou pronto:", "O que esta aula deixa pronto:",
                       "Camada do rastreador:", "Trilha de IA:", "Antes do encontro",
                       "Daily da equipe", "Metodologia ativa", "Depois do encontro"):
            assert rotulo in secao, (numero, rotulo)
        etapa = re.search(r"Etapa DAIA-E: (SP\d)", secao)
        assert etapa and etapa.group(1) in ETAPAS, numero
        assert re.search(r"[Cc]onfronto com a IA", secao), numero


def test_autoestudo_citado_e_da_semana_da_aula_com_titulo_exato():
    por_semana = _autoestudos_por_semana()
    medidos = 0
    for numero, secao in _secoes().items():
        semana = re.search(r"Semana: (\d\d)", secao).group(1)
        antes = secao.split("Antes do encontro", 1)[1].split("Daily da equipe", 1)[0]
        for citado in re.findall(r"^\s+Autoestudo: (.+)$", antes, flags=re.M):
            assert citado.strip() in por_semana.get(semana, set()), (numero, citado)
            medidos += 1
    assert medidos >= 24


def test_pendencias_citadas_existem_no_plano():
    plano = set(re.findall(r"^\| (P\d) \|", _ler("PLANO_DE_ENSINO.md"), flags=re.M))
    citadas = set(re.findall(r"\bP\d\b", _ler("PLANEJAMENTO_AULA_A_AULA.md")))
    assert citadas <= plano, sorted(citadas - plano)


def test_sem_travessao():
    assert chr(0x2014) not in _ler("PLANEJAMENTO_AULA_A_AULA.md")
