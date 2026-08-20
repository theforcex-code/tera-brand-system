from PIL import Image, ImageDraw, ImageFont
from wordmark import draw_wordmark, draw_monogram
import os

os.makedirs('assets4', exist_ok=True)
FONT = 'fonts/SpaceGrotesk-Var.ttf'
INK = (17, 17, 17)
BLACK = (10, 10, 12)
PAPER = (255, 255, 255)
GREEN = (44, 245, 160)
GREY = (120, 120, 120)
RATIO = 32 / 9  # placeholder até a spec do painel

def sg(px, weight=500):
    f = ImageFont.truetype(FONT, px)
    try: f.set_variation_by_axes([weight])
    except Exception: pass
    return f

def meta(d, x, y, lines, px=32, gap=1.55, color=INK):
    f = sg(px)
    for ln in lines:
        d.text((x, y), ln, font=f, fill=color); y += int(px * gap)

META = ['Temporada 01', 'Mata São Paulo', 'Abertura set 2027', 'tera.art.br']

def accent(d, x, y1, y2, st, col=GREEN):
    d.line([(x, y1), (x, y2)], fill=col, width=st)
    for y in (y1, y2):
        d.ellipse([x - st / 2, y - st / 2, x + st / 2, y + st / 2], fill=col)

# ---------- poster A: o Plano como void ----------
def poster_void(path, W=1350, H=1800):
    img = Image.new('RGB', (W, H), PAPER)
    wm = draw_wordmark(scale=92)
    img.paste(wm, (100, 110), wm)
    d = ImageDraw.Draw(img)
    pw = W - 200; ph = int(pw / RATIO)
    x0, y0 = 100, 520
    d.rectangle([x0, y0, x0 + pw, y0 + ph], fill=BLACK)
    f = sg(36)
    d.text((x0 + 44, y0 + ph - 84), 'Estado 001', font=f, fill=(250, 250, 250))
    # display abaixo do plano
    f2 = sg(104)
    d.text((100, y0 + ph + 90), 'A Téra abre:', font=f2, fill=INK)
    d.text((100, y0 + ph + 205), 'Temporada 01.', font=f2, fill=INK)
    meta(d, 100, H - 300, META, px=32)
    fb = sg(140)
    d.text((W - 100 - d.textlength('set', font=fb), H - 320), 'set', font=fb, fill=INK)
    d.text((W - 100 - d.textlength('2027', font=fb), H - 195), '2027', font=fb, fill=INK)
    img.save(path); print('->', path)

# ---------- poster B: negativo ----------
def poster_negative(path, W=1350, H=1800):
    img = Image.new('RGB', (W, H), BLACK)
    wm = draw_wordmark(scale=220, color=(250, 250, 250, 255))
    img.paste(wm, ((W - wm.width) // 2, H // 2 - wm.height + 60), wm)
    d = ImageDraw.Draw(img)
    f = sg(48)
    txt = 'ESPETÁCULOS MULTIDIMENSIONAIS'
    tr = 10
    tw = sum(f.getlength(c) for c in txt) + tr * (len(txt) - 1)
    x = (W - tw) / 2
    for c in txt:
        d.text((x, H // 2 + 160), c, font=f, fill=(250, 250, 250)); x += f.getlength(c) + tr
    meta(d, 100, H - 300, ['Temporada 01', 'Abertura set 2027', 'tera.art.br'], px=32, color=(250, 250, 250))
    d.text((W - 100 - d.textlength('Mata São Paulo', font=sg(32)), H - 300), 'Mata São Paulo', font=sg(32), fill=GREY)
    img.save(path); print('->', path)

# ---------- OOH: tipo atravessa o Plano (void) ----------
def ooh_type(path, W=2400, H=1100):
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    pw = 1500; ph = int(pw / RATIO)
    x0, y0 = 700, (H - ph) // 2 - 60
    d.rectangle([x0, y0, x0 + pw, y0 + ph], fill=BLACK)
    txt = 'A sala que abre dimensões.'
    f = sg(148)
    from PIL import ImageChops
    tx, ty = 160, y0 + ph // 2 - 76
    tmask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(tmask).text((tx, ty), txt, font=f, fill=255)
    pmask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(pmask).rectangle([x0, y0, x0 + pw, y0 + ph], fill=255)
    inside = ImageChops.multiply(tmask, pmask)
    outside = ImageChops.subtract(tmask, inside)
    img.paste(Image.new('RGB', (W, H), INK), (0, 0), outside)
    img.paste(Image.new('RGB', (W, H), (250, 250, 250)), (0, 0), inside)
    d = ImageDraw.Draw(img)
    wm = draw_wordmark(scale=56)
    img.paste(wm, (160, 120), wm)
    d = ImageDraw.Draw(img)
    d.text((160, H - 150), 'Abertura set 2027', font=sg(40), fill=INK)
    d.text((W - 160 - d.textlength('tera.art.br', font=sg(40)), H - 150), 'tera.art.br', font=sg(40), fill=INK)
    img.save(path); print('->', path)

# ---------- ingresso ----------
def ticket(path, W=1900, H=760):
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    # canhoto preto
    cw = 560
    d.rectangle([0, 0, cw, H], fill=BLACK)
    mono = draw_monogram(scale=150, color=(250, 250, 250, 255))
    img.paste(mono, ((cw - mono.width) // 2, (H - mono.height) // 2), mono)
    d = ImageDraw.Draw(img)
    # picote
    y = 24
    while y < H - 24:
        d.line([(cw + 30, y), (cw + 30, y + 16)], fill=(180, 180, 180), width=4); y += 34
    # corpo
    x = cw + 90
    d.text((x, 70), 'Téra apresenta', font=sg(40), fill=GREY)
    d.text((x, 135), 'Estado 001', font=sg(96), fill=INK)
    meta(d, x, 300, ['Sáb 18 set 2027, 21h', 'Mata São Paulo', 'Entrada pela Rua São Caetano'], px=36)
    fb = sg(120)
    d.text((W - 110 - d.textlength('A 12', font=fb), 90), 'A 12', font=fb, fill=INK)
    d.text((W - 110 - d.textlength('Fila, assento', font=sg(30)), 230), 'Fila, assento', font=sg(30), fill=GREY)
    # codigo de barras
    import random
    random.seed(7)
    bx = W - 110 - 420
    for i in range(60):
        w = random.choice([3, 3, 5, 8])
        d.rectangle([bx, H - 200, bx + w, H - 90], fill=INK); bx += w + random.choice([4, 6, 8])
    img.save(path); print('->', path)

# ---------- social: 3 posts ----------
def social_strip(path, S=1080, gap=44):
    img = Image.new('RGB', (3 * S + 2 * gap, S), (235, 235, 235))
    # post 1: data gigante
    p1 = Image.new('RGB', (S, S), BLACK)
    d = ImageDraw.Draw(p1)
    fb = sg(330)
    d.text((70, 200), '18', font=fb, fill=(250, 250, 250))
    d.text((70, 500), 'set', font=fb, fill=(250, 250, 250))
    wm = draw_wordmark(scale=60, color=(250, 250, 250, 255))
    p1.paste(wm, (70, S - 190), wm)
    d = ImageDraw.Draw(p1)
    # post 2: plano em branco
    p2 = Image.new('RGB', (S, S), PAPER)
    d = ImageDraw.Draw(p2)
    pw = S - 160; ph = int(pw / RATIO)
    d.rectangle([80, 300, 80 + pw, 300 + ph], fill=BLACK)
    d.text((80, 300 + ph + 60), 'Estado 001', font=sg(72), fill=INK)
    d.text((80, 300 + ph + 155), 'Téra apresenta', font=sg(40), fill=GREY)
    wm2 = draw_wordmark(scale=54)
    p2.paste(wm2, (80, 110), wm2)
    # post 3: a fresta, aberta agora
    p3 = Image.new('RGB', (S, S), BLACK)
    d = ImageDraw.Draw(p3)
    d.line([(140, S // 2), (S - 140, S // 2)], fill=(250, 250, 250), width=10)
    f = sg(64)
    txt = 'ABERTA AGORA'
    tw = d.textlength(txt, font=f)
    d.text(((S - tw) / 2, S // 2 + 120), txt, font=f, fill=(250, 250, 250))
    for i, p in enumerate([p1, p2, p3]):
        img.paste(p, (i * (S + gap), 0))
    img.save(path); print('->', path)

# ---------- website ----------
def website(path, W=2400, H=1500):
    img = Image.new('RGB', (W, H), (225, 225, 225))
    d = ImageDraw.Draw(img)
    # janela
    bx0, by0 = 60, 50
    d.rounded_rectangle([bx0, by0, W - 60, H - 50], radius=18, fill=PAPER, outline=(200, 200, 200), width=2)
    # barra
    d.rounded_rectangle([bx0, by0, W - 60, by0 + 90], radius=18, fill=(242, 242, 242))
    d.rectangle([bx0, by0 + 60, W - 60, by0 + 90], fill=(242, 242, 242))
    for i, c in enumerate([(230, 100, 90), (235, 190, 80), (110, 200, 110)]):
        d.ellipse([bx0 + 40 + i * 46, by0 + 32, bx0 + 66 + i * 46, by0 + 58], fill=c)
    d.rounded_rectangle([bx0 + 220, by0 + 22, W - 300, by0 + 68], radius=12, fill=PAPER, outline=(215, 215, 215), width=2)
    d.text((bx0 + 250, by0 + 30), 'tera.art.br', font=sg(30), fill=GREY)
    # nav
    wm = draw_wordmark(scale=48)
    img.paste(wm, (bx0 + 90, by0 + 160), wm)
    d = ImageDraw.Draw(img)
    nav = ['Temporada', 'A sala', 'Visite', 'Ingressos']
    x = W - 60 - 90
    for item in reversed(nav):
        tw = d.textlength(item, font=sg(34))
        x -= tw
        d.text((x, by0 + 175), item, font=sg(34), fill=INK)
        x -= 70
    # hero
    f = sg(150)
    d.text((bx0 + 90, by0 + 360), 'A sala que', font=f, fill=INK)
    d.text((bx0 + 90, by0 + 520), 'abre dimensões.', font=f, fill=INK)
    # plano
    pw = W - 120 - 180; ph = int(pw / RATIO)
    px0, py0 = bx0 + 90, by0 + 780
    d.rectangle([px0, py0, px0 + pw, py0 + ph], fill=BLACK)
    d.text((px0 + 50, py0 + ph - 90), 'Temporada 01, em breve', font=sg(40), fill=(250, 250, 250))
    img.save(path); print('->', path)

# ---------- app icon ----------
def app_icon(path, S=900):
    img = Image.new('RGB', (S, S), (235, 235, 235))
    d = ImageDraw.Draw(img)
    r = 190
    d.rounded_rectangle([90, 90, S - 90, S - 90], radius=r, fill=BLACK)
    mono = draw_monogram(scale=190, color=(250, 250, 250, 255))
    img.paste(mono, ((S - mono.width) // 2, (S - mono.height) // 2 + 10), mono)
    img.save(path); print('->', path)

# ---------- wayfinding ----------
def wayfinding(path, W=850, H=1750):
    img = Image.new('RGB', (W, H), BLACK)
    d = ImageDraw.Draw(img)
    mono = draw_monogram(scale=120, color=(250, 250, 250, 255))
    img.paste(mono, (90, 90), mono)
    d = ImageDraw.Draw(img)
    items = [('Sala', True), ('Foyer', False), ('Bar', False), ('Loja', False), ('Saída', False)]
    y = 620
    f = sg(84)
    for name, cur in items:
        col = (250, 250, 250)
        if cur:
            d.line([(100, y + 52), (150, y + 52)], fill=GREEN, width=14)
        d.text((170, y), name, font=f, fill=col)
        y += 190
    d.text((90, H - 130), 'Nível 01', font=sg(40), fill=GREY)
    img.save(path); print('->', path)

poster_void('assets4/ap_poster_void.png')
poster_negative('assets4/ap_poster_neg.png')
ooh_type('assets4/ap_ooh.png')
ticket('assets4/ap_ticket.png')
social_strip('assets4/ap_social.png')
website('assets4/ap_site.png')
app_icon('assets4/ap_icon.png')
wayfinding('assets4/ap_way.png')
print('done')
