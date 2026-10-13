// Animação da Aula 08: atenuação do sinal por distância e por parede metálica.
// Modelo log-distância: queda em relação a 1 m = 10 × γ × log10(d / 1 m), mais a
// perda de uma parede metálica que o aluno declara. γ = 2,0 é o espaço livre
// (perda de Friis, que cresce com o quadrado da distância); 2,6 e 3,0 são os
// valores tabelados para escritório com divisória leve (1,9 GHz) e rígida
// (1,5 GHz) no verbete "Log-distance path loss model", que cita Rappaport. A
// parede não tem valor padrão citável: a nota da Cisco "Antena omni vs. antena
// direcional" diz só que parede grossa de metal reflete o sinal e a penetração é
// deficiente, então a perda é um parâmetro que o aluno mede no elevador.
// Em cima, a planta com o roteador, a parede e o ESP32, e frentes de onda que o
// botão Emitir faz andar. Embaixo, a queda em dB contra a distância.
// Sem cor literal; desenho só pelo viewBox; o laço pausa fora de cena.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var D_MAX = 30, QUEDA_MAX = 100;   // 30 m com γ 3,0 e parede de 40 dB somam 84,3 dB
  var PX0 = 90, PX1 = 670, PY = 100;          // planta
  var GX0 = 90, GX1 = 670, GY0 = 220, GY1 = 410; // gráfico: GY0 é 0 dB
  var GAMAS = [2.0, 2.6, 3.0];
  var instancias = 0;   // id único do recorte das ondas quando há duas na página

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

  function decimal(n, casas) { return n.toFixed(casas).replace('.', ','); }
  // Acima de um milhão, a razão vira potência de dez: 84,3 dB é ÷ 10^8,4.
  function razao(r) {
    if (r >= 1e6) return '10^' + decimal(Math.log10(r), 1);
    return r < 10 ? decimal(r, 1) : String(Math.round(r));
  }
  function px(d) { return PX0 + (PX1 - PX0) * d / D_MAX; }
  function gx(d) { return GX0 + (GX1 - GX0) * d / D_MAX; }
  function gy(q) { return GY0 + (GY1 - GY0) * Math.min(q, QUEDA_MAX) / QUEDA_MAX; }
  function queda(d, gama) { return 10 * gama * Math.log10(d); }

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  IntelIWidgets.registrar('atenuacao-sinal', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Planta com roteador e ESP32 e gráfico da queda do sinal em dB contra a distância, com parede metálica opcional' }, elemento);

    // Planta: as frentes de onda ficam recortadas à faixa da planta.
    instancias += 1;
    var idRecorte = 'recorte-ondas-' + instancias;
    var recorte = el('clipPath', { id: idRecorte }, el('defs', {}, svg));
    el('rect', { x: 0, y: 0, width: 720, height: PY + 34 }, recorte);
    var ondas = el('g', { 'clip-path': 'url(#' + idRecorte + ')' }, svg);
    el('line', { x1: PX0 - 40, x2: PX1 + 20, y1: PY + 34, y2: PY + 34, style: 'stroke: var(--seg-borda); stroke-width: 2' }, svg);
    el('rect', { x: PX0 - 34, y: PY - 18, width: 40, height: 30, rx: 4, style: 'fill: var(--seg-primaria)' }, svg);
    el('line', { x1: PX0 - 14, x2: PX0 - 14, y1: PY - 18, y2: PY - 40, style: 'stroke: var(--seg-primaria); stroke-width: 4' }, svg);
    texto(svg, PX0 - 14, PY + 60, 'roteador', 'middle');
    var parede = el('rect', { y: PY - 50, width: 12, height: 84, style: 'fill: var(--seg-texto)' }, svg);
    var rotParede = texto(svg, 0, PY - 58, 'parede metálica', 'middle');
    var esp = el('rect', { y: PY - 12, width: 26, height: 30, rx: 3, style: 'fill: var(--seg-destaque)' }, svg);
    var rotEsp = texto(svg, 0, PY + 60, '', 'middle', 'anim-rotulo mono');

    // Gráfico
    el('line', { x1: GX0, x2: GX1, y1: GY0, y2: GY0, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    el('line', { x1: GX0, x2: GX0, y1: GY0, y2: GY1, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    [1, 10, 20, 30].forEach(function (d) {
      el('line', { x1: gx(d), x2: gx(d), y1: GY0 - 6, y2: GY0, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
      texto(svg, gx(d), GY0 - 12, d + ' m', 'middle', 'anim-rotulo mono');
    });
    [0, 20, 40, 60, 80, 100].forEach(function (q) {
      el('line', { x1: GX0, x2: GX1, y1: gy(q), y2: gy(q), style: 'stroke: var(--seg-borda); stroke-width: 1' }, svg);
      texto(svg, GX0 - 10, gy(q) + 6, q ? '−' + q : '0', 'end', 'anim-rotulo mono');
    });
    texto(svg, GX0 - 10, GY1 + 26, 'dB em relação a 1 m', 'start');
    var referencia = el('path', { style: 'fill: none; stroke: var(--seg-borda); stroke-width: 3; stroke-dasharray: 8 6' }, svg);
    var curva = el('path', { style: 'fill: none; stroke: var(--seg-primaria); stroke-width: 4' }, svg);
    var degrau = el('line', { style: 'stroke: var(--seg-destaque); stroke-width: 3; stroke-dasharray: 4 4' }, svg);
    var ponto = el('circle', { r: 9, style: 'fill: var(--seg-destaque); stroke: var(--seg-base); stroke-width: 3' }, svg);
    var rotRef = texto(svg, GX1, gy(queda(D_MAX, 2)) - 10, 'γ 2,0', 'end', 'anim-rotulo mono');

    // Painel
    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Queda do sinal com a distância', painel);
    html('p', null, 'Antes de mexer: com γ 3,0, quantos dB custa passar de 10 m para 20 m?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var detalhe = html('p', 'mono', '', painel);
    var controleD = html('input', null, null, painel);
    controleD.type = 'range'; controleD.min = '1'; controleD.max = String(D_MAX); controleD.step = '1'; controleD.value = '10';
    controleD.setAttribute('aria-label', 'Distância até o roteador em metros');
    var controleO = html('input', null, null, painel);
    controleO.type = 'range'; controleO.min = '0'; controleO.max = '40'; controleO.step = '1'; controleO.value = '0';
    controleO.setAttribute('aria-label', 'Perda da parede metálica em dB');
    var botoes = html('div', 'widget-controles', null, painel);
    var botoesGama = GAMAS.map(function (g) {
      var b = html('button', null, 'γ ' + decimal(g, 1), botoes);
      b.dataset.gama = String(g);
      return b;
    });
    var bEmitir = html('button', null, 'Emitir', botoes);
    html('p', null, 'Faixas: distância e perda da parede (hipótese sua). γ 2,0: espaço livre.', painel);

    var gama = 2.0;
    var fase = null, inicio = null;

    function caminho(g) {
      var d = [];
      for (var k = 0; k <= 120; k++) {
        var dk = 1 + (D_MAX - 1) * k / 120;
        d.push((k ? 'L' : 'M') + gx(dk).toFixed(1) + ' ' + gy(queda(dk, g)).toFixed(1));
      }
      return d.join(' ');
    }

    function desenharOndas() {
      while (ondas.firstChild) ondas.removeChild(ondas.firstChild);
      if (fase === null) return;
      for (var k = 0; k < 4; k++) {
        var r = ((fase * 160) + k * 160) % 640;
        el('circle', { cx: PX0 - 14, cy: PY - 40, r: r.toFixed(1),
          style: 'fill: none; stroke: var(--seg-secundaria); stroke-width: ' + Math.max(0.5, 5 - r / 140).toFixed(2) }, ondas);
      }
    }

    function desenhar() {
      var d = Number(controleD.value), o = Number(controleO.value);
      // A 1 m não há espaço para a parede entre o roteador e o ESP32: a perda
      // dela não entra na conta, e o painel avisa.
      var cabe = d > 1;
      var oe = cabe ? o : 0;
      var qd = queda(d, gama), total = qd + oe;
      var xe = px(d);
      esp.setAttribute('x', (xe - 13).toFixed(1));
      rotEsp.setAttribute('x', xe.toFixed(1));
      rotEsp.textContent = 'ESP32, ' + d + ' m';
      var temParede = oe > 0;
      var xp = (PX0 + xe) / 2;
      parede.style.display = temParede ? '' : 'none';
      rotParede.style.display = temParede ? '' : 'none';
      parede.setAttribute('x', (xp - 6).toFixed(1));
      rotParede.setAttribute('x', xp.toFixed(1));
      referencia.setAttribute('d', caminho(2.0));
      curva.setAttribute('d', caminho(gama));
      rotRef.style.display = gama === 2.0 ? 'none' : '';
      ponto.setAttribute('cx', gx(d).toFixed(1));
      ponto.setAttribute('cy', gy(total).toFixed(1));
      degrau.style.display = oe > 0 ? '' : 'none';
      degrau.setAttribute('x1', gx(d)); degrau.setAttribute('x2', gx(d));
      degrau.setAttribute('y1', gy(qd)); degrau.setAttribute('y2', gy(total));
      botoesGama.forEach(function (b) { b.classList.toggle('ativo', Number(b.dataset.gama) === gama); });
      medida.textContent = 'queda ' + decimal(total, 1) + ' dB · ÷ ' + razao(Math.pow(10, total / 10));
      detalhe.textContent = d + ' m · γ ' + decimal(gama, 1) + ' · ' +
        (o > 0 && !cabe ? 'parede não cabe a 1 m' : 'parede ' + oe + ' dB');
      desenharOndas();
    }

    function quadro(t) {
      if (fase === null) return;
      if (visivel(elemento)) {
        if (inicio === null) inicio = t;
        fase = (t - inicio) / 1000;
        if (fase > 4) { fase = null; inicio = null; }
        desenharOndas();
      } else {
        inicio = null;
      }
      if (fase !== null) window.requestAnimationFrame(quadro);
    }

    controleD.addEventListener('input', desenhar);
    controleO.addEventListener('input', desenhar);
    botoesGama.forEach(function (b) {
      b.addEventListener('click', function () { gama = Number(b.dataset.gama); desenhar(); });
    });
    bEmitir.addEventListener('click', function () {
      var emCurso = fase !== null;
      fase = 0; inicio = null;
      if (!emCurso) window.requestAnimationFrame(quadro);
    });
    desenhar();
  });
})();
