import json, sys, os, threading, http.server
from playwright.sync_api import sync_playwright
ROOT = sys.argv[1]; OUT = os.path.dirname(os.path.abspath(__file__))
class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8771), Q)
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(name, cond, extra=''):
    global ok, fail
    if cond: ok += 1; print('PASS', name)
    else: fail += 1; print('FAIL', name, extra)
def handle(route):
    return route.fulfill(status=200, content_type='application/json', body='{"t":""}', headers={'Access-Control-Allow-Origin': '*'})
SEED = """(ed)=>{localStorage.clear();localStorage.setItem('sn_seen','true');localStorage.setItem('sn_morning','"x"');if(ed)localStorage.setItem('sn_ed',JSON.stringify(ed));
 localStorage.setItem('sn_prof',JSON.stringify({name:'محمد',sex:'m',voice:false,vg:'f',wake:'00:00',sleep:'23:59',travel:30,prep:'المفاتيح، البطاقة'}));
 const pad=n=>String(n).padStart(2,'0'),L=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());const n=Date.now();
 localStorage.setItem('sn_items',JSON.stringify([
  {id:'a1',type:'appt',sec:'health',title:'كشف الدكتور',due:L(new Date(n+150*6e4)),where:'',done:false,created:n},
  {id:'t1',type:'task',sec:'work',title:'أبعت التقرير لأحمد',big:true,steps:[{t:'افتح الملف واكتب العنوان',min:3,done:false},{t:'اكتب أول فقرة',min:15,done:false}],done:false,created:n-3*864e5,star:true},
  {id:'c1',type:'call',sec:'people',title:'أكلم ماما',done:false,created:n},
  {id:'b1',type:'buy',sec:'shop',title:'لبن وعيش',done:false,created:n},
  {id:'h1',type:'task',sec:'home',title:'أرتب الدولاب',done:false,created:n,due:L(new Date(n+60*6e4))}]))}"""
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 400, 'height': 860})
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    ctx.route('https://api.nrg-egypt.com/**', handle)
    U = 'http://127.0.0.1:8771/index.html'
    pg.goto(U); pg.evaluate(SEED, None); pg.reload(); pg.wait_for_timeout(1200)
    # ---- ADHD edition defaults
    check('default theme is night', pg.evaluate("document.body.dataset.th") == 'night')
    check('accent is yellow', pg.evaluate("getComputedStyle(document.body).getPropertyValue('--pri').trim()").upper() == '#FFD24C')
    seg = pg.inner_text('#modeSeg')
    check('3 ADHD modes shown', all(x in seg for x in ['حاجة واحدة', 'جنبك', 'انتظار']), seg)
    check('time bar counts to leaving', 'وتتحرك لـ كشف الدكتور' in pg.inner_text('#tBar'), pg.inner_text('#tBar'))
    check('start 2 minutes button', pg.is_visible('#nxGo') and 'دقيقتين' in pg.inner_text('#nxGo'))
    check('cant-start button', pg.is_visible('#nxCant'))
    check('energy picker', pg.is_visible('#energy') and 'طاقتك' in pg.inner_text('#energy'))
    check('wait-mode suggestion nudge', pg.evaluate("nudges().some(x=>x.id.startsWith('wm'))"))
    pg.screenshot(path=os.path.join(OUT, 'm_one.png'))
    # energy low -> a light task first
    pg.click('#energy [data-e=low]'); pg.wait_for_timeout(300)
    h = pg.inner_text('#nextCard h2')
    check('low energy picks a light task', h != 'أبعت التقرير لأحمد', h)
    pg.click('#energy [data-e=high]'); pg.wait_for_timeout(300)
    # cant start
    pg.click('#nxCant'); pg.wait_for_timeout(200)
    check('cant-start sheet options', all(pg.is_visible(x) for x in ['#csTiny', '#csWith', '#csEasy', '#csTm']))
    pg.click('#csWith'); pg.wait_for_timeout(300)
    check('cant-start -> body double', not pg.is_hidden('#nowWith') and pg.is_visible('#wRing'))
    # ---- body double
    pg.screenshot(path=os.path.join(OUT, 'm_with0.png'))
    pg.evaluate("WCFG.every=1500;WCFG.guard=3500")
    pg.click('#wGo'); pg.wait_for_timeout(2600)
    check('timer running', pg.is_visible('#wAct') and pg.inner_text('#wTime') != '25:00', pg.inner_text('#wTime'))
    check('check-in asks', 'لسه معايا' in pg.inner_text('#wCheck'), pg.inner_text('#wCheck'))
    pg.click('#wcY'); pg.wait_for_timeout(200)
    check('check-in answered', 'شاطر' in pg.inner_text('#wCheck'))
    pg.wait_for_timeout(1800)
    check('focus guard appears', 'حارس التركيز' in pg.inner_text('#wGuard'), pg.inner_text('#wGuard'))
    pg.screenshot(path=os.path.join(OUT, 'm_with.png'))
    pg.click('#wDrift'); pg.wait_for_timeout(200)
    check('drift is blame-free', 'ولا يهمك' in pg.inner_text('#wCheck'))
    s0 = pg.inner_text('#wS')
    pg.click('#wDone'); pg.wait_for_timeout(300)
    check('step done advances', pg.inner_text('#wS') != s0, pg.inner_text('#wS'))
    pg.click('#wStop')
    # ---- waiting mode
    pg.click('#modeSeg [data-m=wait]'); pg.wait_for_timeout(300)
    wt = pg.inner_text('#nowWait')
    check('wait mode names the appointment', 'كشف الدكتور' in wt, wt)
    check('wait mode lists tasks that fit', pg.locator('#nowWait .wtask').count() >= 2, wt)
    check('wait mode shows leave + 10 min warning', 'اتحرك دلوقتي' in wt and 'لمّ حاجتك' in wt)
    pg.screenshot(path=os.path.join(OUT, 'm_wait.png'))
    pg.reload(); pg.wait_for_timeout(800)
    check('mode remembered', not pg.is_hidden('#nowWait'))
    al = pg.evaluate("alarmList().map(a=>a.text)")
    check('prep alarm 10 min before leaving', any('كمان 10 دقايق تتحرك' in a for a in al), al)
    # ---- themes
    pg.click('#btnSet'); pg.click('#sTh [data-th=light]'); pg.wait_for_timeout(200)
    check('light theme applies', pg.evaluate("document.body.dataset.th") == 'light')
    pg.click('#sTh [data-th=warm]')
    pg.click('#sheetX'); pg.reload(); pg.wait_for_timeout(600)
    check('theme remembered', pg.evaluate("document.body.dataset.th") == 'warm')
    pg.click('#modeSeg [data-m=one]'); pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(OUT, 'm_warm.png'))
    # ---- commercial edition
    pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('sn_')).forEach(k=>localStorage.setItem('sm_'+k.slice(3),localStorage.getItem(k)))"); pg.goto(U.replace('index.html','app/index.html')); pg.wait_for_timeout(800)
    seg = pg.inner_text('#modeSeg')
    check('commercial layouts offered', all(x in seg for x in ['مربعات', 'خط اليوم', 'كلام', 'حاجة واحدة']), seg)
    check('blocks default', pg.locator('#nowLay .blk').count() >= 4)
    check('commercial has no ADHD energy picker', pg.is_hidden('#energy'))
    pg.screenshot(path=os.path.join(OUT, 'm_blocks.png'))
    pg.click('#nowLay .blk[data-k=work]'); pg.wait_for_timeout(300)
    check('block opens its section', pg.is_visible('#all') and pg.is_visible('#sec-work'))
    pg.click('.tabs [data-t=now]'); pg.click('#modeSeg [data-m=line]'); pg.wait_for_timeout(300)
    lt = pg.inner_text('#nowLay')
    check('timeline shows now marker and dated items', 'دلوقتي' in lt and 'أرتب الدولاب' in lt, lt)
    pg.screenshot(path=os.path.join(OUT, 'm_line.png'))
    pg.click('#modeSeg [data-m=chat]'); pg.wait_for_timeout(300)
    check('chat layout with input', pg.is_visible('#chIn') and pg.locator('#chF .bub').count() >= 2)
    pg.fill('#chIn', 'المفاتيح في الدرج')
    pg.wait_for_timeout(21000)  # survive the 20s auto refresh
    check('typed text survives auto-refresh', pg.input_value('#chIn') == 'المفاتيح في الدرج')
    pg.screenshot(path=os.path.join(OUT, 'm_chat.png'))
    pg.goto(U); pg.wait_for_timeout(600)
    check('switch back to ADHD edition', 'جنبك' in pg.inner_text('#modeSeg'))
    check('no page errors', not errs, errs)
    b.close()
print(f'{ok} passed, {fail} failed'); srv.shutdown()
