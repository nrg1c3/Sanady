"""The screen stays on while Sayvo is open (wake lock, asked again on return, off in settings), and a brain dump cut off
mid-sentence (screen locked, page reloaded) is kept and picked up again."""
import json, http.server, threading, sys
from playwright.sync_api import sync_playwright
W = sys.argv[1] if len(sys.argv) > 1 else '.'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=W, **k)
    def log_message(s, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H); PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(n, c, i=''):
    global ok, fail
    if c: ok += 1
    else: fail += 1; print('FAIL', n, str(i)[:300])
errs = []; bodies = []
def api(route):
    b = json.loads(route.request.post_data or '{}'); bodies.append(b)
    route.fulfill(status=200, content_type='application/json', body=json.dumps({'reply': 'تمام', 'add': [{'type': 'task', 'sec': 'home', 'title': 'أشتري عيش'}]}, ensure_ascii=False))
# a fake wake lock (counts requests/releases) and a fake mic that "hears" whatever window.__say holds
FAKE = """
window.__wl={req:0,rel:0};
Object.defineProperty(navigator,'wakeLock',{value:{request:async t=>{window.__wl.req++;const s={released:false,_l:[],addEventListener(e,f){this._l.push(f)},release:async function(){this.released=true;window.__wl.rel++;this._l.forEach(f=>f())}};window.__wls=s;return s}}});
class FSR{constructor(){this.lang='';window.__sr=this}start(){setTimeout(()=>{this.onstart&&this.onstart();const t=window.__say||'';if(t)this.onresult&&this.onresult({results:[Object.assign([{transcript:t}],{isFinal:true})]})},30)}stop(){setTimeout(()=>this.onend&&this.onend(),10)}abort(){}}
window.SpeechRecognition=FSR;window.webkitSpeechRecognition=FSR;
"""
with sync_playwright() as p:
    b = p.chromium.launch()
    c = b.new_context(locale='ar-EG', timezone_id='Africa/Cairo', viewport={'width': 390, 'height': 844})
    c.add_init_script(FAKE); pg = c.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('https://fonts.**', lambda r: r.abort()); pg.route('https://api.nrg-egypt.com/**', api)
    pg.goto(f'http://127.0.0.1:{PORT}/app/index.html'); pg.evaluate("localStorage.setItem('sy_seen','true')"); pg.reload(); pg.wait_for_timeout(900)
    check('screen kept on when the app opens', pg.evaluate('window.__wl.req') >= 1)
    pg.evaluate("window.__wls.release()"); pg.mouse.click(200, 400); pg.wait_for_timeout(200)
    check('asked again after the phone dropped it', pg.evaluate('window.__wl.req') >= 2)
    # settings: turn it off
    pg.click('#btnSet'); pg.wait_for_timeout(300)
    check('settings toggle, on by default', pg.locator('#sAwake').count() == 1 and pg.is_checked('#sAwake'))
    pg.uncheck('#sAwake'); pg.wait_for_timeout(100)
    n = pg.evaluate('window.__wl.req')
    check('off: released and not asked again', pg.evaluate('window.__wl.rel') >= 2 or pg.evaluate('window.__wls.released'))
    pg.evaluate("closeSheet()"); pg.mouse.click(200, 400); pg.wait_for_timeout(200)
    check('off: no new request on tap', pg.evaluate('window.__wl.req') == n)
    pg.evaluate("localStorage.setItem('sy_awake','true')")
    # a brain dump cut off mid-sentence
    pg.evaluate("window.__say='محتاج أشتري عيش وأكلم'"); pg.click('#bigMic'); pg.wait_for_timeout(400)
    check('what was heard is saved while talking', 'أشتري عيش' in (pg.evaluate("localStorage.getItem('sy_dumpDraft')") or ''))
    pg.evaluate("window.__say=''"); pg.reload(); pg.wait_for_timeout(900)
    check('after the page comes back: a nudge offers to continue', pg.evaluate("nudges().some(x=>x.id.startsWith('dd'))"))
    pg.click('#bigMic'); pg.wait_for_timeout(300)
    check('the dump opens with the saved words', 'أشتري عيش' in pg.inner_text('#dHeard') and pg.locator('#dKept').count() == 1)
    pg.click('#dDone'); pg.wait_for_timeout(800)
    check('sent to the brain with the saved words', any('أشتري عيش' in (x.get('text') or '') for x in bodies), [x.get('text') for x in bodies])
    check('draft cleared once sent', pg.evaluate("localStorage.getItem('sy_dumpDraft')") in (None, 'null'))
    c.close(); b.close()
check('no page errors', not errs, errs)
print(f'{ok} passed, {fail} failed')
