// rastreador.h: lógica pura do rastreador da Cerradinho (Aula 10).
// Nada aqui depende do Arduino: o mesmo arquivo compila no ESP32, incluído
// pelo sketch.ino, e no computador, incluído por testes/teste_rastreador.cpp.
// Quem lê pino, relógio ou rede é o sketch; aqui só entram números.
#pragma once
#include <stdint.h>

// ---------- Estados do ciclo ----------
enum EstadoCiclo : uint8_t { NO_PRAZO = 0, ATRASADO = 1, PERMANENCIA_LONGA = 2, RETORNADO = 3 };

// O TAPI separa atraso (passou do prazo previsto) de permanência prolongada
// (passou do limiar configurável, com referência inicial de 150 dias).
// Com 150 dias exatos ainda não há alerta: o critério do acervo é "maior que".
inline EstadoCiclo estadoDoCiclo(int diasFora, int prazoDias, int limiarDias, bool retornou) {
  if (retornou) return RETORNADO;
  if (diasFora > limiarDias) return PERMANENCIA_LONGA;
  if (diasFora > prazoDias) return ATRASADO;
  return NO_PRAZO;
}

inline const char* nomeDoEstado(EstadoCiclo e) {
  switch (e) {
    case NO_PRAZO: return "NO_PRAZO";
    case ATRASADO: return "ATRASADO";
    case PERMANENCIA_LONGA: return "PERMANENCIA_LONGA";
    default: return "RETORNADO";
  }
}

// ---------- Debounce com o relógio injetado ----------
// O sketch passa millis(); o teste passa o instante que quiser.
struct Debounce {
  int estavel;          // última leitura aceita
  int anterior;         // última leitura vista, talvez um quique
  uint32_t mudouEmMs;   // instante da última mudança vista
};

inline Debounce novoDebounce(int leitura, uint32_t agoraMs) {
  Debounce d = { leitura, leitura, agoraMs };
  return d;
}

// Devolve true quando aceita uma mudança: o contato ficou parado pela janela inteira.
inline bool atualizarDebounce(Debounce& d, int leitura, uint32_t agoraMs, uint32_t janelaMs) {
  if (leitura != d.anterior) {
    d.anterior = leitura;
    d.mudouEmMs = agoraMs;
  }
  if (agoraMs - d.mudouEmMs >= janelaMs && leitura != d.estavel) {
    d.estavel = leitura;
    return true;
  }
  return false;
}

// ---------- Fila de eventos para envio posterior ----------
enum TipoEvento : uint8_t {
  EV_CADASTRO = 0, EV_LEITURA = 1, EV_LACRE = 2,
  EV_ALERTA_ATRASO = 3, EV_ALERTA_PERMANENCIA = 4, EV_RETORNO = 5
};

inline const char* nomeDoEvento(uint8_t tipo) {
  switch (tipo) {
    case EV_CADASTRO: return "cadastro";
    case EV_LEITURA: return "leitura";
    case EV_LACRE: return "lacre_rompido";
    case EV_ALERTA_ATRASO: return "alerta_atraso";
    case EV_ALERTA_PERMANENCIA: return "alerta_permanencia";
    default: return "retorno";
  }
}

struct Evento {
  uint16_t dia;
  uint8_t tipo;
  uint8_t bateriaPct;
};

const uint8_t CAPACIDADE_FILA = 8;

// Buffer circular da Aula 04. Cheia, a fila descarta o evento mais antigo e
// conta a perda, para o painel mostrar que houve descarte.
struct FilaEventos {
  Evento itens[CAPACIDADE_FILA];
  uint8_t inicio;
  uint8_t quantidade;
  uint16_t perdidos;
};

inline void limparFila(FilaEventos& f) {
  f.inicio = 0;
  f.quantidade = 0;
  f.perdidos = 0;
}

inline void guardarEvento(FilaEventos& f, Evento e) {
  if (f.quantidade == CAPACIDADE_FILA) {
    f.inicio = (f.inicio + 1) % CAPACIDADE_FILA;
    f.quantidade--;
    f.perdidos++;
  }
  f.itens[(f.inicio + f.quantidade) % CAPACIDADE_FILA] = e;
  f.quantidade++;
}

// Copia o evento mais antigo sem tirá-lo da fila: só sai depois de publicado.
inline bool primeiroEvento(const FilaEventos& f, Evento& saida) {
  if (f.quantidade == 0) return false;
  saida = f.itens[f.inicio];
  return true;
}

inline void descartarPrimeiro(FilaEventos& f) {
  if (f.quantidade == 0) return;
  f.inicio = (f.inicio + 1) % CAPACIDADE_FILA;
  f.quantidade--;
}

// Evento de alerta que a mudança de estado gera, ou -1 se não gera nenhum.
inline int eventoDaTransicao(EstadoCiclo antes, EstadoCiclo depois) {
  if (antes == depois) return -1;
  if (depois == ATRASADO) return EV_ALERTA_ATRASO;
  if (depois == PERMANENCIA_LONGA) return EV_ALERTA_PERMANENCIA;
  if (depois == RETORNADO) return EV_RETORNO;
  return -1;
}

// ---------- Bateria ----------
// Premissa simplificada para uma célula de íon-lítio: 4200 mV cheia, 3300 mV
// tratada como vazia, e reta entre as duas. A curva real não é reta.
const int BATERIA_CHEIA_MV = 4200;
const int BATERIA_VAZIA_MV = 3300;

inline int percentualBateria(int milivolts) {
  if (milivolts >= BATERIA_CHEIA_MV) return 100;
  if (milivolts <= BATERIA_VAZIA_MV) return 0;
  return (milivolts - BATERIA_VAZIA_MV) * 100 / (BATERIA_CHEIA_MV - BATERIA_VAZIA_MV);
}

// ---------- Autonomia estimada ----------
// Carga gasta numa semana, em mAh: despertares acordados mais o resto dormindo.
inline double cargaPorSemanaMah(double correnteAtivaMa, double segundosAcordado,
                                double correnteSonoMa, double intervaloSegundos) {
  const double semana = 7.0 * 24 * 3600;
  double despertares = semana / intervaloSegundos;
  double acordado = correnteAtivaMa * segundosAcordado * despertares;
  double dormindo = correnteSonoMa * (semana - segundosAcordado * despertares);
  return (acordado + dormindo) / 3600.0;
}

inline double autonomiaDias(double capacidadeMah, double correnteAtivaMa, double segundosAcordado,
                            double correnteSonoMa, double intervaloSegundos) {
  return capacidadeMah / cargaPorSemanaMah(correnteAtivaMa, segundosAcordado,
                                           correnteSonoMa, intervaloSegundos) * 7.0;
}
