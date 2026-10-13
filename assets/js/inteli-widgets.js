// Runtime dos widgets interativos dos decks.
//
// Contrato de markup, no deck:
//   <div class="widget" data-widget="circuito-led"
//        data-fonte="../assets/data/exemplo.json"></div>
//   <script src="../assets/js/inteli-widgets.js"></script>
//   <script src="../assets/js/widgets/circuito-led.js"></script>
//
// Cada arquivo de assets/js/widgets/ chama
//   IntelIWidgets.registrar('nome', function (elemento, dados, api) { ... })
// e a função pode devolver uma Promise. Depois do evento load e das fontes, este
// arquivo carrega o JSON de data-fonte, chama a função e grava data-pronto="sim".
// Falha de carga ou de montagem grava data-pronto="erro" e escreve no console, e
// o tools/check_widgets.py reprova as duas coisas.
//
// Regras para quem escreve um widget:
// - nenhuma cor literal: api.cor('--seg-primaria') lê a custom property do tema,
//   e o tools/check_brand.py continua valendo para o JS;
// - nenhuma família tipográfica literal: api.fonte(16, 600) monta o ctx.font a
//   partir de --fonte-texto;
// - nenhuma medida de layout para desenhar: slide fora de cena tem display none e
//   mede zero. O canvas usa data-largura e data-altura do markup;
// - coordenada de ponteiro sempre por api.ponto(evento, canvas), porque o Reveal
//   escala o slide com transform.
(function () {
  'use strict';

  var registro = {};

  function cor(nome) {
    return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  }

  function fonte(tamanho, peso) {
    var familia = getComputedStyle(document.documentElement).getPropertyValue('--fonte-texto').trim();
    return (peso || 400) + ' ' + tamanho + 'px ' + familia;
  }

  function ponto(evento, canvas) {
    var caixa = canvas.getBoundingClientRect();
    return {
      x: (evento.clientX - caixa.left) * (canvas.width / caixa.width),
      y: (evento.clientY - caixa.top) * (canvas.height / caixa.height)
    };
  }

  function carregar(endereco) {
    if (!endereco) return Promise.resolve(null);
    return fetch(endereco).then(function (resposta) {
      if (!resposta.ok) {
        throw new Error('HTTP ' + resposta.status + ' ao carregar ' + endereco);
      }
      return resposta.json();
    });
  }

  function montar(elemento) {
    var nome = elemento.dataset.widget;
    var funcao = registro[nome];
    if (!funcao) {
      elemento.dataset.pronto = 'erro';
      console.error('widget sem registro: ' + nome);
      return Promise.resolve();
    }
    return carregar(elemento.dataset.fonte)
      .then(function (dados) {
        return funcao(elemento, dados, { cor: cor, fonte: fonte, ponto: ponto });
      })
      .then(function () {
        elemento.dataset.pronto = 'sim';
      })
      .catch(function (erro) {
        elemento.dataset.pronto = 'erro';
        console.error('widget ' + nome + ': ' + (erro && erro.message ? erro.message : erro));
      });
  }

  function iniciar() {
    var elementos = document.querySelectorAll('[data-widget]');
    return Promise.all(Array.prototype.map.call(elementos, montar));
  }

  window.IntelIWidgets = {
    registrar: function (nome, funcao) { registro[nome] = funcao; },
    cor: cor,
    fonte: fonte,
    ponto: ponto,
    iniciar: iniciar
  };

  // load, e não DOMContentLoaded: os scripts de assets/js/widgets/ vêm depois
  // deste e precisam ter se registrado antes da montagem. document.fonts.ready
  // evita desenhar texto de canvas com a fonte de reserva.
  function aguardarFontes() {
    return document.fonts ? document.fonts.ready : Promise.resolve();
  }
  if (document.readyState === 'complete') {
    aguardarFontes().then(iniciar);
  } else {
    window.addEventListener('load', function () { aguardarFontes().then(iniciar); });
  }
})();
