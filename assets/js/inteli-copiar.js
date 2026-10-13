// Botão "Copiar" dos blocos de código das páginas de laboratório.
// Markup: <button class="doc-copiar" data-alvo="id-do-pre">Copiar</button>
(function () {
  'use strict';
  document.addEventListener('click', function (evento) {
    var botao = evento.target.closest('.doc-copiar');
    if (!botao) return;
    var alvo = document.getElementById(botao.dataset.alvo);
    if (!alvo || !navigator.clipboard) return;
    navigator.clipboard.writeText(alvo.textContent).then(function () {
      var original = botao.textContent;
      botao.textContent = 'Copiado';
      window.setTimeout(function () { botao.textContent = original; }, 1500);
    });
  });
})();
