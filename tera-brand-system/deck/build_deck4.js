const pptxgen = require('pptxgenjs');
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';
const W = 13.33, H = 7.5;
const INK = '111111', MUT = '8A8A8A', PAPER = 'FFFFFF', GREY = 'F1F1F1', DARK = '0A0A0C', GREEN = '2CF5A0';

const label = (s, txt, x, y, o = {}) => s.addText(txt, Object.assign({ x, y, w: 6, h: 0.28, fontFace: 'Arial', fontSize: 9, bold: true, color: MUT, margin: 0, charSpacing: 3 }, o));
const body = (s, txt, x, y, w, h, o = {}) => s.addText(txt, Object.assign({ x, y, w, h, fontFace: 'Arial', fontSize: 12, color: INK, margin: 0, lineSpacing: 18, valign: 'top' }, o));
const disp = (s, path, pw, ph, x, y, w) => { const h = w * ph / pw; s.addImage({ path, x, y, w, h }); return h; };
const IM = {
  wm_black: [1804, 712], wm_white: [1804, 712], construction: [1881, 671],
  monogram_black: [343, 625], monogram_white_green: [343, 625],
};
let pageNum = 0;
function base(s, bg = PAPER) {
  s.background = { color: bg };
  pageNum++;
  const fc = (bg === DARK) ? '55555C' : MUT;
  if (pageNum > 1) {
    s.addText('TÉRA', { x: 0.55, y: H - 0.42, w: 2, h: 0.28, fontFace: 'Arial', fontSize: 8, bold: true, color: fc, margin: 0, charSpacing: 3 });
    s.addText(String(pageNum).padStart(2, '0'), { x: W - 1.35, y: H - 0.42, w: 0.8, h: 0.28, align: 'right', fontFace: 'Arial', fontSize: 8, color: fc, margin: 0, charSpacing: 2 });
  }
  return s;
}
function card(s, path, pw, ph, x, y, w, cap) {
  const hh = w * ph / pw;
  s.addShape('rect', { x: x - 0.02, y: y - 0.02, w: w + 0.04, h: hh + 0.04, fill: { color: 'FFFFFF' }, line: { color: 'DDDDDD', width: 0.5 }, shadow: { type: 'outer', color: '000000', opacity: 0.18, blur: 10, offset: 3, angle: 90 } });
  s.addImage({ path, x, y, w, h: hh });
  if (cap) s.addText(cap, { x, y: y + hh + 0.08, w: Math.max(w, 3), h: 0.26, fontFace: 'Arial', fontSize: 9, color: MUT, margin: 0 });
  return hh;
}

// ---------- 1 CAPA ----------
let s = base(p.addSlide());
s.addText('TÉRA', { x: 0.55, y: 0.5, w: 3, h: 0.3, fontFace: 'Arial', fontSize: 10, bold: true, color: INK, margin: 0, charSpacing: 4 });
s.addText('MATA SÃO PAULO', { x: W - 4.55, y: 0.5, w: 4, h: 0.3, align: 'right', fontFace: 'Arial', fontSize: 10, bold: true, color: INK, margin: 0, charSpacing: 4 });
s.addImage({ path: 'assets3/wm_black.png', x: (W - 6.2) / 2, y: 2.35, w: 6.2, h: 6.2 * IM.wm_black[1] / IM.wm_black[0] });
s.addText('Identidade, primeira rodada', { x: 0.55, y: H - 0.78, w: 5, h: 0.3, fontFace: 'Arial', fontSize: 11, color: INK, margin: 0 });
s.addText('THE FORCE, AGOSTO 2026', { x: W - 4.55, y: H - 0.78, w: 4, h: 0.3, align: 'right', fontFace: 'Arial', fontSize: 10, color: MUT, margin: 0, charSpacing: 2 });

// ---------- 2 ÍNDICE ----------
s = base(p.addSlide());
label(s, 'ÍNDICE', 0.55, 0.55);
const idxDims = { '01': [706, 101], '02': [713, 81], '03': [596, 81], '04': [603, 81], '05': [749, 102], '06': [550, 81], '07': [1052, 101] };
let iy = 1.3;
Object.keys(idxDims).forEach(n => {
  const [pw, ph] = idxDims[n];
  const hh = 0.72 * ph / 102;
  s.addImage({ path: `assets4/idx_${n}.png`, x: 0.55, y: iy + (0.72 - hh), w: hh * pw / ph, h: hh });
  iy += 0.85;
});

// ---------- 3 ESTRATÉGIA ----------
s = base(p.addSlide());
label(s, '01 CONCEITO', 0.55, 0.55);
disp(s, 'assets4/t_conceito.png', 1563, 359, 0.52, 1.6, 7.8);
body(s, 'A Téra é uma caixa de superposição: fechada, contém todos os mundos possíveis ao mesmo tempo. Abrir a sala é escolher um. Cada espetáculo é um estado da Téra que se manifesta quando ela abre.', 8.65, 1.65, 4.1, 1.8, { fontSize: 12.5, lineSpacing: 19 });
[['A caixa', 'A sala: um volume preto de LED contínuo que contém mundos.'],
 ['A observação', 'Abrir é o gesto da marca. A plataforma verbal e a física são a mesma frase.'],
 ['A magnitude', 'Tera, o prefixo da escala. O extraordinário que cabe dentro da caixa.']].forEach((a, i) => {
  const y = 4.1 + i * 0.95;
  s.addText(a[0], { x: 8.65, y, w: 4.0, h: 0.3, fontFace: 'Arial', fontSize: 11.5, bold: true, color: INK, margin: 0 });
  body(s, a[1], 8.65, y + 0.32, 4.1, 0.6, { fontSize: 10.5, color: '555555', lineSpacing: 14 });
});

// ---------- 4 WORDMARK antes/depois ----------
s = base(p.addSlide());
label(s, '02 WORDMARK', 0.55, 0.55);
disp(s, 'assets4/t_wordmark.png', 1073, 333, 0.52, 1.35, 5.3);
label(s, 'ESBOÇO DO BRIEFING', 0.55, 3.65);
s.addImage({ path: 'assets2/wordmark_black.png', x: 0.55, y: 4.05, w: 3.2, h: 3.2 * 360 / 832, transparency: 45 });
label(s, 'REDESENHO', 4.9, 3.65);
s.addImage({ path: 'assets3/wm_black.png', x: 4.9, y: 3.95, w: 5.7, h: 5.7 * IM.wm_black[1] / IM.wm_black[0] });
[['Monoline com modulação óptica', 'Traço único recalibrado nas junções pra ler limpo de 12 px ao painel.'],
 ['Ligadura resolvida', 'O olho do é e o acento se separam: a letra lê, o gesto permanece.'],
 ['Acento vertical', 'O risco reto vira a assinatura da marca e o gatilho de todo o sistema.']].forEach((n, i) => {
  const x = 0.55 + i * 4.2;
  s.addText(n[0], { x, y: 6.05, w: 3.9, h: 0.3, fontFace: 'Arial', fontSize: 11, bold: true, color: INK, margin: 0 });
  body(s, n[1], x, 6.37, 3.85, 0.7, { fontSize: 10, color: '555555', lineSpacing: 13.5 });
});

// ---------- 5 CONSTRUÇÃO ----------
s = base(p.addSlide());
label(s, '02 WORDMARK', 0.55, 0.55);
disp(s, 'assets4/t_construcao.png', 1277, 342, 0.52, 1.35, 6.4);
s.addImage({ path: 'assets3/construction.png', x: 1.4, y: 3.2, w: 10.5, h: 10.5 * IM.construction[1] / IM.construction[0] });
body(s, 'Todas as curvas nascem de quatro círculos e uma régua de alturas. O acento vive numa faixa própria acima da ascendente: presença garantida em qualquer escala.', 1.4, 6.75, 10.5, 0.6, { fontSize: 11, color: '555555', lineSpacing: 15, align: 'left' });

// ---------- 6 NEGATIVO (respiro preto) ----------
s = base(p.addSlide(), DARK);
s.addImage({ path: 'assets3/wm_white.png', x: (W - 7.2) / 2, y: (H - 7.2 * IM.wm_black[1] / IM.wm_black[0]) / 2 - 0.2, w: 7.2, h: 7.2 * IM.wm_black[1] / IM.wm_black[0] });
label(s, 'O WORDMARK EM NEGATIVO', 0.55, H - 0.95, { color: '9A9AA2' });

// ---------- 7 SÍMBOLO ----------
s = base(p.addSlide());
label(s, '03 SÍMBOLO', 0.55, 0.55);
disp(s, 'assets4/t_simbolo.png', 1083, 368, 0.52, 1.4, 5.0);
body(s, 'O é isolado vira o símbolo da Téra. Funciona onde o wordmark não cabe: ícone, carimbo, sinalização, canhoto de ingresso. É a assinatura mínima da caixa.', 0.55, 3.85, 5.2, 1.6, { fontSize: 12.5, lineSpacing: 19 });
s.addImage({ path: 'assets3/monogram_black.png', x: 6.6, y: 1.5, w: 2.5, h: 2.5 * IM.monogram_black[1] / IM.monogram_black[0] });
card(s, 'assets4/ap_icon.png', 900, 900, 10.0, 1.55, 2.6, 'Ícone de app');

// ---------- 8 LOCKUPS + CLEAR SPACE ----------
s = base(p.addSlide());
label(s, '03 LOCKUPS E USO', 0.55, 0.55);
label(s, 'LOCKUP COM DESCRITOR', 0.55, 1.15);
disp(s, 'assets4/lockup_desc_black.png', 1458, 649, 0.55, 1.55, 4.6);
label(s, 'ÁREA DE PROTEÇÃO', 6.6, 1.15);
disp(s, 'assets4/clearspace.png', 1658, 941, 6.6, 1.5, 5.6);
label(s, 'TAMANHOS MÍNIMOS', 0.55, 4.9);
disp(s, 'assets4/minsizes.png', 1700, 620, 0.55, 5.3, 6.6);

// ---------- 9 O PLANO ----------
s = base(p.addSlide());
label(s, '04 SISTEMA', 0.55, 0.55);
disp(s, 'assets4/t_plano.png', 768, 153, 0.52, 1.45, 4.2);
label(s, 'O DEVICE', 0.55, 3.35);
body(s, 'Um retângulo na proporção exata do painel da sala. Ele contém, corta e revela: imagem e conteúdo só existem dentro do Plano, tipografia muda de cor ao atravessar. Antes do conteúdo, o Plano é um void preto: o palco apagado.', 0.55, 3.7, 5.3, 1.9, { fontSize: 12.5, lineSpacing: 19 });
label(s, 'COMPORTAMENTO', 0.55, 5.55);
body(s, 'Fechada, a caixa é um void preto: todos os estados ao mesmo tempo. Em motion, ela abre por fresta e resolve num mundo. A proporção final trava na spec do painel.', 0.55, 5.9, 5.3, 1.1, { fontSize: 11.5, color: '444444', lineSpacing: 17 });
disp(s, 'assets3/diag_plano.png', 1400, 800, 6.5, 2.1, 6.4);

// ---------- 11 PROGRAMA ----------
s = base(p.addSlide());
label(s, '04 SISTEMA', 0.55, 0.55);
disp(s, 'assets4/t_programa.png', 1167, 325, 0.52, 1.45, 5.6);
label(s, 'TIPOGRAFIA', 0.55, 3.95);
body(s, 'Neo-grotesk como base do programa (Space Grotesk nesta rodada), metadados tratados como matéria gráfica. Na fase de identidade, avaliamos cortar uma Téra Sans derivada do DNA do wordmark.', 0.55, 4.3, 5.6, 1.6, { fontSize: 12, lineSpacing: 18 });
label(s, 'COR', 6.95, 3.95);
[['111111', 'preto'], ['FFFFFF', 'branco'], [GREEN, 'fósforo']].forEach((c, i) => {
  const x = 6.95 + i * 1.0;
  s.addShape('rect', { x, y: 4.3, w: 0.85, h: 0.85, fill: { color: c[0] }, line: { color: 'CCCCCC', width: 0.75 } });
  s.addText(c[1], { x, y: 5.21, w: 0.9, h: 0.25, fontFace: 'Arial', fontSize: 9, color: MUT, margin: 0 });
});
body(s, 'Preto, branco e uma assinatura só. O fósforo é a luz de dentro da caixa: o sinal de aberta, links, a fresta. Cor de verdade é papel do estado dentro da caixa.', 6.95, 5.6, 5.6, 1.2, { fontSize: 12, lineSpacing: 18 });

// ---------- VOZ: PLATAFORMA VERBAL ----------
s = base(p.addSlide());
label(s, '04 SISTEMA, VOZ', 0.55, 0.55);
disp(s, 'assets4/t_voz.png', 1100, 144, 0.52, 1.62, 5.9);
body(s, 'Um verbo só carrega a marca, e ele é o ato de observação da caixa: abrir é escolher um mundo. A plataforma flexiona do institucional ao coloquial sem trocar de voz, e cada estado, data e programa entra na frase.', 0.55, 2.6, 5.6, 1.4, { fontSize: 12.5, lineSpacing: 19 });
const flex = [
  'A Téra abre dimensões.',
  'A Téra abre temporada.',
  'A Téra abre: Estado 001.',
  'A Téra abre dia 18, às 21h.',
  'A Téra abre pra você.',
  'Abriu a Téra.',
];
flex.forEach((f, i) => {
  s.addText(f, { x: 7.2, y: 1.5 + i * 0.72, w: 5.8, h: 0.5, fontFace: 'Arial', fontSize: i === flex.length - 1 ? 15 : 15, bold: i === 0, color: INK, margin: 0 });
});
label(s, 'PRINCÍPIOS', 0.55, 4.55);
body(s, 'Sempre no presente. Sempre a Téra como sujeito. O nome nunca conjuga sozinho: quem abre é a sala, a obra entra depois dos dois pontos. Bilíngue quando o público pede: Téra opens.', 0.55, 4.9, 5.6, 1.6, { fontSize: 11.5, color: '444444', lineSpacing: 17 });

// ---------- 12 APLICAÇÕES intro ----------
s = base(p.addSlide());
label(s, '05 APLICAÇÕES', 0.55, 0.55);
disp(s, 'assets4/t_aplicacoes.png', 856, 335, 0.52, 2.3, 5.6);
body(s, 'Poster, OOH, ingresso, social, site, ícone e sinalização: o mesmo sistema, sem exceções. O que muda é o conteúdo; o que segura é o Plano, o acento e a régua tipográfica.', 0.55, 5.1, 7.6, 1.2, { fontSize: 13, lineSpacing: 20 });

// ---------- 13 POSTERS ----------
s = base(p.addSlide(), GREY);
label(s, '05 APLICAÇÕES, POSTER', 0.55, 0.55);
card(s, 'assets4/ap_poster_void.png', 1350, 1800, 1.7, 1.25, 4.05, 'Temporada, positivo');
card(s, 'assets4/ap_poster_neg.png', 1350, 1800, 7.6, 1.25, 4.05, 'Institucional, negativo');

// ---------- SÉRIE DE ESTADOS ----------
s = base(p.addSlide(), GREY);
label(s, '05 APLICAÇÕES, A SÉRIE', 0.55, 0.55);
disp(s, 'assets4/t_estados.png', 977, 335, 0.52, 1.0, 3.4);
card(s, 'assets4/estados_strip.png', 4170, 1800, 2.0, 2.5, 9.3, 'Mesma moldura, estados diferentes: a superposição como sistema editorial');
body(s, 'O layout nunca muda. O que muda é o estado dentro da caixa.', 0.55, 6.9, 8, 0.35, { fontSize: 10.5, color: '777777' });

// ---------- 14 OOH ----------
s = base(p.addSlide(), GREY);
label(s, '05 APLICAÇÕES, OOH', 0.55, 0.55);
card(s, 'assets4/ap_ooh.png', 2400, 1100, 1.65, 2.05, 10.0, 'A tipografia atravessa o Plano');

// ---------- 15 INGRESSO + SOCIAL ----------
s = base(p.addSlide(), GREY);
label(s, '05 APLICAÇÕES, INGRESSO E SOCIAL', 0.55, 0.55);
card(s, 'assets4/ap_ticket.png', 1900, 760, 2.9, 1.2, 7.5, 'Ingresso');
card(s, 'assets4/ap_social.png', 3328, 1080, 1.65, 4.6, 10.0, 'Social: anúncio, obra, ao vivo');

// ---------- 16 SITE ----------
s = base(p.addSlide(), GREY);
label(s, '05 APLICAÇÕES, DIGITAL', 0.55, 0.55);
card(s, 'assets4/ap_site.png', 2400, 1500, 2.45, 1.35, 8.4, 'tera.art.br');

// ---------- 17 ÍCONE + WAYFINDING ----------
s = base(p.addSlide(), GREY);
label(s, '05 APLICAÇÕES, AMBIENTE', 0.55, 0.55);
card(s, 'assets4/ap_way.png', 850, 1750, 2.6, 1.3, 2.65, 'Sinalização');
card(s, 'assets4/ap_icon.png', 900, 900, 7.1, 1.85, 3.6, 'Ícone');

// ---------- SALA A ----------
s = base(p.addSlide(), DARK);
label(s, '05 APLICAÇÕES, A SALA', 0.55, 0.55, { color: '9A9AA2' });
s.addImage({ path: 'assets4/sala_compA.png', x: 1.75, y: 1.05, w: 9.85, h: 9.85 * 893 / 1584 });
s.addText('Estados na sala: a caixa quase apagada, a primeira luz atravessando o conteúdo.', { x: 1.75, y: 6.75, w: 10.6, h: 0.35, fontFace: 'Arial', fontSize: 11, color: 'C8C8CC', margin: 0 });

// ---------- SALA B ----------
s = base(p.addSlide(), DARK);
label(s, '05 APLICAÇÕES, A SALA', 0.55, 0.55, { color: '9A9AA2' });
s.addImage({ path: 'assets4/sala_compB.png', x: 0.55, y: 1.75, w: 6.1, h: 6.1 * 893 / 1584 });
s.addText('A tipografia em escala de sala', { x: 0.55, y: 1.75 + 6.1 * 893 / 1584 + 0.12, w: 6, h: 0.3, fontFace: 'Arial', fontSize: 10, color: '9A9AA2', margin: 0 });
s.addImage({ path: 'assets4/sala_compC.png', x: 6.85, y: 1.75, w: 6.1, h: 6.1 * 893 / 1584 });
s.addText('O sistema emoldura a obra', { x: 6.85, y: 1.75 + 6.1 * 893 / 1584 + 0.12, w: 6, h: 0.3, fontFace: 'Arial', fontSize: 10, color: '9A9AA2', margin: 0 });

// ---------- 18 MOTION ----------
s = base(p.addSlide());
label(s, '06 MOTION', 0.55, 0.55);
disp(s, 'assets4/t_motion.png', 1408, 309, 0.52, 1.35, 6.2);
disp(s, 'assets4/storyboard.png', 3344, 730, 0.55, 3.5, 12.25);
body(s, 'A caixa é a origem de todo movimento: fechada, fresta, aberta, habitada, assinada. Nada aparece por fade ou corte: todo estado é revelado por abertura. Easing seco, paralaxe como única regra de profundidade, nada gira em 3D, nada tem textura.', 0.55, 6.45, 11.5, 0.85, { fontSize: 11.5, color: '444444', lineSpacing: 16 });

// ---------- 19 CONTEÚDO ----------
s = base(p.addSlide());
label(s, '06 PROGRAMA DE CONTEÚDO', 0.55, 0.55);
disp(s, 'assets4/t_conteudo.png', 1029, 335, 0.52, 1.45, 5.0);
body(s, 'A identidade é preta, branca e precisa de propósito: quem traz cor, imagem e matéria é o conteúdo, sempre dentro da caixa. A cada temporada a Téra comissiona um estado novo, de artistas do Sul Global, e o sistema o emoldura sem competir com ele.\n\nA identidade é a caixa. O estado é o espetáculo.', 0.55, 3.9, 5.4, 2.6, { fontSize: 12.5, lineSpacing: 19 });
const ppw = 5.9, pph = ppw * 9 / 32;
s.addShape('rect', { x: 6.85, y: 3.1, w: ppw, h: pph, fill: { color: DARK }, line: { type: 'none' } });
s.addText('Estado 001, em breve', { x: 7.15, y: 3.1 + pph - 0.55, w: 4, h: 0.3, fontFace: 'Arial', fontSize: 10.5, color: 'FAFAFA', margin: 0 });
s.addText('O Plano antes do conteúdo: o palco apagado.', { x: 6.85, y: 3.1 + pph + 0.15, w: 6, h: 0.3, fontFace: 'Arial', fontSize: 9.5, color: MUT, margin: 0 });

// ---------- 20 PRÓXIMOS PASSOS ----------
s = base(p.addSlide());
label(s, '07 PRÓXIMOS PASSOS', 0.55, 0.55);
disp(s, 'assets4/t_next.png', 1289, 307, 0.52, 1.4, 6.6);
[['01', 'Direção', 'Aprovação do sistema nesta rodada'],
 ['02', 'Identidade', 'Wordmark final, Téra Sans, sistema gráfico e verbal completo'],
 ['03', 'Engine', 'Plano e acento em motion, toolkit de temporada, Obra 001'],
 ['04', 'Brandbook', 'Manual de sistema: o estático e as regras do vivo']].forEach((st, i) => {
  const x = 0.55 + i * 3.14;
  s.addText(st[0], { x, y: 3.7, w: 1.4, h: 0.65, fontFace: 'Arial', fontSize: 30, bold: true, color: INK, margin: 0 });
  s.addText(st[1], { x, y: 4.45, w: 2.8, h: 0.35, fontFace: 'Arial', fontSize: 14, bold: true, color: INK, margin: 0 });
  body(s, st[2], x, 4.85, 2.75, 1.3, { fontSize: 11, color: '555555', lineSpacing: 15 });
});

p.writeFile({ fileName: 'tera_v4.pptx' }).then(() => console.log('written'));
