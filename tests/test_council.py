"""Advisory council changes: one Focus+ plan, a simpler first day, local extras only for Arabic users,
the iPhone home-screen guide, and the anonymous usage counts (numbers only, valid for the server)."""
import json, re, http.server, threading, sys, os
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
sent = []; errs = []
def api(route):
    b = json.loads(route.request.post_data or '{}')
    if 'sanady-pilot' in route.request.url: sent.append(b)
    route.fulfill(status=200, content_type='application/json', body=json.dumps({'reply': 'تمام', 'add': [], 'ok': True}))
IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
with sync_playwright() as p:
    b = p.chromium.launch()
    # 1) a brand-new Arabic user (raw page, nothing preset)
    c = b.new_context(locale='ar-EG', timezone_id='Africa/Cairo', viewport={'width': 390, 'height': 844}); pg = c.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('https://fonts.**', lambda r: r.abort()); pg.route('https://api.nrg-egypt.com/**', api)
    pg.goto(f'http://127.0.0.1:{PORT}/Sanady/index.html'); pg.evaluate("localStorage.setItem('sy_seen','true');localStorage.setItem('sy_orb','false')"); pg.reload(); pg.wait_for_timeout(700)
    check('new user: one line instead of all choices', pg.locator('#pickMore').count() == 1 and pg.locator('#modeSeg [data-v]').count() == 0)
    pg.click('#pickMore'); pg.wait_for_timeout(200)
    check('tapping it opens the view and mode choices', pg.locator('#modeSeg [data-v]').count() == 3 and pg.locator('#modeSeg [data-m]').count() > 3)
    pg.reload(); pg.wait_for_timeout(500)
    check('stays open after that', pg.locator('#modeSeg [data-v]').count() == 3)
    pg.evaluate("plansSheet()"); t = pg.inner_text('#sheetBody')
    check('plans: one paid plan with everything', 'سايفو فوكس' in t and 'مستشار في ودنك' in t and 'Plus' not in t, t[:400])
    pg.evaluate("closeSheet()"); pg.click('#btnSet'); pg.wait_for_timeout(300)
    check('Arabic user sees senior phone and kid screen', pg.locator('#sOld').count() == 1 and pg.locator('#sKid').count() == 1)
    check('usage toggle in settings, on by default', pg.locator('#sStats').count() == 1 and pg.is_checked('#sStats'))
    pg.evaluate("closeSheet()")
    # usage counts: features counted, payload only numbers with server-valid keys
    pg.evaluate("setMode('one');setMode('none');plansSheet();closeSheet()")
    st = pg.evaluate("usageStats(dayKey())")
    check('feature opens are counted', st.get('f_m_one') == 1 and st.get('f_plans') == 2, st)
    check('usage keys valid for the server (a-z_ , numbers, <=40)', all(re.fullmatch(r'[a-z_]{1,20}', k) and isinstance(v, (int, float)) for k, v in st.items()) and len(st) <= 40, st)
    pg.evaluate("localStorage.setItem('sy_noStats','true')"); pg.evaluate("usageSend()"); pg.wait_for_timeout(300)
    check('turned off: nothing sent', not any(x.get('stats', {}).get('auto') for x in sent))
    c.close()
    # 2) an English user abroad on an iPhone in Safari
    c = b.new_context(locale='en-US', timezone_id='America/New_York', user_agent=IPHONE, viewport={'width': 390, 'height': 844}); pg = c.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('https://fonts.**', lambda r: r.abort()); pg.route('https://api.nrg-egypt.com/**', api)
    pg.goto(f'http://127.0.0.1:{PORT}/Sanady/index.html'); pg.evaluate("localStorage.setItem('sy_seen','true');localStorage.setItem('sy_seenPick','true');localStorage.setItem('sy_orb','false')"); pg.reload(); pg.wait_for_timeout(700)
    check('iPhone in Safari: home-screen nudge', pg.evaluate("nudges().some(x=>x.id.startsWith('ios'))"))
    pg.evaluate("iosSheet()"); t = pg.inner_text('#sheetBody')
    check('guide shows the two steps (translated)', 'Share' in t and 'Home Screen' in t, t[:300])
    pg.evaluate("closeSheet()"); pg.click('#btnSet'); pg.wait_for_timeout(300)
    check('abroad: no senior phone or kid screen in settings', pg.locator('#sOld').count() == 0 and pg.locator('#sKid').count() == 0)
    pg.evaluate("closeSheet()")
    pg.evaluate("drawInterests($('nowLay')||document.body)")
    check('abroad: faith card hidden unless chosen', 'Quran' not in pg.inner_text('body') and pg.locator('#fSeg').count() == 0)
    st = pg.evaluate("usageStats(dayKey())")
    check('usage marks English and iPhone', st.get('l_en') == 1 and st.get('ios') == 1, st)
    c.close(); b.close()
check('no page errors', not errs, errs)
print(f'{ok} passed, {fail} failed')
