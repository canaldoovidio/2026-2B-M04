// Animação da Aula 01: corrente no LED em função do resistor.
// Prever, observar, explicar: a legenda pede a previsão antes do primeiro
// controle. Elétrons percorrem o circuito com velocidade proporcional à
// corrente; o brilho do LED acompanha; acima de 20 mA aparece o alerta.
// Sem cor literal: tudo por var(--seg-*). Desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var FONTE_V = 5;
  var QUEDA_LED_V = 2;
  var LIMITE_MA = 20;

  function el(nome, atributos, pai) {
    var no = document.createElementNS(NS, nome);
    Object.keys(atributos || {}).forEach(function (k) { no.setAttribute(k, atributos[k]); });
    if (pai) pai.appendChild(no);
    return no;
  }

  function texto(pai, x, y, conteudo, classe, ancora) {
    var t = el('text', { x: x, y: y, 'class': classe || 'anim-rotulo', 'text-anchor': ancora || 'middle' }, pai);
    t.textContent = conteudo;
    return t;
  }

  function html(tag, classe, conteudo, pai) {
    var no = document.createElement(tag);
    if (classe) no.className = classe;
    if (conteudo) no.textContent = conteudo;
    if (pai) pai.appendChild(no);
    return no;
  }

  // No deck, só anima o slide presente; fora do Reveal (material de apoio)
  // não há slide, e a animação roda sempre.
  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  function correnteMa(ohms) {
    return ohms <= 0 ? Infinity : (FONTE_V - QUEDA_LED_V) / ohms * 1000;
  }

  function formatar(ma) {
    if (!isFinite(ma)) return 'sem limite';
    return ma.toFixed(1).replace('.', ',') + ' mA';
  }

  IntelIWidgets.registrar('circuito-led', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Circuito com fonte de 5 V, resistor e LED, com elétrons em movimento' }, elemento);

    var defs = el('defs', {}, svg);
    var grad = el('radialGradient', { id: 'circuito-led-brilho' }, defs);
    el('stop', { offset: '0', 'stop-opacity': '0.9', style: 'stop-color: var(--seg-destaque)' }, grad);
    el('stop', { offset: '1', 'stop-opacity': '0', style: 'stop-color: var(--seg-destaque)' }, grad);

    el('path', { 'class': 'anim-fio', d: 'M110 360 L110 80 L600 80 L600 360 Z' }, svg);
    var grupoEletrons = el('g', {}, svg);

    el('rect', { x: 70, y: 180, width: 80, height: 110, rx: 8,
      style: 'fill: var(--seg-base); stroke: var(--seg-primaria); stroke-width: 4' }, svg);
    texto(svg, 110, 228, '5 V', 'anim-rotulo mono');
    texto(svg, 110, 262, 'fonte');
    texto(svg, 132, 200, '+', 'anim-rotulo mono');
    texto(svg, 132, 282, '−', 'anim-rotulo mono');

    el('rect', { x: 280, y: 58, width: 160, height: 44, rx: 6,
      style: 'fill: var(--seg-superficie); stroke: var(--seg-primaria); stroke-width: 4' }, svg);
    el('path', { d: 'M300 80 l12 -14 l16 28 l16 -28 l16 28 l16 -28 l16 28 l12 -14',
      style: 'fill: none; stroke: var(--seg-primaria); stroke-width: 4; stroke-linejoin: round' }, svg);
    texto(svg, 360, 42, 'resistor');
    var rotuloR = texto(svg, 360, 136, '220 Ω', 'anim-rotulo mono');

    var halo = el('circle', { cx: 600, cy: 222, r: 70, fill: 'url(#circuito-led-brilho)', opacity: '0.5' }, svg);
    el('polygon', { points: '575,192 625,192 600,237',
      style: 'fill: var(--seg-destaque); stroke: var(--seg-primaria); stroke-width: 4; stroke-linejoin: round' }, svg);
    el('line', { x1: 572, y1: 239, x2: 628, y2: 239, style: 'stroke: var(--seg-primaria); stroke-width: 5' }, svg);
    texto(svg, 650, 224, 'LED', 'anim-rotulo', 'start');
    texto(svg, 650, 248, 'cai 2 V', 'anim-rotulo', 'start');

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Lei de Ohm no circuito', painel);
    html('p', null, 'Antes de mexer: o que acontece com a corrente se o resistor for 0 Ω?', painel);
    html('p', 'mono', 'I = (5 V − 2 V) ÷ R', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var rotuloControle = html('p', null, '', painel);
    var controle = html('input', null, null, painel);
    controle.type = 'range';
    controle.min = '0';
    controle.max = '1000';
    controle.step = '10';
    controle.value = '220';
    controle.setAttribute('aria-label', 'Resistência em ohms');
    var botoes = html('div', 'widget-controles', null, painel);
    var b220 = html('button', null, '220 Ω (kit)', botoes);
    var b0 = html('button', null, '0 Ω', botoes);
    var bPausa = html('button', null, 'Pausar', botoes);
    var alerta = html('p', 'anim-alerta', 'Acima de 20 mA o LED passa da corrente recomendada pelo datasheet e se aproxima do máximo absoluto.', painel);

    // Percurso calculado à mão sobre os cantos do caminho, sem getPointAtLength:
    // o SVG de um slide fora de cena não tem geometria renderizada.
    var cantos = [[110, 360], [110, 80], [600, 80], [600, 360], [110, 360]];
    var trechos = [];
    var total = 0;
    for (var c = 0; c < cantos.length - 1; c++) {
      var dx = cantos[c + 1][0] - cantos[c][0];
      var dy = cantos[c + 1][1] - cantos[c][1];
      var comprimento = Math.abs(dx) + Math.abs(dy);
      trechos.push({ x: cantos[c][0], y: cantos[c][1], dx: dx, dy: dy, inicio: total, comprimento: comprimento });
      total += comprimento;
    }

    function pontoEm(distancia) {
      var d = ((distancia % total) + total) % total;
      for (var k = 0; k < trechos.length; k++) {
        var tr = trechos[k];
        if (d <= tr.inicio + tr.comprimento) {
          var f = (d - tr.inicio) / tr.comprimento;
          return { x: tr.x + tr.dx * f, y: tr.y + tr.dy * f };
        }
      }
      return { x: cantos[0][0], y: cantos[0][1] };
    }

    var N = 20;
    var eletrons = [];
    for (var i = 0; i < N; i++) {
      eletrons.push(el('circle', { r: 7, style: 'fill: var(--seg-secundaria)' }, grupoEletrons));
    }

    var fase = 0;
    var ultimo = null;
    var pausado = false;

    function atualizar() {
      var ohms = Number(controle.value);
      var ma = correnteMa(ohms);
      rotuloR.textContent = ohms + ' Ω';
      rotuloControle.textContent = 'Resistência: ' + ohms + ' Ω';
      medida.textContent = formatar(ma);
      var acima = ma > LIMITE_MA;
      alerta.classList.toggle('anim-alerta-visivel', acima);
      var n = Math.min(ma / LIMITE_MA, 1.6);
      halo.setAttribute('opacity', (0.1 + 0.55 * Math.min(n, 1)).toFixed(2));
      halo.setAttribute('r', String(Math.round(45 + 35 * n)));
      eletrons.forEach(function (e) {
        e.style.fill = acima ? 'var(--seg-destaque)' : 'var(--seg-secundaria)';
      });
    }

    function posicionar() {
      eletrons.forEach(function (e, k) {
        var p = pontoEm(fase + k * total / N);
        e.setAttribute('cx', p.x.toFixed(1));
        e.setAttribute('cy', p.y.toFixed(1));
      });
    }

    function quadro(t) {
      if (ultimo === null) ultimo = t;
      var dt = Math.min((t - ultimo) / 1000, 0.1);
      ultimo = t;
      if (!pausado && visivel(elemento)) {
        var ma = Math.min(correnteMa(Number(controle.value)), 60);
        // Elétrons saem do terminal negativo: sentido anti-horário no desenho,
        // oposto ao da corrente convencional.
        fase = (fase - dt * ma * 9 + total) % total;
        posicionar();
      }
      window.requestAnimationFrame(quadro);
    }

    controle.addEventListener('input', atualizar);
    b220.addEventListener('click', function () { controle.value = '220'; atualizar(); });
    b0.addEventListener('click', function () { controle.value = '0'; atualizar(); });
    bPausa.addEventListener('click', function () {
      pausado = !pausado;
      bPausa.textContent = pausado ? 'Continuar' : 'Pausar';
      bPausa.classList.toggle('ativo', pausado);
    });

    atualizar();
    posicionar();
    window.requestAnimationFrame(quadro);
  });
})();
