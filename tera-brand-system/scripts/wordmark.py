from PIL import Image, ImageDraw
import math, os

os.makedirs('assets3', exist_ok=True)

def draw_wordmark(scale=300, stroke_ratio=0.145, color=(17,17,17,255), accent_color=None,
                  accent_offset=(0,0), skip_accent=False, pad_ratio=0.35, _ss=4,
                  show_guides=False, guide=(200,60,60,255)):
    """monoline geometric 'téra'. x-height = 1 unit = scale px. returns RGBA image (supersampled)."""
    S = scale * _ss
    ST = stroke_ratio * S           # stroke width px
    asc = 1.5                       # ascender height units
    acc_top = 1.72

    # letter layout (x cursor in units)
    # widths: t bowl extends right; e circle d=1.0; r ~0.62; a ~1.05
    xs = {}
    cur = 0.30                      # left margin for t crossbar overhang
    xs['t_stem'] = cur
    cur += 1.00                     # t advance
    xs['e_c'] = cur + 0.50          # e center x
    cur += 1.22
    xs['r_stem'] = cur
    cur += 0.88
    xs['a_c'] = cur + 0.50
    cur += 1.02
    xs['a_stem'] = xs['a_c'] + 0.50
    total_w = cur + 0.28

    PAD = pad_ratio
    Wpx = int((total_w + 2*PAD) * S)
    Hpx = int((acc_top + 0.35 + PAD*1.2) * S)
    img = Image.new('RGBA', (Wpx, Hpx), (0,0,0,0))
    d = ImageDraw.Draw(img)
    baseline = Hpx - int(PAD*0.9 * S)

    def P(x, y):  # units -> px (y up)
        return ((x + PAD) * S, baseline - y * S)

    def cap(x, y):
        px, py = P(x, y)
        r = ST/2
        d.ellipse([px-r, py-r, px+r, py+r], fill=color)

    def line(x1,y1,x2,y2,c=None):
        c = c or color
        d.line([P(x1,y1), P(x2,y2)], fill=c, width=int(ST))
        for (x,y) in [(x1,y1),(x2,y2)]:
            px,py = P(x,y); r=ST/2
            d.ellipse([px-r,py-r,px+r,py+r], fill=c)

    def arc(cx, cy, r, a_start, a_end, c=None):
        """polyline arc: suave, sem artefatos do PIL.arc. angulos math (0=east, ccw)."""
        c = c or color
        n = max(6, int(abs(a_end - a_start) / 2.5))
        pts = []
        for i in range(n + 1):
            a = math.radians(a_start + (a_end - a_start) * i / n)
            pts.append(P(cx + r * math.cos(a), cy + r * math.sin(a)))
        d.line(pts, fill=c, width=int(ST), joint='curve')
        for (px, py) in (pts[0], pts[-1]):
            rr = ST / 2
            d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=c)

    if show_guides:
        gw = max(2, int(S // 400))
        x_left, x_right = -0.20, total_w + 0.05
        for gy, dash in [(0.0, False), (1.0, False), (1.24, True), (1.62, True)]:
            if dash:
                x = x_left
                while x < x_right:
                    d.line([P(x, gy), P(min(x + 0.10, x_right), gy)], fill=guide, width=gw)
                    x += 0.18
            else:
                d.line([P(x_left, gy), P(x_right, gy)], fill=guide, width=gw)
        def gcircle(cx, cy, r):
            x0, y0 = P(cx - r, cy + r); x1, y1 = P(cx + r, cy - r)
            d.ellipse([x0, y0, x1, y1], outline=guide, width=gw)
        gcircle(xs['t_stem'] + 0.40, 0.40, 0.40)
        gcircle(xs['e_c'], 0.5, 0.5)
        gcircle(xs['r_stem'] + 0.50, 0.50, 0.50)
        gcircle(xs['a_c'], 0.5, 0.5)

    # ---- t ----
    tx = xs['t_stem']
    line(tx, asc, tx, 0.40)                       # stem
    arc(tx + 0.40, 0.40, 0.40, 180, 310)          # bottom bowl, contido
    line(tx - 0.28, 1.0, tx + 0.30, 1.0)          # crossbar

    # ---- é ----
    ec = xs['e_c']
    # circle with opening at lower-right (gap 300..345 deg -> -60..-15)
    arc(ec, 0.5, 0.5, -8, 292)
    line(ec - 0.42, 0.5, ec + 0.42, 0.5)          # bar (inset, sem nubs)
    # accent: vertical dash above (the quirk)
    if not skip_accent:
        acol = accent_color or color
        ax = ec + 0.12 + accent_offset[0]
        ay1 = 1.24 + accent_offset[1]
        ay2 = 1.62 + accent_offset[1]
        line(ax, ay1, ax, ay2, c=acol)

    # ---- r ----
    rx = xs['r_stem']
    line(rx, 0.0, rx, 1.0)
    arc(rx + 0.50, 0.50, 0.50, 90, 180)           # shoulder: from stem mid up to top right

    # ---- a ----
    ac = xs['a_c']
    arc(ac, 0.5, 0.5, 0, 360)
    line(xs['a_stem'], 1.0, xs['a_stem'], 0.0)

    img = img.crop(img.getbbox())
    img = img.resize((img.width // _ss, img.height // _ss), Image.LANCZOS)
    return img

if __name__ == '__main__':
    wm = draw_wordmark(scale=300)
    wm.save('assets3/wm_test.png')
    # white on dark preview
    bg = Image.new('RGB', (wm.width+200, wm.height+200), (255,255,255))
    bg.paste(wm, (100,100), wm)
    bg.save('assets3/wm_preview.jpg', quality=90)
    print('->', 'assets3/wm_preview.jpg', wm.size)


def draw_monogram(scale=400, stroke_ratio=0.145, color=(17,17,17,255), accent_color=None, _ss=4):
    """simbolo: o e-acento isolado."""
    import math
    S = scale * _ss
    ST = stroke_ratio * S
    Wpx = int(1.6 * S); Hpx = int(2.35 * S)
    img = Image.new('RGBA', (Wpx, Hpx), (0,0,0,0))
    d = ImageDraw.Draw(img)
    cx, cy = Wpx/2, Hpx - 0.75*S
    def pt(a, r): return (cx + r*math.cos(math.radians(a)), cy - r*math.sin(math.radians(a)))
    r = 0.5*S
    n = 130
    pts = [pt(-8 + 300*i/n, r) for i in range(n+1)]
    d.line(pts, fill=color, width=int(ST), joint='curve')
    for (px,py) in (pts[0], pts[-1]):
        rr=ST/2; d.ellipse([px-rr,py-rr,px+rr,py+rr], fill=color)
    d.line([(cx-0.42*S, cy),(cx+0.42*S, cy)], fill=color, width=int(ST))
    for x in (cx-0.42*S, cx+0.42*S):
        rr=ST/2; d.ellipse([x-rr,cy-rr,x+rr,cy+rr], fill=color)
    ac = accent_color or color
    ax = cx + 0.12*S
    ay1, ay2 = cy - 1.10*S, cy - 1.44*S
    d.line([(ax,ay1),(ax,ay2)], fill=ac, width=int(ST))
    for y in (ay1, ay2):
        rr=ST/2; d.ellipse([ax-rr,y-rr,ax+rr,y+rr], fill=ac)
    img = img.crop(img.getbbox())
    return img.resize((img.width//_ss, img.height//_ss), Image.LANCZOS)


def draw_construction(scale=340, color=(17,17,17,255), guide=(200,60,60,255)):
    return draw_wordmark(scale=scale, color=color, pad_ratio=0.5, show_guides=True, guide=guide)
