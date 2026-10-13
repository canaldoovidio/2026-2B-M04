"""Invariantes do conjunto fictício exigidos pelo TAPI (spec, seção 4)."""
from datetime import date, timedelta

import pytest

from tools import gerar_dados_case as g


@pytest.fixture(scope="module")
def t():
    return g.gerar()


def _d(texto):
    return date.fromisoformat(texto[:10]) if texto else None


def test_entre_dez_e_vinte_equipamentos(t):
    assert 10 <= len(t["equipamentos"]) <= 20


def test_geracao_deterministica():
    assert g.gerar(4042) == g.gerar(4042)
    assert g.gerar(4042) != g.gerar(7)


def test_retorno_nunca_antes_da_saida(t):
    for c in t["ciclos"]:
        if c["data_retorno"]:
            assert _d(c["data_retorno"]) >= _d(c["data_saida"]), c["id_ciclo"]


def _sem_sobreposicao(ciclos, chave):
    por = {}
    for c in ciclos:
        fim = _d(c["data_retorno"]) or g.DATA_REF
        por.setdefault(c[chave], []).append((_d(c["data_saida"]), fim, c["id_ciclo"]))
    for intervalos in por.values():
        intervalos.sort()
        for (_, fim_a, a), (ini_b, _, b) in zip(intervalos, intervalos[1:]):
            assert ini_b > fim_a, (a, b)


def test_dispositivo_nunca_em_dois_ciclos_ao_mesmo_tempo(t):
    _sem_sobreposicao(t["ciclos"], "id_dispositivo")


def test_equipamento_nunca_em_dois_ciclos_ao_mesmo_tempo(t):
    _sem_sobreposicao(t["ciclos"], "id_equipamento")


def test_atraso_e_permanencia_longa_aparecem_separados(t):
    abertos = [c for c in t["ciclos"] if not c["data_retorno"]]
    fora = {c["id_ciclo"]: (g.DATA_REF - _d(c["data_saida"])).days for c in abertos}
    atraso_curto = [c for c in abertos
                    if g.DATA_REF > _d(c["prazo_previsto"]) and fora[c["id_ciclo"]] < g.LIMIAR_DIAS]
    longos = [c for c in abertos if fora[c["id_ciclo"]] >= g.LIMIAR_DIAS]
    no_prazo = [c for c in abertos if g.DATA_REF <= _d(c["prazo_previsto"])]
    assert atraso_curto and longos and no_prazo


def test_leituras_semanais_dentro_do_ciclo(t):
    ciclos = {c["id_ciclo"]: c for c in t["ciclos"]}
    for l in t["leituras"]:
        c = ciclos[l["id_ciclo"]]
        dia = _d(l["data_hora"])
        assert _d(c["data_saida"]) <= dia <= (_d(c["data_retorno"]) or g.DATA_REF)
        assert l["id_dispositivo"] == c["id_dispositivo"]
        assert -95 <= l["rssi_dbm"] <= -30
        assert 0 <= l["bateria_pct"] <= 100


def test_bateria_nao_sobe_dentro_do_ciclo(t):
    por = {}
    for l in t["leituras"]:
        por.setdefault(l["id_ciclo"], []).append((l["data_hora"], l["bateria_pct"]))
    for serie in por.values():
        valores = [b for _, b in sorted(serie)]
        assert valores == sorted(valores, reverse=True)


def test_retirada_autorizada_sempre_seguida_de_reaplicacao(t):
    por = {}
    for e in t["eventos_lacre"]:
        por.setdefault(e["id_ciclo"], []).append((e["data_hora"], e["tipo"]))
    tipos = [e["tipo"] for e in t["eventos_lacre"]]
    assert "violacao" in tipos and "retirada_autorizada" in tipos
    for eventos in por.values():
        seq = [tipo for _, tipo in sorted(eventos)]
        for i, tipo in enumerate(seq):
            if tipo == "retirada_autorizada":
                assert "reaplicacao" in seq[i + 1:]


def test_csv_versionado_bate_com_o_gerador(tmp_path):
    import filecmp, os
    g.gravar(g.gerar(), str(tmp_path))
    raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    for nome in ("equipamentos", "fornecedores", "ciclos", "leituras", "eventos_lacre"):
        assert filecmp.cmp(os.path.join(tmp_path, nome + ".csv"),
                           os.path.join(raiz, "dados", nome + ".csv"), shallow=False), nome
