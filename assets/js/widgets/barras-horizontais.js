// Barras horizontais com rótulo e valor. Widget genérico, usado no fixture do
// tema e disponível para as aulas. JSON: {titulo, unidade, itens: [{rotulo, valor}]}.
(function () {
  'use strict';

  IntelIWidgets.registrar('barras-horizontais', function (elemento, dados, api) {
    var canvas = document.createElement('canvas');
    canvas.width = Number(elemento.dataset.largura || 720);
    canvas.height = Number(elemento.dataset.altura || 360);
    elemento.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var itens = dados.itens;
    var maximo = Math.max.apply(null, itens.map(function (item) { return item.valor; }));
    var esquerda = 120;
    var direita = 150;
    var faixa = (canvas.height - 16) / itens.length;

    ctx.fillStyle = api.cor('--seg-base');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = api.fonte(14, 600);
    ctx.textBaseline = 'middle';
    itens.forEach(function (item, i) {
      var y = 8 + i * faixa;
      var largura = (canvas.width - esquerda - direita) * item.valor / maximo;
      ctx.fillStyle = api.cor('--seg-secundaria');
      ctx.fillRect(esquerda, y + 3, largura, faixa - 6);
      ctx.fillStyle = api.cor('--seg-texto');
      ctx.textAlign = 'right';
      ctx.fillText(item.rotulo, esquerda - 10, y + faixa / 2);
      ctx.textAlign = 'left';
      ctx.fillText(item.valor.toLocaleString('pt-BR') + ' ' + dados.unidade, esquerda + largura + 8, y + faixa / 2);
    });
  });
})();
