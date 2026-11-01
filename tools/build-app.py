"""Builds the 'Sanady for everyone' app at /app/ from the main index.html.
Same code, separate app: own install, own data (sm_ prefix), own alarms. Run after editing index.html."""
import json, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(R, 'index.html'), encoding='utf-8').read()
s = s.replace('<title>سندي ADHD</title>', '<title>سندي</title>')
s = s.replace('content="سندي: سندك اللي جواك. Agent بالعامية بيرتب دماغك ويفكّرك ويبدأ معاك."', 'content="سندي: بيرتب يومك وبيتك وفلوسك ويفكّرك في الوقت الصح."')
for f in ['icon-192.png', 'apple-touch-icon.png', 'app.css', 'sounds.js', 'app.js', 'family.js', 'life.js', 'demo.js']:
    s = re.sub(r'(href|src)="' + re.escape(f) + '"', r'\1="../' + f + '"', s)
s = s.replace('<script src="../sounds.js"></script>', '<script>window.SANADY_ED="main"</script>\n<script src="../sounds.js"></script>')
s = s.replace('href="privacy.html"', 'href="../privacy.html"')
open(os.path.join(R, 'app', 'index.html'), 'w', encoding='utf-8').write(s)
m = json.load(open(os.path.join(R, 'manifest.webmanifest'), encoding='utf-8'))
m.update({'id': './', 'name': 'سندي', 'short_name': 'سندي', 'description': 'سندي: بيرتب يومك وبيتك وفلوسك ويفكّرك في الوقت الصح', 'background_color': '#101326', 'theme_color': '#101326'})
for ic in m['icons']: ic['src'] = '../' + ic['src']
for sc in m.get('shortcuts', []):
    for ic in sc.get('icons', []): ic['src'] = '../' + ic['src']
json.dump(m, open(os.path.join(R, 'app', 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(R, 'app', 'sw.js'), 'w').write("/* Sanady for everyone: same worker as the ADHD app, its own scope, caches and alarms */\nimportScripts('../sw.js');\n")
print('built app/')
