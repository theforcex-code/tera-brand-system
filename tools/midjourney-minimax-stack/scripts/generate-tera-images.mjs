#!/usr/bin/env node
// generate-tera-images.mjs — gera no Midjourney (via render stack) as imagens
// que ilustram os .md da marca Téra, baixa os PNGs finais pra assets/midjourney/
// e escreve o MANIFEST.md.
//
// Uso:
//   node generate-tera-images.mjs                # gera tudo que ainda não existe
//   node generate-tera-images.mjs --dry-run      # só lista os jobs
//   node generate-tera-images.mjs --only slug1,slug2
//   node generate-tera-images.mjs --force        # regenera mesmo se o PNG existir
//
// Regras de prompt (brief 04 + sistema visual 15):
//   - luz nasce do escuro; plasma só como matéria viva sobre preto
//   - sem clichês sci-fi, sem pixel de LED, sem lens flare, sem daylight
//   - pessoas só como silhueta/contraluz; NUNCA mostrar telas
//   - âmbar #C98F4A como temperatura da fotografia de arquitetura
//   - o backend acrescenta "--fast --s 50 --raw": prompts terminam só com --ar e --v 8

import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_URL = process.env.RENDER_STACK_BASE_URL || 'http://100.75.131.85:4173';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../../../tera-brand-system/assets/midjourney');
const MANIFEST = join(OUT_DIR, 'MANIFEST.md');

// ---------------------------------------------------------------------------
// O plano de imagens: slug → doc que ilustra → prompt Midjourney
// ---------------------------------------------------------------------------

const NEG = 'no text, no words, no letters, no watermark';

const JOBS = [
  // ========== BATCH 1 — IDENTIDADE VISUAL (brand/04_IDENTIDADE_BRIEF.md + 15_SISTEMA_VISUAL.md) ==========
  {
    slug: '04-materia-plasma-hero',
    doc: 'brand/04_IDENTIDADE_BRIEF.md §05 (matéria digital viva) — hero',
    prompt: `iridescent liquid plasma emerging from total darkness, flowing organic ribbons of magenta pink, ember orange, sap green and bioluminescent electric blue light, pearlescent living fluid suspended in a black void, light born from darkness, extreme macro photography, contemporary art, ${NEG} --ar 21:9 --v 8`,
  },
  {
    slug: '04-patrimonio-cru',
    doc: 'brand/04_IDENTIDADE_BRIEF.md §05 (patrimônio cru)',
    prompt: `raw historic brick masonry walls and exposed concrete beams braced against bedrock, construction site inside a century-old industrial building at night, single low amber tungsten work light, dark reflective polished floor, deep dense shadows, documentary architecture photography, chiaroscuro, no people, ${NEG} --ar 16:9 --v 8`,
  },
  {
    slug: '04-rio-digital-arquitetura',
    doc: 'brand/04_IDENTIDADE_BRIEF.md §02/§08 (o rio que entra pelo vão das portas — Reveal)',
    prompt: `a river of glowing multicolored digital matter flowing down the facade of a historic brick industrial complex at night and pouring through open doorways, luminous organic ribbon of magenta orange green and blue light against near-black architecture, long exposure night photography, mysterious, nothing revealed inside, ${NEG} --ar 21:9 --v 8`,
  },
  {
    slug: '04-botanica-iridescente',
    doc: 'brand/04_IDENTIDADE_BRIEF.md §03 (azul bioluminescência, mata à noite)',
    prompt: `digital iridescent botany, bioluminescent tropical plants glowing electric blue in a pitch-dark brazilian forest at night, subtle magenta and sap green accents on leaf edges, dew and organic detail, macro photography, deep black background, light emerging from darkness, ${NEG} --ar 4:5 --v 8`,
  },
  {
    slug: '04-silhuetas-contraluz',
    doc: 'brand/04_IDENTIDADE_BRIEF.md §05 (pessoas como silhueta, nunca posando)',
    prompt: `small silhouettes of people in backlight standing inside a vast dark monumental hall, immersed in a haze of organic multicolored light, magenta and blue atmospheric glow, no screens visible, no faces, figures dwarfed by darkness, cinematic wide shot, ${NEG} --ar 16:9 --v 8`,
  },
  {
    slug: '04-macro-fluido-perlaceo',
    doc: 'brand/04_IDENTIDADE_BRIEF.md §05 (tecido líquido perláceo, fluidos marmorizados)',
    prompt: `extreme macro of marbled pearlescent fluid, ink swirls of magenta pink, ember orange, sap green and electric blue folding into liquid black, organic pleats draping like cloth, high contrast, saturated color on darkness, contemporary abstract art, ${NEG} --ar 1:1 --v 8`,
  },
  {
    slug: '04-casarao-ambar',
    doc: 'brand/04_IDENTIDADE_BRIEF.md §03 (âmbar patrimônio: casarão aceso na mata)',
    prompt: `historic early 20th century brazilian industrial mansion glowing with warm amber light from within, surrounded by dense dark forest at night, warm tungsten temperature against deep black vegetation, architectural night photography, quiet monumental mood, no people, ${NEG} --ar 16:9 --v 8`,
  },
  {
    slug: '04-ooh-plasma-borda',
    doc: 'brand/04_IDENTIDADE_BRIEF.md §08 (OOH: plasma escorre pela borda do formato)',
    prompt: `matte black blank billboard on a dark são paulo street at night, luminous organic multicolored plasma dripping and bleeding from its top edge as if leaking out of the structure, wet asphalt reflections, no visible advertisement, urban night photography, mysterious, ${NEG} --ar 4:5 --v 8`,
  },
  {
    slug: '04-ingresso-materia',
    doc: 'brand/04_IDENTIDADE_BRIEF.md §08 (ingresso: fragmento único de matéria plasma)',
    prompt: `premium matte black event ticket lying on dark stone, a single thin vein of iridescent multicolored plasma light embedded across its surface like a crack of living matter, dramatic macro product photography, single soft light source, deep shadows, ${NEG} --ar 3:2 --v 8`,
  },
  {
    slug: '04-pointcloud-granular',
    doc: 'brand/04_IDENTIDADE_BRIEF.md §05 (matéria granular pointcloud)',
    prompt: `granular pointcloud matter forming a floating organic terrain in darkness, millions of fine luminous particles in magenta orange green and blue, volumetric digital dust emerging from a black void, no hard geometry, contemporary generative art, ${NEG} --ar 16:9 --v 8`,
  },

  // ========== BATCH 2 — DEMAIS DOCS (01, 02, 07, 08, 09, 11, 12) ==========
  {
    slug: '01-tubos-organicos-mata',
    doc: 'brand/01_BRIEFING_CLIENTE.md slides 01/13 + 09_GUIDELINES motivo 1 (a estética-mãe do plasma)',
    prompt: `organic multicolored luminous tubes in gradients of orchid pink, sprout orange, sap green and electric blue, serpentining between dense dark atlantic forest vegetation like roots or tentacles of light, bromeliads in darkness, glowing tubular sprouts emerging from black forest floor at night, contemporary digital art, light born from darkness, ${NEG} --ar 16:9 --v 8`,
  },
  {
    slug: '01-fita-digital-escadaria',
    doc: 'brand/01_BRIEFING_CLIENTE.md slide 16 + 09_GUIDELINES motivo 2 (fita de fragmentos digitais na arquitetura urbana)',
    prompt: `a continuous ribbon of glitched digital collage fragments, colorful textures and imagery, flowing down step by step over a red subway escalator in a dark urban station at night, augmented reality matter inhabiting real architecture, long ribbon twisting through the space, cinematic night photography, dark surroundings, ${NEG} --ar 4:5 --v 8`,
  },
  {
    slug: '08-plasma-frestas-macro',
    doc: 'brand/08_MANIFESTO.md beat 1 + 11_LANCAMENTO teaser (frestas vazando luz digital, sem logo, sem texto)',
    prompt: `close-up of the joints and cracks of a historic brick and stone facade at night, iridescent multicolored digital plasma light leaking and seeping out from inside the cracks, magenta orange green and blue glow escaping the masonry seams, everything else near-black, mysterious teaser mood, macro architectural photography, ${NEG} --ar 16:9 --v 8`,
  },
  {
    slug: '08-vao-das-portas',
    doc: 'brand/08_MANIFESTO.md beat final + 11_LANCAMENTO beat 4 (a câmera nunca entra: a porta é o limite do quadro)',
    prompt: `massive heavy historic industrial doors slightly ajar at night, a river of luminous multicolored organic matter flowing through the narrow gap into the building, interior completely hidden in darkness, camera outside facing the threshold, brick facade in low amber light, nothing revealed inside, cinematic, ${NEG} --ar 16:9 --v 8`,
  },
  {
    slug: '02-limiar-de-luz',
    doc: 'brand/02_ESTRATEGIA.md (não é uma tela para ver: sala para habitar) + 07_HISTORIA (a fonte de luz fora de quadro)',
    prompt: `a single human silhouette crossing a tall doorway of soft spectral light in a vast dark historic hall, light source out of frame, figure in full backlight about to step through, magenta and blue atmospheric glow spilling from the threshold, monumental darkness around, cinematic, no face visible, no screens, ${NEG} --ar 4:5 --v 8`,
  },
  {
    slug: '07-vigas-contra-rocha',
    doc: 'brand/07_HISTORIA.md abertura (vigas novas de concreto travadas contra a rocha e a alvenaria histórica)',
    prompt: `new raw concrete structural beams braced directly against exposed bedrock and century-old brick masonry, underground construction site, low warm amber tungsten work lights, construction dust in the air, the meeting of heritage and future in one frame, documentary photography, deep shadows, no people, ${NEG} --ar 16:9 --v 8`,
  },
  {
    slug: '12-subsolo-vagalumes',
    doc: 'brand/12_SOM.md (o subsolo audível: vão grande, pedra, pontos azuis como vaga-lumes lentos)',
    prompt: `vast empty historic basement vault with stone floor and old masonry arches in near-total darkness, sparse tiny electric blue bioluminescent points of light floating slowly like fireflies in the void, damp air, one distant amber glow, quiet monumental atmosphere, long exposure night photography, ${NEG} --ar 16:9 --v 8`,
  },

  // ========== BATCH 3 — LOGO (brand/04 §02 + brand/15) ==========
  // Exploração de direção: o wordmark oficial é paramétrico (scripts/wordmark_arcos.py);
  // estas imagens são boards de conceito e aplicações ambientadas, não o desenho final.
  {
    slug: 'logo-board-sistema',
    doc: 'brand/15_SISTEMA_VISUAL.md — board 3×3 do sistema de identidade completo',
    prompt: `premium brand identity system board for "téra", 3x3 presentation grid on warm near-black charcoal canvas with strong gutters: large minimal lowercase geometric wordmark "téra" built from circle arcs in warm off-white ink as cover panel, arc construction diagram with thin geometric guide circles, lowercase monogram "t" as app icon, warm off-white paper panel with the wordmark in black ink, color swatch panel with warm black, chalk white and one electric blue chip, one panel of iridescent organic plasma matter on darkness, physical ticket application panel, quiet typography specimen panel, sparse premium brand guidelines deck, intentional, art-directed, no clutter, no long text --ar 4:3 --v 8`,
  },
  {
    slug: 'logo-construcao-geometria',
    doc: 'brand/15_SISTEMA_VISUAL.md §1 (wordmark de arcos: um raio, uma espessura)',
    prompt: `logo construction diagram of a minimal geometric lowercase wordmark "téra" built entirely from circle arcs with one consistent radius and one consistent stroke weight, thin construction guide circles and measurement lines in pale blue on warm off-white paper, black monolinear letterforms, swiss typographic precision, brand guidelines page, small technical labels, sparse and clean, ${NEG.replace('no text, no words, no letters, ', '')} --ar 3:2 --v 8`,
  },
  {
    slug: 'logo-estado-materia',
    doc: 'brand/15_SISTEMA_VISUAL.md §1 (estado matéria: letras como vãos por onde o plasma passa)',
    prompt: `the lowercase word "téra" cut out as letter-shaped voids in a matte warm black surface, iridescent organic plasma in magenta orange green and electric blue flowing and glowing through the letter openings from behind, letters as windows into living matter, everything else deep black, premium brand identity concept, cinematic macro, no additional text --ar 16:9 --v 8`,
  },
  {
    slug: 'logo-monograma-t',
    doc: 'brand/15_SISTEMA_VISUAL.md §2 (monograma t: avatar, favicon, carimbo)',
    prompt: `minimal geometric lowercase letter "t" mark built from circle arcs, monolinear stroke, warm off-white on warm near-black background, presented as a rounded-square app icon and as a blind embossed stamp on dark textured paper, two-panel premium presentation, refined negative space, brand mark study, no other text --ar 1:1 --v 8`,
  },
  {
    slug: 'logo-sinalizacao-fachada',
    doc: 'brand/15_SISTEMA_VISUAL.md + brand/04 §08 (aplicação ambiental sobre patrimônio)',
    prompt: `minimal lowercase geometric wordmark "téra" as discreet dimensional signage letters in warm off-white mounted on a raw historic brick masonry wall, lit by low warm amber architectural lighting at night, deep shadows around, heritage building entrance, quiet monumental institutional signage, architectural photography, no other text --ar 16:9 --v 8`,
  },
  {
    slug: 'logo-aplicacoes-board',
    doc: 'brand/04 §08 + brand/15 (mini-deck de aplicações: ingresso, poster, avatar, papelaria)',
    prompt: `premium 2x3 brand applications board for the lowercase geometric arc-built wordmark "téra" on warm near-black canvas with clean gutters: matte black event ticket with the wordmark and a thin vein of iridescent plasma, minimal poster in warm off-white with black wordmark, dark app icon with lowercase "t" mark, black letterhead and business card stationery pair, dark tote bag, one atmosphere panel of multicolored organic light on darkness, sparse, intentional, brand guidelines deck quality, no long text --ar 4:3 --v 8`,
  },
];

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const FORCE = args.includes('--force');
const onlyArg = args.find((a) => a.startsWith('--only'));
const ONLY = onlyArg ? (onlyArg.split('=')[1] || args[args.indexOf(onlyArg) + 1] || '').split(',').filter(Boolean) : null;

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { 'content-type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}

const exists = (p) => access(p).then(() => true, () => false);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function submit(job) {
  const data = await api('/api/render-jobs', {
    method: 'POST',
    body: JSON.stringify({
      mj: { prompt: job.prompt, upscale: { enabled: true, index: 1 } },
      comfy: { enabled: false },
    }),
  });
  const id = data.job?.id || data.id;
  if (!id) throw new Error(`sem id na resposta: ${JSON.stringify(data).slice(0, 300)}`);
  return id;
}

async function waitFor(jobId, timeoutSec = 1200) {
  const deadline = Date.now() + timeoutSec * 1000;
  while (Date.now() < deadline) {
    const data = await api(`/api/render-jobs/${jobId}`);
    const j = data.job || data;
    const st = String(j.status || '').toUpperCase();
    if (st === 'SUCCESS') return j;
    if (['FAILURE', 'FAILED', 'ERROR'].includes(st)) throw new Error(`job ${jobId} falhou: ${j.error || j.stage}`);
    await sleep(6000);
  }
  throw new Error(`job ${jobId} estourou o timeout de ${timeoutSec}s`);
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download HTTP ${res.status}: ${url.slice(0, 120)}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const queue = JOBS.filter((j) => !ONLY || ONLY.includes(j.slug));
  if (!queue.length) return console.log('nada a fazer (confira --only).');
  await mkdir(OUT_DIR, { recursive: true });

  if (DRY) {
    for (const j of queue) console.log(`[dry] ${j.slug}  →  ${j.doc}\n      ${j.prompt}\n`);
    return console.log(`${queue.length} jobs.`);
  }

  let generated = 0;
  let kept = 0;
  for (const [i, job] of queue.entries()) {
    const png = join(OUT_DIR, `${job.slug}.png`);
    if (!FORCE && (await exists(png))) {
      console.log(`(${i + 1}/${queue.length}) ${job.slug} — já existe, pulando`);
      kept++;
      continue;
    }
    process.stdout.write(`(${i + 1}/${queue.length}) ${job.slug} — submetendo... `);
    const jobId = await submit(job);
    process.stdout.write(`${jobId} aguardando... `);
    const done = await waitFor(jobId);
    const finalUrl = done.result?.mjFinalTask?.imageUrl;
    const gridUrl = done.result?.mjBaseTask?.imageUrl;
    const seed = done.result?.mjBaseTask?.seed;
    if (!finalUrl) throw new Error(`job ${jobId} sem imageUrl final`);
    await download(finalUrl, png);
    // sidecar: metadados persistidos por imagem, base do manifesto em qualquer re-execução
    await writeFile(join(OUT_DIR, `${job.slug}.json`), JSON.stringify({
      slug: job.slug, doc: job.doc, prompt: job.prompt, jobId, seed, finalUrl, gridUrl,
      generatedAt: new Date().toISOString(),
    }, null, 2));
    console.log(`ok (seed ${seed})`);
    generated++;
  }

  // manifesto: reconstruído do estado do disco (sidecars), cobre TODOS os slugs conhecidos
  const rows = [];
  for (const job of JOBS) {
    if (!(await exists(join(OUT_DIR, `${job.slug}.png`)))) continue;
    let meta = { ...job };
    try { meta = { ...meta, ...JSON.parse(await readFile(join(OUT_DIR, `${job.slug}.json`), 'utf8')) }; } catch {}
    rows.push(meta);
  }
  const lines = [
    '# Imagens Midjourney — marca Téra',
    '',
    `> Geradas pelo render stack (${BASE_URL}) via \`tools/midjourney-minimax-stack/scripts/generate-tera-images.mjs\`.`,
    `> Última execução: ${new Date().toISOString()}`,
    '',
    '| Imagem | Ilustra | Seed | Job |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ![${r.slug}](${r.slug}.png) \`${r.slug}.png\` | ${r.doc} | ${r.seed ?? '—'} | ${r.jobId ?? '—'} |`),
    '',
    '## Prompts',
    '',
    ...rows.flatMap((r) => [`### ${r.slug}`, '', '```', r.prompt, '```', '']),
  ];
  await writeFile(MANIFEST, lines.join('\n'));
  console.log(`\nManifesto: ${MANIFEST} (${rows.length} imagens no disco)`);
  console.log(`${generated} geradas nesta execução, ${kept} mantidas.`);
}

main().catch((err) => {
  console.error(`\nERRO: ${err.message}`);
  process.exit(1);
});
