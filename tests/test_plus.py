"""Sayvo Plus: plans page, monthly counters, lecture/book summaries (brain mocked), tasks from a lecture."""
import json, http.server, threading, sys, os, base64
from playwright.sync_api import sync_playwright
W = sys.argv[1] if len(sys.argv) > 1 else '.'; OUT = os.path.dirname(os.path.abspath(__file__))
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=W, **k)
    def log_message(s, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8797), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(n, c, i=''):
    global ok, fail
    if c: ok += 1
    else: fail += 1; print('FAIL', n, str(i)[:300])
bodies = []; errs = []
def brain(route):
    b = json.loads(route.request.post_data or '{}'); bodies.append(b); m = b.get('mode')
    if m == 'summ' and b.get('stage') == 'part': r = {'notes': 'ملاحظات الجزء ' + str(b.get('part', {}).get('i'))}
    elif m == 'summ': r = {'summary': 'المحاضرة عن التسويق الرقمي وأهم قنواته.', 'points': ['السوشيال ميديا', 'الإعلانات المدفوعة'], 'terms': [{'t': 'CTR', 'd': 'نسبة الضغط'}],
                           'questions': [{'q': 'يعني إيه CTR؟', 'a': 'نسبة اللي ضغطوا'}], 'tasks': [{'title': 'تسليم الأسايمنت', 'due': '2026-11-12'}], 'apply': []}
    elif m == 'do': r = {'kind': 'text', 'title': 'تمام', 'output': 'نص', 'subject': '', 'to': '', 'next': '', 'reason': ''}
    else: r = {'reply': 'تمام', 'add': []}
    route.fulfill(status=200, content_type='application/json', body=json.dumps(r, ensure_ascii=False))
with sync_playwright() as p:
    b = p.chromium.launch(); c = b.new_context(locale='ar-EG', timezone_id='Africa/Cairo', viewport={'width': 390, 'height': 844}); pg = c.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('https://fonts.**', lambda r: r.abort()); pg.route('https://api.nrg-egypt.com/**', brain)
    pg.goto('http://127.0.0.1:8797/app/index.html'); pg.evaluate("localStorage.setItem('sy_seen','true')"); pg.reload(); pg.wait_for_timeout(600)
    # plans page
    pg.evaluate("plansSheet()"); t = pg.inner_text('#sheetBody')
    check('plans: free, Plus, Focus+', 'مجاني' in t and 'Sayvo Plus' in t and 'Sayvo Focus+' in t)
    check('calls coming soon in Plus', 'قريباً' in t and '📞' in t)
    # summaries: short text -> one final call
    pg.evaluate("closeSheet();runSumm('lecture','تسويق رقمي',{text:'كلام '.repeat(200)})"); pg.wait_for_timeout(1200)
    check('lecture summary shown', 'التسويق الرقمي' in pg.inner_text('#sheetBody'))
    check('one final call for short text', [x.get('stage') for x in bodies if x.get('mode') == 'summ'] == ['final'])
    pg.click('#sheetBody [data-ta="0"]'); pg.wait_for_timeout(150)
    check('lecture deadline becomes a task', pg.evaluate("items.some(i=>i.title==='تسليم الأسايمنت'&&i.due.startsWith('2026-11-12'))"))
    # long text -> parts then final
    bodies.clear(); pg.evaluate("closeSheet();runSumm('book','كتاب',{text:'ا'.repeat(80000)})"); pg.wait_for_timeout(2500)
    st = [x.get('stage') for x in bodies if x.get('mode') == 'summ']
    check('long book: parts then final', st == ['part', 'part', 'part', 'final'], st)
    check('final uses the notes', any('ملاحظات الجزء 2' in (x.get('notes') or '') for x in bodies))
    # photos go as images
    bodies.clear(); img = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(os.path.dirname(OUT), 'icon-192.png'), 'rb').read()).decode()
    pg.evaluate("closeSheet()"); pg.evaluate("b64=>{const bin=atob(b64.split(',')[1]);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);imgSumm([new File([u],'p.png',{type:'image/png'})])}", img); pg.wait_for_timeout(2500)
    check('photos sent as images', any(isinstance(x.get('images'), list) and x['images'] for x in bodies), [list(x) for x in bodies])
    check('summaries saved on the phone', pg.evaluate("SUMMS.length") == 3)
    pg.evaluate("closeSheet();summSheet()"); check('summary list shows saved ones', pg.locator('#sheetBody [data-s]').count() == 3)
    # counters: during the trial nothing is blocked, but usage is counted
    check('book usage counted', pg.evaluate("usage().book") == 1)
    pg.evaluate("closeSheet();window.__it=addItem({title:'اكتب إيميل للبنك',type:'task'})"); pg.evaluate("doSheet(__it)"); pg.wait_for_timeout(1200)
    check('do usage counted', pg.evaluate("usage().do") == 1)
    check('blocks view has the summaries tile', pg.evaluate("closeSheet();setMode('none');setView('blocks');!!document.querySelector('#nowLay .blk[data-k=summ]')"))
    check('no page errors', not errs, errs)
    b.close()
print(f'{ok} passed, {fail} failed'); srv.shutdown()
