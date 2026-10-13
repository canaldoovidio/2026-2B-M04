# ADR-009: Painel MQTT no navegador enquanto a P7 está aberta

**Data:** 13/10/2026
**Status:** Aceita
**Decisores:** Prof. José Romualdo, para as aulas do Prof. Ovidio Lopes da Cruz Netto

## Contexto

A Aula 08 deixa pronto "RSSI em dBm publicado e acompanhado num dashboard, com a última comunicação
visível", e a ponderada da semana 07 cobra "reação visível na plataforma online" com gráfico
contínuo de tempo por dBm. A plataforma da sala não está definida entre Ubidots, Adafruit IO e
Raspberry Pi local (pendência P7). Sem plataforma, o laboratório publicaria num broker sem ninguém
para desenhar o gráfico.

## Decisão

O acervo ganha uma página estática, `labs/aula08-painel.html`, que assina por MQTT sobre WebSocket
seguro (`wss://broker.hivemq.com:8884/mqtt`, biblioteca mqtt.js 5.10.1 pelo jsDelivr) o mesmo
tópico que o sketch da Aula 08 publica em `broker.hivemq.com:1883`, e que lê `dados/` para a tabela
de última comunicação dos ciclos abertos.

## Motivações

1. O GitHub Pages serve a página sem servidor próprio, e o Wokwi alcança o broker público pelo
   gateway, então o mesmo caminho funciona no simulador e na bancada.
2. A lógica do painel fica testável sem rede: `?offline=1` desliga a conexão e os testes injetam
   mensagens por `PainelRssi.receber`.
3. O último desejo do MQTT mostra o rastreador sumindo dentro do elevador sem código extra no ESP32.

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| A rede da sala bloqueia a porta 8884 ou a 1883 | nota do professor manda conferir antes da aula; o Wokwi sai pelo próprio gateway |
| Broker público: qualquer pessoa lê e publica no tópico | a página e o laboratório mandam publicar só o RSSI; segurança e TLS são a Aula 11 |
| Tópicos de duplas colidem | o tópico leva `ID_DUPLA`, que cada dupla troca |
| A P7 é respondida com outra plataforma | trocar `BROKER` no sketch; o painel deixa de ser necessário para a ponderada e continua como exemplo |

## Consequências

**Positivas:** a aula tem um painel funcional desde já, com o mesmo contrato de tópico e JSON que
uma plataforma de sala vai consumir.

**Negativas:** uma dependência externa de JavaScript (mqtt.js) e um broker de terceiros sem
garantia de disponibilidade.

## ADRs relacionadas

ADR-005 (animações em JavaScript puro, sem build), ADR-006 (conjunto de dados fictício).
