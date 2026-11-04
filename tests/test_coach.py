import json,http.server,threading,sys,os
from playwright.sync_api import sync_playwright
W=sys.argv[1] if len(sys.argv)>1 else '.'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=W,**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8797),H);threading.Thread(target=srv.serve_forever,daemon=True).start()
asks=[];errs=[]
FAKE="""navigator.mediaDevices&&(navigator.mediaDevices.getUserMedia=()=>Promise.reject(Object.assign(new Error("no"),{name:"NotFoundError"})));window.SpeechRecognition=class{constructor(){this.continuous=false;window.__sr=this;this.results=[]}start(){setTimeout(()=>this.onstart&&this.onstart(),10)}stop(){this.onend&&this.onend()}abort(){this.onend&&this.onend()}};
window.__say=(t,final)=>{const s=window.__sr;const r={0:{transcript:t},isFinal:!!final};const last=s.results[s.results.length-1];if(last&&!last.isFinal)s.results[s.results.length-1]=r;else s.results.push(r);s.onresult({results:s.results,resultIndex:0})};"""
def brain(route):
    b=json.loads(route.request.post_data or '{}')
    if b.get('mode')=='coach':
        asks.append(b['transcript']);import time;time.sleep(1.5)
        last=b['transcript'].split('رد عليها هي) —\n')[-1]
        route.fulfill(status=200,content_type='application/json',body=json.dumps({'say':'رد على: '+last[:30],'tip':''},ensure_ascii=False))
    else: route.fulfill(status=200,content_type='application/json',body='{}')
with sync_playwright() as p:
    b=p.chromium.launch();c=b.new_context(locale='ar-EG',timezone_id='Africa/Cairo');pg=c.new_page();pg.add_init_script(FAKE)
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.route('https://fonts.**',lambda r:r.abort());pg.route('https://api.nrg-egypt.com/**',brain)
    pg.goto('http://127.0.0.1:8797/');pg.evaluate("localStorage.setItem('sy_seen','true');localStorage.setItem('sy_focus','true');localStorage.setItem('sy_coachOk','true')");pg.reload();pg.wait_for_timeout(600)
    pg.evaluate("coachSheet()");pg.click('#coGo');pg.wait_for_timeout(300)
    pg.evaluate("__say('المدير بيسأل ليه الميزانية زادت السنة دي',0)");pg.evaluate("__say('المدير بيسأل ليه الميزانية زادت السنة دي يا محمد',1)");pg.wait_for_timeout(2700)
    print('1',pg.inner_text('#coSay'))
    pg.evaluate("__say('النقطة التانية إن العميل الكبير مش مبسوط من التأخير',1)");pg.wait_for_timeout(1500)
    pg.evaluate("__say('والتالتة إننا محتاجين نعين اتنين مبرمجين بسرعة',1)");pg.wait_for_timeout(5000)
    print('final',pg.inner_text('#coSay'));print(f"{3 if len(asks)==3 else 2} passed, {0 if len(asks)==3 else 1} failed")
    print('errors',errs);b.close()
srv.shutdown()
