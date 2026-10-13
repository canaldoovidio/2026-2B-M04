// Animação da Aula 12: checklist do MVP do TAPI com a origem da evidência.
// Os sete itens do MVP e a observação sobre autonomia, resumidos do TAPI da
// Cerradinho (seção MVP). Cada clique troca o estado do item: pendente, medido
// na bancada, medido no simulador, estimado, não atendido. Os itens 7 e 8
// (fixação, água, consumo e autonomia) pulam o simulador, que não mede nada
// disso. Autonomia marcada como medida na bancada dispara o aviso do TAPI: um
// ensaio curto não comprova 150 dias, a autonomia é estimada a partir do consumo
// medido. Sem cor literal; desenho só pelo viewBox.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  var ITENS = [
    'Cadastro de 10 a 20 equipamentos com referência de NF',
    'Arquitetura escolhida e localização em percurso externo',
    'Saída, prazo, retorno e vínculo com histórico preservado',
    'Leitura semanal e alerta de permanência (150 dias)',
    'Lacre: violação, retirada autorizada e envio sem conexão',
    'Interface: localização, dias fora, prazo, bateria, lacre, histórico; API',
    'Testes: comunicação, fixação, reutilização, consumo, água; ciclo completo',
    'Autonomia de longo prazo (observação do MVP)'
  ];
  var AUTONOMIA = 7;
  var ESTADOS = ['pendente', 'bancada', 'simulador', 'estimado', 'não atendido'];
  var SEM_SIMULADOR = [6, 7];   // índices dos itens 7 e 8
  var Y0 = 48, PASSO = 49, ALTURA = 41;

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

  // Sem laço de animação: o estado só muda por clique, então não há o que
  // pausar quando o slide sai de cena.
  var ESTILO = {
    'pendente': { caixa: 'fill: var(--seg-base); stroke: var(--seg-borda); stroke-width: 1.5; stroke-dasharray: 5 4', texto: 'var(--seg-texto)' },
    'bancada': { caixa: 'fill: var(--seg-secundaria); stroke: var(--seg-primaria); stroke-width: 1.5', texto: 'var(--seg-texto)' },
    'simulador': { caixa: 'fill: var(--seg-secundaria); stroke: var(--seg-primaria); stroke-width: 1.5; stroke-dasharray: 5 4', texto: 'var(--seg-texto)' },
    'estimado': { caixa: 'fill: var(--seg-superficie); stroke: var(--seg-primaria); stroke-width: 3', texto: 'var(--seg-texto)' },
    'não atendido': { caixa: 'fill: var(--seg-destaque); stroke: var(--seg-destaque); stroke-width: 1.5', texto: 'var(--seg-base)' }
  };

  IntelIWidgets.registrar('checklist-mvp', function (elemento) {
    elemento.classList.add('anim');
    var svg = el('svg', { viewBox: '0 0 720 440', role: 'img',
      'aria-label': 'Oito itens do MVP do TAPI, cada um com o estado da evidência: pendente, medido na bancada, medido no simulador, estimado ou não atendido' }, elemento);

    var c1 = el('text', { x: 14, y: 26, 'class': 'anim-rotulo' }, svg);
    c1.textContent = 'Item do MVP do TAPI';
    var c2 = el('text', { x: 652, y: 26, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, svg);
    c2.textContent = 'Evidência';

    var estados = ITENS.map(function () { return 0; });
    var linhas = ITENS.map(function (texto, i) {
      var y = Y0 + i * PASSO;
      var g = el('g', { 'class': 'item-mvp', 'data-item': String(i + 1) }, svg);
      g.style.cursor = 'pointer';
      el('rect', { x: 4, y: y, width: 712, height: ALTURA, rx: 6,
        style: 'fill: var(--seg-superficie); stroke: none' }, g);
      var n = el('text', { x: 28, y: y + 27, 'class': 'anim-rotulo mono', 'text-anchor': 'middle' }, g);
      n.textContent = String(i + 1);
      var t = el('text', { x: 52, y: y + 27, 'class': 'anim-rotulo' }, g);
      t.setAttribute('style', 'font-size: 15px; font-weight: 500');
      t.textContent = texto;
      var caixa = el('rect', { x: 594, y: y + 5, width: 116, height: ALTURA - 10, rx: 15 }, g);
      var rotulo = el('text', { x: 652, y: y + 26, 'class': 'anim-rotulo', 'text-anchor': 'middle' }, g);
      rotulo.style.fontSize = '15px';
      return { g: g, caixa: caixa, rotulo: rotulo };
    });

    var painel = html('div', 'anim-painel', null, elemento);
    html('p', null, 'Antes de marcar: quantos itens o seu grupo sustenta com medição na bancada, quantos só no simulador e quantos com estimativa? Depois, clique em cada item.', painel);
    var medida = html('p', 'anim-medida mono', '', painel);
    medida.style.fontSize = '18px';   // a contagem tem quatro números
    var declarar = html('p', 'anim-declarar', '', painel);
    var alerta = html('div', 'anim-alerta',
      'Um ensaio curto não comprova 150 dias de operação. Pelo TAPI, a autonomia é estimada a partir do consumo medido.', painel);
    var botoes = html('div', 'widget-controles', null, painel);
    var bLimpar = html('button', null, 'Limpar', botoes);

    function contar(nome) {
      return estados.filter(function (e) { return ESTADOS[e] === nome; }).length;
    }

    function desenhar() {
      linhas.forEach(function (l, i) {
        var nome = ESTADOS[estados[i]];
        l.g.setAttribute('data-estado', nome);
        l.caixa.setAttribute('style', ESTILO[nome].caixa);
        l.rotulo.textContent = nome;
        l.rotulo.style.fill = ESTILO[nome].texto;
      });
      medida.textContent = 'bancada ' + contar('bancada') + ' · simulador ' + contar('simulador') +
        ' · estimado ' + contar('estimado') + ' · não atendido ' + contar('não atendido');
      var faltam = estados.map(function (e, i) { return ESTADOS[e] === 'não atendido' ? String(i + 1) : null; })
        .filter(Boolean);
      declarar.textContent = faltam.length
        ? 'Limitação declarada para o item ' + faltam.join(', ') + ', com o motivo.'
        : 'Item não atendido entra no relatório como limitação declarada.';
      var autonomiaMedida = ESTADOS[estados[AUTONOMIA]] === 'bancada';
      alerta.classList.toggle('anim-alerta-visivel', autonomiaMedida);
      alerta.style.display = autonomiaMedida ? '' : 'none';   // oculto não ocupa espaço no painel
    }

    linhas.forEach(function (l, i) {
      l.g.addEventListener('click', function () {
        estados[i] = (estados[i] + 1) % ESTADOS.length;
        if (ESTADOS[estados[i]] === 'simulador' && SEM_SIMULADOR.indexOf(i) >= 0) {
          estados[i] = (estados[i] + 1) % ESTADOS.length;
        }
        desenhar();
      });
    });
    bLimpar.addEventListener('click', function () {
      estados = estados.map(function () { return 0; });
      desenhar();
    });
    desenhar();
  });
})();
