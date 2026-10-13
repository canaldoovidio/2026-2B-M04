// Animação da Aula 05: divisor de tensão da bateria até o GPIO34 do ESP32.
// Vpino = Vbat x R2 / (R1 + R2); leitura pela convenção de conta da aula =
// piso(Vpino / 3,3 x 4096), limitada a 4095; o chip real em 11 dB satura antes. R1 fica em 100 kΩ e R2 é o resistor ajustável. Faixas do
// datasheet do ESP32 (v5.3): Tabela 4-4, atenuação 3, faixa calibrada de 150 a
// 2450 mV com erro de até 60 mV; Tabela 5-3, entrada até VDD + 0,3 V = 3,6 V.
// Bateria de exemplo: NCR18650B, de 2,50 V (corte) a 4,20 V (carga completa).
// Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var R1 = 100000;
  var R2S = [47000, 68000, 100000, 150000, 220000, 470000];
  var BATERIAS = [4.2, 3.3, 2.5];

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

  function texto(atributos, conteudo, pai) {
    var t = el('text', atributos, pai);
    t.textContent = conteudo;
    return t;
  }

  function decimal(n, casas) { return n.toFixed(casas).replace('.', ','); }
  function kohms(r) { return Math.round(r / 1000) + ' kΩ'; }

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  IntelIWidgets.registrar('divisor-bateria', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Divisor de tensão entre a bateria e o pino GPIO34 do ESP32, com a leitura do ADC' }, elemento);
    var fio = 'fill: none; stroke: var(--seg-texto); stroke-width: 3';

    // Bateria: duas placas, a longa é o positivo.
    el('path', { d: 'M110 60 V190 M110 250 V390 H330 M110 60 H330 V90', style: fio }, svg);
    el('line', { x1: 80, y1: 190, x2: 140, y2: 190, style: 'stroke: var(--seg-texto); stroke-width: 4' }, svg);
    el('line', { x1: 95, y1: 210, x2: 125, y2: 210, style: 'stroke: var(--seg-texto); stroke-width: 6' }, svg);
    el('line', { x1: 80, y1: 230, x2: 140, y2: 230, style: 'stroke: var(--seg-texto); stroke-width: 4' }, svg);
    el('line', { x1: 95, y1: 250, x2: 125, y2: 250, style: 'stroke: var(--seg-texto); stroke-width: 6' }, svg);
    var rotBat = texto({ x: 150, y: 226, 'class': 'anim-rotulo mono', 'text-anchor': 'start' }, '', svg);

    // R1, nó do pino, R2 e terra.
    el('rect', { x: 312, y: 90, width: 36, height: 80, style: 'fill: var(--seg-superficie); stroke: var(--seg-texto); stroke-width: 3' }, svg);
    texto({ x: 360, y: 136, 'class': 'anim-rotulo mono', 'text-anchor': 'start' }, 'R1 = ' + kohms(R1), svg);
    el('path', { d: 'M330 170 V250 M330 330 V390', style: fio }, svg);
    var corpoR2 = el('rect', { x: 312, y: 250, width: 36, height: 80, style: 'fill: var(--seg-secundaria); stroke: var(--seg-texto); stroke-width: 3' }, svg);
    var rotR2 = texto({ x: 360, y: 296, 'class': 'anim-rotulo mono', 'text-anchor': 'start' }, '', svg);
    el('circle', { cx: 330, cy: 210, r: 7, style: 'fill: var(--seg-texto)' }, svg);
    el('path', { d: 'M330 210 H540', style: fio }, svg);
    el('path', { d: 'M300 390 H360 M310 402 H350 M320 414 H340', style: 'stroke: var(--seg-texto); stroke-width: 3' }, svg);
    var corrente = texto({ x: 180, y: 50, 'class': 'anim-rotulo mono', 'text-anchor': 'start' }, '', svg);

    // ESP32 com o pino e a leitura.
    el('rect', { x: 540, y: 150, width: 160, height: 130, rx: 10, style: 'fill: var(--seg-primaria)' }, svg);
    texto({ x: 620, y: 182, 'class': 'anim-rotulo', 'text-anchor': 'middle', style: 'fill: var(--seg-base)' }, 'ESP32 GPIO34', svg);
    var rotPino = texto({ x: 620, y: 222, 'class': 'anim-rotulo mono', 'text-anchor': 'middle', style: 'fill: var(--seg-base)' }, '', svg);
    var rotLeitura = texto({ x: 620, y: 258, 'class': 'anim-rotulo mono', 'text-anchor': 'middle', style: 'fill: var(--seg-base)' }, '', svg);
    var pulso = el('circle', { cx: 330, cy: 210, r: 7, style: 'fill: var(--seg-destaque)' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Divisor da bateria até o pino', painel);
    html('p', null, 'Antes de mover o resistor: com R1 = R2 = 100 kΩ, que leitura o ADC devolve com a bateria em 4,2 V? E em 3,3 V?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    html('p', null, 'Tensão da bateria', painel);
    var gBat = html('div', 'widget-controles', null, painel);
    var botoes = BATERIAS.map(function (v) { return html('button', null, decimal(v, 1) + ' V', gBat); });
    var rotControle = html('p', null, '', painel);
    var controle = html('input', null, null, painel);
    controle.type = 'range'; controle.min = '0'; controle.max = String(R2S.length - 1); controle.step = '1';
    controle.value = String(R2S.indexOf(100000));
    controle.setAttribute('aria-label', 'Resistor R2');
    var situacao = html('p', null, '', painel);
    var alerta = html('p', 'anim-alerta', '', painel);

    var vbat = 4.2;
    var fase = 0;

    function calcular() {
      var r2 = R2S[Number(controle.value)];
      var vpino = vbat * r2 / (R1 + r2);
      var leitura = Math.min(4095, Math.floor(vpino / 3.3 * 4096 + 1e-9));
      return { r2: r2, vpino: vpino, leitura: leitura, microA: vbat / (R1 + r2) * 1e6 };
    }

    function desenhar() {
      var c = calcular();
      medida.textContent = 'pino ' + decimal(c.vpino, 2) + ' V · leitura ' + c.leitura;
      rotBat.textContent = 'bateria ' + decimal(vbat, 1) + ' V';
      rotR2.textContent = 'R2 = ' + kohms(c.r2);
      rotControle.textContent = 'R2 = ' + kohms(c.r2) + ' (R1 fixo em 100 kΩ)';
      corrente.textContent = 'corrente no divisor: ' + Math.round(c.microA) + ' µA';
      rotPino.textContent = decimal(c.vpino, 2) + ' V';
      rotLeitura.textContent = 'leitura ' + c.leitura;
      var aviso = '';
      if (c.vpino > 3.6) {
        aviso = 'Acima de 3,6 V: passa do VIH máximo do pino (Tabela 5-3).';
      } else if (c.vpino > 3.3) {
        aviso = 'Na conta, satura em 4095; o chip real pode saturar entre 3,1 e 3,3 V.';
      } else if (c.vpino > 2.45) {
        aviso = 'Fora da faixa calibrada de 2450 mV: sem os 60 mV da Tabela 4-4.';
      }
      situacao.textContent = 'Dentro da faixa calibrada de 150 a 2450 mV: erro de até 60 mV no pino.';
      situacao.style.display = aviso ? 'none' : '';
      alerta.style.display = aviso ? '' : 'none';
      alerta.textContent = aviso;
      alerta.classList.toggle('anim-alerta-visivel', Boolean(aviso));
      corpoR2.style.strokeWidth = aviso ? '5' : '3';
      botoes.forEach(function (b, i) { b.classList.toggle('ativo', BATERIAS[i] === vbat); });
    }

    // A corrente percorre o divisor: um pulso desce de R1 até o GND enquanto o slide está em cena.
    function quadro() {
      if (visivel(elemento)) {
        fase = (fase + 2) % 330;
        var yy = 60 + fase;
        pulso.setAttribute('cy', String(yy));
      }
      window.setTimeout(function () { window.requestAnimationFrame(quadro); }, 40);
    }

    botoes.forEach(function (b, i) {
      b.addEventListener('click', function () { vbat = BATERIAS[i]; desenhar(); });
    });
    controle.addEventListener('input', desenhar);
    desenhar();
    window.requestAnimationFrame(quadro);
  });
})();
