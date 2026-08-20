#!/usr/bin/env node
// backfill-sidecars.mjs — escreve os sidecars JSON das 17 imagens do run 1
// (geradas pela versão do generate-tera-images.mjs anterior aos sidecars).
// Dados extraídos do log da execução de 2026-08-20. Sem rede: só escreve arquivos.

import { writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../../../tera-brand-system/assets/midjourney');
const GENERATED_AT = '2026-08-20T04:45:00.000Z';

const RUNS = {
  '04-materia-plasma-hero': { jobId: 'render_1787200659168_l7cp59', seed: '3012096405' },
  '04-patrimonio-cru': { jobId: 'render_1787200685097_t28s4f', seed: '3590633290' },
  '04-rio-digital-arquitetura': { jobId: 'render_1787200704075_81hdf5', seed: '2143648440' },
  '04-botanica-iridescente': { jobId: 'render_1787200729154_uop100', seed: '2884913151' },
  '04-silhuetas-contraluz': { jobId: 'render_1787200748154_l2951y', seed: '638230580' },
  '04-macro-fluido-perlaceo': { jobId: 'render_1787200767245_rpsl7n', seed: '3831624710' },
  '04-casarao-ambar': { jobId: 'render_1787200786391_8hn81z', seed: '3754124190' },
  '04-ooh-plasma-borda': { jobId: 'render_1787200811313_ij7uzk', seed: '3594046158' },
  '04-ingresso-materia': { jobId: 'render_1787200836352_qsd9uh', seed: '2267854103' },
  '04-pointcloud-granular': { jobId: 'render_1787200856026_rfz0cg', seed: '1499166755' },
  '01-tubos-organicos-mata': { jobId: 'render_1787200874612_kaq0wj', seed: '2766282199' },
  '01-fita-digital-escadaria': { jobId: 'render_1787200900301_qo4rn0', seed: '1086114649' },
  '08-plasma-frestas-macro': { jobId: 'render_1787200919423_4vcxjf', seed: '900103423' },
  '08-vao-das-portas': { jobId: 'render_1787200938300_3flgyx', seed: '3225218577' },
  '02-limiar-de-luz': { jobId: 'render_1787200956943_mwmuid', seed: '3483128913' },
  '07-vigas-contra-rocha': { jobId: 'render_1787200981743_i6qx3y', seed: '2836097786' },
  '12-subsolo-vagalumes': { jobId: 'render_1787201006428_687eqn', seed: '3828972466' },
};

// doc + prompt não são necessários aqui: o manifesto mescla o sidecar com o
// array JOBS do generate-tera-images.mjs na hora de reconstruir.

const exists = (p) => access(p).then(() => true, () => false);

let written = 0;
for (const [slug, meta] of Object.entries(RUNS)) {
  const sidecar = join(OUT_DIR, `${slug}.json`);
  if (await exists(sidecar)) continue;
  await writeFile(sidecar, JSON.stringify({ slug, ...meta, generatedAt: GENERATED_AT, backfilled: true }, null, 2));
  written++;
}
console.log(`${written} sidecars escritos em ${OUT_DIR}`);
