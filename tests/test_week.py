import json, sys, os, threading, http.server
from playwright.sync_api import sync_playwright
ROOT = sys.argv[1]; OUT = os.path.dirname(os.path.abspath(__file__))
class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8766), Q)
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(name, cond, extra=''):
    global ok, fail
    if cond: ok += 1; print('PASS', name)
    else: fail += 1; print('FAIL', name, extra)
SEED = """()=>{const pad=n=>String(n).padStart(2,'0');const L=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
 const n=Date.now(),D=864e5;const it=[
  {id:'l1',type:'task',sec:'work',title:'التقرير الشهري',due:L(new Date(n-2*D)),done:false,created:n-9*D},
  {id:'l2',type:'call',sec:'people',title:'أكلم ماما',due:L(new Date(n-D)),done:false,created:n-9*D},
  {id:'l3',type:'task',sec:'home',title:'أغسل العربية',due:L(new Date(n-3*D)),done:false,created:n-9*D},
  {id:'l4',type:'task',sec:'papers',title:'أجدد الرخصة',due:L(new Date(n-4*D)),done:false,created:n-9*D},
  {id:'x1',type:'appt',sec:'health',title:'كشف الأسنان',due:L(new Date(n+2*D)),where:'المعادي',done:false,created:n-9*D},
  {id:'x2',type:'bill',sec:'money',title:'فاتورة النت',due:L(new Date(n+3*D)),amount:450,done:false,created:n-9*D},
  {id:'p1',type:'task',sec:'study',title:'أذاكر فصل 3',due:'',done:false,created:n-9*D},
  {id:'p2',type:'task',sec:'me',title:'أرتب الدولاب',due:'',done:false,created:n-9*D},
  {id:'p3',type:'task',sec:'work',title:'أكتب الـ CV',due:'',done:false,created:n-9*D},
  {id:'p4',type:'task',sec:'home',title:'أصلّح الحنفية',due:'',done:false,created:n-9*D},
  {id:'d1',type:'task',sec:'work',title:'خلصت 1',done:true,doneAt:n-2*D,created:n-9*D},
  {id:'d2',type:'task',sec:'work',title:'خلصت 2',done:true,doneAt:n-3*D,created:n-9*D},
  {id:'d3',type:'task',sec:'work',title:'قديمة',done:true,doneAt:n-20*D,created:n-30*D}];
 for(let i=0;i<4;i++)it.push({id:'f'+i,type:'idea',sec:'me',title:'فكرة '+i,done:false,created:n-9*D});
 localStorage.setItem('sn_items',JSON.stringify(it));localStorage.setItem('sn_seen','true');localStorage.setItem('sn_simple','false');localStorage.setItem('sn_dev','devAAAA1111');localStorage.setItem('sn_tg','true');localStorage.setItem('sn_money',JSON.stringify({bal:5000,sal:9000,pay:25,spends:[]}));}"""
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 400, 'height': 860}, accept_downloads=True)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('https://api.nrg-egypt.com/**', lambda r: r.fulfill(status=200, content_type='application/json', body='{"linked":true,"ok":true}'))
    pg.goto('http://127.0.0.1:8766/index.html'); pg.evaluate(SEED); pg.reload(); pg.wait_for_timeout(1200)
    # nudges: weekly review shows (8+ days since last, hour may be <10 -> check function directly)
    nud = pg.evaluate("()=>{const r=nudges().map(x=>x.id);return r}")
    print('nudges:', nud)
    check('backup nudge appears (15+ items, never backed up)', 'bk' in nud)
    import datetime
    h = datetime.datetime.now().hour
    check('weekly nudge appears when due', any(x.startswith('wk') for x in nud) or h < 10, (h, nud))
    pg.click('#qWeek'); pg.wait_for_timeout(300)
    body = pg.inner_text('#sheetBody')
    check('done this week counted (2, not the old one)', 'خلّصت 2' in body, body[:120])
    check('late items listed, oldest first', body.index('أجدد الرخصة') < body.index('التقرير الشهري'))
    check('next week lists appointment and bill with amount', 'كشف الأسنان' in body and '450 جنيه' in body)
    check('ideas not in review', 'فكرة 0' not in body)
    pg.screenshot(path=os.path.join(OUT, 'week.png'), full_page=False)
    # decisions
    pg.click('.wrow[data-w="l1"] [data-a="t"]'); pg.click('.wrow[data-w="l2"] [data-a="d"]'); pg.click('.wrow[data-w="l3"] [data-a="x"]'); pg.click('.wrow[data-w="l4"] [data-a="w"]')
    st = pg.evaluate("()=>{const it=JSON.parse(localStorage.getItem('sn_items'));const g=id=>it.find(i=>i.id===id);return {l1:g('l1')&&g('l1').due,l2:g('l2')&&g('l2').done,l3:!!g('l3'),l4:g('l4')&&g('l4').due,rows:document.querySelectorAll('.wrow').length}}")
    import datetime as dt
    tom = (dt.date.today() + dt.timedelta(days=1)).isoformat(); nw = (dt.date.today() + dt.timedelta(days=7)).isoformat()
    check('بكرة moves to tomorrow 10:00', st['l1'] == tom + 'T10:00', st)
    check('خلصت marks done', st['l2'] is True, st)
    check('شيلها removes', st['l3'] is False, st)
    check('الأسبوع الجاي moves +7 days', st['l4'] == nw + 'T10:00', st)
    check('decided rows disappear', st['rows'] == 0, st)
    # pick top 3, 4th refused
    for i in ['p1', 'p2', 'p3', 'p4']: pg.click(f'#wPick [data-id="{i}"]')
    stars = pg.evaluate("()=>JSON.parse(localStorage.getItem('sn_items')).filter(i=>i.star).map(i=>i.id)")
    check('max 3 stars', sorted(stars) == ['p1', 'p2', 'p3'], stars)
    pg.click('#wDone'); pg.wait_for_timeout(400)
    check('review recorded', pg.evaluate("()=>JSON.parse(localStorage.getItem('sn_weekRev'))") > 0)
    check('weekly nudge gone after review', not any(x.startswith('wk') for x in pg.evaluate("()=>nudges().map(x=>x.id)")))
    # backup
    pg.click('#btnSet'); pg.click('#sBk'); pg.wait_for_timeout(200)
    pg.screenshot(path=os.path.join(OUT, 'backup.png'))
    with pg.expect_download() as dl: pg.click('#bkSave')
    path = os.path.join(OUT, 'bk.json'); dl.value.save_as(path)
    f = json.load(open(path, encoding='utf-8'))
    check('backup file is a Sanady backup', f.get('app') == 'sanady' and 'items' in f['data'])
    check('device code and Telegram link not in backup', not any(k in f['data'] for k in ['dev', 'tok', 'tg', 'tgSig']), list(f['data'].keys()))
    n_items = len(json.loads(f['data']['items']))
    # new phone: wipe, restore
    pg2 = ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)))
    pg2.route('https://api.nrg-egypt.com/**', lambda r: r.fulfill(status=200, content_type='application/json', body='{"linked":false}'))
    pg2.goto('http://127.0.0.1:8766/index.html')
    pg2.evaluate("()=>{localStorage.clear();localStorage.setItem('sn_seen','true');localStorage.setItem('sn_simple','false');localStorage.setItem('sn_dev','devBBBB2222')}"); pg2.reload(); pg2.wait_for_timeout(600)
    pg2.on('dialog', lambda d: d.accept())
    pg2.click('#btnSet'); pg2.click('#sBk'); pg2.set_input_files('#bkFile', path); pg2.wait_for_timeout(2500)
    st2 = pg2.evaluate("()=>({n:JSON.parse(localStorage.getItem('sn_items')||'[]').length,dev:localStorage.getItem('sn_dev'),bal:JSON.parse(localStorage.getItem('sn_money')).bal,tg:localStorage.getItem('sn_tg')})")
    check('restore brings all items', st2['n'] == n_items, st2)
    check('restore keeps the new phone device code', st2['dev'] == 'devBBBB2222', st2)
    check('restore brings money', st2['bal'] == 5000, st2)
    check('Telegram not marked linked on new phone', st2['tg'] is None, st2)
    # bad file
    bad = os.path.join(OUT, 'bad.json'); open(bad, 'w').write('{"hello":1}')
    pg2.click('#btnSet'); pg2.click('#sBk'); pg2.set_input_files('#bkFile', bad); pg2.wait_for_timeout(300)
    check('wrong file refused', 'مش نسخة' in pg2.inner_text('#toast'))
    check('no page errors', not errs, errs)
    b.close()
print(f'{ok} passed, {fail} failed'); srv.shutdown()
