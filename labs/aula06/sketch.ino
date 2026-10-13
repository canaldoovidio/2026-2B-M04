// Aula 06: o rastreador da Cerradinho publica o evento do ciclo em JSON por MQTT.
// Wi-Fi do Wokwi (Wokwi-GUEST, canal 6) e broker público broker.hivemq.com,
// porta 1883 (P7: o broker de sala ainda não está definido). O broker público é
// compartilhado: só dados fictícios, nunca dado real da Cerradinho.
// Tópicos: cerradinho/<dupla>/dv01/status, .../lacre e .../comando.
// Troque DUPLA pelo número da sua dupla para não misturar com as outras.
#include <WiFi.h>
#include <PubSubClient.h>

const char* DUPLA = "t24d00";
const char* DISPOSITIVO = "dv01";
const char* BROKER = "broker.hivemq.com";
const int PORTA = 1883;

const int PINO_LACRE = 4;          // botão até o GND, com pull-up interno
const int PINO_LED = 2;            // LED de status
const int PINO_BATERIA = 34;       // potenciômetro no lugar do divisor da Aula 05
const unsigned long JANELA_DEBOUNCE_MS = 20;
const unsigned long INTERVALO_STATUS_MS = 10000;  // a "semana" do TAPI, acelerada para 10 s

// Ciclo aberto fictício de dados/ciclos.csv: EQ-01 está com o DV-01 desde
// 25/03/2026, 190 dias fora na data de referência 01/10/2026.
const char* CICLO = "CI-003";
const char* EQUIPAMENTO = "EQ-01";
const int DIAS_FORA = 190;

WiFiClient rede;
PubSubClient mqtt(rede);

char topico[48];
char payload[160];
unsigned long sequencia = 0;
unsigned long ultimoStatusMs = 0;
unsigned long ultimaTentativaMs = 0;
bool tentouAntes = false;          // a primeira tentativa não espera os 5 s
int trocasPendentes = 0;           // comando piscar: 5 piscadas = 10 trocas do LED
unsigned long ultimaTrocaMs = 0;
unsigned long naoEnviados = 0;
int leituraAnterior = HIGH;
int estadoEstavel = HIGH;
unsigned long ultimaMudancaMs = 0;

int bateriaPct() {
  // Simplificação: o potenciômetro vai de 0 a 4095 no ADC de 12 bits.
  return map(analogRead(PINO_BATERIA), 0, 4095, 0, 100);
}

bool publicarEvento(const char* tipo, const char* evento) {
  snprintf(topico, sizeof(topico), "cerradinho/%s/%s/%s", DUPLA, DISPOSITIVO, tipo);
  int n = snprintf(payload, sizeof(payload),
    "{\"dispositivo\":\"%s\",\"ciclo\":\"%s\",\"equipamento\":\"%s\","
    "\"evento\":\"%s\",\"dias_fora\":%d,\"bateria_pct\":%d,\"seq\":%lu}",
    DISPOSITIVO, CICLO, EQUIPAMENTO, evento, DIAS_FORA, bateriaPct(), ++sequencia);
  if (n >= (int)sizeof(payload)) {   // snprintf cortou o JSON: não publicar pela metade
    Serial.println("JSON maior que o buffer; evento não publicado");
    return false;
  }
  if (!mqtt.connected() || !mqtt.publish(topico, payload)) {
    naoEnviados++;                   // o desafio guarda e reenvia (buffer da Aula 04)
    Serial.print("Sem conexão; eventos não enviados: ");
    Serial.println(naoEnviados);
    return false;
  }
  Serial.print(topico);
  Serial.print(" <- ");
  Serial.println(payload);
  return true;
}

void aoReceber(char* topicoRecebido, byte* dados, unsigned int tamanho) {
  // Comando "piscar": ajuda a achar o equipamento certo dentro da oficina.
  // O pisca roda no loop com millis(), sem bloquear: o lacre continua sendo lido.
  if (tamanho == 6 && strncmp((const char*)dados, "piscar", 6) == 0) {
    trocasPendentes = 10;
    ultimaTrocaMs = millis();
    publicarEvento("status", "localizar");
  }
}

void conectarMqtt() {
  if (mqtt.connected() || (tentouAntes && millis() - ultimaTentativaMs < 5000)) return;
  tentouAntes = true;
  ultimaTentativaMs = millis();      // reconexão sem travar o loop
  String id = String("m04-") + DUPLA + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  if (mqtt.connect(id.c_str())) {
    snprintf(topico, sizeof(topico), "cerradinho/%s/%s/comando", DUPLA, DISPOSITIVO);
    mqtt.subscribe(topico);
    Serial.println("MQTT conectado ao broker");
    publicarEvento("status", "conectado");
  } else {
    Serial.print("MQTT falhou, estado ");
    Serial.println(mqtt.state());
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PINO_LACRE, INPUT_PULLUP);
  pinMode(PINO_LED, OUTPUT);
  WiFi.begin("Wokwi-GUEST", "", 6);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
  }
  Serial.println(" conectado");
  // Não há reconexão de Wi-Fi depois daqui: se a rede cair, o MQTT não volta e
  // os eventos contam como não enviados. O desafio do laboratório trata disso.
  mqtt.setServer(BROKER, PORTA);
  mqtt.setCallback(aoReceber);
}

void loop() {
  conectarMqtt();
  mqtt.loop();

  int leitura = digitalRead(PINO_LACRE);   // debounce da Aula 02
  if (leitura != leituraAnterior) {
    ultimaMudancaMs = millis();
    leituraAnterior = leitura;
  }
  if (millis() - ultimaMudancaMs >= JANELA_DEBOUNCE_MS && leitura != estadoEstavel) {
    estadoEstavel = leitura;
    if (estadoEstavel == LOW) publicarEvento("lacre", "violacao");  // fora da rotina, como o TAPI pede
  }

  if (trocasPendentes > 0 && millis() - ultimaTrocaMs >= 150) {
    ultimaTrocaMs = millis();
    digitalWrite(PINO_LED, trocasPendentes % 2 == 0 ? HIGH : LOW);
    trocasPendentes--;
  }

  if (millis() - ultimoStatusMs >= INTERVALO_STATUS_MS) {
    ultimoStatusMs = millis();
    publicarEvento("status", "rotina");
  }
}
