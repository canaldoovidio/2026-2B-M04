// Aula 08: o rastreador da Cerradinho mede o RSSI em dBm e publica por MQTT.
// A cada INTERVALO_MS: lê WiFi.RSSI(), converte para mW, imprime na serial e
// publica um JSON no tópico PREFIXO_TOPICO/<dupla>/<dispositivo>/rssi.
// O status online/offline fica retido no broker; o offline é o "last will", que
// o broker publica sozinho quando o rastreador some (o elevador da ponderada).
// No Wokwi a rede é a Wokwi-GUEST; na bancada, troque SIMULADOR para 0.
#include <WiFi.h>
#include <PubSubClient.h>
#include <math.h>

#define SIMULADOR 1                            // 1 no Wokwi, 0 na bancada com o ESP32 do kit
const char* REDE_SALA = "nome-da-rede";        // só na bancada; credencial fora do código é tema da Aula 11
const char* SENHA_SALA = "senha-da-rede";

const char* BROKER = "broker.hivemq.com";      // broker público (P7: broker de sala não definido)
const int PORTA = 1883;
const char* PREFIXO_TOPICO = "inteli-m04/t24";
const char* ID_DUPLA = "dupla00";              // troque pelo identificador da sua dupla
const char* ID_DISPOSITIVO = "DV-01";
const unsigned long INTERVALO_MS = 2000;       // decisão humana: na Cerradinho o TAPI pede semanal
const int PINO_LED = 2;                        // aceso enquanto o MQTT está conectado

WiFiClient rede;
PubSubClient mqtt(rede);
char topicoRssi[96];
char topicoStatus[96];
unsigned long ultimoEnvioMs = 0;
unsigned long ultimaTentativaMs = 0;
unsigned long sequencia = 0;

void conectarWiFi() {
#if SIMULADOR
  WiFi.begin("Wokwi-GUEST", "", 6);            // canal 6 pula a busca de redes no Wokwi
#else
  WiFi.begin(REDE_SALA, SENHA_SALA);
#endif
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
  }
  Serial.println(" conectado.");
}

void conectarMqtt() {
  char idCliente[48];
  snprintf(idCliente, sizeof(idCliente), "%s-%s-%04lx", ID_DUPLA, ID_DISPOSITIVO, (unsigned long)(esp_random() & 0xffff));
  // Último desejo: QoS 1 e retido, para o painel saber que o rastreador sumiu.
  if (mqtt.connect(idCliente, topicoStatus, 1, true, "offline")) {
    mqtt.publish(topicoStatus, "online", true);
    Serial.print("MQTT conectado. Publicando em ");
    Serial.println(topicoRssi);
  } else {
    Serial.print("MQTT falhou, estado ");
    Serial.println(mqtt.state());
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PINO_LED, OUTPUT);
  snprintf(topicoRssi, sizeof(topicoRssi), "%s/%s/%s/rssi", PREFIXO_TOPICO, ID_DUPLA, ID_DISPOSITIVO);
  snprintf(topicoStatus, sizeof(topicoStatus), "%s/%s/%s/status", PREFIXO_TOPICO, ID_DUPLA, ID_DISPOSITIVO);
  conectarWiFi();
  mqtt.setServer(BROKER, PORTA);
  mqtt.setKeepAlive(5);                         // o broker declara offline em cerca de 1,5 × 5 s
}

void loop() {
  if (!mqtt.connected() && millis() - ultimaTentativaMs >= 5000) {
    ultimaTentativaMs = millis();
    if (WiFi.status() == WL_CONNECTED) conectarMqtt();
    else Serial.println("Sem Wi-Fi: leitura não enviada.");
  }
  mqtt.loop();
  digitalWrite(PINO_LED, mqtt.connected() ? HIGH : LOW);

  if (millis() - ultimoEnvioMs < INTERVALO_MS) return;
  ultimoEnvioMs = millis();
  if (WiFi.status() != WL_CONNECTED) return;

  long rssi = WiFi.RSSI();                      // dBm da última comunicação com o ponto de acesso
  double miliwatts = pow(10.0, rssi / 10.0);    // dBm = 10 × log10(P / 1 mW)
  sequencia++;
  Serial.printf("RSSI %ld dBm = %.2e mW\n", rssi, miliwatts);

  char json[128];
  snprintf(json, sizeof(json), "{\"dispositivo\":\"%s\",\"seq\":%lu,\"rssi_dbm\":%ld,\"uptime_s\":%lu}",
           ID_DISPOSITIVO, sequencia, rssi, millis() / 1000);
  if (mqtt.connected()) mqtt.publish(topicoRssi, json);
}
