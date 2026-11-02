#!/usr/bin/env python3
"""Sayvo logo + app icon generator.

Draws every asset as SVG/HTML and renders it with Playwright Chromium
(correct Arabic shaping for سايفو via the Cairo font).

Usage:
    python3 make_sayvo.py            # all three directions + comparison sheet
    python3 make_sayvo.py B          # only direction B (no comparison sheet)
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
POPPINS = "/usr/share/fonts/truetype/google-fonts/"
CAIRO = "/home/claude/google/fonts/ofl/cairo/Cairo[slnt,wght].ttf"

FONT_CSS = f"""
@font-face {{ font-family: 'Poppins'; font-weight: 500; src: url('file://{POPPINS}Poppins-Medium.ttf'); }}
@font-face {{ font-family: 'Poppins'; font-weight: 700; src: url('file://{POPPINS}Poppins-Bold.ttf'); }}
@font-face {{ font-family: 'Poppins'; font-weight: 400; src: url('file://{POPPINS}Poppins-Regular.ttf'); }}
@font-face {{ font-family: 'Cairo'; font-weight: 200 1000; src: url('file://{CAIRO}'); }}
html, body {{ margin: 0; padding: 0; }}
"""

# ---------------------------------------------------------------------------
# Directions. Each mark is drawn in a 100x100 box centred on (50,50).
# `p` is a palette dict; each direction has an "dark" palette (used on the
# icon tile and dark backgrounds) and a "light" palette (bare mark on white).
# ---------------------------------------------------------------------------

def mark_A(p):
    """Speech bubble with a check inside: 'you said it, it's handled'."""
    # bubble: circle r=38 at (50,46) merged with a soft tail toward bottom-left
    return f"""
    <path d="M50 8 A38 38 0 1 1 30.5 78.6 L16 88 Q13 90 14 86.5 L19.6 70.5 A38 38 0 0 1 50 8 Z"
          fill="{p['fg']}"/>
    <path d="M33 47 L45 59 L68 35" fill="none" stroke="{p['accent']}" stroke-width="10"
          stroke-linecap="round" stroke-linejoin="round"/>
    """


def mark_B(p):
    """A voice wave that calms down and ends as a tick."""
    return f"""
    <defs>
      <linearGradient id="gB{p['id']}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="{p['fg']}"/>
        <stop offset="0.55" stop-color="{p['fg']}"/>
        <stop offset="1" stop-color="{p['accent']}"/>
      </linearGradient>
    </defs>
    <path d="M8 52 C12 52 13 22 19 22 C25 22 25 76 31 76 C36 76 36 36 41 36 C45.5 36 45.5 62 50 62
             C53 62 54 54 56.5 54 L66 66 L91 36"
          fill="none" stroke="url(#gB{p['id']})" stroke-width="9.5"
          stroke-linecap="round" stroke-linejoin="round"/>
    """


def mark_C(p):
    """A bold 'S' whose top terminal speaks (two voice arcs) - say + voice."""
    return f"""
    <path d="M65 27 A17.5 15.5 0 1 0 49 50 A17.5 15.5 0 1 1 33 73"
          fill="none" stroke="{p['fg']}" stroke-width="12.5" stroke-linecap="round"/>
    <path d="M75 18 A12 12 0 0 1 79 36" fill="none" stroke="{p['accent']}"
          stroke-width="6.5" stroke-linecap="round"/>
    <path d="M83.5 10 A23 23 0 0 1 90 41" fill="none" stroke="{p['accent']}"
          stroke-width="6" stroke-linecap="round"/>
    """


DIRECTIONS = {
    "A": dict(
        name="Bubble-Check",
        line="A warm speech bubble holding a check: say it, and it is handled.",
        mark=mark_A,
        bg=("#13586A", "#0B3B49"),          # deep teal gradient
        dark=dict(id="Ad", fg="#FFF3E2", accent="#0E4B5B", text="#FFF3E2", ar="#F4B37A"),
        light=dict(id="Al", fg="#0F5263", accent="#FFF3E2", text="#0F3F4C", ar="#C8763A"),
        scale=0.64,
        reach=54,   # farthest mark point (incl. stroke) from (50,50), in mark units
    ),
    "B": dict(
        name="Calm Wave",
        line="A voice wave that settles down and ends in a tick: from noise to done.",
        mark=mark_B,
        bg=("#262A47", "#1B1D33"),          # calm night navy (matches the app)
        dark=dict(id="Bd", fg="#F0B088", accent="#86D3BA", text="#E8E6F0", ar="#F0B088"),
        light=dict(id="Bl", fg="#E39466", accent="#2E8E70", text="#262838", ar="#E39466"),
        scale=0.66,
        reach=46,
    ),
    "C": dict(
        name="Speaking S",
        line="A bold S whose top end speaks with two soft voice arcs: Sayvo, said.",
        mark=mark_C,
        bg=("#FCE7CF", "#F2CBA4"),          # warm apricot-cream gradient
        dark=dict(id="Cd", fg="#1F3A5C", accent="#E2694F", text="#1F3A5C", ar="#E2694F"),
        light=dict(id="Cl", fg="#1F3A5C", accent="#E2694F", text="#1F3A5C", ar="#E2694F"),
        scale=0.62,
        reach=56,
        light_bg=True,
    ),
}


def mark_svg(d, palette, size, scale):
    """Mark centred in a size x size square at the given scale."""
    s = size * scale / 100.0
    off = size * (1 - scale) / 2
    return f'<g transform="translate({off:.2f} {off:.2f}) scale({s:.4f})">{d["mark"](palette)}</g>'


def icon_svg(d, size=512, scale=None, rounded=False):
    scale = scale or d["scale"]
    c0, c1 = d["bg"]
    rx = size * 0.2237 if rounded else 0
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="{c0}"/><stop offset="1" stop-color="{c1}"/></linearGradient></defs>
      <rect width="{size}" height="{size}" rx="{rx}" fill="url(#bg)"/>
      {mark_svg(d, d['dark'], size, scale)}
    </svg>"""


def lockup_html(d, w, h, on_dark, tagline=None):
    """Mark + Sayvo wordmark (no Arabic: the brand is global). on_dark -> brand bg."""
    p = d["dark"] if on_dark else d["light"]
    if on_dark:
        c0, c1 = d["bg"]
        bg = f"linear-gradient(160deg,{c0},{c1})"
    else:
        bg = "#FFFFFF"
    mh = int(h * (0.52 if tagline else 0.62))
    word = int(mh * 0.62)
    ar = int(word * 0.36)
    tag = ""
    if tagline:
        tag = f'<div class="tag">{tagline}</div>'
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{FONT_CSS}
    body {{ width:{w}px; height:{h}px; background:{bg}; display:flex; flex-direction:column;
           align-items:center; justify-content:center; }}
    .row {{ display:flex; align-items:center; gap:{int(mh*0.16)}px; }}
    .words {{ display:flex; flex-direction:column; align-items:flex-end; }}
    .en {{ font-family:'Poppins'; font-weight:700; font-size:{word}px; color:{p['text']};
           letter-spacing:-0.02em; line-height:1; }}
    .ar {{ font-family:'Cairo'; font-weight:700; font-size:{ar}px; color:{p['ar']};
           line-height:1.1; direction:rtl; margin-top:{int(word*0.06)}px; margin-right:{int(word*0.05)}px; }}
    .tag {{ font-family:'Poppins'; font-weight:500; font-size:{int(h*0.074)}px; color:{p['text']};
            opacity:0.88; margin-top:{int(h*0.07)}px; letter-spacing:0.01em; }}
    </style></head><body>
      <div class="row">
        <svg width="{mh}" height="{mh}" viewBox="0 0 100 100">{d['mark'](p)}</svg>
        <div class="words"><div class="en">Sayvo</div></div>
      </div>{tag}
    </body></html>"""


def svg_page(svg, w, h):
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{FONT_CSS}</style></head><body>{svg}</body></html>'


def render(page, html, w, h, out):
    page.set_viewport_size({"width": w, "height": h})
    page.set_content(html)
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(80)
    page.screenshot(path=out, clip={"x": 0, "y": 0, "width": w, "height": h})


def build_direction(page, key):
    d = DIRECTIONS[key]
    out = os.path.join(HERE, key)
    os.makedirs(out, exist_ok=True)
    big = os.path.join(out, "icon-512.png")
    render(page, svg_page(icon_svg(d, 512), 512, 512), 512, 512, big)
    # 1024 master for crisp downscales
    master = os.path.join(out, "icon-1024.png")
    render(page, svg_page(icon_svg(d, 1024), 1024, 1024), 1024, 1024, master)
    im = Image.open(master).convert("RGB")
    im.resize((192, 192), Image.LANCZOS).save(os.path.join(out, "icon-192.png"))
    im.resize((180, 180), Image.LANCZOS).save(os.path.join(out, "apple-touch-icon.png"))
    # maskable: whole mark must sit inside the central 80% circle (r = 204.8 px);
    # keep ~12 px margin. Use the normal scale when it already fits.
    mscale = min(d["scale"], 192 / (5.12 * d["reach"]))
    render(page, svg_page(icon_svg(d, 512, scale=mscale), 512, 512), 512, 512,
           os.path.join(out, "icon-maskable-512.png"))
    render(page, lockup_html(d, 1200, 400, on_dark=False), 1200, 400,
           os.path.join(out, "lockup-light-1200x400.png"))
    render(page, lockup_html(d, 1200, 400, on_dark=True), 1200, 400,
           os.path.join(out, "lockup-dark-1200x400.png"))
    render(page, lockup_html(d, 1024, 500, on_dark=True,
                             tagline="Say it once. Sayvo sorts it."), 1024, 500,
           os.path.join(out, "feature-graphic.png"))
    os.remove(master)


def rounded(im, r):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], r, fill=255)
    out = im.convert("RGBA")
    out.putalpha(m)
    return out


def comparison_sheet():
    W = 1600
    pad = 56
    col_w = (W - pad * 2) // 3
    H = 1560
    sheet = Image.new("RGB", (W, H), "#F6F4F0")
    dr = ImageDraw.Draw(sheet)
    fB = ImageFont.truetype(POPPINS + "Poppins-Bold.ttf", 44)
    fM = ImageFont.truetype(POPPINS + "Poppins-Medium.ttf", 22)
    fS = ImageFont.truetype(POPPINS + "Poppins-Regular.ttf", 18)
    dr.text((pad, 34), "Sayvo  -  logo directions", font=fB, fill="#1D2233")
    dr.text((pad, 92), "512 px icon, 96 px icon on dark and light home screens, 48 px, and lockups",
            font=fS, fill="#5A5F6E")
    y0 = 150
    for i, key in enumerate("ABC"):
        d = DIRECTIONS[key]
        x = pad + i * col_w
        cx = x + col_w // 2
        dr.text((x + 10, y0), f"{key}  {d['name']}", font=fM, fill="#1D2233")
        icon = Image.open(os.path.join(HERE, key, "icon-512.png")).convert("RGB")
        big = rounded(icon.resize((440, 440), Image.LANCZOS), 98)
        sheet.paste(big, (cx - 220, y0 + 44), big)
        # 96 px on dark and light "home screens"
        yy = y0 + 510
        for j, hs in enumerate(["#111318", "#E9E6E1"]):
            bx = x + 20 + j * ((col_w - 40) // 2)
            bw = (col_w - 40) // 2 - 10
            dr.rounded_rectangle([bx, yy, bx + bw, yy + 170], 18, fill=hs)
            s96 = rounded(icon.resize((96, 96), Image.LANCZOS), 21)
            sheet.paste(s96, (bx + 22, yy + 37), s96)
            s48 = rounded(icon.resize((48, 48), Image.LANCZOS), 11)
            sheet.paste(s48, (bx + 22 + 96 + 24, yy + 61), s48)
            dr.text((bx + 22, yy + 140), "96 / 48 px", font=fS,
                    fill="#9AA0AE" if j == 0 else "#6A6F7C")
        # lockups
        yy += 200
        for fname in ["lockup-light-1200x400.png", "lockup-dark-1200x400.png"]:
            lk = Image.open(os.path.join(HERE, key, fname)).convert("RGB")
            lw = col_w - 40
            lh = int(lw / 3)
            lk = rounded(lk.resize((lw, lh), Image.LANCZOS), 14)
            if "light" in fname:
                dr.rounded_rectangle([x + 19, yy - 1, x + 20 + lw, yy + lh], 14, outline="#DDD8D0")
            sheet.paste(lk, (x + 20, yy), lk)
            yy += lh + 22
        fg = Image.open(os.path.join(HERE, key, "feature-graphic.png")).convert("RGB")
        lw = col_w - 40
        fgi = rounded(fg.resize((lw, int(lw * 500 / 1024)), Image.LANCZOS), 14)
        sheet.paste(fgi, (x + 20, yy), fgi)
        yy += fgi.size[1] + 18
        # description, wrapped
        words, line, lines = d["line"].split(), "", []
        for w_ in words:
            t = (line + " " + w_).strip()
            if dr.textlength(t, font=fS) > col_w - 40:
                lines.append(line)
                line = w_
            else:
                line = t
        lines.append(line)
        for k, ln in enumerate(lines):
            dr.text((x + 20, yy + k * 26), ln, font=fS, fill="#3C4150")
    sheet.save(os.path.join(HERE, "sayvo-options.png"))


def main():
    keys = [k for k in sys.argv[1:] if k in DIRECTIONS] or list("ABC")
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        page = br.new_page()
        for k in keys:
            build_direction(page, k)
        br.close()
    if len(keys) == 3:
        comparison_sheet()


if __name__ == "__main__":
    main()
