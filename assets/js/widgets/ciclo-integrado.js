// Animação da Aula 10: o ciclo integrado do rastreador, despertar a despertar.
// Cada clique em "Próximo despertar" é um despertar. O primeiro é o cadastro, no
// dia 0; os seguintes somam 7 dias fora, guardam a leitura na fila, acrescenta o evento do lacre e o alerta de mudança de estado
// e, se houver rede, publica a fila inteira no broker. Mesmas regras de
// labs/aula10/rastreador.h: prazo de 30 dias (ciclo CI-009 de dados/), alerta de
// permanência depois de passar de 150 dias e fila de 8 posições que descarta o
// mais antigo.
// Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var PRAZO = 30, LIMIAR = 150, DIA_MAX = 210, CAPACIDADE = 8;
  var TX0 = 60, TX1 = 680, TY = 80;
  var FX0 = 236, FW = 60, FY = 170;

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

  function texto(pai, x, y, conteudo, extra) {
    var t = el('text', Object.assign({ x: x, y: y, 'class': 'anim-rotulo' }, extra || {}), pai);
    t.textContent = conteudo;
    return t;
  }

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  function tx(dia) { return TX0 + (TX1 - TX0) * Math.min(dia, DIA_MAX) / DIA_MAX; }

  // Igual a estadoDoCiclo() de rastreador.h.
  function estadoDoCiclo(dias, retornou) {
    if (retornou) return 'RETORNADO';
    if (dias > LIMIAR) return 'PERMANÊNCIA LONGA';
    if (dias > PRAZO) return 'ATRASADO';
    return 'NO PRAZO';
  }

  IntelIWidgets.registrar('ciclo-integrado', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Linha do tempo do ciclo, fila de eventos do rastreador e broker MQTT' }, elemento);

    // Linha do tempo com as faixas do prazo e do limiar.
    el('rect', { x: tx(0), y: TY - 14, width: tx(PRAZO) - tx(0), height: 28, style: 'fill: var(--seg-secundaria)' }, svg);
    el('rect', { x: tx(PRAZO), y: TY - 14, width: tx(LIMIAR) - tx(PRAZO), height: 28, style: 'fill: var(--seg-borda)' }, svg);
    el('rect', { x: tx(LIMIAR), y: TY - 14, width: tx(DIA_MAX) - tx(LIMIAR), height: 28, style: 'fill: var(--seg-destaque)' }, svg);
    [0, PRAZO, 90, LIMIAR, DIA_MAX].forEach(function (d) {
      texto(svg, tx(d), TY + 40, String(d), { 'class': 'anim-rotulo mono', 'text-anchor': 'middle' });
    });
    texto(svg, tx(PRAZO), TY - 24, 'prazo 30 d', { 'text-anchor': 'middle' });
    texto(svg, tx(LIMIAR), TY - 24, 'limiar 150 d', { 'text-anchor': 'middle' });
    var marcador = el('line', { y1: TY - 20, y2: TY + 20, style: 'stroke: var(--seg-primaria); stroke-width: 5' }, svg);

    // O rastreador.
    el('rect', { x: 30, y: 150, width: 190, height: 130, rx: 10,
      style: 'fill: var(--seg-superficie); stroke: var(--seg-primaria); stroke-width: 2' }, svg);
    texto(svg, 45, 178, 'DV-02 · CI-009');
    var led = el('circle', { cx: 195, cy: 172, r: 10, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    var textoEstado = texto(svg, 45, 210, '', { style: 'font-size: 15px' });
    var textoLacre = texto(svg, 45, 238, '', { style: 'font-size: 15px' });
    var textoRede = texto(svg, 45, 266, '', { style: 'font-size: 15px' });

    // A fila de 8 posições.
    texto(svg, FX0, FY - 12, 'fila de eventos (8 posições)');
    var caixas = [];
    for (var i = 0; i < CAPACIDADE; i++) {
      el('rect', { x: FX0 + i * FW, y: FY, width: FW - 4, height: 50, rx: 4,
        style: 'fill: var(--seg-base); stroke: var(--seg-borda); stroke-width: 2' }, svg);
      caixas.push(texto(svg, FX0 + i * FW + (FW - 4) / 2, FY + 31, '',
        { 'class': 'anim-evento', 'text-anchor': 'middle', style: 'font-size: 14px; fill: var(--seg-texto)' }));
    }
    var textoPerdidos = texto(svg, FX0, FY + 76, '', { style: 'font-size: 15px' });

    // Caminho até o broker.
    var caminho = el('line', { x1: 460, y1: 330, x2: 540, y2: 330, style: 'stroke-width: 4' }, svg);
    el('rect', { x: 540, y: 290, width: 150, height: 80, rx: 10,
      style: 'fill: var(--seg-superficie); stroke: var(--seg-primaria); stroke-width: 2' }, svg);
    texto(svg, 615, 322, 'broker MQTT', { 'text-anchor': 'middle' });
    var textoPublicados = texto(svg, 615, 352, '', { 'text-anchor': 'middle', 'class': 'anim-rotulo mono' });
    var pacote = el('circle', { r: 9, cy: 330, style: 'fill: var(--seg-destaque)' }, svg);
    texto(svg, 30, 330, 'cada despertar: ler, guardar,', { style: 'font-size: 15px' });
    texto(svg, 30, 352, 'publicar se houver rede, dormir', { style: 'font-size: 15px' });

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Um despertar por semana', painel);
    html('p', null, 'Antes de mexer: com a rede desligada desde o cadastro, quantos eventos esperam na fila depois de três despertares? Quantos chegam ao broker quando a rede volta?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    medida.style.fontSize = '18px';
    var botoes = html('div', 'widget-controles', null, painel);
    function botao(rotulo, acao, fn) {
      var b = html('button', null, rotulo, botoes);
      b.dataset.acao = acao;
      b.addEventListener('click', fn);
      return b;
    }

    var s;
    function reiniciar() {
      s = { dia: 0, despertares: 0, rede: true, lacrePendente: false, lacreRompido: false,
        retornoPendente: false, fila: [], publicados: 0, perdidos: 0, estado: 'NO PRAZO', encerrado: false };
      desenhar();
    }

    function guardar(nome) {
      if (s.fila.length === CAPACIDADE) { s.fila.shift(); s.perdidos++; }
      s.fila.push(nome);
    }

    var bAvancar = botao('Próximo despertar', 'avancar', function () {
      if (s.encerrado) return;
      if (s.despertares === 0) {
        guardar('cadastro');                 // primeiro despertar: cadastro, dia 0
      } else {
        s.dia += 7;
        guardar('leitura');
      }
      s.despertares++;
      if (s.lacrePendente) { guardar('lacre'); s.lacrePendente = false; }
      var novo = estadoDoCiclo(s.dia, s.retornoPendente);
      if (novo !== s.estado) {
        if (novo === 'ATRASADO') guardar('atraso');
        if (novo === 'PERMANÊNCIA LONGA') guardar('perman.');
        if (novo === 'RETORNADO') { guardar('retorno'); s.encerrado = true; }
      }
      s.estado = novo;
      if (s.rede && s.fila.length) { s.publicados += s.fila.length; s.fila = []; enviar(); }
      desenhar();
    });
    var bRede = botao('Desligar a rede', 'rede', function () { s.rede = !s.rede; desenhar(); });
    var bLacre = botao('Romper o lacre', 'lacre', function () {
      if (!s.lacreRompido) { s.lacreRompido = true; s.lacrePendente = true; }
      desenhar();
    });
    var bRetorno = botao('Registrar retorno', 'retorno', function () { s.retornoPendente = true; desenhar(); });
    botao('Reiniciar', 'reiniciar', reiniciar);

    var animando = false, inicio = null, fase = 1;
    function enviar() { animando = true; inicio = null; fase = 0; window.requestAnimationFrame(quadro); }
    function quadro(t) {
      if (animando && visivel(elemento)) {
        if (inicio === null) inicio = t - fase * 700;
        fase = Math.min((t - inicio) / 700, 1);
        if (fase >= 1) animando = false;
        pacote.setAttribute('cx', 460 + 80 * fase);
      } else if (animando) {
        inicio = null;
      }
      pacote.style.display = animando ? '' : 'none';
      if (animando) window.requestAnimationFrame(quadro);
    }

    function desenhar() {
      marcador.setAttribute('x1', tx(s.dia)); marcador.setAttribute('x2', tx(s.dia));
      var alerta = s.lacreRompido || s.estado === 'ATRASADO' || s.estado === 'PERMANÊNCIA LONGA';
      led.style.fill = alerta ? 'var(--seg-destaque)' : 'var(--seg-borda)';
      textoEstado.textContent = 'dia ' + s.dia + ': ' + s.estado;
      textoLacre.textContent = 'lacre ' + (s.lacreRompido ? 'rompido' : 'intacto');
      textoRede.textContent = s.rede ? 'rede disponível' : 'sem rede';
      caixas.forEach(function (c, i) {
        c.textContent = s.fila[i] || '';
        if (c.textContent.length > 7) { c.setAttribute('textLength', FW - 10); c.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
        else { c.removeAttribute('textLength'); c.removeAttribute('lengthAdjust'); }
      });
      textoPerdidos.textContent = 'perdidos por fila cheia: ' + s.perdidos;
      caminho.style.stroke = s.rede ? 'var(--seg-primaria)' : 'var(--seg-borda)';
      caminho.style.strokeDasharray = s.rede ? 'none' : '6 6';
      textoPublicados.textContent = 'publicados ' + s.publicados;
      medida.textContent = 'dia ' + s.dia + ' · ' + s.estado + ' · fila ' + s.fila.length + ' · publicados ' + s.publicados;
      bRede.textContent = s.rede ? 'Desligar a rede' : 'Ligar a rede';
      bLacre.disabled = s.lacreRompido;
      bRetorno.disabled = s.retornoPendente;
      bAvancar.disabled = s.encerrado;
      if (!animando) pacote.style.display = 'none';
    }

    reiniciar();
  });
})();
