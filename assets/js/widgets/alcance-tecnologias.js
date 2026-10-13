// Animação da Aula 06: cobertura comparada de Wi-Fi, LTE-M, LoRaWAN e NB-IoT.
// Cada barra é a perda máxima entre transmissor e receptor que a tecnologia
// tolera, em dB. A linha vertical é a perda no caminho: a base escolhida no
// controle mais 10 dB por parede de tijolo duplo. Barra que passa da linha
// conecta; barra que fica antes dela perde o enlace.
// Fontes dos números (referências da Aula 06):
// - Wi-Fi: 116,5 dB calculados do datasheet ESP32-WROOM-32E v2.1, potência de
//   transmissão de 19,5 dBm (tabela 20) menos a sensibilidade de -97 dBm
//   (tabela 21), ambas em 802.11b a 1 Mbps, sem ganho de antena;
// - LTE-M 155,7 dB, LoRaWAN 157 dB e NB-IoT 164 dB, autonomias de 10+ e 15+
//   anos a 200 bytes por dia e os 10 dB por parede de tijolo: white paper
//   "Narrowband IoT and LTE Machine Type Communications", Vodafone Business,
//   pp. 3 e 4.
// Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var TECNOLOGIAS = [
    { nome: 'Wi-Fi', db: 116.5, autonomia: 'autonomia: sem número na fonte', rede: 'roteador no local' },
    { nome: 'LTE-M', db: 155.7, autonomia: 'autonomia: 10+ anos a 200 B/dia', rede: 'operadora celular' },
    { nome: 'LoRaWAN', db: 157, autonomia: 'autonomia: 10+ anos a 200 B/dia', rede: 'gateway LoRaWAN' },
    { nome: 'NB-IoT', db: 164, autonomia: 'autonomia: 15+ anos a 200 B/dia', rede: 'operadora celular' }
  ];
  var DB_MIN = 80, DB_MAX = 210;
  var X0 = 150, X1 = 740;
  var DB_PAREDE = 10;

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

  function x(db) { return X0 + (X1 - X0) * (Math.min(Math.max(db, DB_MIN), DB_MAX) - DB_MIN) / (DB_MAX - DB_MIN); }
  function decimal(n) { return (n % 1 ? n.toFixed(1) : String(n)).replace('.', ','); }

  function visivel(elemento) {
    var secao = elemento.closest('.reveal section');
    return !secao || secao.classList.contains('present');
  }

  IntelIWidgets.registrar('alcance-tecnologias', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 760 475', role: 'img',
      'aria-label': 'Perda máxima tolerada por Wi-Fi, LTE-M, LoRaWAN e NB-IoT comparada com a perda no caminho' }, elemento);

    for (var d = DB_MIN; d <= DB_MAX; d += 20) {
      el('line', { x1: x(d), x2: x(d), y1: 30, y2: 400, style: 'stroke: var(--seg-borda); stroke-width: 1' }, svg);
      var r = el('text', { x: x(d), y: 424, 'text-anchor': 'middle', 'class': 'anim-rotulo mono', style: 'font-size: 14px' }, svg);
      r.textContent = d + ' dB';
    }

    // A linha vem antes das barras: as notas, com contorno da cor de fundo, ficam legíveis por cima dela.
    var linhaPerda = el('line', { y1: 30, y2: 400, style: 'stroke: var(--seg-destaque); stroke-width: 4; stroke-dasharray: 8 6' }, svg);
    var linhas = TECNOLOGIAS.map(function (tec, i) {
      var y = 50 + i * 90;
      var grupo = el('g', { 'data-tecnologia': tec.nome }, svg);
      var nome = el('text', { x: 10, y: y + 24, 'class': 'anim-rotulo' }, grupo);
      nome.textContent = tec.nome;
      var barra = el('rect', { x: X0, y: y, width: x(tec.db) - X0, height: 34, rx: 4 }, grupo);
      var valor = el('text', { x: x(tec.db) + 8, y: y + 24, 'class': 'anim-rotulo mono', style: 'font-size: 15px' }, grupo);
      valor.textContent = decimal(tec.db) + ' dB';
      var nota = el('text', { x: X0, y: y + 56, 'class': 'anim-codigo', style: 'font-size: 14px; paint-order: stroke; stroke: var(--seg-base); stroke-width: 6px' }, grupo);
      nota.textContent = tec.autonomia + ' · ' + tec.rede;
      return { tec: tec, grupo: grupo, barra: barra };
    });

    var nota = el('text', { x: 10, y: 462, 'class': 'anim-codigo', style: 'font-size: 15px' }, svg);
    nota.textContent = 'Cerca de 10 dB por parede de tijolo duplo (Vodafone). Valores variam com rádio e antena.';
    var rotuloPerda = el('text', { y: 22, 'text-anchor': 'middle', 'class': 'anim-rotulo' }, svg);

    var painel = html('div', 'anim-painel', null, elemento);
    html('h4', null, 'Quem ainda conecta da oficina?', painel);
    html('p', null, 'Antes de mexer: com 100 dB de perda e três paredes de tijolo duplo, quantas das quatro ainda conectam?', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    medida.style.fontSize = '18px';
    var rotBase = html('p', null, '', painel);
    var base = html('input', null, null, painel);
    base.type = 'range'; base.min = '80'; base.max = '170'; base.step = '1'; base.value = '110';
    base.setAttribute('aria-label', 'Perda no caminho sem paredes, em dB');
    var rotParedes = html('p', null, '', painel);
    var paredes = html('input', null, null, painel);
    paredes.type = 'range'; paredes.min = '0'; paredes.max = '4'; paredes.step = '1'; paredes.value = '0';
    paredes.setAttribute('aria-label', 'Paredes de tijolo duplo');

    var alvo = 110;
    var mostrado = 110;
    var animando = false;

    function perda() { return Number(base.value) + DB_PAREDE * Number(paredes.value); }

    function desenhar() {
      var total = perda();
      var conectam = 0;
      linhas.forEach(function (l) {
        var ok = l.tec.db >= total;
        if (ok) conectam++;
        l.grupo.dataset.conecta = ok ? 'sim' : 'nao';
        l.barra.style.fill = ok ? 'var(--seg-secundaria)' : 'var(--seg-destaque)';
      });
      medida.textContent = 'perda ' + total + ' dB · conectam ' + conectam + ' de ' + linhas.length;
      rotBase.textContent = 'Perda sem paredes: ' + base.value + ' dB';
      rotParedes.textContent = 'Paredes de tijolo (10 dB cada): ' + paredes.value;
      rotuloPerda.textContent = 'perda ' + total + ' dB';
    }

    function posicionar() {
      linhaPerda.setAttribute('x1', x(mostrado).toFixed(1));
      linhaPerda.setAttribute('x2', x(mostrado).toFixed(1));
      rotuloPerda.setAttribute('x', Math.min(x(mostrado), X1 - 60).toFixed(1));
    }

    // A linha da perda desliza até o valor novo; o número e as cores mudam na hora.
    function quadro() {
      if (visivel(elemento)) {
        var passo = (alvo - mostrado) * 0.2;
        mostrado = Math.abs(passo) < 0.05 ? alvo : mostrado + passo;
        posicionar();
      }
      if (mostrado !== alvo) window.requestAnimationFrame(quadro);
      else animando = false;
    }

    function mudar() {
      desenhar();
      alvo = perda();
      if (!animando) { animando = true; window.requestAnimationFrame(quadro); }
    }

    base.addEventListener('input', mudar);
    paredes.addEventListener('input', mudar);
    desenhar();
    posicionar();
  });
})();
