from PIL import Image, ImageDraw, ImageFont, ImageOps
from wordmark import draw_wordmark
import os, math

os.makedirs('assets3', exist_ok=True)
FONT = 'fonts/SpaceGrotesk-Var.ttf'
INK = (17, 17, 17, 255)
WHITE = (250, 250, 250, 255)
GREEN = (44, 245, 160, 255)

# ---------- wordmark variants ----------
draw_wordmark(scale=400).save('assets3/wm_black.png')
draw_wordmark(scale=400, color=WHITE).save('assets3/wm_white.png')
draw_wordmark(scale=400, accent_color=GREEN).save('assets3/wm_green_accent.png')
draw_wordmark(scale=400, skip_accent=True).save('assets3/wm_noaccent.png')

# standalone accent (vertical dash, round caps)
def accent_piece(h_px, color, w_ratio=0.16):
    st = int(h_px * w_ratio / 0.38)  # same stroke/len ratio as no logotipo (0.38 units长)
    img = Image.new('RGBA', (st + 8, h_px + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = img.width // 2
    d.line([(x, st // 2 + 4), (x, h_px - st // 2 + 4)], fill=color, width=st)
    r = st / 2
    for y in (st // 2 + 4, h_px - st // 2 + 4):
        d.ellipse([x - r, y - r, x + r, y + r], fill=color)
    return img
accent_piece(600, GREEN).save('assets3/accent_green.png')
accent_piece(600, INK).save('assets3/accent_black.png')
accent_piece(600, WHITE).save('assets3/accent_white.png')

# ---------- display type ----------
def render_block(lines, path, px=170, weight=500, color=INK, tracking=-0.018, leading=1.04):
    f = ImageFont.truetype(FONT, px)
    try: f.set_variation_by_axes([weight])
    except Exception: pass
    tr = int(px * tracking)
    lm = []
    maxw = 0
    for ln in lines:
        widths = [f.getlength(ch) for ch in ln]
        w = sum(widths) + tr * max(0, len(ln) - 1)
        lm.append((ln, widths, w)); maxw = max(maxw, w)
    lh = int(px * leading)
    img = Image.new('RGBA', (int(maxw) + 60, lh * len(lines) + int(px * 0.5)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    y = int(px * 0.1)
    for ln, widths, w in lm:
        x = 30
        for ch, adv in zip(ln, widths):
            d.text((x, y), ch, font=f, fill=color); x += adv + tr
        y += lh
    img = img.crop(img.getbbox()); img.save(path)
    print('->', path, img.size)

render_block(['A sala que', 'abre dimensões.'], 'assets3/t_estrategia.png', px=200)
render_block(['Do esboço', 'ao desenho.'], 'assets3/t_wordmark.png', px=190)
render_block(['O Plano'], 'assets3/t_plano.png', px=210)
render_block(['O Acento'], 'assets3/t_acento.png', px=210)
render_block(['Camadas'], 'assets3/t_camadas.png', px=210)
render_block(['Preto, branco', 'e fósforo.'], 'assets3/t_programa.png', px=185)
render_block(['O plasma', 'vira programa.'], 'assets3/t_plasma.png', px=185)
render_block(['Sistema no Plano,', 'assinatura no Acento.'], 'assets3/t_leitura.png', px=160)
render_block(['Da direção', 'ao sistema vivo.'], 'assets3/t_next.png', px=175)
for n, t in [('01', 'Estratégia'), ('02', 'Wordmark'), ('03', 'Caminhos'), ('04', 'Programa'), ('05', 'Próximos passos')]:
    render_block([f'{n}  {t}'], f'assets3/idx_{n}.png', px=130)

# ---------- diagrams (line art, white bg transparent) ----------
def diagram_plano(path, W=1400, H=800):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    st = 6
    # plane 32:9
    pw = 1100; ph = int(pw * 9 / 32)
    x0 = (W - pw) // 2; y0 = (H - ph) // 2
    d.rectangle([x0, y0, x0 + pw, y0 + ph], outline=INK, width=st)
    # dimension ticks
    f = ImageFont.truetype(FONT, 44)
    try: f.set_variation_by_axes([500])
    except Exception: pass
    d.line([(x0, y0 + ph + 60), (x0 + pw, y0 + ph + 60)], fill=INK, width=3)
    for x in (x0, x0 + pw):
        d.line([(x, y0 + ph + 45), (x, y0 + ph + 75)], fill=INK, width=3)
    d.text((x0 + pw / 2 - 240, y0 + ph + 80), 'proporção do painel', font=f, fill=INK)
    d.line([(x0 - 60, y0), (x0 - 60, y0 + ph)], fill=INK, width=3)
    for y in (y0, y0 + ph):
        d.line([(x0 - 75, y), (x0 - 45, y)], fill=INK, width=3)
    img.save(path); print('->', path)

def diagram_acento(path, W=1400, H=800):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # é ampliado: círculo + barra, acento verde destacado com círculo pontilhado
    cx, cy, r = 500, 480, 220
    st = 34
    n = 120
    pts = [(cx + r * math.cos(math.radians(-8 + 300 * i / n)), cy - r * math.sin(math.radians(-8 + 300 * i / n))) for i in range(n + 1)]
    d.line(pts, fill=INK, width=st, joint='curve')
    for (px, py) in (pts[0], pts[-1]):
        d.ellipse([px - st / 2, py - st / 2, px + st / 2, py + st / 2], fill=INK)
    d.line([(cx - r * 0.84, cy), (cx + r * 0.84, cy)], fill=INK, width=st)
    for x in (cx - r * 0.84, cx + r * 0.84):
        d.ellipse([x - st / 2, cy - st / 2, x + st / 2, cy + st / 2], fill=INK)
    # acento
    ax = cx + 55; ay1, ay2 = 105, 235
    d.line([(ax, ay1), (ax, ay2)], fill=GREEN, width=st)
    for y in (ay1, ay2):
        d.ellipse([ax - st / 2, y - st / 2, ax + st / 2, y + st / 2], fill=GREEN)
    # dashed circle around accent
    dr = 130
    for a in range(0, 360, 14):
        a2 = a + 7
        p1 = (ax + dr * math.cos(math.radians(a)), 170 + dr * math.sin(math.radians(a)))
        p2 = (ax + dr * math.cos(math.radians(a2)), 170 + dr * math.sin(math.radians(a2)))
        d.line([p1, p2], fill=INK, width=4)
    # arrow out
    d.line([(ax + dr + 10, 170), (ax + dr + 240, 170)], fill=INK, width=4)
    d.polygon([(ax + dr + 240, 158), (ax + dr + 240, 182), (ax + dr + 264, 170)], fill=INK)
    # displaced green accent big
    bx = ax + dr + 380
    d.line([(bx, 80), (bx, 300)], fill=GREEN, width=56)
    for y in (80, 300):
        d.ellipse([bx - 28, y - 28, bx + 28, y + 28], fill=GREEN)
    img.save(path); print('->', path)

def diagram_camadas(path, W=1400, H=800):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pw, ph = 620, 360
    offs = [(0, 0, 3, None), (110, -70, 4, None), (220, -140, 6, None)]
    x0, y0 = 240, 330
    for i, (dx, dy, st, _) in enumerate(offs):
        x, y = x0 + dx, y0 + dy
        if i == 2:
            d.rectangle([x, y, x + pw, y + ph], fill=(17, 17, 17, 255))
        else:
            d.rectangle([x, y, x + pw, y + ph], outline=INK, width=st)
    img.save(path); print('->', path)

diagram_plano('assets3/diag_plano.png')
diagram_acento('assets3/diag_acento.png')
diagram_camadas('assets3/diag_camadas.png')
print('done')
