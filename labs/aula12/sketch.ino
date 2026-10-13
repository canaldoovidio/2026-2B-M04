// Aula 12: demonstração cronometrada do ciclo completo do rastreador da Cerradinho.
// Reproduz o ciclo CI-009 do conjunto fictício (dados/ciclos.csv) com relógio
// acelerado: cada dia simulado dura DIA_SIMULADO_MS. Toda linha da serial com
// número começa pelo rótulo da origem: [configurado], [simulado] (potenciômetro e
// Wi-Fi do Wokwi) ou [medido no simulador]. O tempo t é o tempo simulado. A
// autonomia não é medida aqui: ela é estimativa do relatório, feita a partir do
// consumo medido na bancada.
#include <WiFi.h>
#include <PubSubClient.h>
#include <stdarg.h>

const char* BROKER = "broker.hivemq.com";            // P7: broker de sala não definido
const int PORTA_MQTT = 1883;
const char* TOPICO = "inteli/m04/t24/g00/rastreador"; // troque g00 pelo seu grupo

// Ciclo CI-009 do conjunto fictício: EQ-02 enviado ao FN-05 com o DV-02.
const char* ID_CICLO = "CI-009";
const char* ID_EQUIPAMENTO = "EQ-02";
const char* ID_FORNECEDOR = "FN-05";
const char* ID_DISPOSITIVO = "DV-02";
const char* NF_REMESSA = "NF-R-10063";
const int PRAZO_PREVISTO_DIAS = 30;                 // 23/07 a 22/08 em dados/ciclos.csv
const int LIMIAR_PERMANENCIA_DIAS = 150;            // referência inicial do TAPI
const int INTERVALO_LEITURA_DIAS = 7;               // atualização semanal do TAPI
const unsigned long DIA_SIMULADO_MS = 200;          // relógio acelerado da demonstração
const unsigned long JANELA_DEBOUNCE_MS = 20;        // Aula 02
const unsigned long JANELA_AUTORIZACAO_MS = 10000;  // desafio da Aula 02

const int PINO_CICLO = 26;      // botão: saída e, depois, retorno
const int PINO_LACRE = 14;      // botão: retirada ou rompimento do lacre
const int PINO_AUTORIZAR = 27;  // botão: autoriza a próxima retirada
const int PINO_CONEXAO = 33;    // chave: à direita há conexão, à esquerda não há
const int PINO_BATERIA = 34;    // potenciômetro no lugar do divisor da Aula 05
const int PINO_LED_STATUS = 18;
const int PINO_LED_ALERTA = 19;

struct Botao {
  int pino;
  int leituraAnterior;
  int estadoEstavel;
  unsigned long ultimaMudancaMs;
  unsigned long primeiraBordaMs;  // início do aperto, para medir o tempo de publicação
};

Botao botaoCiclo = {PINO_CICLO, HIGH, HIGH, 0, 0};
Botao botaoLacre = {PINO_LACRE, HIGH, HIGH, 0, 0};
Botao botaoAutorizar = {PINO_AUTORIZAR, HIGH, HIGH, 0, 0};

enum class Estado { VINCULADO, FORA, RETORNADO };
Estado estado = Estado::VINCULADO;

// Fila circular da Aula 04: eventos guardados sem conexão e enviados depois.
const int CAPACIDADE_FILA = 16;
char fila[CAPACIDADE_FILA][240];
unsigned long criadoEmMs[CAPACIDADE_FILA];
int inicioFila = 0;
int tamanhoFila = 0;

WiFiClient rede;
PubSubClient mqtt(rede);
unsigned long ultimaTentativaMs = 0;

unsigned long inicioCicloMs = 0;
int proximaLeituraDia = 0;
bool alertaAtraso = false;
bool alertaPermanencia = false;
bool lacreViolado = false;
bool autorizado = false;
unsigned long autorizadoEmMs = 0;

unsigned long eventos = 0, enviadosNaHora = 0, enviadosDepois = 0, perdidos = 0;
unsigned long violacoes = 0, retiradasAutorizadas = 0, maiorTempoMs = 0;

// Única saída de número na serial: rótulo da origem, depois o texto formatado.
void imprimir(const char* rotulo, const char* formato, ...) {
  char texto[300];
  va_list args;
  va_start(args, formato);
  vsnprintf(texto, sizeof(texto), formato, args);
  va_end(args);
  char linhaPronta[340];
  snprintf(linhaPronta, sizeof(linhaPronta), "%s %s", rotulo, texto);
  Serial.println(linhaPronta);
}

bool apertou(Botao& b) {
  int leitura = digitalRead(b.pino);
  if (leitura != b.leituraAnterior) {
    if (b.leituraAnterior == b.estadoEstavel) b.primeiraBordaMs = millis();
    b.ultimaMudancaMs = millis();
    b.leituraAnterior = leitura;
  }
  if (millis() - b.ultimaMudancaMs >= JANELA_DEBOUNCE_MS && leitura != b.estadoEstavel) {
    b.estadoEstavel = leitura;
    return leitura == LOW;
  }
  return false;
}

int diasFora() {
  if (estado != Estado::FORA) return 0;
  return (millis() - inicioCicloMs) / DIA_SIMULADO_MS;
}

bool conectado() {
  return digitalRead(PINO_CONEXAO) == HIGH && mqtt.connected();
}

void enfileirar(const char* json, unsigned long criadoMs) {
  if (tamanhoFila == CAPACIDADE_FILA) {   // fila cheia: descarta o mais antigo
    inicioFila = (inicioFila + 1) % CAPACIDADE_FILA;
    tamanhoFila--;
    perdidos++;
  }
  int fim = (inicioFila + tamanhoFila) % CAPACIDADE_FILA;
  strncpy(fila[fim], json, sizeof(fila[fim]) - 1);
  fila[fim][sizeof(fila[fim]) - 1] = '\0';
  criadoEmMs[fim] = criadoMs;
  tamanhoFila++;
  imprimir("[medido no simulador]", "  sem conexão: evento guardado, %d de %d na fila",
           tamanhoFila, CAPACIDADE_FILA);
}

void esvaziarFila() {
  while (tamanhoFila > 0 && conectado()) {
    if (!mqtt.publish(TOPICO, fila[inicioFila])) return;
    imprimir("[medido no simulador]", "  publicado depois da reconexão, %lu ms após o evento "
             "(QoS 0, sem confirmação de chegada)", millis() - criadoEmMs[inicioFila]);
    enviadosDepois++;
    inicioFila = (inicioFila + 1) % CAPACIDADE_FILA;
    tamanhoFila--;
  }
}

// doAperto: o evento nasceu de um botão, e o tempo conta do primeiro aperto.
void registrar(const char* tipo, unsigned long criadoMs, bool doAperto) {
  char json[240];
  snprintf(json, sizeof(json),
           "{\"ciclo\":\"%s\",\"dispositivo\":\"%s\",\"evento\":\"%s\",\"t_ms\":%lu,\"dias_fora\":%d,"
           "\"lacre\":\"%s\",\"bateria_adc\":%d,\"rssi_dbm\":%d,\"origem\":\"simulado\"}",
           ID_CICLO, ID_DISPOSITIVO, tipo, millis(), diasFora(), lacreViolado ? "violado" : "integro",
           analogRead(PINO_BATERIA), (int)WiFi.RSSI());
  eventos++;
  imprimir("[simulado]", "t = %lu ms | dia %d | %s", millis(), diasFora(), json);
  if (conectado() && mqtt.publish(TOPICO, json)) {
    unsigned long tempo = millis() - criadoMs;
    if (tempo > maiorTempoMs) maiorTempoMs = tempo;
    enviadosNaHora++;
    imprimir("[medido no simulador]", "  publicado em %lu ms (QoS 0, sem confirmação de chegada)%s",
             tempo, doAperto ? "; conta do primeiro aperto e inclui a janela de debounce" : "");
  } else {
    enfileirar(json, criadoMs);
  }
}

void manterConexao() {
  bool chaveLigada = digitalRead(PINO_CONEXAO) == HIGH;
  if (!chaveLigada) {
    if (mqtt.connected()) {
      mqtt.disconnect();
      Serial.println("Conexão desligada pela chave.");
    }
    return;
  }
  if (WiFi.status() != WL_CONNECTED) return;
  if (!mqtt.connected() && millis() - ultimaTentativaMs > 2000) {
    ultimaTentativaMs = millis();
    String id = String("m04-") + ID_DISPOSITIVO + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (mqtt.connect(id.c_str())) Serial.println("Conectado ao broker.");
  }
  mqtt.loop();
  if (tamanhoFila > 0) esvaziarFila();
}

void imprimirResumo() {
  Serial.println("--- Resumo da demonstração ---");
  imprimir("[configurado]", "prazo %d dias, limiar %d dias (alerta acima dele), leitura a cada %d dias, "
           "dia simulado de %lu ms", PRAZO_PREVISTO_DIAS, LIMIAR_PERMANENCIA_DIAS,
           INTERVALO_LEITURA_DIAS, DIA_SIMULADO_MS);
  imprimir("[medido no simulador]", "eventos: %lu, publicados na hora: %lu, publicados depois: %lu, "
           "perdidos com a fila cheia: %lu", eventos, enviadosNaHora, enviadosDepois, perdidos);
  imprimir("[medido no simulador]", "violações: %lu, retiradas autorizadas: %lu",
           violacoes, retiradasAutorizadas);
  imprimir("[medido no simulador]", "maior tempo até a publicação na hora: %lu ms "
           "(QoS 0, sem confirmação de chegada)", maiorTempoMs);
  Serial.println("Autonomia: estimativa do relatório, a partir do consumo medido na bancada.");
}

void tratarBotaoCiclo() {
  if (estado == Estado::VINCULADO) {
    estado = Estado::FORA;
    inicioCicloMs = millis();
    proximaLeituraDia = INTERVALO_LEITURA_DIAS;
    imprimir("[configurado]", "Saída: %s para %s com a %s", ID_EQUIPAMENTO, ID_FORNECEDOR, NF_REMESSA);
    registrar("saida", botaoCiclo.primeiraBordaMs, true);
  } else if (estado == Estado::FORA) {
    registrar("retorno", botaoCiclo.primeiraBordaMs, true);
    imprimir("[simulado]", "Retorno depois de %d dias simulados.", diasFora());
    estado = Estado::RETORNADO;
    imprimirResumo();
    imprimir("[configurado]", "Dispositivo %s liberado; o histórico do ciclo fica no broker.",
             ID_DISPOSITIVO);
  } else {
    Serial.println("Ciclo encerrado. Um novo vínculo exige novo cadastro.");
  }
}

void tratarLacre() {
  if (estado != Estado::FORA) {
    Serial.println("Lacre ignorado: o equipamento não está fora.");
    return;
  }
  if (autorizado && millis() - autorizadoEmMs <= JANELA_AUTORIZACAO_MS) {
    autorizado = false;
    retiradasAutorizadas++;
    registrar("retirada_autorizada", botaoLacre.primeiraBordaMs, true);
  } else {
    autorizado = false;
    lacreViolado = true;
    violacoes++;
    registrar("violacao", botaoLacre.primeiraBordaMs, true);
  }
}

void acompanharCiclo() {
  if (estado != Estado::FORA) return;
  int dias = diasFora();
  if (dias >= proximaLeituraDia) {
    proximaLeituraDia += INTERVALO_LEITURA_DIAS;
    registrar("leitura_semanal", millis(), false);
  }
  if (dias > PRAZO_PREVISTO_DIAS && !alertaAtraso) {
    alertaAtraso = true;
    registrar("alerta_atraso", millis(), false);
  }
  if (dias > LIMIAR_PERMANENCIA_DIAS && !alertaPermanencia) {   // acima do limiar, como no TAPI
    alertaPermanencia = true;
    registrar("alerta_permanencia", millis(), false);
  }
}

void setup() {
  pinMode(PINO_CICLO, INPUT_PULLUP);
  pinMode(PINO_LACRE, INPUT_PULLUP);
  pinMode(PINO_AUTORIZAR, INPUT_PULLUP);
  pinMode(PINO_CONEXAO, INPUT);
  pinMode(PINO_LED_STATUS, OUTPUT);
  pinMode(PINO_LED_ALERTA, OUTPUT);
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin("Wokwi-GUEST", "", 6);
  mqtt.setServer(BROKER, PORTA_MQTT);
  mqtt.setSocketTimeout(2);   // com o broker fora do ar, connect() espera 2 s, não 15 s
  imprimir("[configurado]", "Rastreador %s vinculado ao %s, ciclo %s", ID_DISPOSITIVO, ID_EQUIPAMENTO,
           ID_CICLO);
  Serial.println("Aperte o botão do ciclo para registrar a saída.");
}

void loop() {
  manterConexao();
  if (apertou(botaoCiclo)) tratarBotaoCiclo();
  if (apertou(botaoAutorizar)) {
    autorizado = true;
    autorizadoEmMs = millis();
    imprimir("[configurado]", "Retirada autorizada pelos próximos %lu s.", JANELA_AUTORIZACAO_MS / 1000);
  }
  if (apertou(botaoLacre)) tratarLacre();
  acompanharCiclo();

  bool piscando = millis() % 2000 < 200;   // LED de status da Aula 01
  digitalWrite(PINO_LED_STATUS, piscando ? HIGH : LOW);
  digitalWrite(PINO_LED_ALERTA, alertaAtraso || alertaPermanencia || lacreViolado ? HIGH : LOW);
}
