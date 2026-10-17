(() => {
'use strict';
const $app = document.getElementById('app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- catalog ----------
const SUBS = {
  pa: { kid: 'Picture pairs', off: 'Picture Analogies', ic: '🐄', fam: 'v',
    dir: 'In these puzzles, the two pictures on top go together in some way. Figure out how they go together. Then pick the picture that goes with the bottom picture in the same way.',
    tip: 'Say the top pair as a sentence, like "A cow gives us milk." Then try the same sentence on the bottom: "A hen gives us..."' },
  sc: { kid: 'Listen and choose', off: 'Sentence Completion', ic: '🎧', fam: 'v',
    dir: 'In these puzzles, you will hear a question. Listen carefully to every word. Then pick the picture that is the best answer. Tap the speaker button if you want to hear it again.',
    tip: 'Listen for tricky words like NOT, BUT, and MOST. They change the answer!' },
  pc: { kid: 'Picture groups', off: 'Picture Classification', ic: '🍎', fam: 'v',
    dir: 'In these puzzles, the three pictures on top are alike in some way. Figure out how they are alike. Then pick the picture below that belongs in the same group.',
    tip: 'Ask yourself: what is the same about ALL three? Then check that your answer is the same in that way too.' },
  na: { kid: 'Number pairs', off: 'Number Analogies', ic: '🔢', fam: 'q',
    dir: 'In these puzzles, look at the two boxes on top. Count them. Something happened to the number, like adding some or taking some away. Figure out what happened. Then pick the answer that does the same thing to the bottom box.',
    tip: 'Count both top boxes first. Did it get more, fewer, double, or half? Then do exactly that to the bottom box.' },
  np: { kid: 'Number sentences', off: 'Number Puzzles', ic: '➕', fam: 'q',
    dir: 'In these puzzles, pick the number that makes both sides of the equal sign come out to the same amount.',
    tip: 'Figure out the side you can finish first. Then ask: what number makes the other side match it?' },
  ns: { kid: 'Bead patterns', off: 'Number Series', ic: '🟡', fam: 'q',
    dir: 'Look at the strings of beads. They make a pattern. Count the beads on each string and figure out the pattern. Then pick the string of beads that comes next.',
    tip: 'Count every string and say the numbers out loud in your head: 2, 4, 6... What comes next?' },
  fm: { kid: 'Shape pairs', off: 'Figure Matrices', ic: '🔷', fam: 'n',
    dir: 'In these puzzles, the two shapes on top go together. Look at how the first shape changed to make the second one. Then pick the answer that changes the bottom shape in the same way.',
    tip: 'Check each thing that can change: color, size, how many, which way it points, and whether it has a dot.' },
  pf: { kid: 'Paper folding', off: 'Paper Folding', ic: '📄', fam: 'n',
    dir: 'A piece of paper gets folded, and then a hole is punched through it. Pick the picture that shows how the paper will look when you unfold it and open it all the way.',
    tip: 'The hole goes through every layer. When you unfold, the hole shows up again on the other side of the fold, like a mirror.' },
  fc: { kid: 'Shape groups', off: 'Figure Classification', ic: '⭐', fam: 'n',
    dir: 'In these puzzles, the three shapes on top are alike in some way. Figure out how. Then pick the shape below that belongs with them.',
    tip: 'Some things will be different on purpose. Look for the ONE thing that is the same on all three.' },
};
const FAMS = {
  v: { kid: 'Picture puzzles', off: 'Verbal battery', subs: ['pa', 'sc', 'pc'], day: 1, emo: '🐄 🎧 🍎' },
  q: { kid: 'Number puzzles', off: 'Quantitative battery', subs: ['na', 'np', 'ns'], day: 2, emo: '🔢 ➕ 🟡' },
  n: { kid: 'Shape puzzles', off: 'Nonverbal battery', subs: ['fm', 'pf', 'fc'], day: 3, emo: '🔷 📄 ⭐' },
};

// ---------- storage (this device only) ----------
// Everything is kept in this browser's localStorage under one key. Nothing is sent anywhere.
// Shape: { app, v, active, kids: [child, ...] }, where child = { id, name, settings, sessions, seen, created, updated }.
const LS = 'openedcog:v1';
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const MAX_SESSIONS = 300, DETAIL_SESSIONS = 80, MAX_KIDS = 12, MAX_IMPORT_BYTES = 3 * 1024 * 1024;
const defaultSettings = () => ({ voice: true, rate: 0.9, n: 12, ln: 8, captions: true });
const newChild = name => ({ id: newId(), name: cleanName(name), settings: defaultSettings(), sessions: [], seen: { pa: [], sc: [], pc: [] }, created: Date.now(), updated: Date.now() });
// Names are also escaped everywhere they are shown; removing < > is a second layer of protection.
const cleanName = n => String(n == null ? '' : n).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 24);

function save() {
  if (S) {
    S.updated = Date.now();
    if (S.sessions.length > MAX_SESSIONS) S.sessions = S.sessions.slice(-MAX_SESSIONS);
    // per-puzzle detail is bulky: keep it only for the most recent sessions
    S.sessions.forEach((s, i) => { if (s.items && i < S.sessions.length - DETAIL_SESSIONS) delete s.items; });
  }
  try { localStorage.setItem(LS, JSON.stringify({ app: 'openedcog', v: 1, active: DB.active, kids: DB.kids })); storageOK = true; }
  catch (e) { storageOK = false; }
}
function setActive(id) { const k = DB.kids.find(x => x.id === id); if (!k) return; DB.active = id; S = k; save(); }
function addChild(name) {
  const n = cleanName(name); if (!n || DB.kids.length >= MAX_KIDS) return null;
  const k = newChild(n); DB.kids.push(k); setActive(k.id); return k;
}
function removeChild(id) {
  DB.kids = DB.kids.filter(k => k.id !== id);
  if (DB.active === id) { DB.active = DB.kids[0] ? DB.kids[0].id : null; S = DB.kids[0] || null; }
  save();
}

// ---------- backup files (export / import) ----------
// A backup is a small JSON file the grown-up saves and keeps. Importing merges it into this device.
// Files from someone else's device are treated as untrusted input: every field is checked and rebuilt.
const isInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
function sanitizeSession(s) {
  if (!s || typeof s !== 'object') return null;
  const n = s.n, c = s.correct;
  if (typeof s.id !== 'string' || !/^[a-z0-9]{4,40}$/i.test(s.id)) return null;
  if (!isInt(s.ts, 1e12, 1e13) || !['test', 'skill'].includes(s.mode) || !SUBS[s.sub] || !isInt(n, 1, 60) || !isInt(c, 0, n)) return null;
  const out = { id: s.id, ts: s.ts, mode: s.mode, sub: s.sub, n, correct: c, secs: isInt(s.secs, 0, 86400) ? s.secs : 0 };
  if (Array.isArray(s.items) && s.items.length === n) {
    const items = s.items.map(x => (x && typeof x === 'object') ? { c: x.c ? 1 : 0, s: isInt(x.s, 0, 86400) ? x.s : 0, r: isInt(x.r, 0, 999) ? x.r : 0, ch: isInt(x.ch, 0, 999) ? x.ch : 0, d: isInt(x.d, 0, 2) ? x.d : 0 } : null);
    if (items.every(Boolean)) out.items = items;
  }
  return out;
}
function sanitizeChild(k) {
  if (!k || typeof k !== 'object') return null;
  const name = cleanName(k.name); if (!name) return null;
  const st = k.settings && typeof k.settings === 'object' ? k.settings : {};
  const d = defaultSettings();
  const settings = {
    voice: typeof st.voice === 'boolean' ? st.voice : d.voice,
    rate: [0.8, 0.9, 1.0].includes(st.rate) ? st.rate : d.rate,
    n: [8, 12, 16].includes(st.n) ? st.n : d.n,
    ln: [8, 12, 16].includes(st.ln) ? st.ln : d.ln,
    captions: typeof st.captions === 'boolean' ? st.captions : d.captions,
  };
  const seen = {};
  for (const sub of ['pa', 'sc', 'pc']) seen[sub] = [...new Set(((k.seen && Array.isArray(k.seen[sub])) ? k.seen[sub] : []).filter(i => isInt(i, 0, 999)))];
  const seenIds = new Set();
  const sessions = (Array.isArray(k.sessions) ? k.sessions : []).map(sanitizeSession).filter(s => s && !seenIds.has(s.id) && seenIds.add(s.id)).sort((a, b) => a.ts - b.ts).slice(-MAX_SESSIONS);
  return {
    id: typeof k.id === 'string' && /^[a-z0-9]{4,40}$/i.test(k.id) ? k.id : newId(), name, settings, sessions, seen,
    created: isInt(k.created, 1e12, 1e13) ? k.created : Date.now(), updated: isInt(k.updated, 0, 1e13) ? k.updated : 0,
  };
}
function exportFile() {
  const payload = { app: 'openedcog', kind: 'backup', v: 1, exported: new Date().toISOString(), kids: DB.kids };
  const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
  const d = new Date(), pad = x => String(x).padStart(2, '0');
  const fname = `openedcog-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = fname; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  return fname;
}
// Accepts this app's backup files, and the single-child shape used by the original private version.
function parseBackup(text) {
  let r; try { r = JSON.parse(text); } catch (e) { return { error: "That file isn't an OpenedCog backup (it couldn't be read)." }; }
  let list = null;
  if (r && Array.isArray(r.kids)) list = r.kids;
  else if (r && typeof r === 'object' && Array.isArray(r.sessions) && typeof r.name === 'string') list = [r];
  if (!list) return { error: "That file isn't an OpenedCog backup." };
  const kids = list.slice(0, MAX_KIDS).map(sanitizeChild).filter(Boolean);
  if (!kids.length) return { error: 'That backup has no children in it.' };
  return { kids };
}
function mergeChild(into, from) {
  const ids = new Set(into.sessions.map(s => s.id));
  let added = 0;
  for (const s of from.sessions) if (!ids.has(s.id)) { into.sessions.push(s); ids.add(s.id); added++; }
  into.sessions.sort((a, b) => a.ts - b.ts);
  for (const k of ['pa', 'sc', 'pc']) into.seen[k] = [...new Set([...(into.seen[k] || []), ...(from.seen[k] || [])])];
  return added;
}
// Same child id: merge histories. Otherwise: add as a new child on this device.
function importKids(kids) {
  const report = [];
  for (const k of kids) {
    const match = DB.kids.find(x => x.id === k.id);
    if (match) { const added = mergeChild(match, k); report.push(`${match.name}: added ${added} session${added === 1 ? '' : 's'}`); }
    else if (DB.kids.length < MAX_KIDS) { DB.kids.push(k); report.push(`${k.name}: added with ${k.sessions.length} session${k.sessions.length === 1 ? '' : 's'}`); }
    else report.push(`${k.name}: skipped (this device already has ${MAX_KIDS} children)`);
  }
  if (!DB.active && DB.kids[0]) DB.active = DB.kids[0].id;
  S = DB.kids.find(x => x.id === DB.active) || null;
  save();
  return report;
}

// ---------- load saved progress ----------
let storageOK = true;
let DB = (() => {
  try {
    const raw = localStorage.getItem(LS);
    const r = raw ? JSON.parse(raw) : null;
    if (r && r.v === 1 && Array.isArray(r.kids)) {
      const kids = r.kids.map(sanitizeChild).filter(Boolean);
      return { v: 1, active: kids.some(k => k.id === r.active) ? r.active : (kids[0] && kids[0].id) || null, kids };
    }
  } catch (e) { storageOK = false; }
  return { v: 1, active: null, kids: [] };
})();
try { const t = '__oc_test'; localStorage.setItem(t, '1'); localStorage.removeItem(t); } catch (e) { storageOK = false; }
let S = DB.kids.find(k => k.id === DB.active) || null;

// ---------- speech ----------
const Voice = {
  v: null, token: 0, ok: 'speechSynthesis' in window,
  init() {
    if (!this.ok) return;
    const choose = () => {
      const vs = speechSynthesis.getVoices();
      const en = vs.filter(v => /^en[-_]US/i.test(v.lang));
      this.v = en.find(v => /Samantha|Google US English|Aria|Jenny|Natural|Ava|Allison/i.test(v.name)) || en[0] || vs.find(v => /^en/i.test(v.lang)) || null;
    };
    choose(); speechSynthesis.onvoiceschanged = choose;
  },
  say(text) {
    const my = ++this.token;
    return new Promise(res => {
      const st = S ? S.settings : defaultSettings();
      if (!this.ok || !st.voice || !text) return res(my);
      try { speechSynthesis.cancel(); } catch (e) { }
      let done = false; const fin = () => { if (!done) { done = true; res(my); } };
      const rate = st.rate || 0.9;
      const parts = (String(text).match(/[^.!?]+[.!?]*/g) || [String(text)]).map(p => p.trim()).filter(Boolean);
      setTimeout(() => {
        if (my !== this.token) return fin();
        let i = 0;
        const next = () => {
          if (my !== this.token || i >= parts.length) return fin();
          const u = new SpeechSynthesisUtterance(parts[i++]);
          this.cur = u; // keep a reference so the end event fires reliably
          if (this.v) u.voice = this.v;
          u.rate = rate; u.pitch = 1.05;
          u.onend = next; u.onerror = fin;
          try { speechSynthesis.speak(u); } catch (e) { fin(); }
        };
        next();
        setTimeout(fin, 2500 + String(text).length * 95 / rate);
      }, 60);
    });
  },
  prime() {
    if (this.primed || !this.ok) return; this.primed = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) { }
  },
  stop() { this.token++; if (this.ok) try { speechSynthesis.cancel(); } catch (e) { } },
};
Voice.init();

// ---------- helpers ----------
const pct = (c, n) => (n ? Math.round(100 * c / n) : 0);
const starsFor = p => (p >= 90 ? 3 : p >= 70 ? 2 : p >= 40 ? 1 : 0);
const starHTML = (k, cls = 'stars') => `<span class="${cls}" aria-label="${k} of 3 stars">${'★'.repeat(k)}<span class="off">${'★'.repeat(3 - k)}</span></span>`;
const PRAISE = ["That's right!", 'Nice thinking!', 'You got it!', 'Great job!', 'Yes! Good looking.'];
function subStats(sub) {
  const ss = S.sessions.filter(s => s.sub === sub);
  if (!ss.length) return null;
  const ps = ss.map(s => pct(s.correct, s.n));
  return { runs: ss.length, last: ps[ps.length - 1], best: Math.max(...ps), recent: ps.slice(-8), secs: ss.slice(-5).reduce((a, s) => a + (s.secs || 0), 0) / Math.max(1, ss.slice(-5).reduce((a, s) => a + s.n, 0)), lastTs: ss[ss.length - 1].ts };
}
const fmtDate = ts => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

// ---------- state ----------
let view = 'home';
let run = null;      // active run
let modal = null;

function makeItems(sub, n) {
  const seen = new Set(S.seen[sub] || []);
  const items = G.make(sub, n, seen);
  if (S.seen[sub]) {
    let ids = [...seen, ...items.map(i => i.bankId).filter(x => x != null)];
    ids = [...new Set(ids)];
    if (ids.length >= G.bankSize(sub)) ids = items.map(i => i.bankId);
    S.seen[sub] = ids;
  }
  return items;
}

function startTest(fam) {
  Voice.stop();
  run = { mode: 'test', fam, subs: FAMS[fam].subs.slice(), si: 0, results: [] };
  beginSub();
}
function startSkill(sub) {
  Voice.stop();
  run = { mode: 'skill', fam: SUBS[sub].fam, subs: [sub], si: 0, results: [] };
  beginSub();
}
function beginSub() {
  const sub = run.subs[run.si];
  const n = run.mode === 'test' ? (S.settings.n || 12) : (S.settings.ln || 8);
  run.sub = sub;
  run.practice = run.mode === 'test' ? G.practice(sub) : [];
  run.items = makeItems(sub, n);
  run.answers = new Array(run.items.length).fill(-1);
  run.firstTry = new Array(run.items.length).fill(null);
  run.times = new Array(run.items.length).fill(0);
  run.replays = new Array(run.items.length).fill(0);
  run.changes = new Array(run.items.length).fill(0);
  run.phase = 'intro'; run.pi = 0; run.qi = 0;
  view = 'intro'; render();
}
function current() {
  if (run.phase === 'practice') return run.practice[run.pi];
  return run.items[run.qi];
}
function feedbackMode() { return run.phase === 'practice' || run.mode === 'skill'; }

// ---------- rendering ----------
function render() {
  const fn = { home: vHome, welcome: vWelcome, pick: vPick, intro: vIntro, q: vQuestion, ready: vReady, brk: vBreak, results: vResults, review: vReview, parent: vParent, gate: vGate, howto: vHowto }[view];
  $app.innerHTML = fn();
  if (modal) $app.insertAdjacentHTML('beforeend', modal.html);
  pictures($app);
  const f = $app.querySelector('[data-autofocus]'); if (f) f.focus();
}

function vWelcome() {
  return `<div class="msg pop"><div class="bigemo">🧩</div><h1>OpenedCog</h1>
  <p class="say">Puzzle practice. Who is practicing today?</p>
  <form class="row" data-form="name"><input class="name-in" name="n" maxlength="24" placeholder="First name" autocomplete="off" data-autofocus aria-label="Child's first name">
  <button class="btn primary" type="submit">Start</button></form>
  <p class="muted" style="margin-top:18px;font-size:.9rem">Grown-ups: type your child's first name or a nickname. It stays on this device. You can add more children later.</p>
  <p class="muted" style="font-size:.9rem">Moving from another device? <button class="link" data-act="import">Load a backup file</button><input id="importfile" class="sr-only" type="file" accept=".json,application/json" tabindex="-1" aria-hidden="true"></p>
  <p id="backupmsg" class="muted" role="status" style="min-height:1.4em"></p>
  ${storageOK ? '' : '<p class="warn">This browser isn\'t letting the site save anything (this can happen in private browsing). Puzzles will work, but progress will be lost when you close the page.</p>'}</div>`;
}

function vPick() {
  const kids = DB.kids.map(k => `<button class="kid" data-act="pickkid" data-id="${esc(k.id)}" aria-current="${k.id === DB.active}"><span>${esc(k.name)}</span><span class="kmeta">${k.sessions.length ? `${k.sessions.length} puzzle set${k.sessions.length === 1 ? '' : 's'}` : 'New'}</span></button>`).join('');
  return `<div class="msg pop"><div class="bigemo">🧩</div><h1>Who is practicing?</h1>
  <div class="kids">${kids}</div>
  ${DB.kids.length < MAX_KIDS ? `<form class="row" data-form="addkid"><input class="name-in" name="n" maxlength="24" placeholder="Add a name" autocomplete="off" aria-label="Add a child's first name"><button class="btn" type="submit">Add</button></form>` : ''}
  <div class="row"><button class="link" data-act="home">Back</button></div></div>`;
}

function vHome() {
  const lastTest = fam => { const s = S.sessions.filter(x => x.mode === 'test' && FAMS[fam].subs.includes(x.sub)); return s.length ? `Last tried ${fmtDate(s[s.length - 1].ts)}` : 'Not tried yet'; };
  const tile = sub => { const st = subStats(sub); const k = st ? starsFor(st.best) : 0; const d = SUBS[sub];
    return `<button class="tile" data-act="skill" data-sub="${sub}"><span class="ti" aria-hidden="true">${d.ic}</span><span class="tn">${d.kid}</span>${starHTML(k, 'tst')}<span class="toff">${d.off}</span></button>`; };
  return `<div class="top"><div><div class="hello">Hi, ${esc(S.name || 'there')}!</div><p class="muted">Pick a pretend test day, or practice one kind of puzzle.</p>
  <div class="who"><button class="link" data-act="pick">${DB.kids.length > 1 ? `Not ${esc(S.name)}? Switch` : 'Add another child'}</button></div></div>
  <div class="top-actions"><button class="btn" data-act="howto">How the test works</button><button class="btn" data-act="gate">Grown-ups</button></div></div>
  <h2 class="sect">Pretend test day</h2>
  <div class="days">${Object.entries(FAMS).map(([k, f]) => `<button class="day" data-act="test" data-fam="${k}"><span class="dnum">${f.off}</span><span class="dname">${f.kid}</span><span class="demo" aria-hidden="true">${f.emo}</span><span class="dlast">3 parts, ${S.settings.n} puzzles each. ${lastTest(k)}</span></button>`).join('')}</div>
  <h2 class="sect">Practice one kind of puzzle</h2>
  ${Object.values(FAMS).map(f => `<div class="fam"><div class="fam-name">${f.kid}</div><div class="tiles">${f.subs.map(tile).join('')}</div></div>`).join('')}
  <p class="muted" style="margin-top:18px;font-size:.9rem">Practice mode tells you right away if you got it and why. Test day mode works like the real test: nobody tells you until the end.</p>`;
}

function vHowto() {
  return `<div class="msg pop"><div class="bigemo">🎧</div><h1>How the test works</h1>
  <div class="tip" style="background:var(--bg)">
  <p>🎧 You may wear headphones. A voice reads everything to you.</p>
  <p>🔊 Tap <b>Hear it again</b> any time you want to listen again.</p>
  <p>👆 Tap the picture you choose. You can change your mind.</p>
  <p>➡️ Tap <b>Go</b> for the next puzzle. Tap <b>Back</b> to look at the last one again.</p>
  <p>✅ On the last puzzle, tap <b>Done</b>. After Done, you can't go back.</p>
  <p>🐢 There is no timer. Slow and careful wins.</p></div>
  <div class="tip"><b>Three test-taker tricks</b><p>1. Look at every answer before you choose.</p><p>2. Say the rule in your head, then check it.</p><p>3. Not sure? Pick your best guess. Never leave one blank.</p></div>
  <div class="row"><button class="btn" data-act="sayhowto">🔊 Read it to me</button><button class="btn primary" data-act="home">Got it</button></div></div>`;
}
const HOWTO_TEXT = 'Here is how the test works. You may wear headphones, and a voice reads everything to you. Tap Hear it again any time you want to listen again. Tap the picture you choose. You can change your mind. Tap Go for the next puzzle. Tap Back to look at the last one again. On the last puzzle, tap Done. After Done, you cannot go back. There is no timer, so slow and careful wins. Three tricks: look at every answer before you choose. Say the rule in your head, then check it. And if you are not sure, pick your best guess.';

function vIntro() {
  const d = SUBS[run.sub];
  const partLabel = run.mode === 'test' ? `Part ${run.si + 1} of ${run.subs.length}` : 'Practice';
  const btn = run.mode === 'test' ? 'Try the practice puzzles' : 'Start';
  return `<div class="msg pop"><p class="muted">${partLabel}</p><div class="bigemo" aria-hidden="true">${d.ic}</div><h1>${d.kid}</h1>
  <p class="say">${d.dir}</p>${run.mode === 'skill' ? `<div class="tip"><b>Tip:</b> ${d.tip}</div>` : ''}
  <div class="row"><button class="btn" data-act="sayintro">🔊 Hear it again</button><button class="btn primary big" data-act="beginq" data-autofocus>${btn}</button></div>
  <p class="muted" style="margin-top:16px;font-size:.85rem">${d.off}</p>
  <div class="row" style="margin-top:6px"><button class="link" data-act="quit">Stop and go home</button></div></div>`;
}
function vReady() {
  return `<div class="msg pop"><div class="bigemo">👍</div><h1>Now you work by yourself</h1>
  <p class="say">Nice work on the practice. Now it's just like the real test: nobody will tell you if an answer is right until the end. Take your time and look at every answer.</p>
  <div class="row"><button class="btn" data-act="sayready">🔊 Hear it again</button><button class="btn primary big" data-act="startitems" data-autofocus>I'm ready</button></div></div>`;
}
const READY_TEXT = "Nice work on the practice. Now it's just like the real test. Nobody will tell you if an answer is right until the end. Take your time, and look at every answer before you choose.";
function vBreak() {
  const next = SUBS[run.subs[run.si]];
  return `<div class="msg pop"><div class="bigemo">🙆</div><h1>Stretch break!</h1>
  <p class="say">You finished part ${run.si} of ${run.subs.length}. Stand up, wiggle, and take a sip of water. Next up: <b>${next.kid}</b>.</p>
  <div class="row"><button class="btn primary big" data-act="nextsub" data-autofocus>Keep going</button></div>
  <div class="row"><button class="link" data-act="quit">Stop for today</button></div></div>`;
}

function vQuestion() {
  const it = current(); const d = SUBS[run.sub];
  const fbm = feedbackMode();
  const inPractice = run.phase === 'practice';
  const idx = inPractice ? run.pi : run.qi;
  const total = inPractice ? run.practice.length : run.items.length;
  const sel = inPractice ? run.psel : run.answers[run.qi];
  const checked = run.checked;
  const last = !inPractice && run.qi === run.items.length - 1;
  let goLabel = 'Go', goAct = 'go', goDis = !(sel >= 0) || run.speaking;
  if (fbm && !checked) { goLabel = 'Check'; goAct = 'check'; }
  else if (!fbm && last) { goLabel = 'Done'; goAct = 'done'; }
  if (fbm && checked) goDis = false;
  const ansCls = i => { if (!(fbm && checked)) return ''; if (i === it.answer) return 'right'; if (i === sel) return 'wrong'; return ''; };
  let fb = '';
  if (fbm && checked) {
    const ok = sel === it.answer;
    fb = `<div class="fb show ${ok ? 'good' : 'bad'}"><b>${ok ? esc(run.praise) : 'Not quite.'}</b>${esc(it.explain)}</div>`;
  } else fb = '<div class="fb"></div>';
  const showCaption = S.settings.captions && run.sub !== 'sc';
  return `<div class="qwrap ${S.settings.captions ? '' : 'nocap'}"><div class="qbar"><div class="qtitle">${d.kid}${inPractice ? '<span class="qtag">Practice</span>' : run.mode === 'skill' ? '<span class="qtag">Learning mode</span>' : ''}</div>
  <div class="qprog">Puzzle ${idx + 1} of ${total}</div>
  <button class="hear ${run.speaking ? 'playing' : ''}" data-act="hear" aria-label="Hear the question again">🔊 Hear it again</button></div>
  <div class="qmain"><div class="stim pop">${it.stim}</div>
  ${showCaption ? `<div class="caption">${esc(it.prompt)}</div>` : ''}
  <div class="answers" role="radiogroup" aria-label="Answer choices">${it.choices.map((c, i) => `<button class="ans ${ansCls(i)}" role="radio" aria-checked="${sel === i}" data-act="choose" data-i="${i}" ${fbm && checked ? 'disabled' : ''}><span class="sr-only">Answer ${'ABCD'[i]}: </span><div class="ai">${c}</div><span class="bub" aria-hidden="true">${'ABCD'[i]}</span></button>`).join('')}</div>
  ${fb}</div>
  <div class="qfoot"><div>${!fbm && run.qi > 0 ? '<button class="btn" data-act="back">Back</button>' : '<button class="link" data-act="quit">Stop</button>'}</div>
  <button class="btn primary go" data-act="${goAct}" ${goDis ? 'disabled' : ''}>${goLabel}</button></div></div>`;
}

function vResults() {
  const rows = run.results.map(r => { const p = pct(r.correct, r.n); return `<div class="resrow"><div><b>${SUBS[r.sub].kid}</b><div class="muted" style="font-size:.85rem">${SUBS[r.sub].off}</div></div><div>${r.correct} of ${r.n}</div>${starHTML(starsFor(p))}</div>`; }).join('');
  const missed = run.results.reduce((a, r) => a + r.missed.length, 0);
  return `<div class="msg pop"><div class="bigemo">🎉</div><h1>You finished${run.mode === 'test' ? ' the pretend test day' : ''}!</h1>
  <p class="say">${missed ? `Let's look at the ${missed === 1 ? 'one' : missed} puzzle${missed === 1 ? '' : 's'} to fix. That's how brains get stronger.` : 'You got every single one. Wow!'}</p>
  <div class="res">${rows}</div>
  <div class="row">${missed ? '<button class="btn primary big" data-act="review" data-autofocus>Look at the ones to fix</button>' : ''}<button class="btn" data-act="home">Home</button></div></div>`;
}
function vReview() {
  const list = run.results.flatMap(r => r.missed.map(m => ({ ...m, sub: r.sub })));
  return `<div class="top"><div><h1>Puzzles to fix</h1><p class="muted">Look at each one together. Tap 🔊 to hear why.</p></div><div class="top-actions"><button class="btn primary" data-act="home">Done looking</button></div></div>
  ${list.map((m, k) => `<div class="rv"><div class="muted">${SUBS[m.sub].kid}</div><div class="stim">${m.it.stim}</div>
  ${m.it.sub === 'sc' ? '' : `<div class="caption">${esc(m.it.prompt)}</div>`}
  <div class="picks">${m.pick >= 0 ? `<div class="pk mine"><div class="ai">${m.it.choices[m.pick]}</div>You picked</div>` : `<div class="pk mine"><div class="ai">—</div>No answer</div>`}<div class="pk corr"><div class="ai">${m.it.choices[m.it.answer]}</div>The answer</div></div>
  <p class="why">${esc(m.it.explain)}</p><button class="btn" data-act="sayexp" data-k="${k}">🔊 Hear why</button></div>`).join('')}
  <div class="row" style="display:flex;justify-content:center;margin-top:10px"><button class="btn primary big" data-act="home">Done looking</button></div>`;
}

let gateQ = [6, 7];
function vGate() {
  return `<div class="msg pop"><h1>Grown-ups only</h1><p class="say">What is ${gateQ[0]} × ${gateQ[1]}?</p>
  <form class="row gate" data-form="gate"><input name="a" inputmode="numeric" maxlength="3" autocomplete="off" data-autofocus aria-label="Answer"><button class="btn primary" type="submit">Enter</button></form>
  <p class="muted" id="gatemsg" style="min-height:1.4em"></p><div class="row"><button class="link" data-act="home">Back</button></div></div>`;
}

function vParent() {
  const allSubs = Object.keys(SUBS);
  const rows = allSubs.map(sub => { const st = subStats(sub); const d = SUBS[sub];
    if (!st) return `<tr><td><b>${d.off}</b><div class="muted" style="font-size:.8rem">${d.kid}</div></td><td colspan="5" class="muted">Not practiced yet</td></tr>`;
    return `<tr><td><b>${d.off}</b><div class="muted" style="font-size:.8rem">${d.kid}</div></td><td>${st.runs}</td><td>${st.last}%</td><td>${st.best}%</td><td><div class="spark" aria-label="Recent scores ${st.recent.join(', ')} percent">${st.recent.map(p => `<i style="height:${Math.max(6, p)}%"></i>`).join('')}</div></td><td>${Math.round(st.secs)}s</td></tr>`; }).join('');
  const halves = s => {
    if (!s.items || s.items.length < 4) return '<span class="muted">—</span>';
    const h = Math.ceil(s.items.length / 2);
    const a1 = s.items.slice(0, h), a2 = s.items.slice(h);
    const p = arr => pct(arr.filter(x => x.c).length, arr.length);
    const drop = p(a1) - p(a2);
    return `${p(a1)}% → ${p(a2)}%${drop >= 25 ? ' <span class="flag">fades</span>' : ''}`;
  };
  const marks = s => s.items ? `<div class="marks" aria-label="${s.items.map(x => x.c ? 'right' : 'wrong').join(', ')}">${s.items.map(x => `<i class="${x.c ? 'ok' : 'no'}" title="${x.s}s${x.r ? ', ' + x.r + ' replay' + (x.r > 1 ? 's' : '') : ''}${x.ch ? ', changed answer' : ''}"></i>`).join('')}</div>` : '<span class="muted">—</span>';
  const recent = S.sessions.slice(-15).reverse().map(s => `<tr><td>${fmtDate(s.ts)}</td><td>${SUBS[s.sub] ? SUBS[s.sub].off : s.sub}</td><td>${s.mode === 'test' ? 'Test day' : 'Learning'}</td><td>${s.correct}/${s.n}</td><td>${Math.round((s.secs || 0) / 60 * 10) / 10} min</td><td>${marks(s)}</td><td>${halves(s)}</td></tr>`).join('');
  return `<div class="pp"><div class="top"><div><h1>Grown-ups: ${esc(S.name)}</h1><p class="sync">Progress is saved only in this browser, on this device. Nothing is sent anywhere.</p></div><div class="top-actions"><button class="btn primary" data-act="home">Back to puzzles</button></div></div>
  <h2>Progress by subtest</h2>
  <div class="tablewrap"><table><thead><tr><th>Subtest</th><th>Runs</th><th>Last</th><th>Best</th><th>Recent</th><th>Avg per puzzle</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="muted" style="font-size:.9rem">Scores include both modes. In learning mode, only first tries count. A very low time per puzzle alongside misses usually means rushing.</p>
  <h2>Recent sessions</h2>
  ${recent ? `<div class="tablewrap"><table><thead><tr><th>When</th><th>Subtest</th><th>Mode</th><th>Score</th><th>Time</th><th>Puzzle by puzzle</th><th>First half → second half</th></tr></thead><tbody>${recent}</tbody></table></div>
  <p class="muted" style="font-size:.9rem">Each small square is one puzzle, in the order your child saw them: filled means right, hollow means wrong. Hover or tap a square for its time, replays, and whether your child changed the answer. Puzzles get harder toward the end of a set, so some misses on the right are expected. A drop of 25 points or more from the first half to the second is flagged.</p>` : '<p class="muted">No sessions yet. They appear here after each puzzle set.</p>'}
  <h2>Settings</h2>
  <form class="form" data-form="settings">
    <label for="s-name">Child's first name</label><input id="s-name" type="text" name="name" maxlength="24" value="${esc(S.name)}">
    <label for="s-n">Puzzles per part on test day</label><select id="s-n" name="n">${[8, 12, 16].map(n => `<option value="${n}" ${S.settings.n === n ? 'selected' : ''}>${n}${n === 16 ? ' (closest to the real length)' : ''}</option>`).join('')}</select>
    <label for="s-ln">Puzzles in a learning set</label><select id="s-ln" name="ln">${[8, 12, 16].map(n => `<option value="${n}" ${(S.settings.ln || 8) === n ? 'selected' : ''}>${n}${n === 8 ? ' (good for a new type)' : ''}</option>`).join('')}</select>
    <label for="s-v">Read-aloud voice</label><select id="s-v" name="voice"><option value="1" ${S.settings.voice ? 'selected' : ''}>On</option><option value="0" ${!S.settings.voice ? 'selected' : ''}>Off</option></select>
    <label for="s-r">Voice speed</label><select id="s-r" name="rate">${[[0.8, 'Slow'], [0.9, 'Normal'], [1.0, 'Quick']].map(([v, l]) => `<option value="${v}" ${S.settings.rate === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <label for="s-c">Show the spoken question as text</label><select id="s-c" name="captions"><option value="1" ${S.settings.captions ? 'selected' : ''}>Yes</option><option value="0" ${!S.settings.captions ? 'selected' : ''}>No (closer to the real test)</option></select>
    <span></span><div><button class="btn primary" type="submit">Save settings</button> <button class="btn" type="button" data-act="testvoice">Test the voice</button> <span id="savedmsg" class="muted"></span></div>
  </form>
  ${Voice.ok ? '' : '<p class="muted">This browser does not support read-aloud. Try Chrome, Edge, or Safari, or read the questions to your child.</p>'}
  <h2>About these puzzles</h2>
  <div class="notes"><ul>
    <li>All puzzles are original, written in the style of the nine CogAT Level 8 subtests. None are real test items.</li>
    <li>Number, bead, shape, and paper-folding puzzles are generated fresh every time, so repeat practice never runs out. The picture puzzles (Verbal battery) come from a fixed set that rotates so your child sees new ones first.</li>
    <li>Test-day mode follows the real format: spoken directions, practice questions with feedback, then answers with Back, Go, and a final Done.</li>
    <li>Scores here are practice scores. They do not predict a CogAT percentile.</li>
  </ul></div>
  <h2>Children on this device</h2>
  <div class="tablewrap"><table><thead><tr><th>Name</th><th>Puzzle sets</th><th>Last practiced</th><th></th></tr></thead><tbody>
  ${DB.kids.map(k => `<tr><td><b>${esc(k.name)}</b>${k.id === DB.active ? ' <span class="muted">(showing now)</span>' : ''}</td><td>${k.sessions.length}</td><td>${k.sessions.length ? fmtDate(k.sessions[k.sessions.length - 1].ts) : '<span class="muted">Not yet</span>'}</td><td>${k.id === DB.active ? '' : `<button class="link" data-act="pickkid" data-id="${esc(k.id)}" data-stay="1">Show</button>`}</td></tr>`).join('')}
  </tbody></table></div>
  <p class="muted" style="font-size:.9rem">To add a child, go back to the puzzles and tap “Add another child” under the greeting.</p>
  <h2>Keep a backup</h2>
  <div class="notes">
    <p>Because nothing is stored online, progress lives only in this browser. It can be lost if you clear your browsing history or site data, use a private window, or switch browsers or devices.</p>
    <p><b>On iPhone and iPad:</b> Safari erases a website's saved data if you use Safari for 7 days without opening that site. Adding OpenedCog to your Home Screen (Share button, then “Add to Home Screen”) avoids this.</p>
    <p>A backup file keeps progress safe and lets you move it to another device. It includes every child on this device. Keep it somewhere private, since it holds your children's names and scores.</p>
    <div class="backup"><button class="btn primary" data-act="export">Save a backup file</button>
    <button class="btn" data-act="import">Load a backup file</button><input id="importfile" class="sr-only" type="file" accept=".json,application/json" tabindex="-1" aria-hidden="true"></div>
    <p id="backupmsg" class="muted" role="status" style="min-height:1.4em"></p>
  </div>
  ${storageOK ? '' : '<p class="warn">This browser isn\'t letting the site save progress right now (this can happen in private browsing). Save a backup file before you close the page.</p>'}
  <h2>Erase</h2><p class="backup"><button class="btn" data-act="reset">Erase ${esc(S.name)}'s progress</button><button class="btn" data-act="removekid">Remove ${esc(S.name)} from this device</button></p></div>`;
}

// ---------- actions ----------
let spSeq = 0;
async function speakCurrent(extra) {
  const it = current(); if (!it) return;
  const t = ++spSeq;
  run.speaking = true; updateSpeaking();
  await Voice.say(extra || it.prompt);
  if (t === spSeq && run) { run.speaking = false; updateSpeaking(); }
}
function updateSpeaking() {
  if (view !== 'q') return;
  const h = $app.querySelector('.hear'); if (h) h.classList.toggle('playing', !!run.speaking);
  const go = $app.querySelector('.go'); if (!go) return;
  const inPractice = run.phase === 'practice'; const sel = inPractice ? run.psel : run.answers[run.qi];
  const fbm = feedbackMode();
  go.disabled = fbm && run.checked ? false : (!(sel >= 0) || !!run.speaking);
}
function showQ() {
  run.checked = false; run.psel = -1; run.qStart = Date.now();
  view = 'q'; render(); speakCurrent();
}
function recordTime() { if (run.phase === 'items') run.times[run.qi] += Date.now() - run.qStart; run.qStart = Date.now(); }
function finishSub() {
  recordTime();
  const items = run.items;
  let correct = 0; const missed = [];
  items.forEach((it, i) => {
    const got = run.mode === 'skill' ? run.firstTry[i] === it.answer : run.answers[i] === it.answer;
    if (got) correct++; else missed.push({ it, pick: run.mode === 'skill' ? run.firstTry[i] : run.answers[i] });
  });
  const secs = Math.round(run.times.reduce((a, b) => a + b, 0) / 1000);
  const tier = i => (i < items.length * 0.34 ? 0 : i < items.length * 0.7 ? 1 : 2);
  const detail = items.map((it, i) => ({
    c: (run.mode === 'skill' ? run.firstTry[i] === it.answer : run.answers[i] === it.answer) ? 1 : 0,
    s: Math.round(run.times[i] / 1000), r: run.replays[i], ch: run.changes[i], d: tier(i),
  }));
  run.results.push({ sub: run.sub, n: items.length, correct, missed });
  S.sessions.push({ id: newId(), ts: Date.now(), mode: run.mode, sub: run.sub, n: items.length, correct, secs, items: detail });
  save();
  run.si++;
  if (run.si < run.subs.length) { view = 'brk'; render(); Voice.say(`Stretch break! Next up: ${SUBS[run.subs[run.si]].kid}.`); }
  else { view = 'results'; render(); Voice.say('You finished! Great work.'); }
}

$app.addEventListener('click', e => {
  Voice.prime();
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const act = b.dataset.act;
  if (modal && !['mconfirm', 'mcancel', 'mreset', 'mremove'].includes(act)) return;
  switch (act) {
    case 'home': case 'quit':
      if (act === 'quit' && view === 'q' && run && run.phase === 'items' && run.mode === 'test') { openModal('quit'); return; }
      Voice.stop(); run = null; view = 'home'; render(); break;
    case 'howto': view = 'howto'; render(); break;
    case 'sayhowto': Voice.say(HOWTO_TEXT); break;
    case 'gate': gateQ = [6 + Math.floor(Math.random() * 4), 6 + Math.floor(Math.random() * 4)]; view = 'gate'; render(); break;
    case 'test': startTest(b.dataset.fam); Voice.say(SUBS[run.sub].dir); break;
    case 'skill': startSkill(b.dataset.sub); Voice.say(SUBS[run.sub].dir + ' Tip: ' + SUBS[run.sub].tip); break;
    case 'sayintro': Voice.say(SUBS[run.sub].dir + (run.mode === 'skill' ? ' Tip: ' + SUBS[run.sub].tip : '')); break;
    case 'beginq': Voice.stop(); run.phase = run.mode === 'test' ? 'practice' : 'items'; run.pi = 0; run.qi = 0; showQ(); break;
    case 'sayready': Voice.say(READY_TEXT); break;
    case 'startitems': Voice.stop(); run.phase = 'items'; run.qi = 0; showQ(); break;
    case 'nextsub': Voice.stop(); beginSub(); Voice.say(SUBS[run.sub].dir); break;
    case 'hear': if (run.phase === 'items') run.replays[run.qi]++; speakCurrent(); break;
    case 'choose': {
      const i = +b.dataset.i;
      if (run.phase === 'practice') run.psel = i;
      else { if (run.answers[run.qi] >= 0 && run.answers[run.qi] !== i) run.changes[run.qi]++; run.answers[run.qi] = i; }
      $app.querySelectorAll('.ans').forEach((el, k) => el.setAttribute('aria-checked', String(k === i)));
      updateSpeaking(); break;
    }
    case 'check': {
      const it = current(); const sel = run.phase === 'practice' ? run.psel : run.answers[run.qi];
      if (run.phase === 'items' && run.firstTry[run.qi] === null) run.firstTry[run.qi] = sel;
      run.checked = true; run.praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
      render();
      const ok = sel === it.answer;
      speakCurrent(ok ? run.praise : 'Not quite. ' + it.explain);
      break;
    }
    case 'go': {
      Voice.stop(); run.speaking = false;
      if (run.phase === 'practice') {
        if (run.pi < run.practice.length - 1) { run.pi++; showQ(); }
        else { view = 'ready'; render(); Voice.say(READY_TEXT); }
      } else {
        recordTime();
        if (run.qi < run.items.length - 1) { run.qi++; showQ(); }
        else finishSub();
      }
      break;
    }
    case 'back': Voice.stop(); run.speaking = false; recordTime(); if (run.qi > 0) { run.qi--; showQ(); } break;
    case 'done': openModal('done'); break;
    case 'mcancel': closeModal(); break;
    case 'mconfirm': { const kind = modal.kind; closeModal(); if (kind === 'done') { Voice.stop(); finishSub(); } else if (kind === 'quit') { Voice.stop(); run = null; view = 'home'; render(); } break; }
    case 'review': Voice.stop(); view = 'review'; render(); break;
    case 'sayexp': { const list = run.results.flatMap(r => r.missed); const m = list[+b.dataset.k]; if (m) Voice.say(m.it.explain); break; }
    case 'testvoice': Voice.say('Hi! This is how I will read the puzzles.'); break;
    case 'reset': openModal('reset'); break;
    case 'mreset': closeModal(); S.sessions = []; S.seen = { pa: [], sc: [], pc: [] }; save(); render(); break;
    case 'mremove': closeModal(); removeChild(DB.active); view = S ? 'parent' : 'welcome'; render(); break;
    case 'removekid': openModal('removekid'); break;
    case 'import': { const inp = document.getElementById('importfile'); if (inp) inp.click(); break; }
    case 'pick': view = 'pick'; render(); break;
    case 'pickkid': setActive(b.dataset.id); view = b.dataset.stay ? 'parent' : 'home'; render(); break;
    case 'export': { const fname = exportFile(); const m = document.getElementById('backupmsg'); if (m) m.textContent = `Saved ${fname}. Check your Downloads.`; break; }
  }
});
function openModal(kind) {
  const txt = {
    done: ['Are you all done?', 'After you tap Done, you can\'t go back to change answers.', 'Done', 'Go back'],
    quit: ['Stop this test day?', 'Your answers for this part won\'t be saved.', 'Stop', 'Keep going'],
    reset: [`Erase ${S ? S.name : ''}'s progress?`, 'This removes every score and session for this child on this device. The name and settings stay. Save a backup file first if you might want it later.', 'Erase', 'Cancel'],
    removekid: [`Remove ${S ? S.name : ''}?`, 'This removes this child and all of their progress from this device. Save a backup file first if you might want it later.', 'Remove', 'Cancel'],
  }[kind];
  modal = { kind, html: `<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="modal pop"><h2 id="mt">${esc(txt[0])}</h2><p>${esc(txt[1])}</p><div class="row"><button class="btn" data-act="mcancel">${esc(txt[3])}</button><button class="btn primary" data-act="${kind === 'reset' ? 'mreset' : kind === 'removekid' ? 'mremove' : 'mconfirm'}" data-autofocus>${esc(txt[2])}</button></div></div></div>` };
  $app.insertAdjacentHTML('beforeend', modal.html);
  pictures($app.querySelector('.scrim'));
  const f = $app.querySelector('.scrim [data-autofocus]'); if (f) f.focus();
  if (kind === 'done') Voice.say(txt[0] + ' ' + txt[1]);
}
function closeModal() { modal = null; const s = $app.querySelector('.scrim'); if (s) s.remove(); }

$app.addEventListener('change', e => {
  if (e.target.id !== 'importfile') return;
  const file = e.target.files && e.target.files[0]; if (!file) return;
  const say = t => { const m = document.getElementById('backupmsg'); if (m) m.textContent = t; };
  if (file.size > MAX_IMPORT_BYTES) { say("That file is too big to be an OpenedCog backup."); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const r = parseBackup(String(reader.result || ''));
    if (r.error) { say(r.error); return; }
    const report = importKids(r.kids);
    if (view === 'welcome' && S) view = 'home';
    render();
    say('Backup loaded. ' + report.join('; ') + '.');
  };
  reader.onerror = () => say("That file couldn't be opened.");
  reader.readAsText(file);
});

$app.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target; const kind = f.dataset.form;
  if (kind === 'name' || kind === 'addkid') { if (!addChild(f.n.value)) return; view = 'home'; render(); }
  if (kind === 'gate') { if (+(f.a.value || '').trim() === gateQ[0] * gateQ[1]) { view = 'parent'; render(); } else { const m = document.getElementById('gatemsg'); if (m) m.textContent = 'Not quite. Ask a grown-up.'; f.a.value = ''; } }
  if (kind === 'settings') {
    S.name = cleanName(f.name.value) || S.name;
    S.settings.n = +f.n.value; S.settings.ln = +f.ln.value; S.settings.voice = f.voice.value === '1'; S.settings.rate = +f.rate.value; S.settings.captions = f.captions.value === '1';
    save(); const m = document.getElementById('savedmsg'); if (m) m.textContent = 'Saved.';
  }
});
document.addEventListener('keydown', e => {
  if (view !== 'q' || modal) return;
  const k = e.key.toUpperCase(); const map = { A: 0, B: 1, C: 2, D: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
  if (k in map && !(feedbackMode() && run.checked)) { const btn = $app.querySelector(`.ans[data-i="${map[k]}"]`); if (btn) btn.click(); }
});

view = S ? 'home' : 'welcome';
render();
})();

