#!/usr/bin/env python3
"""
Gera o index.html do portal a partir do calendário do PLANO_DE_ENSINO.md.

Cada botão de artefato só fica habilitado quando o arquivo existe no
repositório, então o portal nunca aponta para uma aula que ainda não foi
construída. Rodar de novo sempre que um artefato novo for criado:

    python3 tools/gerar_portal.py > index.html
"""
import html
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTEFATOS = [
    ("Slides", "slideshow", "aulas/aula%s.html"),
    ("Material", "menu_book", "materiais/aula%s.html"),
    ("Referências", "link", "referencias/aula%s.html"),
    ("Laboratório", "memory", "labs/aula%s.html"),
]
# Atividade ponderada com página própria, como botão extra no card da aula (ADR-011).
PONDERADAS = {"02": ("Ponderada", "assignment", "ponderadas/ponderada-1/index.html")}
REVIEWS = {"1": "Sprint Review em 23/10", "2": "Sprint Review em 06/11", "3": "Sprint Review em 19/11",
           "4": "Sprint Review em 04/12", "5": "Apresentação Final em 18/12"}
ETAPAS = {"1": "DAIA-E SP1 e SP2", "2": "DAIA-E SP2", "3": "DAIA-E SP3", "4": "DAIA-E SP4", "5": "DAIA-E SP5"}


def _ler(*partes):
    with open(os.path.join(RAIZ, *partes), encoding="utf-8") as fh:
        return fh.read()


def calendario():
    """Linhas da tabela do calendário do plano: (aula, data, semana, sprint, título)."""
    plano = _ler("PLANO_DE_ENSINO.md")
    secao = plano.split("## 3. Calendário", 1)[1].split("## 4.", 1)[0]
    linhas = re.findall(r"^\| (\d\d) \| (\d\d/\d\d) \| Semana (\d\d) \| Sprint (\d) \| (.+?) \|$",
                        secao, flags=re.M)
    if len(linhas) != 12:
        raise ValueError("o calendário do plano deveria ter 12 aulas, tem %d" % len(linhas))
    return linhas


def camadas():
    """Camada do rastreador de cada aula, da tabela da seção 2 do plano."""
    plano = _ler("PLANO_DE_ENSINO.md")
    secao = plano.split("## 2. O case", 1)[1].split("## 3.", 1)[0]
    return dict(re.findall(r"^\| (\d\d) \| (.+?) \|$", secao, flags=re.M))


def _botoes(numero):
    saida = []
    for rotulo, icone, molde in ARTEFATOS:
        caminho = molde % numero
        span = '<span class="material-symbols-outlined" aria-hidden="true">%s</span>' % icone
        if os.path.isfile(os.path.join(RAIZ, caminho)):
            saida.append('              <a class="botao" href="%s">%s%s</a>' % (caminho, span, rotulo))
        else:
            saida.append('              <a class="botao" aria-disabled="true">%s%s</a>' % (span, rotulo))
    if numero in PONDERADAS and os.path.isfile(os.path.join(RAIZ, PONDERADAS[numero][2])):
        rotulo, icone, caminho = PONDERADAS[numero]
        saida.append('              <a class="botao" href="%s"><span class="material-symbols-outlined" '
                     'aria-hidden="true">%s</span>%s</a>' % (caminho, icone, rotulo))
    return "\n".join(saida)


def renderizar():
    linhas = calendario()
    resumo = camadas()
    blocos = []
    for sprint in "12345":
        cards = []
        for numero, data, semana, s, titulo in linhas:
            if s != sprint:
                continue
            cards.append('''          <article class="card-aula" data-aula="%s">
            <div class="card-cabecalho">
              <span class="card-badge">AULA %s</span>
              <p class="card-data">%s/2026 &middot; Semana %s</p>
            </div>
            <h3>%s</h3>
            <p class="card-resumo"><strong>Rastreador.</strong> %s</p>
            <div class="card-botoes">
%s
            </div>
          </article>''' % (numero, numero, data, semana, html.escape(titulo, quote=False),
                           html.escape(resumo.get(numero, ""), quote=False), _botoes(numero)))
        blocos.append('''      <section class="sprint-block" aria-labelledby="sprint-%s-titulo">
        <div class="sprint-header">
          <div class="sprint-titulo">
            <h2 id="sprint-%s-titulo">Sprint %s</h2>
            <p class="sprint-datas">%s</p>
          </div>
          <p class="sprint-entrega"><strong>Etapa:</strong> %s</p>
        </div>
        <div class="cards-grid">

%s

        </div>
      </section>''' % (sprint, sprint, sprint, REVIEWS[sprint], ETAPAS[sprint], "\n\n".join(cards)))
    return '''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Módulo 04 IN &middot; Solução para IoT &middot; Computação</title>
  <meta name="description" content="Portal do Módulo 04 IN: slides, materiais, referências e laboratórios Wokwi das doze instruções de Computação do Prof. Ovidio, organizadas em cinco sprints.">
  <!-- Gerado por tools/gerar_portal.py. Não editar à mão. -->
  <link rel="stylesheet" href="assets/css/inteli-brand.css">
  <link rel="stylesheet" href="assets/css/inteli-portal.css">
</head>
<body>
  <div class="portal">

    <header class="portal-header">
      <img class="portal-logo" src="assets/img/inteli-logo-positiva.svg" alt="Logo Inteli">
      <img class="portal-grafismo" src="assets/img/inteli-grafismo-graduacao.svg" alt="" aria-hidden="true">
      <div class="portal-identidade">
        <p class="portal-eyebrow">GRAD IN04 &middot; 2026-2B &middot; T24 &middot; Computação</p>
        <h1>Módulo 04 IN, Solução para IoT</h1>
        <dl class="portal-meta">
          <div><dt>Professor de Computação</dt><dd>Prof. Ovidio Lopes da Cruz Netto</dd></div>
          <div><dt>Parceiro do case</dt><dd>Cerradinho: rastreamento de equipamentos em manutenção externa</dd></div>
          <div><dt>Período</dt><dd>15/10/2026 a 17/12/2026</dd></div>
          <div><dt>Duração</dt><dd>10 semanas &middot; 5 sprints &middot; 12 Encontros de Instrução de Computação</dd></div>
        </dl>
      </div>
    </header>

    <main>

%s

    </main>

  </div>
</body>
</html>
''' % "\n\n".join(blocos)


if __name__ == "__main__":
    sys.stdout.write(renderizar())
