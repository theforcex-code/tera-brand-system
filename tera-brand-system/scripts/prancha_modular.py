# -*- coding: utf-8 -*-
"""
Monta a prancha das dez construções modulares de téra, estáticas e animadas.

Os SVGs entram inline (a página é auto-contida e vai para Artifact, que
bloqueia requisição externa). A animação de cada variante sai da sua própria
lógica de matéria; por cima de todas corre o mesmo preenchimento de luz, que
é o sistema que o cliente aprovou: matéria é a moldura, luz é o que preenche.

    python scripts/prancha_modular.py
"""
import io
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SVGDIR = os.path.join(HERE, "..", "brand", "logo", "modular")
OUT = os.path.join(HERE, "..", "brand", "logo", "modular", "prancha.html")

MARKS = [
    ("01-chapa", "Chapa", "Cada peça é uma chapa; a junta entre elas fica à vista.",
     "As chapas assentam uma a uma, de baixo para cima.", True),
    ("02-grade", "Grade", "A malha de 1×1 da chapa gradeada corre por cima da palavra.",
     "A malha acende por varredura, depois some e deixa a letra.", False),
    ("03-emenda", "Emenda", "A emenda dos gabinetes de LED: faixas deslocadas.",
     "As três faixas deslizam até o alinhamento e voltam a sair de registro.", True),
    ("04-vao", "Fresta", "Uma faixa horizontal aberta atravessa a palavra inteira.",
     "A fresta abre, a luz vaza por ela e a palavra torna a fechar.", True),
    ("05-pilar", "Pilar", "Verticais em peso cheio, horizontais reduzidas a fio.",
     "Os pilares sobem primeiro; as travessas chegam depois.", True),
    ("06-aresta", "Aresta", "Só as arestas: a estrutura antes do revestimento.",
     "O contorno se desenha e a matéria preenche por dentro.", False),
    ("07-sobreposicao", "Sobreposição", "As letras avançam umas sobre as outras; a interseção vira vazio.",
     "As letras se afastam até a leitura limpa e voltam a se encaixar.", True),
    ("08-recorte", "Recorte", "A palavra é o que sobra do bloco depois do corte.",
     "O bloco varre o quadro e deixa a palavra recortada nele.", True),
    ("09-escavado", "Escavado", "A letra é um vazio com degrau — o subsolo escavado.",
     "O degrau aprofunda, como a escavação que abriu o vão.", False),
    ("10-modulo", "Módulo", "Um módulo só, 2×2, repetido. Nada além dele constrói a palavra.",
     "Os módulos caem em sequência até completar a palavra.", True),
]


def load(slug):
    p = os.path.join(SVGDIR, slug + ".svg")
    s = io.open(p, encoding="utf-8").read().strip()
    s = re.sub(r"<title>.*?</title>", "", s, flags=re.S)
    s = s.replace("<svg ", '<svg class="mk" preserveAspectRatio="xMidYMid meet" ', 1)
    return s


def card(i, slug, name, mech, motion, small_ok):
    badge = ("" if small_ok else
             '<span class="warn">não sobrevive a 150 px — escala grande</span>')
    return '''<figure class="card" data-v="{slug}">
  <div class="plate">{svg}</div>
  <figcaption>
    <div class="meta"><span class="code">{code}</span>{badge}</div>
    <h3>{name}</h3>
    <p class="mech">{mech}</p>
    <p class="mo"><span>motion</span>{motion}</p>
  </figcaption>
</figure>'''.format(slug=slug, svg=load(slug), code=slug[:2],
                    name=name, mech=mech, motion=motion, badge=badge)


def strip_item(slug, name):
    return ('<div class="chip"><div class="chipart">%s</div>'
            '<span>%s</span></div>' % (load(slug), name))


CSS = """
:root{
  --void:#000;--surface:#0B0C0D;--raised:#131517;--edge:#1F2225;--edge-hi:#34383C;
  --ink:#EDEFF1;--muted:#767C81;--dim:#43484C;--pure:#FFF;
  --f-display:"Archivo","Helvetica Neue",Arial,sans-serif;
  --f-body:"Newsreader",Georgia,serif;
  --f-mono:"DM Mono",ui-monospace,Menlo,monospace;
  --gut:clamp(20px,4vw,56px);
}
*{box-sizing:border-box}
body{margin:0;background:var(--void);color:var(--ink);font-family:var(--f-body);
  font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:var(--gut)}

.masthead{display:flex;flex-wrap:wrap;gap:30px 48px;align-items:flex-end;
  justify-content:space-between;padding-bottom:26px;border-bottom:1px solid var(--edge)}
.lede{max-width:40ch}
.lede h1{font-family:var(--f-display);font-variation-settings:"wdth" 118,"wght" 700;
  font-weight:700;font-size:clamp(32px,5.6vw,58px);line-height:.95;letter-spacing:-.02em;
  margin:0 0 14px;text-wrap:balance;color:var(--pure)}
.lede h1 em{font-style:normal;color:var(--dim)}
.lede p{margin:0;color:var(--muted);font-size:16.5px}
.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px 38px;
  margin:0;font-family:var(--f-mono)}
.facts dt{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);margin:0 0 3px}
.facts dd{margin:0;font-size:12.5px;color:var(--ink)}

.controls{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;gap:10px;
  align-items:center;padding:14px 0 16px;background:linear-gradient(var(--void) 68%,rgba(0,0,0,0))}
.controls .hint{font-family:var(--f-mono);font-size:10px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--dim);margin-right:6px}
.tgl{font-family:var(--f-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);background:var(--surface);border:1px solid var(--edge);border-radius:0;
  padding:8px 14px;cursor:pointer;transition:color .18s,border-color .18s,background .18s}
.tgl:hover{color:var(--ink);border-color:var(--edge-hi)}
.tgl:focus-visible{outline:2px solid var(--pure);outline-offset:2px}
.tgl[aria-pressed="true"]{color:var(--void);background:var(--pure);border-color:var(--pure)}

.list{display:flex;flex-direction:column;gap:1px;background:var(--edge);
  border:1px solid var(--edge);margin-top:6px}
.card{margin:0;background:var(--surface);display:grid;
  grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);align-items:center;
  transition:background .2s}
.card:hover{background:var(--raised)}
@media(max-width:820px){.card{grid-template-columns:minmax(0,1fr)}}
.plate{padding:26px 30px;overflow:hidden}
.mk{width:100%;height:auto;display:block}
figcaption{padding:22px 30px;display:flex;flex-direction:column;gap:6px;
  border-left:1px solid var(--edge)}
@media(max-width:820px){figcaption{border-left:none;border-top:1px solid var(--edge)}}
.meta{display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  font-family:var(--f-mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase}
.code{color:var(--muted)}
.warn{color:var(--dim);text-transform:none;letter-spacing:.04em;font-size:10.5px;text-align:right}
figcaption h3{font-family:var(--f-display);font-variation-settings:"wdth" 110,"wght" 600;
  font-weight:600;font-size:21px;margin:0;color:var(--pure)}
.mech{margin:0;font-size:15px;line-height:1.45;color:var(--muted);max-width:42ch}
.mo{margin:4px 0 0;font-family:var(--f-mono);font-size:11.5px;line-height:1.5;
  color:var(--dim);max-width:44ch}
.mo span{display:block;font-size:9px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--edge-hi);margin-bottom:3px}
.card:hover .mo{color:var(--muted)}

/* ---------- redução ---------- */
.strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1px;
  background:var(--edge);border:1px solid var(--edge);margin-top:6px}
.chip{background:var(--surface);padding:20px 16px;display:flex;flex-direction:column;
  align-items:center;gap:11px}
.chipart{width:150px}
.chipart svg{width:100%;height:auto;display:block}
.chip span{font-family:var(--f-mono);font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--dim)}

.shead{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 18px;
  padding-bottom:13px;margin-top:44px;border-bottom:1px solid var(--edge)}
.shead h2{font-family:var(--f-display);font-variation-settings:"wdth" 106,"wght" 600;
  font-weight:600;font-size:14px;letter-spacing:.14em;text-transform:uppercase;margin:0}
.shead span{font-family:var(--f-mono);font-size:11.5px;color:var(--muted)}

.note{margin-top:50px;padding-top:28px;border-top:1px solid var(--edge);
  display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:28px 42px}
.note h4{font-family:var(--f-mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--dim);margin:0 0 9px;font-weight:400}
.note p{margin:0 0 11px;font-size:15.5px;color:var(--muted);max-width:46ch}
.note p strong{color:var(--ink);font-weight:600}
.note p em{color:var(--ink);font-style:italic}
.colophon{margin-top:44px;padding-top:18px;border-top:1px solid var(--edge);display:flex;
  flex-wrap:wrap;gap:8px 26px;justify-content:space-between;font-family:var(--f-mono);
  font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}

/* =======================================================================
   MOTION — a luz preenche a matéria. Só roda quando body.play está ligado,
   e some inteiro sob prefers-reduced-motion.
   ======================================================================= */
.mk g{transform-box:fill-box}
.mk g rect,.mk g polygon,.mk g path{transform-box:fill-box;transform-origin:center}

@media (prefers-reduced-motion:no-preference){
  /* o sistema: a luz sobe e preenche, comum a todas */
  body.play .card .mk g{animation:fill 5.2s cubic-bezier(.16,1,.3,1) infinite}
  @keyframes fill{
    0%{clip-path:inset(100% 0 0 0)}
    26%,74%{clip-path:inset(0 0 0 0)}
    100%{clip-path:inset(0 0 100% 0)}
  }

  /* 01 chapa — as peças assentam uma a uma */
  body.play [data-v="01-chapa"] .mk g rect{animation:drop 5.2s cubic-bezier(.16,1,.3,1) infinite}
  @keyframes drop{0%,4%{transform:translateY(14px);opacity:0}16%,100%{transform:none;opacity:1}}

  /* 03 emenda — as faixas entram em registro e saem de novo */
  body.play [data-v="03-emenda"] .mk g rect{animation:slide 5.2s ease-in-out infinite}
  @keyframes slide{0%,100%{transform:translateX(0)}40%,60%{transform:translateX(-6px)}}

  /* 04 fresta — a fenda abre e fecha */
  body.play [data-v="04-vao"] .mk g rect{animation:gap 5.2s cubic-bezier(.5,0,.2,1) infinite}
  @keyframes gap{0%,100%{transform:translateY(0)}44%,56%{transform:translateY(-3px)}}

  /* 05 pilar — os verticais sobem antes das travessas */
  body.play [data-v="05-pilar"] .mk g rect{animation:rise 5.2s cubic-bezier(.16,1,.3,1) infinite;
    transform-origin:bottom}
  @keyframes rise{0%,6%{transform:scaleY(.04)}22%,100%{transform:scaleY(1)}}

  /* 07 sobreposição — as letras se soltam e voltam a encaixar */
  body.play [data-v="07-sobreposicao"] .mk g rect{animation:spread 5.2s ease-in-out infinite}
  @keyframes spread{0%,100%{transform:translateX(0)}45%,55%{transform:translateX(9px)}}

  /* 10 módulo — os módulos caem em sequência */
  body.play [data-v="10-modulo"] .mk g rect{animation:pop 5.2s cubic-bezier(.16,1,.3,1) infinite}
  @keyframes pop{0%,3%{transform:scale(.1);opacity:0}18%,100%{transform:scale(1);opacity:1}}

  /* 02 grade — a malha varre e se apaga, deixando a letra */
  body.play [data-v="02-grade"] .mk g path{animation:mesh 5.2s ease-in-out infinite}
  @keyframes mesh{0%,100%{opacity:1}46%,58%{opacity:.12}}

  /* 06 aresta — a matéria preenche por dentro do contorno */
  body.play [data-v="06-aresta"] .mk g rect:nth-child(even){animation:infill 5.2s ease-in-out infinite}
  @keyframes infill{0%,100%{transform:scale(1)}46%,58%{transform:scale(.06)}}

  /* 08 recorte — o bloco varre o quadro e deixa a palavra nele */
  body.play [data-v="08-recorte"] .mk g rect:first-child{
    animation:sweep 5.2s cubic-bezier(.16,1,.3,1) infinite;transform-origin:left}
  @keyframes sweep{0%,4%{transform:scaleX(0)}20%,100%{transform:scaleX(1)}}

  /* 09 escavado — o degrau aprofunda, como a escavação */
  body.play [data-v="09-escavado"] .mk g rect:nth-child(n+18){animation:deepen 5.2s ease-in-out infinite}
  @keyframes deepen{0%,100%{transform:scale(1)}46%,60%{transform:scale(.78)}}

  /* escalonamento: cada peça entra um pouco depois da anterior */
  .mk g rect:nth-child(3n+1){animation-delay:0ms}
  .mk g rect:nth-child(3n+2){animation-delay:70ms}
  .mk g rect:nth-child(3n+3){animation-delay:140ms}
  .mk g rect:nth-child(n+10){animation-delay:210ms}
  .mk g rect:nth-child(n+20){animation-delay:300ms}
  .mk g rect:nth-child(n+34){animation-delay:390ms}
}
"""

JS = """
var play=document.getElementById('t-play');
play.addEventListener('click',function(){
  var on=play.getAttribute('aria-pressed')==='true';
  play.setAttribute('aria-pressed',String(!on));
  document.body.classList.toggle('play',!on);
});
var neg=document.getElementById('t-neg');
neg.addEventListener('click',function(){
  var on=neg.getAttribute('aria-pressed')==='true';
  neg.setAttribute('aria-pressed',String(!on));
  document.body.classList.toggle('neg',!on);
});
"""


def build():
    cards = "\n".join(card(i, *m) for i, m in enumerate(MARKS))
    strip = "\n".join(strip_item(m[0], m[1]) for m in MARKS)
    html = '''<title>téra · Matriz Tipográfica</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..700&family=DM+Mono:wght@300;400;500&family=Newsreader:opsz,wght@6..72,300..600&display=swap">
<style>%s
body.neg .plate{filter:invert(1)}
body.neg .chipart{filter:invert(1)}
</style>

<div class="wrap">
  <header class="masthead">
    <div class="lede">
      <h1>A sala vira<br><em>a</em> palavra</h1>
      <p>Dez construções de <em>téra</em> tiradas da arquitetura da própria sala: o módulo da chapa gradeada, a emenda dos gabinetes, os pilares aparentes, o vão escavado. Um esqueleto só, dez lógicas de matéria.</p>
    </div>
    <dl class="facts">
      <div><dt>Origem</dt><dd>feedback 27.08</dd></div>
      <div><dt>Módulo</dt><dd>haste 2u · contraforma 3u</dd></div>
      <div><dt>Formato</dt><dd>SVG paramétrico</dd></div>
      <div><dt>Território</dt><dd>luz preenche matéria</dd></div>
    </dl>
  </header>

  <div class="controls">
    <span class="hint">Ver</span>
    <button class="tgl" id="t-play" type="button" aria-pressed="false">Animar</button>
    <button class="tgl" id="t-neg" type="button" aria-pressed="false">Negativo</button>
  </div>

  <div class="list">
%s
  </div>

  <div class="shead">
    <h2>Teste de redução</h2>
    <span>150 px de largura — o pior caso real de aplicação</span>
  </div>
  <div class="strip">
%s
  </div>

  <div class="note">
    <div>
      <h4>O que muda em relação à entrega anterior</h4>
      <p>A exploração passada era de <strong>símbolo</strong>. Esta é da <strong>palavra</strong> — que é o que o feedback pediu: "sentimos falta de uma exploração mais proprietária da grafia de Téra".</p>
      <p>O esqueleto é o mesmo nas dez. A base é convencional de propósito, como o feedback autoriza; a personalidade está na lógica de matéria aplicada sobre ela. Como o esqueleto nunca muda, <strong>nenhuma variante pode deixar de ser lida</strong>.</p>
    </div>
    <div>
      <h4>Duas correções que só apareceram ao olhar</h4>
      <p>O <em>a</em> geométrico de um andar vira um retângulo vazado e a palavra passa a ler <strong>téro</strong>. Trocado por um <em>a</em> de dois andares, com o braço superior aberto.</p>
      <p>O vão de 2×2 por letra cortava as hastes — todas têm 2u — e transformava o <em>a</em> num <strong>3</strong>. Virou fresta horizontal, que atravessa a palavra sem quebrar nenhuma letra.</p>
    </div>
    <div>
      <h4>Escala</h4>
      <p>Sete das dez passam intactas a 150 px. <strong>02 Grade</strong> perde a malha, <strong>06 Aresta</strong> colapsa em ruído e <strong>09 Escavado</strong> perde o degrau.</p>
      <p>As três seguem válidas em escala grande — fachada, OOH, os painéis de LED. Não servem para favicon nem para bordado.</p>
    </div>
    <div>
      <h4>Sobre o movimento</h4>
      <p>Por cima de todas corre o mesmo preenchimento: a luz sobe e ocupa a matéria. É o sistema que vocês apontaram como mais potente — <em>matéria é a moldura, luz é o que preenche</em>.</p>
      <p>Cada variante tem, além disso, um comportamento próprio, derivado da sua própria lógica construtiva. Tudo respeita <code>prefers-reduced-motion</code>.</p>
    </div>
  </div>

  <footer class="colophon">
    <span>Téra · Espetáculos Multidimensionais</span>
    <span>The Force · 2026</span>
  </footer>
</div>

<script>%s</script>
''' % (CSS, cards, strip, JS)
    p = os.path.normpath(OUT)
    io.open(p, "w", encoding="utf-8").write(html)
    print("prancha: %s (%d KB)" % (p, len(html) // 1024))


if __name__ == "__main__":
    build()
