// Aula 04: buffer circular de eventos do rastreador da Cerradinho.
// O TAPI pede armazenamento de eventos e envio posterior quando falta conexão.
// O botão gera um evento (um rompimento do lacre); a chave deslizante simula a
// conexão. Sem conexão, o evento fica no buffer; quando a conexão volta, os
// eventos saem na ordem em que chegaram. A serial imprime o endereço de cada
// posição para conferir a aritmética de ponteiros.
const int PINO_EVENTO = 4;          // botão até o GND, com pull-up interno
const int PINO_CONEXAO = 18;        // chave: ligada ao GND = conexão disponível
const int PINO_LED_CONEXAO = 23;
const int PINO_LED_CHEIO = 22;
const int CAPACIDADE = 8;
const bool DESCARTAR_MAIS_ANTIGO = true;   // decisão do grupo, registrada em ADR
const unsigned long JANELA_DEBOUNCE_MS = 20;
const unsigned long INTERVALO_ENVIO_MS = 500;

struct Evento {
  uint32_t sequencia;               // número do evento, em ordem de chegada
  uint32_t instanteMs;              // millis() no momento do evento
};

Evento buffer[CAPACIDADE];
Evento *escrita = buffer;           // onde o próximo evento será guardado
Evento *leitura = buffer;           // o evento mais antigo ainda não enviado
int guardados = 0;
uint32_t proximaSequencia = 1;

int nivelAnterior = HIGH;
int estadoEstavel = HIGH;
unsigned long ultimaMudancaMs = 0;
unsigned long ultimoEnvioMs = 0;
bool conectadoAntes = false;

Evento *avancar(Evento *p) {
  p++;                              // anda sizeof(Evento) bytes na memória
  if (p == buffer + CAPACIDADE) {   // passou da última posição: dá a volta
    p = buffer;
  }
  return p;
}

void guardar(unsigned long agora) {
  uint32_t numero = proximaSequencia++;
  if (guardados == CAPACIDADE) {
    if (!DESCARTAR_MAIS_ANTIGO) {
      Serial.printf("Buffer cheio: evento %lu descartado\n", (unsigned long)numero);
      return;
    }
    Serial.printf("Buffer cheio: evento %lu sobrescrito\n", (unsigned long)leitura->sequencia);
    leitura = avancar(leitura);
    guardados--;
  }
  escrita->sequencia = numero;
  escrita->instanteMs = agora;
  Serial.printf("Evento %lu guardado em buffer[%d], endereço %p\n",
                (unsigned long)numero, (int)(escrita - buffer), (void *)escrita);
  escrita = avancar(escrita);
  guardados++;
}

void enviar() {
  Serial.printf("Enviado evento %lu, de buffer[%d] (instante %lu ms)\n",
                (unsigned long)leitura->sequencia, (int)(leitura - buffer),
                (unsigned long)leitura->instanteMs);
  leitura = avancar(leitura);
  guardados--;
}

void setup() {
  pinMode(PINO_EVENTO, INPUT_PULLUP);
  pinMode(PINO_CONEXAO, INPUT_PULLUP);
  pinMode(PINO_LED_CONEXAO, OUTPUT);
  pinMode(PINO_LED_CHEIO, OUTPUT);
  Serial.begin(115200);
  Serial.printf("sizeof(int) = %d, sizeof(Evento) = %d bytes\n", (int)sizeof(int), (int)sizeof(Evento));
  for (int i = 0; i < CAPACIDADE; i++) {
    Serial.printf("buffer[%d] em %p\n", i, (void *)(buffer + i));
  }
  Serial.printf("Memória livre no heap: %lu bytes\n", (unsigned long)ESP.getFreeHeap());
  Serial.println("Rastreador pronto. Botão: evento. Chave: conexão.");
}

void loop() {
  unsigned long agora = millis();

  int nivel = digitalRead(PINO_EVENTO);     // debounce da Aula 02
  if (nivel != nivelAnterior) {
    ultimaMudancaMs = agora;
    nivelAnterior = nivel;
  }
  if (agora - ultimaMudancaMs >= JANELA_DEBOUNCE_MS && nivel != estadoEstavel) {
    estadoEstavel = nivel;
    if (estadoEstavel == LOW) guardar(agora);
  }

  bool conectado = digitalRead(PINO_CONEXAO) == LOW;
  if (conectado != conectadoAntes) {
    Serial.println(conectado ? "Conexão voltou" : "Conexão caiu");
    conectadoAntes = conectado;
  }
  if (conectado && guardados > 0 && agora - ultimoEnvioMs >= INTERVALO_ENVIO_MS) {
    enviar();
    ultimoEnvioMs = agora;
  }

  digitalWrite(PINO_LED_CONEXAO, conectado ? HIGH : LOW);
  digitalWrite(PINO_LED_CHEIO, guardados == CAPACIDADE ? HIGH : LOW);
}
