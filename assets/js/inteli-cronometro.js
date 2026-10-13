// Cronometro regressivo das atividades cronometradas do deck. O JS nao
// declara cor nem fonte: a aparencia vem de .cronometro em inteli-theme.css,
// e o estado de tempo esgotado e a classe .esgotado, nao um estilo inline,
// senao tools/check_brand.py acusa cor literal.
//
// Contrato de markup, no deck:
//   <div class="cronometro" data-minutos="4"></div>
// O conteudo interno (botao e display) e construido aqui, para o slide nao
// carregar markup que so o JS entende.
(function () {
  'use strict';

  function formatar(segundos) {
    var m = Math.floor(segundos / 60);
    var s = segundos % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function montar(caixa) {
    var total = Math.round(parseFloat(caixa.dataset.minutos || '5') * 60);
    var restante = total;
    var timer = null;

    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'cronometro-play';
    var icone = document.createElement('span');
    icone.className = 'material-symbols-outlined';
    icone.setAttribute('aria-hidden', 'true');
    icone.textContent = 'play_arrow';
    botao.appendChild(icone);

    var display = document.createElement('p');
    display.className = 'cronometro-tempo mono';
    display.textContent = formatar(restante);

    // aria-live no display, e nao no container: o container so muda de classe,
    // e quem le em voz alta precisa do texto do tempo, nao do widget inteiro.
    display.setAttribute('aria-live', 'polite');

    caixa.appendChild(botao);
    caixa.appendChild(display);

    function parar() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function pintar() {
      display.textContent = formatar(restante);
      botao.setAttribute(
        'aria-label',
        timer ? 'Pausar o cronometro' : 'Iniciar o cronometro'
      );
    }

    function tique() {
      restante = restante - 1;
      if (restante <= 0) {
        restante = 0;
        parar();
        caixa.classList.add('esgotado');
        icone.textContent = 'replay';
      }
      pintar();
    }

    function alternar() {
      // Tempo esgotado: o proximo clique reinicia. Sem isto, o cronometro so
      // volta ao inicio recarregando o deck, no meio da aula.
      if (restante === 0) {
        restante = total;
        caixa.classList.remove('esgotado');
        icone.textContent = 'play_arrow';
        pintar();
        return;
      }
      if (timer) {
        parar();
        icone.textContent = 'play_arrow';
      } else {
        timer = setInterval(tique, 1000);
        icone.textContent = 'pause';
      }
      pintar();
    }

    botao.addEventListener('click', alternar);
    pintar();

    return { alternar: alternar, parar: parar };
  }

  function iniciar() {
    var caixas = document.querySelectorAll('.cronometro');
    for (var i = 0; i < caixas.length; i++) {
      montar(caixas[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
