from PIL import Image, ImageDraw, ImageFont
from wordmark import draw_wordmark, draw_monogram
import os

os.makedirs('assets4', exist_ok=True)
FONT = 'fonts/SpaceGrotesk-Var.ttf'
INK = (17, 17, 17, 255)
WHITE = (250, 250, 250, 255)
GREEN = (44, 245, 160, 255)

def sg(px, weight=500):
    f = ImageFont.truetype(FONT, px)
    try: f.set_variation_by_axes([weight])
    except Exception: pass
    return f

def render_block(lines, path, px=170, weight=500, color=INK, tracking=-0.018, leading=1.04, charsp=None):
    f = sg(px, weight)
    tr = int(px * (charsp if charsp is not None else tracking))
    lm = []; maxw = 0
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

# statements
render_block(['A sala que', 'abre dimensões.'], 'assets4/t_estrategia.png', px=200)
render_block(['Do esboço', 'ao desenho.'], 'assets4/t_wordmark.png', px=190)
render_block(['Quatro letras,', 'quatro círculos.'], 'assets4/t_construcao.png', px=175)
render_block(['Um símbolo', 'que acende.'], 'assets4/t_simbolo.png', px=190)
render_block(['O Plano.'], 'assets4/t_plano.png', px=210)
render_block(['O Acento.'], 'assets4/t_acento.png', px=210)
render_block(['Preto, branco', 'e fósforo.'], 'assets4/t_programa.png', px=185)
render_block(['O sistema', 'em uso.'], 'assets4/t_aplicacoes.png', px=190)
render_block(['Da caixa fechada', 'ao mundo aceso.'], 'assets4/t_motion.png', px=175)
render_block(['O conteúdo', 'é a cor.'], 'assets4/t_conteudo.png', px=190)
render_block(['Da direção', 'ao sistema vivo.'], 'assets4/t_next.png', px=175)
for n, t in [('01', 'Conceito'), ('02', 'Wordmark'), ('03', 'Símbolo'), ('04', 'Sistema'), ('05', 'Aplicações'), ('06', 'Motion'), ('07', 'Próximos passos')]:
    render_block([f'{n}  {t}'], f'assets4/idx_{n}.png', px=110)

# ---------- lockup com descritor ----------
def lockup_descriptor(path, color=INK):
    wm = draw_wordmark(scale=300, color=color)
    f = sg(64, 500)
    txt = 'ESPETÁCULOS MULTIDIMENSIONAIS'
    tr = 14
    tw = sum(f.getlength(c) for c in txt) + tr * (len(txt) - 1)
    W = max(wm.width, int(tw)) + 40
    H = wm.height + 150
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    img.paste(wm, (0, 0), wm)
    d = ImageDraw.Draw(img)
    x = 6
    for c in txt:
        d.text((x, wm.height + 55), c, font=f, fill=color)
        x += f.getlength(c) + tr
    img = img.crop(img.getbbox()); img.save(path)
    print('->', path, img.size)
lockup_descriptor('assets4/lockup_desc_black.png')
lockup_descriptor('assets4/lockup_desc_white.png', WHITE)

# ---------- clear space ----------
def clearspace(path):
    wm = draw_wordmark(scale=260)
    acc_h = int(0.38 * 260 / 0.38 * 0.38)  # altura do acento em px = 0.38 unidades * 260
    m = int(0.62 * 260)                    # margem = altura x do e? usar 0.62u ~ acento+folga
    W = wm.width + 2 * m + 160
    H = wm.height + 2 * m + 160
    img = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    x0, y0 = (W - wm.width) // 2, (H - wm.height) // 2
    img.paste(wm, (x0, y0), wm)
    d = ImageDraw.Draw(img)
    bx0, by0, bx1, by1 = x0 - m, y0 - m, x0 + wm.width + m, y0 + wm.height + m
    def dashed(p1, p2, dash=16, gap=12):
        import math
        x1, y1 = p1; x2, y2 = p2
        L = math.hypot(x2 - x1, y2 - y1); n = int(L // (dash + gap)) + 1
        for i in range(n):
            t0 = i * (dash + gap) / L; t1 = min((i * (dash + gap) + dash) / L, 1)
            d.line([(x1 + (x2 - x1) * t0, y1 + (y2 - y1) * t0), (x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1)], fill=(150, 150, 150, 255), width=3)
    dashed((bx0, by0), (bx1, by0)); dashed((bx1, by0), (bx1, by1))
    dashed((bx1, by1), (bx0, by1)); dashed((bx0, by1), (bx0, by0))
    # marcador ½t: o acento como unidade
    ac = draw_monogram(scale=90, color=(150, 150, 150, 255))
    f = sg(40, 500)
    d.text((bx0, by0 - 60), 'x', font=f, fill=(120, 120, 120, 255))
    d.line([(bx0 + 30, by0 - 45), (bx0 + 30, by0)], fill=(120, 120, 120, 255), width=3)
    img.save(path); print('->', path, img.size)
clearspace('assets4/clearspace.png')

# ---------- tamanhos mínimos ----------
def minsizes(path):
    img = Image.new('RGBA', (1700, 620), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    f = sg(34, 500)
    entries = [(520, 'Display'), (260, 'Interface, 180 px'), (120, 'Mínimo, 80 px')]
    x = 40
    for w, cap in entries:
        wm = draw_wordmark(scale=int(w * 300 / 1800))
        y = 300 - wm.height
        img.paste(wm, (x, y), wm)
        d = ImageDraw.Draw(img)
        d.text((x, 340), cap, font=f, fill=(120, 120, 120, 255))
        x += wm.width + 120
    img = img.crop(img.getbbox()); img.save(path)
    print('->', path, img.size)
minsizes('assets4/minsizes.png')

# ---------- storyboard de motion ----------
def storyboard(path):
    fw, fh, gap = 640, 640, 36
    n = 5
    img = Image.new('RGB', (n * fw + (n - 1) * gap, fh + 90), (255, 255, 255))
    d = ImageDraw.Draw(img)
    f = sg(30, 500)
    RATIO = 32 / 9
    pw_full = int(fw * 0.78); ph_full = int(pw_full / RATIO)
    for i in range(n):
        x0 = i * (fw + gap)
        d.rectangle([x0, 0, x0 + fw, fh], fill=(10, 10, 12))
        cx, cy = x0 + fw // 2, fh // 2
        if i == 0:
            pass  # a caixa fechada: preto total
        elif i == 1:
            d.line([(cx - 60, cy), (cx + 60, cy)], fill=(250, 250, 250), width=8)
        elif i == 2:
            pw, ph = int(pw_full * 0.55), int(ph_full * 0.55)
            d.rectangle([cx - pw // 2, cy - ph // 2, cx + pw // 2, cy + ph // 2], outline=(250, 250, 250), width=5)
        elif i == 3:
            pw, ph = pw_full, ph_full
            d.rectangle([cx - pw // 2, cy - ph // 2, cx + pw // 2, cy + ph // 2], outline=(250, 250, 250), width=5)
            tf = sg(44, 500)
            d.text((cx - pw // 2 + 28, cy - 24), 'Téra apresenta', font=tf, fill=(250, 250, 250))
        else:
            wm = draw_wordmark(scale=74, color=WHITE)
            img.paste(wm, (cx - wm.width // 2, cy - wm.height // 2), wm)
            d = ImageDraw.Draw(img)
        d.text((x0, fh + 24), f'0{i + 1}', font=f, fill=(120, 120, 120))
    img.save(path); print('->', path, img.size)
storyboard('assets4/storyboard.png')
print('done')
