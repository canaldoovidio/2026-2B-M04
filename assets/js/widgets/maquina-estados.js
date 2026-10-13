// Animação da Aula 03: máquina de estados do ciclo do equipamento.
// Quatro estados (cadastrado, em trânsito, no fornecedor, retornado) e quatro
// eventos (saída, chegada, retorno, liberação). Cada estado aceita um único
// evento; os outros três são recusados e o estado não muda, como no switch do
// laboratório. A transição que sai do estado atual fica acesa. Uma transição
// aceita desloca um marcador ao longo da seta, calculado por interpolação
// linear entre as pontas (nada de medir layout). Sem cor literal; desenho só
// pelo viewBox. Prever, observar, explicar: a previsão vem antes dos botões.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var LARG = 210, ALT = 72;
  var ESTADOS = [
    { id: 'cadastrado', rotulo: 'cadastrado', x: 150, y: 90 },
    { id: 'transito', rotulo: 'em trânsito', x: 570, y: 90 },
    { id: 'fornecedor', rotulo: 'no fornecedor', x: 570, y: 330 },
    { id: 'retornado', rotulo: 'retornado', x: 150, y: 330 }
  ];
  // Evento, estado de origem e de destino. A ordem dos botões é a do ciclo.
  var TRANSICOES = [
    { id: 'saida', rotulo: 'Saída', de: 0, para: 1 },
    { id: 'chegada', rotulo: 'Chegada', de: 1, para: 2 },
    { id: 'retorno', rotulo: 'Retorno', de: 2, para: 3 },
    { id: 'liberacao', rotulo: 'Liberação', de: 3, para: 0 }
  ];
  var contador = 0;

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

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  // Pontas da seta: da borda do estado de origem até a borda do destino.
  function pontas(t) {
    var a = ESTADOS[t.de], b = ESTADOS[t.para];
    var dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
    return {
      x1: a.x + dx * (LARG / 2 + 8), y1: a.y + dy * (ALT / 2 + 8),
      x2: b.x - dx * (LARG / 2 + 14), y2: b.y - dy * (ALT / 2 + 14)
    };
  }

  IntelIWidgets.registrar('maquina-estados', function (elemento) {
    elemento.classList.add('anim');
    contador += 1;
    var sufixo = 'maq' + contador;
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Máquina de estados do ciclo do equipamento, com quatro estados e quatro transições' }, elemento);

    var defs = el('defs', {}, svg);
    [['acesa', 'var(--seg-secundaria)'], ['apagada', 'var(--seg-borda)']].forEach(function (par) {
      var m = el('marker', { id: 'seta-' + par[0] + '-' + sufixo, viewBox: '0 0 10 10', refX: '5', refY: '5',
        markerWidth: '5', markerHeight: '5', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0 0 L10 5 L0 10 z', style: 'fill: ' + par[1] }, m);
    });

    var setas = TRANSICOES.map(function (t) {
      var p = pontas(t);
      var g = el('g', { 'data-transicao': t.id }, svg);
      var linha = el('line', { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 }, g);
      var horizontal = p.y1 === p.y2;
      var rot = el('text', {
        x: (p.x1 + p.x2) / 2 + (horizontal ? 0 : (p.x1 > 360 ? 16 : -16)),
        y: (p.y1 + p.y2) / 2 + (horizontal ? (p.y1 < 200 ? -14 : 30) : 6),
        'class': 'anim-rotulo', 'text-anchor': horizontal ? 'middle' : (p.x1 > 360 ? 'start' : 'end')
      }, g);
      rot.textContent = t.rotulo.toLowerCase();
      return { g: g, linha: linha, p: p };
    });

    var caixas = ESTADOS.map(function (e) {
      var r = el('rect', { x: e.x - LARG / 2, y: e.y - ALT / 2, width: LARG, height: ALT, rx: 14 }, svg);
      var t = el('text', { x: e.x, y: e.y + 7, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, svg);
      t.textContent = e.rotulo;
      return { r: r, t: t };
    });
    var legenda = el('text', { x: 360, y: 214, 'class': 'anim-codigo', 'text-anchor': 'middle' }, svg);
    legenda.textContent = 'dias fora contam em trânsito e no fornecedor';
    var marcador = el('circle', { r: 11, cx: -50, cy: -50,
      style: 'fill: var(--seg-destaque); stroke: var(--seg-base); stroke-width: 3' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Máquina de estados do ciclo', painel);
    html('p', null, 'Antes de clicar: a partir de cadastrado, quantos dos quatro eventos o código deve recusar? E o que acontece com o estado quando recusa?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var alerta = html('div', 'anim-alerta', 'Evento recusado', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    TRANSICOES.forEach(function (t) {
      html('button', null, t.rotulo, botoes).addEventListener('click', function () { aplicar(t); });
    });
    var bReiniciar = html('button', null, 'Reiniciar', botoes);

    var atual = 0, aceitas = 0, recusadas = 0;
    var movendo = null;

    function desenhar() {
      caixas.forEach(function (c, i) {
        var ativo = i === atual;
        c.r.setAttribute('style', ativo
          ? 'fill: var(--seg-primaria); stroke: var(--seg-primaria); stroke-width: 3'
          : 'fill: var(--seg-superficie); stroke: var(--seg-borda); stroke-width: 2');
        c.t.setAttribute('style', ativo ? 'fill: var(--seg-base)' : '');
      });
      setas.forEach(function (s, i) {
        var acesa = TRANSICOES[i].de === atual;
        s.g.classList.toggle('acesa', acesa);
        s.linha.setAttribute('style', acesa
          ? 'stroke: var(--seg-secundaria); stroke-width: 6'
          : 'stroke: var(--seg-borda); stroke-width: 3; stroke-dasharray: 8 6');
        s.linha.setAttribute('marker-end', 'url(#seta-' + (acesa ? 'acesa' : 'apagada') + '-' + sufixo + ')');
      });
      medida.textContent = ESTADOS[atual].rotulo + ' · aceitas ' + aceitas + ' · recusadas ' + recusadas;
    }

    function quadro(t) {
      if (!movendo) return;
      if (visivel(elemento)) {
        if (movendo.inicio === null) movendo.inicio = t;
        var f = Math.min(1, (t - movendo.inicio) / 700);
        var p = movendo.p;
        marcador.setAttribute('cx', (p.x1 + (p.x2 - p.x1) * f).toFixed(1));
        marcador.setAttribute('cy', (p.y1 + (p.y2 - p.y1) * f).toFixed(1));
        if (f >= 1) { movendo = null; return; }
      }
      window.requestAnimationFrame(quadro);
    }

    function aplicar(t) {
      if (t.de !== atual) {
        recusadas += 1;
        alerta.textContent = 'Recusado: ' + t.rotulo.toLowerCase() + ' não sai de ' + ESTADOS[atual].rotulo + '. O estado não muda.';
        alerta.classList.add('anim-alerta-visivel');
        desenhar();
        return;
      }
      alerta.classList.remove('anim-alerta-visivel');
      aceitas += 1;
      atual = t.para;
      movendo = { p: setas[TRANSICOES.indexOf(t)].p, inicio: null };
      desenhar();
      window.requestAnimationFrame(quadro);
    }

    bReiniciar.addEventListener('click', function () {
      atual = 0; aceitas = 0; recusadas = 0; movendo = null;
      marcador.setAttribute('cx', -50); marcador.setAttribute('cy', -50);
      alerta.classList.remove('anim-alerta-visivel');
      desenhar();
    });
    desenhar();
  });
})();
