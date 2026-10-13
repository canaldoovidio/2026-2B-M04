// Animação da Aula 08: dBm contra miliwatt.
// Em cima, o eixo em dBm de -100 a -20, linear em dBm e por isso logarítmico em
// mW: cada marca de 10 dB é uma potência de dez. Embaixo, as mesmas duas
// potências em barras lineares de mW, para mostrar o que o logaritmo esconde.
// Fórmula e regras de 3 dB e 10 dB da nota "Valores da potência de RF" da Cisco:
// dBm = 10 × log10(P / 1 mW); +3 dB dobra a potência e +10 dB multiplica por 10.
// Sem laço de animação: redesenha só quando um controle muda. Sem cor literal;
// desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var MIN = -100, MAX = -20;
  var X0 = 80, X1 = 600, Y_EIXO = 120;
  var Y_BARRA_A = 262, Y_BARRA_B = 332, BARRA_X = 110, BARRA_MAX = 540;

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

  function texto(svg, x, y, conteudo, ancora, classe) {
    var t = el('text', { x: x, y: y, 'class': classe || 'anim-rotulo', 'text-anchor': ancora || 'middle' }, svg);
    t.textContent = conteudo;
    return t;
  }

  function x(dbm) { return X0 + (X1 - X0) * (dbm - MIN) / (MAX - MIN); }
  function menos(n) { return String(n).replace('-', '−'); }
  function decimal(n, casas) { return n.toFixed(casas).replace('.', ','); }

  // 10 elevado a n no SVG: o expoente sobe num tspan, porque a fonte
  // monoespaçada não tem os algarismos sobrescritos do Unicode.
  function potencia10(svg, xc, y, n) {
    var t = el('text', { x: xc, y: y, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, svg);
    t.appendChild(document.createTextNode('10'));
    var e = el('tspan', { dy: -9, style: 'font-size: 13px' }, t);
    e.textContent = menos(n);
    return t;
  }

  // Potência em mW em notação científica, em HTML: -63 dBm vira 5,0 × 10<sup>−7</sup> mW.
  function emMw(dbm) {
    var expoente = Math.floor(dbm / 10);
    var mantissa = Math.pow(10, dbm / 10 - expoente);
    if (mantissa >= 9.95) { mantissa = 1; expoente += 1; }
    return decimal(mantissa, 1) + ' × 10<sup>' + menos(expoente) + '</sup> mW';
  }

  function razao(r) { return r < 10 ? decimal(r, 1) : String(Math.round(r)); }

  IntelIWidgets.registrar('escala-dbm', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Eixo de dBm de -100 a -20 com a potência em miliwatt de cada marca e duas barras lineares comparando as potências A e B' }, elemento);

    texto(svg, X0, 34, 'Escala em dBm: cada 10 dB é um fator de 10 em mW', 'start');
    el('line', { x1: X0, y1: Y_EIXO, x2: X1, y2: Y_EIXO, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    for (var d = MIN; d <= MAX; d += 10) {
      el('line', { x1: x(d), x2: x(d), y1: Y_EIXO - 8, y2: Y_EIXO + 8, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
      texto(svg, x(d), Y_EIXO + 34, menos(d), 'middle', 'anim-rotulo mono');
      potencia10(svg, x(d), Y_EIXO + 64, d / 10);
    }
    texto(svg, X1 + 44, Y_EIXO + 34, 'dBm', 'start');
    texto(svg, X1 + 44, Y_EIXO + 64, 'mW', 'start');

    var marcaA = el('path', { style: 'fill: var(--seg-primaria)' }, svg);
    var marcaB = el('path', { style: 'fill: var(--seg-destaque)' }, svg);
    var rotA = texto(svg, 0, 0, '', 'middle');
    var rotB = texto(svg, 0, 0, '', 'middle');

    texto(svg, X0, 226, 'As mesmas potências em escala linear de mW', 'start');
    texto(svg, BARRA_X - 14, Y_BARRA_A + 24, 'A', 'end');
    texto(svg, BARRA_X - 14, Y_BARRA_B + 24, 'B', 'end');
    var barraA = el('rect', { x: BARRA_X, y: Y_BARRA_A, height: 36, style: 'fill: var(--seg-primaria)' }, svg);
    var barraB = el('rect', { x: BARRA_X, y: Y_BARRA_B, height: 36, style: 'fill: var(--seg-destaque)' }, svg);
    el('line', { x1: BARRA_X, x2: BARRA_X, y1: Y_BARRA_A - 6, y2: Y_BARRA_B + 42,
      style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    var notaBarras = texto(svg, X0, 400, '', 'start');
    texto(svg, X0, 430, 'Nota da Cisco: +3 dB dobra a potência; +10 dB a multiplica por 10.', 'start');

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'dBm contra miliwatt', painel);
    html('p', null, 'Antes de mexer: −60 dBm é quantas vezes mais potência que −90 dBm? Escreva o número.', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var detalhe = html('p', 'mono', '', painel);
    var controleA = html('input', null, null, painel);
    var controleB = html('input', null, null, painel);
    [[controleA, -60, 'Potência A em dBm'], [controleB, -90, 'Potência B em dBm']].forEach(function (c) {
      c[0].type = 'range'; c[0].min = String(MIN); c[0].max = String(MAX); c[0].step = '1';
      c[0].value = String(c[1]); c[0].setAttribute('aria-label', c[2]);
    });
    var botoes = html('div', 'widget-controles', null, painel);
    var bMenos3 = html('button', null, '−3 dB em B', botoes);
    var bMenos10 = html('button', null, '−10 dB em B', botoes);
    var bRepor = html('button', null, 'Repor', botoes);

    function triangulo(cx, cima) {
      var s = cima ? -1 : 1;
      var yb = Y_EIXO + s * 10;
      return 'M' + cx + ' ' + yb + ' L' + (cx - 11) + ' ' + (yb + s * 22) + ' L' + (cx + 11) + ' ' + (yb + s * 22) + ' Z';
    }

    function desenhar() {
      var a = Number(controleA.value), b = Number(controleB.value);
      var delta = Math.abs(a - b);
      var r = Math.pow(10, delta / 10);
      marcaA.setAttribute('d', triangulo(x(a), true));
      marcaB.setAttribute('d', triangulo(x(b), true));
      var perto = Math.abs(x(a) - x(b)) < 70;
      rotA.setAttribute('x', x(a)); rotA.setAttribute('y', perto && a < b ? 62 : 80);
      rotB.setAttribute('x', x(b)); rotB.setAttribute('y', perto && b <= a ? 62 : 80);
      rotA.textContent = 'A ' + menos(a);
      rotB.textContent = 'B ' + menos(b);
      var pa = Math.pow(10, a / 10), pb = Math.pow(10, b / 10), pmax = Math.max(pa, pb);
      barraA.setAttribute('width', Math.max(BARRA_MAX * pa / pmax, 1).toFixed(2));
      barraB.setAttribute('width', Math.max(BARRA_MAX * pb / pmax, 1).toFixed(2));
      var fraca = pa < pb ? 'A' : 'B';
      notaBarras.textContent = delta === 0 ? 'A e B iguais.' :
        'A barra de ' + fraca + ' é 1/' + razao(r) + ' da outra.';
      medida.textContent = 'Δ ' + delta + ' dB · ' + razao(r) + ' ×';
      detalhe.innerHTML = 'A ' + menos(a) + ' dBm = ' + emMw(a) + '<br>B ' + menos(b) + ' dBm = ' + emMw(b);
    }

    function moverB(passo) {
      controleB.value = String(Math.max(MIN, Math.min(MAX, Number(controleB.value) + passo)));
      desenhar();
    }

    controleA.addEventListener('input', desenhar);
    controleB.addEventListener('input', desenhar);
    bMenos3.addEventListener('click', function () { moverB(-3); });
    bMenos10.addEventListener('click', function () { moverB(-10); });
    bRepor.addEventListener('click', function () { controleA.value = '-60'; controleB.value = '-90'; desenhar(); });
    desenhar();
  });
})();
