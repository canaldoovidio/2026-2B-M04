// Animação da Aula 05: o mesmo sinal quantizado em 10 e em 12 bits.
// Uma janela de 30 mV em torno de 1,650 V (a tensão no pino com a bateria em
// 3,3 V e o divisor 1:1). A escada mostra o valor que o ADC devolve: leitura =
// piso(V / Vref x 2^n) e volta para volts como leitura x Vref / 2^n (fórmula da
// ESP-IDF, Vout = Dout x Vmax / Dmax). Arduino Uno: 10 bits e 5 V. ESP32: 12 bits
// e conversão nominal em 3,3 V. Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var X0 = 80, X1 = 690, Y0 = 380, Y1 = 40;
  var V_MIN = 1.635, V_MAX = 1.665;
  var AMOSTRAS = 240;

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

  function decimal(n, casas) { return n.toFixed(casas).replace('.', ','); }
  function x(t) { return X0 + (X1 - X0) * t; }
  function y(v) { return Y0 - (Y0 - Y1) * (v - V_MIN) / (V_MAX - V_MIN); }

  // Sinal lento e determinístico: a tensão da bateria oscilando poucos milivolts.
  function sinal(t) {
    return 1.650 + 0.009 * Math.sin(2 * Math.PI * t) + 0.003 * Math.sin(6 * Math.PI * t + 0.7);
  }

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  IntelIWidgets.registrar('quantizacao-adc', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Sinal analógico e a escada de valores que o ADC devolve, numa janela de 30 milivolts' }, elemento);

    el('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    el('line', { x1: X0, y1: Y0, x2: X0, y2: Y1, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    [1.635, 1.650, 1.665].forEach(function (v) {
      var r = el('text', { x: X0 - 10, y: y(v) + 6, 'class': 'anim-rotulo mono', 'text-anchor': 'end' }, svg);
      r.textContent = decimal(v, 3);
    });
    var rt = el('text', { x: (X0 + X1) / 2, y: Y0 + 30, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, svg);
    rt.textContent = 'tempo';
    var legenda = el('text', { x: (X0 + X1) / 2, y: Y0 + 56, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, svg);
    legenda.textContent = 'verde: o sinal · escada: o que o ADC devolve';
    var rv = el('text', { x: X0, y: Y1 - 14, 'class': 'anim-rotulo', 'text-anchor': 'start' }, svg);
    rv.textContent = 'tensão no pino (V), janela de 30 mV';

    var dSinal = [];
    for (var k = 0; k <= AMOSTRAS; k++) {
      var tk = k / AMOSTRAS;
      dSinal.push((k ? 'L' : 'M') + x(tk).toFixed(1) + ' ' + y(sinal(tk)).toFixed(1));
    }
    el('path', { d: dSinal.join(' '), style: 'fill: none; stroke: var(--seg-secundaria); stroke-width: 4' }, svg);
    var escada = el('path', { 'class': 'anim-escada', style: 'fill: none; stroke: var(--seg-primaria); stroke-width: 3' }, svg);
    var cursor = el('line', { y1: Y1, y2: Y0, style: 'stroke: var(--seg-destaque); stroke-width: 2; stroke-dasharray: 5 4' }, svg);
    var ponto = el('circle', { r: 8, style: 'fill: var(--seg-destaque); stroke: var(--seg-base); stroke-width: 3' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'O mesmo sinal em 10 e 12 bits', painel);
    html('p', null, 'Antes de trocar: quantas vezes menor fica o degrau do Uno (10 bits, 5 V) para o ESP32 (12 bits, 3,3 V)?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var detalhe = html('p', 'mono', '', painel);
    var grupo = html('div', 'widget-controles', null, painel);
    var b10 = html('button', null, '10 bits', grupo);
    var b12 = html('button', null, '12 bits', grupo);
    var b5 = html('button', null, '5 V', grupo);
    var b33 = html('button', null, '3,3 V', grupo);
    var bVarrer = html('button', null, 'Varrer o sinal', grupo);

    var bits = 10, vref = 5;
    var tAtual = 0;
    var varrendo = false, inicio = null;

    function leitura(v) {
      var maximo = Math.pow(2, bits);
      return Math.min(maximo - 1, Math.floor(v / vref * maximo + 1e-9));
    }
    function volta(codigo) { return codigo * vref / Math.pow(2, bits); }

    function desenhar() {
      var d = [];
      var anterior = null;
      for (var k = 0; k <= AMOSTRAS; k++) {
        var tk = k / AMOSTRAS;
        var vq = volta(leitura(sinal(tk)));
        var yq = y(vq).toFixed(1);
        if (anterior === null) d.push('M' + x(tk).toFixed(1) + ' ' + yq);
        else if (yq !== anterior) d.push('H' + x(tk).toFixed(1) + ' V' + yq);
        anterior = yq;
      }
      d.push('H' + x(1).toFixed(1));
      escada.setAttribute('d', d.join(' '));
      var degrauMv = vref / Math.pow(2, bits) * 1000;
      medida.textContent = 'degrau ' + decimal(degrauMv, 2) + ' mV · ' + Math.pow(2, bits) + ' níveis';
      var v = sinal(tAtual);
      var c = leitura(v);
      detalhe.textContent = decimal(v, 4) + ' V → leitura ' + c + ' → ' + decimal(volta(c), 4) + ' V';
      cursor.setAttribute('x1', x(tAtual).toFixed(1));
      cursor.setAttribute('x2', x(tAtual).toFixed(1));
      ponto.setAttribute('cx', x(tAtual).toFixed(1));
      ponto.setAttribute('cy', y(volta(c)).toFixed(1));
      b10.classList.toggle('ativo', bits === 10);
      b12.classList.toggle('ativo', bits === 12);
      b5.classList.toggle('ativo', vref === 5);
      b33.classList.toggle('ativo', vref === 3.3);
    }

    function quadro(t) {
      if (varrendo && visivel(elemento)) {
        if (inicio === null) inicio = t;
        tAtual = Math.min(1, (t - inicio) / 6000);
        if (tAtual >= 1) varrendo = false;
        desenhar();
      }
      if (varrendo) window.requestAnimationFrame(quadro);
    }

    b10.addEventListener('click', function () { bits = 10; desenhar(); });
    b12.addEventListener('click', function () { bits = 12; desenhar(); });
    b5.addEventListener('click', function () { vref = 5; desenhar(); });
    b33.addEventListener('click', function () { vref = 3.3; desenhar(); });
    bVarrer.addEventListener('click', function () {
      varrendo = true; inicio = null; tAtual = 0;
      window.requestAnimationFrame(quadro);
    });
    desenhar();
  });
})();
