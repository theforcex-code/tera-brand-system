# Lab 02 · Areia

O wordmark **Téra** como areia interativa. Grãos de 1 pixel caem, escorregam e
assentam dentro das letras, e cada camada guarda a cor do instante em que caiu —
o logo cheio é um registro do tempo que levou para enchê-lo.

No ar: **[tera-areia.vercel.app](https://tera-areia.vercel.app)**

Quatro labs sobre a mesma matéria, do mais simples ao mais bruto:

| | arquivo | motor | matéria |
|---|---|---|---|
| **GPU** | `index.html` | WebGPU (compute shader) | 2 a 8 milhões de grãos |
| **WebGL** | `3d.html` | Three.js | ~620 mil grãos |
| **2D** | `2d.html` | Canvas 2D | ~200 mil grãos |
| **Faceta** | `faceta.html` | Three.js + traçado de contorno | logo lapidado, ~700 triângulos |

O WebGPU é a porta de entrada e as quatro versões ficam linkadas no topo de
todas elas. Sem suporte a WebGPU, essa página oferece a versão WebGL, que roda em
qualquer navegador.

E três formas de máscara, trocáveis por `?forma=` ou pelos botões da barra:

- `cliente` — o desenho original que o cliente mandou, com o "e" invertido
- `evoluido` — o wordmark do sistema, com o "e" redesenhado (padrão)
- `versal` — TÉRA em caixa alta bold, a forma que mais segura areia

## Rodar

Módulos ES puros, sem build. Basta um servidor estático:

```bash
python -m http.server 8123
```

Depois abra `http://localhost:8123/`. O lab GPU precisa de WebGPU — Chrome ou
Edge recentes, em contexto seguro (`localhost` ou HTTPS).

## O que vale ler no código

A física é o autômato do *This is Sand*: o grão tenta cair reto; se não dá,
escorrega para uma diagonal mais baixa. O interessante é o que cada versão
precisou inventar para escalar isso.

**`sand.js` (2D)** — o estado *é* o `ImageData`. Não existe uma estrutura de
grãos ao lado do desenho: o buffer de pixels é a simulação. Um bitmap de "grãos
acordados" (1 bit por célula) faz o custo ser proporcional ao que se move, não
ao tamanho da tela.

**`sand3d.js` (3D)** — a grade é indexada com **Y contíguo**
(`idx = y + ny*(x + nx*z)`), então uma queda anda 1 byte na memória. Com o
layout ingênuo cada queda pulava 43 KB e o passo custava 16,5 ms; assim, 2,05 ms.

**`gpu/sand-gpu.js` (WebGPU)** — uma thread por grão, e todo movimento é uma
reserva atômica de célula. Três armadilhas que custaram caro:

- **Nunca devolver um slot com `atomicSub`** num contador de alocação
  concorrente. Outra thread já pegou índice maior, o devolvido é reentregue, e o
  primeiro grão fica órfão com a célula marcada — a boca entope com um grão que
  não existe. A correção é reservar a CÉLULA primeiro e alocar o slot depois.
  Isso levou o preenchimento de 58% para 100%.
- **`atomicCompareExchangeWeak` falha espuriamente.** Na liberação da célula de
  origem isso deixa um fantasma permanente. E nunca liberar com `atomicStore`
  cego: apagaria a marca de quem reservou no meio.
- **O dispatch não pode encolher.** A leitura do contador chega atrasada; manter
  um contador de slots monotônico, senão os grãos de índice alto congelam.

**A cor não é RGB.** O buffer guarda o **índice da paleta** do instante em que o
grão nasceu; o vertex shader soma a esse índice o relógio e a camada Z antes de
ler a LUT. De graça, isso dá três coisas: a paleta rola para sempre (a animação
nunca acaba), cada camada de profundidade lê a paleta deslocada (o volume deixa
de ser uma extrusão chapada), e nada disso custa um passo de simulação.

**`faceta-main.js`** — o logo lapidado como objeto de metal escuro. O PNG é
binarizado, o contorno é perseguido célula a célula (arestas dirigidas com o
sólido sempre do mesmo lado — laços externos e furos fecham com sinais de área
opostos, a classificação sai de graça) e simplificado por Douglas-Peucker: os
degraus de pixel colapsam nas diagonais verdadeiras — o logo inteiro cabe em
~60 vértices. Daí ExtrudeGeometry com bisel e um ambiente PMREM de painéis
coloridos: as cores da paleta chegam nas faces como REFLEXO, não como tinta.
Armadilha que custou uma rodada: o far plane padrão do `fromScene` é 100, e
painéis mais distantes que isso são cortados — o ambiente sai preto e o metal
também.

**`wordmark.js`** resolve as três formas. A do cliente vem de um bitmap, não de
um vetor — foi o que ele mandou. Isso exigiu corte por luminância (o PNG tem
fundo branco opaco, então testar alfa aceitaria a folha inteira) e o viewBox
medido na caixa da tinta, para as três formas entrarem na mesma escala.

## Parâmetros

Tudo o que governa a simulação está em `params.js`, que é fonte única: gera o
painel (tecla **A**), o estado e a URL. Física, tempo e matéria são abertos —
gravidade, vento, rajada, talude, turbulência em Z, vazão, deriva de cor. Cada
cena cabe num link.

## Sobre os assets

O código é do lab. Os arquivos em `logo/` e a tipografia do wordmark são
material de marca da **Téra** e não estão sob a mesma licença do código — eles
estão aqui porque o lab os renderiza. As fontes em `fonts/` são
[Space Mono](https://fonts.google.com/specimen/Space+Mono) (SIL Open Font License).

---

Feito por [THE FORCE](https://theforce.cc).
