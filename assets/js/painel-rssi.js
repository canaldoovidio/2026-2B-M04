// Painel de acompanhamento da Aula 08 (labs/aula08-painel.html).
//
// Duas partes:
// 1. Última comunicação dos ciclos abertos do conjunto fictício (dados/), com a
//    data de referência de 01/10/2026 do dados/README.md.
// 2. Série tempo × dBm ao vivo, assinando por MQTT sobre WebSocket seguro o mesmo
//    tópico que o labs/aula08/sketch.ino publica no broker público da HiveMQ
//    (P7: o broker de sala ainda não foi definido).
//
// ?offline=1 não conecta ao broker: é o modo dos testes, que injetam mensagens
// por PainelRssi.receber(topico, texto). Cor só por var(--seg-*); o gráfico
// desenha só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var BROKER_WSS = 'wss://broker.hivemq.com:8884/mqtt';
  var PREFIXO = 'inteli-m04/t24';
  var DATA_REF = '2026-10-01';
  var MIN = -100, MAX = -20, PONTOS = 60;
  var X0 = 70, X1 = 690, Y0 = 20, Y1 = 260;

  var serie = [];
  var ultimaMs = null;
  var cliente = null;

  function el(nome, atributos, pai) {
    var no = document.createElementNS(NS, nome);
    Object.keys(atributos || {}).forEach(function (k) { no.setAttribute(k, atributos[k]); });
    if (pai) pai.appendChild(no);
    return no;
  }

  function menos(n) { return String(n).replace('-', '−'); }
  function brasil(iso) { var p = iso.slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function dias(isoDe, isoAte) {
    return Math.round((Date.parse(isoAte.slice(0, 10)) - Date.parse(isoDe.slice(0, 10))) / 86400000);
  }

  function csv(texto) {
    var linhas = texto.trim().split(/\r?\n/);
    var cab = linhas.shift().split(',');
    return linhas.map(function (l) {
      var v = l.split(','), o = {};
      cab.forEach(function (c, i) { o[c] = v[i]; });
      return o;
    });
  }

  // Mensagem do sketch: {"dispositivo":"DV-01","seq":7,"rssi_dbm":-61,"uptime_s":14}.
  function interpretar(texto) {
    var o;
    try { o = JSON.parse(texto); } catch (e) { return null; }
    if (!o || typeof o.rssi_dbm !== 'number' || !isFinite(o.rssi_dbm)) return null;
    return { dispositivo: o.dispositivo, seq: o.seq, rssi_dbm: o.rssi_dbm, uptime_s: o.uptime_s };
  }

  function y(dbm) { return Y0 + (Y1 - Y0) * (MAX - Math.max(MIN, Math.min(MAX, dbm))) / (MAX - MIN); }

  function desenharEixos(svg) {
    for (var d = MIN; d <= MAX; d += 20) {
      el('line', { x1: X0, x2: X1, y1: y(d), y2: y(d), style: 'stroke: var(--seg-borda); stroke-width: 1' }, svg);
      var t = el('text', { x: X0 - 10, y: y(d) + 5, 'text-anchor': 'end', 'class': 'painel-rotulo' }, svg);
      t.textContent = menos(d);
    }
    var u = el('text', { x: X0 - 10, y: Y1 + 30, 'text-anchor': 'start', 'class': 'painel-rotulo' }, svg);
    u.textContent = 'dBm, últimas ' + PONTOS + ' leituras recebidas';
  }

  function desenharSerie() {
    var svg = document.getElementById('grafico-rssi');
    if (!svg) return;
    var camada = svg.querySelector('g.serie');
    if (!camada) camada = el('g', { 'class': 'serie' }, svg);
    while (camada.firstChild) camada.removeChild(camada.firstChild);
    var passo = (X1 - X0) / (PONTOS - 1);
    var d = serie.map(function (p, i) { return (i ? 'L' : 'M') + (X0 + i * passo).toFixed(1) + ' ' + y(p.rssi_dbm).toFixed(1); });
    if (d.length > 1) el('path', { d: d.join(' '), style: 'fill: none; stroke: var(--seg-primaria); stroke-width: 3' }, camada);
    serie.forEach(function (p, i) {
      el('circle', { cx: (X0 + i * passo).toFixed(1), cy: y(p.rssi_dbm).toFixed(1), r: 5,
        style: 'fill: var(--seg-destaque)' }, camada);
    });
  }

  function texto(id, valor) { var no = document.getElementById(id); if (no) no.textContent = valor; }

  function atualizarRelogio() {
    if (ultimaMs === null) return;
    var s = Math.round((Date.now() - ultimaMs) / 1000);
    texto('ultima-ao-vivo', new Date(ultimaMs).toLocaleTimeString('pt-BR') + ' (há ' + s + ' s)');
  }

  function receber(topico, mensagem) {
    var corpo = String(mensagem);
    if (/\/status$/.test(topico)) { texto('status-dispositivo', corpo); return; }
    if (!/\/rssi$/.test(topico)) return;
    var leitura = interpretar(corpo);
    if (!leitura) return;
    serie.push(leitura);
    if (serie.length > PONTOS) serie.shift();
    ultimaMs = Date.now();
    texto('leitura-atual', menos(leitura.rssi_dbm) + ' dBm');
    texto('status-dispositivo', 'online');
    atualizarRelogio();
    desenharSerie();
  }

  function tabelaCiclos() {
    return Promise.all(['../dados/ciclos.csv', '../dados/leituras.csv'].map(function (u) {
      return fetch(u).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' em ' + u);
        return r.text();
      });
    })).then(function (textos) {
      var abertos = csv(textos[0]).filter(function (c) { return !c.data_retorno; });
      var leituras = csv(textos[1]);
      var corpo = document.querySelector('#ultima-comunicacao tbody');
      abertos.forEach(function (c) {
        var doCiclo = leituras.filter(function (l) { return l.id_ciclo === c.id_ciclo; });
        var u = doCiclo[doCiclo.length - 1];
        var tr = document.createElement('tr');
        [c.id_ciclo, c.id_dispositivo, brasil(u.data_hora), String(dias(u.data_hora, DATA_REF)),
          menos(u.rssi_dbm) + ' dBm'].forEach(function (v) {
          var td = document.createElement('td'); td.textContent = v; tr.appendChild(td);
        });
        corpo.appendChild(tr);
      });
    });
  }

  function conectar() {
    var dupla = document.getElementById('campo-dupla').value.trim() || 'dupla00';
    var disp = document.getElementById('campo-dispositivo').value.trim() || 'DV-01';
    var base = PREFIXO + '/' + dupla + '/' + disp;
    texto('topico-assinado', base + '/rssi');
    if (cliente) cliente.end(true);
    serie = []; ultimaMs = null; desenharSerie();
    texto('estado-broker', 'conectando');
    cliente = window.mqtt.connect(BROKER_WSS, { clientId: 'painel-' + Math.random().toString(16).slice(2, 10) });
    cliente.on('connect', function () {
      texto('estado-broker', 'conectado');
      cliente.subscribe([base + '/rssi', base + '/status']);
    });
    cliente.on('error', function (e) { texto('estado-broker', 'erro: ' + e.message); });
    cliente.on('close', function () { texto('estado-broker', 'desconectado'); });
    cliente.on('message', function (t, m) { receber(t, m.toString()); });
  }

  function iniciar() {
    var svg = document.getElementById('grafico-rssi');
    if (svg) desenharEixos(svg);
    tabelaCiclos().catch(function (e) { console.error('painel: ' + e.message); });
    setInterval(atualizarRelogio, 1000);
    var botao = document.getElementById('botao-conectar');
    var offline = /[?&]offline=1/.test(window.location.search);
    if (botao) {
      if (offline || !window.mqtt) botao.disabled = true;
      else botao.addEventListener('click', conectar);
    }
  }

  window.PainelRssi = { interpretar: interpretar, receber: receber };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
