
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
from wordmark import draw_wordmark
import numpy as np
FONT='fonts/SpaceGrotesk-Var.ttf'
def sg(px,w=500):
    ft=ImageFont.truetype(FONT,px)
    try: ft.set_variation_by_axes([w])
    except: pass
    return ft
base = Image.open('unpacked/ppt/media/image10.jpeg').convert('RGB')
W,H = base.size
GREEN=(44,245,160)
SEAM_X, SEAM_Y0, SEAM_Y1 = 612, 206, 634
def darken(img,k_img=0.20,k_lum=0.26):
    a=np.array(img).astype(float); lum=a.mean(-1,keepdims=True)
    return Image.fromarray(np.clip(a*k_img+lum*k_lum,0,255).astype(np.uint8))
def accent_glow(img,x,y0,y1,core=8):
    glow=Image.new('RGB',img.size,(0,0,0)); gd=ImageDraw.Draw(glow)
    for wdt,alpha in [(40,26),(22,60),(10,200)]:
        gd.line([(x,y0),(x,y1)],fill=tuple(int(c*alpha/255) for c in GREEN),width=wdt)
    glow=glow.filter(ImageFilter.GaussianBlur(5))
    out=ImageChops.screen(img,glow); d=ImageDraw.Draw(out)
    d.line([(x,y0),(x,y1)],fill=GREEN,width=core)
    for y in (y0,y1): d.ellipse([x-core/2,y-core/2,x+core/2,y+core/2],fill=GREEN)
    return out
def chrome(img,caption):
    wm=draw_wordmark(scale=40,color=(250,250,250,255))
    img.paste(wm,(80,60),wm); d=ImageDraw.Draw(img)
    d.text((80,H-80),caption,font=sg(26),fill=(190,190,190)); return img
A=darken(base,0.11,0.17)
dA=ImageDraw.Draw(A)
for quad in [[(330,470),(560,485)],[(655,485),(905,470)]]:
    dA.line([quad[0],quad[1]],fill=(250,250,250),width=7)
A=chrome(A,'Estado 002 na sala: a primeira luz')
A.save('assets4/sala_compA.png')
B=darken(base,0.26,0.26)
def warp_text(text,px,quad,canvas):
    ft=sg(px,500)
    tw=int(sum(ft.getlength(c) for c in text))+80; th=int(px*1.42)
    src=Image.new('RGBA',(tw,th),(0,0,0,0)); sd=ImageDraw.Draw(src)
    x=40
    for c in text: sd.text((x,int(px*0.06)),c,font=ft,fill=(250,250,250,255)); x+=ft.getlength(c)
    pa=quad; pb=[(0,0),(tw,0),(tw,th),(0,th)]
    M=[]
    for (xx,yy),(u,v) in zip(pa,pb):
        M.append([xx,yy,1,0,0,0,-u*xx,-u*yy]); M.append([0,0,0,xx,yy,1,-v*xx,-v*yy])
    c8=np.linalg.solve(np.array(M,float),np.array(pb,float).reshape(8))
    dst=src.transform(canvas.size, Image.PERSPECTIVE, c8, Image.BICUBIC)
    canvas.paste(dst,(0,0),dst)
warp_text('Téra',150,[(330,395),(560,430),(560,540),(330,545)],B)
warp_text('apresenta',150,[(655,430),(905,398),(905,548),(655,540)],B)
B=chrome(B,'A tipografia em escala de sala')
B.save('assets4/sala_compB.png')
C=base.copy()
ov=Image.new('RGBA',C.size,(0,0,0,0)); od=ImageDraw.Draw(ov)
od.rectangle([0,H-190,W,H],fill=(5,5,7,215))
C=Image.alpha_composite(C.convert('RGBA'),ov).convert('RGB')
d=ImageDraw.Draw(C)
wm=draw_wordmark(scale=46,color=(250,250,250,255))
C.paste(wm,(80,H-158),wm); d=ImageDraw.Draw(C)
d.text((80+wm.width+50,H-142),'apresenta  Estado 001',font=sg(40),fill=(250,250,250))
tx = W-80-d.textlength('Temporada 01, set 2027',font=sg(30))
d.text((tx,H-134),'Temporada 01, set 2027',font=sg(30),fill=(170,170,170))
ax=int(tx-60)
d.line([(ax,H-158),(ax,H-104)],fill=GREEN,width=12)
for y in (H-158,H-104): d.ellipse([ax-6,y-6,ax+6,y+6],fill=GREEN)
C.save('assets4/sala_compC.png')
print('comps ok')
