import json, sys, threading, http.server
from playwright.sync_api import sync_playwright
ROOT = sys.argv[1]
class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8793), Q)
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(name, cond, extra=''):
    global ok, fail
    if cond: ok += 1; print('PASS', name)
    else: fail += 1; print('FAIL', name, extra)
SENT = []; STORE = {}
def server(route):
    req = route.request; url = req.url; H = {'Access-Control-Allow-Origin': '*'}
    b = json.loads(req.post_data or '{}'); SENT.append((url.split('/')[-1], b))
    def J(o, st=200): return route.fulfill(status=st, content_type='application/json', body=json.dumps(o, ensure_ascii=False), headers=H)
    if url.endswith('wasl-register'): return J({'t': ''})
    if url.endswith('sanady-brain'):
        if b.get('mode') == 'breakdown': return J({'steps': [{'t': 'افتح الملف', 'min': 3}, {'t': 'اكتب المقدمة', 'min': 10}, {'t': 'راجع', 'min': 5}], 'go': 'يلا'})
        if b.get('mode') == 'draft': return J({'text': 'أهلاً، بتابع معاك بخصوص الموضوع 🙏'})
        return J({'reply': 'تمام', 'add': [{'type': 'call', 'sec': 'people', 'title': 'أكلم أحمد على ⟦1⟧', 'due': ''}]})
    if url.endswith('sanady-backup'):
        if b.get('op') == 'put': STORE[b['b']] = b['data']; return J({'ok': True, 'at': 1})
        return J({'ok': True, 'data': STORE.get(b['b'], ''), 'at': 1})
    if url.endswith('sanady-pilot'): return J({'ok': True})
    return J({'ok': True})
SEED = """()=>{localStorage.clear();localStorage.setItem('sn_seen','true');localStorage.setItem('sn_simple','true');localStorage.setItem('sn_morning','"x"');
 localStorage.setItem('sn_prof',JSON.stringify({name:'محمد',sex:'m',voice:false,vg:'m',wake:'08:00',sleep:'23:59',travel:30,prep:'x'}));
 const pad=n=>String(n).padStart(2,'0'),L=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());const n=Date.now();
 localStorage.setItem('sn_items',JSON.stringify([
  {id:'t1',type:'task',sec:'work',title:'أرد على إيميل المدير',due:L(new Date(n-3*36e5)),done:false,created:n},
  {id:'t2',type:'task',sec:'home',title:'أرتب الدولاب',due:L(new Date(n-2*36e5)),done:false,created:n},
  {id:'m1',type:'med',sec:'health',title:'دوا التركيز',due:L(new Date(n-2*36e5)),repeat:'daily',done:false,created:n},
  {id:'b1',type:'task',sec:'study',title:'أكتب تقرير المشروع',big:true,due:'',done:false,created:n}]))}"""
with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    ctx = b.new_context(viewport={'width': 400, 'height': 860}); ctx.route('https://api.nrg-egypt.com/**', server)
    ctx.route('https://2.31.109.72.sslip.io/**', lambda r: (_ for _ in ()).throw(Exception('old host used')))
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    U = 'http://127.0.0.1:8793/index.html'
    pg.goto(U); pg.evaluate(SEED); pg.reload(); pg.evaluate('window.__noNav=1;ringAlarm=()=>{}'); pg.wait_for_timeout(6000)
    # simple mode
    check('simple mode on by default', pg.evaluate("document.body.classList.contains('simple')"))
    check('simple hides modes and extra tabs', pg.is_hidden('#modeSeg') and pg.is_hidden('.tabs [data-t=all]'))
    pg.click('#moreTools'); pg.wait_for_timeout(200)
    check('more tools reveals them', pg.is_visible('.tabs [data-t=all]'))
    pg.click('#moreTools')
    # agent replan
    check('agent moved late tasks', pg.evaluate("new Date(byId('t1').due)>Date.now() && new Date(byId('t2').due)>Date.now()"), pg.evaluate("[byId('t1').due,byId('t2').due]"))
    check('agent did not touch medicine', pg.evaluate("new Date(byId('m1').due)<Date.now()"))
    check('agent log says what it did', 'رتبتهم' in pg.evaluate("ALOG.map(e=>e.t).join('|')") or 'لبكرة' in pg.evaluate("ALOG.map(e=>e.t).join('|')"))
    check('agent card on screen', pg.is_visible('#agentCard') and 'لوحدي' in pg.inner_text('#agentCard'))
    old = pg.evaluate("ALOG.find(e=>e.undo&&e.undo.due).undo.due.find(x=>x[0]==='t1')[1]")
    rid = pg.evaluate("ALOG.find(e=>e.undo&&e.undo.due).id")
    pg.locator(f'#agentCard [data-u="{rid}"]').click(); pg.wait_for_timeout(300)
    check('undo puts it back', pg.evaluate("byId('t1').due") == old)
    # breakdown + step plan
    check('agent broke down the big task', pg.evaluate("(byId('b1').steps||[]).length===3"))
    check('steps spread over days', pg.evaluate("new Set(byId('b1').steps.map(s=>s.due.slice(0,10))).size===3"))
    check('step alarms exist', pg.evaluate("alarmList(0).some(a=>a.text.startsWith('🪜'))"))
    # dump with PII
    pg.evaluate("openDump('كلم أحمد على 01012345678 بكرة')"); pg.wait_for_timeout(200); pg.click('#dDone'); pg.wait_for_timeout(1500)
    sentb = [x[1] for x in SENT if x[0] == 'sanady-brain' and x[1].get('mode') == 'talk'][-1]
    check('phone number never sent', '01012345678' not in json.dumps(sentb, ensure_ascii=False) and '⟦1⟧' in sentb['text'])
    check('number comes back in the task', pg.evaluate("items.some(i=>i.title==='أكلم أحمد على 01012345678')"))
    check('dump shows what it heard + undo', 'اللي سمعته' in pg.inner_text('#sheetBody') and pg.locator('#dUndo').count() == 1)
    pg.evaluate("closeSheet()")
    # follow-up
    cid = pg.evaluate("items.find(i=>i.title.startsWith('أكلم أحمد')).id")
    pg.evaluate(f"finish('{cid}',true)"); pg.wait_for_timeout(200)
    check('follow-up planned after a call', pg.evaluate("AFU.length===1"))
    pg.evaluate("AFU[0].at=Date.now()-1000;saveAgent()")
    check('follow-up nudge asks if they replied', 'حد رد عليك' in pg.evaluate("nudges().map(n=>n.p).join('|')"))
    # alarm check sheet
    pg.evaluate("alarmSheet()"); pg.wait_for_timeout(500)
    check('alarm health sheet', 'المنبّه شغال' in pg.inner_text('#sheetBody') and pg.locator('#ahTest').count() == 1)
    pg.click('#ahTest'); pg.wait_for_timeout(300); pg.evaluate("store.set('atest',Date.now()+3600e3)")
    check('test ring scheduled', pg.evaluate("alarmList(0).some(a=>a.text.includes('رنة تجربة'))"))
    # cloud backup roundtrip
    pg.evaluate("store.set('atest',0);rung={};stopRing();closeSheet();backupCloudSheet()"); pg.wait_for_timeout(300)
    print('DBG', pg.evaluate("(()=>{const e=document.getElementById('bcOn');const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height,getComputedStyle(e).visibility,document.getElementById('sheet').hidden, e.closest('[hidden]')&&e.closest('[hidden]').id]})()"))
    pg.click('#bcOn'); pg.wait_for_timeout(2500)
    code = pg.evaluate("localStorage.getItem('sn_bk_code')")
    check('backup code shown', code and code in pg.inner_text('#sheetBody'))
    check('server got only locked data', len(STORE) == 1 and 'أرتب' not in list(STORE.values())[0])
    pg.evaluate("localStorage.removeItem('sn_items')")
    pg.evaluate(f"backupRestore('{code}')"); pg.wait_for_timeout(2500)
    check('restore brings items back', 'أرتب الدولاب' in (pg.evaluate("localStorage.getItem('sn_items')") or ''))
    # pilot
    pg.evaluate("closeSheet();pilotSheet()"); pg.fill('#plCode', 'sanady26'); pg.click('#plJoin'); pg.wait_for_timeout(1500)
    ps = [x[1] for x in SENT if x[0] == 'sanady-pilot']
    check('pilot sends numbers only', ps and all(isinstance(v, (int, float)) for v in ps[-1]['stats'].values()) and 'محمد' not in json.dumps(ps, ensure_ascii=False))
    check('pilot counts done tasks', ps[-1]['stats'].get('done', 0) >= 1, ps[-1]['stats'])
    # language
    pg.evaluate("closeSheet();prof.lang='gulf';save()")
    pg.evaluate("brain('talk',{text:'ابي اروح الدوام',items:[]})"); pg.wait_for_timeout(800)
    check('brain gets the language', [x[1] for x in SENT if x[0] == 'sanady-brain'][-1].get('lang') == 'gulf')
    # settings entries
    pg.click('#btnSet'); pg.wait_for_timeout(400)
    check('settings has simple, agent, alarm check, backup, pilot, language', all(pg.locator(s).count() == 1 for s in ['#sSimple', '#sAgent', '#sAlarm', '#sCloud', '#sPilot', '#sLang', '#sBuddy']))
    check('no old server host used', not any('sslip' in str(x) for x in SENT))
    check('no page errors', not errs, errs)
    b.close()
print(f'\n{ok} passed, {fail} failed'); sys.exit(1 if fail else 0)
