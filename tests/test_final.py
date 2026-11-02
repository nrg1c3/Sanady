import json, sys, os, threading, http.server, datetime as dt
from playwright.sync_api import sync_playwright
ROOT = sys.argv[1]; OUT = os.path.dirname(os.path.abspath(__file__))
class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8767), Q)
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(name, cond, extra=''):
    global ok, fail
    if cond: ok += 1; print('PASS', name)
    else: fail += 1; print('FAIL', name, extra)
today = dt.date.today()
exp1 = (today + dt.timedelta(days=75)).isoformat()   # renew in ~45 days
exp2 = (today + dt.timedelta(days=10)).isoformat()   # already inside the month -> tomorrow
BRAIN = {'reply': 'تمام، سجلت الرخصة والباسبور.', 'add': [{'type': 'call', 'sec': 'people', 'title': 'أكلم أحمد', 'due': '', 'where': '', 'amount': 0, 'repeat': '', 'big': False}],
         'update': [], 'spend': [], 'balance': None, 'salary': None, 'payday': None, 'wants': [], 'places': [],
         'docs': [{'name': 'رخصة العربية', 'expires': exp1}, {'name': 'الباسبور', 'expires': exp2}], 'find': '', 'crisis': False}
def handle(route):
    u = route.request.url
    if u.endswith('/sanady-brain'): return route.fulfill(status=200, content_type='application/json', body=json.dumps(BRAIN))
    if u.endswith('/sanady-remind'): errs.append('called reminders server')
    if u.endswith('/wasl-register'): return route.fulfill(status=200, content_type='application/json', body='{"t":""}')
    return route.fulfill(status=200, content_type='application/json', body='{}')
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 400, 'height': 860}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)+' @ '+str(e.stack)[:300]))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    pg.route('https://api.nrg-egypt.com/**', handle)
    pg.goto('http://127.0.0.1:8767/index.html')
    pg.evaluate("()=>{localStorage.setItem('sn_seen','true');localStorage.setItem('sn_simple','false');localStorage.setItem('sn_prof',JSON.stringify({name:'محمد',sex:'m',voice:false,vg:'f',wake:'00:00',sleep:'23:59',travel:30,prep:'المفاتيح'}))}")
    pg.reload(); pg.wait_for_timeout(800)
    # docs through the brain
    pg.evaluate("async()=>{openDump();const r=await brain('talk',{text:'x'});applyTalk(r,'x')}"); pg.wait_for_timeout(600)
    st = pg.evaluate("()=>({items:JSON.parse(localStorage.getItem('sn_items')),docs:JSON.parse(localStorage.getItem('sn_docs'))})")
    ren = [i for i in st['items'] if i.get('doc')]
    check('two renewal tasks in papers', len(ren) == 2 and all(i['sec'] == 'papers' for i in ren), ren)
    r1 = next(i for i in ren if i['doc'] == 'رخصة العربية'); r2 = next(i for i in ren if i['doc'] == 'الباسبور')
    check('renewal set 30 days before expiry at 10:00', r1['due'] == (today + dt.timedelta(days=45)).isoformat() + 'T10:00', r1)
    check('expiry inside a month -> reminder tomorrow', r2['due'] == (today + dt.timedelta(days=1)).isoformat() + 'T10:00', r2)
    check('docs registry saved', st['docs'] == {'رخصة العربية': exp1, 'الباسبور': exp2}, st['docs'])
    check('result sheet mentions documents', 'هفكّرك تجدده' in pg.inner_text('#sheetBody'))
    # same doc again -> updates, no duplicate
    BRAIN['docs'] = [{'name': 'رخصة العربية', 'expires': (today + dt.timedelta(days=400)).isoformat()}]; BRAIN['add'] = []
    pg.evaluate("async()=>{closeSheet();openDump();const r=await brain('talk',{text:'x'});applyTalk(r,'x')}"); pg.wait_for_timeout(500)
    ren2 = [i for i in pg.evaluate("()=>JSON.parse(localStorage.getItem('sn_items'))") if i.get('doc') == 'رخصة العربية' and not i['done']]
    check('re-telling a document updates instead of duplicating', len(ren2) == 1 and ren2[0]['due'].startswith((today + dt.timedelta(days=370)).isoformat()), ren2)
    # docs sheet: add by hand and delete
    pg.evaluate("()=>closeSheet()"); pg.click('#btnSet'); pg.click('#sDoc'); pg.wait_for_timeout(200)
    pg.fill('#dcN', 'البطاقة'); pg.fill('#dcE', (today + dt.timedelta(days=200)).isoformat()); pg.click('#dcAdd'); pg.wait_for_timeout(200)
    body = pg.inner_text('#sheetBody')
    check('docs sheet lists all three, soonest first', body.index('الباسبور') < body.index('البطاقة'), body[:300])
    pg.screenshot(path=os.path.join(OUT, 'docs.png'))
    pg.click('.rm[data-k="البطاقة"]'); pg.wait_for_timeout(200)
    st3 = pg.evaluate("()=>({d:JSON.parse(localStorage.getItem('sn_docs')),n:JSON.parse(localStorage.getItem('sn_items')).filter(i=>i.doc==='البطاقة'&&!i.done).length})")
    check('deleting a document removes its renewal task', 'البطاقة' not in st3['d'] and st3['n'] == 0, st3)
    # body nudges
    pg.evaluate("()=>{closeSheet();localStorage.setItem('sn_bodyAt',JSON.stringify(Date.now()-4*36e5))}")
    nud = pg.evaluate("()=>nudges().filter(x=>x.id.startsWith('bd')).map(x=>x.p)")
    check('body nudge after 3 waking hours', len(nud) == 1, nud)
    pg.evaluate("()=>{const x=nudges().find(x=>x.id.startsWith('bd'));x.acts[0][1]()}")
    check('body nudge gone after answering', not pg.evaluate("()=>nudges().some(x=>x.id.startsWith('bd'))"))
    pg.evaluate("()=>{prof.wake='07:00';prof.sleep='08:00';localStorage.setItem('sn_bodyAt',JSON.stringify(Date.now()-4*36e5))}")
    h = dt.datetime.now().hour
    check('no body nudge outside waking hours', h in (7,) or not pg.evaluate("()=>nudges().some(x=>x.id.startsWith('bd'))"))
    pg.evaluate("()=>{prof.wake='00:00';prof.sleep='23:59';save()}")
    # full tour of every screen and sheet
    for sel in ['#qWeek', '#qNight', '#btnFeel']:
        pg.evaluate("()=>closeSheet()"); pg.click(sel); pg.wait_for_timeout(250)
    for scr in ['all', 'money', 'focus']:
        pg.evaluate(f"()=>{{closeSheet();show('{scr}')}}"); pg.wait_for_timeout(250)
    pg.evaluate("()=>{show('all');setSeg('people')}"); pg.wait_for_timeout(150)
    pg.evaluate("()=>{setSeg('ideas')}"); pg.wait_for_timeout(150)
    pg.evaluate("()=>{show('now');closeSheet()}"); pg.click('#btnSet')
    check('Telegram option hidden', pg.evaluate("()=>{closeSheet();$('btnSet').click();const x=!!$('sTg');closeSheet();return x}") is False)
    for sid in ['sBk', 'sDoc', 'sFam']:
        pg.evaluate("()=>closeSheet()"); pg.click('#btnSet'); pg.click('#' + sid); pg.wait_for_timeout(200)
    pg.evaluate("()=>closeSheet()")
    pg.screenshot(path=os.path.join(OUT, 'home.png'))
    check('no errors across all screens', not errs, errs)
    # demo mode still works
    pg2 = b.new_page(viewport={'width': 400, 'height': 860}); e2 = []; pg2.on('pageerror', lambda e: e2.append(str(e)))
    pg2.route('https://api.nrg-egypt.com/**', handle)
    pg2.goto('http://127.0.0.1:8767/index.html?demo=1'); pg2.wait_for_timeout(2500)
    check('demo mode loads without errors', not e2, e2)
    b.close()
print(f'{ok} passed, {fail} failed'); srv.shutdown()
