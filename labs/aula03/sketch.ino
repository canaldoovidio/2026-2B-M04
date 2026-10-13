// Aula 03: máquina de estados do ciclo do equipamento, agora no ESP32.
// Quatro botões simulam os eventos do ciclo. O código aceita só a transição
// permitida a partir do estado atual e recusa as outras, avisando na serial.
// Relógio acelerado: 1 dia simulado dura 100 ms, e 150 dias cabem em 15 s.
// Atraso (dias fora acima do prazo) e permanência (dias fora acima do limiar)
// são avaliados separadamente, como o TAPI pede.

enum class Estado { Cadastrado, EmTransito, NoFornecedor, Retornado };
enum class Evento { Saida, Chegada, Retorno, Liberacao };

const int PINO_LED_ATRASO = 25;
const int PINO_LED_PERMANENCIA = 26;
const unsigned long MS_POR_DIA = 100;
const unsigned long JANELA_DEBOUNCE_MS = 20;   // a mesma janela da Aula 02
unsigned int limiarDias = 150;                 // referência inicial do TAPI, configurável

const char* nome(Estado estado) {
  switch (estado) {
    case Estado::Cadastrado:   return "cadastrado";
    case Estado::EmTransito:   return "em trânsito";
    case Estado::NoFornecedor: return "no fornecedor";
    case Estado::Retornado:    return "retornado";
  }
  return "desconhecido";
}

// Devolve true e grava o próximo estado só quando o evento é permitido.
bool transicao(Estado atual, Evento evento, Estado &proximo) {
  switch (atual) {
    case Estado::Cadastrado:
      if (evento == Evento::Saida) { proximo = Estado::EmTransito; return true; }
      break;
    case Estado::EmTransito:
      if (evento == Evento::Chegada) { proximo = Estado::NoFornecedor; return true; }
      break;
    case Estado::NoFornecedor:
      if (evento == Evento::Retorno) { proximo = Estado::Retornado; return true; }
      break;
    case Estado::Retornado:
      if (evento == Evento::Liberacao) { proximo = Estado::Cadastrado; return true; }
      break;
  }
  return false;
}

class Botao {
 public:
  Botao(int pino) : pino(pino) {}
  void iniciar() { pinMode(pino, INPUT_PULLUP); }
  bool apertou() {                             // true uma única vez por aperto
    int leitura = digitalRead(pino);
    if (leitura != anterior) { mudancaMs = millis(); anterior = leitura; }
    if (millis() - mudancaMs >= JANELA_DEBOUNCE_MS && leitura != estavel) {
      estavel = leitura;
      return estavel == LOW;
    }
    return false;
  }
 private:
  int pino;
  int anterior = HIGH;
  int estavel = HIGH;
  unsigned long mudancaMs = 0;
};

class Ciclo {
 public:
  Ciclo(const char* id, unsigned int prazoDias, unsigned int diasFora, Estado estado)
    : id(id), prazoDias(prazoDias), diasFora(diasFora), estado(estado) {}

  void aplicar(Evento evento) {
    Estado proximo;
    if (!transicao(estado, evento, proximo)) {
      Serial.printf("%s: evento recusado no estado %s\n", id, nome(estado));
      return;
    }
    if (proximo == Estado::EmTransito) diasFora = 0;   // nova saída zera a contagem
    estado = proximo;
    relatar();
  }

  bool fora() const { return estado == Estado::EmTransito || estado == Estado::NoFornecedor; }
  bool emAtraso() const { return fora() && diasFora > prazoDias; }
  bool acimaDoLimiar() const { return fora() && diasFora > limiarDias; }

  bool passarDia() {                           // true quando algum alerta muda
    if (!fora()) return false;
    bool antes = emAtraso(), antesLimiar = acimaDoLimiar();
    diasFora++;
    return emAtraso() != antes || acimaDoLimiar() != antesLimiar;
  }

  void relatar() const {                       // [instante em ms de tempo simulado]
    Serial.printf("[%lu ms] %s | %s | %u dias fora | prazo %u | atraso: %s | permanência: %s\n",
                  millis(), id, nome(estado), diasFora, prazoDias,
                  emAtraso() ? "sim" : "não", acimaDoLimiar() ? "sim" : "não");
  }

 private:
  const char* id;
  unsigned int prazoDias;
  unsigned int diasFora;
  Estado estado;
};

Botao botoes[] = { Botao(18), Botao(19), Botao(21), Botao(22) };
const Evento EVENTOS[] = { Evento::Saida, Evento::Chegada, Evento::Retorno, Evento::Liberacao };

// Os três ciclos abertos de dados/ciclos.csv, como estavam em 01/10/2026.
Ciclo abertos[] = {
  Ciclo("CI-003", 60, 190, Estado::NoFornecedor),
  Ciclo("CI-009", 30, 70, Estado::NoFornecedor),
  Ciclo("CI-015", 45, 12, Estado::NoFornecedor),
};
// Ciclo ao vivo, comandado pelos botões, com o prazo de 30 dias do CI-009.
Ciclo aoVivo("CI-LAB", 30, 0, Estado::Cadastrado);
unsigned long ultimoDiaMs = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PINO_LED_ATRASO, OUTPUT);
  pinMode(PINO_LED_PERMANENCIA, OUTPUT);
  for (Botao &botao : botoes) botao.iniciar();
  Serial.printf("Ciclos abertos em 01/10/2026, limiar de %u dias:\n", limiarDias);
  for (const Ciclo &ciclo : abertos) ciclo.relatar();
  Serial.println("Ciclo ao vivo: saída (18), chegada (19), retorno (21), liberação (22).");
  aoVivo.relatar();
}

void loop() {
  for (int i = 0; i < 4; i++) {
    if (botoes[i].apertou()) aoVivo.aplicar(EVENTOS[i]);
  }
  if (millis() - ultimoDiaMs >= MS_POR_DIA) {
    ultimoDiaMs += MS_POR_DIA;
    if (aoVivo.passarDia()) aoVivo.relatar();
  }
  digitalWrite(PINO_LED_ATRASO, aoVivo.emAtraso() ? HIGH : LOW);
  digitalWrite(PINO_LED_PERMANENCIA, aoVivo.acimaDoLimiar() ? HIGH : LOW);
}
