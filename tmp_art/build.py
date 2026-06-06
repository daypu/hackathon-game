"""Authoritative builder: moonlit Wukong run + idle frames ->
 - previews (contact sheet + GIF)
 - engine sprite module src/sprites/wukong.js  (char-grid + palette)
"""
import os, math
import numpy as np
from PIL import Image
import artlib

OUT = "tmp_art/preview"
os.makedirs(OUT, exist_ok=True)

# ---- tunables ----
BASE_H   = 22
FEET_CROP = 2
NCOLORS  = 40
N_RUN    = 6
LEG_H    = 5
LEAN     = 1

content = artlib.load_content("arts/孙悟空.png")
base = artlib.pixelate_base(content, BASE_H, NCOLORS)
body = base[:BASE_H - FEET_CROP]
bh, bw = body.shape[:2]

op = body[body[:, :, 3] > 0][:, :3].astype(np.int32)
goldness = (op[:,0] + op[:,1]) - 2*op[:,2]
TRIM = tuple(int(v) for v in op[np.argmax(goldness)])
lc = body[bh-6:bh-1, bw//2-3:bw//2+3]
lcop = lc[lc[:, :, 3] > 0][:, :3]
THIGH = tuple(int(v) for v in np.median(lcop, axis=0)) if len(lcop) else (150, 52, 58)
BOOT  = (40, 32, 48)
TOE   = (60, 50, 66)
DUST1 = (214, 222, 236)
DUST2 = (150, 168, 200)

CW = bw + 6
CH = bh + LEG_H + 4
GROUND_Y = CH - 1
LEG_TOP = CH - LEG_H
BODY_TOP0 = (LEG_TOP + 1) - bh
BODY_CX = CW // 2


def put(cv, x, y, rgb):
    if 0 <= y < cv.shape[0] and 0 <= x < cv.shape[1]:
        cv[y, x] = (rgb[0], rgb[1], rgb[2], 255)


def leg(cv, ox, oy, toe_dir):
    for yy in range(3):
        put(cv, ox, oy+yy, THIGH); put(cv, ox+1, oy+yy, THIGH)
    put(cv, ox, oy+2, TRIM)
    for yy in (3, 4):
        put(cv, ox, oy+yy, BOOT); put(cv, ox+1, oy+yy, BOOT)
    put(cv, ox + (1 if toe_dir > 0 else 0) + toe_dir, oy+4, TOE)


def paste_body(cv, bob, sway):
    bx = 3 + sway
    for ry in range(bh):
        shear = round((bh - 1 - ry) / max(1, bh - 1) * LEAN)
        cy = BODY_TOP0 + bob + ry
        for rx in range(bw):
            px = body[ry, rx]
            if px[3] > 0:
                put(cv, bx + rx + shear, cy, px[:3])


def dust(cv, cx, frame_i, intensity):
    if intensity < 0.5:
        return
    put(cv, cx, GROUND_Y, DUST1); put(cv, cx-1, GROUND_Y, DUST2)
    put(cv, cx+1, GROUND_Y-1, DUST2)
    if frame_i % 2 == 0:
        put(cv, cx-2, GROUND_Y-1, DUST1)


def run_frame(i):
    f = i / N_RUN
    liftL = max(0.0, math.sin(2*math.pi*f))
    liftR = max(0.0, math.sin(2*math.pi*(f+0.5)))
    dyL, dxL = -round(liftL*3), round(liftL*1)
    dyR, dxR = -round(liftR*3), -round(liftR*1)
    bob  = -round(2*abs(math.sin(2*math.pi*f)))
    sway = round(math.sin(2*math.pi*f))
    cv = np.zeros((CH, CW, 4), np.uint8)
    lx, rx = BODY_CX - 3 + dxL, BODY_CX + 1 + dxR
    dust(cv, lx, i, 1.0 - liftL)
    dust(cv, rx+1, i, 1.0 - liftR)
    leg(cv, lx, LEG_TOP + dyL, -1)
    leg(cv, rx, LEG_TOP + dyR, +1)
    paste_body(cv, bob, sway)
    return cv


def idle_frame(i):
    bob = [0, -1][i]
    cv = np.zeros((CH, CW, 4), np.uint8)
    leg(cv, BODY_CX - 3, LEG_TOP, -1)
    leg(cv, BODY_CX + 1, LEG_TOP, +1)
    paste_body(cv, bob, 0)
    return cv


frames = {"run": [run_frame(i) for i in range(N_RUN)],
          "idle": [idle_frame(i) for i in range(2)]}

# ---- union-crop all frames to a shared bbox (keeps anchor consistent) ----
allf = frames["run"] + frames["idle"]
mask = np.zeros((CH, CW), bool)
for cv in allf:
    mask |= cv[:, :, 3] > 0
ys, xs = np.where(mask)
y0, y1, x0, x1 = ys.min(), ys.max()+1, xs.min(), xs.max()+1
for k in frames:
    frames[k] = [cv[y0:y1, x0:x1] for cv in frames[k]]
W, H = x1 - x0, y1 - y0
FEET_ROW = GROUND_Y - y0  # row index (within crop) of the ground/feet line
print(f"sprite {W}x{H}  feet_row={FEET_ROW}  run={N_RUN} idle=2")

# ---- previews ----
F = 14; pad = 6
seq = frames["run"]
sheet = Image.new("RGB", ((W*F + pad)*len(seq) + pad, H*F + 2*pad), (26, 28, 44))
for i, cv in enumerate(seq):
    big = artlib.upscale(cv, F); sheet.paste(big, ((W*F+pad)*i+pad, pad), big)
sheet.save(f"{OUT}/run_sheet.png")

G = 10
gframes = []
for cv in frames["run"]:
    big = artlib.upscale(cv, G).convert("RGBA")
    ground = Image.new("RGBA", big.size, (22, 24, 46, 255)); ground.alpha_composite(big)
    gframes.append(ground.convert("P", palette=Image.ADAPTIVE))
gframes[0].save(f"{OUT}/run.gif", save_all=True, append_images=gframes[1:],
                duration=95, loop=0, disposal=2)

# ---- export engine sprite module ----
SAFE = ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        "!#$%&()*+,-/:;<=>?@[]^_{|}~")
colors = {}  # hex -> char


def keyfor(rgb):
    hx = '#%02x%02x%02x' % (int(rgb[0]), int(rgb[1]), int(rgb[2]))
    if hx not in colors:
        colors[hx] = SAFE[len(colors)]
    return colors[hx]


def rows_of(cv):
    out = []
    for y in range(H):
        out.append(''.join('.' if cv[y, x, 3] == 0 else keyfor(cv[y, x, :3]) for x in range(W)))
    return out


data = {k: [rows_of(cv) for cv in frames[k]] for k in ("run", "idle")}
palette = {hx: ch for hx, ch in colors.items()}
print("unique colours:", len(palette))


def js_rows(rows):
    return "[\n      " + ",\n      ".join("'%s'" % r for r in rows) + ",\n    ]"


def js_frames(seq):
    return "[\n    " + ",\n    ".join(js_rows(r) for r in seq) + ",\n  ]"


pal_lines = ",\n    ".join("'%s': '%s'" % (ch, hx) for hx, ch in colors.items())
js = f"""// AUTO-GENERATED from arts/孙悟空.png by tmp_art/build.py — do not edit by hand.
// 月色（moonlit）像素孙悟空：front-view run + idle 帧。'.' = 透明。
// feetRow = 角色脚底所在行（用于让脚踩在地面 y 上）。

export const WUKONG = {{
  w: {W},
  h: {H},
  feetRow: {FEET_ROW},
  palette: {{
    '.': null,
    {pal_lines},
  }},
  run: {js_frames(data['run'])},
  idle: {js_frames(data['idle'])},
}};
"""

os.makedirs("src/sprites", exist_ok=True)
with open("src/sprites/wukong.js", "w") as fh:
    fh.write(js)
print("wrote src/sprites/wukong.js (%d bytes)" % len(js))
