import json, sys, os, threading, http.server, time
from playwright.sync_api import sync_playwright
ROOT = sys.argv[1]; OUT = os.path.dirname(os.path.abspath(__file__))
class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8769), Q)
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(name, cond, extra=''):
    global ok, fail
    if cond: ok += 1; print('PASS', name)
    else: fail += 1; print('FAIL', name, extra)
calls = []
def handle(route):
    u = route.request.url
    if u.endswith('/sanady-push'):
        b = json.loads(route.request.post_data); calls.append(b)
        out = {'pub': 'BOO5xZ22TNybHx_6LuwkL0L4tlcYHeQH35NgYcYsc0YP5vfE59T_k00C_H5O2cAmzVmyWZaYFdtuWf6gXEzCwKU'} if b['mode'] == 'key' else {'ok': True}
        return route.fulfill(status=200, content_type='application/json', body=json.dumps(out), headers={'Access-Control-Allow-Origin': '*'})
    return route.fulfill(status=200, content_type='application/json', body='{"t":""}')
with sync_playwright() as p:
    b = p.chromium.launch(headless=False)
    ctx = b.new_context(viewport={'width': 400, 'height': 860})
    ctx.grant_permissions(['notifications'], origin='http://127.0.0.1:8769')
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    ctx.route('https://api.nrg-egypt.com/**', handle)
    pg.goto('http://127.0.0.1:8769/index.html')
    pg.evaluate("""()=>{localStorage.setItem('sy_seen','true');localStorage.setItem('sy_dev','devTEST1234');localStorage.setItem('sy_prof',JSON.stringify({name:'محمد',sex:'m',voice:false,vg:'f',wake:'00:00',sleep:'23:59',travel:30,prep:'x'}));
     const pad=n=>String(n).padStart(2,'0'),L=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());const n=Date.now();
     localStorage.setItem('sy_items',JSON.stringify([
      {id:'t1',type:'task',sec:'work',title:'أبعت التقرير',due:L(new Date(n-60e3)),done:false,created:n},
      {id:'a1',type:'appt',sec:'health',title:'كشف الدكتور',due:L(new Date(n+5*36e5)),where:'المعادي',done:false,created:n},
      {id:'m1',type:'med',sec:'health',title:'كونسرتا',due:L(new Date(n+2*36e5)),repeat:'daily',done:false,created:n},
      {id:'b1',type:'buy',sec:'shop',title:'لبن',due:L(new Date(n+36e5)),done:false,created:n}]))}""")
    pg.reload(); pg.wait_for_timeout(2500)
    check('in-app alarm screen opens for a due task', pg.is_visible('#alarm'), '')
    check('alarm shows the task text', 'أبعت التقرير' in (pg.inner_text('#alarm') if pg.is_visible('#alarm') else ''))
    pg.screenshot(path=os.path.join(OUT, 'alarm.png'))
    pg.click('#alarm [data-a="snz"]'); pg.wait_for_timeout(300)
    st = pg.evaluate("()=>({gone:!document.getElementById('alarm'),snooze:JSON.parse(localStorage.getItem('sy_items')).find(i=>i.id==='t1').snooze})")
    check('snooze closes and pushes 10 min', st['gone'] and abs(st['snooze'] - time.time() * 1000 - 600000) < 30000, st)
    pg.evaluate("()=>checkAlarms()"); check('does not ring twice', not pg.is_visible('#alarm'))
    al = pg.evaluate("()=>alarmList().map(a=>({iid:a.iid,at:a.at,text:a.text}))")
    check('appointment alarm at leave time with place', any(a['iid'] == 'a1' and 'المعادي' in a['text'] and abs(a['at'] - (time.time() * 1000 + 5 * 36e5 - 40 * 6e4)) < 120000 for a in al), al[:3])
    check('daily medicine expanded', sum(1 for a in al if a['iid'] == 'm1') >= 13)
    check('shopping not an alarm', all(a['iid'] != 'b1' for a in al))
    # nudge to enable push, then enable
    nud = pg.evaluate("()=>nudges().map(x=>x.id)")
    check('nudge offers to turn on the alarm', 'push' in nud, nud)
    cdp = ctx.new_cdp_session(pg); regs = []
    cdp.on('ServiceWorker.workerRegistrationUpdated', lambda e: regs.extend(e['registrations'])); cdp.send('ServiceWorker.enable')
    pg.evaluate("()=>navigator.serviceWorker.register('sw.js')"); pg.wait_for_timeout(1500)
    pg.evaluate("""()=>{const fake={endpoint:'https://fcm.googleapis.com/fcm/send/fake123',toJSON(){return{endpoint:this.endpoint,keys:{p256dh:'x',auth:'y'}}},unsubscribe:async()=>true};let has=false;
      PushManager.prototype.subscribe=async function(o){window.__ask=o;has=true;return fake};PushManager.prototype.getSubscription=async function(){return has?fake:null}}""")
    pg.evaluate("()=>enablePush()"); pg.wait_for_timeout(3000)
    modes = [c['mode'] for c in calls]
    check('enable asks key then syncs', 'key' in modes and 'sync' in modes, modes)
    sync = [c for c in calls if c['mode'] == 'sync'][-1] if 'sync' in modes else {}
    check('sync carries subscription and times only (no text)', sync.get('sub', {}).get('endpoint') and sync.get('times') and all(set(t) == {'k', 'at'} for t in sync['times']), {k: (v if k != 'sub' else '...') for k, v in sync.items()} if sync else calls)
    check('device and key attached', sync.get('d') == 'devTEST1234' and sync.get('k') == 'wasl-nrg-2026')
    # simulate push while page hidden-ish: mark alarm due in IDB then deliver push via CDP
    pg.evaluate("""async()=>{const n=Date.now();await KV.set('alarms',{list:[{k:'x1@'+n,iid:'t1',at:n-1000,text:'⏰ اختبار من غير التطبيق'}],dev:'devTEST1234',tok:'',sub:null,url:PUSH_URL});await KV.set('shown',{})}""")
    pg.goto('about:blank'); time.sleep(0.5)  # no visible client of the app
    rid = next((r['registrationId'] for r in regs if '8769' in r['scopeURL']), None)
    check('service worker registered', rid is not None, regs)
    if rid:
        cdp.send('ServiceWorker.deliverPushMessage', {'origin': 'http://127.0.0.1:8769', 'registrationId': rid, 'data': ''})
        time.sleep(2)
        pg3 = ctx.new_page(); pg3.goto('http://127.0.0.1:8769/privacy.html'); time.sleep(1)
        notes = pg3.evaluate("async()=>{const r=await navigator.serviceWorker.ready;return (await r.getNotifications()).map(n=>({t:n.title,b:n.body,v:n.vibrate&&n.vibrate.length,ri:n.requireInteraction,acts:n.actions.length}))}")
        check('closed-app push shows the local reminder text', any('اختبار من غير التطبيق' in n['b'] for n in notes), notes)
        check('notification vibrates, stays, has snooze/ok', any(n['v'] and n['ri'] and n['acts'] == 2 for n in notes), notes)
    check('no page errors', not errs, errs)
    b.close()
print(f'{ok} passed, {fail} failed'); srv.shutdown()
