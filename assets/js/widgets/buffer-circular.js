// Animação da Aula 04: buffer circular de eventos do rastreador.
// Um vetor de 8 posições de Evento (8 bytes cada) na SRAM, com o ponteiro de
// escrita e o de leitura. Sem conexão, cada evento entra na posição da escrita;
// quando a escrita passa de [7], volta para [0]. Com o buffer cheio, a política
// escolhida descarta o evento mais antigo ou o mais novo. Quando a conexão volta,
// o ponteiro de leitura entrega os eventos na ordem em que chegaram.
// Sem cor literal; desenho só pelo viewBox; o laço pausa fora de cena.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var N = 8;
  var TAM = 8;                       // sizeof(Evento): dois uint32_t
  var X0 = 40, LARG = 80, Y_CEL = 125, ALT = 90;
  var INTERVALO_ENVIO_MS = 500;      // o mesmo intervalo do sketch do laboratório

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

  function centro(i) { return X0 + LARG * i + LARG / 2; }

  function lista(valores) { return valores.length ? valores.join(', ') : 'nenhum'; }

  IntelIWidgets.registrar('buffer-circular', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Vetor de 8 posições na memória com os ponteiros de escrita e de leitura dando a volta' }, elemento);

    var titulo = el('text', { x: 360, y: 30, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, svg);
    titulo.textContent = 'Evento buffer[8]: 8 posições de 8 bytes na SRAM';

    var celulas = [];
    var textos = [];
    for (var i = 0; i < N; i++) {
      celulas.push(el('rect', { x: X0 + LARG * i, y: Y_CEL, width: LARG, height: ALT,
        style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg));
      textos.push(el('text', { x: centro(i), y: Y_CEL + ALT / 2 + 7, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, svg));
      var ind = el('text', { x: centro(i), y: Y_CEL + ALT + 24, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, svg);
      ind.textContent = '[' + i + ']';
      var desl = el('text', { x: centro(i), y: Y_CEL + ALT + 44, 'class': 'anim-codigo mono', 'text-anchor': 'middle',
        style: 'font-size: 14px' }, svg);
      desl.textContent = '+' + (TAM * i);
    }

    // Ponteiro de escrita, acima do vetor; de leitura, abaixo.
    var gEscrita = el('g', { style: 'transition: transform 0.35s ease' }, svg);
    el('path', { d: 'M ' + (X0 + LARG / 2 - 12) + ' 98 L ' + (X0 + LARG / 2 + 12) + ' 98 L ' + (X0 + LARG / 2) + ' 118 Z',
      style: 'fill: var(--seg-destaque)' }, gEscrita);
    var tEscrita = el('text', { x: X0 + LARG / 2, y: 88, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, gEscrita);
    tEscrita.textContent = 'escrita';

    var gLeitura = el('g', { style: 'transition: transform 0.35s ease' }, svg);
    el('path', { d: 'M ' + (X0 + LARG / 2 - 12) + ' 292 L ' + (X0 + LARG / 2 + 12) + ' 292 L ' + (X0 + LARG / 2) + ' 272 Z',
      style: 'fill: var(--seg-primaria)' }, gLeitura);
    var tLeitura = el('text', { x: X0 + LARG / 2, y: 314, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, gLeitura);
    tLeitura.textContent = 'leitura';

    // A volta: depois de [7], o ponteiro retorna para [0].
    var arco = el('path', { d: 'M 690 330 Q 690 392 620 392 L 100 392 Q 30 392 30 340',
      style: 'fill: none; stroke: var(--seg-borda); stroke-width: 3; stroke-dasharray: 8 6' }, svg);
    var ponta = el('path', { d: 'M 20 344 L 40 344 L 30 326 Z', style: 'fill: var(--seg-borda)' }, svg);
    var rotArco = el('text', { x: 360, y: 425, 'class': 'anim-codigo', 'text-anchor': 'middle', style: 'font-size: 15px' }, svg);
    rotArco.textContent = 'depois de [7], o ponteiro volta para [0]: if (p == buffer + 8) p = buffer;';

    var painel = html('div', 'anim-painel', null, elemento);
    html('p', null, 'Antes de gerar: depois de 10 eventos sem conexão, em que posição para a escrita?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    medida.style.fontSize = '22px';
    var estado = html('p', null, '', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    var bGerar = html('button', null, 'Gerar evento', botoes);
    var bConexao = html('button', null, '', botoes);
    var bPolitica = html('button', null, '', botoes);
    var bReiniciar = html('button', null, 'Reiniciar', botoes);
    var logEnviados = html('p', 'mono', '', painel);
    var logPerdidos = html('p', 'mono', '', painel);

    var buf, escrita, leitura, guardados, proximo, perdidos, enviados, conectado, descartarAntigo, ultimoEnvio;
    var laco = false;

    function zerar() {
      buf = []; for (var k = 0; k < N; k++) buf.push(null);
      escrita = 0; leitura = 0; guardados = 0; proximo = 1;
      perdidos = []; enviados = []; ultimoEnvio = null;
    }

    function piscarVolta() {
      arco.style.stroke = 'var(--seg-destaque)';
      ponta.style.fill = 'var(--seg-destaque)';
      window.setTimeout(function () {
        arco.style.stroke = 'var(--seg-borda)'; ponta.style.fill = 'var(--seg-borda)';
      }, 700);
    }

    function avancar(p) {
      p = p + 1;
      if (p === N) { p = 0; piscarVolta(); }
      return p;
    }

    function desenhar() {
      for (var k = 0; k < N; k++) {
        var ocupada = buf[k] !== null;
        celulas[k].style.fill = ocupada ? 'var(--seg-secundaria)' : 'var(--seg-base)';
        textos[k].textContent = ocupada ? 'ev ' + buf[k] : '';
      }
      gEscrita.style.transform = 'translate(' + (LARG * escrita) + 'px, 0px)';
      gLeitura.style.transform = 'translate(' + (LARG * leitura) + 'px, 0px)';
      medida.textContent = 'escrita [' + escrita + '] · leitura [' + leitura + '] · guardados ' + guardados;
      estado.textContent = conectado
        ? 'Com conexão: um envio a cada ' + INTERVALO_ENVIO_MS + ' ms.'
        : 'Sem conexão: eventos ficam guardados.';
      bConexao.textContent = conectado ? 'Conexão: cair' : 'Conexão: voltar';
      bPolitica.textContent = descartarAntigo ? 'Ao encher: perde o antigo' : 'Ao encher: perde o novo';
      logEnviados.textContent = 'enviados: ' + lista(enviados);
      logPerdidos.textContent = 'perdidos: ' + lista(perdidos);
    }

    function gerar() {
      var ev = proximo++;
      if (guardados === N) {
        if (!descartarAntigo) { perdidos.push(ev); desenhar(); return; }
        perdidos.push(buf[leitura]);        // o mais antigo dá lugar ao novo
        buf[leitura] = null;
        leitura = avancar(leitura);
        guardados--;
      }
      buf[escrita] = ev;
      escrita = avancar(escrita);
      guardados++;
      desenhar();
    }

    function enviar() {
      enviados.push(buf[leitura]);
      buf[leitura] = null;
      leitura = avancar(leitura);
      guardados--;
      desenhar();
    }

    function quadro(t) {
      if (!conectado || guardados === 0) { laco = false; return; }
      if (visivel(elemento)) {
        if (ultimoEnvio === null) ultimoEnvio = t;
        if (t - ultimoEnvio >= INTERVALO_ENVIO_MS) { ultimoEnvio = t; enviar(); }
      }
      window.requestAnimationFrame(quadro);
    }

    function iniciarLaco() {
      if (laco || !conectado || guardados === 0) return;
      laco = true; ultimoEnvio = null;
      window.requestAnimationFrame(quadro);
    }

    bGerar.addEventListener('click', function () { gerar(); iniciarLaco(); });
    bConexao.addEventListener('click', function () {
      conectado = !conectado; bConexao.classList.toggle('ativo', conectado);
      desenhar(); iniciarLaco();
    });
    bPolitica.addEventListener('click', function () { descartarAntigo = !descartarAntigo; desenhar(); });
    bReiniciar.addEventListener('click', function () { zerar(); desenhar(); });

    conectado = false;
    descartarAntigo = true;
    zerar();
    desenhar();
  });
})();
