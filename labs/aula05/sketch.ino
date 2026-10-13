// Aula 05: bateria por divisor resistivo e remoção do equipamento pelo acelerômetro.
// No Wokwi o potenciômetro faz o papel do ponto médio do divisor (o simulador não
// faz simulação analógica completa). O firmware desfaz o divisor e estima a carga.
// O MPU6050 compara a aceleração com a posição de instalação.
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

const int PINO_BATERIA = 34;              // GPIO34 = ADC1_CH6 (datasheet ESP32, tabela de pinos)
const float R1_OHMS = 100000.0;           // da bateria até o pino
const float R2_OHMS = 100000.0;           // do pino até o GND
// Convenção de conta da aula: 3,3 V divididos em 4096 níveis (12 bits). Serve só
// para comparar com a leitura calibrada; a ESP-IDF v4.4 escreve Vout = Dout x
// Vmax / Dmax, com Dmax = 4095 e Vmax dependente da atenuação.
const float VMAX_ADC = 3.3;
const float DMAX_ADC = 4096.0;
const float V_CARGA_COMPLETA = 4.20;      // NCR18650B: carga até 4,20 V
const float V_CORTE = 2.50;               // NCR18650B: corte de descarga em 2,50 V

const float LIMIAR_G = 0.26;              // 2 x sen(7,5°): inclinar 15° da instalação
const int AMOSTRAS_CONFIRMACAO = 3;       // 3 amostras x 500 ms; o RNF-02 pede até 2 s
const unsigned long INTERVALO_MS = 500;

Adafruit_MPU6050 mpu;
unsigned long ultimaAmostraMs = 0;
unsigned long primeiraAcimaMs = 0;        // instante da primeira amostra acima do limiar
int amostrasAcima = 0;
bool removido = false;

int milivoltsNominais(int leitura) {                // convenção da conta, para comparar
  return (int) (leitura * VMAX_ADC * 1000.0 / DMAX_ADC);
}

float tensaoBateria(int milivoltsPino) {             // usa a leitura calibrada
  return milivoltsPino / 1000.0 * (R1_OHMS + R2_OHMS) / R2_OHMS;   // desfaz o divisor
}

int porcentagem(float vBateria) {                    // aproximação linear entre corte e carga
  float p = (vBateria - V_CORTE) / (V_CARGA_COMPLETA - V_CORTE) * 100.0;
  return (int) constrain(p, 0.0, 100.0);
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  if (!mpu.begin()) {
    Serial.println("MPU6050 não encontrado no endereço 0x68. Confira SDA no 21 e SCL no 22.");
    while (true) delay(1000);
  }
  Serial.println("Rastreador pronto: bateria no GPIO34, acelerômetro no I2C.");
}

void loop() {
  if (millis() - ultimaAmostraMs < INTERVALO_MS) return;
  ultimaAmostraMs = millis();

  int leitura = analogRead(PINO_BATERIA);
  int milivoltsPino = analogReadMilliVolts(PINO_BATERIA);   // calibração do chip
  float vBateria = tensaoBateria(milivoltsPino);

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  float ax = a.acceleration.x / SENSORS_GRAVITY_STANDARD;   // m/s² para g
  float ay = a.acceleration.y / SENSORS_GRAVITY_STANDARD;
  float az = a.acceleration.z / SENSORS_GRAVITY_STANDARD;
  // Posição de instalação: equipamento parado e nivelado, (0, 0, 1) g.
  float desvio = sqrt(ax * ax + ay * ay + (az - 1.0) * (az - 1.0));
  float modulo = sqrt(ax * ax + ay * ay + az * az);

  if (desvio > LIMIAR_G) {
    if (amostrasAcima == 0) primeiraAcimaMs = ultimaAmostraMs;
    amostrasAcima++;
  } else {
    amostrasAcima = 0;
  }
  if (!removido && amostrasAcima >= AMOSTRAS_CONFIRMACAO) {
    removido = true;
    // Módulo perto de 1 g: só a gravidade, em outra orientação. Longe de 1 g: aceleração própria.
    const char *tipo = fabs(modulo - 1.0) < 0.1 ? "remoção (orientação mudou)" : "movimento (aceleração própria)";
    Serial.printf("[%lu ms] EVENTO: %s | latência de confirmação %lu ms\n",
                  millis(), tipo, millis() - primeiraAcimaMs);
  }

  Serial.printf("ADC %4d | pino %4d mV (convenção %4d) | bateria %.2f V | %3d%% | a = (%.2f, %.2f, %.2f) g | desvio %.2f g\n",
                leitura, milivoltsPino, milivoltsNominais(leitura), vBateria, porcentagem(vBateria),
                ax, ay, az, desvio);
}
