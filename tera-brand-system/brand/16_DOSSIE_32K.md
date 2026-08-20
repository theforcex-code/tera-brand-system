# TÉRA — Dossiê 32K e Spec do Painel (R1)

> **Workstream:** WS-C do `13_PLANO_NOTA5.md` → responde às lacunas apontadas na auditoria (`10_AUDITORIA.md`, Dimensões 2 e 6): o superlativo "maior painel de LED indoor da América Latina, com resolução de 32K" não tem substanciação documentada, e a proporção do painel não tem spec.
>
> **Método:** levantamento web (ago/2026) dos maiores painéis/telas de LED *indoor* da América Latina e dos benchmarks globais, com fonte linkada em cada dado. Toda dedução que extrapola as fontes está marcada *(inferência)*. Nenhum dado do painel da Téra foi confirmado pelo cliente — este dossiê define **o que a alegação precisa provar** e **como redigi-la com segurança** enquanto a spec não chega.
>
> **Conclusão executiva:** a alegação é *provavelmente defensável* — o maior painel de LED indoor verificado na América Latina hoje tem ~700 m² (placar central da Arena Ciudad de México), e nenhuma instalação do continente opera perto de uma classe de resolução "32K". Mas ela só pode ir a kit de imprensa **com a spec real anexada** (m² + mapa de pixels + data), porque (a) o título "maior da América Latina" já é disputado por fachadas, rooftops e telões temporários que a imprensa confunde com indoor, e (b) "32K" não tem padrão de mercado para telas fora de 16:9 — sem o número de pixels, a alegação é inauditável.

---

## 1. A alegação sob auditoria

O briefing e todo o sistema verbal da marca (02, 03, 05, 06, 09) repetem a fórmula fixa:

> *"o maior painel de LED indoor da América Latina, com resolução de 32K"*

O que falta para essa frase sobreviver à Fase 2 (Autoridade), quando imprensa e concorrentes vão testá-la:

1. **Maior em quê?** Área (m²)? Resolução (pixels)? Largura? A métrica não está declarada.
2. **Contra quem?** Não existe levantamento comparativo — este dossiê é a primeira versão dele.
3. **32K segundo qual definição?** O único padrão documentado de "32K" é 30.720 × 17.280 px (16:9) — ver [Wikipedia — 32K resolution](https://en.wikipedia.org/wiki/32K_resolution). Um painel de sala de espetáculos não é 16:9; sem o mapa de pixels real, "32K" é rótulo de marketing, não spec.
4. **Desde quando e até quando?** Superlativos têm janela de validade (ver §6).

---

## 2. Levantamento — os maiores LED *indoor* da América Latina (ago/2026)

### 2.1 Arenas e casas de espetáculo

| Instalação | Local | Área / dimensões | Resolução | Observação | Fonte |
|---|---|---|---|---|---|
| **Arena Ciudad de México — placar central interno** | CDMX, México | **~600–700 m²** (fontes divergem) | não publicada; "barra LED 125 mm" sugere pitch grosso, resolução baixa *(inferência)* | O maior display indoor verificado da América Latina. A mesma arena tem fachada externa de ~6.200 m² — número que a imprensa mistura com o interno (o ranking da Linsn lista "5.990,8 m² indoor", quase certamente a fachada externa *(inferência)*) | [Expansión/Obras](https://obras.expansion.mx/arquitectura/2020/02/25/arena-ciudad-de-mexico-cumple-como-fue-su-construccion), [Audiala](https://audiala.com/es/mexico/ciudad-de-mexico/arena-ciudad-de-mexico), [Linsn — Top 10](https://www.linsnled.com/es/top-10-the-largest-led-displays-in-the-world.html) |
| **Movistar Arena** | Bogotá, Colômbia | **~200 m²** (tela interna; há outra de 200 m² na fachada) | não publicada | Arena de 14.000 lugares, reformada em 2018 | [El Tiempo](https://www.eltiempo.com/bogota/como-sera-el-movistar-arena-de-bogota-206624), [Pulzo](https://www.pulzo.com/economia/asi-quedo-nuevo-movistar-arena-bogota-PP565611) |
| **Qualistage** | Rio de Janeiro, Brasil | não publicada ("enorme painel de LED" cenográfico) | não publicada | Casa de 9.000 lugares no Via Parque; usa o painel como cenografia interativa, sem spec pública | [Qualistage](https://qualistage.com.br/), [Time Out Rio](https://www.timeout.com/pt/rio-de-janeiro/coisas-para-fazer/qualistage) |
| **Espaço Unimed** | São Paulo, Brasil | não publicada (telões de LED no rider da casa) | não publicada | Casa de 8.000 lugares; nenhuma alegação de recorde encontrada | [Espaço Unimed](https://www.espacounimed.com.br/sobre-o-espaco/) |
| **Torcida N1** (temporário, Copa 2026) | Jockey Club, São Paulo | **specs não divulgadas** — anunciado como "o maior telão do Brasil" | não publicada | Ativação temporária da THE LED para a Copa de 2026; sem números públicos, e não é instalação permanente *(inferência)* | [Grandes Nomes da Propaganda](https://grandesnomesdapropaganda.com.br/destaques/the-led-instala-o-maior-telao-do-brasil-no-torcida-n1/) |

### 2.2 Estúdios de produção virtual (LED volumes)

| Instalação | Local | Área de LED | Resolução | Observação | Fonte |
|---|---|---|---|---|---|
| **Estúdios Globo — estúdio de produção virtual** | Rio de Janeiro | **+300 m² de telas LED** (estúdio de 1.500 m²) | não publicada | Anunciado como o maior estúdio de produção virtual da América Latina | [O Planeta TV](https://oplanetatv.clickgratis.com.br/noticias/bastidores/estudios-globo-inauguram-o-maior-estudio-de-producao-virtual-da-america-latina.html) |
| **Casablanca Content (complexo Record)** | Rio de Janeiro | **125 m² de LED** (estúdio de 1.000 m²) | não publicada | Divulgado como maior estúdio dedicado a produção virtual da região | [Panorama Audiovisual](https://panoramaaudiovisual.com.br/the-led-apresenta-com-exclusividade-no-brasil-a-tecnologia-ghostframe-da-roe-visual/), [Rio Film Commission](https://www.riofilmcommission.com/locacoes/casa-blanca/) |
| **555 Studios + O2 Filmes** | São Paulo | 650 m² de instalação; volume principal "**555 Volume 6K**" | 6K | Primeiro estúdio especializado em VP do Brasil | [Jornal de Brasília](https://jornaldebrasilia.com.br/blogs-e-colunas/analice-nicolau/primeiro-estudio-especializado-em-producao-virtual-do-brasil-e-inaugurado-pela-555-studios-em-parceria-com-a-o2-filmes/) |

### 2.3 Varejo, corporativo e cultura

| Instalação | Local | Área / dimensões | Resolução | Observação | Fonte |
|---|---|---|---|---|---|
| **Bolsa Mexicana de Valores — tela curva indoor** | CDMX, México | 54 m de perímetro (curva) | não publicada | Em 2015 foi anunciada pelo fabricante como "a maior tela LED indoor instalada na América Latina" — mostra que o título já foi reivindicado antes | [Digital AV Magazine](https://www.digitalavmagazine.com/2015/05/27/wavetec-instala-una-pantalla-led-indoor-curva-de-54-metros-en-la-bolsa-mexicana-de-valores/) |
| **Samsung The Wall — Parque La Colina** | Bogotá, Colômbia | 172" (~4,0 × 2,3 m) | MicroLED | "Maior tela MicroLED da América Latina" — recorde de *tecnologia*, não de escala | [Samsung Newsroom](https://news.samsung.com/co/samsung-instala-en-colombia-la-pantalla-micro-led-mas-grande-de-america-latina) |
| **Samsung Onyx (cinema LED)** | São Paulo, Brasil | tela de sala de cinema | 4K | Primeira tela de LED de cinema do Brasil — classe de tamanho muito abaixo | [Samsung Newsroom](https://news.samsung.com/br/primeira-tela-led-de-cinema-samsung-onyx-chega-ao-brasil) |
| Salas imersivas comerciais (cubos de LED/projeção 360°) | Brasil, diversos | tipicamente salas de ~5×5 m; locação de eventos | variada | Mercado brasileiro de "sala imersiva" opera em escala de showroom — nenhuma instalação permanente de grande porte em LED foi encontrada *(inferência)* | [Vita.art](https://www.vita.art.br/post/sala-imersiva-proje%C3%A7%C3%A3o-360-graus), [THE LED](https://theled.com.br/exposicao-imersiva/) |

### 2.4 Casos-fronteira que a imprensa confunde com "indoor" (ameaças à alegação)

Estes NÃO são indoor, mas todos já reivindicaram "maior da América Latina" — o kit de imprensa da Téra precisa saber respondê-los:

| Instalação | Local | Área | Por que não compete | Fonte |
|---|---|---|---|---|
| **Fachada da Arena Ciudad de México** | CDMX | ~6.200 m² | Fachada externa (outdoor) | [Expansión/Obras](https://obras.expansion.mx/arquitectura/2020/02/25/arena-ciudad-de-mexico-cumple-como-fue-su-construccion) |
| **Boulevard.Live** | Brasília | 68 × 16,5 m (~1.120 m²) | Painel publicitário outdoor | [LedWave](https://ledwave.com.br/blog/boulevard-live-o-maior-painel-de-led-da-america-latina/) |
| **Conic** | Brasília | ~1.000 m² | Fachada de edifício (outdoor) | [Gazeta de Pinheiros](https://gazetadepinheiros.com.br/noticia/5809/flap-transforma-maior-painel-de-led-da-america-latina-em-tela-de-video-game-para-o-geekverse-festival) |
| **Floripa Square** | Florianópolis | 350 m² (curva) | Rooftop, não indoor | [Mundo Conectado](https://www.mundoconectado.com.br/noticias/floripa-square-florianopolis-tera-maior-tela-led-em-cobertura-da-america-latina/), [Carbon Free Brasil](https://carbonfreebrasil.com/blog/case-de-sucesso-floripa-square/) |
| **Forum Mundo Imperial** | Acapulco | fachada de 2.060 m² com 4.985 luminárias | Iluminação arquitetural de LED, não tela de exibição | [Iluminet](https://iluminet.com/forum-imperial-el-show-de-los-leds-en-acapulco/), [Wikipedia](https://es.wikipedia.org/wiki/F%C3%B3rum_de_Mundo_Imperial) |

### 2.5 Projetos anunciados (relógio correndo contra o superlativo)

- **"Imagine" — Parque Olímpico, Rio de Janeiro (previsto 2028):** complexo de entretenimento de 56 mil m² com "imensa tela LED de 360 graus" anunciada, sem specs publicadas. Se entregue como anunciado, disputará o título depois da abertura da Téra (set/2027) — ver §6. Fonte: [NiT](https://www.nit.pt/fora-de-casa/viagens/maior-complexo-de-entretenimento-da-america-latina-vai-nascer-no-rio-de-janeiro).

---

## 3. Benchmarks globais (contexto para a imprensa)

| Instalação | Local | Área | Resolução | Relevância para a Téra | Fonte |
|---|---|---|---|---|---|
| **Sphere** | Las Vegas, EUA | **~15.000 m²** internos (160.000 sq ft) | **16K × 16K** (~256 milhões de px) — a maior E mais alta resolução do mundo | O teto global. A Téra não compete em área; se o "32K" da Téra significar >30 mil px de largura, a Téra supera o Sphere em resolução *horizontal* — alegação de peso mundial que exige prova rigorosa *(inferência, ver §4)* | [VFX Voice](https://vfxvoice.com/las-vegas-sphere-worlds-largest-high-res-led-screen-for-live-action-and-vfx/), [Hollywood Reporter](https://www.hollywoodreporter.com/business/business-news/las-vegas-sphere-design-technology-led-screens-1235594308/), [Hackaday](https://hackaday.com/2026/08/03/the-16k-display-that-ate-las-vegas/) |
| **MSG Sphere London** (engavetado) | Londres, UK | — | **32K planejado** ("maior e mais alta resolução do mundo") | O único "32K" já prometido pela indústria — e nunca construído. Se a spec da Téra confirmar 32K, a Téra entrega o que o Sphere de Londres só prometeu — ângulo de pauta fortíssimo *(inferência)* | [Wikipedia — 32K resolution](https://en.wikipedia.org/wiki/32K_resolution) |
| **Outernet — The Now Building** | Londres, UK | **~2.100–2.260 m²**, 4 andares, 360°, piso a teto | 16K (canvas envolvente) | O análogo mais próximo do modelo Téra no mundo: LED indoor envolvente permanente, uso cultural/comercial, no centro da cidade; aberto em 2022 | [Installation International](https://www.installation-international.com/technology/displays-signage/outernet-london-partners-with-ventuz-for-worlds-largest-led-screen-in-the-now-building), [8K Association](https://8kassociation.com/outernet-a-new-display-centric-experience-in-london/), [Wikipedia](https://en.wikipedia.org/wiki/Outernet_London) |
| **SoFi Stadium — Infinity Screen** | Inglewood, EUA | ~6.500 m² (dupla face) | 4K | Maior placar de estádio; ambiente coberto mas aberto | [Linsn — Top 10](https://www.linsnled.com/es/top-10-the-largest-led-displays-in-the-world.html) |
| **Dubai Mall (tela indoor)** | Dubai, EAU | 50 × 14 m (~700 m²) | não publicada | Referência de "maior LED indoor" em varejo global — mesma ordem de grandeza do placar da Arena CDMX | [Linsn — fabricantes Brasil](https://www.linsnled.com/pt/led-screen-display-manufacturers-in-brazil.html) |
| **Resorts World / Fremont Street** | Las Vegas, EUA | 15.016 m² / 12.000 m² | 4K / 6K | Gigantes outdoor — úteis só para mostrar que "maior" sem qualificador é sempre contestável | [Linsn — Top 10](https://www.linsnled.com/es/top-10-the-largest-led-displays-in-the-world.html) |

**Leitura do contexto global:** entre o teto absoluto (Sphere, 15.000 m²) e o análogo cultural mais próximo (Outernet, ~2.200 m²), existe uma faixa vazia. Se o painel da Téra tiver entre 1.000 e 5.000 m² *(hipótese não confirmada — inferência)*, ela entra no mapa global como a instalação intermediária de maior resolução — e domina com folga o recorte latino-americano.

---

## 4. Onde a alegação é defensável

### (a) A métrica

| Métrica | O que precisa ser verdade | Grau de defesa |
|---|---|---|
| **Área (m²), indoor, permanente** | Painel > **~700 m²** (placar interno da Arena CDMX, maior indoor verificado do continente) | **Alto**, se a spec confirmar. A barra é mais baixa do que parece — nada verificado no continente passa de ~700 m² indoor. Recomendado exigir folga: > 1.000 m² torna a defesa confortável contra medições contestadas *(inferência)* |
| **Resolução (pixels totais / largura em px)** | Mapa de pixels real compatível com a classe "32K" (o padrão 16:9 é 30.720 × 17.280; para o painel real, publicar L × A em px) | **Altíssimo e é a métrica mais exclusiva** — nenhuma instalação da América Latina opera perto disso (o recorde regional efetivo em volumes de VP é "6K"); no mundo, só o Sphere (16K × 16K) está acima em pixels totais. Se "32K" for largura real, a Téra teria a maior resolução horizontal do planeta *(inferência — depende 100% da spec)* |
| **Qualificador de uso: sala de espetáculos / uso cultural permanente** | Nenhuma sala de espetáculos do continente tem LED nessa classe (verificado: Arena CDMX ~700 m² é placar suspenso, não superfície cênica) | **Alto** — e é o qualificador que melhor serve à marca, porque devolve o assunto à vocação (a tela a serviço de obras), não ao recorde *(inferência)* |

**Recomendação:** ancorar o superlativo em **área** (métrica auditável e intuitiva) e usar **resolução** como segunda linha de prova; nunca alegar recorde de resolução mundial sem o mapa de pixels assinado pelo fabricante. A definição operacional que blinda a alegação: *"tela de exibição contínua, instalada em ambiente fechado, em operação permanente"* — exclui fachadas (Conic, Boulevard, Arena CDMX externa), rooftops (Floripa Square), iluminação arquitetural (Forum Mundo Imperial) e ativações temporárias (Torcida N1).

### (b) Redação defensável para kit de imprensa

**Com superlativo (só após spec confirmada; sempre com números acoplados):**

> *"A Téra abriga o maior painel de LED indoor da América Latina: [X] m² de tela contínua com resolução de 32K ([L] × [A] pixels), instalado permanentemente em um edifício histórico regenerado do complexo Mata São Paulo."*
> EN: *"Téra houses the largest indoor LED installation in Latin America: [X] m² of continuous display at 32K resolution ([W] × [H] pixels)."*

Acompanhada, no kit, de **nota de substanciação** (1 parágrafo + tabela): metodologia ("tela de exibição contínua, indoor, permanente"), os três maiores comparáveis (Arena CDMX ~700 m², Estúdios Globo +300 m², Movistar Arena 200 m²) com fontes, e data de referência ("na data de abertura, setembro de 2027"). Superlativo com anexo de prova não gera pauta contra — gera pauta a favor *(inferência)*.

**Sem superlativo (defesa integral, zero exposição):**

> *"A Téra abriga um painel de LED indoor de [X] m² com resolução de 32K — uma infraestrutura sem precedente em salas de espetáculo da América Latina."*

**Variante por resolução (se a área não garantir o título, mas o pixel map sim):**

> *"A Téra abriga o painel de LED indoor de maior resolução da América Latina: 32K — [L] × [A] pixels em [X] m² de tela contínua."*

### (c) Fallback prudente (se a spec real não confirmar nenhum recorde)

1. **Nunca corrigir publicamente** — a alegação ainda não foi a público (a regra da Fase 1 proíbe falar da tela), então basta não estrear o superlativo *(inferência a partir do cronograma do briefing)*.
2. Redação de recuo, ainda monumental e 100% factual:
   > *"[X] m² de LED contínuo, resolução de 32K, a serviço de obras comissionadas — uma escala que nenhuma sala de espetáculos do continente oferece como superfície de criação."*
3. Recuo máximo (se até o 32K cair): *"uma das maiores infraestruturas de LED indoor da América Latina"* — "uma das maiores" é juridicamente confortável e jornalisticamente aceito *(inferência)*.
4. Em qualquer cenário, manter a hierarquia da marca: **a tela nunca é a manchete final — é a prova da tese** ("a tela não é a obra"). O fallback verbal já está codificado no `05_VOZ.md` (proibido "maior do mundo"; fato exato ou nada).

---

## 5. Riscos e janela de validade do superlativo

| Risco | Descrição | Mitigação |
|---|---|---|
| **"32K" inauditável** | Sem pixel map, qualquer jornalista técnico pode perguntar "32K em qual eixo?" e não haverá resposta | Item 4 da Requisição de Spec (§7); até lá, 32K não vai a público |
| **Contestação por casos-fronteira** | Conic, Boulevard.Live, Floripa Square e Arena CDMX (fachada) já usam "maior da América Latina" na imprensa | Nota de substanciação com definição operacional (indoor + permanente + tela de exibição) publicada junto com a alegação |
| **Torcida N1 (2026)** | "Maior telão do Brasil" na Copa, meses antes do reveal — pode confundir a pauta | É temporário e (provavelmente) não-indoor *(inferência)*; a definição operacional resolve |
| **Projeto "Imagine" (Rio, 2028)** | Tela LED 360° anunciada; se entregue, pode superar a Téra ~1 ano após a abertura | **Datar a alegação** ("na abertura, set/2027") e re-verificar o levantamento a cada 12 meses; preparar transição para "primeiro/o de maior resolução" se necessário *(inferência)* |
| **Comparação involuntária com o Sphere** | "O Sphere paulistano" — leitura que a auditoria já aponta como destruidora do pilar de comissionamento | Nunca usar o Sphere como régua em material próprio; se perguntado, responder pela diferença de vocação (obras comissionadas vs. residências licenciadas), não pela diferença de metros |

---

## 6. Requisição de Spec do Painel (documento pronto para envio ao cliente)

> **Para:** Mata São Paulo / equipe do projeto Sala Abaixo (Téra)
> **De:** equipe de marca
> **Assunto:** Especificação técnica do painel de LED — insumo bloqueante para o sistema visual e para o kit de imprensa
> **Prazo sugerido:** antes do fechamento das peças da Fase 2 (Autoridade); a Fase 1 não depende (a regra "não mostrar a tela" nos cobre) *(inferência de cronograma)*

**Por que pedimos isso agora.** Dois produtos dependem diretamente destes dados: (1) o **sistema de identidade visual**, que precisa desenhar para o suporte mais importante da marca — a própria sala; e (2) o **kit de imprensa da Fase 2**, em que a alegação "maior painel de LED indoor da América Latina, 32K" será testada por jornalistas. Nosso levantamento (anexo) mostra que a alegação é provavelmente verdadeira — mas só é publicável com os números abaixo.

| # | O que precisamos | Formato | Por que importa (visual) | Por que importa (imprensa) |
|---|---|---|---|---|
| 1 | **Proporção exata** do painel (largura:altura) | ex.: 32:9, 4:1… | Define os formatos-master, grids e templates de todo o conteúdo da sala e das peças que a simulam | Descreve a sala com precisão em release e ficha técnica |
| 2 | **Dimensões físicas** (L × A em metros) e **geometria** (plano, curvo, envolvente; ângulos e cantos) | m + desenho/planta | Motion design, mockups e simulações fiéis; direção de arte site-specific | Permite as comparações tangíveis que jornalista adora ("equivale a N quadras") |
| 3 | **Área total** (m²) — e se é **uma superfície contínua** ou módulos com emendas | m² | Escala real nas simulações | É a métrica nº 1 do superlativo: precisa superar ~700 m² (Arena CDMX) — com folga, idealmente > 1.000 m² |
| 4 | **Resolução total em pixels** (L × A px) e **o que "32K" designa** (largura em px? diagonal? nomenclatura do fabricante?) | px × px | Pipeline de conteúdo: render em centenas de megapixels muda tudo (engines, codecs, playback) | Sem pixel map, "32K" é inauditável; com ele, pode ser recorde de classe mundial |
| 5 | **Pixel pitch** (mm) | mm | Espessuras mínimas de traço e corpo tipográfico legíveis na tela; distância mínima de visualização | Primeira pergunta de qualquer veículo técnico |
| 6 | **Fabricante, modelo dos módulos e integrador** | nome/modelo | Acesso a specs oficiais e perfis de cor | Credibiliza a alegação; abre co-release com o fabricante |
| 7 | **Brilho (nits), gama de cor, taxa de atualização (Hz)** | specs | Calibração das peças e da paleta (o subsolo/bioluminescência depende de pretos profundos) *(inferência)* | Ficha técnica completa para produtoras e riders de artistas |
| 8 | **Data de comissionamento** prevista | mês/ano | — | Data-stamp da alegação ("na abertura, set/2027") |
| 9 | **Autorização de divulgação por fase** — o que é confidencial até quando | lista | Define o que as peças podem mostrar | A Fase 1 proíbe a tela; precisamos saber quando cada dado libera |

**Política provisória (em vigor até a spec chegar):**

- O sistema visual está sendo construído **proporção-agnóstico**: masters em composição modular re-enquadrável, sem nenhuma peça amarrada a um formato de tela.
- Onde um placeholder é inevitável (simulações internas, testes de motion), usamos **32:9** como proporção provisória — assumida como hipótese de trabalho, nunca publicada *(inferência; corrigiremos sem custo quando a spec chegar)*.
- **Nenhuma peça pública cita dimensões, m², proporção ou pixels** até a spec assinada. O texto público continua usando apenas a fórmula do briefing — e, a partir da Fase 2, somente na versão substanciada deste dossiê (§4b).

---

## 7. Fontes consolidadas

- [Expansión/Obras — construção da Arena Ciudad de México](https://obras.expansion.mx/arquitectura/2020/02/25/arena-ciudad-de-mexico-cumple-como-fue-su-construccion) · [Audiala — guia Arena CDMX](https://audiala.com/es/mexico/ciudad-de-mexico/arena-ciudad-de-mexico) · [Wikipedia — Arena Ciudad de México](https://es.wikipedia.org/wiki/Arena_Ciudad_de_M%C3%A9xico)
- [Linsn — Top 10 maiores telas de LED do mundo](https://www.linsnled.com/es/top-10-the-largest-led-displays-in-the-world.html) · [Linsn — fabricantes no Brasil (ref. Dubai Mall)](https://www.linsnled.com/pt/led-screen-display-manufacturers-in-brazil.html)
- [El Tiempo — Movistar Arena Bogotá](https://www.eltiempo.com/bogota/como-sera-el-movistar-arena-de-bogota-206624) · [Pulzo — Movistar Arena](https://www.pulzo.com/economia/asi-quedo-nuevo-movistar-arena-bogota-PP565611)
- [O Planeta TV — Estúdios Globo, maior estúdio de VP da América Latina](https://oplanetatv.clickgratis.com.br/noticias/bastidores/estudios-globo-inauguram-o-maior-estudio-de-producao-virtual-da-america-latina.html) · [Panorama Audiovisual — Casablanca/Record + GhostFrame](https://panoramaaudiovisual.com.br/the-led-apresenta-com-exclusividade-no-brasil-a-tecnologia-ghostframe-da-roe-visual/) · [Rio Film Commission — Casablanca](https://www.riofilmcommission.com/locacoes/casa-blanca/) · [Jornal de Brasília — 555 Studios + O2](https://jornaldebrasilia.com.br/blogs-e-colunas/analice-nicolau/primeiro-estudio-especializado-em-producao-virtual-do-brasil-e-inaugurado-pela-555-studios-em-parceria-com-a-o2-filmes/)
- [Digital AV Magazine — tela curva indoor da Bolsa Mexicana (2015)](https://www.digitalavmagazine.com/2015/05/27/wavetec-instala-una-pantalla-led-indoor-curva-de-54-metros-en-la-bolsa-mexicana-de-valores/)
- [Samsung — The Wall Bogotá](https://news.samsung.com/co/samsung-instala-en-colombia-la-pantalla-micro-led-mas-grande-de-america-latina) · [Samsung — Onyx no Brasil](https://news.samsung.com/br/primeira-tela-led-de-cinema-samsung-onyx-chega-ao-brasil)
- [Grandes Nomes da Propaganda — Torcida N1](https://grandesnomesdapropaganda.com.br/destaques/the-led-instala-o-maior-telao-do-brasil-no-torcida-n1/)
- [LedWave — Boulevard.Live](https://ledwave.com.br/blog/boulevard-live-o-maior-painel-de-led-da-america-latina/) · [Gazeta de Pinheiros — Conic/GeekVerse](https://gazetadepinheiros.com.br/noticia/5809/flap-transforma-maior-painel-de-led-da-america-latina-em-tela-de-video-game-para-o-geekverse-festival) · [Mundo Conectado — Floripa Square](https://www.mundoconectado.com.br/noticias/floripa-square-florianopolis-tera-maior-tela-led-em-cobertura-da-america-latina/) · [Carbon Free Brasil — Floripa Square](https://carbonfreebrasil.com/blog/case-de-sucesso-floripa-square/)
- [Iluminet — Forum Mundo Imperial](https://iluminet.com/forum-imperial-el-show-de-los-leds-en-acapulco/) · [Wikipedia — Fórum de Mundo Imperial](https://es.wikipedia.org/wiki/F%C3%B3rum_de_Mundo_Imperial)
- [NiT — complexo "Imagine" no Rio (2028)](https://www.nit.pt/fora-de-casa/viagens/maior-complexo-de-entretenimento-da-america-latina-vai-nascer-no-rio-de-janeiro)
- [VFX Voice — Sphere Las Vegas](https://vfxvoice.com/las-vegas-sphere-worlds-largest-high-res-led-screen-for-live-action-and-vfx/) · [Hollywood Reporter — Sphere](https://www.hollywoodreporter.com/business/business-news/las-vegas-sphere-design-technology-led-screens-1235594308/) · [Hackaday — "The 16K Display That Ate Las Vegas"](https://hackaday.com/2026/08/03/the-16k-display-that-ate-las-vegas/)
- [Wikipedia — 32K resolution (inclui MSG Sphere London)](https://en.wikipedia.org/wiki/32K_resolution) · [JYLED — o que é 32K](https://www.szjy-led.com/32k-resolution/)
- [Installation International — Outernet London](https://www.installation-international.com/technology/displays-signage/outernet-london-partners-with-ventuz-for-worlds-largest-led-screen-in-the-now-building) · [8K Association — Outernet](https://8kassociation.com/outernet-a-new-display-centric-experience-in-london/) · [Wikipedia — Outernet London](https://en.wikipedia.org/wiki/Outernet_London)
- [Qualistage — site oficial](https://qualistage.com.br/) · [Time Out Rio — Qualistage](https://www.timeout.com/pt/rio-de-janeiro/coisas-para-fazer/qualistage) · [Espaço Unimed — sobre o espaço](https://www.espacounimed.com.br/sobre-o-espaco/)
- [Vita.art — salas imersivas 360°](https://www.vita.art.br/post/sala-imersiva-proje%C3%A7%C3%A3o-360-graus) · [THE LED — exposições imersivas](https://theled.com.br/exposicao-imersiva/)

---

*Dossiê R1 (WS-C) — levantamento web de ago/2026. Re-verificar o comparativo a cada 12 meses e imediatamente antes de qualquer publicação do superlativo. Nenhum dado do painel da Téra está confirmado; a alegação só vai a público na forma do §4 e com a spec do §6 anexada.*
