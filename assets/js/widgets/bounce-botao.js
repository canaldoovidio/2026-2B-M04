// Animação da Aula 02: o bounce do botão e as duas formas de filtrá-lo.
// Três trilhas no mesmo eixo de tempo, com o nível do pino em INPUT_PULLUP:
// HIGH com o botão solto, LOW com o botão apertado. A primeira trilha é o
// contato bruto, a segunda o sinal depois de um filtro RC (com os limiares de
// entrada do ATmega328P, 0,3 e 0,6 de Vcc) e a terceira o estado decidido pelo
// firmware com janela de debounce. Os contadores somam as descidas para LOW, que
// o Arduino lê como apertos, num aperto seguido de soltura. Sem cor literal;
// desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var T_MAX = 40;          // ms mostrados no eixo
  var DT = 0.05;           // passo da simulação, ms
  var LIMIAR_ALTO = 0.6;   // fração de Vcc lida como HIGH
  var LIMIAR_BAIXO = 0.3;  // fração de Vcc lida como LOW
  // Instantes (ms) em que o contato troca de estado: o aperto em 5 ms quica até
  // 8,2 ms; a soltura em 30 ms quica até 32,2 ms.
  var TROCAS = [5.0, 5.4, 5.9, 6.3, 7.0, 7.4, 8.2, 30.0, 30.5, 31.1, 31.4, 32.2];
  var X0 = 150;
  var LARGURA = 500;
  var TRILHAS = [
    { nome: 'Contato bruto', y: 40 },
    { nome: 'Com filtro RC', y: 170 },
    { nome: 'Firmware', y: 300 }
  ];
  var ALTURA = 80;

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

  function bruto(t) {
    var estado = 0;
    for (var i = 0; i < TROCAS.length; i++) {
      if (t >= TROCAS[i]) estado = 1 - estado;
    }
    return estado;
  }

  function simular(tauMs, janelaMs) {
    var n = Math.round(T_MAX / DT);
    var b = [], rc = [], leituraRc = [], fw = [];
    var y = 1, lido = 1, estavel = 1, ultimoValor = 1, desde = 0;
    var subidas = { bruto: 0, rc: 0, fw: 0 };
    for (var k = 0; k <= n; k++) {
      var t = k * DT;
      var x = 1 - bruto(t);           // nível do pino: apertado é LOW
      y = tauMs <= 0 ? x : y + (x - y) * Math.min(DT / tauMs, 1);
      var novoLido = lido;
      if (y > LIMIAR_ALTO) novoLido = 1;
      else if (y < LIMIAR_BAIXO) novoLido = 0;
      if (x !== ultimoValor) { ultimoValor = x; desde = t; }
      var novoEstavel = estavel;
      if (t - desde >= janelaMs && x !== estavel) novoEstavel = x;
      if (k > 0) {
        if (x === 0 && b[k - 1] === 1) subidas.bruto += 1;
        if (novoLido === 0 && lido === 1) subidas.rc += 1;
        if (novoEstavel === 0 && estavel === 1) subidas.fw += 1;
      }
      lido = novoLido;
      estavel = novoEstavel;
      b.push(x); rc.push(y); leituraRc.push(lido); fw.push(estavel);
    }
    return { b: b, rc: rc, leituraRc: leituraRc, fw: fw, subidas: subidas };
  }

  function caminho(valores, trilha, limite) {
    var pontos = [];
    var ate = Math.min(valores.length, limite);
    for (var k = 0; k < ate; k++) {
      var x = X0 + LARGURA * (k * DT) / T_MAX;
      var y = trilha.y + ALTURA - valores[k] * ALTURA;
      pontos.push((k === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1));
    }
    return pontos.join(' ');
  }

  IntelIWidgets.registrar('bounce-botao', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Sinal de um botão ao longo de 40 milissegundos: contato bruto, com filtro RC e com debounce por firmware' }, elemento);

    TRILHAS.forEach(function (tr) {
      el('rect', { x: X0, y: tr.y - 6, width: LARGURA, height: ALTURA + 12, rx: 6,
        style: 'fill: var(--seg-superficie)' }, svg);
      var t = el('text', { x: X0 - 12, y: tr.y + ALTURA / 2 + 6, 'class': 'anim-rotulo', 'text-anchor': 'end' }, svg);
      t.textContent = tr.nome;
    });
    [[0.6, '0,6 Vcc'], [0.3, '0,3 Vcc']].forEach(function (par) {
      var yl = TRILHAS[1].y + ALTURA - par[0] * ALTURA;
      el('line', { x1: X0, x2: X0 + LARGURA, y1: yl, y2: yl,
        style: 'stroke: var(--seg-destaque); stroke-width: 1.5; stroke-dasharray: 6 5' }, svg);
      var rl = el('text', { x: X0 + LARGURA + 6, y: yl + 5, 'class': 'anim-codigo mono', 'text-anchor': 'start',
        style: 'font-size: 13px' }, svg);
      rl.textContent = par[1];
    });
    var solto = el('text', { x: X0 + 4, y: 24, 'class': 'anim-codigo', 'text-anchor': 'start', style: 'font-size: 14px' }, svg);
    solto.textContent = 'alto: solto (HIGH) · baixo: apertado (LOW)';
    [0, 10, 20, 30, 40].forEach(function (ms) {
      var x = X0 + LARGURA * ms / T_MAX;
      var t = el('text', { x: x, y: 425, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, svg);
      t.textContent = ms + ' ms';
    });

    var linhas = [
      el('path', { style: 'fill: none; stroke: var(--seg-primaria); stroke-width: 3' }, svg),
      el('path', { style: 'fill: none; stroke: var(--seg-secundaria); stroke-width: 3' }, svg),
      el('path', { style: 'fill: none; stroke: var(--seg-primaria); stroke-width: 2; stroke-dasharray: 7 5' }, svg),
      el('path', { style: 'fill: none; stroke: var(--seg-primaria); stroke-width: 3' }, svg)
    ];
    var cursor = el('line', { y1: 28, y2: 400, style: 'stroke: var(--seg-texto); stroke-width: 1.5; opacity: 0.6' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Quantos apertos o Arduino conta?', painel);
    html('p', null, 'Antes de apertar: num aperto seguido de soltura, sem filtro nenhum, quantas vezes o pino desce para LOW?', painel);
    var contagem = html('p', 'anim-medida mono', '', painel);
    var rotTau = html('p', null, '', painel);
    var tau = html('input', null, null, painel);
    tau.type = 'range'; tau.min = '0'; tau.max = '4'; tau.step = '0.1'; tau.value = '0';
    tau.setAttribute('aria-label', 'Constante de tempo do filtro RC em milissegundos');
    var rotJanela = html('p', null, '', painel);
    var janela = html('input', null, null, painel);
    janela.type = 'range'; janela.min = '0'; janela.max = '10'; janela.step = '0.5'; janela.value = '0';
    janela.setAttribute('aria-label', 'Janela de debounce do firmware em milissegundos');
    var botoes = html('div', 'widget-controles', null, painel);
    var bApertar = html('button', null, 'Apertar o botão', botoes);

    var sim = null;
    var limite = Infinity;
    var animando = false;
    var inicio = null;

    function desenhar() {
      linhas[0].setAttribute('d', caminho(sim.b, TRILHAS[0], limite));
      linhas[1].setAttribute('d', caminho(sim.rc, TRILHAS[1], limite));
      // Tracejado: o que o pino lê do sinal filtrado, com os limiares de 30% e 60%.
      linhas[2].setAttribute('d', caminho(sim.leituraRc, TRILHAS[1], limite));
      linhas[3].setAttribute('d', caminho(sim.fw, TRILHAS[2], limite));
      var tAtual = Math.min(limite, sim.b.length) * DT;
      var x = X0 + LARGURA * Math.min(tAtual, T_MAX) / T_MAX;
      cursor.setAttribute('x1', x.toFixed(1));
      cursor.setAttribute('x2', x.toFixed(1));
    }

    function recalcular() {
      sim = simular(Number(tau.value), Number(janela.value));
      rotTau.textContent = 'Filtro RC: constante de tempo de ' + String(tau.value).replace('.', ',') + ' ms';
      rotJanela.textContent = 'Firmware: janela de ' + String(janela.value).replace('.', ',') + ' ms';
      contagem.textContent = 'bruto ' + sim.subidas.bruto + ' · RC ' + sim.subidas.rc + ' · firmware ' + sim.subidas.fw;
      desenhar();
    }

    function quadro(t) {
      if (!animando) return;
      if (inicio === null) inicio = t;
      // 40 ms de sinal mostrados em 3 s de tela.
      limite = Math.round(((t - inicio) / 3000) * T_MAX / DT);
      if (limite >= sim.b.length) { limite = Infinity; animando = false; }
      desenhar();
      if (animando) window.requestAnimationFrame(quadro);
    }

    tau.addEventListener('input', recalcular);
    janela.addEventListener('input', recalcular);
    bApertar.addEventListener('click', function () {
      animando = true; inicio = null; limite = 0;
      window.requestAnimationFrame(quadro);
    });
    recalcular();
  });
})();
