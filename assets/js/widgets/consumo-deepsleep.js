// Animação da Aula 10: perfil de corrente do rastreador ao longo de uma semana
// e a autonomia que resulta dele. O eixo da corrente é logarítmico, porque o
// ESP32 acordado (100 mA) e dormindo (10 µA) difere por um fator de 10 000.
// Correntes do ESP32 Series Datasheet v5.3 da Espressif: Tabela 4-2 (modos de
// sono) e Tabela 5-4 (rádio Wi-Fi). Premissas declaradas no painel: 10 s
// acordado por despertar e bateria de exemplo de 2000 mAh. Mesmo cálculo de
// labs/aula10/rastreador.h. Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var SEMANA = 7 * 24 * 3600;
  var ACORDADO_S = 10;
  var CAPACIDADE = 2000;
  var X0 = 90, X1 = 690, Y0 = 250, Y1 = 30;
  var DEC_MIN = -3, DEC_MAX = 3;               // 1 µA a 1000 mA, em mA
  var INTERVALOS = [[3600, '1 h'], [21600, '6 h'], [86400, '1 dia'], [SEMANA, '1 semana']];
  var ATIVAS = [[100, '100 mA'], [240, '240 mA']];
  var SONOS = [
    [0.005, '5 µA', 'hibernação, Tab. 4-2'],
    [0.01, '10 µA', 'deep sleep, Tab. 4-2'],
    [0.15, '150 µA', 'deep sleep com ULP, Tab. 4-2'],
    [0.8, '0,8 mA', 'light sleep, Tab. 4-2'],
    [1, '1 mA', 'hipótese da placa, a medir'],
    [20, '20 mA', 'modem-sleep, Tab. 4-2']
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

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  function texto(pai, x, y, conteudo) {
    var t = el('text', { x: x, y: y, 'class': 'anim-rotulo', style: 'font-size: 15px; font-weight: 400' }, pai);
    t.textContent = conteudo;
    return t;
  }

  function decimal(n, casas) { return n.toFixed(casas).replace('.', ','); }

  function milhar(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function mAh(n) { return decimal(n, n < 10 ? 2 : 1) + ' mAh'; }

  function x(segundos) { return X0 + (X1 - X0) * segundos / SEMANA; }
  function y(ma) {
    var d = Math.log(ma) / Math.LN10;
    return Y0 - (Y0 - Y1) * (d - DEC_MIN) / (DEC_MAX - DEC_MIN);
  }

  // Igual a cargaPorSemanaMah() de rastreador.h.
  function carga(ativa, sono, intervalo) {
    var n = SEMANA / intervalo;
    return { acordado: ativa * ACORDADO_S * n / 3600, dormindo: sono * (SEMANA - ACORDADO_S * n) / 3600 };
  }

  IntelIWidgets.registrar('consumo-deepsleep', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Corrente do rastreador ao longo de uma semana, em escala logarítmica, e a carga gasta acordado e dormindo' }, elemento);

    el('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    el('line', { x1: X0, y1: Y0, x2: X0, y2: Y1, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    [['1 µA', -3], ['10 µA', -2], ['1 mA', 0], ['100 mA', 2], ['1 A', 3]].forEach(function (m) {
      var yy = y(Math.pow(10, m[1]));
      el('line', { x1: X0, x2: X1, y1: yy, y2: yy, style: 'stroke: var(--seg-borda); stroke-width: 1; stroke-dasharray: 3 5' }, svg);
      var r = el('text', { x: X0 - 10, y: yy + 6, 'class': 'anim-rotulo mono', 'text-anchor': 'end' }, svg);
      r.textContent = m[0];
    });
    for (var dia = 0; dia <= 7; dia++) {
      var rd = el('text', { x: x(dia * 86400), y: Y0 + 26, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, svg);
      rd.textContent = 'd' + dia;
    }
    var grupoPulsos = el('g', {}, svg);
    var base = el('line', { x1: X0, x2: X1, style: 'stroke: var(--seg-secundaria); stroke-width: 4' }, svg);
    var cursor = el('line', { y1: Y0, y2: Y1, style: 'stroke: var(--seg-destaque); stroke-width: 2; stroke-dasharray: 6 5' }, svg);
    var nota = el('text', { x: X1, y: Y1 - 8, 'class': 'anim-rotulo', 'text-anchor': 'end' }, svg);
    nota.textContent = 'pulsos de 10 s fora de escala no tempo';

    // Carga da semana, dividida entre acordado e dormindo.
    var BX0 = 90, BX1 = 690, BY = 318;
    var rotuloBarra = el('text', { x: BX0, y: BY - 14, 'class': 'anim-rotulo' }, svg);
    rotuloBarra.textContent = 'carga gasta numa semana';
    var barraAcordado = el('rect', { y: BY, height: 34, style: 'fill: var(--seg-primaria)' }, svg);
    var barraDormindo = el('rect', { y: BY, height: 34, style: 'fill: var(--seg-secundaria)' }, svg);
    var textoAcordado = el('text', { x: BX0, y: BY + 58, 'class': 'anim-rotulo mono' }, svg);
    var textoDormindo = el('text', { x: BX1, y: BY + 58, 'class': 'anim-rotulo mono', 'text-anchor': 'end' }, svg);
    texto(svg, BX0, 412, 'Bateria de 2000 mAh: exemplo declarado. Tempo acordado: 10 s por envio, premissa.');
    texto(svg, BX0, 434, 'Correntes: ESP32 Series Datasheet v5.3, Tabelas 4-2 e 5-4.');

    var painel = html('div', 'anim-painel', null, elemento);
    html('p', null, 'Antes de mexer: com uma leitura por semana, a bateria dura mais ou menos que 150 dias?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var detalhe = html('p', 'anim-detalhe', '', painel);

    var bIntervalos = html('div', 'widget-controles', null, painel);
    var intervalo = SEMANA;
    INTERVALOS.forEach(function (it) {
      var b = html('button', null, it[1], bIntervalos);
      b.dataset.acao = 'intervalo-' + it[0];
      b.addEventListener('click', function () { intervalo = it[0]; revelado = true; desenhar(); });
    });

    var bAtivas = html('div', 'widget-controles', null, painel);
    var ativa = 100;
    ATIVAS.forEach(function (it) {
      var b = html('button', null, it[1], bAtivas);
      b.dataset.acao = 'ativa-' + it[0];
      b.addEventListener('click', function () { ativa = it[0]; revelado = true; desenhar(); });
    });

    var rotSono = html('p', null, '', painel);
    var controleSono = html('input', null, null, painel);
    controleSono.type = 'range'; controleSono.min = '0'; controleSono.max = String(SONOS.length - 1); controleSono.step = '1';
    controleSono.value = '1';
    controleSono.setAttribute('aria-label', 'Corrente dormindo');
    controleSono.dataset.rotulos = JSON.stringify(SONOS.map(function (s) { return s[1]; }));
    controleSono.addEventListener('input', function () { revelado = true; desenhar(); });
    var passos = html('div', 'anim-passos', null, painel);
    passos.style.display = 'flex';
    passos.style.justifyContent = 'space-between';
    passos.style.fontSize = 'var(--escala-complementar)';
    SONOS.forEach(function (s) { html('span', null, s[1], passos); });

    var botaoRodar = html('button', null, 'Rodar a semana', bAtivas);
    botaoRodar.dataset.acao = 'rodar';

    var progresso = 1;
    var revelado = false;               // a previsão vem antes do resultado
    var rodando = false;
    var inicio = null;

    function desenhar() {
      var sono = SONOS[Number(controleSono.value)][0];
      var c = carga(ativa, sono, intervalo);
      var total = c.acordado + c.dormindo;
      var dias = CAPACIDADE / total * 7;

      Array.prototype.forEach.call(bIntervalos.children, function (b) {
        b.classList.toggle('ativo', b.dataset.acao === 'intervalo-' + intervalo);
      });
      Array.prototype.forEach.call(bAtivas.children, function (b) {
        if (b.dataset.acao !== 'rodar') b.classList.toggle('ativo', b.dataset.acao === 'ativa-' + ativa);
      });

      while (grupoPulsos.firstChild) grupoPulsos.removeChild(grupoPulsos.firstChild);
      var limite = SEMANA * progresso;
      for (var t = intervalo / 2; t < SEMANA; t += intervalo) {
        if (t > limite) break;
        el('line', { x1: x(t) + 1, x2: x(t) + 1, y1: y(sono), y2: y(ativa), 'class': 'anim-pulso',
          style: 'stroke: var(--seg-primaria); stroke-width: 2' }, grupoPulsos);
      }
      base.setAttribute('y1', y(sono)); base.setAttribute('y2', y(sono));
      base.setAttribute('x2', x(limite));
      cursor.setAttribute('x1', x(limite)); cursor.setAttribute('x2', x(limite));
      cursor.style.display = progresso < 1 ? '' : 'none';

      var fracao = c.acordado / total;
      var corte = BX0 + (BX1 - BX0) * fracao;
      barraAcordado.setAttribute('x', BX0); barraAcordado.setAttribute('width', Math.max(corte - BX0, 1));
      barraDormindo.setAttribute('x', corte); barraDormindo.setAttribute('width', Math.max(BX1 - corte, 1));
      textoAcordado.textContent = 'acordado ' + mAh(c.acordado);
      textoDormindo.textContent = 'dormindo ' + mAh(c.dormindo);

      barraAcordado.style.display = revelado ? '' : 'none';
      barraDormindo.style.display = revelado ? '' : 'none';
      textoAcordado.style.display = revelado ? '' : 'none';
      textoDormindo.style.display = revelado ? '' : 'none';
      if (!revelado) {
        medida.textContent = '? dias';
        detalhe.textContent = 'Registre a previsão e mexa num controle para ver o resultado.';
        rotSono.textContent = 'Corrente dormindo, do datasheet ou da hipótese da placa:';
        return;
      }
      medida.textContent = milhar(dias) + ' dias';
      var media = total / (7 * 24);
      detalhe.textContent = 'média ' + decimal(media, media < 0.1 ? 4 : 2) + ' mA · sono ' +
        Math.round(100 * c.dormindo / total) + '% da carga' + (dias < 150 ? ' · abaixo de 150 dias' : '');
      rotSono.textContent = 'Acordado: ' + ativa + ' mA, Tab. 5-4. Dormindo: ' + SONOS[Number(controleSono.value)][1] + ', ' +
        SONOS[Number(controleSono.value)][2];
    }

    function quadro(t) {
      if (rodando && visivel(elemento)) {
        if (inicio === null) inicio = t - progresso * 6000;
        progresso = Math.min((t - inicio) / 6000, 1);
        if (progresso >= 1) rodando = false;
        desenhar();
      } else if (rodando) {
        inicio = null;                     // fora de cena: recomeça a contagem ao voltar
      }
      if (rodando) window.requestAnimationFrame(quadro);
    }

    botaoRodar.addEventListener('click', function () {
      rodando = true; inicio = null; progresso = 0; revelado = true;
      window.requestAnimationFrame(quadro);
    });
    desenhar();
  });
})();
