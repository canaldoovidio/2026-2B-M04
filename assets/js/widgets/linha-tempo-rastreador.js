// Animação da Aula 12: o rastreador da Cerradinho camada por camada, aula a aula.
// A linha do alto mostra as 12 aulas agrupadas nas cinco sprints; a torre de baixo
// empilha uma camada por aula. Camadas, datas, entregas e pesos vêm do
// PLANO_DE_ENSINO.md (seções 2, 3 e 4); o teste confere as camadas contra o plano.
// Clicar numa camada da torre marca a camada que o grupo julga mais frágil.
// Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var PASSO_MS = 900;

  var AULAS = [
    { n: '01', data: '15/10', s: 1, curta: 'LED de status', camada: 'LED de status indicando que o dispositivo está vivo: circuito, resistor e lei de Ohm' },
    { n: '02', data: '20/10', s: 1, curta: 'Lacre com debounce', camada: 'Lacre modelado como chave: violação aciona LED e buzzer, com debounce por RC e por firmware' },
    { n: '03', data: '22/10', s: 1, curta: 'ESP32 e estados do ciclo', camada: 'ESP32 e máquina de estados do ciclo, com limiar de permanência configurável' },
    { n: '04', data: '30/10', s: 2, curta: 'Fila de eventos sem conexão', camada: 'Memória e ponteiros: buffer circular que guarda eventos sem conexão e os envia depois' },
    { n: '05', data: '05/11', s: 2, curta: 'Bateria e remoção (ADC)', camada: 'ADC: tensão da bateria por divisor resistivo e acelerômetro detectando remoção' },
    { n: '06', data: '13/11', s: 3, curta: 'Wi-Fi e MQTT', camada: 'Wi-Fi e MQTT: publicação do evento do ciclo em JSON' },
    { n: '07', data: '18/11', s: 3, curta: 'Display I2C e PWM', camada: 'Display I2C com dias fora, estado do lacre e bateria; PWM no indicador' },
    { n: '08', data: '27/11', s: 4, curta: 'RSSI e dashboard', camada: 'RSSI em dBm, última comunicação e dashboard de acompanhamento' },
    { n: '09', data: '02/12', s: 4, curta: 'Atuador remoto', camada: 'Alerta de permanência ou violação aciona atuador remoto via MQTT' },
    { n: '10', data: '03/12', s: 4, curta: 'Integração e deep sleep', camada: 'Ciclo completo integrado, testes em C++ e deep sleep, com autonomia estimada' },
    { n: '11', data: '10/12', s: 5, curta: 'Segurança e TLS', camada: 'Segurança: autenticação, MQTT com TLS, credenciais fora do código' },
    { n: '12', data: '17/12', s: 5, curta: 'Revisão contra o TAPI', camada: 'Revisão do rastreador contra os entregáveis finais' }
  ];

  var SPRINTS = {
    1: { rito: 'Sprint Review 1 em 23/10', entregas: [
      ['Domínio dos fundamentos de negócio', 3],
      ['Domínio dos fundamentos da experiência de usuário - Personas', 1],
      ['Protótipo inicial do projeto usando o simulador wokwi', 1],
      ['Requisitos Funcionais, Regras de Negócio e Matriz de Rastreabilidade', 2]] },
    2: { rito: 'Sprint Review 2 em 06/11', entregas: [
      ['Protótipo físico do projeto (offline)', 4],
      ['Requisitos Não Funcionais', 2],
      ['Domínio dos fundamentos da experiência de usuário - Jornada do Usuário e Storyboard', 2]] },
    3: { rito: 'Sprint Review 3 em 19/11', entregas: [
      ['Protótipo do Projeto com MQTT e I2C', 3],
      ['Metodologia e Arquitetura da solução', 3],
      ['Circuito RC', 2]] },
    4: { rito: 'Sprint Review 4 em 04/12', entregas: [
      ['Protótipo físico do projeto (online)', 2],
      ['Código do projeto', 2],
      ['Manual de Instruções', 2],
      ['Arquitetura do protótipo', 2],
      ['Possibilidades de descarte', 1]] },
    5: { rito: 'Apresentação Final em 18/12', entregas: [
      ['Protótipo final do projeto', 3],
      ['Código do projeto (versão final)', 1],
      ['Arquitetura refinada da solução', 1],
      ['Manual de instruções revisado', 1],
      ['Critérios de qualidade GITHUB', 2]] }
  };

  var X0 = 50, X1 = 670, Y_LINHA = 58;
  var TORRE_X = 64, TORRE_L = 270, TORRE_BASE = 446, BLOCO_A = 25, BLOCO_GAP = 3;

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

  function xAula(i) { return X0 + (X1 - X0) * i / (AULAS.length - 1); }
  var CARTAO_X = 352, CARTAO_Y = 110, LINHA_A = 21, COLUNAS = 42;

  // Quebra de linha por contagem de caracteres: o SVG não quebra texto, e medir
  // layout é proibido (slide fora de cena mede zero).
  function quebrar(texto) {
    var linhas = [], atual = '';
    texto.split(' ').forEach(function (palavra) {
      if (atual && (atual + ' ' + palavra).length > COLUNAS) { linhas.push(atual); atual = palavra; }
      else { atual = atual ? atual + ' ' + palavra : palavra; }
    });
    if (atual) linhas.push(atual);
    return linhas;
  }

  function yBloco(i) { return TORRE_BASE - (i + 1) * (BLOCO_A + BLOCO_GAP); }

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  IntelIWidgets.registrar('linha-tempo-rastreador', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 460', role: 'img',
      'aria-label': 'Linha do tempo das 12 aulas agrupadas em cinco sprints e torre com uma camada do rastreador por aula' }, elemento);

    // Faixas das sprints na linha do tempo.
    [1, 2, 3, 4, 5].forEach(function (s) {
      var idx = AULAS.map(function (a, i) { return a.s === s ? i : -1; }).filter(function (i) { return i >= 0; });
      var xa = xAula(idx[0]) - 22, xb = xAula(idx[idx.length - 1]) + 22;
      el('rect', { x: xa, y: 8, width: xb - xa, height: 80, rx: 6,
        style: 'fill: var(--seg-superficie); stroke: var(--seg-borda); stroke-width: 1' }, svg);
      var rs = el('text', { x: (xa + xb) / 2, y: 26, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, svg);
      rs.textContent = 'S' + s;
    });
    el('line', { x1: X0, x2: X1, y1: Y_LINHA, y2: Y_LINHA, style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);

    var nos = AULAS.map(function (a, i) {
      var c = el('circle', { cx: xAula(i), cy: Y_LINHA, r: 9,
        style: 'fill: var(--seg-base); stroke: var(--seg-primaria); stroke-width: 3' }, svg);
      var t = el('text', { x: xAula(i), y: Y_LINHA + 28, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, svg);
      t.textContent = a.n;
      return c;
    });

    var blocos = AULAS.map(function (a, i) {
      var r = el('rect', { x: TORRE_X, y: yBloco(i), width: TORRE_L, height: BLOCO_A, rx: 3,
        'class': 'camada', 'data-aula': a.n }, svg);
      r.style.cursor = 'pointer';
      var t = el('text', { x: TORRE_X + 14, y: yBloco(i) + 18, 'class': 'anim-rotulo' }, svg);
      t.style.pointerEvents = 'none';
      t.textContent = a.n + '  ' + a.curta;
      t.setAttribute('style', 'white-space: pre; pointer-events: none; font-size: 15px');
      var s = el('text', { x: TORRE_X - 12, y: yBloco(i) + 18, 'class': 'anim-rotulo mono', 'text-anchor': 'end' }, svg);
      s.textContent = 'S' + a.s;
      return { rect: r, texto: t };
    });

    // Cartão da sprint, à direita da torre. textContent do grupo concatena as
    // linhas; cada linha quebrada termina em espaço para a frase continuar legível.
    el('rect', { x: CARTAO_X - 14, y: CARTAO_Y - 4, width: 720 - CARTAO_X + 10, height: TORRE_BASE - CARTAO_Y + 4, rx: 6,
      style: 'fill: var(--seg-superficie); stroke: none' }, svg);
    var cartao = el('g', { 'class': 'anim-sprint' }, svg);

    function escreverCartao(a) {
      while (cartao.firstChild) cartao.removeChild(cartao.firstChild);
      var y = CARTAO_Y + 22;
      function linha(texto, peso, final) {
        var t = el('text', { x: CARTAO_X, y: y, 'class': 'anim-rotulo' }, cartao);
        t.setAttribute('style', 'font-size: 16px; font-weight: ' + peso);
        t.textContent = texto + (final ? '' : ' ');
        y += LINHA_A;
      }
      if (!a) {
        linha('Avance a linha do tempo para ver', 500, false);
        linha('a entrega de cada sprint.', 500, true);
        return;
      }
      var sp = SPRINTS[a.s];
      linha('Sprint ' + a.s + ' · ' + sp.rito + '.', 700, false);
      linha('Entregas:', 600, false);
      y += 6;
      sp.entregas.forEach(function (e, k) {
        var partes = quebrar(e[0] + ', peso ' + e[1] + (k === sp.entregas.length - 1 ? '.' : ';'));
        partes.forEach(function (parte, j) {
          linha(parte, 500, k === sp.entregas.length - 1 && j === partes.length - 1);
        });
        y += 4;
      });
    }

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'O rastreador em 12 camadas', painel);
    html('p', null, 'Antes de rodar: qual camada do seu rastreador ficou mais frágil? Depois, clique nela na torre.', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    var pCamada = html('p', 'anim-camada', '', painel);
    var pFragil = html('p', 'anim-fragil', '', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    var bAnterior = html('button', null, 'Anterior', botoes);
    var bProxima = html('button', null, 'Próxima', botoes);
    var bReproduzir = html('button', null, 'Reproduzir', botoes);

    var passo = 0;           // camadas construídas, de 0 a 12
    var fragil = null;       // índice da camada marcada
    var tocando = false;
    var ultimoQuadro = null;

    function desenhar() {
      medida.textContent = passo + ' de 12 camadas';
      blocos.forEach(function (b, i) {
        var construida = i < passo;
        var atual = i === passo - 1;
        b.rect.classList.toggle('construida', construida);
        b.rect.classList.toggle('fragil', i === fragil);
        var preenchimento = !construida ? 'var(--seg-base)' : (atual ? 'var(--seg-primaria)' : 'var(--seg-secundaria)');
        var contorno = i === fragil ? 'var(--seg-destaque)' : (construida ? 'var(--seg-primaria)' : 'var(--seg-borda)');
        b.rect.setAttribute('style', 'fill: ' + preenchimento + '; stroke: ' + contorno + '; stroke-width: ' +
          (i === fragil ? 5 : 1.5) + (construida ? '' : '; stroke-dasharray: 5 4'));
        b.texto.style.fill = atual ? 'var(--seg-base)' : 'var(--seg-texto)';
        nos[i].style.fill = construida ? 'var(--seg-primaria)' : 'var(--seg-base)';
      });
      if (passo === 0) {
        pCamada.textContent = 'Nenhuma camada construída ainda.';
        escreverCartao(null);
      } else {
        var a = AULAS[passo - 1];
        pCamada.textContent = 'Aula ' + a.n + ' · ' + a.data + ': ' + a.camada;
        escreverCartao(a);
      }
      if (fragil === null) {
        pFragil.textContent = 'Nenhuma camada marcada como frágil.';
      } else {
        pFragil.textContent = 'Frágil: Aula ' + AULAS[fragil].n + ' (' + AULAS[fragil].curta +
          '). Mostre-a funcionando ou declare a limitação.';
      }
      bAnterior.disabled = passo === 0;
      bProxima.disabled = passo === 12;
      bReproduzir.textContent = tocando ? 'Pausar' : 'Reproduzir';
    }

    function quadro(t) {
      if (!tocando) return;
      if (visivel(elemento)) {
        if (ultimoQuadro === null) ultimoQuadro = t;
        if (t - ultimoQuadro >= PASSO_MS) {
          ultimoQuadro = t;
          passo += 1;
          if (passo >= 12) { passo = 12; tocando = false; }
          desenhar();
        }
      } else {
        ultimoQuadro = null;
      }
      if (tocando) window.requestAnimationFrame(quadro);
    }

    bAnterior.addEventListener('click', function () { tocando = false; passo = Math.max(0, passo - 1); desenhar(); });
    bProxima.addEventListener('click', function () { tocando = false; passo = Math.min(12, passo + 1); desenhar(); });
    bReproduzir.addEventListener('click', function () {
      if (tocando) { tocando = false; desenhar(); return; }
      if (passo === 12) passo = 0;
      tocando = true; ultimoQuadro = null;
      desenhar();
      window.requestAnimationFrame(quadro);
    });
    blocos.forEach(function (b, i) {
      b.rect.addEventListener('click', function () { fragil = fragil === i ? null : i; desenhar(); });
    });
    desenhar();
  });
})();
