// Animação da Aula 01: o que está ligado por dentro da protoboard.
// Passos guiados (Anterior, Próximo) e passagem do ponteiro sobre qualquer furo,
// que acende o grupo de furos ligado a ele. O último passo mostra o erro comum
// de pôr as duas pernas do LED na mesma coluna. Sem cor literal.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var COLUNAS = 24;
  var X0 = 60;
  var PASSO = 25;
  // Linhas do miolo: a-e acima da canaleta, f-j abaixo. Trilhos: dois em cima, dois embaixo.
  var Y_TRILHO = { 'sup+': 40, 'sup-': 62, 'inf+': 378, 'inf-': 400 };
  var Y_LINHA = { a: 110, b: 135, c: 160, d: 185, e: 210, f: 260, g: 285, h: 310, i: 335, j: 360 };

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

  function grupoDe(furo) {
    if (furo.trilho) return 'trilho-' + furo.trilho;
    var metade = 'abcde'.indexOf(furo.linha) >= 0 ? 'sup' : 'inf';
    return 'coluna-' + furo.coluna + '-' + metade;
  }

  var PASSOS = [
    { titulo: 'Preveja antes de avançar',
      texto: 'Quais furos você acha que estão ligados entre si por dentro? Passe o ponteiro sobre um furo para testar a hipótese.',
      grupos: [], led: null },
    { titulo: 'Cada meia coluna é um único fio',
      texto: 'Os cinco furos de a até e numa mesma coluna estão ligados por uma lâmina metálica. O mesmo vale para f até j.',
      grupos: ['coluna-6-sup', 'coluna-6-inf'], led: null },
    { titulo: 'A canaleta central separa as metades',
      texto: 'A coluna 6 de cima (em verde) não está ligada à coluna 6 de baixo (contorno vermelho). Por isso um circuito integrado é montado atravessando a canaleta.',
      grupos: ['coluna-6-sup'], contraste: ['coluna-6-inf'], led: null },
    { titulo: 'Os trilhos correm na horizontal',
      texto: 'Os trilhos marcados com + e − estão ligados na horizontal. Um leva 5 V, o outro leva GND.',
      grupos: ['trilho-sup+', 'trilho-sup-'], led: null },
    { titulo: 'LED montado do jeito certo',
      texto: 'Cada perna do LED fica numa coluna diferente. A corrente entra por uma coluna, passa pelo LED e sai pela outra.',
      grupos: ['coluna-10-sup', 'coluna-11-sup'], led: { a: 10, b: 11, certo: true } },
    { titulo: 'Erro comum: pernas na mesma coluna',
      texto: 'As duas pernas na mesma coluna ficam ligadas pela lâmina: a corrente desvia do LED e ele não acende.',
      grupos: ['coluna-15-sup'], led: { a: 15, b: 15, certo: false } }
  ];

  IntelIWidgets.registrar('protoboard', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Protoboard com trilhos de alimentação, colunas e canaleta central' }, elemento);
    el('rect', { x: 30, y: 20, width: 660, height: 400, rx: 14,
      style: 'fill: var(--seg-superficie); stroke: var(--seg-borda); stroke-width: 3' }, svg);
    el('rect', { x: 40, y: 228, width: 640, height: 16, rx: 4, style: 'fill: var(--seg-borda)' }, svg);

    var furos = [];
    function criarFuro(x, y, dados) {
      var c = el('circle', { cx: x, cy: y, r: 6.5, style: 'fill: var(--seg-base); stroke: var(--seg-texto-suave); stroke-width: 1.5; cursor: pointer' }, svg);
      dados.no = c;
      dados.grupo = grupoDe(dados);
      furos.push(dados);
      c.addEventListener('mouseenter', function () { destacar([dados.grupo]); });
      c.addEventListener('mouseleave', function () { aplicarPasso(); });
    }
    Object.keys(Y_TRILHO).forEach(function (t) {
      for (var k = 0; k < COLUNAS; k++) {
        if (k % 6 === 5) continue;
        criarFuro(X0 + k * PASSO, Y_TRILHO[t], { trilho: t });
      }
    });
    Object.keys(Y_LINHA).forEach(function (linha) {
      for (var k = 0; k < COLUNAS; k++) {
        criarFuro(X0 + k * PASSO, Y_LINHA[linha], { linha: linha, coluna: k + 1 });
      }
    });
    [['+', 40], ['−', 62], ['+', 378], ['−', 400]].forEach(function (r) {
      var t = el('text', { x: 44, y: r[1] + 6, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, svg);
      t.textContent = r[0];
    });

    var camadaLed = el('g', {}, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    var titulo = html('h4', null, '', painel);
    var texto = html('p', null, '', painel);
    var contador = html('p', 'mono', '', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    var bAnterior = html('button', null, 'Anterior', botoes);
    var bProximo = html('button', null, 'Próximo', botoes);
    var passo = 0;

    // contraste: grupos mostrados em contorno, para comparar com os ligados
    // (passo 3: a meia coluna de baixo não está ligada à de cima).
    function destacar(grupos, contraste) {
      var outros = contraste || [];
      furos.forEach(function (f) {
        var ligado = grupos.indexOf(f.grupo) >= 0;
        var comparado = outros.indexOf(f.grupo) >= 0;
        var erro = PASSOS[passo].led && !PASSOS[passo].led.certo && ligado;
        f.no.style.fill = ligado ? (erro ? 'var(--seg-destaque)' : 'var(--seg-secundaria)') : 'var(--seg-base)';
        f.no.style.stroke = comparado ? 'var(--seg-destaque)' : 'var(--seg-texto-suave)';
        f.no.style.strokeWidth = comparado ? '3' : '1.5';
        f.no.setAttribute('r', ligado || comparado ? '8' : '6.5');
      });
    }

    function desenharLed(led) {
      while (camadaLed.firstChild) camadaLed.removeChild(camadaLed.firstChild);
      if (!led) return;
      var xa = X0 + (led.a - 1) * PASSO;
      var xb = X0 + (led.b - 1) * PASSO;
      var ya = Y_LINHA.c;
      var yb = led.certo ? Y_LINHA.c : Y_LINHA.e;
      var cx = (xa + xb) / 2;
      el('line', { x1: xa, y1: ya, x2: cx - 6, y2: 150 - 40, style: 'stroke: var(--seg-texto); stroke-width: 3' }, camadaLed);
      el('line', { x1: xb, y1: yb, x2: cx + 6, y2: 150 - 40, style: 'stroke: var(--seg-texto); stroke-width: 3' }, camadaLed);
      el('circle', { cx: cx, cy: 96, r: 16,
        style: 'fill: var(--seg-destaque); stroke: var(--seg-primaria); stroke-width: 3; opacity: ' + (led.certo ? '1' : '0.35') }, camadaLed);
      if (!led.certo) {
        el('path', { d: 'M' + (cx - 12) + ' 84 l24 24 M' + (cx + 12) + ' 84 l-24 24',
          style: 'stroke: var(--seg-primaria); stroke-width: 4; stroke-linecap: round' }, camadaLed);
      }
    }

    function aplicarPasso() {
      var p = PASSOS[passo];
      titulo.textContent = p.titulo;
      texto.textContent = p.texto;
      contador.textContent = 'Passo ' + (passo + 1) + ' de ' + PASSOS.length;
      bAnterior.disabled = passo === 0;
      bProximo.disabled = passo === PASSOS.length - 1;
      destacar(p.grupos, p.contraste);
      desenharLed(p.led);
    }

    bAnterior.addEventListener('click', function () { if (passo > 0) { passo -= 1; aplicarPasso(); } });
    bProximo.addEventListener('click', function () { if (passo < PASSOS.length - 1) { passo += 1; aplicarPasso(); } });
    aplicarPasso();
  });
})();
