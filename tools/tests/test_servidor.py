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
