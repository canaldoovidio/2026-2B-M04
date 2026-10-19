/* Ponderada de Segurança em IoT (Aula 11): modelo de ameaça registrado, lista bruta da IA,
   triagem com linhas do código colado, dois ataques com risco na matriz 3 x 3, tabela da turma e
   relatório. Usa a base comum (ponderadas/comum/ponderada-base.js, ADR-012). Todo texto colado
   pelo grupo entra na página por textContent ou Ponderada.esc. */
(function () {
  const P = window.Ponderada;
  const { C, FM, FT, esc, L, ok, ruim, neutro } = P;
  const KEY = 'ponderada-seguranca-iot-rascunho';
  const TUTORIAL = 'https://randomnerdtutorials.com/esp32-web-server-arduino-ide/';

  const form = document.getElementById('labForm');
  const F = form.elements;
  const $ = id => document.getElementById(id);
  const draft = P.rascunho(form, KEY);

  // Estado fora dos campos com name: decisões da triagem e horário da primeira colagem do código.
  const state = { triagem: {}, codigoEm: null };

  const travaCtx = P.trava({ etapa: $('stepCtx'), botao: $('btnLockCtx'), status: $('lockCtx'), rotulo: 'modelo de ameaça', aoMudar: () => { atualizar(); salvar(); } });
  const travaCon = P.trava({ etapa: $('consultaCampos'), botao: $('btnLockCon'), status: $('lockCon'), rotulo: 'lista bruta', aoMudar: () => { atualizar(); salvar(); } });

  /* ---------------- Código colado ---------------- */
  const linhasCodigo = () => {
    const t = F.codigo.value.replace(/\s+$/, '');
    return t ? t.split(/\r?\n/) : [];
  };

  // "12, 30-34" vira [12, 30, 31, 32, 33, 34]; texto que não é número ou intervalo devolve null.
  function parseLinhas(s) {
    const partes = String(s || '').split(/[,;\s]+/).filter(Boolean);
    if (!partes.length) return null;
    const out = [];
    for (const p of partes) {
      const m = p.match(/^(\d+)(?:-(\d+))?$/);
      if (!m) return null;
      const a = +m[1], b = m[2] ? +m[2] : a;
      if (b < a || b - a > 500) return null;
      for (let i = a; i <= b; i++) out.push(i);
    }
    return out;
  }
  // Situação de uma referência de linhas contra o código colado: 'vazia', 'invalida', 'fora', 'sem-codigo' ou 'ok'.
  function conferirLinhas(s) {
    if (!String(s || '').trim()) return { st: 'vazia' };
    const ls = parseLinhas(s);
    if (!ls) return { st: 'invalida' };
    const n = linhasCodigo().length;
    if (!n) return { st: 'sem-codigo', ls };
    const fora = ls.filter(i => i < 1 || i > n);
    return fora.length ? { st: 'fora', ls, fora, n } : { st: 'ok', ls };
  }

  function desenharVisor(citadas) {
    const visor = $('visor'), ls = linhasCodigo();
    visor.textContent = '';
    ls.forEach((t, i) => {
      const s = document.createElement('span');
      s.className = 'ln' + (citadas.has(i + 1) ? ' citada' : '');
      s.dataset.n = i + 1;
      s.textContent = t.length ? t : ' ';
      visor.appendChild(s);
    });
    $('codigoInfo').textContent = ls.length ? `${ls.length} linhas · ${citadas.size} citada(s)` : 'sem código';
  }

  function codigoCheck() {
    const out = [];
    if (!linhasCodigo().length) out.push(neutro('Cole o código do tutorial para a página conferir as linhas citadas.'));
    else if (state.codigoEm) {
      const modelo = travaCtx.estado().primeiroEm;
      if (!modelo || state.codigoEm < modelo)
        out.push(ruim(`O código foi colado em ${P.quando(state.codigoEm)}, antes do registro do modelo de ameaça. O relatório mostra essa ordem.`));
      else out.push(ok(`Código colado em ${P.quando(state.codigoEm)}, depois do registro do modelo de ameaça.`));
    }
    $('codigoCheck').innerHTML = out.join('');
  }

  /* ---------------- Lista bruta em candidatos ---------------- */
  // Cada linha numerada (1. ou 1)) ou com marcador (-, *, •) abre um candidato; as linhas seguintes
  // sem marcador continuam o candidato aberto. Sem nenhum marcador, cada linha não vazia é um candidato.
  function candidatos() {
    const ls = F.con_lista.value.split(/\r?\n/);
    const MARCA = /^\s*(?:\d+[.)]|[-*•])\s+(.*\S)\s*$/;
    const out = [];
    let algum = false;
    ls.forEach(l => {
      const m = l.match(MARCA);
      if (m) { algum = true; out.push(m[1].replace(/\*\*/g, '')); }
      else if (algum && l.trim() && out.length) out[out.length - 1] += ' ' + l.trim();
    });
    if (algum) return out;
    return ls.map(l => l.trim()).filter(Boolean);
  }

  function conCheck(cs) {
    const out = [];
    if (!F.con_lista.value.trim()) out.push(ruim('Sem a lista bruta da IA, o item Confrontar recebe zero.'));
    else {
      out.push(neutro(`${cs.length} candidato(s) separados da lista para a triagem.`));
      if (!travaCon.registrado()) out.push(ruim('Lista ainda não registrada: clique em Registrar lista bruta antes da triagem.'));
      if (travaCon.estado().alteracoes.length) out.push(ruim('A lista foi alterada depois do registro. O relatório mostra os horários; a lista entregue precisa ser a resposta sem edição.'));
    }
    $('conCheck').innerHTML = out.join('');
  }

  /* ---------------- Triagem ---------------- */
  const tbody = document.querySelector('#triagem tbody');
  let cache = '';
  function desenharTriagem(cs) {
    const chave = JSON.stringify(cs);
    if (chave === cache) return;
    cache = chave;
    tbody.textContent = '';
    cs.forEach((c, i) => {
      const t = state.triagem[c] || {};
      const tr = document.createElement('tr');
      tr.dataset.cand = c;
      tr.innerHTML = `<td>${i + 1}</td><td class="cand"></td>
        <td><select class="dec" aria-label="Decisão do candidato ${i + 1}"><option value="">Selecione…</option><option value="aplica">aplica</option><option value="descarta">descarta</option></select></td>
        <td><input class="lin" aria-label="Linhas do candidato ${i + 1}" placeholder="ex.: 12"></td>
        <td><textarea class="jus" rows="2" aria-label="Justificativa do candidato ${i + 1}"></textarea></td>`;
      tr.querySelector('.cand').textContent = c;
      tr.querySelector('.dec').value = t.decisao || '';
      tr.querySelector('.lin').value = t.linhas || '';
      tr.querySelector('.jus').value = t.just || '';
      tr.classList.toggle('descarta', t.decisao === 'descarta');
      tbody.appendChild(tr);
    });
  }
  tbody.addEventListener('input', e => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    state.triagem[tr.dataset.cand] = {
      decisao: tr.querySelector('.dec').value, linhas: tr.querySelector('.lin').value, just: tr.querySelector('.jus').value
    };
    tr.classList.toggle('descarta', tr.querySelector('.dec').value === 'descarta');
    atualizar(); salvar();
  });

  function triagemAtual(cs) {
    return cs.map((c, i) => Object.assign({ n: i + 1, c, decisao: '', linhas: '', just: '' }, state.triagem[c] || {}));
  }

  function confCheck(ts) {
    const out = [];
    if (!ts.length) { $('confCheck').innerHTML = ruim('Sem a lista bruta da IA, o item Confrontar recebe zero.'); return; }
    const semCodigo = !linhasCodigo().length;
    let validos = 0;
    ts.forEach(t => {
      if (!t.decisao) return;
      const r = conferirLinhas(t.linhas);
      if (t.decisao === 'descarta' && !t.just.trim()) out.push(ruim(`Candidato ${t.n}: descarte sem justificativa recebe zero.`));
      if (r.st === 'vazia') out.push(ruim(`Candidato ${t.n}: aponte a linha ou as linhas do código que sustentam a decisão.`));
      else if (r.st === 'invalida') out.push(ruim(`Candidato ${t.n}: escreva as linhas como 12 ou 30-34.`));
      else if (r.st === 'fora') out.push(ruim(`Candidato ${t.n}: a linha ${r.fora.join(', ')} não existe no código colado (${r.n} linhas).`));
      if (t.decisao === 'descarta' && t.just.trim() && (r.st === 'ok' || r.st === 'sem-codigo')) validos += r.st === 'ok' ? 1 : 0;
    });
    const pend = ts.filter(t => !t.decisao).length;
    if (pend) out.unshift(neutro(`${pend} candidato(s) ainda sem decisão.`));
    if (semCodigo) out.unshift(ruim('Cole o código na etapa Código para a página conferir as linhas dos descartes.'));
    out.unshift(validos >= 2
      ? ok(`${validos} descartes com justificativa e linha que existe no código.`)
      : ruim(`${validos} descarte(s) com justificativa e linha válida; o mínimo é 2.`));
    $('confCheck').innerHTML = out.join('');
  }

  /* ---------------- Ataques ---------------- */
  function popularOrigens(ts) {
    const aplicam = ts.filter(t => t.decisao === 'aplica');
    document.querySelectorAll('select.origem').forEach(sel => {
      const atual = sel.value || sel.dataset.salvo || '';
      sel.textContent = '';
      const vazio = document.createElement('option');
      vazio.value = ''; vazio.textContent = aplicam.length ? 'Selecione um candidato que aplica…' : 'Marque candidatos como aplica na triagem…';
      sel.appendChild(vazio);
      aplicam.forEach(t => {
        const o = document.createElement('option');
        o.value = t.c; o.textContent = `${t.n}. ${t.c.length > 90 ? t.c.slice(0, 90) + '…' : t.c}`;
        sel.appendChild(o);
      });
      if (atual && aplicam.some(t => t.c === atual)) { sel.value = atual; delete sel.dataset.salvo; }
      else if (atual) sel.dataset.salvo = atual;
    });
  }

  const ataque = n => {
    const g = k => F[`at${n}_${k}`].value;
    const p = +g('prob') || NaN, i = +g('imp') || NaN;
    return { n, titulo: g('titulo').trim(), origem: g('origem'), linhas: g('linhas'), passos: g('passos'),
      prob: p, imp: i, risco: p * i, probJust: g('prob_just'), impJust: g('imp_just') };
  };
  const nivel = r => !Number.isFinite(r) ? P.VAZIO : r >= 6 ? 'alto' : r >= 3 ? 'médio' : 'baixo';

  // Palavras que indicam que a justificativa se apoia no tipo de acesso declarado no modelo.
  const PALAVRAS = {
    wifi: ['rede', 'wi-fi', 'wifi', 'local'],
    internet: ['internet', 'remoto', 'externo'],
    fisico: ['físico', 'fisico', 'placa', 'dispositivo', 'usb', 'serial']
  };

  function consCheck(as) {
    const out = [];
    as.forEach(a => {
      $(`risco${a.n}`).innerHTML = `Risco do ataque ${a.n} (probabilidade × impacto)<b>${Number.isFinite(a.risco) ? a.risco : P.VAZIO}</b><span>${Number.isFinite(a.risco) ? `${a.prob} × ${a.imp} · nível ${nivel(a.risco)}` : 'preencha probabilidade e impacto'}</span>`;
      const r = conferirLinhas(a.linhas);
      if (r.st === 'invalida') out.push(ruim(`Ataque ${a.n}: escreva as linhas como 12 ou 30-34.`));
      else if (r.st === 'fora') out.push(ruim(`Ataque ${a.n}: a linha ${r.fora.join(', ')} não existe no código colado (${r.n} linhas).`));
      const acesso = F.ctx_acesso.value, chaves = PALAVRAS[acesso];
      if (chaves && (a.probJust.trim() || a.impJust.trim())) {
        const texto = (a.probJust + ' ' + a.impJust).toLowerCase();
        if (!chaves.some(k => texto.includes(k)))
          out.push(ruim(`Ataque ${a.n}: as justificativas não citam o acesso declarado no modelo (${F.ctx_acesso.selectedOptions[0].textContent}). A probabilidade se justifica pelo acesso do atacante.`));
      }
    });
    const [a1, a2] = as;
    if (a1.titulo && a2.titulo) {
      if (a1.titulo.toLowerCase() === a2.titulo.toLowerCase()) out.push(ruim('Os dois ataques têm o mesmo título: o barema pede dois ataques diferentes.'));
      else if (a1.origem && a1.origem === a2.origem) out.push(ruim('Os dois ataques partem da mesma vulnerabilidade: confira se são ataques diferentes.'));
      else out.push(ok('Dois ataques com títulos diferentes.'));
    }
    $('consCheck').innerHTML = out.join('');
  }

  /* ---------------- Matriz 3 x 3 ---------------- */
  const svg = $('matriz');
  const M = { x0: 80, y0: 20, c: 90 }; // canto superior esquerdo e lado da célula
  const cx = p => M.x0 + (p - 0.5) * M.c;
  const cy = i => M.y0 + (3 - i + 0.5) * M.c;
  (function desenharGrade() {
    for (let p = 1; p <= 3; p++) for (let i = 1; i <= 3; i++) {
      const r = p * i;
      P.svg('rect', { x: M.x0 + (p - 1) * M.c, y: M.y0 + (3 - i) * M.c, width: M.c, height: M.c,
        fill: r >= 6 ? C.coral : r >= 3 ? C.verde : C.claro, 'fill-opacity': r >= 6 ? 0.55 : 1, stroke: C.branco, 'stroke-width': 3 }, svg);
      P.svg('text', { x: M.x0 + p * M.c - 8, y: M.y0 + (3 - i) * M.c + 18, text: String(r), fill: C.roxo, 'font-size': 12, 'text-anchor': 'end', 'font-family': FM }, svg);
    }
    for (let k = 1; k <= 3; k++) {
      P.svg('text', { x: cx(k), y: M.y0 + 3 * M.c + 20, text: String(k), fill: C.roxo, 'font-size': 13, 'text-anchor': 'middle', 'font-family': FM }, svg);
      P.svg('text', { x: M.x0 - 12, y: cy(k) + 4, text: String(k), fill: C.roxo, 'font-size': 13, 'text-anchor': 'end', 'font-family': FM }, svg);
    }
    P.svg('text', { x: M.x0 + 1.5 * M.c, y: M.y0 + 3 * M.c + 40, text: 'probabilidade', fill: C.roxo, 'font-size': 13, 'text-anchor': 'middle', 'font-family': FT, 'font-weight': 600 }, svg);
    const t = P.svg('text', { x: 24, y: M.y0 + 1.5 * M.c, text: 'impacto', fill: C.roxo, 'font-size': 13, 'text-anchor': 'middle', 'font-family': FT, 'font-weight': 600 }, svg);
    t.setAttribute('transform', `rotate(-90 24 ${M.y0 + 1.5 * M.c})`);
  })();
  const marcas = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'g'));

  function desenharMatriz(as) {
    marcas.textContent = '';
    const validos = as.filter(a => Number.isFinite(a.risco));
    validos.forEach(a => {
      // Dois ataques na mesma célula ficam lado a lado.
      const mesma = validos.filter(b => b.prob === a.prob && b.imp === a.imp);
      const dx = mesma.length > 1 ? (a.n === 1 ? -18 : 18) : 0;
      const g = P.svg('g', { class: 'marca', 'data-ataque': a.n, 'data-prob': a.prob, 'data-imp': a.imp }, marcas);
      P.svg('circle', { cx: cx(a.prob) + dx, cy: cy(a.imp), r: 16, fill: C.roxo }, g);
      P.svg('text', { x: cx(a.prob) + dx, y: cy(a.imp) + 5, text: `A${a.n}`, fill: C.branco, 'font-size': 13, 'text-anchor': 'middle', 'font-family': FM, 'font-weight': 700 }, g);
    });
    $('matrizHint').textContent = validos.length
      ? validos.map(a => `A${a.n}: ${a.titulo || 'sem título'} · probabilidade ${a.prob} × impacto ${a.imp} = risco ${a.risco}`).join(' | ')
      : 'Os ataques aparecem na matriz quando a etapa Construir tem probabilidade e impacto.';
  }

  /* ---------------- Tabela da turma ---------------- */
  const celula = t => L(t).replace(/\|/g, '\\|');
  function linhasTabela(as) {
    return as.filter(a => a.titulo || Number.isFinite(a.risco))
      .sort((a, b) => (Number.isFinite(b.risco) ? b.risco : -1) - (Number.isFinite(a.risco) ? a.risco : -1));
  }
  function tabelaMd(as) {
    const v = x => Number.isFinite(x) ? x : P.VAZIO;
    const rows = linhasTabela(as).map(a => `| ${celula(F.grupo.value)} | ${celula(a.titulo)} | ${v(a.prob)} | ${v(a.imp)} | ${v(a.risco)} |`);
    return ['| Grupo | Título do ataque | Probabilidade | Impacto | Risco |', '|---|---|---|---|---|'].concat(rows).join('\n');
  }
  function tabelaCsv(as) {
    const q = t => `"${String(t ?? '').replace(/"/g, '""')}"`;
    const rows = linhasTabela(as).map(a => [F.grupo.value, a.titulo, a.prob, a.imp, a.risco].map(x => q(Number.isFinite(x) || typeof x === 'string' ? x : '')).join(','));
    return ['grupo,titulo_do_ataque,probabilidade,impacto,risco'].concat(rows).join('\r\n') + '\r\n';
  }

  /* ---------------- Ir além ---------------- */
  function alemCheck() {
    const out = [];
    const usou = F.alem_ataque.value || F.alem_evidencias.value.trim() || F.alem_analise.value.trim();
    if (usou) {
      if (!F.alem_proprio.checked) out.push(ruim('Marque a declaração de que o ataque foi executado só no ESP32 do próprio grupo, na rede da sala.'));
      if (!F.alem_evidencias.value.trim()) out.push(ruim('O ir além pede evidências: capturas de tela, fotos e explicação.'));
      if (!out.length) out.push(ok('Ir além com ataque escolhido, evidências e declaração.'));
    }
    $('alemCheck').innerHTML = out.join('');
  }

  /* ---------------- Atualização geral ---------------- */
  let atual = { cs: [], ts: [], as: [] };
  function atualizar() {
    const cs = candidatos();
    desenharTriagem(cs);
    const ts = triagemAtual(cs);
    popularOrigens(ts);
    const as = [ataque(1), ataque(2)];
    atual = { cs, ts, as };
    const citadas = new Set();
    ts.concat(as).forEach(x => { const r = conferirLinhas(x.linhas); if (r.ls) r.ls.forEach(i => citadas.add(i)); });
    desenharVisor(citadas);
    codigoCheck(); conCheck(cs); confCheck(ts); consCheck(as); desenharMatriz(as); alemCheck();
    $('tabelaMd').textContent = tabelaMd(as);
  }

  function salvar() {
    // A opção escolhida em Vulnerabilidade de origem só existe depois da triagem, então vai no estado extra.
    const origens = {};
    document.querySelectorAll('select.origem').forEach(sel => { origens[sel.name] = sel.value || sel.dataset.salvo || ''; });
    draft.salvar({ triagem: state.triagem, codigoEm: state.codigoEm, origens, ctx: travaCtx.estado(), con: travaCon.estado() });
  }

  form.addEventListener('input', e => {
    if (e.target.closest('#triagem')) return;
    if (e.target.name === 'codigo' && F.codigo.value.trim() && !state.codigoEm) state.codigoEm = new Date().toISOString();
    atualizar(); salvar();
  });

  /* ---------------- Relatório ---------------- */
  function markdown() {
    const { cs, ts, as } = atual;
    const d = name => F[name].value;
    const acessoTxt = F.ctx_acesso.value ? F.ctx_acesso.selectedOptions[0].textContent : P.VAZIO;
    const modeloEm = travaCtx.estado().primeiroEm;
    const ordem = !state.codigoEm ? 'código não colado'
      : modeloEm && state.codigoEm >= modeloEm ? 'código colado depois do registro do modelo de ameaça'
      : '**código colado antes do registro do modelo de ameaça**';
    const lista = d('con_lista').replace(/~~~~/g, '~ ~ ~ ~');
    const tri = ts.map(t => `| ${t.n} | ${celula(t.c)} | ${t.decisao || P.VAZIO} | ${celula(t.linhas)} | ${celula(t.just)} |`).join('\n');
    const descartes = ts.filter(t => t.decisao === 'descarta' && t.just.trim() && conferirLinhas(t.linhas).st === 'ok').length;
    const bloco = a => `### Ataque ${a.n}: ${L(a.titulo)}

- **Vulnerabilidade de origem:** ${L(a.origem)}
- **Linha(s) do código:** ${L(a.linhas)}
- **Probabilidade:** ${Number.isFinite(a.prob) ? a.prob : P.VAZIO}. ${L(a.probJust)}
- **Impacto:** ${Number.isFinite(a.imp) ? a.imp : P.VAZIO}. ${L(a.impJust)}
- **Risco (probabilidade × impacto):** ${Number.isFinite(a.risco) ? `${a.risco} (nível ${nivel(a.risco)})` : P.VAZIO}

**Passo a passo da execução**

${a.passos.trim() || P.VAZIO}
`;
    const alem = d('alem_ataque')
      ? `- **Ataque executado:** Ataque ${d('alem_ataque')}
- **Executado só no ESP32 do próprio grupo, na rede da sala:** ${F.alem_proprio.checked ? 'sim' : 'não declarado'}
- **Evidências:** ${L(d('alem_evidencias'))}
- **Análise dinâmica:** ${L(d('alem_analise'))}`
      : 'O grupo não fez o ir além.';
    return `# Relatório técnico · Visão Geral sobre Segurança em IoT (Atividade Ponderada em Sala)

**Grupo:** ${L(d('grupo'))}
**Integrantes:** ${L(d('integrantes').split(/\n+/).filter(Boolean).join('; '))}
**Código sob análise:** servidor web local do ESP32 (${TUTORIAL}), ${linhasCodigo().length} linhas coladas
**Modelo de ameaça registrado em:** ${travaCtx.historico()}
**Código colado em:** ${state.codigoEm ? P.quando(state.codigoEm) : P.VAZIO} · ${ordem}
**Lista bruta registrada em:** ${travaCon.historico()}

## 1. Contextualizar: modelo de ameaça

| Pergunta | Resposta |
|---|---|
| Quem é o atacante | ${celula(d('ctx_atacante'))} |
| O que ele quer obter | ${celula(d('ctx_objetivo'))} |
| A que ele tem acesso | ${celula(acessoTxt)}: ${celula(d('ctx_acesso_desc'))} |

## 2. Consultar: lista bruta da IA

- **Ferramenta:** ${L(d('con_ferramenta'))}
- **Pergunta:** ${L(d('con_pergunta'))}

Lista produzida pela IA, sem edição:

~~~~text
${lista.trim() || P.VAZIO}
~~~~

## 3. Confrontar: triagem dos candidatos

${cs.length ? `| # | Candidato | Decisão | Linha(s) | Justificativa |
|---|---|---|---|---|
${tri}

Candidatos: ${cs.length} · aplicam: ${ts.filter(t => t.decisao === 'aplica').length} · descartados com justificativa e linha válida: ${descartes}` : 'Sem lista bruta da IA.'}

## 4. Construir: dois ataques

${bloco(as[0])}
${bloco(as[1])}
## 5. Comprovar: tabela da turma e defesa oral

${tabelaMd(as)}

- **Contestação recebida:** ${L(d('comp_contestacao'))}
- **Resposta do grupo:** ${L(d('comp_resposta'))}

## Ir além

${alem}

Declaramos que a lista da IA foi colada sem edição e que o modelo de ameaça foi escrito pelo grupo antes de abrir o código: ${F.decl.checked ? 'sim' : 'não marcado'}
`;
  }

  const status = $('formStatus');
  $('btnMd').addEventListener('click', () => {
    atualizar();
    const faltam = P.pendentes(form);
    const avisos = [];
    if (faltam) avisos.push(`${faltam} campo(s) obrigatório(s) em branco (destacados)`);
    if (!travaCtx.registrado()) avisos.push('modelo de ameaça não registrado');
    if (!F.con_lista.value.trim()) avisos.push('sem lista bruta da IA (o Confrontar recebe zero)');
    else if (!travaCon.registrado()) avisos.push('lista bruta não registrada');
    status.hidden = !avisos.length;
    status.textContent = avisos.length ? `Relatório baixado com pendências: ${avisos.join('; ')}.` : '';
    P.baixar('RELATORIO.md', markdown(), 'text/markdown');
  });
  $('btnCsv').addEventListener('click', () => { atualizar(); P.baixar('tabela-da-turma.csv', tabelaCsv(atual.as), 'text/csv'); });

  // Limpar pede um segundo clique em até 4 s, para não apagar o rascunho por engano.
  let armado = null;
  $('btnClear').addEventListener('click', e => {
    const b = e.currentTarget;
    if (!armado) {
      b.textContent = 'Clique de novo para apagar o rascunho';
      armado = setTimeout(() => { armado = null; b.textContent = 'Limpar rascunho'; }, 4000);
      return;
    }
    clearTimeout(armado); armado = null; b.textContent = 'Limpar rascunho';
    draft.apagar(); form.reset(); form.classList.remove('was-validated');
    Object.assign(state, { triagem: {}, codigoEm: null });
    travaCtx.carregar(null); travaCon.carregar(null); cache = ''; status.hidden = true;
    atualizar();
  });

  /* ---------------- Início ---------------- */
  const extra = draft.restaurar();
  if (extra) {
    state.triagem = extra.triagem || {};
    state.codigoEm = extra.codigoEm || null;
    const origens = extra.origens || {};
    document.querySelectorAll('select.origem').forEach(sel => { if (origens[sel.name]) sel.dataset.salvo = origens[sel.name]; });
  }
  travaCtx.carregar(extra && extra.ctx); travaCon.carregar(extra && extra.con);
  atualizar();

  // Ganchos para os testes automatizados (tools/tests/test_ponderada_seguranca.py).
  window.PonderadaSeguranca = { candidatos, parseLinhas, conferirLinhas, markdown, tabelaCsv: () => tabelaCsv(atual.as) };
})();
