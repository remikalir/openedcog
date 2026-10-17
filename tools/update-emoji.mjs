// Copies the Twemoji pictures OpenedCog uses into emoji/, and reports any that are missing.
// Run it after adding or changing puzzle items that use emoji:
//
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/jdecked/twemoji.git /tmp/twemoji
//   git -C /tmp/twemoji sparse-checkout set --no-cone assets/svg LICENSE-GRAPHICS
//   node tools/update-emoji.mjs /tmp/twemoji
//
// It uses the same matching rules as the pictures() function in js/app.js.
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const twemoji = process.argv[2];
if (!twemoji || !existsSync(join(twemoji, 'assets/svg'))) {
  console.error('Usage: node tools/update-emoji.mjs <path to a Twemoji checkout with assets/svg>');
  process.exit(1);
}
const EMOJI_RE = /\p{RI}\p{RI}|[#*0-9]️?⃣|\p{Extended_Pictographic}(?:️|\p{EMod})?(?:‍\p{Extended_Pictographic}(?:️|\p{EMod})?)*/gu;
const isPicture = m => /\p{Emoji_Presentation}|️|‍|⃣|\p{RI}/u.test(m);
const fileFor = m => [...(m.includes('‍') ? m : m.replace(/️/g, ''))].map(c => c.codePointAt(0).toString(16)).join('-') + '.svg';

const sources = ['index.html', ...readdirSync(join(root, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f)];
const found = new Map();
for (const f of sources) for (const m of readFileSync(join(root, f), 'utf8').matchAll(EMOJI_RE)) if (isPicture(m[0])) found.set(fileFor(m[0]), m[0]);

mkdirSync(join(root, 'emoji'), { recursive: true });
const missing = [];
for (const [file, ch] of [...found].sort()) {
  const src = join(twemoji, 'assets/svg', file);
  if (existsSync(src)) copyFileSync(src, join(root, 'emoji', file)); else missing.push(`${ch} (${file})`);
}
const lic = join(twemoji, 'LICENSE-GRAPHICS');
if (existsSync(lic)) copyFileSync(lic, join(root, 'emoji', 'LICENSE-GRAPHICS.txt'));
else if (!existsSync(join(root, 'emoji', 'LICENSE-GRAPHICS.txt'))) console.log('WARNING: Twemoji\'s LICENSE-GRAPHICS was not found. The pictures must ship with their license; see the instructions at the top of this file.');
writeFileSync(join(root, 'emoji', 'README.md'),
  '# Pictures\n\nThese pictures are from [Twemoji](https://github.com/jdecked/twemoji), ' +
  'copyright Twitter, Inc. (2014–2021) and Jason Sofonia & Justine De Caires (2022–present). ' +
  'They are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (full text in LICENSE-GRAPHICS.txt). ' +
  'Only the pictures OpenedCog uses are included. `tools/update-emoji.mjs` refreshes them.\n');
console.log(`${found.size - missing.length} pictures copied into emoji/.`);
const unused = readdirSync(join(root, 'emoji')).filter(f => f.endsWith('.svg') && !found.has(f));
if (unused.length) console.log(`No longer used (safe to delete): ${unused.join(' ')}`);
if (missing.length) { console.log(`MISSING from Twemoji, so pick a different emoji: ${missing.join(', ')}`); process.exit(2); }
