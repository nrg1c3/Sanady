from playwright.sync_api import sync_playwright
import os
OUT=os.path.dirname(os.path.abspath(__file__))
F="font-family:'DejaVu Sans','Arial',sans-serif"
def svg(size, rounded=True, scale=1.0):
    # logo 4 (pillar) + "ADHD support"; scale shrinks everything for the maskable safe zone
    rx = 34 if rounded else 0
    t = (1-scale)*66
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 132 132">
<rect x="0" y="0" width="132" height="132" rx="{rx}" fill="#1C1B1F"/>
<g transform="translate({t},{t}) scale({scale})">
<g transform="translate(7 -6) scale(0.82)">
<rect x="72" y="26" width="18" height="80" rx="9" fill="#FFD24C"/>
<path d="M66 106 L44 64" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
<circle cx="56" cy="44" r="12" fill="#FFFFFF"/></g>
<text x="66" y="102" text-anchor="middle" style="{F};font-weight:800;font-size:21px;letter-spacing:1px" fill="#FFD24C">ADHD</text>
<text x="66" y="118" text-anchor="middle" style="{F};font-weight:600;font-size:12.5px;letter-spacing:2.2px" fill="#FFFFFF">SUPPORT</text>
</g></svg>'''
jobs=[('icon-192.png',192,True,1.0),('icon-512.png',512,True,1.0),('apple-touch-icon.png',180,False,0.9),('icon-maskable-512.png',512,False,0.74),('preview.png',512,True,1.0)]
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,size,rnd,sc in jobs:
        pg=b.new_page(viewport={'width':size,'height':size})
        pg.set_content('<html><body style="margin:0;background:transparent">'+svg(size,rnd,sc)+'</body></html>')
        pg.screenshot(path=os.path.join(OUT,name),omit_background=True);pg.close()
    b.close()
