// Aula 07: o rastreador da Cerradinho mostra o ciclo num display I2C e
// indica a situação pelo brilho do LED de status, controlado por PWM.
// Barramento I2C: SDA no GPIO 21 e SCL no GPIO 22, com o LCD 16x2 (módulo
// PCF8574) e o acelerômetro MPU6050 da Aula 05. O setup varre o barramento e
// imprime na serial cada endereço que respondeu: é o scanner I2C da aula.
// PWM pela API do core 3.x do ESP32: ledcAttach(pino, frequência, resolução)
// e ledcWrite(pino, ciclo). As funções ledcSetup e ledcAttachPin do core 2.x
// foram removidas.
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

const uint8_t ENDERECO_LCD = 0x27;      // troque pelo endereço sugerido pela IA
const int PINO_LACRE = 4;               // botão até o GND, com pull-up interno
const int PINO_PROXIMO = 19;            // botão até o GND: mostra o próximo ciclo
const int PINO_LED = 2;                 // LED de status com resistor de 220 ohms
const uint32_t PWM_FREQUENCIA_HZ = 5000;
const uint8_t PWM_RESOLUCAO_BITS = 8;   // base 256: 128 / 256 = 50%
const int LIMIAR_PERMANENCIA_DIAS = 150; // referência inicial do TAPI, configurável;
                                         // alerta só acima do limiar: 150 dias exatos não alertam
const unsigned long JANELA_DEBOUNCE_MS = 20;

// Ciclos abertos de dados/ciclos.csv na data de referência 01/10/2026:
// dias fora, prazo combinado em dias e bateria da última leitura semanal
// (dados/leituras.csv). Todos os valores são fictícios (ADR-006).
struct Ciclo {
  const char* id;
  const char* equipamento;
  int diasFora;
  int prazoDias;
  int bateriaPct;
};

const Ciclo CICLOS[] = {
  { "CI-003", "EQ-01", 190, 60, 43 },   // permanência longa
  { "CI-009", "EQ-02", 70, 30, 70 },    // atraso
  { "CI-015", "EQ-03", 12, 45, 96 },    // no prazo
};
const int TOTAL_CICLOS = sizeof(CICLOS) / sizeof(CICLOS[0]);

LiquidCrystal_I2C lcd(ENDERECO_LCD, 16, 2);

int cicloAtual = 0;
bool lacreViolado = false;
bool telaDesatualizada = true;

struct Botao {
  int pino;
  int leituraAnterior;
  int estadoEstavel;
  unsigned long ultimaMudancaMs;
};
Botao botaoLacre = { PINO_LACRE, HIGH, HIGH, 0 };
Botao botaoProximo = { PINO_PROXIMO, HIGH, HIGH, 0 };

// Debounce da Aula 02: devolve true uma vez por aperto confirmado.
bool apertou(Botao& b) {
  int leitura = digitalRead(b.pino);
  if (leitura != b.leituraAnterior) {
    b.ultimaMudancaMs = millis();
    b.leituraAnterior = leitura;
  }
  if (millis() - b.ultimaMudancaMs >= JANELA_DEBOUNCE_MS && leitura != b.estadoEstavel) {
    b.estadoEstavel = leitura;
    return leitura == LOW;
  }
  return false;
}

int varrerBarramento() {
  int encontrados = 0;
  Serial.println("Varredura I2C de 0x08 a 0x77:");
  for (uint8_t endereco = 0x08; endereco <= 0x77; endereco++) {
    Wire.beginTransmission(endereco);
    if (Wire.endTransmission() == 0) {   // 0 = o dispositivo respondeu com ACK
      Serial.printf("  dispositivo em 0x%02X\n", endereco);
      encontrados++;
    }
  }
  Serial.printf("%d dispositivo(s) encontrado(s)\n", encontrados);
  return encontrados;
}

const char* situacao(const Ciclo& c) {
  if (c.diasFora > LIMIAR_PERMANENCIA_DIAS) return "PERM";
  if (c.diasFora > c.prazoDias) return "ATRAS";
  return "PRAZO";
}

// Brilho do LED de status pela situação: quanto mais grave, maior o ciclo.
uint32_t cicloPwm(const Ciclo& c) {
  if (c.diasFora > LIMIAR_PERMANENCIA_DIAS) return 255;  // máximo do 8 bits, 99,6%
  if (c.diasFora > c.prazoDias) return 128;               // 128 / 256 = 50%
  return 64;                                              // 64 / 256 = 25%
}

void desenharTela() {
  const Ciclo& c = CICLOS[cicloAtual];
  char linha[17];                                         // 16 colunas + terminador
  snprintf(linha, sizeof(linha), "%s %3dd %-5s", c.equipamento, c.diasFora, situacao(c));
  lcd.setCursor(0, 0);
  lcd.print(linha);
  snprintf(linha, sizeof(linha), "%-8s Bat%3d%%", lacreViolado ? "VIOLADO!" : "Lacre OK", c.bateriaPct);
  lcd.setCursor(0, 1);
  lcd.print(linha);
  Serial.printf("%s | %s | PWM %lu de 255\n", c.id, situacao(c), (unsigned long)cicloPwm(c));
}

void setup() {
  Serial.begin(115200);
  pinMode(PINO_LACRE, INPUT_PULLUP);
  pinMode(PINO_PROXIMO, INPUT_PULLUP);
  ledcAttach(PINO_LED, PWM_FREQUENCIA_HZ, PWM_RESOLUCAO_BITS);

  Wire.begin();                                           // SDA 21, SCL 22
  varrerBarramento();
  Wire.beginTransmission(ENDERECO_LCD);
  if (Wire.endTransmission() != 0) {
    Serial.printf("Nada respondeu em 0x%02X. Confira o endereço com a varredura acima.\n", ENDERECO_LCD);
  }
  lcd.init();
  lcd.backlight();
}

void loop() {
  if (apertou(botaoProximo)) {
    cicloAtual = (cicloAtual + 1) % TOTAL_CICLOS;
    lacreViolado = false;
    telaDesatualizada = true;
  }
  if (apertou(botaoLacre)) {
    lacreViolado = true;
    telaDesatualizada = true;
  }
  if (telaDesatualizada) {                                // escreve só quando algo mudou
    desenharTela();
    telaDesatualizada = false;
  }

  // Violação: o LED pisca a 2 Hz em brilho máximo, sem delay().
  if (lacreViolado) {
    ledcWrite(PINO_LED, (millis() / 250) % 2 ? 255 : 0);
  } else {
    ledcWrite(PINO_LED, cicloPwm(CICLOS[cicloAtual]));
  }
}
