"""Ponderada de Segurança em IoT (Aula 11, semana 09): página no molde da Ponderada 1 (ADR-012).

Confere o fluxo do grupo (modelo de ameaça registrado antes do código, lista bruta da IA registrada
sem edição, triagem com linhas do código colado, dois ataques com risco na matriz, tabela da turma e
relatório), o barema contra o PLANO_DE_ENSINO.md e que o código do tutorial não está no repositório.
O código usado nos testes é um texto sintético com linhas numeradas, escrito para o teste.
"""
import csv
import io
import os
import re
import sys

import pytest
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
import check_slides  # noqa: E402

PASTA = os.path.join(RAIZ, "ponderadas", "seguranca-iot")
PAGINA = "ponderadas/seguranca-iot/index.html"


def _ler(*partes):
    with open(os.path.join(*partes), encoding="utf-8") as fh:
        return fh.read()


@pytest.mark.parametrize("nome", ["index.html", "seguranca.js", "seguranca.css"])
def test_sem_travessao_nem_simbolo_de_texto(nome):
    texto = _ler(PASTA, nome)
    assert chr(0x2014) not in texto
    assert chr(0x2713) not in texto


def test_js_e_css_sem_cor_nem_fonte_literal():
    js = _ler(PASTA, "seguranca.js")
    css = _ler(PASTA, "seguranca.css")
    assert not re.search(r"'#[0-9a-fA-F]{3,6}'|rgba?\(", js)
    assert not re.search(r"#[0-9a-fA-F]{3,6}\b|rgba?\(|font-family", css)


def test_ordem_das_folhas_e_scripts():
    html = _ler(PASTA, "index.html")
    assert html.index("assets/css/inteli-brand.css") < html.index("comum/ponderada.css") < html.index("seguranca.css")
    assert html.index("comum/ponderada-base.js") < html.index("seguranca.js")


def test_codigo_do_tutorial_nao_esta_no_repositorio():
    """O código é do autor do tutorial: a página só aponta para ele e recebe a colagem do grupo."""
    for nome in ("index.html", "seguranca.js"):
        texto = _ler(PASTA, nome)
        assert "WiFiServer server(80)" not in texto
        assert "server.available()" not in texto
    assert "randomnerdtutorials.com/esp32-web-server-arduino-ide" in _ler(PASTA, "index.html")


def _barema_do_plano():
    plano = _ler(RAIZ, "PLANO_DE_ENSINO.md")
    secao = plano.split("### 6.4", 1)[1].split("## 7.", 1)[0]
    return re.findall(r"^\| (Contextualizar|Construir|Confrontar|Comprovar) \| (.+?) \| (\d,\d) \|", secao, flags=re.M)


def test_barema_igual_ao_plano():
    itens = _barema_do_plano()
    assert len(itens) == 6
    html = _ler(PASTA, "index.html")
    tabela = html.split('<table class="c5 barema">', 1)[1].split("</table>", 1)[0]
    linhas = re.findall(r"<tr><th>(\w+)</th><td class=\"pts\">(\d,\d)</td><td><b>(.+?):</b>", tabela)
    assert [(e, p) for e, _, p in itens] == [(e, p) for e, p, _ in linhas]
    for (_, item, _), (_, _, rotulo) in zip(itens, linhas):
        assert rotulo.lower() == item.lower()
    assert sum(float(p.replace(",", ".")) for _, _, p in itens) == 10.0


def test_escala_declarada_como_adaptacao_do_acervo():
    html = _ler(PASTA, "index.html")
    assert "adaptação do acervo" in html
    assert "dispositivo do próprio grupo, na rede da sala" in html


# Código sintético, escrito para o teste, com uma linha de HTML que não pode ser executada.
CODIGO = "\n".join(
    ["// sketch de teste, linha %d" % i for i in range(1, 30)]
    + ['<script>window.__injetado = 1</script><img src=x onerror="window.__injetado=2">']
)  # 30 linhas

LISTA = """Possíveis vulnerabilidades em um servidor web no ESP32:

1. Credenciais de Wi-Fi gravadas no código
2. Ausência de autenticação nas rotas que mudam o estado dos pinos
   (qualquer cliente na rede aciona os GPIOs)
3. Injeção de SQL no banco de dados
4. Tráfego HTTP sem cifragem
- Estouro de buffer na leitura do cabeçalho
* Cross-site scripting por parâmetro refletido
"""


@pytest.fixture()
def pagina():
    httpd = check_slides.servir(0)
    erros = []
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pg = navegador.new_page(viewport={"width": 1280, "height": 900}, accept_downloads=True)
        pg.on("pageerror", lambda e: erros.append(str(e)))
        pg.on("console", lambda m: m.type == "error" and erros.append(m.text))
        pg.goto("http://127.0.0.1:%d/%s" % (httpd.server_address[1], PAGINA))
        pg.evaluate("() => document.fonts.ready")
        pg.erros = erros
        yield pg
        navegador.close()
    httpd.shutdown()


def _modelo(pg):
    pg.fill("[name=grupo]", "Grupo 3")
    pg.fill("[name=integrantes]", "Ana\nBeto")
    pg.fill("[name=ctx_atacante]", "colega conectado à rede da sala")
    pg.fill("[name=ctx_objetivo]", "acionar os GPIOs do ESP32")
    pg.select_option("[name=ctx_acesso]", "wifi")
    pg.fill("[name=ctx_acesso_desc]", "mesmo ponto de acesso, vê o IP do ESP32")
    pg.click("#btnLockCtx")


def _lista(pg):
    pg.select_option("[name=con_ferramenta]", "Gemini")
    pg.fill("[name=con_pergunta]", "Quais vulnerabilidades um servidor web local no ESP32 costuma ter?")
    pg.fill("[name=con_lista]", LISTA)
    pg.click("#btnLockCon")


def _triar(pg, n, decisao, linhas, just):
    linha = pg.locator("#triagem tbody tr").nth(n - 1)
    linha.locator(".dec").select_option(decisao)
    linha.locator(".lin").fill(linhas)
    linha.locator(".jus").fill(just)


def test_carrega_sem_erro_de_console(pagina):
    assert pagina.erros == []
    assert pagina.locator("#matriz rect").count() == 9


def test_codigo_colado_aparece_como_texto_e_nao_executa(pagina):
    pg = pagina
    pg.fill("[name=codigo]", CODIGO)
    assert pg.locator("#visor .ln").count() == 30
    assert "<script>" in pg.locator("#visor .ln").nth(29).text_content()
    assert pg.locator("#visor script, #visor img").count() == 0
    assert pg.evaluate("() => window.__injetado") is None
    assert pg.text_content("#codigoInfo").startswith("30 linhas")


def test_codigo_colado_antes_do_modelo_gera_aviso(pagina):
    pg = pagina
    pg.fill("[name=codigo]", CODIGO)
    assert "antes do registro do modelo de ameaça" in pg.text_content("#codigoCheck")


def test_lista_bruta_vira_candidatos(pagina):
    cands = pagina.evaluate("() => { document.querySelector('[name=con_lista]').value = %r; return PonderadaSeguranca.candidatos(); }" % LISTA)
    assert len(cands) == 6
    assert cands[1].startswith("Ausência de autenticação") and "qualquer cliente" in cands[1]
    assert cands[4] == "Estouro de buffer na leitura do cabeçalho"
    sem_marcador = pagina.evaluate("() => { document.querySelector('[name=con_lista]').value = 'a\\n\\nb\\nc'; return PonderadaSeguranca.candidatos(); }")
    assert sem_marcador == ["a", "b", "c"]


def test_sem_lista_bruta_o_confrontar_avisa_zero(pagina):
    assert "o item Confrontar recebe zero" in pagina.text_content("#confCheck")


def test_dois_descartes_exigem_justificativa_e_linha_que_existe(pagina):
    pg = pagina
    _modelo(pg)
    pg.fill("[name=codigo]", CODIGO)
    _lista(pg)
    assert pg.locator("#triagem tbody tr").count() == 6
    _triar(pg, 3, "descarta", "5", "o sketch não acessa banco de dados")
    _triar(pg, 5, "descarta", "99", "a leitura usa String sem buffer fixo")
    texto = pg.text_content("#confCheck")
    assert "1 descarte(s) com justificativa e linha válida; o mínimo é 2" in texto
    assert "a linha 99 não existe no código colado (30 linhas)" in texto
    _triar(pg, 5, "descarta", "10-12", "a leitura usa String sem buffer fixo")
    assert "2 descartes com justificativa e linha que existe no código" in pg.text_content("#confCheck")
    _triar(pg, 6, "descarta", "7", "")
    assert "Candidato 6: descarte sem justificativa recebe zero" in pg.text_content("#confCheck")
    # Linhas citadas ficam destacadas no visor.
    assert pg.locator("#visor .ln.citada").count() == 5
    assert pg.evaluate("(a) => PonderadaSeguranca.parseLinhas(a)", "2, 4-6") == [2, 4, 5, 6]
    assert pg.evaluate("(a) => PonderadaSeguranca.parseLinhas(a)", "linha 2") is None
    assert pg.erros == []


def _ataques(pg):
    _triar(pg, 2, "aplica", "15-18", "a rota muda o pino sem conferir quem pediu")
    _triar(pg, 4, "aplica", "20", "o servidor escuta HTTP sem TLS")
    pg.fill("[name=at1_titulo]", "Acionar GPIO sem autenticação")
    pg.select_option("[name=at1_origem]", index=1)
    pg.fill("[name=at1_linhas]", "15-18")
    pg.fill("[name=at1_passos]", "passo 1\npasso 2")
    pg.select_option("[name=at1_prob]", "3")
    pg.fill("[name=at1_prob_just]", "o atacante já está na mesma rede da sala")
    pg.select_option("[name=at1_imp]", "2")
    pg.fill("[name=at1_imp_just]", "o dispositivo sai do estado esperado")
    pg.fill("[name=at2_titulo]", "Ler o estado dos pinos em texto claro")
    pg.select_option("[name=at2_origem]", index=2)
    pg.fill("[name=at2_linhas]", "20")
    pg.fill("[name=at2_passos]", "passo 1")
    pg.select_option("[name=at2_prob]", "1")
    pg.fill("[name=at2_prob_just]", "exige captura do tráfego")
    pg.select_option("[name=at2_imp]", "1")
    pg.fill("[name=at2_imp_just]", "estado de LED sem dado restrito")


def test_risco_e_posicao_na_matriz(pagina):
    pg = pagina
    _modelo(pg)
    pg.fill("[name=codigo]", CODIGO)
    _lista(pg)
    _ataques(pg)
    assert "6" in pg.text_content("#risco1") and "nível alto" in pg.text_content("#risco1")
    assert "nível baixo" in pg.text_content("#risco2")
    marca = pg.locator('#matriz g.marca[data-ataque="1"]')
    assert marca.get_attribute("data-prob") == "3" and marca.get_attribute("data-imp") == "2"
    # Probabilidade 3 é a terceira coluna e impacto 2 a linha do meio: x = 80 + 2,5 * 90, y = 20 + 1,5 * 90.
    assert float(marca.locator("circle").get_attribute("cx")) == 305
    assert float(marca.locator("circle").get_attribute("cy")) == 155
    # A justificativa do ataque 2 não cita o acesso declarado (mesma rede Wi-Fi): aviso, sem bloqueio.
    texto = pg.text_content("#consCheck")
    assert "Ataque 2: as justificativas não citam o acesso declarado" in texto
    assert "Ataque 1: as justificativas" not in texto
    assert "Dois ataques com títulos diferentes" in texto
    tabela = pg.text_content("#tabelaMd").splitlines()
    assert tabela[2] == "| Grupo 3 | Acionar GPIO sem autenticação | 3 | 2 | 6 |"
    assert tabela[3] == "| Grupo 3 | Ler o estado dos pinos em texto claro | 1 | 1 | 1 |"


def test_alteracao_da_lista_depois_do_registro_vai_para_o_relatorio(pagina):
    pg = pagina
    _modelo(pg)
    _lista(pg)
    pg.fill("[name=con_lista]", LISTA + "7. Item acrescentado depois\n")
    assert "alterada depois do registro" in pg.text_content("#conCheck")
    md = pg.evaluate("() => PonderadaSeguranca.markdown()")
    linha = [l for l in md.splitlines() if l.startswith("**Lista bruta registrada em:**")][0]
    assert "alteração final não registrada" in linha


def test_fluxo_completo_gera_relatorio_e_csv(pagina):
    pg = pagina
    _modelo(pg)
    pg.fill("[name=codigo]", CODIGO)
    _lista(pg)
    _triar(pg, 3, "descarta", "5", "o sketch não acessa banco de dados")
    _triar(pg, 5, "descarta", "10-12", "a leitura usa String sem buffer fixo")
    _triar(pg, 1, "aplica", "3", "SSID e senha no código")
    _triar(pg, 6, "descarta", "25", "a resposta não devolve nada da requisição")
    _ataques(pg)
    pg.fill("[name=comp_contestacao]", "esse atacante não está na rede")
    pg.fill("[name=comp_resposta]", "o modelo declara atacante na mesma rede")
    pg.check("[name=decl]")
    assert "depois do registro do modelo de ameaça" in pg.text_content("#codigoCheck")

    with pg.expect_download() as info:
        pg.click("#btnMd")
    assert pg.locator("#formStatus").is_hidden(), pg.text_content("#formStatus")
    relatorio = _ler(info.value.path())
    assert relatorio.startswith("# Relatório técnico · Visão Geral sobre Segurança em IoT")
    assert chr(0x2014) not in relatorio
    assert "código colado depois do registro do modelo de ameaça" in relatorio
    assert "~~~~text\n" + LISTA.strip() + "\n~~~~" in relatorio
    assert "descartados com justificativa e linha válida: 3" in relatorio
    assert "### Ataque 1: Acionar GPIO sem autenticação" in relatorio
    assert "O grupo não fez o ir além." in relatorio

    with pg.expect_download() as info:
        pg.click("#btnCsv")
    assert info.value.suggested_filename == "tabela-da-turma.csv"
    linhas = list(csv.reader(io.StringIO(_ler(info.value.path()))))
    assert linhas[0] == ["grupo", "titulo_do_ataque", "probabilidade", "impacto", "risco"]
    assert linhas[1] == ["Grupo 3", "Acionar GPIO sem autenticação", "3", "2", "6"]
    assert pg.erros == []


def test_rascunho_restaura_triagem_e_origem_do_ataque(pagina):
    pg = pagina
    _modelo(pg)
    pg.fill("[name=codigo]", CODIGO)
    _lista(pg)
    _ataques(pg)
    pg.wait_for_timeout(500)
    pg.reload()
    assert pg.locator("#triagem tbody tr").nth(1).locator(".dec").input_value() == "aplica"
    assert pg.input_value("[name=at1_origem]").startswith("Ausência de autenticação")
    assert pg.text_content("#lockCtx").startswith("Registrado(a) em")
    assert "6" in pg.text_content("#risco1")


def test_ir_alem_exige_declaracao_de_dispositivo_proprio(pagina):
    pg = pagina
    pg.select_option("[name=alem_ataque]", "1")
    assert "só no ESP32 do próprio grupo" in pg.text_content("#alemCheck")
    pg.fill("[name=alem_evidencias]", "https://exemplo/foto")
    pg.check("[name=alem_proprio]")
    assert "Ir além com ataque escolhido" in pg.text_content("#alemCheck")
