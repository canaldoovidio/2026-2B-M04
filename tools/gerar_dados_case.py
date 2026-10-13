#!/usr/bin/env python3
"""
Gera o conjunto fictício do case Cerradinho (ADR-006).

O TAPI classifica como restritos os cadastros, NFs, localizações e prazos da
Cerradinho. Nenhum valor aqui é real: nomes, regiões e coordenadas são inventados,
e a posição é um plano em quilômetros sem latitude e longitude.

Uso:
    python3 tools/gerar_dados_case.py        # regrava dados/*.csv
"""
import csv
import os
import random
from datetime import date, datetime, time, timedelta

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEMENTE = 4042
DATA_REF = date(2026, 10, 1)
INICIO = date(2025, 10, 1)
LIMIAR_DIAS = 150
TIPOS = ["bomba centrífuga", "redutor", "motor elétrico", "válvula de controle",
         "cilindro hidráulico", "painel elétrico"]
COLUNAS = {
    "equipamentos": ["id_equipamento", "tipo", "largura_m", "altura_m", "profundidade_m", "massa_kg"],
    "fornecedores": ["id_fornecedor", "nome", "regiao", "prazo_medio_dias"],
    "ciclos": ["id_ciclo", "id_equipamento", "id_fornecedor", "id_dispositivo", "nf_remessa",
               "data_saida", "prazo_previsto", "data_retorno", "nf_retorno"],
    "leituras": ["id_ciclo", "id_dispositivo", "data_hora", "x_km", "y_km", "posicao_valida",
                 "bateria_pct", "rssi_dbm"],
    "eventos_lacre": ["id_ciclo", "id_dispositivo", "data_hora", "tipo"],
}
# Três ciclos abertos fixados para garantir os casos que o TAPI pede analisar
# separadamente: (dispositivo, dias desde a saída, prazo previsto em dias).
ROTEIRO = [("DV-01", 190, 60),   # permanência longa: passou de 150 dias
           ("DV-02", 70, 30),    # atraso sem permanência longa
           ("DV-03", 12, 45)]    # no prazo


def _fornecedores(rnd):
    return [{"id_fornecedor": "FN-%02d" % i, "nome": "Oficina Fictícia %s" % chr(64 + i),
             "regiao": "Região %d" % ((i - 1) % 3 + 1), "prazo_medio_dias": rnd.choice([30, 45, 60, 90])}
            for i in range(1, 7)]


def _equipamentos(rnd):
    return [{"id_equipamento": "EQ-%02d" % i, "tipo": rnd.choice(TIPOS),
             "largura_m": round(rnd.uniform(0.6, 1.4), 2), "altura_m": round(rnd.uniform(0.6, 1.4), 2),
             "profundidade_m": round(rnd.uniform(0.6, 1.4), 2), "massa_kg": rnd.randint(80, 900)}
            for i in range(1, 17)]


def _livre(ocupado, chave, inicio, fim):
    return all(fim < a or inicio > b for a, b in ocupado.get(chave, []))


def _ciclos(rnd, equipamentos, fornecedores):
    ciclos, ocup_eq, n = [], {}, 0
    for i in range(1, 9):
        dv = "DV-%02d" % i
        roteiro = [r for r in ROTEIRO if r[0] == dv]
        cursor = INICIO + timedelta(days=rnd.randint(0, 20))
        limite_aberto = DATA_REF - timedelta(days=roteiro[0][1]) if roteiro else DATA_REF
        while True:
            forn = rnd.choice(fornecedores)
            duracao = max(10, int(rnd.gauss(forn["prazo_medio_dias"], 20)))
            fim = cursor + timedelta(days=duracao)
            if fim >= limite_aberto - timedelta(days=5):
                break
            eq = next((e for e in rnd.sample(equipamentos, len(equipamentos))
                       if _livre(ocup_eq, e["id_equipamento"], cursor, fim)), None)
            if eq:
                n += 1
                ocup_eq.setdefault(eq["id_equipamento"], []).append((cursor, fim))
                ciclos.append(_ciclo(n, eq, forn, dv, cursor, forn["prazo_medio_dias"], fim))
            cursor = fim + timedelta(days=rnd.randint(3, 25))
        if roteiro:
            _, dias_fora, prazo = roteiro[0]
            saida = DATA_REF - timedelta(days=dias_fora)
            eq = next(e for e in equipamentos if _livre(ocup_eq, e["id_equipamento"], saida, DATA_REF))
            ocup_eq.setdefault(eq["id_equipamento"], []).append((saida, DATA_REF))
            n += 1
            ciclos.append(_ciclo(n, eq, rnd.choice(fornecedores), dv, saida, prazo, None))
    return ciclos


def _ciclo(n, eq, forn, dv, saida, prazo, retorno):
    return {"id_ciclo": "CI-%03d" % n, "id_equipamento": eq["id_equipamento"],
            "id_fornecedor": forn["id_fornecedor"], "id_dispositivo": dv,
            "nf_remessa": "NF-R-%05d" % (10000 + n * 7), "data_saida": saida.isoformat(),
            "prazo_previsto": (saida + timedelta(days=prazo)).isoformat(),
            "data_retorno": retorno.isoformat() if retorno else "",
            "nf_retorno": "NF-D-%05d" % (20000 + n * 7) if retorno else ""}


def _leituras_e_lacre(rnd, ciclos, fornecedores):
    regiao = {f["id_fornecedor"]: int(f["regiao"][-1]) for f in fornecedores}
    leituras, eventos = [], []
    for c in ciclos:
        saida = date.fromisoformat(c["data_saida"])
        fim = date.fromisoformat(c["data_retorno"]) if c["data_retorno"] else DATA_REF
        destino = (40.0 * regiao[c["id_fornecedor"]], 25.0 * regiao[c["id_fornecedor"]])
        bateria, dia = 100, saida
        while dia <= fim:
            bateria = max(0, bateria - rnd.randint(1, 4))
            valida = rnd.random() > 0.12
            ultimo = leituras[-1] if leituras and leituras[-1]["id_ciclo"] == c["id_ciclo"] else None
            x, y = (destino if dia > saida + timedelta(days=2) else (0.0, 0.0))
            if not valida and ultimo:
                x, y = ultimo["x_km"], ultimo["y_km"]
            leituras.append({"id_ciclo": c["id_ciclo"], "id_dispositivo": c["id_dispositivo"],
                             "data_hora": datetime.combine(dia, time(9, 0)).isoformat(),
                             "x_km": round(x + rnd.uniform(-0.3, 0.3), 2), "y_km": round(y + rnd.uniform(-0.3, 0.3), 2),
                             "posicao_valida": valida, "bateria_pct": bateria,
                             "rssi_dbm": rnd.randint(-92, -55)})
            dia += timedelta(days=7)
        sorteio = rnd.random()
        meio = saida + (fim - saida) / 2
        if sorteio < 0.3:
            eventos.append(_evento(c, meio, "retirada_autorizada"))
            eventos.append(_evento(c, meio + timedelta(days=1), "reaplicacao"))
        elif sorteio < 0.4:
            eventos.append(_evento(c, meio, "violacao"))
    return leituras, eventos


def _evento(c, dia, tipo):
    return {"id_ciclo": c["id_ciclo"], "id_dispositivo": c["id_dispositivo"],
            "data_hora": datetime.combine(dia, time(14, 30)).isoformat(), "tipo": tipo}


def gerar(semente=SEMENTE):
    rnd = random.Random(semente)
    fornecedores = _fornecedores(rnd)
    equipamentos = _equipamentos(rnd)
    ciclos = _ciclos(rnd, equipamentos, fornecedores)
    leituras, eventos = _leituras_e_lacre(rnd, ciclos, fornecedores)
    if not any(e["tipo"] == "violacao" for e in eventos):
        eventos.append(_evento(ciclos[0], date.fromisoformat(ciclos[0]["data_saida"]) + timedelta(days=3), "violacao"))
    if not any(e["tipo"] == "retirada_autorizada" for e in eventos):
        base = date.fromisoformat(ciclos[1]["data_saida"]) + timedelta(days=4)
        eventos += [_evento(ciclos[1], base, "retirada_autorizada"),
                    _evento(ciclos[1], base + timedelta(days=1), "reaplicacao")]
    return {"equipamentos": equipamentos, "fornecedores": fornecedores, "ciclos": ciclos,
            "leituras": leituras, "eventos_lacre": eventos}


def gravar(tabelas, pasta):
    os.makedirs(pasta, exist_ok=True)
    for nome, linhas in tabelas.items():
        with open(os.path.join(pasta, nome + ".csv"), "w", encoding="utf-8", newline="") as fh:
            escritor = csv.DictWriter(fh, fieldnames=COLUNAS[nome], lineterminator="\n")
            escritor.writeheader()
            escritor.writerows(linhas)


if __name__ == "__main__":
    gravar(gerar(), os.path.join(RAIZ, "dados"))
