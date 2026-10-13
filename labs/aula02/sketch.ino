// Aula 02: lacre do rastreador da Cerradinho modelado como chave.
// Cada aperto do botão representa um rompimento do lacre. O contato quica
// (bounce), então o firmware só aceita a mudança depois de 20 ms estável.
// Na serial: toques brutos lidos no pino e violações confirmadas.
const int PINO_LACRE = 2;                    // botão até o GND, com pull-up interno
const int PINO_LED = 8;                      // LED de status da Aula 01
const int PINO_BUZZER = 9;
const unsigned long JANELA_DEBOUNCE_MS = 20;

int leituraAnterior = HIGH;
int estadoEstavel = HIGH;
unsigned long ultimaMudancaMs = 0;
unsigned long toquesBrutos = 0;
unsigned long violacoes = 0;

void setup() {
  pinMode(PINO_LACRE, INPUT_PULLUP);
  pinMode(PINO_LED, OUTPUT);
  pinMode(PINO_BUZZER, OUTPUT);
  Serial.begin(9600);
  Serial.println("Rastreador pronto. Aperte o botão para simular a violação do lacre.");
}

void loop() {
  int leitura = digitalRead(PINO_LACRE);

  if (leitura != leituraAnterior) {          // o contato mudou, talvez por bounce
    ultimaMudancaMs = millis();
    if (leitura == LOW) toquesBrutos++;
    leituraAnterior = leitura;
  }

  bool estavel = millis() - ultimaMudancaMs >= JANELA_DEBOUNCE_MS;
  if (estavel && leitura != estadoEstavel) { // mudança confirmada
    estadoEstavel = leitura;
    if (estadoEstavel == LOW) {
      violacoes++;
      tone(PINO_BUZZER, 2000, 200);
      Serial.print("Violação ");
      Serial.print(violacoes);
      Serial.print(" | toques brutos até agora: ");
      Serial.println(toquesBrutos);
    }
  }

  digitalWrite(PINO_LED, estadoEstavel == LOW ? HIGH : LOW);
}
