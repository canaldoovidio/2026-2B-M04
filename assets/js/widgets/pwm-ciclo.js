// Animação da Aula 07: ciclo de trabalho do PWM e tensão média.
// Três períodos de uma onda quadrada entre 0 e 3,3 V (nível alto do GPIO do
// ESP32). A tensão média é ciclo × 3,3 V. A barra de luminosidade usa a
// luminosidade CIE 1976 (L* do espaço CIELAB): L* = 116 × Y^(1/3) − 16, com Y
// a fração de luz emitida, tomada aqui igual ao ciclo de trabalho. Ela mostra
// que o brilho percebido cresce mais rápido que o ciclo no começo da escala.
// O botão Pulsar percorre a onda com um ponto. Sem cor literal; desenho só pelo
// viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var X0 = 90, X1 = 690;
  var Y_ALTO = 70, Y_BAIXO = 230;
  var PERIODOS = 3;
  var P = (X1 - X0) / PERIODOS;
  var BARRA_X = 250, BARRA_L = 440;

  function el(nome, atributos, pai) {
    var no = document.createElementNS(NS, nome);
    Object.keys(atributos || {}).forEach(function (k) { no.setAttribute(k, atributos[k]); });
    if (pai) pai.appendChild(no);
    return no;
  }

  function html(tag, classe, conteudo, pai) {
    var no = document.createElement(tag);
    if (classe) no.className = classe;
    if (conteudo) no.textContent = conteudo;
    if (pai) pai.appendChild(no);
    return no;
  }

  function texto(pai, x, y, conteudo, ancora, classe) {
    var t = el('text', { x: x, y: y, 'class': classe || 'anim-rotulo', 'text-anchor': ancora || 'start' }, pai);
    t.textContent = conteudo;
    return t;
  }

  // Luminosidade CIE 1976 para uma fração de luz y entre 0 e 1.
  function luminosidade(y) {
    var d = 6 / 29;
    var f = y > d * d * d ? Math.cbrt(y) : y / (3 * d * d) + 4 / 29;
    return Math.max(0, 116 * f - 16);
  }

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  IntelIWidgets.registrar('pwm-ciclo', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Onda PWM de três períodos entre 0 e 3,3 volts, com a tensão média e barras de ciclo e luminosidade' }, elemento);

    el('line', { x1: X0, y1: Y_BAIXO, x2: X1, y2: Y_BAIXO, style: 'stroke: var(--seg-borda); stroke-width: 1.5' }, svg);
    el('line', { x1: X0, y1: Y_ALTO, x2: X1, y2: Y_ALTO, style: 'stroke: var(--seg-borda); stroke-width: 1.5; stroke-dasharray: 4 5' }, svg);
    texto(svg, X0 - 10, Y_ALTO + 6, '3,3 V', 'end', 'anim-rotulo mono');
    texto(svg, X0 - 10, Y_BAIXO + 6, '0 V', 'end', 'anim-rotulo mono');
    for (var k = 0; k <= PERIODOS; k++) {
      el('line', { x1: X0 + k * P, x2: X0 + k * P, y1: Y_BAIXO, y2: Y_BAIXO + 8, style: 'stroke: var(--seg-texto); stroke-width: 1.5' }, svg);
    }
    texto(svg, X0 + P / 2, Y_BAIXO + 30, '1 período', 'middle');

    var onda = el('path', { 'class': 'pwm-onda', style: 'fill: none; stroke: var(--seg-primaria); stroke-width: 4; stroke-linejoin: miter' }, svg);
    var media = el('line', { x1: X0, x2: X1, style: 'stroke: var(--seg-destaque); stroke-width: 3; stroke-dasharray: 10 6' }, svg);
    var rotuloMedia = texto(svg, X1, 0, '', 'end');
    var ponto = el('circle', { r: 8, style: 'fill: var(--seg-destaque); stroke: var(--seg-base); stroke-width: 3; display: none' }, svg);

    texto(svg, BARRA_X - 14, 318, 'ciclo de trabalho', 'end');
    el('rect', { x: BARRA_X, y: 298, width: BARRA_L, height: 28, style: 'fill: var(--seg-superficie); stroke: var(--seg-borda)' }, svg);
    var barraCiclo = el('rect', { x: BARRA_X, y: 298, height: 28, style: 'fill: var(--seg-primaria)' }, svg);
    texto(svg, BARRA_X - 14, 378, 'luminosidade L*', 'end');
    el('rect', { x: BARRA_X, y: 358, width: BARRA_L, height: 28, style: 'fill: var(--seg-superficie); stroke: var(--seg-borda)' }, svg);
    var barraLum = el('rect', { x: BARRA_X, y: 358, height: 28, style: 'fill: var(--seg-secundaria)' }, svg);
    texto(svg, BARRA_X, 420, '0', 'start', 'anim-rotulo mono');
    texto(svg, BARRA_X + BARRA_L, 420, '100', 'end', 'anim-rotulo mono');

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'PWM e tensão média', painel);
    html('p', null, 'Antes de mexer: com o ciclo em 50%, o LED parece ter metade do brilho que tem em 100%?', painel);
    var leitura = html('p', 'anim-medida mono', '', painel);
    var controle = html('input', null, null, painel);
    controle.type = 'range'; controle.min = '0'; controle.max = '100'; controle.step = '5'; controle.value = '25';
    controle.setAttribute('aria-label', 'Ciclo de trabalho em porcentagem');
    var rotuloLum = html('p', null, '', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    var bPulsar = html('button', null, 'Pulsar', botoes);
    html('p', null, 'Média = ciclo × 3,3 V. L*: luminosidade CIE 1976 (CIELAB).', painel);

    var pulsando = false;
    var inicio = null;
    var fase = 0;

    function ciclo() { return Number(controle.value); }

    function yOnda(fracaoPeriodo) {
      return fracaoPeriodo < ciclo() / 100 ? Y_ALTO : Y_BAIXO;
    }

    function desenhar() {
      var c = ciclo() / 100;
      var pontos = [];
      for (var k = 0; k < PERIODOS; k++) {
        var xs = X0 + k * P;
        var xe = xs + c * P;
        if (c > 0) { pontos.push([xs, Y_ALTO], [xe, Y_ALTO]); }
        if (c < 1) { pontos.push([xe, Y_BAIXO], [xs + P, Y_BAIXO]); }
      }
      onda.setAttribute('d', pontos.map(function (p, i) {
        return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1];
      }).join(' '));
      var centivolts = Math.round(33 * ciclo() / 10);
      var volts = (centivolts / 100).toFixed(2).replace('.', ',');
      var ym = Y_BAIXO - (Y_BAIXO - Y_ALTO) * c;
      media.setAttribute('y1', ym); media.setAttribute('y2', ym);
      rotuloMedia.setAttribute('y', ym - 10);
      rotuloMedia.textContent = 'média ' + volts + ' V';
      barraCiclo.setAttribute('width', (BARRA_L * c).toFixed(1));
      var l = luminosidade(c);
      barraLum.setAttribute('width', (BARRA_L * l / 100).toFixed(1));
      leitura.textContent = ciclo() + '% · média ' + volts + ' V';
      rotuloLum.textContent = 'Brilho percebido: L* = ' + Math.round(l) + ' de 100';
      posicionarPonto();
    }

    function posicionarPonto() {
      ponto.style.display = pulsando ? '' : 'none';
      var x = X0 + fase * (X1 - X0);
      var frac = (fase * PERIODOS) % 1;
      ponto.setAttribute('cx', x.toFixed(1));
      ponto.setAttribute('cy', yOnda(frac));
    }

    function quadro(t) {
      if (!pulsando) return;
      if (visivel(elemento)) {
        if (inicio === null) inicio = t - fase * 3000;
        fase = ((t - inicio) / 3000) % 1;
        posicionarPonto();
      } else {
        inicio = null;
      }
      window.requestAnimationFrame(quadro);
    }

    controle.addEventListener('input', desenhar);
    bPulsar.addEventListener('click', function () {
      pulsando = !pulsando;
      bPulsar.classList.toggle('ativo', pulsando);
      bPulsar.textContent = pulsando ? 'Parar' : 'Pulsar';
      inicio = null;
      posicionarPonto();
      if (pulsando) window.requestAnimationFrame(quadro);
    });
    desenhar();
  });
})();
