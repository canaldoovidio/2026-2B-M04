// Animação da Aula 11: superfície de ataque do rastreador, do sensor à API.
// Cinco elos em linha (lacre, ESP32, rede, broker MQTT, API e BI) e o
// repositório do código acima do ESP32. Seis pontos de ataque numerados; cada
// defesa ligada no painel fecha os pontos que ela cobre. O ponto do broker só
// fecha com usuário e senha E com TLS, porque sem TLS a senha do CONNECT viaja
// em texto claro na porta 1883. Um evento do ciclo percorre a cadeia em laço,
// pausado quando o slide não está em cena. Sem cor literal; desenho só pelo
// viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var Y_ELO = 110, ALTURA_ELO = 74, LARGURA_ELO = 118;
  var ELOS = [
    { x: 72, linhas: ['Lacre e', 'sensores'] },
    { x: 216, linhas: ['ESP32', 'firmware'] },
    { x: 360, linhas: ['Wi-Fi e', 'internet'] },
    { x: 504, linhas: ['Broker', 'MQTT'] },
    { x: 648, linhas: ['API', 'e BI'] }
  ];
  var DEFESAS = [
    { chave: 'repositorio', rotulo: 'Credenciais fora do código' },
    { chave: 'flash', rotulo: 'Criptografia da flash' },
    { chave: 'tls', rotulo: 'TLS no MQTT' },
    { chave: 'senha', rotulo: 'Usuário e senha no broker' },
    { chave: 'api', rotulo: 'Login na API' }
  ];
  // Cada ponto fecha quando TODAS as defesas da lista estão ligadas.
  var PONTOS = [
    { n: 1, x: 300, y: 40, onde: 'Repositório', ameaca: 'senha versionada no código', exige: ['repositorio'] },
    { n: 2, x: 216, y: Y_ELO + ALTURA_ELO + 22, onde: 'ESP32', ameaca: 'flash lida com o rastreador no fornecedor', exige: ['flash'] },
    { n: 3, x: 336, y: Y_ELO + ALTURA_ELO + 22, onde: 'Rede', ameaca: 'evento (localização, NF) lido no caminho', exige: ['tls'] },
    { n: 4, x: 384, y: Y_ELO + ALTURA_ELO + 22, onde: 'Rede', ameaca: 'evento alterado ou forjado no caminho', exige: ['tls'] },
    { n: 5, x: 504, y: Y_ELO + ALTURA_ELO + 22, onde: 'Broker', ameaca: 'cliente desconhecido assina ou publica', exige: ['senha', 'tls'] },
    { n: 6, x: 648, y: Y_ELO + ALTURA_ELO + 22, onde: 'API', ameaca: 'consulta das localizações sem login', exige: ['api'] }
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

  IntelIWidgets.registrar('superficie-ataque', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Cadeia do rastreador, do lacre à API, com seis pontos de ataque numerados' }, elemento);

    // Repositório acima do ESP32, ligado por linha tracejada: o código sai dele.
    el('rect', { x: 150, y: 14, width: 132, height: 52, rx: 8,
      style: 'fill: var(--seg-base); stroke: var(--seg-borda); stroke-width: 2' }, svg);
    var tRepo = el('text', { x: 216, y: 46, 'class': 'anim-rotulo', 'text-anchor': 'middle', style: 'font-size: 16px' }, svg);
    tRepo.textContent = 'Repositório';
    el('line', { x1: 216, y1: 66, x2: 216, y2: Y_ELO,
      style: 'stroke: var(--seg-borda); stroke-width: 2; stroke-dasharray: 5 4' }, svg);

    el('line', { x1: ELOS[0].x, y1: Y_ELO + ALTURA_ELO / 2, x2: ELOS[4].x, y2: Y_ELO + ALTURA_ELO / 2,
      style: 'stroke: var(--seg-primaria); stroke-width: 4' }, svg);
    // O evento passa por trás dos elos: aparece só nos trechos de ligação.
    var evento = el('circle', { cx: ELOS[0].x, cy: Y_ELO + ALTURA_ELO / 2, r: 8,
      style: 'fill: var(--seg-secundaria); stroke: var(--seg-primaria); stroke-width: 2' }, svg);
    ELOS.forEach(function (elo) {
      el('rect', { x: elo.x - LARGURA_ELO / 2, y: Y_ELO, width: LARGURA_ELO, height: ALTURA_ELO, rx: 8,
        style: 'fill: var(--seg-superficie); stroke: var(--seg-primaria); stroke-width: 2' }, svg);
      elo.linhas.forEach(function (linha, i) {
        var t = el('text', { x: elo.x, y: Y_ELO + 32 + i * 22, 'class': 'anim-rotulo', 'text-anchor': 'middle',
          style: 'font-size: 16px' }, svg);
        t.textContent = linha;
      });
    });

    var marcas = PONTOS.map(function (p) {
      var g = el('g', { 'data-ponto': String(p.n) }, svg);
      var c = el('circle', { cx: p.x, cy: p.y, r: 15, style: 'stroke: var(--seg-base); stroke-width: 2' }, g);
      var t = el('text', { x: p.x, y: p.y + 6, 'text-anchor': 'middle', 'class': 'mono',
        style: 'font-size: 16px; font-weight: 700' }, g);
      t.textContent = String(p.n);
      return { g: g, c: c, t: t };
    });

    // Legenda: uma linha por ponto, com o estado.
    var Y_LISTA = 250;
    var linhasLista = PONTOS.map(function (p, i) {
      var t = el('text', { x: 24, y: Y_LISTA + i * 30, 'class': 'anim-codigo', style: 'font-size: 16px' }, svg);
      return t;
    });

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Do lacre à API: onde o atacante entra', painel);
    html('p', null, 'Antes de ligar as defesas: com usuário e senha no broker e sem TLS, o ponto 5 fecha?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    var ligadas = {};
    DEFESAS.forEach(function (d) {
      var b = html('button', null, d.rotulo, botoes);
      b.dataset.defesa = d.chave;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        ligadas[d.chave] = !ligadas[d.chave];
        b.classList.toggle('ativo', !!ligadas[d.chave]);
        b.setAttribute('aria-pressed', ligadas[d.chave] ? 'true' : 'false');
        atualizar();
      });
    });
    html('p', null, 'Coral: ponto aberto. Verde: ponto fechado.', painel);

    function aberto(p) {
      return !p.exige.every(function (k) { return ligadas[k]; });
    }

    function atualizar() {
      var abertos = 0;
      PONTOS.forEach(function (p, i) {
        var a = aberto(p);
        if (a) abertos += 1;
        marcas[i].g.setAttribute('data-aberto', a ? 'sim' : 'nao');
        marcas[i].c.style.fill = a ? 'var(--seg-destaque)' : 'var(--seg-secundaria)';
        marcas[i].t.style.fill = a ? 'var(--seg-base)' : 'var(--seg-texto)';
        var extra = '';
        if (p.n === 5 && a && ligadas.senha && !ligadas.tls) extra = ' (senha em claro)';
        linhasLista[i].textContent = p.n + '. ' + p.onde + ': ' + p.ameaca + ' · ' + (a ? 'aberto' : 'fechado') + extra;
      });
      medida.textContent = abertos + ' de ' + PONTOS.length + ' pontos abertos';
    }

    var inicio = null;
    function quadro(t) {
      if (visivel(elemento)) {
        if (inicio === null) inicio = t;
        var fase = ((t - inicio) % 4000) / 4000;
        evento.setAttribute('cx', (ELOS[0].x + (ELOS[4].x - ELOS[0].x) * fase).toFixed(1));
      } else {
        inicio = null;
      }
      window.requestAnimationFrame(quadro);
    }

    atualizar();
    window.requestAnimationFrame(quadro);
  });
})();
