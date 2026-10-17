// OpenedCog: swaps emoji for bundled Twemoji pictures. Shared by index.html and review.html.
// Code: MIT. Twemoji graphics: CC BY 4.0 (see emoji/README.md).
// Device emoji look different on every phone and tablet, and older devices are missing newer ones.
// So after each screen renders, every emoji is swapped for the same open-licensed Twemoji picture
// (CC BY 4.0, https://github.com/jdecked/twemoji), served from this site's emoji/ folder.
// The emoji character stays as the picture's alt text, so screen readers still announce it by name.
const EMOJI_RE = /\p{RI}\p{RI}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\p{EMod})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{EMod})?)*/gu;
const isPicture = m => /\p{Emoji_Presentation}|\uFE0F|\u200D|\u20E3|\p{RI}/u.test(m); // leaves text symbols like ★ © ® alone
const emojiFile = m => {
  const cps = [...(m.includes('\u200D') ? m : m.replace(/\uFE0F/g, ''))].map(c => c.codePointAt(0).toString(16));
  return 'emoji/' + cps.join('-') + '.svg';
};
function pictures(root) {
  const nodes = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const p = n.parentNode;
    if (!p || p.closest('svg, script, style, textarea, option')) continue;
    EMOJI_RE.lastIndex = 0;
    if (EMOJI_RE.test(n.nodeValue)) nodes.push(n);
  }
  for (const n of nodes) {
    const text = n.nodeValue, frag = document.createDocumentFragment();
    let last = 0; EMOJI_RE.lastIndex = 0;
    for (let m; (m = EMOJI_RE.exec(text));) {
      if (!isPicture(m[0])) continue;
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const img = document.createElement('img');
      img.className = 'emoji'; img.alt = m[0]; img.draggable = false; img.decoding = 'async';
      img.src = emojiFile(m[0]);
      frag.appendChild(img);
      last = m.index + m[0].length;
    }
    if (last === 0) continue;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    n.parentNode.replaceChild(frag, n);
  }
}
