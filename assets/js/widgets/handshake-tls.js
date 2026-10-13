// Animação da Aula 11: handshake TLS simplificado entre o rastreador e o broker.
// Três modos com a mesma sequência de MQTT no fim:
// - sem TLS, porta 1883: CONNECT com usuário e senha em texto claro;
// - TLS 1.2 (RFC 5246, seção 7.3, troca ECDHE): o que o ESP32 e o broker
//   público negociaram na medição de 13/10/2026 (ECDHE-RSA-AES128-GCM-SHA256);
// - TLS 1.3 (RFC 8446, seção 2, Figura 1): uma ida e volta, certificado cifrado.
// Notação da RFC 8446: {} protegido com chave de handshake, [] com chave de
// aplicação. Cada clique em "Próxima mensagem" revela uma mensagem e diz o que
// um observador da rede lê dela. O TCP que abre a conexão antes fica fora do
// desenho e é igual nos três modos. Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var XC = 110, XS = 610, Y_LINHA0 = 86, PASSO_Y = 46;

  var MODOS = {
    'sem-tls': {
      rotulo: 'Sem TLS', idas: 0,
      msgs: [
        { de: 'c', tipo: 'claro', texto: ['CONNECT (ID, usuário, senha)'],
          obs: 'Usuário e senha legíveis, junto com o ID do cliente.' },
        { de: 's', tipo: 'claro', texto: ['CONNACK'],
          obs: 'Lê que o broker aceitou o login.' },
        { de: 'c', tipo: 'claro', texto: ['PUBLISH evento do ciclo'],
          obs: 'Payload legível: dispositivo, NF, posição, bateria e lacre.' }
      ]
    },
    tls12: {
      rotulo: 'TLS 1.2', idas: 2,
      msgs: [
        { de: 'c', tipo: 'claro', texto: ['ClientHello'],
          obs: 'Lê o nome do servidor (SNI) e as cifras que o rastreador aceita.' },
        { de: 's', tipo: 'claro', texto: ['ServerHello, Certificate,', 'ServerKeyExchange, ServerHelloDone'],
          obs: 'Lê a cifra escolhida e o certificado legível do broker. Nada do evento ainda.' },
        { de: 'c', tipo: 'misto', texto: ['ClientKeyExchange,', 'ChangeCipherSpec, Finished (cifrado)'],
          obs: 'Lê a chave pública temporária do cliente, que sozinha não revela a chave da sessão.' },
        { de: 's', tipo: 'misto', texto: ['ChangeCipherSpec, Finished (cifrado)'],
          obs: 'Vê só que o handshake terminou.' },
        { de: 'c', tipo: 'cifrado', texto: ['CONNECT com usuário e senha (cifrado)'],
          obs: 'Vê tamanho e horário; usuário e senha vão cifrados.' },
        { de: 'c', tipo: 'cifrado', texto: ['PUBLISH evento do ciclo (cifrado)'],
          obs: 'Vê tamanho e horário; o evento vai cifrado.' }
      ]
    },
    tls13: {
      rotulo: 'TLS 1.3', idas: 1,
      msgs: [
        { de: 'c', tipo: 'claro', texto: ['ClientHello + key_share'],
          obs: 'Lê o nome do servidor (SNI) e a chave pública temporária do cliente.' },
        { de: 's', tipo: 'misto', texto: ['ServerHello + key_share,', '{EncryptedExtensions} {Certificate}', '{CertificateVerify} {Finished}'],
          obs: 'Lê só o ServerHello: o certificado cifrado não aparece para quem observa.' },
        { de: 'c', tipo: 'cifrado', texto: ['{Finished}'],
          obs: 'Vê só que o handshake terminou.' },
        { de: 'c', tipo: 'cifrado', texto: ['[CONNECT com usuário e senha]'],
          obs: 'Vê tamanho e horário; usuário e senha vão cifrados.' },
        { de: 'c', tipo: 'cifrado', texto: ['[PUBLISH evento do ciclo]'],
          obs: 'Vê tamanho e horário; o evento vai cifrado.' }
      ]
    }
  };

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

  function idas(n) {
    if (n === 0) return 'MQTT direto';
    return n + (n === 1 ? ' ida e volta' : ' idas e voltas');
  }

  IntelIWidgets.registrar('handshake-tls', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Mensagens trocadas entre o rastreador e o broker MQTT, sem TLS, com TLS 1.2 e com TLS 1.3' }, elemento);

    [[XC, 'Rastreador (ESP32)'], [XS, 'Broker MQTT']].forEach(function (par) {
      var t = el('text', { x: par[0], y: 30, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, svg);
      t.textContent = par[1];
      el('line', { x1: par[0], y1: 44, x2: par[0], y2: 378,
        style: 'stroke: var(--seg-texto); stroke-width: 2' }, svg);
    });
    var legenda = el('text', { x: 360, y: 406, 'class': 'anim-codigo', 'text-anchor': 'middle', style: 'font-size: 14px' }, svg);
    legenda.textContent = 'coral contínua: em claro · tracejada: tem parte cifrada · verde: toda cifrada';
    var legenda2 = el('text', { x: 360, y: 430, 'class': 'anim-codigo', 'text-anchor': 'middle', style: 'font-size: 14px' }, svg);
    legenda2.textContent = '{ } chave de handshake · [ ] chave de aplicação (notação da RFC 8446)';

    var camada = el('g', null, svg);
    var pacote = el('circle', { r: 8, cx: XC, cy: Y_LINHA0,
      style: 'fill: var(--seg-primaria); stroke: var(--seg-base); stroke-width: 2; display: none' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'O que o observador da rede lê', painel);
    html('p', null, 'Antes de avançar: com e sem TLS, o que alguém na rede lê do CONNECT?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    medida.style.fontSize = '18px';
    var observador = html('p', 'anim-observador', '', painel);
    var bModos = html('div', 'widget-controles', null, painel);
    var botoesModo = {};
    Object.keys(MODOS).forEach(function (chave) {
      var b = html('button', null, MODOS[chave].rotulo, bModos);
      b.dataset.modo = chave;
      b.addEventListener('click', function () { modo = chave; passo = 0; desenhar(); });
      botoesModo[chave] = b;
    });
    var bAcoes = html('div', 'widget-controles', null, painel);
    var bProxima = html('button', null, 'Próxima mensagem', bAcoes);
    bProxima.dataset.acao = 'proxima';
    var bReiniciar = html('button', null, 'Recomeçar', bAcoes);
    bReiniciar.dataset.acao = 'reiniciar';

    var modo = 'tls12';
    var passo = 0;
    var animInicio = null;

    function estilo(tipo) {
      if (tipo === 'claro') return 'stroke: var(--seg-destaque); stroke-width: 3';
      if (tipo === 'misto') return 'stroke: var(--seg-destaque); stroke-width: 3; stroke-dasharray: 8 6';
      return 'stroke: var(--seg-secundaria); stroke-width: 4; stroke-dasharray: 8 6';
    }

    function desenhar() {
      var m = MODOS[modo];
      while (camada.firstChild) camada.removeChild(camada.firstChild);
      for (var i = 0; i < passo; i++) {
        var msg = m.msgs[i];
        var y = Y_LINHA0 + i * PASSO_Y + (msg.texto.length - 1) * 6;
        var x1 = msg.de === 'c' ? XC : XS;
        var x2 = msg.de === 'c' ? XS : XC;
        el('line', { x1: x1, y1: y, x2: x2, y2: y, style: estilo(msg.tipo) }, camada);
        var ponta = msg.de === 'c' ? -1 : 1;
        el('path', { d: 'M' + x2 + ' ' + y + ' l' + (14 * ponta) + ' -7 l0 14 z',
          style: 'fill: ' + (msg.tipo === 'cifrado' ? 'var(--seg-secundaria)' : 'var(--seg-destaque)') }, camada);
        msg.texto.forEach(function (linha, k) {
          var t = el('text', { x: 360, y: y - 8 - (msg.texto.length - 1 - k) * 15, 'text-anchor': 'middle',
            'class': 'anim-codigo mono', style: 'font-size: 13px' }, camada);
          t.textContent = linha;
        });
      }
      Object.keys(botoesModo).forEach(function (k) { botoesModo[k].classList.toggle('ativo', k === modo); });
      bProxima.disabled = passo >= m.msgs.length;
      medida.textContent = m.rotulo + ' · mensagem ' + passo + ' de ' + m.msgs.length + ' · ' + idas(m.idas);
      observador.textContent = passo === 0
        ? 'Observador: nada ainda. Avance a primeira mensagem.'
        : 'Observador: ' + m.msgs[passo - 1].obs;
    }

    function quadro(t) {
      if (animInicio === null) return;
      if (!visivel(elemento)) { animInicio = null; pacote.style.display = 'none'; return; }
      if (animInicio === -1) animInicio = t;
      var m = MODOS[modo];
      var msg = m.msgs[passo - 1];
      if (!msg) { pacote.style.display = 'none'; animInicio = null; return; }
      var f = Math.min((t - animInicio) / 700, 1);
      var x1 = msg.de === 'c' ? XC : XS;
      var x2 = msg.de === 'c' ? XS : XC;
      var y = Y_LINHA0 + (passo - 1) * PASSO_Y + (msg.texto.length - 1) * 6;
      pacote.style.display = '';
      pacote.setAttribute('cx', (x1 + (x2 - x1) * f).toFixed(1));
      pacote.setAttribute('cy', y);
      if (f >= 1) { pacote.style.display = 'none'; animInicio = null; return; }
      window.requestAnimationFrame(quadro);
    }

    bProxima.addEventListener('click', function () {
      if (passo >= MODOS[modo].msgs.length) return;
      passo += 1;
      desenhar();
      animInicio = -1;
      window.requestAnimationFrame(quadro);
    });
    bReiniciar.addEventListener('click', function () { passo = 0; desenhar(); });
    desenhar();
  });
})();
