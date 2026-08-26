"""Wordmark Téra — rota 04 (arcos evoluídos do logo do cliente).

Gramática: todo glifo nasce de UM raio de arco (R) e UMA espessura (T).
x-height = 100 un. Baseline y=200, topo do x y=100, ascendente y=52.
Estados: tinta sólida (institucional) e vão de matéria viva (máscara + plasma).

Uso: python wordmark_arcos.py  ->  gera SVGs em ../brand/logo/ + preview.html
"""

import math
import os

# ---------- régua ----------
T = 20        # espessura monolinear (cliente ~15%; evoluímos p/ 20: firme sem grito)
R = 50 - T / 2  # raio de centerline: círculos ocupam o x-height inteiro
XH = 100      # x-height
BASE = 200    # baseline (y cresce pra baixo)
EQ = 150      # equador: centro vertical de todos os arcos do corpo
ASC = 52      # topo da ascendente do t
GAP = 20      # respiro entre glifos (kerning óptico p/ escala monumental)

INK = '#0A0908'      # Preto Subsolo
CAL = '#F2EFE9'      # Branco Cal
PLASMA = ['#F0529C', '#FF6B2C', '#35D06E', '#31C4FF']

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'brand', 'logo')


def pt(cx, cy, r, deg):
    """Ponto no círculo, ângulo matemático (0=leste, CCW) com y de tela."""
    a = math.radians(deg)
    return (cx + r * math.cos(a), cy - r * math.sin(a))


# Coletor de pontos: line() e arc() anotam por onde passaram, e take_bbox()
# devolve a caixa REAL do desenho. Sem isto o viewBox vira chute — a cauda do
# "e" do cliente desce abaixo da baseline e ficava cortada.
_PTS = []


def _mark(*pts):
    _PTS.extend(pts)


def take_bbox(weight):
    """Caixa do que foi desenhado desde a última chamada, já com a espessura."""
    global _PTS
    xs = [q[0] for q in _PTS]
    ys = [q[1] for q in _PTS]
    _PTS = []
    h = weight / 2
    return min(xs) - h, min(ys) - h, max(xs) + h, max(ys) + h


def arc(cx, cy, r, a0, a1):
    """Path de arco de a0 a a1 (graus, convenção matemática, y de tela).

    Com y invertido, ângulo crescente = anti-horário na tela = sweep 0.
    Círculo completo é dividido em dois semiarcos.
    """
    if abs(a1 - a0) >= 360:
        mid = a0 + (180 if a1 > a0 else -180)
        return arc(cx, cy, r, a0, mid) + ' ' + arc(cx, cy, r, mid, a1)
    x0, y0 = pt(cx, cy, r, a0)
    x1, y1 = pt(cx, cy, r, a1)
    large = 1 if abs(a1 - a0) > 180 else 0
    sweep = 0 if a1 > a0 else 1
    passo = 1 if a1 > a0 else -1
    _mark(*[pt(cx, cy, r, a0 + passo * i) for i in range(int(abs(a1 - a0)) + 1)], (x1, y1))
    return f'M {x0:.2f} {y0:.2f} A {r} {r} 0 {large} {sweep} {x1:.2f} {y1:.2f}'


def line(x0, y0, x1, y1):
    _mark((x0, y0), (x1, y1))
    return f'M {x0:.2f} {y0:.2f} L {x1:.2f} {y1:.2f}'


# ---------- glifos (retornam lista de paths + largura de avanço) ----------

def glyph_t(x):
    cx = x + R
    bar_end = x + 2 * R + 6
    paths = [
        line(x, ASC, x, EQ),                    # haste
        arc(cx, EQ, R, 180, 336),               # bacia: quarto+ de círculo
        line(x - T / 2, XH + T / 2, bar_end, XH + T / 2),  # barra no x-height
    ]
    return paths, bar_end + T / 2 - x


def glyph_e(x, accent=True, epsilon=False):
    """e geométrico legível (padrão): círculo + barra horizontal, mesma
    gramática da barra do t. epsilon=True gera a variante exótica do cliente."""
    cx = x + R + T / 2
    if epsilon:
        a_cusp = 330                            # cúspide/bico na altura da boca
        px_, py_ = pt(cx, EQ, R, a_cusp)
        r2 = 60
        c2x = px_ + r2 * math.cos(math.radians(170))
        c2y = py_ - r2 * math.sin(math.radians(170))
        a_start = math.degrees(math.atan2(c2y - py_, px_ - c2x))
        paths = [
            arc(cx, EQ, R, 52, a_cusp + 5),
            arc(c2x, c2y, r2, a_start + 6, a_start - 117),
        ]
    else:
        paths = [
            arc(cx, EQ, R, 0, 305),             # círculo aberto no baixo-direita
            line(cx - R, EQ, cx + R, EQ),       # barra no equador (irmã da barra do t)
        ]
    if accent:
        # acento: barra vertical flutuando (fiel ao gesto do cliente)
        ax = cx + 16
        paths.append(line(ax, ASC - 14, ax, ASC + 26))
    return paths, 2 * R + T


def glyph_r(x):
    cx = x + R
    paths = [
        line(x, BASE, x, EQ),                   # perna até a baseline
        arc(cx, EQ, R, 180, -45),               # ombro: um arco só
    ]
    return paths, R + pt(cx, EQ, R, -45)[0] - x - R + T / 2


def glyph_a(x):
    cx = x + R + T / 2
    stem_x = cx + R + T / 2
    paths = [
        arc(cx, EQ, R, 90, 450),                # círculo completo
        line(stem_x, XH, stem_x, BASE),         # haste tangente à direita
    ]
    return paths, 2 * R + T + T


def build_wordmark(epsilon=False):
    """Monta t-é-r-a; retorna paths e caixa total. Kerning óptico por par.

    epsilon=True devolve o desenho como o cliente mandou, com o "e" invertido —
    arco aberto mais bico, sem a barra do equador."""
    paths = []
    x = T / 2 + 2
    pair_gap = {0: 16, 1: 20, 2: 20}            # t-é fecha (barra + curva geram ar)
    glyphs = (glyph_t, lambda gx: glyph_e(gx, epsilon=epsilon), glyph_r, glyph_a)
    for i, g in enumerate(glyphs):
        p, adv = g(x)
        paths += p
        x += adv + pair_gap.get(i, GAP)
    width = x - 30 + T / 2 + 2
    return paths, width


# ---------- caixa alta ----------
#
# Grotesca suica, nao geometrica: o pedido foi "mais atual, limpa, suica", e a
# referencia e Helvetica/Univers. Tres coisas mudaram em relacao a primeira
# tentativa, e todas tinham o mesmo defeito de origem — desenhar versal com a
# gramatica da minuscula.
#
# · O bojo do R terminava a 68% da altura da versal. Sobrava tao pouco para a
#   perna que ela virava uma estocada curta e ingreme. Numa grotesca o bojo
#   fecha por volta de 58-60%, e a perna sai dali num angulo de ~40 graus.
# · O A era arcado. Arco e o gesto que rege a MINUSCULA desta marca; em versal
#   suica o A e triangular. Fica de apice chato — o bico puro nao segura areia
#   nenhuma, e a chapa do apice tambem e detalhe corrente em grotesca.
# · O traco era 34 num corpo de 144, razao 0,24. Helvetica Bold fica em ~0,20.
#   Estava mais pesado que negrito, e pesado demais le como desenho, nao como
#   tipo. Em 30 a razao cai para 0,21.

TB = 30        # espessura da versal (0,21 do corpo — negrito de grotesca)
CAP = 56       # topo da versal (a baseline segue em BASE=200)
MIDC = (CAP + BASE) / 2
CGAP = 26      # respiro entre versais
APEX = CAP + TB / 2


def pe_na_base(sx, sy, ex, base=BASE):
    """Onde a diagonal precisa terminar para que a PONTA encoste na baseline.

    Ponta reta (butt) e cortada perpendicular ao traco: o canto de baixo desce
    (TB/2)·|dx|/L alem do ponto final. Sem descontar isso, a perna do R e os pes
    do A furam a baseline."""
    ey = base
    for _ in range(8):                        # ponto fixo: converge em 3 voltas
        dx, dy = ex - sx, ey - sy
        L = math.hypot(dx, dy) or 1
        ey = base - (TB / 2) * abs(dx) / L
    return ey


def em_x(sx, sy, ex, ey, y):
    """x da diagonal (sx,sy)-(ex,ey) na altura y — para encaixar a travessa."""
    return sx + (ex - sx) * (y - sy) / (ey - sy)


def cap_t(x):
    w = 106
    return [
        line(x, CAP + TB / 2, x + w, CAP + TB / 2),      # travessao
        line(x + w / 2, CAP, x + w / 2, BASE),           # haste centrada
    ], w


def cap_e(x, accent=True):
    w = 96
    paths = [
        line(x + TB / 2, CAP, x + TB / 2, BASE),         # espinha
        line(x, CAP + TB / 2, x + w, CAP + TB / 2),      # braco
        line(x, MIDC, x + w * 0.88, MIDC),               # barra do meio, mais curta
        line(x, BASE - TB / 2, x + w, BASE - TB / 2),    # pe
    ]
    if accent:
        # a barra vertical solta continua sendo o acento: e a assinatura do
        # gesto do cliente, e some se virar acento agudo convencional
        paths.append(line(x + w / 2, 2, x + w / 2, 38))
    return paths, w


def cap_r(x):
    w = 100
    rb = 28                                              # bojo fecha a ~60% do corpo
    cy = CAP + TB / 2 + rb
    sx, sy = x + TB / 2, cy + rb                         # a perna sai do fecho do bojo
    ex = x + w - TB / 2
    return [
        line(x + TB / 2, CAP, x + TB / 2, BASE),         # espinha
        arc(x + TB / 2, cy, rb, 90, -90),                # bojo: meio circulo a direita
        line(sx, sy, ex, pe_na_base(sx, sy, ex)),        # perna reta, ~41 graus
    ], w


def cap_a(x):
    w = 112
    cx = x + w / 2
    lx, rx = x + TB / 2, x + w - TB / 2
    ly = pe_na_base(cx, APEX, lx)
    ry = pe_na_base(cx, APEX, rx)
    trav = 172                                           # travessa baixa, como em grotesca
    return [
        line(cx - TB * 0.52, APEX, cx + TB * 0.52, APEX),   # apice chato
        line(cx, APEX, lx, ly),                             # diagonal esquerda
        line(cx, APEX, rx, ry),                             # diagonal direita
        line(em_x(cx, APEX, lx, ly, trav), trav,
             em_x(cx, APEX, rx, ry, trav), trav),           # travessa entre as diagonais
    ], w


def build_caps():
    """TERA em versal. Retorna paths e largura."""
    paths = []
    x = 2
    for g in (cap_t, cap_e, cap_r, cap_a):
        p, adv = g(x)
        paths += p
        x += adv + CGAP
    return paths, x - CGAP + 2


def stroke_group(paths, color, weight=T):
    d = ' '.join(paths)
    return (f'<path d="{d}" fill="none" stroke="{color}" '
            f'stroke-width="{weight}" stroke-linecap="butt"/>')


def svg_shape(paths, caixa, weight=T, color=INK, pad=40):
    """SVG cru de uma forma, do jeito que o lab de areia lê: um <path> só, com a
    espessura no atributo e o viewBox na caixa medida mais a área de proteção."""
    x0, y0, x1, y1 = caixa
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="{x0 - pad:.2f} {y0 - pad:.2f} '
            f'{x1 - x0 + 2 * pad:.2f} {y1 - y0 + 2 * pad:.2f}">'
            f'<g>{stroke_group(paths, color, weight)}</g></svg>')


# ---------- SVGs ----------

def svg_ink(paths, w, h, color, bg=None, pad=40):
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="{-pad} {ASC - T / 2 - pad} {w + 2 * pad} {h + 2 * pad}">'
            f'{bg_rect}<g>{stroke_group(paths, color)}</g></svg>')


def svg_materia(paths, w, h, pad=40):
    """Estado matéria: as letras são vãos por onde o plasma vivo passa."""
    vb = f'{-pad} {ASC - T / 2 - pad} {w + 2 * pad} {h + 2 * pad}'
    stops = ''.join(
        f'<stop offset="{i / (len(PLASMA) - 1):.2f}" stop-color="{c}"/>'
        for i, c in enumerate(PLASMA))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">
  <defs>
    <linearGradient id="plasma" x1="0%" y1="0%" x2="100%" y2="22%">
      {stops}
      <animateTransform attributeName="gradientTransform" type="translate"
        values="0 0; -0.18 0; 0 0" dur="9s" repeatCount="indefinite"/>
    </linearGradient>
    <filter id="fluxo">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.028" numOctaves="2" seed="7">
        <animate attributeName="baseFrequency" dur="14s" repeatCount="indefinite"
          values="0.012 0.028; 0.016 0.02; 0.012 0.028"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" scale="34"/>
    </filter>
    <mask id="vao">
      <rect x="{-pad}" y="{ASC - T / 2 - pad}" width="{w + 2 * pad}" height="{h + 2 * pad}" fill="black"/>
      {stroke_group(paths, 'white')}
    </mask>
  </defs>
  <rect x="{-pad}" y="{ASC - T / 2 - pad}" width="{w + 2 * pad}" height="{h + 2 * pad}" fill="{INK}"/>
  <g mask="url(#vao)">
    <rect x="{-pad}" y="{ASC - T / 2 - pad}" width="{w + 2 * pad}" height="{h + 2 * pad}" fill="#120e14"/>
    <g filter="url(#fluxo)">
      <rect x="{-pad * 2}" y="{ASC - T / 2 - pad * 2}" width="{w + 4 * pad}" height="{h + 4 * pad}"
        fill="url(#plasma)" opacity="0.95"/>
    </g>
  </g>
</svg>'''


def svg_monogram(color, bg=None, pad=36):
    paths, wt = glyph_t(T / 2 + 2)
    h = BASE - ASC + T
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="{-pad} {ASC - T / 2 - pad} {wt + T + 2 * pad} {h + 2 * pad}">'
            f'{bg_rect}<g>{stroke_group(paths, color)}</g></svg>')


MONO_FACE = ("<style>@font-face{font-family:'Space Mono';"
             "src:url('../../case/fonts/SpaceMono-Bold.ttf')}</style>")


def svg_lockup(paths, w, h, color, bg=None, pad=46):
    """Lockup com descritor: a categoria assina junto (decisão D3)."""
    desc_y = BASE + T / 2 + 46
    total_h = desc_y - (ASC - T / 2) + 30
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="{-pad} {ASC - T / 2 - pad} {w + 2 * pad} {total_h + 2 * pad}">'
            f'{MONO_FACE}{bg_rect}<g>{stroke_group(paths, color)}</g>'
            f'<text x="2" y="{desc_y}" textLength="{w - 4}" lengthAdjust="spacing" '
            f'font-family="Space Mono, monospace" font-weight="700" font-size="15.5" '
            f'fill="{color}">ESPETÁCULOS MULTIDIMENSIONAIS</text></svg>')


def svg_coassinatura(paths, w, h, color, endorse, bg=None, pad=46):
    """Coassinatura endossada: Téra protagonista, Mata como origem (D6)."""
    desc_y = BASE + T / 2 + 44
    total_h = desc_y - (ASC - T / 2) + 26
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="{-pad} {ASC - T / 2 - pad} {w + 2 * pad} {total_h + 2 * pad}">'
            f'{MONO_FACE}{bg_rect}<g>{stroke_group(paths, color)}</g>'
            f'<text x="{w - 2}" y="{desc_y}" text-anchor="end" '
            f'font-family="Space Mono, monospace" font-size="14" letter-spacing="1.5" '
            f'fill="{color}" opacity="0.72">{endorse}</text></svg>')


def svg_clearspace(paths, w, h, pad_units=1.0):
    """Área de proteção: unidade = R (o raio do arco do sistema)."""
    u = R * pad_units
    x0, y0 = -u, ASC - T / 2 - u
    ww, hh = w + 2 * u, (BASE + T / 2 + 30) - (ASC - T / 2) + 2 * u
    guides = (
        f'<rect x="{x0}" y="{y0}" width="{ww}" height="{hh}" fill="none" '
        f'stroke="#31C4FF" stroke-width="1.4" stroke-dasharray="7 6"/>'
        + ''.join(
            f'<rect x="{gx}" y="{gy}" width="{u}" height="{u}" fill="none" '
            f'stroke="#31C4FF" stroke-width="1"/>'
            for gx, gy in [(x0, y0), (x0 + ww - u, y0 + hh - u)])
        + f'<text x="{x0 + u / 2}" y="{y0 + u / 2 + 5}" text-anchor="middle" '
          f'font-family="Space Mono, monospace" font-size="13" fill="#31C4FF">R</text>')
    m = 30
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="{x0 - m} {y0 - m} {ww + 2 * m} {hh + 2 * m}">'
            f'{MONO_FACE}<rect x="{x0 - m}" y="{y0 - m}" width="{ww + 2 * m}" '
            f'height="{hh + 2 * m}" fill="{CAL}"/>'
            f'<g>{stroke_group(paths, INK)}</g>{guides}</svg>')


def svg_minsizes(paths, w, h):
    """Régua de tamanhos mínimos: digital 90px de largura, impresso 25mm."""
    rows = [(420, 'assinatura padrão'), (240, 'reduções seguras'),
            (140, 'limite digital · 90 px de largura'), (90, 'abaixo disto: usar monograma t')]
    total_h = sum(r[0] * (BASE - ASC + T + 60) / w for r in rows) + 120
    parts = [f'<rect width="100%" height="100%" fill="{CAL}"/>']
    y = 30
    for width_px, label in rows:
        s = width_px / w
        gh = (BASE - ASC + T) * s
        parts.append(
            f'<g transform="translate(40 {y + T / 2 * s - ASC * s}) scale({s})">'
            f'{stroke_group(paths, INK)}</g>'
            f'<text x="{width_px + 62}" y="{y + gh / 2 + 5}" '
            f'font-family="Space Mono, monospace" font-size="13" fill="#8d8a84">{label}</text>')
        y += gh + 42
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 {y + 20}">'
            f'{MONO_FACE}{"".join(parts)}</svg>')


def main():
    os.makedirs(OUT, exist_ok=True)
    paths, w = build_wordmark()
    h = BASE - ASC + T

    take_bbox(0)                                   # descarta o traçado já colhido
    eps_paths, _ = build_wordmark(epsilon=True)
    eps_box = take_bbox(T)
    cap_paths, _ = build_caps()
    cap_box = take_bbox(TB)

    files = {
        'tera_shape_cliente.svg': svg_shape(eps_paths, eps_box),
        'tera_shape_caps.svg': svg_shape(cap_paths, cap_box, weight=TB),
        'tera_ink_subsolo.svg': svg_ink(paths, w, h, INK),
        'tera_ink_cal_sobre_subsolo.svg': svg_ink(paths, w, h, CAL, bg=INK),
        'tera_materia.svg': svg_materia(paths, w, h),
        'tera_monogram_t_ink.svg': svg_monogram(INK),
        'tera_monogram_t_cal.svg': svg_monogram(CAL, bg=INK),
        'tera_lockup_descritor.svg': svg_lockup(paths, w, h, CAL, bg=INK),
        'tera_lockup_descritor_ink.svg': svg_lockup(paths, w, h, INK),
        'tera_coassinatura_mata.svg': svg_coassinatura(paths, w, h, CAL, 'por Mata São Paulo', bg=INK),
        'tera_clearspace.svg': svg_clearspace(paths, w, h),
        'tera_minsizes.svg': svg_minsizes(paths, w, h),
    }
    for name, svg in files.items():
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
            f.write(svg)
        print('->', name)

    cards = ''.join(
        f'<figure class="{"dark" if ("cal" in n or "materia" in n) else ""}">'
        f'<img src="{n}"><figcaption>{n}</figcaption></figure>'
        for n in files)
    preview = f'''<!doctype html><meta charset="utf-8">
<style>
 body{{background:#d8d5cf;font:12px monospace;margin:0;padding:24px}}
 figure{{background:{CAL};margin:0 0 18px;padding:34px;border:1px solid #bbb}}
 figure.dark{{background:{INK}}}
 img{{width:100%;display:block}}
 figcaption{{margin-top:10px;color:#888}}
</style>{cards}'''
    with open(os.path.join(OUT, 'preview.html'), 'w', encoding='utf-8') as f:
        f.write(preview)
    print('-> preview.html')


if __name__ == '__main__':
    main()
