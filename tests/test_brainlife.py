import json, sys, os, threading, http.server
from playwright.sync_api import sync_playwright
ROOT = sys.argv[1]
class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8774), Q); threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(n, c, e=''):
    global ok, fail
    if c: ok += 1; print('PASS', n)
    else: fail += 1; print('FAIL', n, e)
RESP = {"reply":"تمام، سجلت كريم عليه 500","add":[{"type":"call","sec":"people","title":"أكلم ماما","due":"2026-11-03T09:00","where":"","amount":0,"repeat":"","big":False}],"update":[],"spend":[],"balance":None,"salary":None,"payday":None,"wants":[{"name":"برفان لسارة","price":1500,"est":True}],"places":[],"docs":[],"find":"","crisis":False,"life":{"debts":[{"who":"كريم","amount":500,"dir":"them","note":"هيرجعهم أول الشهر","due":"2026-12-01"}],"occ":[{"kind":"bday","who":"سارة","date":"03-14","gift":"برفان"}],"subs":[{"name":"نتفليكس","amount":240,"due":"2026-11-05","repeat":"monthly"}],"needs":[{"t":"عيش","cat":"food"},{"t":"لبن","cat":"food"},{"t":"حفاضات","cat":"kids"}],"habits":[{"t":"أقرا كل يوم","at":"22:00"}],"kid":[{"name":"ياسين","type":"appt","title":"دكتور أسنان","due":"2026-11-02T17:00","repeat":""}]}}
mode = {'off': False}
def route(r):
    if 'sanady-brain' in r.request.url:
        if mode['off']: return r.abort()
        return r.fulfill(status=200, content_type='application/json', body=json.dumps(RESP, ensure_ascii=False), headers={'Access-Control-Allow-Origin':'*'})
    return r.fulfill(status=200, content_type='application/json', body='{"t":""}', headers={'Access-Control-Allow-Origin':'*'})
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width':400,'height':860}); pg = ctx.new_page(); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e))); ctx.route('https://api.nrg-egypt.com/**', route)
    U='http://127.0.0.1:8774/index.html'
    pg.goto(U); pg.evaluate("localStorage.clear();localStorage.setItem('sy_seen','true');localStorage.setItem('sy_morning','\"x\"');localStorage.setItem('sy_prof',JSON.stringify({name:'منى',sex:'f',voice:false,vg:'f',wake:'00:00',sleep:'23:59',travel:30,prep:'x'}))")
    pg.reload(); pg.wait_for_timeout(600)
    pg.evaluate("openDump('سلفت كريم 500 ...')"); pg.click('#dDone'); pg.wait_for_timeout(2000)
    t = pg.inner_text('#sheetBody')
    check('debt saved', pg.evaluate("LIFE.debts.some(d=>d.who==='كريم'&&d.amount===500)"))
    check('occasion saved', pg.evaluate("LIFE.occ.some(o=>o.who==='سارة'&&o.d==='03-14')"))
    check('gift not in wishlist', 'برفان' not in t or 'تقدر تشتري' not in t, t[-300:])
    check('subscription saved', pg.evaluate("subs().some(i=>i.title==='نتفليكس')"))
    check('needs saved', pg.evaluate("needItems().length")==3)
    check('habit saved', pg.evaluate("LIFE.habits.some(h=>h.at==='22:00')"))
    check('kid created with appointment', pg.evaluate("HOME.kids.some(k=>k.name==='ياسين')&&items.some(i=>i.kid&&i.type==='appt')"))
    check('result lines shown', 'كريم عليه' in t and 'سارة' in t, t[:400])
    pg.click('#dOk')
    mode['off']=True
    pg.evaluate("openDump('سلفت أحمد 300، وخلص العيش والمنظفات')"); pg.click('#dDone'); pg.wait_for_timeout(9000)
    check('offline debt', pg.evaluate("LIFE.debts.some(d=>d.who==='أحمد'&&d.amount===300)"), pg.evaluate("JSON.stringify(LIFE.debts)"))
    check('offline needs', pg.evaluate("needItems().some(i=>i.title==='منظفات')"), pg.evaluate("JSON.stringify(needItems().map(i=>i.title))"))
    check('no errors', not errs, errs)
    b.close()
print(f'{ok} passed, {fail} failed'); srv.shutdown()
