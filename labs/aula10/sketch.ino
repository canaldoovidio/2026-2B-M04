// Aula 10: ciclo completo do rastreador da Cerradinho, integrado e com deep sleep.
// A cada despertar: lê o lacre com debounce, lê a bateria, avança os dias fora,
// calcula o estado do ciclo, guarda os eventos na fila, publica a fila por MQTT
// quando há rede, mostra o resumo no display e no LED e volta a dormir.
// A lógica pura (estados, debounce, fila, bateria) está em rastreador.h.
// Tempo comprimido: cada despertar vale DIAS_POR_DESPERTAR dias do ciclo.
#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "rastreador.h"

// Cadastro do ciclo CI-009 do conjunto fictício dados/ciclos.csv.
const char* ID_DISPOSITIVO = "DV-02";
const char* ID_EQUIPAMENTO = "EQ-02";
const char* NF_REMESSA = "NF-R-10063";
const int PRAZO_DIAS = 30;
const int LIMIAR_PERMANENCIA_DIAS = 150;   // referência inicial do TAPI, configurável

const int DIAS_POR_DESPERTAR = 7;          // um despertar por semana, como pede o TAPI
const uint64_t SEGUNDOS_DE_SONO = 5;       // 5 s de simulação no lugar de uma semana
#define USAR_DEEP_SLEEP 1                  // 0 troca o deep sleep por delay(), com o mesmo ciclo

const int PINO_LACRE = 27;     // chave deslizante: esquerda = lacre intacto (LOW)
const int PINO_RETORNO = 26;   // chave deslizante: direita = equipamento retornou
const int PINO_REDE = 25;      // chave deslizante: direita = sem conexão
const int PINO_BATERIA = 34;   // ADC1: o ADC2 é compartilhado com o Wi-Fi
const int PINO_LED = 4;        // LED de status
const uint32_t JANELA_DEBOUNCE_MS = 20;

const char* BROKER = "broker.hivemq.com";
const char* TOPICO = "m04-t24/rastreador/DV-02/eventos";

// Memória RTC: sobrevive ao deep sleep e se perde quando a energia é cortada.
RTC_DATA_ATTR bool cadastrado = false;
RTC_DATA_ATTR uint16_t diasFora = 0;
RTC_DATA_ATTR uint32_t despertares = 0;
RTC_DATA_ATTR uint8_t estadoAnterior = NO_PRAZO;
RTC_DATA_ATTR bool lacreRegistrado = false;
RTC_DATA_ATTR uint32_t publicados = 0;
RTC_DATA_ATTR FilaEventos fila;

WiFiClient clienteRede;
PubSubClient mqtt(clienteRede);
LiquidCrystal_I2C lcd(0x27, 16, 2);
unsigned long inicioMs = 0;

// Espera o contato ficar parado pela janela inteira, por até 500 ms.
int lerEstavel(int pino) {
  unsigned long t0 = millis();
  Debounce d = novoDebounce(digitalRead(pino), t0);
  while (millis() - t0 < 500) {
    atualizarDebounce(d, digitalRead(pino), millis(), JANELA_DEBOUNCE_MS);
    if (d.anterior == d.estavel && millis() - d.mudouEmMs >= JANELA_DEBOUNCE_MS) break;
  }
  return d.estavel;
}

bool conectar() {
  WiFi.begin("Wokwi-GUEST", "", 6);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 10000) delay(100);
  if (WiFi.status() != WL_CONNECTED) return false;
  mqtt.setServer(BROKER, 1883);
  String id = String("m04-t24-") + ID_DISPOSITIVO + "-" + String((uint32_t)esp_random(), HEX);
  return mqtt.connect(id.c_str());
}

// Publica do mais antigo ao mais novo; o evento só sai da fila depois de publicado.
void publicarFila(bool lacreRompido) {
  Evento e;
  while (primeiroEvento(fila, e)) {
    char json[200];
    snprintf(json, sizeof(json),
             "{\"dispositivo\":\"%s\",\"equipamento\":\"%s\",\"nf\":\"%s\",\"dia\":%u,"
             "\"evento\":\"%s\",\"bateria\":%u,\"lacre\":\"%s\",\"perdidos\":%u}",
             ID_DISPOSITIVO, ID_EQUIPAMENTO, NF_REMESSA, e.dia, nomeDoEvento(e.tipo),
             e.bateriaPct, lacreRompido ? "rompido" : "intacto", fila.perdidos);
    if (!mqtt.publish(TOPICO, json)) break;
    Serial.println(json);
    descartarPrimeiro(fila);
    publicados++;
  }
}

void mostrar(EstadoCiclo estado, bool lacreRompido, int bateria) {
  const char* curto[] = { "NO PRAZO", "ATRASO", "PERMANENC.", "RETORNO" };
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.printf("D%u %s", diasFora, curto[estado]);
  lcd.setCursor(0, 1);
  lcd.printf("B%d%% F%u L:%s", bateria, fila.quantidade, lacreRompido ? "ROMP" : "OK");
  bool alerta = lacreRompido || estado == ATRASADO || estado == PERMANENCIA_LONGA;
  digitalWrite(PINO_LED, alerta ? HIGH : LOW);
}

void despertar() {
  despertares++;
  Serial.printf("\nDespertar %lu, causa %d\n", (unsigned long)despertares, (int)esp_sleep_get_wakeup_cause());
  int bateria = percentualBateria(analogReadMilliVolts(PINO_BATERIA) * 2);   // divisor 1:2
  bool lacreRompido = lerEstavel(PINO_LACRE) == HIGH;
  bool retornou = lerEstavel(PINO_RETORNO) == HIGH;
  bool semRede = lerEstavel(PINO_REDE) == HIGH;

  if (!cadastrado) {                                   // primeiro despertar: cadastro do ciclo
    limparFila(fila);
    cadastrado = true;
    diasFora = 0;
    estadoAnterior = NO_PRAZO;
    publicados = 0;
    Evento e = { 0, EV_CADASTRO, (uint8_t)bateria };
    guardarEvento(fila, e);
  } else {
    diasFora += DIAS_POR_DESPERTAR;
    Evento e = { diasFora, EV_LEITURA, (uint8_t)bateria };
    guardarEvento(fila, e);
  }

  if (lacreRompido && !lacreRegistrado) {
    Evento e = { diasFora, EV_LACRE, (uint8_t)bateria };
    guardarEvento(fila, e);
  }
  lacreRegistrado = lacreRompido;                      // lacre reaplicado volta a ser vigiado

  EstadoCiclo estado = estadoDoCiclo(diasFora, PRAZO_DIAS, LIMIAR_PERMANENCIA_DIAS, retornou);
  int alerta = eventoDaTransicao((EstadoCiclo)estadoAnterior, estado);
  if (alerta >= 0) {
    Evento e = { diasFora, (uint8_t)alerta, (uint8_t)bateria };
    guardarEvento(fila, e);
  }
  estadoAnterior = estado;

  if (!semRede && conectar()) publicarFila(lacreRompido);
  mostrar(estado, lacreRompido, bateria);
  Serial.printf("dia %u | %s | lacre %s | bateria %d%% | fila %u | publicados %lu | perdidos %u\n",
                diasFora, nomeDoEstado(estado), lacreRompido ? "rompido" : "intacto", bateria,
                fila.quantidade, (unsigned long)publicados, fila.perdidos);
}

void dormir() {
  Serial.printf("Acordado por %lu ms. Dormindo %lu s.\n", millis() - inicioMs, (unsigned long)SEGUNDOS_DE_SONO);
  mqtt.disconnect();
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  bool encerrado = estadoAnterior == RETORNADO;
  if (encerrado) {
    cadastrado = false;                                // dispositivo liberado para outro ciclo
    Serial.println("Ciclo encerrado. Para um novo cadastro, volte a chave de retorno e reinicie.");
  }
#if USAR_DEEP_SLEEP
  if (!encerrado) esp_sleep_enable_timer_wakeup(SEGUNDOS_DE_SONO * 1000000ULL);  // sem timer, só o reset acorda
  Serial.flush();
  esp_deep_sleep_start();
#else
  delay(SEGUNDOS_DE_SONO * 1000);
  while (encerrado) delay(1000);
#endif
}

void setup() {
  inicioMs = millis();
  Serial.begin(115200);
  pinMode(PINO_LACRE, INPUT_PULLUP);
  pinMode(PINO_RETORNO, INPUT_PULLUP);
  pinMode(PINO_REDE, INPUT_PULLUP);
  pinMode(PINO_LED, OUTPUT);
  lcd.init();
  lcd.backlight();
}

void loop() {
  inicioMs = millis();
  despertar();
  dormir();
}
