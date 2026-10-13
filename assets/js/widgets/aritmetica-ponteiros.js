// Animação da Aula 04: aritmética de ponteiros.
// 32 bytes de memória em duas linhas de 16, a partir de um endereço de exemplo.
// O aluno escolhe o tipo apontado (char, int ou Evento) e o deslocamento k, e vê
// que p + k anda k × sizeof(tipo) bytes. Tamanhos no ESP32: char 1 byte, int
// 4 bytes (arquitetura de 32 bits), Evento 8 bytes (dois uint32_t). O endereço
// real é o que o laboratório imprime na serial.
// Sem cor literal; desenho só pelo viewBox; sem laço de animação contínuo.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var BASE = 0x3FFB0010;
  var X0 = 120, LARG = 35, ALT = 60;
  var LINHAS_Y = [120, 270];
  var TIPOS = [
    { nome: 'char', tam: 1, rotulo: 'char' },
    { nome: 'int', tam: 4, rotulo: 'int' },
    { nome: 'Evento', tam: 8, rotulo: 'Evento' }
  ];

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

  // Sem laço contínuo, mas a função segue o contrato dos widgets do acervo:
  // a transição só roda quando o slide está em cena.
  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  function hex(n) { return '0x' + n.toString(16).toUpperCase(); }

  function posicao(byte) {
    return { x: X0 + LARG * (byte % 16), y: LINHAS_Y[Math.floor(byte / 16)] };
  }

  IntelIWidgets.registrar('aritmetica-ponteiros', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Trinta e dois bytes de memória com o ponteiro p e o ponteiro p mais k' }, elemento);

    var bytes = [];
    for (var b = 0; b < 32; b++) {
      var pos = posicao(b);
      bytes.push(el('rect', { x: pos.x, y: pos.y, width: LARG, height: ALT,
        style: 'stroke: var(--seg-texto); stroke-width: 1.5' }, svg));
      var dig = el('text', { x: pos.x + LARG / 2, y: pos.y + ALT + 20, 'class': 'anim-codigo mono', 'text-anchor': 'middle',
        style: 'font-size: 14px' }, svg);
      dig.textContent = (b % 16).toString(16).toUpperCase();
    }
    LINHAS_Y.forEach(function (y, i) {
      var r = el('text', { x: X0 - 8, y: y + ALT / 2 + 5, 'class': 'anim-codigo mono', 'text-anchor': 'end',
        style: 'font-size: 14px' }, svg);
      r.textContent = hex(BASE + 16 * i);
    });
    var nota = el('text', { x: X0, y: 30, 'class': 'anim-codigo', 'text-anchor': 'start', style: 'font-size: 15px' }, svg);
    nota.textContent = 'cada quadrado é 1 byte; embaixo, o último dígito do endereço';

    function marcador(cor, alturaRotulo) {
      var g = el('g', {}, svg);
      el('path', { d: 'M -10 -20 L 10 -20 L 0 -4 Z', style: 'fill: ' + cor }, g);
      var t = el('text', { x: 0, y: alturaRotulo, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, g);
      return { g: g, t: t };
    }
    var mP = marcador('var(--seg-primaria)', -26);
    mP.t.textContent = 'p';
    var mK = marcador('var(--seg-destaque)', -50);
    el('line', { x1: 0, y1: -44, x2: 0, y2: -20, style: 'stroke: var(--seg-destaque); stroke-width: 2' }, mK.g);

    var formula = el('text', { x: 360, y: 400, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('p', null, 'Antes de mexer: p aponta para um int em 0x3FFB0010. Para que endereço aponta p + 1?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    medida.style.fontSize = '24px';
    var explica = html('p', null, '', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    var bTipos = TIPOS.map(function (tipo, i) {
      var bt = html('button', null, tipo.rotulo, botoes);
      bt.addEventListener('click', function () { atual = i; desenhar(); });
      return bt;
    });
    var rotK = html('p', null, '', painel);
    var controleK = html('input', null, null, painel);
    controleK.type = 'range'; controleK.min = '0'; controleK.max = '3'; controleK.step = '1'; controleK.value = '0';
    controleK.setAttribute('aria-label', 'Deslocamento k somado ao ponteiro');
    html('p', null, 'Endereço de exemplo; o real sai na serial do laboratório.', painel);

    var atual = 1;

    function desenhar() {
      var tipo = TIPOS[atual];
      var k = Number(controleK.value);
      var alvo = k * tipo.tam;
      for (var b = 0; b < 32; b++) {
        var elem = Math.floor(b / tipo.tam);
        var cor = 'var(--seg-base)';
        if (elem < k) cor = 'var(--seg-superficie)';
        if (elem === 0) cor = 'var(--seg-secundaria)';
        if (elem === k && k > 0) cor = 'var(--seg-destaque)';
        bytes[b].style.fill = cor;
      }
      var p0 = posicao(0);
      mP.g.style.transform = 'translate(' + (p0.x + LARG / 2) + 'px, ' + p0.y + 'px)';
      var pk = posicao(alvo);
      var mesmo = k === 0;
      mK.g.style.display = mesmo ? 'none' : '';
      mK.g.style.transform = 'translate(' + (pk.x + LARG / 2) + 'px, ' + pk.y + 'px)';
      mK.t.textContent = 'p + ' + k;
      if (visivel(elemento)) mK.g.style.transition = 'transform 0.3s ease';
      bTipos.forEach(function (bt, i) { bt.classList.toggle('ativo', i === atual); });
      rotK.textContent = 'k = ' + k;
      medida.textContent = 'p + ' + k + ' = ' + hex(BASE + alvo);
      explica.textContent = k === 0
        ? 'Mesmo endereço de p: 0 × sizeof(' + tipo.nome + ').'
        : alvo + (alvo === 1 ? ' byte' : ' bytes') + ' adiante de p: ' + k + ' × sizeof(' + tipo.nome + ') = ' + k + ' × ' + tipo.tam + '.';
      formula.textContent = tipo.nome + ' *p;   p + ' + k + ' = ' + hex(BASE) + ' + ' + k + ' × ' + tipo.tam;
    }

    controleK.addEventListener('input', desenhar);
    desenhar();
  });
})();
