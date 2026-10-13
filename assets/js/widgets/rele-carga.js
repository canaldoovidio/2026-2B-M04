// Animação da Aula 09: o relé separa o circuito de comando do circuito de potência.
// À esquerda, o comando: o GPIO 26 do ESP32 aciona um transistor, que liga a
// bobina de 5 V; um diodo de roda livre fica em paralelo com a bobina. À direita,
// a potência: o contato COM troca de NC para NO e liga o sinalizador, alimentado
// pela rede de 127/220 V, que a aula só desenha e nunca monta. Entre os dois lados,
// só o campo magnético atravessa.
// Números com origem: bobina de 70 Ω do SRD-05VDC-SL-C (página do componente na
// LCSC), logo 5 V ÷ 70 Ω = 71,4 mA; o GPIO do ESP32 fornece 40 mA (ESP32 Series
// Datasheet v5.3, Tabela 5-3), por isso quem liga a bobina é o transistor. Sem o
// diodo, o desligamento produz um pico que pode chegar a centenas de volts; com
// ele, a tensão na bobina fica em cerca de 0,7 V (notas "Relay Basics", UNLV PHYS
// 483). Os 40 mA são típicos, com drive no máximo e VOH >= 2,64 V; o módulo é
// alimentado pelo pino 5V da placa (VCC), e o GPIO só comanda o transistor. Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var CORRENTE_MA = 5 / 70 * 1000;          // 71,4 mA
  var DECAIMENTO_MS = 1400;                 // duração ilustrativa da corrente no diodo
  // Laço da bobina ligada: +5 V, bobina, transistor, GND.
  var LACO_LIGADO = [[200, 70], [200, 330]];
  // Laço de roda livre: desce pela bobina e sobe pelo diodo.
  var LACO_DIODO = [[200, 110], [200, 190], [280, 190], [280, 110], [200, 110]];

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

  function linha(svg, pontos, estilo) {
    return el('polyline', { points: pontos.map(function (p) { return p.join(','); }).join(' '),
      style: estilo || 'fill: none; stroke: var(--seg-texto); stroke-width: 3' }, svg);
  }

  // Ponto a uma fração f do comprimento de uma poligonal, calculado só com
  // coordenadas (nada de medir o SVG).
  function pontoEm(pontos, f) {
    var trechos = [], total = 0;
    for (var i = 1; i < pontos.length; i++) {
      var d = Math.hypot(pontos[i][0] - pontos[i - 1][0], pontos[i][1] - pontos[i - 1][1]);
      trechos.push(d); total += d;
    }
    var alvo = ((f % 1) + 1) % 1 * total;
    for (var k = 0; k < trechos.length; k++) {
      if (alvo <= trechos[k]) {
        var r = trechos[k] ? alvo / trechos[k] : 0;
        return [pontos[k][0] + (pontos[k + 1][0] - pontos[k][0]) * r,
                pontos[k][1] + (pontos[k + 1][1] - pontos[k][1]) * r];
      }
      alvo -= trechos[k];
    }
    return pontos[pontos.length - 1];
  }

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  IntelIWidgets.registrar('rele-carga', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 428', role: 'img',
      'aria-label': 'Relé com o circuito de comando à esquerda e o circuito de potência à direita' }, elemento);

    texto(svg, 170, 30, 'Comando (5 V)');
    texto(svg, 550, 30, 'Potência');
    el('line', { x1: 360, y1: 20, x2: 360, y2: 400,
      style: 'stroke: var(--seg-borda); stroke-width: 3; stroke-dasharray: 10 8' }, svg);
    texto(svg, 700, 420, 'só o campo magnético atravessa', 'end', 'anim-rotulo');

    // Comando: +5 V, bobina, transistor, GND e o GPIO.
    texto(svg, 200, 62, '+5 V do pino 5V (VCC)');
    linha(svg, [[200, 70], [200, 110]]);
    el('rect', { x: 180, y: 110, width: 40, height: 80, rx: 6,
      style: 'fill: var(--seg-superficie); stroke: var(--seg-texto); stroke-width: 3' }, svg);
    texto(svg, 170, 150, 'bobina 70 Ω', 'end');
    texto(svg, 170, 172, 'SRD-05VDC-SL-C', 'end', 'anim-rotulo mono');
    linha(svg, [[200, 190], [200, 280]]);
    el('circle', { cx: 200, cy: 300, r: 22, style: 'fill: var(--seg-base); stroke: var(--seg-texto); stroke-width: 3' }, svg);
    texto(svg, 232, 306, 'transistor', 'start');
    linha(svg, [[200, 320], [200, 350]]);
    texto(svg, 200, 372, 'GND');
    el('rect', { x: 24, y: 270, width: 92, height: 60, rx: 6,
      style: 'fill: var(--seg-primaria); stroke: none' }, svg);
    var tEsp = texto(svg, 70, 296, 'ESP32', 'middle', 'anim-rotulo');
    tEsp.style.fill = 'var(--seg-base)';
    var tGpio = texto(svg, 70, 318, 'GPIO 26', 'middle', 'anim-rotulo mono');
    tGpio.style.fill = 'var(--seg-base)';
    var fioGpio = linha(svg, [[116, 300], [178, 300]]);
    texto(svg, 24, 396, 'GPIO: 40 mA típicos (Tabela 5-3,', 'start');
    texto(svg, 24, 418, 'drive máximo, VOH ≥ 2,64 V)', 'start');
    // Resistor de base: limita a corrente que o GPIO entrega ao transistor.
    el('rect', { x: 132, y: 292, width: 30, height: 16, rx: 3,
      style: 'fill: var(--seg-base); stroke: var(--seg-texto); stroke-width: 3' }, svg);
    texto(svg, 147, 284, 'R base');

    // Diodo de roda livre em paralelo com a bobina: catodo para o +5 V.
    var diodo = el('g', {}, svg);
    linha(diodo, [[200, 110], [280, 110], [280, 135]]);
    linha(diodo, [[280, 165], [280, 190], [200, 190]]);
    el('polygon', { points: '266,165 294,165 280,140', style: 'fill: var(--seg-texto)' }, diodo);
    el('line', { x1: 264, y1: 138, x2: 296, y2: 138, style: 'stroke: var(--seg-texto); stroke-width: 4' }, diodo);
    texto(diodo, 300, 158, 'diodo', 'start');

    // Potência: rede, contato COM/NO/NC e o sinalizador.
    el('rect', { x: 430, y: 52, width: 240, height: 56, rx: 6,
      style: 'fill: var(--seg-superficie); stroke: var(--seg-destaque); stroke-width: 3' }, svg);
    texto(svg, 550, 76, 'Rede 127/220 V');
    texto(svg, 550, 98, 'só no desenho: não montar', 'middle', 'anim-rotulo');
    linha(svg, [[460, 108], [460, 230]]);
    el('circle', { cx: 460, cy: 236, r: 7, style: 'fill: var(--seg-texto)' }, svg);
    texto(svg, 444, 262, 'COM', 'end', 'anim-rotulo mono');
    el('circle', { cx: 540, cy: 196, r: 7, style: 'fill: var(--seg-texto)' }, svg);
    texto(svg, 540, 182, 'NO', 'middle', 'anim-rotulo mono');
    el('circle', { cx: 540, cy: 276, r: 7, style: 'fill: var(--seg-texto)' }, svg);
    texto(svg, 540, 304, 'NC', 'middle', 'anim-rotulo mono');
    var lamina = el('line', { x1: 460, y1: 236, x2: 540, y2: 276,
      style: 'stroke: var(--seg-primaria); stroke-width: 6; stroke-linecap: round' }, svg);
    linha(svg, [[540, 196], [620, 196], [620, 230]]);
    var lampada = el('circle', { cx: 620, cy: 256, r: 26,
      style: 'fill: var(--seg-base); stroke: var(--seg-texto); stroke-width: 3' }, svg);
    texto(svg, 620, 314, 'sinalizador');
    linha(svg, [[620, 282], [620, 340], [690, 340], [690, 108], [670, 108]]);
    el('path', { d: 'M 222 180 Q 330 255 452 236',
      style: 'fill: none; stroke: var(--seg-secundaria); stroke-width: 3; stroke-dasharray: 4 6' }, svg);

    var eletrons = [];
    for (var i = 0; i < 6; i++) {
      eletrons.push(el('circle', { r: 6, style: 'fill: var(--seg-destaque); display: none' }, svg));
    }

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Comando separado da potência', painel);
    html('p', null, 'Antes de ligar: ao desligar a bobina, para onde vai a corrente dela, com e sem o diodo?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    var bGpio = html('button', null, '', botoes);
    bGpio.dataset.acao = 'gpio';
    var bDiodo = html('button', null, '', botoes);
    bDiodo.dataset.acao = 'diodo';
    var alerta = html('p', 'anim-alerta', '', painel);

    var ligado = false;
    var comDiodo = true;
    var desligouEm = null;      // ms acumulados desde o desligamento com diodo
    var fase = 0;
    var anterior = null;

    function atualizar() {
      bGpio.textContent = ligado ? 'Desligar GPIO 26' : 'Ligar GPIO 26';
      bGpio.classList.toggle('ativo', ligado);
      bDiodo.textContent = comDiodo ? 'Retirar o diodo' : 'Recolocar o diodo';
      diodo.style.opacity = comDiodo ? '1' : '0.15';
      lamina.setAttribute('x2', 540);
      lamina.setAttribute('y2', ligado ? 196 : 276);
      lampada.style.fill = ligado ? 'var(--seg-destaque)' : 'var(--seg-base)';
      fioGpio.style.stroke = ligado ? 'var(--seg-destaque)' : 'var(--seg-texto)';
      medida.textContent = 'bobina ' + (ligado ? CORRENTE_MA.toFixed(1).replace('.', ',') : '0') +
        ' mA · NO ' + (ligado ? 'fechado' : 'aberto');
    }

    function desenharEletrons() {
      var laco = null, velocidade = 0.6;
      if (ligado) laco = LACO_LIGADO;
      else if (desligouEm !== null && desligouEm < DECAIMENTO_MS) {
        laco = LACO_DIODO;
        velocidade = 0.6 * (1 - desligouEm / DECAIMENTO_MS);
      }
      eletrons.forEach(function (c, k) {
        if (!laco) { c.style.display = 'none'; return; }
        var p = pontoEm(laco, fase + k / eletrons.length);
        c.style.display = '';
        c.setAttribute('cx', p[0].toFixed(1));
        c.setAttribute('cy', p[1].toFixed(1));
      });
      return velocidade;
    }

    function quadro(t) {
      var dt = anterior === null ? 0 : Math.min(t - anterior, 100);
      anterior = t;
      if (visivel(elemento)) {
        if (desligouEm !== null) desligouEm += dt;
        var v = desenharEletrons();
        fase = (fase + v * dt / 1000) % 1;
      }
      window.requestAnimationFrame(quadro);
    }

    bGpio.addEventListener('click', function () {
      ligado = !ligado;
      if (ligado) {
        desligouEm = null;
        alerta.classList.remove('anim-alerta-visivel');
      } else {
        desligouEm = comDiodo ? 0 : null;
        alerta.textContent = comDiodo
          ? 'Com diodo: a corrente circula pelo diodo e a bobina fica em cerca de 0,7 V.'
          : 'Sem diodo: o transistor pode levar centenas a milhares de volts.';
        alerta.classList.add('anim-alerta-visivel');
      }
      atualizar();
      desenharEletrons();
    });
    bDiodo.addEventListener('click', function () {
      comDiodo = !comDiodo;
      atualizar();
    });

    atualizar();
    desenharEletrons();
    window.requestAnimationFrame(quadro);
  });
})();
