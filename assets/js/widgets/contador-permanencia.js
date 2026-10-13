// Animação da Aula 03: dias fora de cada ciclo aberto contra o prazo e o limiar.
// Os três ciclos abertos fixados de dados/ciclos.csv (ver dados/README.md):
// CI-003 saiu em 25/03/2026 com prazo de 60 dias, CI-009 em 23/07 com 30 e
// CI-015 em 19/09 com 45. O calendário corre de 25/03 a 01/10/2026, a data de
// referência do conjunto, e cada ciclo só conta a partir da própria saída.
// Atraso (dias fora acima do prazo) e permanência (dias fora acima do limiar,
// 150 dias por referência do TAPI) são contados separadamente. Sem cor
// literal; desenho só pelo viewBox. A previsão vem antes dos controles.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var CICLOS = [
    { id: 'CI-003', dias: 190, prazo: 60 },
    { id: 'CI-009', dias: 70, prazo: 30 },
    { id: 'CI-015', dias: 12, prazo: 45 }
  ];
  var TOTAL = 190;                         // dias de 25/03/2026 a 01/10/2026
  var INICIO = Date.UTC(2026, 2, 25);
  var DIA_MS = 86400000;
  var EIXO = 240;
  var X0 = 110, X1 = 690;
  var DIAS_POR_SEGUNDO = 25;

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

  function x(d) { return X0 + (X1 - X0) * d / EIXO; }

  function data(dia) {
    var d = new Date(INICIO + dia * DIA_MS);
    function dois(n) { return (n < 10 ? '0' : '') + n; }
    return dois(d.getUTCDate()) + '/' + dois(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  }

  IntelIWidgets.registrar('contador-permanencia', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Dias fora dos três ciclos abertos contra o prazo de cada um e o limiar de permanência' }, elemento);

    el('line', { x1: X0, y1: 372, x2: X1, y2: 372, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    for (var d = 0; d <= EIXO; d += 60) {
      var rt = el('text', { x: x(d), y: 398, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, svg);
      rt.textContent = String(d);
    }
    var rotEixo = el('text', { x: X1, y: 428, 'class': 'anim-codigo', 'text-anchor': 'end' }, svg);
    rotEixo.textContent = 'dias fora';

    var linhas = CICLOS.map(function (c, i) {
      var y = 60 + i * 106;
      var nome = el('text', { x: X0 - 12, y: y + 30, 'class': 'anim-rotulo mono', 'text-anchor': 'end' }, svg);
      nome.textContent = c.id;
      el('rect', { x: X0, y: y, width: X1 - X0, height: 44, style: 'fill: var(--seg-superficie)' }, svg);
      var barra = el('rect', { x: X0, y: y, height: 44, width: 0 }, svg);
      el('line', { x1: x(c.prazo), x2: x(c.prazo), y1: y - 8, y2: y + 50,
        style: 'stroke: var(--seg-texto); stroke-width: 3' }, svg);
      var rp = el('text', { x: x(c.prazo), y: y - 12, 'class': 'anim-codigo', 'text-anchor': 'middle',
        style: 'font-size: 14px' }, svg);
      rp.textContent = 'prazo ' + c.prazo;
      var situacao = el('text', { x: X0, y: y + 70, 'class': 'anim-codigo', 'text-anchor': 'start' }, svg);
      return { c: c, barra: barra, situacao: situacao };
    });
    var limiarLinha = el('line', { y1: 30, y2: 372,
      style: 'stroke: var(--seg-destaque); stroke-width: 3; stroke-dasharray: 8 6' }, svg);
    var limiarRotulo = el('text', { y: 24, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Dias fora, prazo e limiar', painel);
    html('p', null, 'Antes de contar: em 01/10/2026, quais ciclos passaram do prazo e quais passaram de 150 dias fora?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var rotLimiar = html('p', null, '', painel);
    var controle = html('input', null, null, painel);
    controle.type = 'range'; controle.min = '30'; controle.max = '240'; controle.step = '10'; controle.value = '150';
    controle.setAttribute('aria-label', 'Limiar de permanência em dias');
    var botoes = html('div', 'widget-controles', null, painel);
    var bContar = html('button', null, 'Contar os dias', botoes);
    var bPular = html('button', null, 'Pular para 01/10/2026', botoes);
    html('p', null, 'Barra verde no prazo, roxa em atraso, coral acima do limiar. Traço: prazo. Ciclos fictícios de dados/ciclos.csv.', painel);

    var dia = 0;
    var contando = false;
    var inicio = null;

    function desenhar() {
      var limiar = Number(controle.value);
      var acima = 0, atraso = 0;
      linhas.forEach(function (l) {
        var fora = Math.max(0, dia - (TOTAL - l.c.dias));
        var emAtraso = fora > l.c.prazo;
        var passou = fora > limiar;
        if (emAtraso) atraso += 1;
        if (passou) acima += 1;
        l.barra.setAttribute('width', (x(Math.min(fora, EIXO)) - X0).toFixed(1));
        l.barra.setAttribute('style', 'fill: ' + (passou ? 'var(--seg-destaque)'
          : (emAtraso ? 'var(--seg-primaria)' : 'var(--seg-secundaria)')));
        var texto = fora + ' dias fora · ';
        if (dia < TOTAL - l.c.dias) texto = 'ainda não saiu';
        else if (emAtraso && passou) texto += 'atraso e permanência';
        else if (emAtraso) texto += 'atraso';
        else if (passou) texto += 'permanência';
        else texto += 'no prazo';
        l.situacao.textContent = texto;
      });
      limiarLinha.setAttribute('x1', x(limiar)); limiarLinha.setAttribute('x2', x(limiar));
      // Perto da borda direita o rótulo cresce para a esquerda, para caber no viewBox.
      limiarRotulo.setAttribute('x', x(limiar));
      limiarRotulo.setAttribute('text-anchor', limiar > 200 ? 'end' : 'middle');
      limiarRotulo.textContent = 'limiar ' + limiar;
      rotLimiar.textContent = 'Limiar de permanência: ' + limiar + ' dias';
      medida.textContent = data(dia) + ' · acima do limiar ' + acima + ' · em atraso ' + atraso;
    }

    function quadro(t) {
      if (!contando) return;
      if (visivel(elemento)) {
        if (inicio === null) inicio = t - dia * 1000 / DIAS_POR_SEGUNDO;
        dia = Math.min(TOTAL, Math.floor((t - inicio) * DIAS_POR_SEGUNDO / 1000));
        if (dia >= TOTAL) contando = false;
        desenhar();
      } else {
        inicio = null;
      }
      if (contando) window.requestAnimationFrame(quadro);
    }

    controle.addEventListener('input', desenhar);
    bContar.addEventListener('click', function () {
      dia = 0; inicio = null; contando = true;
      window.requestAnimationFrame(quadro);
    });
    bPular.addEventListener('click', function () {
      contando = false; dia = TOTAL; desenhar();
    });
    // Usado pelos testes e pelo professor no console: vai direto a um dia do calendário.
    elemento.irParaDia = function (n) { contando = false; dia = Math.max(0, Math.min(TOTAL, n)); desenhar(); };
    desenhar();
  });
})();
