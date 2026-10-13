"""Regressão da flakiness relatada no Task 6: uma conexão TCP aberta e muda
não pode travar a próxima requisição real do servidor de teste.

O Chromium abre conexões especulativas de preconexão que às vezes não chegam
a mandar nenhum byte. Um servidor de uma única thread (socketserver.TCPServer)
aceita essa conexão ociosa e fica preso dentro do readline() dela, porque não
há nada para ler; nenhuma outra requisição é atendida até ela fechar. Isso
apareceu no Chromium como net::ERR_CONNECTION_RESET ou
net::ERR_SOCKET_NOT_CONNECTED num recurso aleatório da página, sem relação
com o conteúdo servido. Ver check_slides.servir().
"""
import os
import socket
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import check_slides  # noqa: E402


def test_conexao_ociosa_nao_trava_a_proxima_requisicao_real():
    porta = check_slides.porta_livre()
    httpd = check_slides.servir(porta)
    # Conexão TCP crua que completa o handshake e não manda nenhum byte, como
    # a preconexão especulativa do Chromium. Um pequeno respiro depois de
    # abri-la dá tempo do servidor aceitar essa conexão primeiro, para o
    # teste reproduzir o travamento de forma determinística, e não por sorte
    # de agendamento de thread.
    ociosa = socket.create_connection(("127.0.0.1", porta), timeout=3)
    try:
        time.sleep(0.2)
        url = "http://127.0.0.1:%d/aulas/_fixture-tema.html" % porta
        with urllib.request.urlopen(url, timeout=3) as resposta:
            assert resposta.status == 200
    finally:
        ociosa.close()
        httpd.shutdown()


def test_rajada_de_conexoes_simultaneas_nao_recebe_reset():
    """Regressão de 13/10/2026: com a fila padrão de 5 conexões pendentes, uma
    rajada como a que o Chromium abre ao carregar um deck recebia
    ConnectionResetError, e o check_widgets reprovava um widget aleatório com
    net::ERR_CONNECTION_RESET em cerca de 1 de 12 execuções."""
    import http.client
    import threading

    from tools import check_slides

    httpd = check_slides.servir(0)
    porta = httpd.server_address[1]
    falhas = []

    def pedir():
        try:
            conexao = http.client.HTTPConnection("127.0.0.1", porta, timeout=5)
            conexao.request("GET", "/assets/js/inteli-widgets.js")
            resposta = conexao.getresponse()
            resposta.read()
            if resposta.status != 200:
                falhas.append(resposta.status)
        except OSError as erro:
            falhas.append(type(erro).__name__)

    try:
        for _ in range(3):
            linhas = [threading.Thread(target=pedir) for _ in range(60)]
            for linha in linhas:
                linha.start()
            for linha in linhas:
                linha.join()
    finally:
        httpd.shutdown()
    assert falhas == [], (len(falhas), sorted(set(map(str, falhas))))
