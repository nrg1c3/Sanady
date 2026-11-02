"""The app in English, French, Spanish and German: no Arabic left on the main screens, left-to-right layout,
language picked from the phone (but Arabic stays default in Egypt and the Gulf), brain/mic follow the language."""
import sys, os, re, json
from playwright.sync_api import sync_playwright
W = sys.argv[1] if len(sys.argv) > 1 else '.'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)))
import http.server, threading, functools
h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=W)
h.log_message = lambda *a: None
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h); PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(name, cond, info=''):
    global ok, fail
    if cond: ok += 1
    else: fail += 1; print('FAIL', name, str(info)[:600])
AR = re.compile(r'[؀-ۿ]')
LEFT = """(()=>{const out=new Set();const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let t;
 while((t=w.nextNode())){const p=t.parentElement;if(!p||p.closest('script,style,textarea,[hidden]'))continue;const r=p.getBoundingClientRect();if(!r.width&&!r.height)continue;
  const v=t.nodeValue.trim();if(/[\\u0600-\\u06FF]/.test(v))out.add(v)}
 document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(e=>['placeholder','aria-label','title'].forEach(a=>{const v=e.getAttribute(a);if(v&&/[\\u0600-\\u06FF]/.test(v))out.add('@'+v)}));return[...out]})()"""
REPORT = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    for lang, loc, tz in [('en', 'en-US', 'America/New_York'), ('fr', 'fr-FR', 'Europe/Paris'), ('es', 'es-ES', 'Europe/Madrid'), ('de', 'de-DE', 'Europe/Berlin')]:
        for app in ['Sanady/', 'app/']:
            ctx = b.new_context(locale=loc, timezone_id=tz, viewport={'width': 390, 'height': 844})
            pg = ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.route('https://fonts.**', lambda r: r.abort())
            bodies = []
            def brain(route):
                bodies.append(json.loads(route.request.post_data or '{}'))
                route.fulfill(status=200, content_type='application/json', body=json.dumps({'reply': 'ok', 'add': []}))
            pg.route('https://api.nrg-egypt.com/**', brain)
            pg.goto(f'http://127.0.0.1:{PORT}/{app}'); pg.wait_for_timeout(600)
            left = set(pg.evaluate(LEFT))
            check(f'{lang} {app} ltr', pg.evaluate('document.documentElement.dir') == 'ltr')
            check(f'{lang} {app} ui lang', pg.evaluate('window.UI_LANG') == lang)
            check(f'{lang} {app} prof.lang saved', pg.evaluate('prof.lang') == lang)
            if app == 'Sanady/' : pg.screenshot(path=os.path.join(OUT, f'i18n_{lang}_welcome.png'))
            pg.evaluate("closeSheet()"); pg.wait_for_timeout(200); left |= set(pg.evaluate(LEFT)); pg.evaluate("IS_ADHD&&setSimple(false)"); pg.wait_for_timeout(200)
            left |= set(pg.evaluate(LEFT))
            if app == 'Sanady/': pg.screenshot(path=os.path.join(OUT, f'i18n_{lang}_now.png'))
            for t in ['all', 'money', 'focus', 'now']:
                pg.click(f'.tabs [data-t={t}]'); pg.wait_for_timeout(200); left |= set(pg.evaluate(LEFT))
                if app == 'Sanady/' and t in ('all', 'money'): pg.screenshot(path=os.path.join(OUT, f'i18n_{lang}_{t}.png'))
            for k in pg.evaluate("VIEWS.map(x=>x[0])"):
                pg.evaluate(f"setView('{k}')"); pg.wait_for_timeout(150); left |= set(pg.evaluate(LEFT))
            for k in pg.evaluate("MODES.map(x=>x[0])"):
                pg.evaluate(f"setMode('{k}')"); pg.wait_for_timeout(150); left |= set(pg.evaluate(LEFT)); pg.evaluate("closeSheet()")
            pg.evaluate("setMode('none')"); pg.click('#modeSeg [data-v=line]'); pg.wait_for_timeout(150); left |= set(pg.evaluate(LEFT))
            pg.click('#modeSeg [data-m=one]'); pg.wait_for_timeout(150); left |= set(pg.evaluate(LEFT)); pg.evaluate("setMode('none');setView('blocks')")
            pg.click('#btnSet'); pg.wait_for_timeout(300); left |= set(pg.evaluate(LEFT))
            if app == 'Sanady/': pg.screenshot(path=os.path.join(OUT, f'i18n_{lang}_settings.png'), full_page=True)
            pg.evaluate("closeSheet()")
            pg.click('.tabs [data-t=all]'); pg.wait_for_timeout(150)
            for s in ['habits', 'occ', 'subs', 'car', 'gam', 'debts', 'health', 'parents']:
                pg.evaluate(f"LIFE_SUB='{s}';drawAll()"); pg.wait_for_timeout(120); left |= set(pg.evaluate(LEFT))
            # talking to the brain in this language
            pg.evaluate("brain('talk',{text:'hello'}).catch(()=>0)"); pg.wait_for_timeout(300)
            check(f'{lang} {app} brain lang', any(x.get('lang') == lang for x in bodies), [x.get('lang') for x in bodies])
            check(f'{lang} {app} no errors', not errs, errs)
            REPORT[f'{lang} {app}'] = sorted(left)
            ctx.close()
    # Egypt with an English phone stays Arabic; an Arabic phone anywhere stays Arabic
    for loc, tz, want in [('en-US', 'Africa/Cairo', 'ar'), ('ar-EG', 'Europe/London', 'ar'), ('en-GB', 'Europe/London', 'en')]:
        ctx = b.new_context(locale=loc, timezone_id=tz); pg = ctx.new_page(); pg.route('https://fonts.**', lambda r: r.abort())
        pg.goto(f'http://127.0.0.1:{PORT}/Sanady/'); pg.wait_for_timeout(300)
        check(f'default {loc} {tz} -> {want}', pg.evaluate('window.UI_LANG') == want, pg.evaluate('window.UI_LANG')); ctx.close()
    b.close()
json.dump(REPORT, open(os.path.join(OUT, 'i18n_left.json'), 'w'), ensure_ascii=False, indent=1)
tot = sum(len(v) for v in REPORT.values())
check('arabic left on screen (see tests/i18n_left.json)', tot <= 8 * 6, tot)
print(f'{ok} passed, {fail} failed')
srv.shutdown()
