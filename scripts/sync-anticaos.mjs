// Copia os tokens do anticaos (CSS puro, sem Tailwind) para src/anticaos/tokens.css.
// O jogo não usa Tailwind nem React, então trazemos só as variáveis e os papéis tipográficos.
// Uso: node scripts/sync-anticaos.mjs [caminho-do-anticaos-ui]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '../anticaos-ui');
const src = readFileSync(resolve(root, 'src/tokens/tokens.css'), 'utf8');
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

/** Conteúdo do primeiro bloco `{ ... }` depois do seletor (sem blocos aninhados). */
function block(selector) {
  const i = src.indexOf(`${selector} {`);
  if (i < 0) throw new Error(`não achei "${selector}" em tokens.css`);
  const start = src.indexOf('{', i) + 1;
  return src.slice(start, src.indexOf('\n}', start)).trim();
}

const indent = (s) => s.split('\n').map((l) => `  ${l.trim()}`).join('\n');

// papéis tipográficos: @utility type-x { ... } → .type-x { ... }
const roles = [...src.matchAll(/@utility (type-[\w-]+) \{([^}]*)\}/g)]
  .map(([, name, body]) => `.${name} {\n${indent(body.trim())}\n}`)
  .join('\n\n');

const out = `/*
 * GERADO por scripts/sync-anticaos.mjs a partir de @idantas/ui ${version} (src/tokens/tokens.css).
 * Não edite à mão: rode \`node scripts/sync-anticaos.mjs\` de novo.
 */

:root {
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-pixel: 'Geist Pixel Square', ui-monospace, monospace;

  /* escalas */
${indent(block('@theme static'))}

  /* tema claro */
${indent(block(':root'))}
}

.dark {
${indent(block('.dark'))}
}

${roles.replaceAll("var(--font-geist-sans, 'Geist'), system-ui, sans-serif", 'var(--font-sans)').replace(/var\(--font-geist-pixel-square[^;]*/g, 'var(--font-pixel)').replace(/var\(--font-geist-mono[^;]*/g, 'ui-monospace, monospace')}
`;

writeFileSync('src/anticaos/tokens.css', out);
console.log(`tokens do anticaos ${version} → src/anticaos/tokens.css`);
