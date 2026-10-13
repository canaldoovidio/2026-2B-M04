// Exemplo para a etapa Confrontar: testes no formato que assistentes de IA
// costumam devolver quando recebem o pedido "escreva testes para rastreador.h".
// Escritos para a aula como exemplo; nenhum veio de uma resposta real. Todos passam.
// A tarefa é descobrir quais deles continuariam passando com o código errado.
#include <cassert>
#include <cstdio>
#include "../rastreador.h"

// Teste 1: chama a função e imprime o resultado.
void testeEstadoFunciona() {
  EstadoCiclo e = estadoDoCiclo(160, 30, 150, false);
  std::printf("estado com 160 dias: %s\n", nomeDoEstado(e));
}

// Teste 2: compara a função com ela mesma.
void testeEstadoConsistente() {
  assert(estadoDoCiclo(100, 30, 150, false) == estadoDoCiclo(100, 30, 150, false));
}

// Teste 3: recalcula o esperado com a mesma regra da implementação,
// em passos de 20 dias que pulam o 150.
void testeEstadoCobreVariosDias() {
  for (int dias = 0; dias <= 300; dias += 20) {
    EstadoCiclo esperado = dias > 150 ? PERMANENCIA_LONGA : (dias > 30 ? ATRASADO : NO_PRAZO);
    assert(estadoDoCiclo(dias, 30, 150, false) == esperado);
  }
}

// Teste 4: só valores longe das fronteiras.
void testePermanencia() {
  assert(estadoDoCiclo(10, 30, 150, false) == NO_PRAZO);
  assert(estadoDoCiclo(200, 30, 150, false) == PERMANENCIA_LONGA);
}

// Teste 5: confere só que nada estourou.
void testeFilaNaoQuebra() {
  FilaEventos f;
  limparFila(f);
  for (int i = 0; i < 20; i++) {
    Evento e = { (uint16_t)i, EV_LEITURA, 90 };
    guardarEvento(f, e);
  }
  assert(f.quantidade <= CAPACIDADE_FILA);
}

int main() {
  testeEstadoFunciona();
  testeEstadoConsistente();
  testeEstadoCobreVariosDias();
  testePermanencia();
  testeFilaNaoQuebra();
  std::printf("5 testes executados, todos passaram\n");
  return 0;
}
