// Testes da lógica pura do rastreador, rodando no computador.
// Compilar e rodar a partir da pasta do laboratório:
//   g++ -std=c++17 -Wall testes/teste_rastreador.cpp -o teste && ./teste
// No macOS, troque g++ por clang++. Saída diferente de zero indica falha.
#include <cmath>
#include <cstdio>
#include "../rastreador.h"

static int verificacoes = 0;
static int falhas = 0;

#define VERIFICA(condicao)                                                   \
  do {                                                                       \
    verificacoes++;                                                          \
    if (!(condicao)) {                                                       \
      falhas++;                                                              \
      std::printf("FALHOU na linha %d: %s\n", __LINE__, #condicao);          \
    }                                                                        \
  } while (0)

static void testeEstadosNasFronteiras() {
  // Prazo de 30 dias e limiar de 150: os valores que importam são as bordas.
  VERIFICA(estadoDoCiclo(0, 30, 150, false) == NO_PRAZO);
  VERIFICA(estadoDoCiclo(30, 30, 150, false) == NO_PRAZO);      // no dia do prazo ainda está no prazo
  VERIFICA(estadoDoCiclo(31, 30, 150, false) == ATRASADO);
  VERIFICA(estadoDoCiclo(149, 30, 150, false) == ATRASADO);
  VERIFICA(estadoDoCiclo(150, 30, 150, false) == ATRASADO);     // 150 exatos: ainda não passou do limiar
  VERIFICA(estadoDoCiclo(151, 30, 150, false) == PERMANENCIA_LONGA);  // passou do limiar
  VERIFICA(estadoDoCiclo(190, 30, 150, false) == PERMANENCIA_LONGA);
  VERIFICA(estadoDoCiclo(190, 30, 150, true) == RETORNADO);      // retorno encerra qualquer estado
  VERIFICA(estadoDoCiclo(60, 30, 60, false) == ATRASADO);       // limiar configurável
  VERIFICA(estadoDoCiclo(61, 30, 60, false) == PERMANENCIA_LONGA);
}

static void testeTransicoesGeramUmAlertaSo() {
  VERIFICA(eventoDaTransicao(NO_PRAZO, ATRASADO) == EV_ALERTA_ATRASO);
  VERIFICA(eventoDaTransicao(ATRASADO, PERMANENCIA_LONGA) == EV_ALERTA_PERMANENCIA);
  VERIFICA(eventoDaTransicao(ATRASADO, ATRASADO) == -1);         // sem repetir o alerta toda semana
  VERIFICA(eventoDaTransicao(ATRASADO, RETORNADO) == EV_RETORNO);
}

static void testeDebounceAceitaUmaMudancaPorRompimento() {
  // Lacre intacto lê LOW; rompido lê HIGH. Quiques em 0, 1, 3, 4 e 6 ms.
  Debounce d = novoDebounce(0, 0);
  int mudancas = 0;
  const int quiques[] = { 1, 0, 1, 0, 1 };
  const uint32_t instantes[] = { 0, 1, 3, 4, 6 };
  for (int i = 0; i < 5; i++) mudancas += atualizarDebounce(d, quiques[i], instantes[i], 20);
  VERIFICA(mudancas == 0);                                       // ainda quicando
  mudancas += atualizarDebounce(d, 1, 25, 20);
  VERIFICA(mudancas == 0);                                       // 19 ms parado: falta 1 ms
  mudancas += atualizarDebounce(d, 1, 26, 20);
  VERIFICA(mudancas == 1);
  VERIFICA(d.estavel == 1);
  mudancas += atualizarDebounce(d, 1, 500, 20);
  VERIFICA(mudancas == 1);                                       // lacre continua rompido: nada novo
}

static void testeFilaGuardaNaOrdemEDescartaOMaisAntigo() {
  FilaEventos f;
  limparFila(f);
  Evento e;
  VERIFICA(!primeiroEvento(f, e));
  for (int semana = 1; semana <= 10; semana++) {
    Evento novo = { (uint16_t)(semana * 7), EV_LEITURA, 90 };
    guardarEvento(f, novo);
  }
  VERIFICA(f.quantidade == CAPACIDADE_FILA);
  VERIFICA(f.perdidos == 2);                                     // 10 eventos numa fila de 8
  VERIFICA(primeiroEvento(f, e) && e.dia == 21);                 // os dias 7 e 14 foram descartados
  descartarPrimeiro(f);
  VERIFICA(primeiroEvento(f, e) && e.dia == 28);
  VERIFICA(f.quantidade == CAPACIDADE_FILA - 1);
}

static void testeBateria() {
  VERIFICA(percentualBateria(4200) == 100);
  VERIFICA(percentualBateria(3750) == 50);
  VERIFICA(percentualBateria(3300) == 0);
  VERIFICA(percentualBateria(5000) == 100);
  VERIFICA(percentualBateria(2000) == 0);
}

static void testeAutonomiaComAsPremissasDaAula() {
  // 100 mA acordado por 10 s, 10 µA dormindo, bateria de exemplo de 2000 mAh.
  const double semana = 7.0 * 24 * 3600;
  VERIFICA(std::fabs(cargaPorSemanaMah(100, 10, 0.010, semana) - 1.9578) < 0.001);
  VERIFICA(std::lround(autonomiaDias(2000, 100, 10, 0.010, semana)) == 7151);
  VERIFICA(std::lround(autonomiaDias(2000, 100, 10, 0.010, 3600)) == 290);
  VERIFICA(std::lround(autonomiaDias(2000, 100, 10, 1.0, semana)) == 83);
}

int main() {
  testeEstadosNasFronteiras();
  testeTransicoesGeramUmAlertaSo();
  testeDebounceAceitaUmaMudancaPorRompimento();
  testeFilaGuardaNaOrdemEDescartaOMaisAntigo();
  testeBateria();
  testeAutonomiaComAsPremissasDaAula();
  std::printf("%d verificações, %d falha(s)\n", verificacoes, falhas);
  return falhas == 0 ? 0 : 1;
}
