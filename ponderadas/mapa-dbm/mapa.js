/* Atividade - Mapa de Calor calculando dBm de sinal WiFi: calculadora de dBm, previsão da ordem
   dos cinco pontos, importação da serial do laboratório da Aula 08, confronto com o modelo
   log-distância e relatório. Usa a base comum (window.Ponderada, ADR-012). */
(function () {
  const P = window.Ponderada;
  const { C, FM, num, fmt, fmtSig, L, esc } = P;
  const KEY = 'ponderada-mapa-dbm-rascunho';
  const N = 5;
  const ELEVADOR = 'interior do elevador';

  /* ---------------- Funções puras (expostas para teste) ---------------- */

  // Razão de potência de uma diferença em dB: 10^(Δ/10).
  const razao = delta => Math.pow(10, delta / 10);
  const mw = dbm => Math.pow(10, dbm / 10);

  /* Saída do Monitor Serial do laboratório da Aula 08. Aceita "RSSI -63 dBm = ..." e números
     soltos, com sinal de menos ASCII ou tipográfico. "Sem Wi-Fi" e 0 dBm contam como sem conexão. */
  function lerSerial(texto) {
    const valores = []; let semConexao = 0, ignoradas = 0;
    String(texto || '').split(/\r?\n/).forEach(bruta => {
      const linha = bruta.replace(/−/g, '-').trim();
      if (!linha) return;
      if (/sem\s+wi-?fi/i.test(linha)) { semConexao++; return; }
      const m = linha.match(/RSSI\s*(-?\d+(?:[.,]\d+)?)\s*dBm/i) || linha.match(/^(-?\d+(?:[.,]\d+)?)$/);
      if (!m) { ignoradas++; return; }
      const v = num(m[1]);
      if (v === 0) semConexao++;
      else if (v > 0) ignoradas++;
      else valores.push(v);
    });
    return { valores, semConexao, ignoradas };
  }

  function estatistica(valores) {
    if (!valores.length) return { n: 0, media: NaN, min: NaN, max: NaN };
    const soma = valores.reduce((a, b) => a + b, 0);
    return { n: valores.length, media: soma / valores.length, min: Math.min(...valores), max: Math.max(...valores) };
  }

  const modelo = (d, rssi0, gama, d0 = 1) => rssi0 - 10 * gama * Math.log10(d / d0);

  /* Ajuste do modelo log-distância por mínimos quadrados. Com RSSI0 conhecido, só γ é ajustado
     (reta pela origem em x = log10(d/d0)); sem RSSI0, ajusta os dois (regressão linear). */
  function ajustarGama(dist, rssi, rssi0, d0 = 1) {
    const pts = dist.map((d, i) => [d, rssi[i]]).filter(([d, r]) => d > 0 && Number.isFinite(d) && Number.isFinite(r));
    if (pts.length < 2) return null;
    const xs = pts.map(([d]) => Math.log10(d / d0)), ys = pts.map(([, r]) => r);
    let a, b;
    if (Number.isFinite(rssi0)) {
      const sxx = xs.reduce((s, x) => s + x * x, 0);
      if (sxx === 0) return null;
      b = xs.reduce((s, x, i) => s + x * (ys[i] - rssi0), 0) / sxx;
      a = rssi0;
    } else {
      const mx = xs.reduce((s, x) => s + x, 0) / xs.length, my = ys.reduce((s, y) => s + y, 0) / ys.length;
      const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
      if (sxx === 0) return null;
      b = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / sxx;
      a = my - b * mx;
    }
    const rmse = Math.sqrt(xs.reduce((s, x, i) => s + (ys[i] - (a + b * x)) ** 2, 0) / xs.length);
    return { gama: -b / 10, rssi0: a, rmse, n: pts.length };
  }

  /* Posição medida de cada ponto (1 = sinal mais forte) e comparação par a par com a ordem
     prevista. Diferença menor que delta conta como empate, e empate não contradiz a previsão. */
  function compararOrdem(prevista, medias, delta) {
    const idx = medias.map((m, i) => i).filter(i => Number.isFinite(medias[i]));
    const ordenados = idx.slice().sort((i, j) => medias[j] - medias[i]);
    const medida = medias.map(() => NaN);
    ordenados.forEach((i, k) => { medida[i] = k + 1; });
    let concordam = 0, contradizem = 0, empates = 0;
    const contradicoes = [];
    for (let a = 0; a < idx.length; a++) {
      for (let b = a + 1; b < idx.length; b++) {
        const i = idx[a], j = idx[b];
        if (!Number.isFinite(prevista[i]) || !Number.isFinite(prevista[j])) continue;
        if (Math.abs(medias[i] - medias[j]) < delta) { empates++; continue; }
        const previstoMaisForte = prevista[i] < prevista[j] ? i : j;
        const medidoMaisForte = medias[i] > medias[j] ? i : j;
        if (previstoMaisForte === medidoMaisForte) concordam++;
        else { contradizem++; contradicoes.push([previstoMaisForte + 1, medidoMaisForte + 1]); }
      }
    }
    return { medida, concordam, contradizem, empates, contradicoes };
  }

  window.MapaDbm = { razao, mw, lerSerial, estatistica, modelo, ajustarGama, compararOrdem };

  /* ---------------- Calculadora ---------------- */
  const $ = id => document.getElementById(id);
  const fmtRazao = r => r >= 100 ? fmt(r, 0) : r >= 10 ? fmt(r, 1) : fmt(r, 3);
  function calcular() {
    const d = num($('cDbm').value);
    $('outMw').innerHTML = Number.isFinite(d) ? `P<b>${mw(d).toExponential(2).replace('.', ',')} mW</b><span>${fmt(d, 1)} dBm</span>` : 'Informe um valor em dBm.';
    const a = num($('cA').value), b = num($('cB').value);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const dd = a - b, r = razao(dd);
      $('outRazao').innerHTML = `A ÷ B<b>${fmtRazao(r)} ×</b><span>diferença de ${fmt(dd, 1)} dB</span>`;
    } else $('outRazao').textContent = 'Informe os dois valores.';
    const x = num($('cDelta').value);
    $('outDelta').innerHTML = Number.isFinite(x) ? `razão<b>${fmtRazao(razao(x))} ×</b><span>10<sup>${fmt(x / 10, 2)}</sup></span>` : 'Informe a diferença.';
  }
  ['cDbm', 'cA', 'cB', 'cDelta'].forEach(id => $(id).addEventListener('input', calcular));
  calcular();

  /* ---------------- Montagem das tabelas dos cinco pontos ---------------- */
  const tbPrev = document.querySelector('#tabPrev tbody');
  for (let i = 1; i <= N; i++) {
    const opcoes = ['<option value="">…</option>'].concat([1, 2, 3, 4, 5].map(k => `<option value="${k}">${k}</option>`)).join('');
    const nome = i === N
      ? `<input name="p${i}_nome" value="${ELEVADOR}" readonly aria-label="Nome do ponto ${i}">`
      : `<input name="p${i}_nome" required aria-label="Nome do ponto ${i}" placeholder="como no card do encontro">`;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>P${i}</td><td>${nome}</td>`
      + `<td><input name="p${i}_dist" type="number" min="0" step="any" required aria-label="Distância do ponto ${i} (m)"></td>`
      + `<td><input name="p${i}_paredes" type="number" min="0" step="1" required aria-label="Paredes até o ponto ${i}"></td>`
      + `<td><select name="p${i}_ordem" required aria-label="Posição prevista do ponto ${i}">${opcoes}</select></td>`;
    tbPrev.appendChild(tr);
  }
  const coletas = $('coletas');
  coletas.className = 'coleta-grid';
  for (let i = 1; i <= N; i++) {
    const lab = document.createElement('label');
    lab.innerHTML = `<span>Saída da serial no ponto P${i} <span class="resumo" id="res${i}"></span></span>`
      + `<textarea name="col_p${i}" rows="4" placeholder="RSSI -63 dBm = 5.01e-07 mW"></textarea>`;
    coletas.appendChild(lab);
  }
  const tbMed = document.querySelector('#tabMed tbody');
  const tbConf = document.querySelector('#tabConf tbody');

  const form = $('labForm');
  const F = form.elements;

  /* ---------------- Leitura do formulário ---------------- */
  function pontos() {
    const lista = [];
    for (let i = 1; i <= N; i++) {
      const lido = lerSerial(F[`col_p${i}`].value);
      lista.push(Object.assign({
        i, nome: F[`p${i}_nome`].value.trim(), dist: num(F[`p${i}_dist`].value),
        paredes: num(F[`p${i}_paredes`].value), ordem: num(F[`p${i}_ordem`].value), lido
      }, estatistica(lido.valores)));
    }
    return lista;
  }
  const delta = () => { const d = num(F.ctx_db.value); return Number.isFinite(d) ? d : 0; };
  const parametrosIA = () => ({ rssi0: num(F.con_rssi0.value), gama: num(F.con_gama.value) });

  /* ---------------- Registro da previsão ---------------- */
  const stepCtx = $('stepCtx');
  const trava = P.trava({ etapa: stepCtx, botao: $('btnLock'), status: $('lockStatus'), rotulo: 'previsão', aoMudar: () => salvar() });
  let primeiroDadoEm = null;

  function ctxCheck() {
    const ps = pontos(), out = [];
    const ordens = ps.map(p => p.ordem).filter(Number.isFinite);
    const repetidas = [...new Set(ordens.filter((o, k) => ordens.indexOf(o) !== k))];
    if (repetidas.length) out.push(P.ruim(`Posição ${repetidas.join(', ')} usada em mais de um ponto. Cada posição de 1 a 5 aparece uma vez.`));
    else if (ordens.length === N) out.push(P.ok('Cinco posições diferentes, de 1 a 5.'));
    const semDist = ps.filter(p => !(p.dist > 0)).length;
    if (semDist && semDist < N) out.push(P.ruim(`${semDist} ponto(s) sem distância até o roteador.`));
    $('ctxCheck').innerHTML = out.join('');
    // A regra das posições sem repetição também barra o registro.
    ps.forEach(p => F[`p${p.i}_ordem`].setCustomValidity(repetidas.includes(p.ordem) ? 'posição repetida' : ''));
  }

  /* ---------------- Medição ---------------- */
  function renderMedicao() {
    const ps = pontos(), out = [];
    tbMed.innerHTML = ps.map(p => `<tr><td>P${p.i}</td><td>${esc(p.nome || P.VAZIO)}</td><td>${p.n}</td><td>${fmt(p.media, 1)}</td><td>${fmt(p.min, 0)}</td><td>${fmt(p.max, 0)}</td><td>${p.lido.semConexao}</td></tr>`).join('');
    ps.forEach(p => {
      $(`res${p.i}`).textContent = p.n || p.lido.semConexao ? `${p.n} leitura(s) · média ${fmt(p.media, 1)} dBm${p.lido.semConexao ? ` · ${p.lido.semConexao} sem conexão` : ''}` : '';
    });
    const medidos = ps.filter(p => p.n > 0).length;
    const comDado = ps.filter(p => p.n > 0 || p.lido.semConexao > 0).length;
    if (!comDado) { $('dataCheck').innerHTML = ''; return; }
    if (!primeiroDadoEm) primeiroDadoEm = new Date().toISOString();
    if (!trava.registrado()) out.push(P.ruim('Você está registrando medições sem a previsão registrada. A ordem precisa ser escrita antes de medir.'));
    if (medidos < N) out.push(P.ruim(`Faltam leituras em ${N - medidos} ponto(s): ${ps.filter(p => !p.n).map(p => 'P' + p.i).join(', ')}. O percurso tem cinco pontos.`));
    else out.push(P.ok('Os cinco pontos do percurso têm leituras.'));
    const poucas = ps.filter(p => p.n > 0 && p.n < 3);
    if (poucas.length) out.push(P.ruim(`Menos de três leituras em ${poucas.map(p => 'P' + p.i).join(', ')}: espere o valor estabilizar e copie mais linhas.`));
    const elev = ps[N - 1];
    if (elev.lido.semConexao > 0) out.push(P.ok(`O elevador registrou ${elev.lido.semConexao} leitura(s) sem conexão: o bloqueio aparece na serial.`));
    else if (elev.n > 0) out.push(P.neutro('Nenhuma leitura sem conexão no elevador. Se o sinal não caiu, registre isso nas observações.'));
    const t = num(F.elev_tempo.value);
    if (Number.isFinite(t) && t < 5) out.push(P.ruim('O enunciado pede pelo menos 5 s com as portas fechadas no elevador.'));
    const ignoradas = ps.reduce((s, p) => s + p.lido.ignoradas, 0);
    if (ignoradas) out.push(P.neutro(`${ignoradas} linha(s) sem leitura de RSSI foram ignoradas.`));
    $('dataCheck').innerHTML = out.join('');
  }

  /* ---------------- Confronto ---------------- */
  function analise() {
    const ps = pontos(), ia = parametrosIA();
    const ajusteIA = ajustarGama(ps.map(p => p.dist), ps.map(p => p.media), ia.rssi0);
    // A curva do modelo usa os parâmetros da IA; o que a IA não deu sai do ajuste aos dados.
    const rssi0 = Number.isFinite(ia.rssi0) ? ia.rssi0 : ajusteIA ? ajusteIA.rssi0 : NaN;
    const gama = Number.isFinite(ia.gama) ? ia.gama : NaN;
    const ordem = compararOrdem(ps.map(p => p.ordem), ps.map(p => (p.n ? p.media : NaN)), delta());
    const erros = ps.map(p => (Number.isFinite(rssi0) && Number.isFinite(gama) && p.dist > 0 && p.n ? p.media - modelo(p.dist, rssi0, gama) : NaN));
    return { ps, ia, ajuste: ajusteIA, rssi0, gama, ordem, erros };
  }

  function renderConfronto() {
    const A = analise(), out = [];
    tbConf.innerHTML = A.ps.map((p, k) => `<tr><td>P${p.i}</td><td>${fmtSig(p.dist)}</td><td>${Number.isFinite(p.ordem) ? p.ordem : P.VAZIO}</td><td>${Number.isFinite(A.ordem.medida[k]) ? A.ordem.medida[k] : P.VAZIO}</td><td>${fmt(p.media, 1)}</td><td>${Number.isFinite(A.erros[k]) ? fmt(modelo(p.dist, A.rssi0, A.gama), 1) : P.VAZIO}</td><td>${Number.isFinite(A.erros[k]) ? (A.erros[k] >= 0 ? '+' : '') + fmt(A.erros[k], 1) : P.VAZIO}</td></tr>`).join('');
    const rmseIA = (() => { const e = A.erros.filter(Number.isFinite); return e.length ? Math.sqrt(e.reduce((s, x) => s + x * x, 0) / e.length) : NaN; })();
    $('ajusteOut').innerHTML = [
      `<div class="out">Modelo da IA<b>${Number.isFinite(A.gama) ? 'γ = ' + fmt(A.gama, 2) : P.VAZIO}</b><span>RSSI<sub>0</sub> = ${fmt(A.rssi0, 1)} dBm${Number.isFinite(A.ia.rssi0) ? ' (da IA)' : ' (ajustado)'}</span></div>`,
      `<div class="out">Erro médio do modelo da IA<b>${Number.isFinite(rmseIA) ? fmt(rmseIA, 1) + ' dB' : P.VAZIO}</b><span>raiz do erro quadrático médio</span></div>`,
      `<div class="out">γ ajustado aos seus dados<b>${A.ajuste ? fmt(A.ajuste.gama, 2) : P.VAZIO}</b><span>${A.ajuste ? `${A.ajuste.n} pontos · erro ${fmt(A.ajuste.rmse, 1)} dB` : 'precisa de dois pontos com distância'}</span></div>`
    ].join('');
    if (!Number.isFinite(A.gama)) out.push(P.neutro('Sem expoente da IA no Consultar, a curva do modelo não é desenhada. Anote o γ que a IA apresentou.'));
    const comparados = A.ordem.concordam + A.ordem.contradizem + A.ordem.empates;
    if (comparados) {
      out.push(P.neutro(`Ordem prevista contra medida, em ${comparados} pares de pontos: ${A.ordem.concordam} concordam, ${A.ordem.contradizem} contradizem e ${A.ordem.empates} empatam (diferença menor que ${fmt(delta(), 1)} dB).`));
      A.ordem.contradicoes.forEach(([prev, med]) => out.push(P.ruim(`Você previu P${prev} mais forte, e P${med} mediu mais forte.`)));
    }
    $('ordemCheck').innerHTML = out.join('');
    desenhar();
  }

  /* ---------------- Gráfico ---------------- */
  function desenharGrafico(ctx, W, H, titulo) {
    const A = analise();
    const ps = A.ps.filter(p => p.dist > 0 && p.n > 0);
    if (!ps.length) {
      P.eixos(ctx, W, H, { x: [0, 10], y: [-100, -30], rotX: 'Distância até o roteador (m)', rotY: 'RSSI (dBm)', titulo });
      ctx.fillStyle = C.roxo; ctx.textAlign = 'center'; ctx.font = `12px ${FM}`;
      ctx.fillText('Preencha as distâncias no Contextualizar e cole as leituras no Construir.', W / 2, H / 2);
      return;
    }
    const dMax = Math.max(...ps.map(p => p.dist)) * 1.1;
    const curvaIA = Number.isFinite(A.gama) && Number.isFinite(A.rssi0);
    const ys = ps.flatMap(p => [p.min, p.max]);
    if (curvaIA) ys.push(modelo(Math.min(...ps.map(p => p.dist)), A.rssi0, A.gama), modelo(dMax, A.rssi0, A.gama));
    const yMin = Math.floor((Math.min(...ys) - 5) / 5) * 5, yMax = Math.ceil((Math.max(...ys) + 5) / 5) * 5;
    const { X, Y, pad } = P.eixos(ctx, W, H, { x: [0, dMax], y: [yMin, yMax], rotX: 'Distância até o roteador (m)', rotY: 'RSSI (dBm)', titulo });
    const curva = (rssi0, gama, cor, traco, largura) => {
      const d0 = dMax / 200;
      ctx.save(); ctx.beginPath(); ctx.rect(pad.l, pad.t, W - pad.l - pad.r, H - pad.t - pad.b); ctx.clip();
      ctx.strokeStyle = cor; ctx.lineWidth = largura; ctx.setLineDash(traco);
      ctx.beginPath();
      for (let k = 0; k <= 240; k++) { const d = d0 + (dMax - d0) * k / 240; const y = Y(modelo(d, rssi0, gama)); k ? ctx.lineTo(X(d), y) : ctx.moveTo(X(d), y); }
      ctx.stroke(); ctx.restore();
    };
    if (curvaIA) curva(A.rssi0, A.gama, C.verde, [], 3);
    if (A.ajuste) curva(A.ajuste.rssi0, A.ajuste.gama, C.roxo, [7, 5], 2);
    ctx.font = `12px ${FM}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ps.forEach(p => {
      ctx.strokeStyle = C.coral; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(p.dist), Y(p.min)); ctx.lineTo(X(p.dist), Y(p.max)); ctx.stroke();
      ctx.beginPath(); ctx.arc(X(p.dist), Y(p.media), 5, 0, 2 * Math.PI);
      ctx.fillStyle = C.coral; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.branco; ctx.stroke();
      ctx.fillStyle = C.roxo; ctx.fillText('P' + p.i, X(p.dist) + 9, Y(p.media));
    });
    const itens = [];
    if (curvaIA) itens.push(['line', C.verde, `Modelo da IA, γ = ${fmt(A.gama, 2)}`]);
    itens.push(['dot', C.coral, 'Medido: média, do mínimo ao máximo']);
    if (A.ajuste) itens.push(['dash', C.roxo, `Ajuste aos dados, γ = ${fmt(A.ajuste.gama, 2)}`]);
    P.legenda(ctx, W, pad, itens);
  }
  const cv = $('chartMain');
  function desenhar() { const { ctx, W, H } = P.prepararCanvas(cv); desenharGrafico(ctx, W, H); }
  window.addEventListener('resize', desenhar);
  const baixarPng = () => P.png((ctx, W, H) => desenharGrafico(ctx, W, H, `RSSI no percurso · RA terminado em ${F.ra_digito.value || P.VAZIO}`)).then(b => P.baixar('grafico-dbm.png', b));
  $('btnPng').addEventListener('click', baixarPng);
  $('btnPng2').addEventListener('click', baixarPng);

  /* ---------------- Leitura numérica ---------------- */
  function renderLeitura() {
    const a = num(F.comp_va.value), b = num(F.comp_vb.value);
    if (!Number.isFinite(a) || !Number.isFinite(b)) { $('leituraOut').innerHTML = ''; return; }
    const d = a - b, r = razao(Math.abs(d));
    $('leituraOut').innerHTML = `<div class="out">Diferença A − B<b>${(d >= 0 ? '+' : '') + fmt(d, 1)} dB</b><span>${d === 0 ? 'mesma potência' : `${d > 0 ? 'A' : 'B'} recebe ${fmtRazao(r)} × a potência do outro`}</span></div>`
      + `<div class="out">Potências<b>${mw(a).toExponential(2).replace('.', ',')} mW</b><span>contra ${mw(b).toExponential(2).replace('.', ',')} mW</span></div>`;
  }

  /* ---------------- Relatório ---------------- */
  function markdown() {
    const A = analise(), d = Object.fromEntries([...F].filter(el => el.name).map(el => [el.name, el.type === 'checkbox' ? (el.checked ? 'sim' : 'não') : el.value]));
    const ordemCols = A.ps.map((p, k) => `| P${p.i} | ${L(p.nome)} | ${fmtSig(p.dist)} | ${Number.isFinite(p.paredes) ? p.paredes : P.VAZIO} | ${Number.isFinite(p.ordem) ? p.ordem : P.VAZIO} | ${p.n} | ${fmt(p.media, 1)} | ${fmt(p.min, 0)} | ${fmt(p.max, 0)} | ${p.lido.semConexao} | ${Number.isFinite(A.ordem.medida[k]) ? A.ordem.medida[k] : P.VAZIO} |`).join('\n');
    const conf = A.ps.map((p, k) => `| P${p.i} | ${fmt(p.media, 1)} | ${Number.isFinite(A.erros[k]) ? fmt(modelo(p.dist, A.rssi0, A.gama), 1) : P.VAZIO} | ${Number.isFinite(A.erros[k]) ? fmt(A.erros[k], 1) : P.VAZIO} |`).join('\n');
    const a = num(d.comp_va), b = num(d.comp_vb), dif = a - b;
    const primeiroDado = primeiroDadoEm ? P.quando(primeiroDadoEm) : P.VAZIO;
    const antes = trava.estado().primeiroEm && primeiroDadoEm ? (trava.estado().primeiroEm <= primeiroDadoEm ? 'previsão registrada antes do primeiro dado' : '**primeiro dado antes da previsão**') : '';
    return `# Relatório · Atividade - Mapa de Calor calculando dBm de sinal WiFi

**Aluno:** ${L(d.nome)} · ${L(d.email)} · Turma ${L(d.turma)}
**Último dígito do RA:** ${L(d.ra_digito)}
**Plataforma online:** ${L(d.plataforma)}
**Previsão registrada em:** ${trava.historico()}
**Primeiro dado colado em:** ${primeiroDado}${antes ? ' · ' + antes : ''}

## 1. Contextualizar

- **Diferença perceptível declarada:** ${L(d.ctx_db)} dB
- **Justificativa da ordem:** ${L(d.ctx_just)}

## 2. Consultar

- **Ferramenta:** ${L(d.con_ferramenta)}
- **Pergunta:** ${L(d.con_pergunta)}
- **Modelo apresentado:** ${L(d.con_modelo)}
- **Premissas declaradas:** ${L(d.con_premissas)}
- **Parâmetros da IA:** RSSI a 1 m = ${L(d.con_rssi0)} dBm · γ = ${L(d.con_gama)}

## 3. Construir: previsão contra medição dos cinco pontos

| Ponto | Nome | Distância (m) | Paredes | Posição prevista | Leituras | Média (dBm) | Mínimo | Máximo | Sem conexão | Posição medida |
|---|---|---|---|---|---|---|---|---|---|---|
${ordemCols}

- **Bloqueio no elevador:** ${L(d.elev_bloqueio)} · ${L(d.elev_tempo)} s com as portas fechadas
- **Observações:** ${L(d.cons_obs)}

## 4. Confrontar

Modelo da IA: RSSI<sub>0</sub> = ${fmt(A.rssi0, 1)} dBm${Number.isFinite(A.ia.rssi0) ? '' : ' (ajustado aos dados, a IA não deu valor)'}, γ = ${fmt(A.gama, 2)}.
γ ajustado aos dados: ${A.ajuste ? `${fmt(A.ajuste.gama, 2)} (RSSI0 = ${fmt(A.ajuste.rssi0, 1)} dBm, erro ${fmt(A.ajuste.rmse, 1)} dB)` : P.VAZIO}.

| Ponto | Medido (dBm) | Modelo da IA (dBm) | Erro (dB) |
|---|---|---|---|
${conf}

Ordem prevista contra medida (empate abaixo de ${fmt(delta(), 1)} dB): ${A.ordem.concordam} pares concordam, ${A.ordem.contradizem} contradizem, ${A.ordem.empates} empatam.

- **Onde o modelo acerta:** ${L(d.conf_acertos)}
- **Premissa que não se sustenta:** ${L(d.conf_premissa)}
- **Evidência nos dados:** ${L(d.conf_evidencia)}

![Medição contra modelo](grafico-dbm.png)

## 5. Comprovar

- **Valores lidos no vídeo:** A = ${L(d.comp_va)} dBm, B = ${L(d.comp_vb)} dBm · diferença ${Number.isFinite(dif) ? fmt(dif, 1) + ' dB' : P.VAZIO} · razão de potência ${Number.isFinite(dif) ? fmtRazao(razao(Math.abs(dif))) + ' ×' : P.VAZIO}
- **Queda de 3 dB:** ${L(d.comp_3db)}
- **Vídeo:** ${L(d.comp_video)}

Declaro que as medições são do percurso do meu RA, feitas com o ESP32 do kit: ${d.decl}
`;
  }

  function adr() {
    const d = Object.fromEntries([...F].filter(el => el.name).map(el => [el.name, el.value]));
    return `# ADR: ${L(d.adr_titulo)}

**Data:** ${new Date().toLocaleDateString('pt-BR')}
**Autor:** ${L(d.nome)}
**Atividade:** Atividade - Mapa de Calor calculando dBm de sinal WiFi

## Contexto

Decisão técnica tomada na coleta e na análise do sinal Wi-Fi do percurso do RA terminado em ${L(d.ra_digito)}.

## Decisão própria

${L(d.adr_decisao)}

**Alternativa considerada:** ${L(d.adr_alternativa)}

## Sugestão da IA

${L(d.adr_sugestao)}

## Decisão sobre a sugestão (${L(d.adr_tipo).toLowerCase()})

${L(d.adr_razao)}

## Consequência no artefato

${L(d.adr_consequencia)}
`;
  }

  const status = $('formStatus');
  $('btnMd').addEventListener('click', () => {
    const faltam = P.pendentes(form), avisos = [];
    if (faltam) avisos.push(`${faltam} campo(s) obrigatório(s) em branco (destacados)`);
    if (!trava.registrado()) avisos.push('previsão não registrada');
    if (pontos().filter(p => p.n > 0).length < N) avisos.push('menos de cinco pontos com leituras');
    status.hidden = !avisos.length;
    status.textContent = avisos.length ? `Relatório baixado com pendências: ${avisos.join('; ')}.` : '';
    P.baixar('RELATORIO.md', markdown(), 'text/markdown');
  });
  $('btnAdr').addEventListener('click', () => P.baixar('ADR.md', adr(), 'text/markdown'));

  /* ---------------- Rascunho e atualização ---------------- */
  const rascunho = P.rascunho(form, KEY);
  function salvar() { rascunho.salvar({ trava: trava.estado(), primeiroDadoEm }); }
  function atualizar() { ctxCheck(); renderMedicao(); renderConfronto(); renderLeitura(); }
  form.addEventListener('input', () => { atualizar(); salvar(); });
  form.addEventListener('change', () => { atualizar(); salvar(); });
  $('btnClear').addEventListener('click', () => {
    rascunho.apagar(); form.reset(); form.classList.remove('was-validated'); stepCtx.classList.remove('was-validated');
    F.p5_nome.value = ELEVADOR; primeiroDadoEm = null; trava.carregar(null);
    status.hidden = false; status.textContent = 'Rascunho apagado.';
    atualizar();
  });

  const extra = rascunho.restaurar();
  trava.carregar(extra && extra.trava);
  primeiroDadoEm = extra && extra.primeiroDadoEm || null;
  F.p5_nome.value = ELEVADOR;
  atualizar();
  if (document.fonts) document.fonts.ready.then(desenhar);
})();
