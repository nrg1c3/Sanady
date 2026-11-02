import json, sys, os, threading, http.server, datetime as dt
from playwright.sync_api import sync_playwright
ROOT = sys.argv[1]; OUT = os.path.dirname(os.path.abspath(__file__))
class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8768), Q)
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(name, cond, extra=''):
    global ok, fail
    if cond: ok += 1; print('PASS', name)
    else: fail += 1; print('FAIL', name, extra)
brain_calls = []
BR = {'reply': 'الباسبور؟ أنا مش شايف مكانه في كلامك', 'add': [], 'update': [], 'spend': [], 'balance': None, 'salary': None, 'payday': None, 'wants': [], 'places': [], 'docs': [], 'find': 'الباسبور بتاعي', 'crisis': False}
def handle(route):
    u = route.request.url
    if u.endswith('/sanady-brain'):
        brain_calls.append(json.loads(route.request.post_data)); return route.fulfill(status=200, content_type='application/json', body=json.dumps(BR))
    return route.fulfill(status=200, content_type='application/json', body='{"t":""}')
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 400, 'height': 860}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('https://api.nrg-egypt.com/**', handle)
    pg.goto('http://127.0.0.1:8768/index.html')
    pg.evaluate("()=>{localStorage.setItem('sy_seen','true');localStorage.setItem('sy_prof',JSON.stringify({name:'محمد',sex:'m',voice:false,vg:'f',wake:'07:00',sleep:'23:30',travel:30,prep:'x'}));localStorage.setItem('sy_places',JSON.stringify({'الباسبور':{w:'في الدولاب الرف التاني',d:Date.now()},'مفاتيح العربية':{w:'على الترابيزة جنب الباب',d:Date.now()}}))}")
    pg.reload(); pg.wait_for_timeout(700)
    def ask(t):
        pg.evaluate("()=>closeSheet()"); pg.evaluate("t=>{openDump();}", t); pg.wait_for_timeout(200)
        pg.evaluate("t=>{const d=$('dText')||document.querySelector('#sheetBody textarea');}", t)
        # use typed mode
        pg.evaluate("t=>{const b=document.querySelector('#dType');if(b)b.click()}", t); pg.wait_for_timeout(150)
        pg.fill('#dText', t); pg.click('#dDone'); pg.wait_for_timeout(700)
        return pg.inner_text('#sheetBody')
    for q in ['فين الباسبور؟', 'هو فين الباسبور بتاعي', 'الباسبور فين', 'فين جواز السفر... لا قصدي الباسبور']:
        pass
    n0 = len(brain_calls)
    t = ask('فين الباسبور؟')
    check('instant answer with the exact place', 'الدولاب الرف التاني' in t, t[:200])
    check('no "I do not see it" text', 'مش شايف' not in t, t[:200])
    check('answered without calling the server', len(brain_calls) == n0)
    t = ask('هو فين مفاتيح العربيه')
    check('fuzzy match (ه/ة) works', 'الترابيزة جنب الباب' in t, t[:200])
    t = ask('الباسبور فين')
    check('"X فين" form works', 'الدولاب' in t, t[:200])
    # mixed sentence goes to brain; brain reply about not knowing is replaced
    n1 = len(brain_calls)
    t = ask('ممكن تقولي الباسبور بتاعي حطيته فين عشان مستعجل')
    check('brain gets place names', len(brain_calls) == n1 + 1 and 'الباسبور' in brain_calls[-1].get('places', []), brain_calls[-1:] )
    check('brain\'s "do not know" reply replaced by the real place', 'الدولاب الرف التاني' in t and 'مش شايف' not in t, t[:200])
    # unknown thing
    BR['find'] = 'الشاحن'
    t = ask('فين الشاحن')
    check('unknown thing -> honest "you did not tell me"', 'مش فاكر إنك قلتلي مكان الشاحن' in t, t[:200])
    # ---- daily allowance
    pg.evaluate("()=>{closeSheet();M.bal=10000;M.daily=150;M.pay=1;save();localStorage.setItem('sy_dayStart',JSON.stringify('2020-01-01'))}")
    pg.reload(); pg.wait_for_timeout(600)
    nud = pg.evaluate("()=>nudges().filter(x=>x.id.startsWith('dy')).map(x=>x.p)")
    check('morning asks about yesterday', len(nud) == 1 and 'امبارح' in nud[0], nud)
    av0 = pg.evaluate("()=>availCalc().avail")
    pg.evaluate("()=>{nudges().find(x=>x.id.startsWith('dy')).acts[0][1]()}")  # nothing spent
    st = pg.evaluate("()=>({bal:M.bal,log:M.dayLog,saved:dailySaved(),n:nudges().filter(x=>x.id.startsWith('dy')).length})")
    yk = (dt.date.today() - dt.timedelta(days=1)).isoformat()
    check('"nothing" keeps the money in the balance', st['bal'] == 10000 and st['log'].get(yk) == 0, st)
    check('unspent day counted as saving', st['saved'] == (150 if yk[:7] == dt.date.today().isoformat()[:7] else 0), st)
    check('question gone after answering', st['n'] == 0)
    # today: spent 90 -> balance -90, today's reservation drops by 90
    pg.evaluate("()=>{show('money')}"); pg.wait_for_timeout(200)
    pg.click('#dyBtn'); pg.wait_for_timeout(150); pg.fill('#dyA', '90'); pg.click('#dyOk'); pg.wait_for_timeout(300)
    st2 = pg.evaluate("()=>({bal:M.bal,avail:availCalc().avail,living:availCalc().living,days:availCalc().days})")
    check('today 90 logged: balance down 90', st2['bal'] == 9910, st2)
    check('available not double-counted (avail unchanged by spending inside the allowance)', st2['avail'] == av0 or abs(st2['avail'] - av0) <= 0, (st2, av0))
    # edit today to 200 -> replaces, not adds
    pg.click('#dyBtn'); pg.wait_for_timeout(150); pg.fill('#dyA', '200'); pg.click('#dyOk'); pg.wait_for_timeout(300)
    check('editing replaces the day amount', pg.evaluate("()=>M.bal") == 9800)
    pg.screenshot(path=os.path.join(OUT, 'money.png'))
    check('no page errors', not errs, errs)
    b.close()
print(f'{ok} passed, {fail} failed'); srv.shutdown()
