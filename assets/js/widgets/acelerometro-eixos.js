// Animação da Aula 05: os três eixos do acelerômetro com o equipamento parado,
// tombado e em transporte. Parado e nivelado, o MPU6050 lê só a gravidade,
// (0, 0, 1) g, que é o padrão do wokwi-mpu6050. O desvio é a distância entre a
// leitura e essa posição de instalação: |a - (0, 0, 1)|. Tombar 90° dá
// raiz de 2 = 1,41 g. O limiar de 0,26 g é 2 x sen(7,5°), o desvio de uma
// inclinação de 15°. O transporte é uma vibração determinística, para o mesmo
// pico aparecer em toda execução. Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var LIMIAR = 0.26;
  var CONFIRMACAO = 3;
  var BX0 = 470, BX1 = 690;          // barras de -1,5 g a +1,5 g
  var G_MAX = 1.5;

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
  function bx(g) { return BX0 + (BX1 - BX0) * (g + G_MAX) / (2 * G_MAX); }

  function vibracao(k) {
    return [0.12 * Math.sin(1.3 * k), 0.10 * Math.sin(2.1 * k + 1),
      1 + 0.30 * Math.sin(0.9 * k) + 0.08 * Math.sin(3.7 * k)];
  }

  function desvio(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + (a[2] - 1) * (a[2] - 1));
  }

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  IntelIWidgets.registrar('acelerometro-eixos', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Equipamento com o rastreador e as leituras dos três eixos do acelerômetro em g' }, elemento);

    // Chão, equipamento e rastreador.
    el('line', { x1: 30, y1: 360, x2: 420, y2: 360, style: 'stroke: var(--seg-texto); stroke-width: 3' }, svg);
    var grupo = el('g', {}, svg);
    el('rect', { x: 130, y: 200, width: 160, height: 160, style: 'fill: var(--seg-borda); stroke: var(--seg-texto); stroke-width: 3' }, grupo);
    texto({ x: 210, y: 290, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, 'equipamento', grupo);
    el('rect', { x: 180, y: 176, width: 60, height: 24, style: 'fill: var(--seg-primaria)' }, grupo);
    // Eixos do sensor, presos ao equipamento: giram junto quando ele tomba.
    el('path', { d: 'M210 188 H270 M210 188 V128', style: 'stroke: var(--seg-destaque); stroke-width: 3; fill: none' }, grupo);
    texto({ x: 278, y: 194, 'class': 'anim-rotulo mono', 'text-anchor': 'start' }, 'X', grupo);
    texto({ x: 204, y: 120, 'class': 'anim-rotulo mono', 'text-anchor': 'start' }, 'Z', grupo);
    texto({ x: 30, y: 400, 'class': 'anim-rotulo', 'text-anchor': 'start' }, 'gravidade: 1 g para baixo', svg);

    // Barras dos eixos e do desvio.
    var linhas = ['X', 'Y', 'Z'].map(function (nome, i) {
      var yy = 70 + i * 70;
      texto({ x: BX0 - 14, y: yy + 22, 'class': 'anim-rotulo mono', 'text-anchor': 'end' }, nome, svg);
      el('rect', { x: BX0, y: yy, width: BX1 - BX0, height: 34, style: 'fill: var(--seg-superficie)' }, svg);
      var barra = el('rect', { y: yy, height: 34, style: 'fill: var(--seg-primaria)' }, svg);
      var valor = texto({ x: BX1, y: yy + 56, 'class': 'anim-rotulo mono', 'text-anchor': 'end' }, '', svg);
      return { barra: barra, valor: valor };
    });
    el('line', { x1: bx(0), x2: bx(0), y1: 60, y2: 284, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    texto({ x: bx(-1.5), y: 46, 'class': 'anim-rotulo mono', 'text-anchor': 'start' }, '-1,5 g', svg);
    texto({ x: bx(1.5), y: 46, 'class': 'anim-rotulo mono', 'text-anchor': 'end' }, '+1,5 g', svg);

    var DX0 = BX0, DX1 = BX1, DMAX = 1.5;
    function dx(g) { return DX0 + (DX1 - DX0) * Math.min(g, DMAX) / DMAX; }
    texto({ x: DX0, y: 316, 'class': 'anim-rotulo', 'text-anchor': 'start' }, 'desvio da instalação', svg);
    el('rect', { x: DX0, y: 328, width: DX1 - DX0, height: 34, style: 'fill: var(--seg-superficie)' }, svg);
    var barraDesvio = el('rect', { x: DX0, y: 328, height: 34, style: 'fill: var(--seg-secundaria)' }, svg);
    el('line', { x1: dx(LIMIAR), x2: dx(LIMIAR), y1: 320, y2: 370, style: 'stroke: var(--seg-destaque); stroke-width: 3; stroke-dasharray: 5 4' }, svg);
    texto({ x: dx(LIMIAR), y: 394, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, 'limiar 0,26 g', svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Três eixos, três situações', painel);
    html('p', null, 'Antes de escolher: com o equipamento tombado de lado, o eixo Z continua lendo 1 g?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var detalhe = html('p', 'mono', '', painel);
    var gModo = html('div', 'widget-controles', null, painel);
    var bParado = html('button', null, 'Parado', gModo);
    var bTombado = html('button', null, 'Tombado', gModo);
    var bTransporte = html('button', null, 'Em transporte', gModo);
    var confirmacao = html('p', null, '', painel);
    html('p', null, 'O firmware confirma o evento depois de 3 amostras seguidas acima do limiar.', painel);

    var modo = 'parado';
    var k = 0;
    var acima = 0;
    var ultimo = 0;

    // Pico do desvio num ciclo de transporte, calculado uma vez.
    var pico = 0;
    for (var i = 0; i < 200; i++) pico = Math.max(pico, desvio(vibracao(i)));

    function leitura() {
      if (modo === 'tombado') return [-1, 0, 0];   // X aponta para baixo depois do giro
      if (modo === 'transporte') return vibracao(k);
      return [0, 0, 1];
    }

    function classificar(a, d) {
      if (d <= LIMIAR) return 'parado';
      var modulo = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
      // Só a gravidade, girada: mudou a orientação. Módulo longe de 1 g: há aceleração própria.
      return Math.abs(modulo - 1) < 0.1 ? 'remoção' : 'movimento';
    }

    function desenhar() {
      var a = leitura();
      var d = desvio(a);
      a.forEach(function (g, j) {
        var x0 = bx(Math.min(0, g)), x1 = bx(Math.max(0, g));
        linhas[j].barra.setAttribute('x', x0.toFixed(1));
        linhas[j].barra.setAttribute('width', Math.max(1, x1 - x0).toFixed(1));
        linhas[j].valor.textContent = decimal(g, 2) + ' g';
      });
      barraDesvio.setAttribute('width', Math.max(1, dx(d) - DX0).toFixed(1));
      medida.textContent = 'desvio ' + decimal(d, 2) + ' g · ' + classificar(a, d);
      detalhe.textContent = 'a = (' + a.map(function (g) { return decimal(g, 2); }).join('; ') + ') g';
      confirmacao.textContent = 'Amostras seguidas acima do limiar: ' + Math.min(acima, CONFIRMACAO) + ' de ' + CONFIRMACAO +
        (acima >= CONFIRMACAO ? ' · evento confirmado' : '');
      var giro = modo === 'tombado' ? 'translate(-120 0) rotate(90 290 360)' : '';
      if (modo === 'transporte') giro = 'translate(' + (6 * a[0] / 0.12).toFixed(1) + ' ' + (-20 * (a[2] - 1)).toFixed(1) + ')';
      grupo.setAttribute('transform', giro);
      bParado.classList.toggle('ativo', modo === 'parado');
      bTombado.classList.toggle('ativo', modo === 'tombado');
      bTransporte.classList.toggle('ativo', modo === 'transporte');
    }

    function amostrar() {
      acima = desvio(leitura()) > LIMIAR ? acima + 1 : 0;
    }

    // Amostra a cada 500 ms, como o INTERVALO_MS do laboratório, enquanto o slide está em cena.
    function quadro(t) {
      if (visivel(elemento) && t - ultimo >= 500) {
        ultimo = t;
        if (modo === 'transporte') k += 1;
        amostrar();
        desenhar();
      }
      window.setTimeout(function () { window.requestAnimationFrame(quadro); }, 100);
    }

    function trocar(novo) {
      modo = novo;
      k = 0;
      acima = 0;
      amostrar();
      desenhar();
    }

    elemento.dataset.pico = pico.toFixed(2);
    bParado.addEventListener('click', function () { trocar('parado'); });
    bTombado.addEventListener('click', function () { trocar('tombado'); });
    bTransporte.addEventListener('click', function () { trocar('transporte'); });
    desenhar();
    window.requestAnimationFrame(quadro);
  });
})();
