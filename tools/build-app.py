"""Builds مُدبّر (Mudabbir, the everyone edition) from the main index.html.
Same code as Sanady ADHD, separate app: own link (nrg1c3.github.io/mudabbir/), own install, own data (sm_ prefix), own alarms.
The app lives in the nrg1c3.github.io repo (cloned next to this one); its pages load the shared code from /Sanady/.
The old /Sanady/app/ address forwards there. Run after editing index.html, sw.js or the manifest."""
import json, os, re, shutil, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.environ.get('SITE_REPO', os.path.join(os.path.dirname(R), 'nrg1c3.github.io'))
OUT = os.path.join(SITE, 'mudabbir')
if not os.path.isdir(SITE): sys.exit('clone nrg1c3/nrg1c3.github.io next to this repo first (or set SITE_REPO)')
os.makedirs(OUT, exist_ok=True)
s = open(os.path.join(R, 'index.html'), encoding='utf-8').read()
s = s.replace('<title>سندي ADHD</title>', '<title>مُدبّر</title>')
s = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="مُدبّر: قولها وهو يدبّرها. بيرتب يومك وبيتك وفلوسك ويفكّرك في الوقت الصح.">', s)
s = re.sub(r'<meta name="theme-color" content="[^"]*">', '<meta name="theme-color" content="#0F5552">', s)
for f in ['app.css', 'sounds.js', 'app.js', 'family.js', 'life.js', 'sync.js', 'work.js', 'demo.js']:
    s = re.sub(r'(href|src)="' + re.escape(f) + '"', r'\1="/Sanady/' + f + '"', s)
s = s.replace('<script src="/Sanady/sounds.js"></script>', '<script>window.SANADY_ED="main"</script>\n<script src="/Sanady/sounds.js"></script>')
s = s.replace('href="privacy.html"', 'href="/Sanady/privacy.html?b=m"')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(s)
m = json.load(open(os.path.join(R, 'manifest.webmanifest'), encoding='utf-8'))
m.update({'id': '/mudabbir/', 'start_url': '/mudabbir/', 'scope': '/mudabbir/', 'name': 'مُدبّر', 'short_name': 'مُدبّر',
          'description': 'مُدبّر: قولها وهو يدبّرها. بيرتب يومك وبيتك وفلوسك ويفكّرك في الوقت الصح',
          'background_color': '#0F5552', 'theme_color': '#0F5552'})
m['shortcuts'] = [dict(sc, url=sc['url'].replace('./', '/mudabbir/')) for sc in m.get('shortcuts', [])]
json.dump(m, open(os.path.join(OUT, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(OUT, 'sw.js'), 'w', encoding='utf-8').write('/* generated from /Sanady/sw.js by tools/build-app.py: do not edit */\n' + open(os.path.join(R, 'sw.js'), encoding='utf-8').read())
for f in ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']:
    src = os.path.join(R, 'brand', 'mudabbir', f)
    if os.path.exists(src): shutil.copy(src, os.path.join(OUT, f))
# the old address forwards to the new one and retires its worker
os.makedirs(os.path.join(R, 'app'), exist_ok=True)
open(os.path.join(R, 'app', 'index.html'), 'w', encoding='utf-8').write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>مُدبّر</title><meta http-equiv="refresh" content="0;url=/mudabbir/"><script>location.replace("/mudabbir/"+location.search+location.hash)</script></head><body><a href="/mudabbir/">مُدبّر</a></body></html>')
open(os.path.join(R, 'app', 'sw.js'), 'w', encoding='utf-8').write("/* retired: the everyone edition moved to /mudabbir/ */\nself.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.registration.unregister()));\n")
p = os.path.join(R, 'app', 'manifest.webmanifest')
if os.path.exists(p): os.remove(p)
print('built', OUT)
