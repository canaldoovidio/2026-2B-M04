// Animação da Aula 02: carga de um capacitor por um resistor.
// Curva Vc(t) = Vs (1 - e^(-t/RC)) num eixo fixo de 0 a 10 s, para a curva se
// deslocar quando R ou C mudam. Marca a constante de tempo (63%) e 5 constantes
// (99%). O botão Carregar percorre a curva em tempo real com a leitura do
// voltímetro. Valores de R e C são exemplo: os da ponderada vêm do card do
// encontro. Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var VS = 5;
  var T_MAX = 10;
  var X0 = 70, X1 = 690, Y0 = 380, Y1 = 40;
  var RESISTORES = [1000, 2200, 4700, 10000, 22000, 47000, 100000];
  var CAPACITORES = [10, 22, 47, 100, 220, 470];   // µF

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

  function x(t) { return X0 + (X1 - X0) * t / T_MAX; }
  function y(v) { return Y0 - (Y0 - Y1) * v / VS; }
  function decimal(n, casas) { return n.toFixed(casas).replace('.', ','); }

  function ohms(r) { return r >= 1000 ? decimal(r / 1000, r % 1000 ? 1 : 0) + ' kΩ' : r + ' Ω'; }

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  IntelIWidgets.registrar('carga-rc', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Curva de carga de um capacitor ao longo de 10 segundos, com a constante de tempo marcada' }, elemento);

    el('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    el('line', { x1: X0, y1: Y0, x2: X0, y2: Y1, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    for (var t = 0; t <= T_MAX; t += 2) {
      var rt = el('text', { x: x(t), y: Y0 + 26, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, svg);
      rt.textContent = t + ' s';
    }
    [0, 2.5, 5].forEach(function (v) {
      var rv = el('text', { x: X0 - 10, y: y(v) + 6, 'class': 'anim-rotulo mono', 'text-anchor': 'end' }, svg);
      rv.textContent = decimal(v, v % 1 ? 1 : 0) + ' V';
    });
    el('line', { x1: X0, x2: X1, y1: y(VS), y2: y(VS),
      style: 'stroke: var(--seg-borda); stroke-width: 1.5; stroke-dasharray: 6 5' }, svg);
    var linha63 = el('line', { x1: X0, style: 'stroke: var(--seg-destaque); stroke-width: 1.5; stroke-dasharray: 6 5' }, svg);
    var marcaTau = el('line', { y1: Y0, style: 'stroke: var(--seg-destaque); stroke-width: 1.5; stroke-dasharray: 6 5' }, svg);
    var rotuloTau = el('text', { 'class': 'anim-rotulo', 'text-anchor': 'start' }, svg);
    var marca5 = el('line', { y1: Y0, y2: Y1, style: 'stroke: var(--seg-secundaria); stroke-width: 1.5; stroke-dasharray: 3 4' }, svg);
    var rotulo5 = el('text', { 'class': 'anim-rotulo', 'text-anchor': 'start' }, svg);
    var curva = el('path', { style: 'fill: none; stroke: var(--seg-primaria); stroke-width: 4' }, svg);
    var ponto = el('circle', { r: 9, style: 'fill: var(--seg-destaque); stroke: var(--seg-base); stroke-width: 3' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Constante de tempo τ = R × C', painel);
    html('p', null, 'Antes de mexer: se o capacitor dobrar, em quanto tempo ele chega a 63% da tensão da fonte?', painel);
    var leitura = html('p', 'anim-medida mono', '', painel);
    var rotR = html('p', null, '', painel);
    var controleR = html('input', null, null, painel);
    controleR.type = 'range'; controleR.min = '0'; controleR.max = String(RESISTORES.length - 1); controleR.step = '1';
    controleR.value = String(RESISTORES.indexOf(10000));
    controleR.setAttribute('aria-label', 'Resistor');
    var rotC = html('p', null, '', painel);
    var controleC = html('input', null, null, painel);
    controleC.type = 'range'; controleC.min = '0'; controleC.max = String(CAPACITORES.length - 1); controleC.step = '1';
    controleC.value = String(CAPACITORES.indexOf(100));
    controleC.setAttribute('aria-label', 'Capacitor');
    var botoes = html('div', 'widget-controles', null, painel);
    var bCarregar = html('button', null, 'Carregar', botoes);
    html('p', null, 'Valores de exemplo. Na ponderada, R e C vêm do card do encontro.', painel);

    var tAtual = T_MAX;
    var carregando = false;
    var inicio = null;

    function tau() {
      return RESISTORES[Number(controleR.value)] * CAPACITORES[Number(controleC.value)] * 1e-6;
    }

    function vc(t) { return VS * (1 - Math.exp(-t / tau())); }

    function desenhar() {
      var tc = tau();
      var d = [];
      for (var k = 0; k <= 200; k++) {
        var tk = T_MAX * k / 200;
        d.push((k ? 'L' : 'M') + x(tk).toFixed(1) + ' ' + y(vc(tk)).toFixed(1));
      }
      curva.setAttribute('d', d.join(' '));
      var v63 = VS * (1 - Math.exp(-1));
      linha63.setAttribute('y1', y(v63)); linha63.setAttribute('y2', y(v63));
      linha63.setAttribute('x2', x(Math.min(tc, T_MAX)));
      var visTau = tc <= T_MAX;
      marcaTau.style.display = visTau ? '' : 'none';
      rotuloTau.style.display = visTau ? '' : 'none';
      marcaTau.setAttribute('x1', x(tc)); marcaTau.setAttribute('x2', x(tc)); marcaTau.setAttribute('y2', y(v63));
      rotuloTau.setAttribute('x', x(tc) + 8); rotuloTau.setAttribute('y', y(v63) - 10);
      rotuloTau.textContent = 'τ: 63%';
      var vis5 = 5 * tc <= T_MAX;
      marca5.style.display = vis5 ? '' : 'none';
      rotulo5.style.display = vis5 ? '' : 'none';
      marca5.setAttribute('x1', x(5 * tc)); marca5.setAttribute('x2', x(5 * tc));
      rotulo5.setAttribute('x', x(5 * tc) + 8); rotulo5.setAttribute('y', Y1 + 26);
      rotulo5.textContent = '5τ: 99%';
      var tp = Math.min(tAtual, T_MAX);
      ponto.setAttribute('cx', x(tp).toFixed(1));
      ponto.setAttribute('cy', y(vc(tp)).toFixed(1));
      rotR.textContent = 'R = ' + ohms(RESISTORES[Number(controleR.value)]);
      rotC.textContent = 'C = ' + CAPACITORES[Number(controleC.value)] + ' µF';
      leitura.textContent = 'τ = ' + decimal(tc, tc < 1 ? 2 : 1) + ' s · Vc = ' + decimal(vc(tp), 2) + ' V';
    }

    function quadro(t) {
      if (carregando && visivel(elemento)) {
        if (inicio === null) inicio = t;
        tAtual = (t - inicio) / 1000;
        if (tAtual >= T_MAX) { tAtual = T_MAX; carregando = false; }
        desenhar();
      }
      if (carregando) window.requestAnimationFrame(quadro);
    }

    controleR.addEventListener('input', desenhar);
    controleC.addEventListener('input', desenhar);
    bCarregar.addEventListener('click', function () {
      carregando = true; inicio = null; tAtual = 0;
      window.requestAnimationFrame(quadro);
    });
    desenhar();
  });
})();
