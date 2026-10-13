// Animação da Aula 09: o caminho do alerta do sensor até o relé, pelo broker.
// Saltos contados: 1 sensor ao rastreador (fio), 2 rastreador ao broker (publica
// o alerta), 3 e 4 broker à central e ao operador (a mesma mensagem entregue aos
// dois assinantes), 5 operador ao broker (publica a confirmação), 6 broker à
// central, 7 central ao relé (GPIO). Depois do salto 4 a central fica armada e
// espera a confirmação por 30 s; sem ela, desarma sozinha e o relé não liga. O
// relógio da espera corre 10 vezes mais rápido que o real. Sem cor literal;
// desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var SALTO_MS = 700;
  var ESPERA_S = 30;
  var ACELERACAO = 10;
  var L = 150, A = 64;
  var NOS = {
    sensor: { x: 40, y: 40, nome: 'Sensor' },
    rastreador: { x: 40, y: 200, nome: 'Rastreador' },
    broker: { x: 285, y: 200, nome: 'Broker' },
    operador: { x: 285, y: 40, nome: 'Operador' },
    central: { x: 530, y: 200, nome: 'Central' },
    rele: { x: 530, y: 360, nome: 'Relé' }
  };
  // Cada salto com os extremos na borda das caixas e a posição do número.
  // Ida e volta entre broker e operador, e alerta e confirmação entre broker e
  // central, correm em linhas paralelas para não se sobrepor.
  var SALTOS = [
    { a: [115, 110], b: [115, 194], n: [128, 158, 'start'] },
    { a: [196, 232], b: [279, 232], n: [237, 222, 'middle'] },
    { a: [441, 222], b: [524, 222], n: [482, 212, 'middle'] },
    { a: [346, 194], b: [346, 110], n: [334, 158, 'end'] },
    { a: [374, 110], b: [374, 194], n: [386, 158, 'start'] },
    { a: [441, 242], b: [524, 242], n: [482, 266, 'middle'] },
    { a: [605, 270], b: [605, 354], n: [618, 318, 'start'] }
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

  IntelIWidgets.registrar('caminho-alerta', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Caminho do alerta do sensor ao relé, passando pelo broker e pela confirmação do operador' }, elemento);

    var linhas = SALTOS.map(function (s, i) {
      var ln = el('line', { x1: s.a[0], y1: s.a[1], x2: s.b[0], y2: s.b[1],
        style: 'stroke: var(--seg-borda); stroke-width: 4' }, svg);
      var numero = el('text', { x: s.n[0], y: s.n[1], 'class': 'anim-rotulo mono', 'text-anchor': s.n[2] }, svg);
      numero.textContent = String(i + 1);
      return ln;
    });
    [['3 e 4: o broker entrega o mesmo alerta', 330], ['aos dois assinantes', 354],
     ['5 e 6: a confirmação do operador', 390], ['volta pelo broker', 414]].forEach(function (l) {
      var t = el('text', { x: 40, y: l[1], 'class': 'anim-rotulo', 'text-anchor': 'start' }, svg);
      t.textContent = l[0];
    });

    var caixas = {};
    Object.keys(NOS).forEach(function (k) {
      var n = NOS[k];
      var r = el('rect', { x: n.x, y: n.y, width: L, height: A, rx: 8,
        style: 'fill: var(--seg-superficie); stroke: var(--seg-primaria); stroke-width: 3' }, svg);
      var t = el('text', { x: n.x + L / 2, y: n.y + 28, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, svg);
      t.textContent = n.nome;
      var sub = el('text', { x: n.x + L / 2, y: n.y + 50, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, svg);
      caixas[k] = { rect: r, sub: sub };
    });
    var pacotes = [el('circle', { r: 10, style: 'fill: var(--seg-destaque); display: none' }, svg),
                   el('circle', { r: 10, style: 'fill: var(--seg-destaque); display: none' }, svg)];

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Do sensor ao relé, pelo broker', painel);
    html('p', null, 'Antes de disparar: quantos saltos a mensagem dá do sensor até o relé? E se ninguém confirmar?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    var bPerm = html('button', null, 'Permanência > 150 dias', botoes);
    bPerm.dataset.acao = 'permanencia';
    var bLacre = html('button', null, 'Lacre rompido', botoes);
    bLacre.dataset.acao = 'lacre';
    var bConf = html('button', null, 'Confirmar', botoes);
    bConf.dataset.acao = 'confirmar';
    var bRein = html('button', null, 'Reiniciar', botoes);
    bRein.dataset.acao = 'reiniciar';
    html('p', null, 'Espera de 30 s num relógio 10 vezes mais rápido. Os 7 saltos são do desenho do case; no laboratório, rastreador e central rodam no mesmo ESP32.', painel);

    var estado, saltos, fila, decorrido, restante;

    function sub(nome, texto) { caixas[nome].sub.textContent = texto; }

    function reiniciar() {
      estado = 'parado'; saltos = 0; fila = []; decorrido = 0; restante = ESPERA_S;
      Object.keys(NOS).forEach(function (k) { sub(k, ''); caixas[k].rect.style.fill = 'var(--seg-superficie)'; });
      sub('central', 'monitorando');
      sub('rele', 'desligado');
      linhas.forEach(function (l) { l.style.stroke = 'var(--seg-borda)'; });
      pacotes.forEach(function (p) { p.style.display = 'none'; });
      atualizar();
    }

    function atualizar() {
      var texto;
      if (estado === 'armado') texto = 'saltos ' + saltos + ' · aguardando confirmação ' + Math.ceil(restante) + ' s';
      else if (estado === 'desarmado') texto = 'saltos ' + saltos + ' · desarmado sem confirmação';
      else if (estado === 'disparado') texto = 'saltos ' + saltos + ' · relé ligado';
      else texto = 'saltos ' + saltos + ' · relé desligado';
      medida.textContent = texto;
      var ocupado = estado === 'indo' || estado === 'voltando';
      bPerm.disabled = estado !== 'parado';
      bLacre.disabled = estado !== 'parado';
      bConf.disabled = estado !== 'armado';
      bRein.disabled = ocupado;
    }

    function iniciar(motivo) {
      if (estado !== 'parado') return;
      sub('sensor', motivo === 'lacre' ? 'lacre rompido' : '151 dias');
      caixas.sensor.rect.style.fill = 'var(--seg-secundaria)';
      estado = 'indo';
      fila = [[0], [1], [2, 3]];
      decorrido = 0;
      atualizar();
    }

    function concluirEtapa(indices) {
      indices.forEach(function (i) { linhas[i].style.stroke = 'var(--seg-primaria)'; });
      saltos += indices.length;
      var ultimo = indices[indices.length - 1];
      if (ultimo === 3) {
        estado = 'armado'; restante = ESPERA_S;
        sub('central', 'armada'); sub('operador', 'vê o alerta');
        caixas.central.rect.style.fill = 'var(--seg-secundaria)';
      }
      if (ultimo === 6) {
        estado = 'disparado';
        sub('rele', 'ligado');
        sub('central', 'disparou');
        caixas.rele.rect.style.fill = 'var(--seg-destaque)';
      }
    }

    function desenharPacotes(indices, f) {
      pacotes.forEach(function (p, k) {
        if (k >= indices.length) { p.style.display = 'none'; return; }
        var s = SALTOS[indices[k]];
        p.style.display = '';
        p.setAttribute('cx', (s.a[0] + (s.b[0] - s.a[0]) * f).toFixed(1));
        p.setAttribute('cy', (s.a[1] + (s.b[1] - s.a[1]) * f).toFixed(1));
      });
    }

    var anterior = null;
    function quadro(t) {
      var dt = anterior === null ? 0 : Math.min(t - anterior, 100);
      anterior = t;
      if (visivel(elemento)) {
        if ((estado === 'indo' || estado === 'voltando') && fila.length) {
          decorrido += dt;
          var f = Math.min(decorrido / SALTO_MS, 1);
          desenharPacotes(fila[0], f);
          if (f >= 1) {
            concluirEtapa(fila.shift());
            decorrido = 0;
            if (!fila.length) desenharPacotes([], 0);
            atualizar();
          }
        } else if (estado === 'armado') {
          restante -= dt * ACELERACAO / 1000;
          if (restante <= 0) {
            estado = 'desarmado';
            sub('central', 'desarmada');
            caixas.central.rect.style.fill = 'var(--seg-superficie)';
          }
          atualizar();
        }
      }
      window.requestAnimationFrame(quadro);
    }

    bPerm.addEventListener('click', function () { iniciar('permanencia'); });
    bLacre.addEventListener('click', function () { iniciar('lacre'); });
    bConf.addEventListener('click', function () {
      if (estado !== 'armado') return;
      estado = 'voltando';
      sub('operador', 'confirmou');
      fila = [[4], [5], [6]];
      decorrido = 0;
      atualizar();
    });
    bRein.addEventListener('click', reiniciar);

    reiniciar();
    window.requestAnimationFrame(quadro);
  });
})();
