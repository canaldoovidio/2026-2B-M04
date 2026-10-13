// Aula 01: LED de status do rastreador da Cerradinho.
// O LED pisca para dizer "o dispositivo está vivo". Pino 8, resistor de 220 ohms.
const int PINO_LED = 8;
const unsigned long LIGADO_MS = 200;     // pulso curto economiza energia
const unsigned long DESLIGADO_MS = 1800;

void setup() {
  pinMode(PINO_LED, OUTPUT);
}

void loop() {
  digitalWrite(PINO_LED, HIGH);
  delay(LIGADO_MS);
  digitalWrite(PINO_LED, LOW);
  delay(DESLIGADO_MS);
}
