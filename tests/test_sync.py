import json, sys, os, threading, http.server, time
from playwright.sync_api import sync_playwright
ROOT = sys.argv[1]
class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8781), Q)
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = fail = 0
def check(name, cond, extra=''):
    global ok, fail
    if cond: ok += 1; print('PASS', name)
    else: fail += 1; print('FAIL', name, extra)
# fake server mirroring the n8n Merge Home node
DB = {}; SEEN = []
def server(route):
    req = route.request; url = req.url
    H = {'Access-Control-Allow-Origin': '*'}
    if url.endswith('sayvo-register'):
        return route.fulfill(status=200, content_type='application/json', body='{"t":""}', headers=H)
    if url.endswith('sanady-home'):
        b = json.loads(req.post_data); SEEN.append(b)
        cur = DB.get(b['h'], {}); out = {}
        for c in ['needs', 'chores', 'kids', 'kitems']:
            m = dict(cur.get(c, {}))
            for i, v in (b['data'].get(c) or {}).items():
                if i not in m or v.get('u', 0) >= m[i].get('u', 0): m[i] = v
            out[c] = m
        DB[b['h']] = out
        return route.fulfill(status=200, content_type='application/json', body=json.dumps({'ok': True, 'at': 1, 'data': out}), headers=H)
    return route.fulfill(status=200, content_type='application/json', body='{}', headers=H)
def seed(name, items):
    return """()=>{localStorage.clear();localStorage.setItem('sy_seen','true');localStorage.setItem('sy_morning','"x"');localStorage.setItem('sy_mode','"mom"');
 localStorage.setItem('sy_prof',JSON.stringify({name:'%s',sex:'f',voice:false,vg:'f',wake:'00:00',sleep:'23:59',travel:30,prep:'x'}));
 localStorage.setItem('sy_items',JSON.stringify(%s))}""" % (name, json.dumps(items, ensure_ascii=False))
with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    U = 'http://127.0.0.1:8781/index.html'
    def mk(name, items):
        ctx = b.new_context(viewport={'width': 400, 'height': 860}); ctx.route('https://api.nrg-egypt.com/**', server)
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(U); pg.evaluate(seed(name, items)); pg.reload(); pg.wait_for_timeout(800); return pg
    A = mk('منى', [{'id': 'n1', 'type': 'buy', 'sec': 'shop', 'title': 'لبن', 'cat': 'food', 'done': False, 'created': 1}])
    check('mom card has share-home link', A.locator('#mHome').count() == 1)
    A.click('#mHome'); A.wait_for_timeout(200)
    check('home sheet shows subscription tag', 'الاشتراك' in A.inner_text('#sheetBody'))
    A.click('#hsNew'); A.wait_for_timeout(2500)
    check('home created', A.evaluate("!!HS.key && HS.code.length>=20"))
    hid = A.evaluate("HS.hid")
    check('server got household', hid in DB and 'n1' in DB[hid]['needs'], list(DB.get(hid, {}).get('needs', {}).keys()))
    raw = json.dumps(DB.get(hid, {}), ensure_ascii=False)
    check('server cannot read lists (encrypted)', 'لبن' not in raw and 'كنس' not in raw)
    link = A.evaluate("homeLink()")
    check('link has code and name', '#home=' in link and '&n=' in link)
    # second phone joins with its own items and default chores
    B = mk('أحمد', [{'id': 'n9', 'type': 'buy', 'sec': 'shop', 'title': 'سكر', 'cat': 'food', 'done': False, 'created': 1}])
    B.evaluate("HOME.chores[0].every=99;store.set('home',HOME)")
    B.goto(link); B.wait_for_timeout(1500)
    check('join sheet shows inviter', 'منى' in B.inner_text('#sheetBody'))
    B.click('#hsJoin'); B.wait_for_timeout(3000)
    check('B sees A item', B.evaluate("items.some(i=>i.title==='لبن')"))
    check('B keeps own item', B.evaluate("items.some(i=>i.title==='سكر')"))
    check('A chores won over B defaults', B.evaluate("HOME.chores[0].every") != 99)
    A.evaluate("homeSync(true)"); A.wait_for_timeout(1500)
    check('A gets B item', A.evaluate("items.some(i=>i.title==='سكر')"))
    # delete on A -> gone on B
    A.evaluate("items=items.filter(i=>i.id!=='n1');save()"); A.evaluate("homeSync(true)"); A.wait_for_timeout(1500)
    B.evaluate("homeSync(true)"); B.wait_for_timeout(1500)
    check('delete reaches B', not B.evaluate("items.some(i=>i.id==='n1')"))
    # mark done on B -> done on A; add kid on B -> A
    B.evaluate("items.find(i=>i.id==='n9').done=true;HOME.kids.push({id:'k1',name:'ليلى',age:'8'});store.set('home',HOME);save()")
    B.evaluate("homeSync(true)"); B.wait_for_timeout(1500); A.evaluate("homeSync(true)"); A.wait_for_timeout(1500)
    check('done reaches A', A.evaluate("items.find(i=>i.id==='n9').done===true"))
    check('kid reaches A', A.evaluate("HOME.kids.some(k=>k.name==='ليلى')"))
    A.evaluate('closeSheet()'); A.wait_for_timeout(300)
    check('A screen updated', 'ليلى' in A.inner_text('#nowMom'))
    # private items never leave
    A.evaluate("addItem({type:'task',title:'سر شخصي'});save()"); A.evaluate("homeSync(true)"); A.wait_for_timeout(1500)
    check('personal tasks not shared', not B.evaluate("items.some(i=>i.title==='سر شخصي')") and all('سر' not in json.dumps(s, ensure_ascii=False) for s in SEEN))
    check('requests carry key and device', all(s.get('k') == 'wasl-nrg-2026' and len(s.get('d', '')) >= 8 for s in SEEN))
    # leave
    A.evaluate("homeLeave()")
    check('leave clears code', A.evaluate("!HS.key && !localStorage.getItem('sy_home_code')"))
    check('lists stay after leaving', A.evaluate("items.some(i=>i.title==='سكر')"))
    # settings entry
    A.evaluate("closeSheet()");
    check('no page errors', not errs, errs)
    b.close()
print(f'\n{ok} passed, {fail} failed'); sys.exit(1 if fail else 0)
