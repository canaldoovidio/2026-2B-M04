// Aula 09: disparo remoto de atuador com confirmação humana.
// O rastreador publica um alerta (permanência acima de 150 dias ou violação do
// lacre). A central assina o alerta, arma o relé e espera uma confirmação
// humana num segundo tópico. Sem confirmação em 30 s, desarma sozinha.
// Neste laboratório o mesmo ESP32 faz os dois papéis, rastreador e central,
// e a mensagem passa de verdade pelo broker. A carga é um LED: nenhuma
// montagem desta aula usa tensão de rede.
#include <WiFi.h>
#include <PubSubClient.h>

// Troque dupla00 pelo código da sua dupla: o broker é público e compartilhado.
#define PREFIXO "cerradinho/dupla00/DV-01/"
const char* TOPICO_ALERTA = PREFIXO "alerta";
const char* TOPICO_CONFIRMACAO = PREFIXO "confirmacao";
const char* TOPICO_ESTADO = PREFIXO "estado";
const char* BROKER = "broker.hivemq.com";    // P7: broker de sala ainda não definido
const int PORTA = 1883;

const int PINO_LACRE = 4;                    // botão até o GND, com pull-up interno
const int PINO_RELE = 26;                    // entrada IN do módulo relé
const int PINO_ARMADO = 27;                  // LED amarelo: aguardando confirmação
const int RELE_LIGADO = HIGH;                // relé "npn" do Wokwi: HIGH liga COM ao NO
const int RELE_DESLIGADO = LOW;

const int LIMIAR_DIAS = 150;                 // referência inicial do TAPI, configurável
const int DIAS_FORA_INICIAL = 140;           // ciclo fictício, perto do limiar
const unsigned long MS_POR_DIA = 1000;       // relógio acelerado: 1 s = 1 dia
const unsigned long JANELA_CONFIRMACAO_MS = 30000;
const unsigned long JANELA_DEBOUNCE_MS = 20;
const unsigned long INTERVALO_CONEXAO_MS = 2000;

enum Estado { MONITORANDO, ARMADO, DISPARADO };
Estado estado = MONITORANDO;

WiFiClient rede;
PubSubClient mqtt(rede);

int diasFora = DIAS_FORA_INICIAL;
unsigned long ultimoDiaMs = 0;
bool alertaPermanenciaEnviado = false;
unsigned long proximoId;                     // sorteado no setup: não repete entre boots
unsigned long idArmado = 0;
unsigned long armadoDesdeMs = 0;
unsigned long ultimaTentativaMs = 0;

int leituraAnterior = HIGH;
int lacreEstavel = HIGH;
unsigned long ultimaMudancaMs = 0;

void publicarEstado(const char* texto) {
  mqtt.publish(TOPICO_ESTADO, texto);
  Serial.print("Estado: ");
  Serial.println(texto);
}

void publicarAlerta(const char* motivo) {
  char mensagem[96];
  snprintf(mensagem, sizeof(mensagem), "{\"id\":%lu,\"motivo\":\"%s\",\"dias_fora\":%d}",
           proximoId++, motivo, diasFora);
  mqtt.publish(TOPICO_ALERTA, mensagem, false);  // sem retain
  Serial.print("Rastreador publicou: ");
  Serial.println(mensagem);
}

void voltarAMonitorar(const char* motivo) {
  estado = MONITORANDO;
  digitalWrite(PINO_RELE, RELE_DESLIGADO);
  digitalWrite(PINO_ARMADO, LOW);
  mqtt.unsubscribe(TOPICO_CONFIRMACAO);
  publicarEstado(motivo);
}

void tratarAlerta(const String& texto) {
  if (estado != MONITORANDO) return;         // já há um alerta em tratamento
  int posicao = texto.indexOf("\"id\":");
  if (posicao < 0) return;
  idArmado = texto.substring(posicao + 5).toInt();
  armadoDesdeMs = millis();
  estado = ARMADO;
  digitalWrite(PINO_ARMADO, HIGH);
  mqtt.subscribe(TOPICO_CONFIRMACAO);        // só escuta confirmação depois de armar
  char aviso[96];
  snprintf(aviso, sizeof(aviso), "armado: publique CONFIRMAR %lu em até 30 s", idArmado);
  publicarEstado(aviso);
}

void tratarConfirmacao(const String& texto) {
  if (texto == "DESLIGAR") {
    if (estado == DISPARADO) voltarAMonitorar("desligado pelo operador");
    return;
  }
  bool noPrazo = millis() - armadoDesdeMs < JANELA_CONFIRMACAO_MS;
  if (estado != ARMADO || !noPrazo || texto != "CONFIRMAR " + String(idArmado)) {
    publicarEstado("confirmação ignorada: nenhum alerta armado com esse id no prazo");
    return;
  }
  digitalWrite(PINO_RELE, RELE_LIGADO);
  digitalWrite(PINO_ARMADO, LOW);
  estado = DISPARADO;
  publicarEstado("disparado com confirmação humana");
}

void aoReceber(char* topico, byte* dados, unsigned int tamanho) {
  String texto;
  for (unsigned int i = 0; i < tamanho; i++) texto += (char)dados[i];
  texto.trim();
  Serial.print("Central recebeu [");
  Serial.print(topico);
  Serial.print("] ");
  Serial.println(texto);
  if (strcmp(topico, TOPICO_ALERTA) == 0) tratarAlerta(texto);
  else if (strcmp(topico, TOPICO_CONFIRMACAO) == 0) tratarConfirmacao(texto);
}

void tentarConectar() {                      // uma tentativa a cada 2 s, sem travar o loop
  if (millis() - ultimaTentativaMs < INTERVALO_CONEXAO_MS) return;
  ultimaTentativaMs = millis();
  String id = "rastreador-" + String((uint32_t)esp_random(), HEX);
  Serial.print("Conectando ao broker... ");
  if (mqtt.connect(id.c_str())) {
    Serial.println("ok");
    mqtt.subscribe(TOPICO_ALERTA);
    if (estado != MONITORANDO) mqtt.subscribe(TOPICO_CONFIRMACAO);
    publicarEstado("monitorando");
  } else {
    Serial.println("falhou, nova tentativa em 2 s");
  }
}

void expirarSemConfirmacao() {
  if (estado == ARMADO && millis() - armadoDesdeMs >= JANELA_CONFIRMACAO_MS) {
    voltarAMonitorar("desarmado: a confirmação não chegou em 30 s");  // desarme automático
  }
}

void setup() {
  pinMode(PINO_RELE, OUTPUT);
  digitalWrite(PINO_RELE, RELE_DESLIGADO);   // estado seguro antes de qualquer rede
  pinMode(PINO_LACRE, INPUT_PULLUP);
  pinMode(PINO_ARMADO, OUTPUT);
  Serial.begin(115200);
  proximoId = esp_random() % 900000 + 100000;  // id de 6 dígitos, imprevisível
  WiFi.begin("Wokwi-GUEST", "", 6);
  while (WiFi.status() != WL_CONNECTED) delay(100);
  Serial.println("Wi-Fi conectado");
  mqtt.setServer(BROKER, PORTA);
  mqtt.setCallback(aoReceber);
  ultimoDiaMs = millis();
}

void loop() {
  expirarSemConfirmacao();                     // roda mesmo com o broker fora do ar
  if (!mqtt.connected()) tentarConectar();
  else mqtt.loop();

  if (millis() - ultimoDiaMs >= MS_POR_DIA) {  // passa um dia simulado
    ultimoDiaMs += MS_POR_DIA;
    diasFora++;
    Serial.print("Dias fora: ");
    Serial.println(diasFora);
    if (diasFora > LIMIAR_DIAS && !alertaPermanenciaEnviado) {
      alertaPermanenciaEnviado = true;
      publicarAlerta("permanencia");
    }
  }

  int leitura = digitalRead(PINO_LACRE);       // debounce da Aula 02
  if (leitura != leituraAnterior) {
    ultimaMudancaMs = millis();
    leituraAnterior = leitura;
  }
  if (millis() - ultimaMudancaMs >= JANELA_DEBOUNCE_MS && leitura != lacreEstavel) {
    lacreEstavel = leitura;
    if (lacreEstavel == LOW) publicarAlerta("lacre");
  }
}
