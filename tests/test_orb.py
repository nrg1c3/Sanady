"""Home is just a voice orb: talk, Sayvo sorts it, the answer floats above; the next thing under it;
the rest in a side menu on the left; the keyboard for typing; settings can start on Today instead.
Also the two plans (Free, Sayvo Focus) and the restore/checkout paths when the payment server isn't ready."""
import json, http.server, threading, sys
from playwright.sync_api import sync_playwright
W = sys.argv[1] if len(sys.argv) > 1 else '.'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=W, **k)
    def log_message(s, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H); PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(n, c, i=''):
    global ok, fail
    if c: ok += 1
    else: fail += 1; print('FAIL', n, str(i)[:300])
errs = []; talks = []; plan = []
def api(route):
    u = route.request.url; b = json.loads(route.request.post_data or '{}')
    if 'sayvo-plan' in u:
        plan.append(b)
        if b.get('act') == 'restore' and b.get('key') == 'SAYVO-TEST-0001':
            route.fulfill(status=200, content_type='application/json', body=json.dumps({'plan': 'focus', 'until': 4102444800000, 'key': 'SAYVO-TEST-0001'})); return
        route.fulfill(status=404, body='not here'); return
    if b.get('mode') == 'talk':
        talks.append(b.get('text'))
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'reply': 'رتبتلك حاجتين.', 'add': [{'type': 'task', 'sec': 'work', 'title': 'أكلم المحاسب'}, {'type': 'task', 'sec': 'home', 'title': 'أشتري عيش'}]}, ensure_ascii=False)); return
    route.fulfill(status=200, content_type='application/json', body='{}')
FAKE = """class FSR{constructor(){window.__sr=this}start(){setTimeout(()=>{this.onstart&&this.onstart();const t=window.__say||'';if(t)this.onresult&&this.onresult({results:[Object.assign([{transcript:t}],{isFinal:true})]})},30)}stop(){setTimeout(()=>this.onend&&this.onend(),10)}abort(){}}
window.SpeechRecognition=FSR;window.webkitSpeechRecognition=FSR;"""
with sync_playwright() as p:
    b = p.chromium.launch()
    c = b.new_context(locale='ar-EG', timezone_id='Africa/Cairo', viewport={'width': 390, 'height': 800}); c.add_init_script(FAKE); pg = c.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('https://fonts.**', lambda r: r.abort()); pg.route('https://api.nrg-egypt.com/**', api)
    pg.goto(f'http://127.0.0.1:{PORT}/Sanady/index.html'); pg.evaluate("localStorage.setItem('sy_seen','true');localStorage.setItem('sy_seenPick','true')"); pg.reload(); pg.wait_for_timeout(900)
    check('starts on the orb, nothing else showing', pg.is_visible('#orb') and not pg.is_visible('nav.tabs') and not pg.is_visible('header.top'))
    check('one line for the next thing', pg.is_visible('#orbNow'))
    # talk
    pg.evaluate("window.__say='محتاج أكلم المحاسب وأشتري عيش'"); pg.click('#orb'); pg.wait_for_timeout(300)
    check('tap: listening, words show under the orb', 'listen' in pg.get_attribute('#orb', 'class') and 'المحاسب' in pg.inner_text('#orbHeard'))
    pg.click('#orb'); pg.wait_for_timeout(1200)
    check('tap again: sent to be sorted', talks and 'المحاسب' in talks[-1], talks)
    check('results to check or undo', pg.locator('#dRes .item').count() == 2)
    pg.click('#dOk'); pg.wait_for_timeout(300)
    check('the answer floats above the orb', 'رتبتلك' in pg.inner_text('#orbSay'))
    check('the next thing shows under it', 'أكلم المحاسب' in pg.inner_text('#orbNow') or 'أشتري عيش' in pg.inner_text('#orbNow'), pg.inner_text('#orbNow'))
    # keyboard
    pg.click('#orbKb'); pg.wait_for_timeout(300)
    check('keyboard opens typing', pg.is_visible('#dText'))
    pg.evaluate("closeSheet()")
    # side menu on the left
    pg.click('#mnuBtn'); pg.wait_for_timeout(300)
    box = pg.locator('#dbox').bounding_box()
    check('side menu opens from the left', pg.is_visible('#dbox') and box['x'] < 5, box)
    check('menu has the sections', all(pg.locator(f'[data-d={d}]').count() == 1 for d in ['home', 'now', 'all', 'money', 'life', 'focus', 'plans', 'set']))
    pg.click('[data-d=money]'); pg.wait_for_timeout(400)
    check('menu item opens the screen, tabs back', pg.is_visible('#money') and pg.is_visible('nav.tabs') and pg.is_visible('#toOrb'))
    pg.click('#toOrb'); pg.wait_for_timeout(300)
    check('small orb button returns home', pg.is_visible('#orb') and not pg.is_visible('nav.tabs'))
    # plans: two only
    pg.click('#mnuBtn'); pg.wait_for_timeout(250); pg.click('[data-d=plans]'); pg.wait_for_timeout(300); t = pg.inner_text('#sheetBody')
    check('two plans: free and Sayvo Focus, no Plus', 'مجاني' in t and 'سايفو فوكس' in t and 'Plus' not in t, t[:300])
    pg.click('#plBuy'); pg.wait_for_timeout(500)
    check('buy before payments are ready: friendly "coming"', 'بيتجهز' in pg.inner_text('#sheetBody') and any(x.get('act') == 'checkout' and x.get('region') == 'eg' for x in plan), plan)
    pg.evaluate("closeSheet();plansSheet()"); pg.click('#plRestore'); pg.wait_for_timeout(200)
    pg.fill('#rsKey', 'sayvo-test-0001'); pg.click('#rsGo'); pg.wait_for_timeout(500)
    check('restore code opens Sayvo Focus', pg.evaluate("isPaid()") and 'أهلاً بيك' in pg.inner_text('#sheetBody'))
    pg.evaluate("closeSheet()")
    # settings: start on Today instead
    pg.evaluate("$('btnSet').click()"); pg.wait_for_timeout(400)
    check('setting to start on the orb', pg.locator('#sOrb').count() == 1 and pg.is_checked('#sOrb'))
    pg.uncheck('#sOrb'); pg.evaluate("closeSheet()"); pg.reload(); pg.wait_for_timeout(900)
    check('off: starts on Today', pg.is_visible('#now') and not pg.is_visible('#orb') and pg.is_visible('nav.tabs'))
    c.close(); b.close()
check('no page errors', not errs, errs)
print(f'{ok} passed, {fail} failed')
