"""Sayvo does it (the agent writes a task's email/plan itself; sending waits for the user), the Focus+ whisper coach, plans, bill pay."""
import json,http.server,threading,sys,os
OUT=os.path.dirname(os.path.abspath(__file__))
ok=fail=0
def check(n,c,i=''):
    global ok,fail
    if c: ok+=1
    else: fail+=1; print('FAIL',n,str(i)[:300])
from playwright.sync_api import sync_playwright
W=sys.argv[1] if len(sys.argv)>1 else '.'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=W,**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8796),H);threading.Thread(target=srv.serve_forever,daemon=True).start()
bodies=[];errs=[]
def brain(route):
    b=json.loads(route.request.post_data or '{}');bodies.append(b);m=b.get('mode')
    if m=='do': r={'kind':'email','title':'إيميل طلب إجازة','output':'أستاذ أحمد،\nبرجاء الموافقة على إجازة يوم الخميس.\nشكراً','subject':'طلب إجازة يوم الخميس','to':'المدير','next':'راجعه وابعته','reason':''}
    elif m=='coach': r={'say':'قوله إن الحملة الأخيرة جابت عملاء جداد','tip':'اذكر رقم'}
    else: r={'reply':'تمام','add':[]}
    route.fulfill(status=200,content_type='application/json',body=json.dumps(r,ensure_ascii=False))
with sync_playwright() as p:
    b=p.chromium.launch();c=b.new_context(locale='ar-EG',timezone_id='Africa/Cairo',viewport={'width':390,'height':844});pg=c.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.route('https://fonts.**',lambda r:r.abort());pg.route('https://api.nrg-egypt.com/**',brain)
    pg.goto('http://127.0.0.1:8796/app/index.html');pg.evaluate("localStorage.setItem('sy_seen','true');localStorage.setItem('sy_focus','true')");pg.reload();pg.wait_for_timeout(700)
    pg.evaluate("window.__it=addItem({title:'أبعت إيميل للمدير أطلب إجازة الخميس',type:'task',sec:'work'});render()");pg.wait_for_timeout(300)
    check('do button on next card', pg.is_visible('#nxDo'))
    pg.click('#nxDo');pg.wait_for_timeout(1800);pg.screenshot(path=os.path.join(OUT,'do1.png'))
    check('prepared email kept with the task', pg.evaluate("__it.prep&&__it.prep.kind")=='email')
    check('task sent to the brain', any(x.get('mode')=='do' and x.get('task',{}).get('title') for x in bodies))
    check('nothing sent without a tap', pg.is_visible('#dqMail') and 'مفيش حاجة بتتبعت' in pg.inner_text('#sheetBody'))
    pg.click('#dqMail');pg.wait_for_timeout(300);check('mail sheet asks who to send to', pg.is_visible('#mlApp') and pg.is_visible('#mlTo'))
    pg.evaluate("closeSheet();show('focus')");pg.wait_for_timeout(300);check('coach in the Focus+ tab', pg.is_visible('[data-f=coach]'))
    pg.click('[data-f=coach]');pg.wait_for_timeout(200);pg.check('#coOk');pg.click('#coGo');pg.wait_for_timeout(300)
    pg.evaluate("COACH.txt='المدير: إحنا مش شايفين نتيجة من التسويق السنة دي، ليه نزود؟'");pg.click('#coHelp');pg.wait_for_timeout(1500)
    check('coach whispers a line', 'الحملة' in pg.inner_text('#coSay'), pg.inner_text('#coSay'))
    check('coach sent the transcript', any(x.get('mode')=='coach' and 'التسويق' in x.get('transcript','') and x.get('ask') for x in bodies));pg.screenshot(path=os.path.join(OUT,'do2.png'))
    pg.click('#coEnd');pg.evaluate("plansSheet()");pg.wait_for_timeout(200);check('plans list the coach and coming-soon calls', 'مستشار' in pg.inner_text('#sheetBody') and '📞' in pg.inner_text('#sheetBody'))
    pg.evaluate("closeSheet();paySheet(addItem({title:'فاتورة الكهربا',type:'bill',amount:300}))");check('in Egypt pay opens Basata/Fawry', pg.is_visible('[data-p]'))
    c2=b.new_context(locale='en-GB',timezone_id='Europe/London');p2=c2.new_page();p2.route('https://**',lambda r:r.abort())
    p2.goto('http://127.0.0.1:8796/app/index.html');p2.evaluate("localStorage.setItem('sy_seen','true')");p2.reload();p2.wait_for_timeout(600)
    p2.evaluate("paySheet(addItem({title:'Electricity',type:'bill',amount:60}))");p2.wait_for_timeout(200)
    check('abroad: pay page link per bill', p2.is_visible('#pyU') and p2.is_visible('#pyO'))
    check('no page errors', not errs, errs)
    b.close()
print(f'{ok} passed, {fail} failed'); srv.shutdown()
