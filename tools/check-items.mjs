// Checks the verbal item banks in js/puzzles.js for mistakes a reviewer might miss.
// Run from the repository folder after editing items (and after tools/update-emoji.mjs):
//
//   node tools/check-items.mjs
//
// It checks that every picture is a single emoji with a bundled Twemoji file, that each item has
// four different answer choices, that the answer isn't repeated among the wrong choices or in the
// question itself, that no item appears twice, and that levels and explanations are filled in.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const G = vm.runInNewContext(readFileSync(join(root, 'js/puzzles.js'), 'utf8') + '\n;G');
const ONE = /^(?:\p{RI}\p{RI}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\p{EMod})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{EMod})?)*)$/u;
const fileFor = m => [...(m.includes('\u200D') ? m : m.replace(/\uFE0F/g, ''))].map(c => c.codePointAt(0).toString(16)).join('-') + '.svg';

const problems = [];
const say = (where, msg) => problems.push(`${where}: ${msg}`);
const checkPic = (where, e) => {
  if (typeof e !== 'string' || !ONE.test(e)) return say(where, `"${e}" is not a single emoji`);
  if (!existsSync(join(root, 'emoji', fileFor(e)))) say(where, `${e} has no picture in emoji/ (run tools/update-emoji.mjs)`);
};
const NAMES = { pa: 'Picture Analogies', sc: 'Sentence Completion', pc: 'Picture Classification' };

for (const [sub, [bank, practice]] of Object.entries(G.banks)) {
  const seen = new Map();
  const levels = [0, 0, 0];
  for (const [label, list, isPractice] of [[NAMES[sub], bank, false], [NAMES[sub] + ' practice', practice, true]]) {
    list.forEach((it, i) => {
      const where = `${label} #${i + 1}`;
      const stem = sub === 'pa' ? [it.a, it.b, it.c] : sub === 'pc' ? (Array.isArray(it.set) ? it.set : []) : [];
      const choices = [it.ans, ...(it.d || [])];
      if (!Array.isArray(it.d) || it.d.length !== 3) say(where, 'needs exactly 3 wrong choices');
      if (new Set(choices).size !== choices.length) say(where, 'two answer choices are the same picture');
      if (stem.includes(it.ans)) say(where, `the answer ${it.ans} already appears in the question`);
      if (sub === 'pc') for (const w of it.d || []) if (stem.includes(w)) say(where, `wrong choice ${w} already appears in the top row`);
      if (sub === 'pc' && (!Array.isArray(it.set) || it.set.length !== 3)) say(where, 'top row needs exactly 3 pictures');
      if (sub === 'sc' && !(typeof it.q === 'string' && /\?$/.test(it.q.trim()))) say(where, 'question should end with a question mark');
      for (const e of [...stem, ...choices]) checkPic(where, e);
      if (!(typeof it.why === 'string' && /[.!?]$/.test(it.why.trim()))) say(where, 'explanation is missing or has no final punctuation');
      if (!isPractice) {
        if (![0, 1, 2].includes(it.lvl)) say(where, 'lvl must be 0, 1, or 2'); else levels[it.lvl]++;
      }
      const key = sub === 'sc' ? String(it.q).toLowerCase() : sub === 'pa' ? stem.join(' ') : [...stem].sort().join(' ');
      if (seen.has(key)) say(where, `duplicates ${seen.get(key)}`); else seen.set(key, where);
    });
  }
  console.log(`${NAMES[sub]}: ${bank.length} items (easier ${levels[0]}, middle ${levels[1]}, harder ${levels[2]}) + ${practice.length} practice`);
}
if (problems.length) { console.log(`\n${problems.length} problem(s):\n` + problems.join('\n')); process.exit(1); }
console.log('\nNo problems found.');
