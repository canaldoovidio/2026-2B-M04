// Animação da Aula 01: setup roda uma vez, loop repete para sempre.
// Um marcador percorre o sketch do LED de status linha a linha, com o tempo
// simulado de cada linha; o LED desenhado acende e apaga junto com digitalWrite.
// Contadores mostram quantas vezes cada parte já executou. Sem cor literal.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  // Cada linha: texto, tempo real em ms, efeito no LED e a qual bloco pertence.
  // pinMode e digitalWrite levam microssegundos: custo zero no relógio. Toda
  // linha fica ao menos 150 ms na tela para ser lida, sem somar ao relógio.
  var LINHAS = [
    { t: 'void setup() {', ms: 0, bloco: 'setup' },
    { t: '  pinMode(8, OUTPUT);', ms: 0, bloco: 'setup' },
    { t: '}', ms: 0, bloco: 'setup' },
    { t: 'void loop() {', ms: 0, bloco: 'loop' },
    { t: '  digitalWrite(8, HIGH);', ms: 0, bloco: 'loop', led: true },
    { t: '  delay(200);', ms: 200, bloco: 'loop' },
    { t: '  digitalWrite(8, LOW);', ms: 0, bloco: 'loop', led: false },
    { t: '  delay(1800);', ms: 1800, bloco: 'loop' },
    { t: '}', ms: 0, bloco: 'loop' }
  ];
  var INICIO_LOOP = 3;

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

  // No deck, só anima o slide presente; fora do Reveal (material de apoio)
  // não há slide, e a animação roda sempre.
  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  IntelIWidgets.registrar('setup-loop', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Sketch do LED de status com marcador de execução e LED sincronizado' }, elemento);

    el('rect', { x: 20, y: 20, width: 470, height: 400, rx: 12, style: 'fill: var(--seg-primaria)' }, svg);
    var marcador = el('rect', { x: 32, y: 0, width: 446, height: 32, rx: 6,
      style: 'fill: var(--seg-secundaria); opacity: 0.35; transition: y 0.18s ease' }, svg);
    var faixaSetup = el('rect', { x: 20, y: 48, width: 6, height: 3 * 36, style: 'fill: var(--seg-secundaria)' }, svg);
    var faixaLoop = el('rect', { x: 20, y: 48 + 3 * 36 + 18, width: 6, height: 6 * 36, style: 'fill: var(--seg-destaque)' }, svg);
    LINHAS.forEach(function (linha, k) {
      var t = el('text', { x: 44, y: yLinha(k) + 22, 'class': 'anim-codigo mono', style: 'fill: var(--seg-base); white-space: pre' }, svg);
      t.textContent = linha.t;
    });
    function yLinha(k) { return 48 + k * 36 + (k >= INICIO_LOOP ? 18 : 0); }

    var rotSetup = el('text', { x: 510, y: 100, 'class': 'anim-rotulo', 'text-anchor': 'start' }, svg);
    var rotLoop = el('text', { x: 510, y: 300, 'class': 'anim-rotulo', 'text-anchor': 'start' }, svg);
    var rotWrite = el('text', { x: 510, y: 330, 'class': 'anim-rotulo', 'text-anchor': 'start' }, svg);
    var halo = el('circle', { cx: 620, cy: 200, r: 44, style: 'fill: var(--seg-destaque); opacity: 0' }, svg);
    var led = el('circle', { cx: 620, cy: 200, r: 22,
      style: 'fill: var(--seg-base); stroke: var(--seg-primaria); stroke-width: 4' }, svg);
    var rotLed = el('text', { x: 620, y: 252, 'class': 'anim-rotulo' + ' mono', 'text-anchor': 'middle' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'O que o Arduino executa', painel);
    html('p', null, 'Antes de tocar: em 10 segundos, quantas vezes o pinMode executa? E o digitalWrite(8, HIGH)?', painel);
    var relogio = html('p', 'anim-medida mono', '', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    var bPausa = html('button', null, 'Pausar', botoes);
    var b1 = html('button', 'ativo', '1x', botoes);
    var b4 = html('button', null, '4x', botoes);
    var bReinicio = html('button', null, 'Reiniciar', botoes);

    var estado;
    function reiniciar() {
      estado = { linha: 0, restante: 150, simuladoMs: 0, setups: 0, loops: 0, acendimentos: 0, ledAceso: false };
      mostrar();
    }
    var velocidade = 1;
    var pausado = false;
    var ultimo = null;

    function mostrar() {
      marcador.setAttribute('y', String(yLinha(estado.linha) + 2));
      rotSetup.textContent = 'setup: ' + estado.setups + (estado.setups === 1 ? ' vez' : ' vezes');
      rotLoop.textContent = 'loop: ' + estado.loops + (estado.loops === 1 ? ' vez' : ' vezes');
      rotWrite.textContent = 'HIGH: ' + estado.acendimentos + (estado.acendimentos === 1 ? ' vez' : ' vezes');
      led.style.fill = estado.ledAceso ? 'var(--seg-destaque)' : 'var(--seg-base)';
      halo.style.opacity = estado.ledAceso ? '0.35' : '0';
      rotLed.textContent = estado.ledAceso ? 'HIGH' : 'LOW';
      relogio.textContent = (estado.simuladoMs / 1000).toFixed(1).replace('.', ',') + ' s';
      faixaSetup.style.opacity = estado.linha < INICIO_LOOP ? '1' : '0.3';
      faixaLoop.style.opacity = estado.linha >= INICIO_LOOP ? '1' : '0.3';
    }

    function avancarLinha() {
      var atual = LINHAS[estado.linha];
      if (atual.led !== undefined) estado.ledAceso = atual.led;
      if (atual.led === true) estado.acendimentos += 1;
      if (estado.linha === 2) estado.setups += 1;
      var proxima = estado.linha + 1;
      if (proxima >= LINHAS.length) {
        estado.loops += 1;
        proxima = INICIO_LOOP;
      }
      estado.linha = proxima;
      estado.restante = Math.max(LINHAS[proxima].ms, 150);
    }

    function quadro(t) {
      if (ultimo === null) ultimo = t;
      var dt = Math.min(t - ultimo, 100);
      ultimo = t;
      if (!pausado && visivel(elemento)) {
        // Linha sem custo de tempo (chave, declaração) fica 150 ms na tela para
        // ser lida, mas não soma ao relógio simulado.
        var passo = dt * velocidade;
        var real = LINHAS[estado.linha].ms;
        estado.simuladoMs += passo * (real / Math.max(real, 150));
        estado.restante -= passo;
        while (estado.restante <= 0) {
          var sobra = -estado.restante;
          avancarLinha();
          estado.restante -= sobra;
        }
        mostrar();
      }
      window.requestAnimationFrame(quadro);
    }

    bPausa.addEventListener('click', function () {
      pausado = !pausado;
      bPausa.textContent = pausado ? 'Continuar' : 'Pausar';
      bPausa.classList.toggle('ativo', pausado);
    });
    b1.addEventListener('click', function () { velocidade = 1; b1.classList.add('ativo'); b4.classList.remove('ativo'); });
    b4.addEventListener('click', function () { velocidade = 4; b4.classList.add('ativo'); b1.classList.remove('ativo'); });
    bReinicio.addEventListener('click', reiniciar);

    reiniciar();
    window.requestAnimationFrame(quadro);
  });
})();
