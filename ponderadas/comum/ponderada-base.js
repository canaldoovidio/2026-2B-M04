/* Base comum das páginas de ponderada do acervo (ADR-012).
   Extraída do padrão da Ponderada 1 (Prof. Roberto Cândido): rascunho no navegador, previsão
   registrada com horário, verificações em linha, gráfico em canvas e relatório em Markdown.
   Cores e fontes são lidas dos tokens de assets/css/inteli-brand.css, porque canvas e atributos
   SVG não resolvem var(). Expõe window.Ponderada; cada página usa só o que precisa. */
(function () {
  const raiz = document.documentElement;
  const tok = nome => getComputedStyle(raiz).getPropertyValue(nome).trim();

  const C = {
    roxo: tok('--seg-primaria'), verde: tok('--seg-secundaria'), coral: tok('--seg-destaque'),
    branco: tok('--inteli-branco'), claro: tok('--inteli-cinza-claro'), medio: tok('--inteli-cinza-medio'),
    escuro: tok('--inteli-cinza-escuro')
  };
  const FM = tok('--fonte-mono'), FT = tok('--fonte-texto');
  const VAZIO = 'n/d';

  // Números: aceita vírgula decimal; exibe em pt-BR
  const num = s => { const v = parseFloat(String(s ?? '').trim().replace(',', '.')); return Number.isFinite(v) ? v : NaN; };
  const fmt = (v, d = 2) => Number.isFinite(v) ? v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) : VAZIO;
  const fmtSig = v => {
    if (!Number.isFinite(v)) return VAZIO;
    const a = Math.abs(v);
    return fmt(v, a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3);
  };
  const quando = iso => new Date(iso).toLocaleString('pt-BR');
  // Texto de campo para o relatório: vazio vira n/d, quebras de linha viram espaço.
  const L = t => (t && String(t).trim() ? String(t).trim().replace(/\n+/g, ' ') : VAZIO);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, pai) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (pai) pai.appendChild(e);
    return e;
  }

  const ICONE_OK = '<span class="material-symbols-outlined" aria-hidden="true">check</span>';
  const ok = t => `<span class="ok">${ICONE_OK} ${t}</span>`;
  const ruim = t => `<span class="bad">! ${t}</span>`;
  const neutro = t => `<span>${t}</span>`;

  function baixar(nome, conteudo, tipo) {
    const blob = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo || 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // Botões de copiar e baixar do bloco de código: data-copy="id" e data-download="id" data-name="arquivo".
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-copy]');
    if (c) {
      const texto = document.getElementById(c.dataset.copy).textContent;
      const rotulo = c.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject())
        .then(() => { c.textContent = 'Copiado'; }, () => { c.textContent = 'Selecione e copie'; })
        .finally(() => setTimeout(() => { c.textContent = rotulo; }, 1500));
    }
    const d = e.target.closest('[data-download]');
    if (d) baixar(d.dataset.name, document.getElementById(d.dataset.download).textContent, 'text/plain');
  });

  /* Rascunho: guarda os campos com name do formulário e um objeto de estado extra. O acesso ao
     localStorage pode falhar (janela privada, dados bloqueados), e a página segue sem rascunho. */
  function rascunho(form, chave) {
    let t;
    const campos = () => [...form.elements].filter(el => el.name);
    return {
      salvar(extra) {
        clearTimeout(t);
        t = setTimeout(() => {
          const dados = {};
          campos().forEach(el => { dados[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
          try { localStorage.setItem(chave, JSON.stringify({ dados, extra })); } catch (_) {}
        }, 250);
      },
      restaurar() {
        let salvo = null;
        try { salvo = JSON.parse(localStorage.getItem(chave) || 'null'); } catch (_) {}
        if (!salvo) return null;
        campos().forEach(el => {
          if (!(el.name in salvo.dados)) return;
          if (el.type === 'checkbox') el.checked = !!salvo.dados[el.name]; else el.value = salvo.dados[el.name];
        });
        return salvo.extra || null;
      },
      apagar() { clearTimeout(t); try { localStorage.removeItem(chave); } catch (_) {} }
    };
  }

  /* Registro com horário de uma etapa que precisa vir antes da medição (previsão, modelo de
     ameaça, lista bruta da IA). Alterar um campo depois do registro marca a etapa como alterada,
     e o relatório mostra o histórico. */
  function trava({ etapa, botao, status, rotulo, aoMudar }) {
    const s = { registradoEm: null, primeiroEm: null, alteracoes: [], alterado: false };
    const campos = () => [...etapa.querySelectorAll('input, textarea, select')].filter(el => el.name);
    function aplicar() {
      const reg = !!s.registradoEm, valido = reg && !s.alterado;
      botao.textContent = reg ? 'Registrar de novo' : `Registrar ${rotulo}`;
      botao.className = valido ? 'btn ghost' : 'btn orange';
      status.className = 'lock-status' + (valido ? ' on' : '');
      status.textContent = !reg ? `${rotulo[0].toUpperCase() + rotulo.slice(1)} ainda não registrado(a).`
        : s.alterado ? `! Alterado(a) depois do registro de ${quando(s.registradoEm)}. Clique em Registrar de novo (a alteração fica no relatório).`
        : `Registrado(a) em ${quando(s.registradoEm)}.${s.alteracoes.length ? ` Alterado(a) ${s.alteracoes.length} vez(es) depois do primeiro registro.` : ''}`;
    }
    botao.addEventListener('click', () => {
      const faltam = campos().filter(el => !el.checkValidity());
      if (faltam.length) {
        etapa.classList.add('was-validated');
        faltam[0].focus();
        status.className = 'lock-status';
        status.textContent = `Preencha os ${faltam.length} campo(s) obrigatório(s) destacados antes de registrar.`;
        return;
      }
      s.registradoEm = new Date().toISOString();
      if (!s.primeiroEm) s.primeiroEm = s.registradoEm;
      s.alterado = false;
      aplicar(); if (aoMudar) aoMudar();
    });
    etapa.addEventListener('input', () => {
      if (s.registradoEm && !s.alterado) { s.alterado = true; s.alteracoes.push(new Date().toISOString()); aplicar(); if (aoMudar) aoMudar(); }
    });
    return {
      estado: () => Object.assign({}, s, { alteracoes: s.alteracoes.slice() }),
      carregar(o) { Object.assign(s, { registradoEm: null, primeiroEm: null, alteracoes: [], alterado: false }, o || {}); aplicar(); },
      registrado: () => !!s.registradoEm,
      // Linha de Markdown com o histórico do registro.
      historico() {
        if (!s.primeiroEm) return `não registrado(a)`;
        let t = quando(s.primeiroEm);
        if (s.registradoEm !== s.primeiroEm) t += ` · último registro: ${quando(s.registradoEm)}`;
        if (s.alteracoes.length) t += ` · alterado(a) em: ${s.alteracoes.map(quando).join('; ')}`;
        if (s.alterado) t += ' · **alteração final não registrada**';
        return t;
      }
    };
  }

  /* Canvas nítido em tela de alta densidade: devolve o contexto já escalado e as dimensões em CSS px. */
  function prepararCanvas(cv) {
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = +cv.getAttribute('height');
    cv.style.height = H + 'px';
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W, H };
  }

  function passoRedondo(faixa, n) {
    const bruto = faixa / n, p = Math.pow(10, Math.floor(Math.log10(bruto))), m = bruto / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }

  /* Fundo, grade, eixos e rótulos. o = { x: [min, max], y: [min, max], rotX, rotY, titulo,
     margem, casasX, casasY, rotulosX (lista de [valor, texto]) }. Devolve os mapeadores X e Y. */
  function eixos(ctx, W, H, o) {
    const pad = Object.assign({ l: 64, r: 22, t: o.titulo ? 78 : 50, b: 54 }, o.margem || {});
    const [x0, x1] = o.x, [y0, y1] = o.y;
    const X = v => pad.l + (v - x0) / (x1 - x0) * (W - pad.l - pad.r);
    const Y = v => H - pad.b - (v - y0) / (y1 - y0) * (H - pad.t - pad.b);
    const casas = passo => Math.max(0, -Math.floor(Math.log10(passo) + 1e-9));
    ctx.fillStyle = C.branco; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = C.claro; ctx.fillStyle = C.roxo; ctx.font = `12px ${FM}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    if (o.rotulosX) {
      o.rotulosX.forEach(([v, t]) => { ctx.beginPath(); ctx.moveTo(X(v), pad.t); ctx.lineTo(X(v), H - pad.b); ctx.stroke(); ctx.fillText(t, X(v), H - pad.b + 6); });
    } else {
      const px = passoRedondo(x1 - x0, 8);
      for (let v = Math.ceil(x0 / px) * px; v <= x1 + 1e-9; v += px) {
        ctx.beginPath(); ctx.moveTo(X(v), pad.t); ctx.lineTo(X(v), H - pad.b); ctx.stroke();
        ctx.fillText(fmt(v, o.casasX ?? casas(px)), X(v), H - pad.b + 6);
      }
    }
    const py = passoRedondo(y1 - y0, 6);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    let largura = 0;
    for (let v = Math.ceil(y0 / py) * py; v <= y1 + 1e-9; v += py) {
      const t = fmt(v, o.casasY ?? casas(py));
      largura = Math.max(largura, ctx.measureText(t).width);
      ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(W - pad.r, Y(v)); ctx.stroke();
      ctx.fillText(t, pad.l - 8, Y(v));
    }
    ctx.strokeStyle = C.escuro;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
    ctx.fillStyle = C.roxo; ctx.font = `600 13px ${FT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(o.rotX, (pad.l + W - pad.r) / 2, H - 8);
    // O título do eixo Y fica à esquerda do rótulo mais largo, para não encostar em "4.000".
    const xTitulo = Math.max(4, Math.min(16, pad.l - 8 - largura - 20));
    ctx.save(); ctx.translate(xTitulo, (pad.t + H - pad.b) / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'top';
    ctx.fillText(o.rotY, 0, 0); ctx.restore();
    if (o.titulo) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `600 15px ${FT}`; ctx.fillText(o.titulo, pad.l, 12); }
    return { X, Y, pad };
  }

  /* Quantas linhas a legenda ocupa na largura disponível, para a página reservar a margem de cima. */
  function linhasLegenda(ctx, W, pad, itens) {
    ctx.font = `12px ${FM}`;
    let lx = pad.l, n = 1;
    itens.forEach(([, , texto]) => {
      const w = 28 + ctx.measureText(texto).width + 20;
      if (lx + w > W - pad.r && lx > pad.l) { lx = pad.l; n++; }
      lx += w;
    });
    return n;
  }

  /* Legenda acima da área do gráfico. itens = [[tipo, cor, texto]], tipo em line, dash, dot.
     Quando quebra, cresce para cima, e a última linha fica logo acima da área do gráfico. */
  function legenda(ctx, W, pad, itens) {
    let lx = pad.l, ly = pad.t - 26 - 18 * (linhasLegenda(ctx, W, pad, itens) - 1);
    ctx.font = `12px ${FM}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    itens.forEach(([tipo, cor, texto]) => {
      const w = 28 + ctx.measureText(texto).width + 20;
      if (lx + w > W - pad.r && lx > pad.l) { lx = pad.l; ly += 18; }
      ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = tipo === 'line' ? 3 : 2;
      if (tipo === 'dot') { ctx.beginPath(); ctx.arc(lx + 10, ly, 4, 0, 2 * Math.PI); ctx.fill(); }
      else { ctx.setLineDash(tipo === 'dash' ? [5, 3] : []); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 20, ly); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = C.roxo; ctx.fillText(texto, lx + 28, ly);
      lx += w;
    });
  }

  /* PNG do gráfico em 2x para o relatório: desenhar(ctx, W, H) recebe um canvas de 1200 x 700. */
  function png(desenhar) {
    const cv = document.createElement('canvas'); cv.width = 2400; cv.height = 1400;
    const ctx = cv.getContext('2d'); ctx.scale(2, 2);
    desenhar(ctx, 1200, 700);
    return new Promise(res => cv.toBlob(res, 'image/png'));
  }

  /* Campos obrigatórios em branco no formulário inteiro (para o aviso ao baixar o relatório). */
  function pendentes(form) {
    form.classList.add('was-validated');
    return [...form.elements].filter(el => el.name && !el.checkValidity()).length;
  }

  window.Ponderada = {
    tok, C, FM, FT, VAZIO, num, fmt, fmtSig, quando, L, esc, svg, ICONE_OK, ok, ruim, neutro,
    baixar, rascunho, trava, prepararCanvas, eixos, legenda, linhasLegenda, png, pendentes, passoRedondo
  };
})();
