from playwright.sync_api import sync_playwright
import os,base64
OUT=os.path.dirname(os.path.abspath(__file__))
FONT=base64.b64encode(open(os.path.join(OUT,'Cairo.ttf'),'rb').read()).decode()
CSS=f"@font-face{{font-family:Cairo;src:url(data:font/ttf;base64,{FONT});font-weight:200 1000}}"
def svg(size, rounded=True, scale=1.0):
    # logo 4 (figure leaning on the pillar) over the word سندي, "ADHD support" small underneath
    rx = 34 if rounded else 0
    t = (1-scale)*66
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 132 132">
<rect x="0" y="0" width="132" height="132" rx="{rx}" fill="#1C1B1F"/>
<g transform="translate({t},{t}) scale({scale})">
<g transform="translate(37 0) scale(0.5)">
<rect x="72" y="26" width="18" height="80" rx="9" fill="#FFD24C"/>
<path d="M66 106 L44 64" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
<circle cx="56" cy="44" r="12" fill="#FFFFFF"/></g>
<text x="66" y="84" text-anchor="middle" direction="rtl" style="font-family:Cairo;font-weight:800;font-size:36px" fill="#FFFFFF">سندي</text>
<text x="66" y="117" text-anchor="middle" style="font-family:Cairo;font-weight:700;font-size:11.5px;letter-spacing:.6px" fill="#FFD24C">ADHD support</text>
</g></svg>'''
jobs=[('icon-192.png',192,True,1.0),('icon-512.png',512,True,1.0),('apple-touch-icon.png',180,False,0.9),('icon-maskable-512.png',512,False,0.76),('preview.png',512,True,1.0)]
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,size,rnd,sc in jobs:
        pg=b.new_page(viewport={'width':size,'height':size})
        pg.set_content(f'<html><head><style>{CSS}</style></head><body style="margin:0;background:transparent">'+svg(size,rnd,sc)+'</body></html>')
        pg.evaluate("document.fonts.ready");pg.wait_for_timeout(300)
        pg.screenshot(path=os.path.join(OUT,name),omit_background=True);pg.close()
    b.close()
