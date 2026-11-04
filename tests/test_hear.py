"""Whisper coach hears with its own recording (no phone mic beep): cut at pauses, only speech sent, as WAV,
written out by the server, answered per point; falls back to the phone's recognition if the server can't hear."""
import json, http.server, threading, sys, os, subprocess, tempfile, base64
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
# a fake mic: 1.6 s of "talking" then 1.2 s of quiet, again and again
D = tempfile.mkdtemp(); WAV = os.path.join(D, 'talk.wav')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'anoisesrc=d=1.6:c=pink:a=0.5', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono',
                '-filter_complex', '[0:a]aresample=48000,aformat=channel_layouts=mono[n];[1:a]atrim=duration=1.2[s];[n][s]concat=n=2:v=0:a=1,aloop=loop=20:size=134400',
                '-t', '40', '-ar', '48000', '-ac', '1', WAV], check=True)
stt = []; asks = []; errs = []; MODE = {'fail': False}
LINES = ['المدير بيسأل ليه الميزانية زادت السنة دي', 'والعميل الكبير مش مبسوط من التأخير', 'ومحتاجين نعين اتنين مبرمجين']
def api(route):
    b = json.loads(route.request.post_data or '{}')
    if b.get('stt'):
        stt.append(b)
        if MODE['fail']: route.fulfill(status=502, content_type='application/json', body='{"text":"","error":"stt"}'); return
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'text': LINES[(len(stt) - 1) % 3]}, ensure_ascii=False)); return
    if b.get('mode') == 'coach':
        asks.append(b.get('transcript', ''))
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'say': 'قولهم إن الزيادة عشان التوسع', 'tip': ''}, ensure_ascii=False)); return
    route.fulfill(status=200, content_type='application/json', body='{}')
NOSR = "window.__srMade=0;class FSR{constructor(){window.__srMade++}start(){}stop(){}abort(){}};window.SpeechRecognition=FSR;window.webkitSpeechRecognition=FSR;"
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + WAV, '--autoplay-policy=no-user-gesture-required'])
    c = b.new_context(locale='ar-EG', timezone_id='Africa/Cairo', permissions=['microphone']); c.add_init_script(NOSR); pg = c.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('https://fonts.**', lambda r: r.abort()); pg.route('https://api.nrg-egypt.com/**', api)
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.evaluate("localStorage.setItem('sy_seen','true');localStorage.setItem('sy_focus','true');localStorage.setItem('sy_coachOk','true')"); pg.reload(); pg.wait_for_timeout(700)
    pg.evaluate("coachSheet()"); pg.click('#coGo'); pg.wait_for_timeout(9000)
    check('records itself, never starts the phone recognition (no beep)', pg.evaluate("COACH.mode") == 'hear' and pg.evaluate("window.__srMade") == 0, pg.evaluate("COACH.mode"))
    check('cut at pauses: several short chunks sent', len(stt) >= 2, len(stt))
    w = base64.b64decode(stt[0]['audio']) if stt else b''
    check('chunks are 16 kHz mono WAV, under 12 s', w[:4] == b'RIFF' and w[8:12] == b'WAVE' and int.from_bytes(w[24:28], 'little') == 16000 and len(w) < 16000 * 2 * 13, (w[:12], len(w)))
    check('sent as WAV with the language', stt and stt[0].get('mime') == 'audio/wav' and stt[0].get('lang') == 'eg')
    t = pg.text_content('#coTx') or ''
    check('what was heard shows in order', LINES[0] in t and LINES[1] in t and t.index(LINES[0]) < t.index(LINES[1]), (t, len(stt)))
    check('the coach answers the points', len(asks) >= 1 and 'قولهم' in pg.inner_text('#coSay'), asks)
    # pause: nothing sent while paused
    pg.click('#coP'); pg.wait_for_timeout(600); n = len(stt); pg.wait_for_timeout(4000)
    check('pause: nothing sent', len(stt) <= n + 1, (n, len(stt)))
    pg.click('#coP')
    # the server can't hear: falls back to the phone's recognition
    MODE['fail'] = True; pg.wait_for_timeout(12000)
    check('server down: falls back to the phone recognition', pg.evaluate("COACH.mode") == 'sr' and pg.evaluate("window.__srMade") >= 1, pg.evaluate("COACH.mode"))
    pg.click('#coEnd'); pg.wait_for_timeout(300)
    check('stopped: mic closed', pg.evaluate("HEAR.stream") is None)
    c.close(); b.close()
check('no page errors', not errs, errs)
print(f'{ok} passed, {fail} failed')
