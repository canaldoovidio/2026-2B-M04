// Animação da Aula 06: publicação e assinatura num broker MQTT.
// Quatro rastreadores publicam em tópicos diferentes; um assinante escolhe o
// filtro (tópico exato, curinga + de um nível ou curinga # de vários níveis) e
// o broker entrega só o que casa. O casamento segue a seção 4.7.1 da
// especificação MQTT 3.1.1 (OASIS) e fica exposto em window.IntelIMqtt.casa
// para o teste conferir os exemplos da própria especificação. A contagem
// muda no clique; o ponto que percorre o caminho é só ilustração, e o laço de
// animação para de pedir quadros quando o slide sai de cena e volta com o
// evento slidechanged do Reveal. Sem cor literal; desenho só pelo
// viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var TOPICOS = ['cerradinho/dv01/lacre', 'cerradinho/dv02/lacre',
    'cerradinho/dv01/bateria', 'cerradinho/dv01/lacre/autorizada'];
  var FILTROS = ['cerradinho/dv01/lacre', 'cerradinho/+/lacre', 'cerradinho/dv01/+', 'cerradinho/#'];
  var BROKER = { x: 450, y: 210 };
  var ASSINANTE = { x: 640, y: 210 };
  var DURACAO = 900;   // ms de cada trecho do percurso

  function casa(filtro, topico) {
    var f = filtro.split('/');
    var t = topico.split('/');
    for (var i = 0; i < f.length; i++) {
      if (f[i] === '#') return true;
      if (i >= t.length) return false;
      if (f[i] !== '+' && f[i] !== t[i]) return false;
    }
    return f.length === t.length;
  }
  window.IntelIMqtt = { casa: casa };

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

  function yTopico(i) { return 60 + i * 100; }

  IntelIWidgets.registrar('mqtt-pubsub', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 760 470', role: 'img',
      'aria-label': 'Quatro rastreadores publicam no broker MQTT e um assinante recebe só os tópicos que casam com o filtro' }, elemento);

    var linhasPub = [];
    var marcas = [];
    TOPICOS.forEach(function (topico, i) {
      var y = yTopico(i);
      linhasPub.push(el('line', { x1: 334, y1: y, x2: BROKER.x - 50, y2: BROKER.y,
        style: 'stroke: var(--seg-borda); stroke-width: 3' }, svg));
      var grupo = el('g', { 'data-topico': topico, style: 'cursor: pointer' }, svg);
      el('rect', { x: 4, y: y - 30, width: 330, height: 60, rx: 8,
        style: 'fill: var(--seg-superficie); stroke: var(--seg-primaria); stroke-width: 2' }, grupo);
      var rotulo = el('text', { x: 14, y: y - 6, 'class': 'anim-rotulo' }, grupo);
      rotulo.textContent = 'rastreador ' + topico.split('/')[1].toUpperCase();
      var nomeTopico = el('text', { x: 14, y: y + 18, 'class': 'anim-codigo mono', style: 'font-size: 16px' }, grupo);
      nomeTopico.textContent = topico;
      marcas.push(el('text', { x: 322, y: y - 6, 'text-anchor': 'end', 'class': 'anim-rotulo', style: 'font-size: 16px' }, svg));
    });
    var linhaSub = el('line', { x1: BROKER.x + 50, y1: BROKER.y, x2: ASSINANTE.x - 90, y2: ASSINANTE.y,
      style: 'stroke: var(--seg-borda); stroke-width: 3' }, svg);
    el('circle', { cx: BROKER.x, cy: BROKER.y, r: 50, style: 'fill: var(--seg-primaria)' }, svg);
    var rotBroker = el('text', { x: BROKER.x, y: BROKER.y + 6, 'text-anchor': 'middle', 'class': 'anim-rotulo',
      style: 'fill: var(--seg-base)' }, svg);
    rotBroker.textContent = 'broker';
    el('rect', { x: ASSINANTE.x - 90, y: ASSINANTE.y - 70, width: 200, height: 140, rx: 8,
      style: 'fill: var(--seg-base); stroke: var(--seg-secundaria); stroke-width: 4' }, svg);
    var rotAss = el('text', { x: ASSINANTE.x + 10, y: ASSINANTE.y - 36, 'text-anchor': 'middle', 'class': 'anim-rotulo' }, svg);
    rotAss.textContent = 'assinante (BI)';
    var rotFiltro = el('text', { x: ASSINANTE.x + 10, y: ASSINANTE.y - 4, 'text-anchor': 'middle',
      'class': 'anim-codigo mono', style: 'font-size: 15px' }, svg);
    var rotRecebidas = el('text', { x: ASSINANTE.x + 10, y: ASSINANTE.y + 40, 'text-anchor': 'middle', 'class': 'anim-rotulo' }, svg);
    var dica = el('text', { x: 4, y: 440, 'class': 'anim-codigo', style: 'font-size: 15px' }, svg);
    dica.textContent = 'Clique num rastreador para publicar só a dele. O + vale um nível; o # vale vários e vem no fim.';
    var ponto = el('circle', { r: 10, style: 'fill: var(--seg-destaque); display: none' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Quem recebe cada publicação?', painel);
    html('p', null, 'Antes de publicar: com o filtro cerradinho/+/lacre, quantas das quatro chegam?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    medida.style.fontSize = '17px';
    var caixaFiltros = html('div', 'widget-controles', null, painel);
    var botoesFiltro = FILTROS.map(function (filtro) {
      var b = html('button', 'mono', filtro, caixaFiltros);
      b.style.fontSize = '14px';
      b.addEventListener('click', function () { escolher(filtro); });
      return b;
    });
    var caixaPub = html('div', 'widget-controles', null, painel);
    var bTodas = html('button', null, 'Publicar as quatro', caixaPub);

    var filtroAtual = FILTROS[0];
    var publicadas = 0;
    var recebidas = 0;
    var fila = [];
    var emCurso = null;
    var rodando = false;

    function iniciar() {
      if (rodando) return;
      rodando = true;
      window.requestAnimationFrame(quadro);
    }

    function atualizar() {
      medida.textContent = filtroAtual + ' · recebidas ' + recebidas + ' de ' + publicadas;
      rotFiltro.textContent = filtroAtual;
      rotRecebidas.textContent = recebidas + ' recebida' + (recebidas === 1 ? '' : 's');
      botoesFiltro.forEach(function (b) { b.classList.toggle('ativo', b.textContent === filtroAtual); });
    }

    function escolher(filtro) {
      filtroAtual = filtro;
      publicadas = 0;
      recebidas = 0;
      fila = [];
      emCurso = null;
      ponto.style.display = 'none';
      marcas.forEach(function (m) { m.textContent = ''; });
      linhasPub.forEach(function (l) { l.style.stroke = 'var(--seg-borda)'; });
      atualizar();
    }

    function publicar(i) {
      var entregue = casa(filtroAtual, TOPICOS[i]);
      publicadas++;
      if (entregue) recebidas++;
      marcas[i].textContent = entregue ? 'entregue' : 'descartada';
      marcas[i].style.fill = entregue ? 'var(--seg-texto)' : 'var(--seg-destaque)';
      linhasPub[i].style.stroke = entregue ? 'var(--seg-secundaria)' : 'var(--seg-destaque)';
      atualizar();
      fila.push({ i: i, entregue: entregue });
      iniciar();
    }

    function posicao(item, s) {
      var y0 = yTopico(item.i);
      if (s <= 1) {
        return { x: 334 + (BROKER.x - 334) * s, y: y0 + (BROKER.y - y0) * s };
      }
      var u = s - 1;
      var xFim = item.entregue ? ASSINANTE.x - 90 : BROKER.x + 50;
      return { x: BROKER.x + (xFim - BROKER.x) * u, y: BROKER.y };
    }

    function quadro(t) {
      if (!visivel(elemento)) {
        // Fora de cena: o laço para, e o trecho em curso recomeça quando o slide volta.
        rodando = false;
        if (emCurso) emCurso.inicio = null;
        return;
      }
      if (!emCurso) {
        if (!fila.length) { ponto.style.display = 'none'; rodando = false; return; }
        emCurso = { item: fila.shift(), inicio: null };
      }
      if (emCurso.inicio === null) emCurso.inicio = t;
      var s = (t - emCurso.inicio) / DURACAO;
      var limite = emCurso.item.entregue ? 2 : 1;
      if (s >= limite) {
        emCurso = null;
      } else {
        var p = posicao(emCurso.item, s);
        ponto.style.display = '';
        ponto.setAttribute('cx', p.x.toFixed(1));
        ponto.setAttribute('cy', p.y.toFixed(1));
        linhaSub.style.stroke = s > 1 ? 'var(--seg-secundaria)' : 'var(--seg-borda)';
      }
      window.requestAnimationFrame(quadro);
    }

    if (window.Reveal && window.Reveal.on) {
      window.Reveal.on('slidechanged', function () {
        if (visivel(elemento) && (emCurso || fila.length)) iniciar();
      });
    }

    svg.querySelectorAll('[data-topico]').forEach(function (grupo, i) {
      grupo.addEventListener('click', function () { publicar(i); });
    });
    bTodas.addEventListener('click', function () {
      TOPICOS.forEach(function (_, i) { publicar(i); });
    });
    atualizar();
  });
})();
