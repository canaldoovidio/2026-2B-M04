// Animação da Aula 07: endereçamento no barramento I2C com dois dispositivos.
// O ESP32 (mestre) chama um endereço de 7 bits pelos fios SDA e SCL, que o LCD
// (módulo PCF8574, 0x27) e o acelerômetro MPU6050 (0x68) dividem. Só o
// dispositivo com aquele endereço responde com ACK; se ninguém tem o endereço,
// o mestre lê NACK. O botão Varrer chama de 0x08 a 0x77, como o scanner I2C do
// laboratório. Endereços: datasheet NXP PCF8574/PCF8574A, seção 7.1, e
// documentação da peça wokwi-mpu6050. Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var X_INI = 120, X_FIM = 690;
  var Y_SDA = 180, Y_SCL = 220;
  var DISPOSITIVOS = [
    { nome: 'LCD (PCF8574)', endereco: 0x27, x: 300 },
    { nome: 'MPU6050', endereco: 0x68, x: 510 }
  ];
  var CHAMADAS = [0x27, 0x68, 0x3F];
  var PRIMEIRO = 0x08, ULTIMO = 0x77;
  var MS_POR_ENDERECO = 20;
  var MS_PULSO = 1200;

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
    var t = el('text', { x: x, y: y, 'class': classe || 'anim-rotulo', 'text-anchor': ancora || 'middle' }, pai);
    t.textContent = conteudo;
    return t;
  }

  function hex(n) { return '0x' + (n < 16 ? '0' : '') + n.toString(16).toUpperCase(); }
  function bits(n) { var b = n.toString(2); while (b.length < 7) b = '0' + b; return b; }

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  IntelIWidgets.registrar('barramento-i2c', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Barramento I2C com o ESP32 como mestre e dois dispositivos, LCD em 0x27 e MPU6050 em 0x68, nos mesmos fios SDA e SCL' }, elemento);

    // Byte de endereço: 7 bits de endereço e o bit de leitura ou escrita.
    texto(svg, 40, 66, 'byte', 'start');
    var celulas = [];
    for (var i = 0; i < 8; i++) {
      var x = 130 + i * 62;
      el('rect', { x: x, y: 36, width: 54, height: 44, style: 'fill: var(--seg-superficie); stroke: var(--seg-borda); stroke-width: 1.5' }, svg);
      texto(svg, x + 27, 28, i < 7 ? 'A' + (6 - i) : 'R/W', 'middle', 'anim-rotulo mono');
      celulas.push(texto(svg, x + 27, 66, i < 7 ? '' : '0', 'middle', 'anim-rotulo mono'));
    }
    texto(svg, 130, 106, 'R/W = 0: o mestre vai escrever', 'start');

    // Resistores de pull-up até 3,3 V.
    texto(svg, 70, 136, '3,3 V', 'middle', 'anim-rotulo mono');
    [Y_SDA, Y_SCL].forEach(function (y, k) {
      var xr = 150 + k * 30;
      el('line', { x1: xr, y1: 144, x2: xr, y2: y, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
      el('rect', { x: xr - 6, y: 148, width: 12, height: 22, style: 'fill: var(--seg-base); stroke: var(--seg-texto); stroke-width: 2' }, svg);
    });
    el('line', { x1: 100, y1: 144, x2: 180, y2: 144, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);

    // Mestre e fios.
    el('rect', { x: 20, y: 160, width: 90, height: 80, style: 'fill: var(--seg-primaria)' }, svg);
    var tMestre = texto(svg, 65, 206, 'ESP32', 'middle');
    tMestre.style.fill = 'var(--seg-base)';
    el('line', { x1: 110, y1: Y_SDA, x2: X_FIM, y2: Y_SDA, 'class': 'anim-fio', style: 'stroke-width: 4' }, svg);
    el('line', { x1: 110, y1: Y_SCL, x2: X_FIM, y2: Y_SCL, 'class': 'anim-fio', style: 'stroke: var(--seg-secundaria); stroke-width: 4' }, svg);
    texto(svg, X_FIM, Y_SDA - 10, 'SDA, GPIO 21', 'end');
    texto(svg, X_FIM, Y_SCL + 26, 'SCL, GPIO 22', 'end');

    var caixas = DISPOSITIVOS.map(function (d) {
      el('line', { x1: d.x + 50, y1: Y_SDA, x2: d.x + 50, y2: 300, style: 'stroke: var(--seg-primaria); stroke-width: 3' }, svg);
      el('line', { x1: d.x + 110, y1: Y_SCL, x2: d.x + 110, y2: 300, style: 'stroke: var(--seg-secundaria); stroke-width: 3' }, svg);
      el('circle', { cx: d.x + 50, cy: Y_SDA, r: 5, style: 'fill: var(--seg-primaria)' }, svg);
      el('circle', { cx: d.x + 110, cy: Y_SCL, r: 5, style: 'fill: var(--seg-secundaria)' }, svg);
      var caixa = el('rect', { x: d.x, y: 300, width: 170, height: 84, style: 'fill: var(--seg-base); stroke: var(--seg-primaria); stroke-width: 2.5' }, svg);
      texto(svg, d.x + 85, 334, d.nome);
      texto(svg, d.x + 85, 364, hex(d.endereco), 'middle', 'anim-rotulo mono');
      var resposta = texto(svg, d.x + 85, 414, '');
      return { d: d, caixa: caixa, resposta: resposta };
    });
    var nack = texto(svg, 65, 290, '');
    var pulso = el('circle', { r: 9, cy: Y_SDA, cx: 110, style: 'fill: var(--seg-destaque); stroke: var(--seg-base); stroke-width: 3; display: none' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Dois dispositivos, os mesmos dois fios', painel);
    html('p', null, 'Antes de mexer: a IA sugeriu 0x3F para o LCD. Se o ESP32 chamar 0x3F, quem responde?', painel);
    var leitura = html('p', 'anim-medida mono', 'escolha um endereço', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    var mapaBotoes = {};
    CHAMADAS.forEach(function (a) { mapaBotoes[hex(a)] = html('button', null, hex(a), botoes); });
    var bVarrer = html('button', null, 'Varrer', botoes);
    html('p', null, 'Varrer chama cada endereço de 0x08 a 0x77 e anota quem responde com ACK, como o scanner do laboratório.', painel);

    var modo = null;       // 'pulso' ou 'varredura'
    var inicio = null;
    var progresso = 0;     // ms de animação já decorridos com o slide visível
    var alvo = null;
    var achados = [];

    function quem(endereco) {
      for (var k = 0; k < caixas.length; k++) if (caixas[k].d.endereco === endereco) return caixas[k];
      return null;
    }

    function mostrarBits(endereco) {
      var b = bits(endereco);
      for (var k = 0; k < 7; k++) celulas[k].textContent = b.charAt(k);
    }

    function limpar() {
      caixas.forEach(function (c) { c.caixa.style.fill = 'var(--seg-base)'; c.resposta.textContent = ''; });
      nack.textContent = '';
      Object.keys(mapaBotoes).forEach(function (k) { mapaBotoes[k].classList.remove('ativo'); });
      bVarrer.classList.remove('ativo');
    }

    function marcarResposta(endereco) {
      var c = quem(endereco);
      if (c) { c.caixa.style.fill = 'var(--seg-secundaria)'; c.resposta.textContent = 'ACK'; }
      else { nack.textContent = 'NACK'; }
    }

    function quadro(t) {
      if (!modo) return;
      if (visivel(elemento)) {
        if (inicio === null) inicio = t - progresso;
        progresso = t - inicio;
        if (modo === 'pulso') {
          var f = Math.min(1, progresso / MS_PULSO);
          pulso.style.display = '';
          pulso.setAttribute('cx', (110 + (X_FIM - 110) * f).toFixed(1));
          if (f >= 1) { pulso.style.display = 'none'; marcarResposta(alvo); modo = null; }
        } else {
          var n = Math.min(ULTIMO - PRIMEIRO + 1, Math.floor(progresso / MS_POR_ENDERECO) + 1);
          var atual = PRIMEIRO + n - 1;
          mostrarBits(atual);
          achados = [];
          for (var a = PRIMEIRO; a <= atual; a++) if (quem(a)) { achados.push(a); marcarResposta(a); }
          if (atual >= ULTIMO) {
            leitura.textContent = achados.length + ' dispositivos: ' + achados.map(hex).join(', ');
            modo = null;
          } else {
            leitura.textContent = 'varrendo ' + hex(atual);
          }
        }
      } else {
        inicio = null;
      }
      if (modo) window.requestAnimationFrame(quadro);
    }

    function iniciar(novoModo) {
      var parado = !modo;
      modo = novoModo; inicio = null; progresso = 0;
      if (parado) window.requestAnimationFrame(quadro);
    }

    CHAMADAS.forEach(function (a) {
      mapaBotoes[hex(a)].addEventListener('click', function () {
        limpar();
        mapaBotoes[hex(a)].classList.add('ativo');
        alvo = a;
        mostrarBits(a);
        leitura.textContent = hex(a) + ' · ' + bits(a) + ' · ' + (quem(a) ? 'ACK' : 'NACK');
        iniciar('pulso');
      });
    });
    bVarrer.addEventListener('click', function () {
      limpar();
      bVarrer.classList.add('ativo');
      pulso.style.display = 'none';
      leitura.textContent = 'varrendo ' + hex(PRIMEIRO);
      iniciar('varredura');
    });
  });
})();
