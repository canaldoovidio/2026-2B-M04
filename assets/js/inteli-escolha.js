// Escolha de destino: cada item da atividade tem tres destinos possiveis, e o
// professor marca na tela o que a sala respondeu. Difere do inteli-quiz.js em
// um ponto que importa: aqui NAO ha paragrafo de feedback injetado no DOM.
// Sao oito itens no mesmo slide, e oito paragrafos de feedback estourariam a
// altura fixa da section. O comentario da correcao e falado, e esta na tabela
// das notas do professor.
//
// O JS nao declara cor nenhuma: .certa, .errada e .revelada sao estilizadas em
// inteli-theme.css, senao tools/check_brand.py acusa cor literal.
//
// Contrato de markup:
//   <div class="escolha">
//     <p class="escolha-item">1. Chave de API do parceiro</p>
//     <ul class="escolha-opcoes">
//       <li>Repositorio</li>
//       <li>Drive restrito</li>
//       <li data-correct="true">Nenhum dos dois</li>
//     </ul>
//   </div>
(function () {
  'use strict';

  function responder(escolha, opcao) {
    if (escolha.dataset.respondido === 'sim') return;
    escolha.dataset.respondido = 'sim';

    var certa = opcao.dataset.correct === 'true';
    opcao.classList.add(certa ? 'certa' : 'errada');

    if (!certa) {
      // querySelectorAll, nao querySelector: um item pode ter mais de um
      // destino aceitavel (a foto do time depende de consentimento), e revelar
      // so o primeiro ensinaria uma regra que o proprio bloco desmente.
      var gabarito = escolha.querySelectorAll('[data-correct="true"]');
      for (var k = 0; k < gabarito.length; k++) {
        gabarito[k].classList.add('revelada');
      }
    }
  }

  function ligar() {
    var blocos = document.querySelectorAll('.escolha');
    for (var i = 0; i < blocos.length; i++) {
      (function (escolha) {
        var opcoes = escolha.querySelectorAll('.escolha-opcoes > li');
        for (var j = 0; j < opcoes.length; j++) {
          (function (opcao) {
            opcao.setAttribute('role', 'button');
            opcao.setAttribute('tabindex', '0');
            opcao.addEventListener('click', function () {
              responder(escolha, opcao);
            });
            opcao.addEventListener('keydown', function (evento) {
              if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                responder(escolha, opcao);
              }
            });
          })(opcoes[j]);
        }
      })(blocos[i]);
    }
  }

  window.IntelIEscolha = { responder: responder };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ligar);
  } else {
    ligar();
  }
})();
