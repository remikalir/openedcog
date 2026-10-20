# Renders OpenedCog's icons and link-preview images from the bundled Twemoji puzzle piece
# (emoji/1f9e9.svg, CC BY 4.0) and the site's own font. Run from the repository folder:
#
#   pip install playwright && python -m playwright install chromium
#   python tools/make-images.py
#
# Writes icons/*.png, og-image.png (link previews), and .github/social-preview.png (GitHub's repo card).
import pathlib, tempfile
from playwright.sync_api import sync_playwright
SITE = pathlib.Path(__file__).resolve().parent.parent
PUZ = (SITE / 'emoji/1f9e9.svg').as_uri()
FONT = (SITE / 'fonts/andika-latin-700.woff2').as_uri()
FONT4 = (SITE / 'fonts/andika-latin-400.woff2').as_uri()
E = lambda cp: (SITE / f'emoji/{cp}.svg').as_uri()

def icon_html(size, pad, radius, bg):
    return f'''<html><body style="margin:0;background:transparent">
    <div style="width:{size}px;height:{size}px;background:{bg};border-radius:{radius}px;display:flex;align-items:center;justify-content:center">
      <img src="{PUZ}" style="width:{size-2*pad}px;height:{size-2*pad}px"></div></body></html>'''

OG = f'''<html><head><style>
@font-face{{font-family:A;src:url({FONT}) format('woff2');font-weight:700}}
@font-face{{font-family:A;src:url({FONT4}) format('woff2');font-weight:400}}
body{{margin:0;width:100vw;height:100vh;background:#EEF3FA;font-family:A,sans-serif;color:#1C2A44;overflow:hidden}}
.wrap{{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column}}
.top{{display:flex;align-items:center;gap:30px}}
h1{{font-size:104px;margin:0;line-height:1;letter-spacing:-1px}}
.sub{{font-size:42px;line-height:1.28;margin:34px 0 0;max-width:740px}}
.chips{{display:flex;gap:16px;margin-top:38px}}
.chip{{font-size:30px;font-weight:700;background:#fff;border-radius:999px;padding:12px 26px;box-shadow:inset 0 0 0 3px #C9D3E3}}
.chip.g{{background:#E3F4EB;box-shadow:inset 0 0 0 3px #1F8A57}}
.foot{{margin-top:auto;font-size:24px;color:#5A6782;display:flex;justify-content:space-between}}
.card{{position:absolute;right:80px;top:190px;background:#fff;border-radius:22px;box-shadow:inset 0 0 0 3px #C9D3E3;padding:18px;display:grid;grid-template-columns:repeat(2,118px);grid-auto-rows:118px;gap:0}}
.card div{{display:flex;align-items:center;justify-content:center;border:1px solid #E1E7F0;width:118px;height:118px}}
.card img{{width:80px;height:80px}}
.q{{font-size:64px;font-weight:700;color:#5A6782;background:#EEF3FA}}
</style></head><body><div class="wrap">
<div class="top"><img src="{PUZ}" style="width:120px;height:120px"><h1>OpenedCog</h1></div>
<p class="sub">Free, open puzzle practice for the <b>CogAT® Level&nbsp;8</b> (grade&nbsp;2). All nine subtests, read aloud.</p>
<div class="chips"><span class="chip g">No accounts</span><span class="chip g">No tracking</span><span class="chip">Open source</span></div>
<div class="foot"><span>remikalir.github.io/openedcog</span><span>Independent. Not affiliated with Riverside Insights.</span></div>
</div>
<div class="card"><div><img src="{E('1f404')}"></div><div><img src="{E('1f95b')}"></div><div><img src="{E('1f414')}"></div><div class="q">?</div></div>
</body></html>'''

with sync_playwright() as p:
    b = p.chromium.launch()
    def shot(html, w, h, out, transparent=False):
        pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        f = pathlib.Path(tempfile.gettempdir()) / 'openedcog-render.html'; f.write_text(html)
        pg.goto(f.as_uri()); pg.wait_for_load_state('load'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(300)
        assert pg.evaluate("[...document.images].every(i => i.complete && i.naturalWidth > 0)"), 'a picture failed to load'
        pg.screenshot(path=str(SITE / out), omit_background=transparent, clip={'x': 0, 'y': 0, 'width': w, 'height': h})
        pg.close()
    # browser-tab fallback (transparent), iOS Home Screen (opaque, iOS rounds the corners itself), Android / install icons
    shot(icon_html(32, 1, 0, 'transparent'), 32, 32, 'icons/icon-32.png', transparent=True)
    shot(icon_html(180, 26, 0, '#EEF3FA'), 180, 180, 'icons/apple-touch-icon.png')
    shot(icon_html(192, 28, 0, '#EEF3FA'), 192, 192, 'icons/icon-192.png')
    shot(icon_html(512, 104, 0, '#EEF3FA'), 512, 512, 'icons/icon-512-maskable.png')   # generous padding: safe zone for masked icons
    shot(icon_html(512, 56, 0, '#EEF3FA'), 512, 512, 'icons/icon-512.png')
    shot(OG, 1200, 630, 'og-image.png')
    (SITE / '.github').mkdir(exist_ok=True)
    shot(OG, 1280, 640, '.github/social-preview.png')
    b.close()
print('done')
