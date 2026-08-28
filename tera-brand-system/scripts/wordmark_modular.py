# -*- coding: utf-8 -*-
"""
téra — wordmark modular derivado da arquitetura da sala.

Resposta ao feedback de 27.08: "arquitetura como matriz tipográfica".
Um esqueleto único e legível (a base convencional que o cliente pediu) e dez
lógicas de matéria aplicadas sobre ele (a personalidade). A palavra nunca muda
de esqueleto, então nenhuma variante pode deixar de ser lida.

Tudo em unidades de grade `u` — o módulo de 1×1 m da chapa gradeada. Nenhuma
medida é arbitrária: haste = 2u, contraforma = 3u, x-height = 12u, ascendente
= 15u, espaço entre letras = 3u.

    python scripts/wordmark_modular.py

Escreve brand/logo/modular/NN-nome.svg
"""
import io
import os

U = 24.0                     # px por módulo
STROKE = 2                   # haste, em módulos
COUNTER = 3                  # contraforma
XTOP, BASE = 3, 15           # x-height ocupa 3..15
ASC = 0                      # topo do ascendente do t
GAP = 3                      # entre letras
PAD = 4                      # respiro em volta

INK, VOID = "#FFFFFF", "#0A0A0A"

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "brand", "logo", "modular")


# --------------------------------------------------------------------------
# esqueleto: cada glifo é uma lista de retângulos (x, y, w, h) em módulos
# --------------------------------------------------------------------------

def glyphs():
    t = dict(w=7, rects=[
        (2, ASC, STROKE, BASE - ASC),        # haste, sobe acima da x-height
        (0, XTOP, 6, STROKE),                # travessa
        (4, BASE - 2, 3, STROKE),            # pé, vira à direita
    ])
    e = dict(w=8, rects=[
        (0, XTOP, 8, STROKE),                # topo
        (0, XTOP, STROKE, BASE - XTOP),      # lado esquerdo
        (0, XTOP + 5, 8, STROKE),            # barra do meio
        (0, BASE - 2, 8, STROKE),            # base
        (6, XTOP, STROKE, 5),                # fecha só o topo à direita
    ])
    r = dict(w=7, rects=[
        (0, XTOP, STROKE, BASE - XTOP),      # haste
        (0, XTOP, 7, STROKE),                # ombro
        (5, XTOP, STROKE, COUNTER),          # a descida curta do ombro
    ])
    # 'a' de dois andares. Um 'a' geométrico de um andar vira um retângulo
    # vazado e a palavra passa a ler "téro" — testado, e é exatamente a falha
    # que o feedback proíbe. O braço superior aberto resolve sem ambiguidade.
    a = dict(w=9, rects=[
        (1, XTOP, 8, STROKE),                # braço superior, recuado à esquerda
        (7, XTOP, STROKE, BASE - XTOP),      # haste direita, altura inteira
        (0, XTOP + 5, 8, STROKE),            # barra do meio
        (0, XTOP + 5, STROKE, BASE - XTOP - 5),  # lado esquerdo, só embaixo
        (0, BASE - 2, 8, STROKE),            # base do bowl
    ])
    return {"t": t, "e": e, "r": r, "a": a}


def accent_bar(x0):
    """Acento agudo: barra inclinada. Um quadrado seria ambíguo, e a
    legibilidade é o requisito não-negociável do feedback."""
    return [(x0 + 3.2, -2.6), (x0 + 5.4, -2.6), (x0 + 4.2, 0.4), (x0 + 2.0, 0.4)]


def layout():
    """Devolve (rects, accent_poly, largura). rects já em coordenadas da palavra."""
    G = glyphs()
    out, x = [], 0.0
    acc = None
    for i, ch in enumerate("tera"):
        g = G[ch]
        for (rx, ry, rw, rh) in g["rects"]:
            out.append((x + rx, float(ry), float(rw), float(rh), i))
        if ch == "e":
            acc = accent_bar(x)
        x += g["w"] + GAP
    return out, acc, x - GAP


# --------------------------------------------------------------------------
# helpers de svg
# --------------------------------------------------------------------------

def rect(x, y, w, h, fill=INK, extra=""):
    return ('<rect x="%.3f" y="%.3f" width="%.3f" height="%.3f" fill="%s"%s/>'
            % (x * U, y * U, w * U, h * U, fill, extra))


def poly(pts, fill=INK, extra=""):
    d = " ".join("%.3f,%.3f" % (px * U, py * U) for px, py in pts)
    return '<polygon points="%s" fill="%s"%s/>' % (d, fill, extra)


def wrap(body, w, h, ox, oy, title):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.2f %.2f" '
        'role="img" aria-label="téra">'
        '<title>%s</title>'
        '<rect x="0" y="0" width="%.2f" height="%.2f" fill="%s"/>'
        '<g transform="translate(%.3f,%.3f)">%s</g></svg>'
    ) % (w, h, title, w, h, VOID, ox, oy, body)


def canvas(rects, acc):
    """Caixa que cobre tudo, incluindo o acento."""
    top = min([r[1] for r in rects] + ([p[1] for p in acc] if acc else []))
    bot = max(r[1] + r[3] for r in rects)
    right = max(r[0] + r[2] for r in rects)
    w = (right + PAD * 2) * U
    h = (bot - top + PAD * 2) * U
    return w, h, PAD * U, (PAD - top) * U


# --------------------------------------------------------------------------
# as dez lógicas de matéria
# --------------------------------------------------------------------------
JOINT = 0.14   # a junta visível entre chapas


def v01_chapa(rects, acc):
    """Cada peça é uma chapa. A junta entre elas fica à vista."""
    b = [rect(x + JOINT, y + JOINT, w - JOINT * 2, h - JOINT * 2)
         for (x, y, w, h, _) in rects]
    if acc:
        b.append(poly(acc))
    return "".join(b)


def v02_grade(rects, acc):
    """A malha de 1×1 da chapa gradeada corre por cima da palavra inteira."""
    b = [rect(x, y, w, h) for (x, y, w, h, _) in rects]
    if acc:
        b.append(poly(acc))
    right = max(r[0] + r[2] for r in rects)
    lines = []
    for gx in range(0, int(right) + 1):
        lines.append('M %.2f %.2f V %.2f' % (gx * U, ASC * U, BASE * U))
    for gy in range(ASC, BASE + 1):
        lines.append('M %.2f %.2f H %.2f' % (0, gy * U, right * U))
    b.append('<path d="%s" stroke="%s" stroke-width="1.1" fill="none" '
             'opacity="0.9"/>' % (" ".join(lines), VOID))
    return "".join(b)


def v03_emenda(rects, acc):
    """A emenda dos gabinetes de LED: faixas horizontais, cada uma deslocada."""
    b, bands = [], [(ASC, 5), (5, 10), (10, BASE)]
    for k, (y0, y1) in enumerate(bands):
        dx = (0.0, 0.55, -0.4)[k]
        for (x, y, w, h, _) in rects:
            ty0, ty1 = max(y, y0), min(y + h, y1)
            if ty1 - ty0 > 0.01:
                b.append(rect(x + dx, ty0, w, ty1 - ty0))
    if acc:
        b.append(poly(acc))
    return "".join(b)


def v04_vao(rects, acc):
    """A fresta: uma faixa horizontal aberta atravessa a palavra inteira.

    Um furo isolado por letra não funciona — toda haste tem 2u de largura,
    então qualquer buraco de 2×2 corta a haste em duas e o 'a' vira '3'.
    A fresta corta na horizontal, na altura da barra do meio, e nenhuma letra
    perde a leitura: é a fenda entre a fundação e o piso, por onde a luz entra.
    """
    y0, y1 = XTOP + 5.55, XTOP + 6.45          # 0,9u no meio da barra central
    b = []
    for (x, y, w, h, _) in rects:
        top = min(y + h, y0)
        if top - y > 0.01:
            b.append(rect(x, y, w, top - y))
        bot = max(y, y1)
        if y + h - bot > 0.01:
            b.append(rect(x, bot, w, y + h - bot))
    if acc:
        b.append(poly(acc))
    return "".join(b)


def v05_pilar(rects, acc):
    """Os pilares aparentes: verticais em peso cheio, horizontais em fio."""
    b = []
    for (x, y, w, h, _) in rects:
        if h >= w:                        # vertical: mantém
            b.append(rect(x, y, w, h))
        else:                             # horizontal: afina e centra
            b.append(rect(x, y + (h - 0.9) / 2.0, w, 0.9))
    if acc:
        b.append(poly(acc))
    return "".join(b)


def v06_aresta(rects, acc):
    """Só as arestas: a estrutura antes do revestimento."""
    t = 0.42
    b = []
    for (x, y, w, h, _) in rects:
        b.append(rect(x, y, w, h, INK))
        if w > t * 2 and h > t * 2:
            b.append(rect(x + t, y + t, w - t * 2, h - t * 2, VOID))
    if acc:
        b.append(poly(acc))
    return "".join(b)


def v07_sobrepor(rects, acc):
    """As letras avançam umas sobre as outras; a interseção vira vazio."""
    shift = [0.0, -1.6, -3.2, -4.8]
    b = []
    for (x, y, w, h, gi) in rects:
        b.append(rect(x + shift[gi], y, w, h))
    # segunda passada: onde há sobreposição entre glifos vizinhos, abre o vazio
    for gi in range(1, 4):
        for (x, y, w, h, g2) in rects:
            if g2 != gi:
                continue
            for (px_, py_, pw, ph, g1) in rects:
                if g1 != gi - 1:
                    continue
                ax0, ax1 = x + shift[gi], x + shift[gi] + w
                bx0, bx1 = px_ + shift[gi - 1], px_ + shift[gi - 1] + pw
                ix0, ix1 = max(ax0, bx0), min(ax1, bx1)
                iy0, iy1 = max(y, py_), min(y + h, py_ + ph)
                if ix1 - ix0 > 0.02 and iy1 - iy0 > 0.02:
                    b.append(rect(ix0, iy0, ix1 - ix0, iy1 - iy0, VOID))
    if acc:
        b.append(poly([(px_ + shift[1], py_) for px_, py_ in acc]))
    return "".join(b)


def v08_recorte(rects, acc):
    """A palavra é o que sobra depois do corte: bloco cheio, letra vazada."""
    right = max(r[0] + r[2] for r in rects)
    top = ASC - 3.4
    b = [rect(-1.6, top, right + 3.2, BASE - top + 1.6, INK)]
    for (x, y, w, h, _) in rects:
        b.append(rect(x, y, w, h, VOID))
    if acc:
        b.append(poly(acc, VOID))
    return "".join(b)


def v09_escavado(rects, acc):
    """O subsolo escavado: a letra é um vazio com degrau."""
    right = max(r[0] + r[2] for r in rects)
    top = ASC - 3.4
    b = [rect(-1.6, top, right + 3.2, BASE - top + 1.6, INK)]
    for (x, y, w, h, _) in rects:              # o vazio
        b.append(rect(x, y, w, h, VOID))
    for (x, y, w, h, _) in rects:              # o degrau, deslocado
        if w > 1.0 and h > 1.0:
            b.append(rect(x + 0.5, y + 0.5, max(w - 1.0, 0.2),
                          max(h - 1.0, 0.2), INK))
    if acc:
        b.append(poly(acc, VOID))
    return "".join(b)


def v10_modulo(rects, acc):
    """Um módulo só, 2×2, repetido. Nada além dele constrói a palavra.

    A célula entra se metade dela ou mais cai dentro da letra. Encaixar
    módulo por retângulo não funciona — hastes de largura ímpar deixam
    buracos e o 'a' se desmancha."""
    M = 2.0
    x0 = min(r[0] for r in rects)
    y0 = min(r[1] for r in rects)
    x1 = max(r[0] + r[2] for r in rects)
    y1 = max(r[1] + r[3] for r in rects)

    def inside(px, py):
        for (rx, ry, rw, rh, _) in rects:
            if rx <= px <= rx + rw and ry <= py <= ry + rh:
                return True
        return False

    b = []
    for i in range(int((x1 - x0) / M) + 2):
        for j in range(int((y1 - y0) / M) + 2):
            cx, cy = x0 + i * M, y0 + j * M
            hit = 0
            for si in range(4):                   # 16 amostras por célula
                for sj in range(4):
                    if inside(cx + (si + 0.5) * M / 4.0,
                              cy + (sj + 0.5) * M / 4.0):
                        hit += 1
            if hit >= 8:
                b.append(rect(cx + 0.16, cy + 0.16, M - 0.32, M - 0.32))
    if acc:
        b.append(poly(acc))
    return "".join(b)


VARIANTS = [
    ("01-chapa", "Chapa", v01_chapa),
    ("02-grade", "Grade", v02_grade),
    ("03-emenda", "Emenda", v03_emenda),
    ("04-vao", "Vão", v04_vao),
    ("05-pilar", "Pilar", v05_pilar),
    ("06-aresta", "Aresta", v06_aresta),
    ("07-sobreposicao", "Sobreposição", v07_sobrepor),
    ("08-recorte", "Recorte", v08_recorte),
    ("09-escavado", "Escavado", v09_escavado),
    ("10-modulo", "Módulo", v10_modulo),
]


def main():
    d = os.path.normpath(OUT)
    if not os.path.isdir(d):
        os.makedirs(d)
    rects, acc, _ = layout()
    w, h, ox, oy = canvas(rects, acc)
    for slug, name, fn in VARIANTS:
        svg = wrap(fn(rects, acc), w, h, ox, oy, "téra · " + name)
        p = os.path.join(d, slug + ".svg")
        io.open(p, "w", encoding="utf-8").write(svg)
        print("%-18s %6d bytes" % (slug, len(svg)))
    print("\n%d variantes em %s" % (len(VARIANTS), d))


if __name__ == "__main__":
    main()
