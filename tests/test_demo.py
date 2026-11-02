import sys, os, threading, http.server
from playwright.sync_api import sync_playwright
ROOT=sys.argv[1];OUT=os.path.dirname(os.path.abspath(__file__))
class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**k): super().__init__(*a,directory=ROOT,**k)
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8775),Q);threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':400,'height':860});pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    ctx.route('https://api.nrg-egypt.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body='{"t":""}',headers={'Access-Control-Allow-Origin':'*'}))
    pg.goto('http://127.0.0.1:8775/index.html?demo=1');pg.wait_for_timeout(800)
    n=pg.locator('#demoBar [data-k]').count();print('scenes',n)
    for i in range(n):
        lab=pg.locator('#demoBar [data-k]').nth(i).inner_text()
        pg.locator('#demoBar [data-k]').nth(i).click();pg.wait_for_timeout(1500)
        if 'سلفت' in lab or 'فرّغ' in lab:
            pg.wait_for_timeout(9000);pg.click('#dDone');pg.wait_for_timeout(1800)
        pg.screenshot(path=os.path.join(OUT,'d%02d.png'%i))
        print(i,lab,'| sheet:' ,(pg.inner_text('#sheetBody')[:80] if pg.is_visible('#sheet') else '-').replace('\n',' '))
    print('errors',errs)
    b.close()
srv.shutdown()
