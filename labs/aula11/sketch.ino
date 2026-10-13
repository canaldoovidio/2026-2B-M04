// Aula 11: o rastreador da Cerradinho publica o evento do ciclo por MQTT com TLS
// (porta 8883), entra no broker com usuário e senha e não guarda credencial no
// código. As credenciais ficam em secrets.h, uma aba do projeto no Wokwi que
// nunca vai para o repositório (entra no .gitignore). Sem secrets.h o sketch
// compila com valores de exemplo e avisa na serial.
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

#if __has_include("secrets.h")
#include "secrets.h"
#define CREDENCIAIS_DE_EXEMPLO 0
#else
#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_SENHA ""
#define MQTT_USUARIO "exemplo"
#define MQTT_SENHA "exemplo"
#define CREDENCIAIS_DE_EXEMPLO 1
#endif

const char* MQTT_HOST = "broker.hivemq.com";
const uint16_t MQTT_PORTA_TLS = 8883;
const char* TOPICO = "inteli/m04/t24/dupla00/DV-01/evento";  // troque dupla00
const int PINO_LACRE = 4;    // botão até o GND, com pull-up interno
const int PINO_LED = 2;      // aceso enquanto a sessão TLS com o broker está aberta
const unsigned long JANELA_DEBOUNCE_MS = 20;

// Autoridade raiz da cadeia do certificado de broker.hivemq.com, conferida em
// 13/10/2026: Amazon Root CA 1, de https://www.amazontrust.com/repository/.
// O certificado de uma CA é público e pode ficar no código.
const char* CA_RAIZ = R"PEM(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----
)PEM";

WiFiClientSecure redeSegura;
PubSubClient mqtt(redeSegura);

int leituraAnterior = HIGH;
int estadoEstavel = HIGH;
unsigned long ultimaMudancaMs = 0;
unsigned long violacoes = 0;

void conectarWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_SENHA, 6);       // Wokwi-GUEST fica no canal 6
  Serial.print("Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
  }
  Serial.println(" conectado");
}

void conectarBroker() {
  while (!mqtt.connected()) {
    String id = "m04-dv01-" + String(esp_random(), HEX);
    Serial.print("Broker TLS na porta 8883... ");
    if (mqtt.connect(id.c_str(), MQTT_USUARIO, MQTT_SENHA)) {
      Serial.println("conectado, certificado verificado contra a CA raiz");
    } else {
      Serial.print("falhou, state = ");       // -2: conexão ou handshake TLS falhou
      Serial.println(mqtt.state());           // 4: usuário ou senha recusados
      delay(2000);
    }
  }
}

void publicarEvento(const char* tipo) {
  // Valores fictícios de dados/leituras.csv (CI-003, leitura de 30/09/2026).
  char payload[200];
  snprintf(payload, sizeof(payload),
           "{\"dispositivo\":\"DV-01\",\"ciclo\":\"CI-003\",\"nf\":\"NF-R-10021\","
           "\"evento\":\"%s\",\"x_km\":40.27,\"y_km\":24.71,\"bateria_pct\":43,\"violacoes\":%lu}",
           tipo, violacoes);
  bool ok = mqtt.publish(TOPICO, payload);
  Serial.print(ok ? "Publicado: " : "Falha ao publicar: ");
  Serial.println(payload);
}

void setup() {
  Serial.begin(115200);
  pinMode(PINO_LACRE, INPUT_PULLUP);
  pinMode(PINO_LED, OUTPUT);
  if (CREDENCIAIS_DE_EXEMPLO) {
    Serial.println("Aviso: secrets.h ausente, usando credenciais de exemplo.");
  }
  conectarWiFi();
  redeSegura.setCACert(CA_RAIZ);              // sem isto não há verificação do broker
  mqtt.setServer(MQTT_HOST, MQTT_PORTA_TLS);
  conectarBroker();
  publicarEvento("ligado");
}

void loop() {
  if (!mqtt.connected()) conectarBroker();
  mqtt.loop();
  digitalWrite(PINO_LED, mqtt.connected() ? HIGH : LOW);

  int leitura = digitalRead(PINO_LACRE);      // debounce da Aula 02
  if (leitura != leituraAnterior) {
    ultimaMudancaMs = millis();
    leituraAnterior = leitura;
  }
  bool estavel = millis() - ultimaMudancaMs >= JANELA_DEBOUNCE_MS;
  if (estavel && leitura != estadoEstavel) {
    estadoEstavel = leitura;
    if (estadoEstavel == LOW) {
      violacoes++;
      publicarEvento("violacao_lacre");
    }
  }
}
