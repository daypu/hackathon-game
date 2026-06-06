"""Build moonlit pixel run + idle frames for the Journey party.

This reuses the original Wukong pipeline shape, but makes the source character
configurable so Tang Seng, Sha Seng, and Zhu Bajie can share the same engine
sprite format.
"""
import math
import os

import artlib
import numpy as np
from PIL import Image


OUT = "tmp_art/preview/party"
os.makedirs(OUT, exist_ok=True)

BASE_H = 22
FEET_CROP = 2
NCOLORS = 42
N_RUN = 6
LEG_H = 5
LEAN = 1

CHARACTERS = [
    {
        "src": "arts/孙悟空.png",
        "out": "src/sprites/wukong.js",
        "const": "WUKONG",
        "label": "孙悟空",
    },
    {
        "src": "arts/唐僧.png",
        "out": "src/sprites/tangseng.js",
        "const": "TANGSENG",
        "label": "唐僧",
    },
    {
        "src": "arts/沙僧.png",
        "out": "src/sprites/shaseng.js",
        "const": "SHASENG",
        "label": "沙僧",
    },
    {
        "src": "arts/猪八戒.png",
        "out": "src/sprites/bajie.js",
        "const": "BAJIE",
        "label": "猪八戒",
    },
]

SAFE = (
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    "!#$%&()*+,-/:;<=>?@[]^_{|}~"
)


def put(cv, x, y, rgb):
    if 0 <= y < cv.shape[0] and 0 <= x < cv.shape[1]:
        cv[y, x] = (rgb[0], rgb[1], rgb[2], 255)


def build_character(cfg):
    content = artlib.load_content(cfg["src"])
    base = artlib.pixelate_base(content, BASE_H, NCOLORS)
    body = base[:BASE_H - FEET_CROP]
    bh, bw = body.shape[:2]

    op = body[body[:, :, 3] > 0][:, :3].astype(np.int32)
    goldness = (op[:, 0] + op[:, 1]) - 2 * op[:, 2]
    trim = tuple(int(v) for v in op[np.argmax(goldness)])
    lower_center = body[bh - 6 : bh - 1, bw // 2 - 3 : bw // 2 + 3]
    lower_opaque = lower_center[lower_center[:, :, 3] > 0][:, :3]
    thigh = tuple(int(v) for v in np.median(lower_opaque, axis=0)) if len(lower_opaque) else (150, 52, 58)
    boot = (40, 32, 48)
    toe = (60, 50, 66)
    dust1 = (214, 222, 236)
    dust2 = (150, 168, 200)

    cw = bw + 6
    ch = bh + LEG_H + 4
    ground_y = ch - 1
    leg_top = ch - LEG_H
    body_top0 = (leg_top + 1) - bh
    body_cx = cw // 2

    def leg(cv, ox, oy, toe_dir):
        for yy in range(3):
            put(cv, ox, oy + yy, thigh)
            put(cv, ox + 1, oy + yy, thigh)
        put(cv, ox, oy + 2, trim)
        for yy in (3, 4):
            put(cv, ox, oy + yy, boot)
            put(cv, ox + 1, oy + yy, boot)
        put(cv, ox + (1 if toe_dir > 0 else 0) + toe_dir, oy + 4, toe)

    def paste_body(cv, bob, sway):
        bx = 3 + sway
        for ry in range(bh):
            shear = round((bh - 1 - ry) / max(1, bh - 1) * LEAN)
            cy = body_top0 + bob + ry
            for rx in range(bw):
                px = body[ry, rx]
                if px[3] > 0:
                    put(cv, bx + rx + shear, cy, px[:3])

    def dust(cv, cx, frame_i, intensity):
        if intensity < 0.5:
            return
        put(cv, cx, ground_y, dust1)
        put(cv, cx - 1, ground_y, dust2)
        put(cv, cx + 1, ground_y - 1, dust2)
        if frame_i % 2 == 0:
            put(cv, cx - 2, ground_y - 1, dust1)

    def run_frame(i):
        f = i / N_RUN
        lift_l = max(0.0, math.sin(2 * math.pi * f))
        lift_r = max(0.0, math.sin(2 * math.pi * (f + 0.5)))
        dy_l, dx_l = -round(lift_l * 3), round(lift_l * 1)
        dy_r, dx_r = -round(lift_r * 3), -round(lift_r * 1)
        bob = -round(2 * abs(math.sin(2 * math.pi * f)))
        sway = round(math.sin(2 * math.pi * f))
        cv = np.zeros((ch, cw, 4), np.uint8)
        lx, rx = body_cx - 3 + dx_l, body_cx + 1 + dx_r
        dust(cv, lx, i, 1.0 - lift_l)
        dust(cv, rx + 1, i, 1.0 - lift_r)
        leg(cv, lx, leg_top + dy_l, -1)
        leg(cv, rx, leg_top + dy_r, +1)
        paste_body(cv, bob, sway)
        return cv

    def idle_frame(i):
        cv = np.zeros((ch, cw, 4), np.uint8)
        leg(cv, body_cx - 3, leg_top, -1)
        leg(cv, body_cx + 1, leg_top, +1)
        paste_body(cv, [0, -1][i], 0)
        return cv

    frames = {"run": [run_frame(i) for i in range(N_RUN)], "idle": [idle_frame(i) for i in range(2)]}

    all_frames = frames["run"] + frames["idle"]
    mask = np.zeros((ch, cw), bool)
    for cv in all_frames:
        mask |= cv[:, :, 3] > 0
    ys, xs = np.where(mask)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    for key in frames:
        frames[key] = [cv[y0:y1, x0:x1] for cv in frames[key]]
    w, h = x1 - x0, y1 - y0
    feet_row = ground_y - y0

    colors = {}

    def keyfor(rgb):
        hx = "#%02x%02x%02x" % (int(rgb[0]), int(rgb[1]), int(rgb[2]))
        if hx not in colors:
            colors[hx] = SAFE[len(colors)]
        return colors[hx]

    def rows_of(cv):
        return [
            "".join("." if cv[y, x, 3] == 0 else keyfor(cv[y, x, :3]) for x in range(w))
            for y in range(h)
        ]

    data = {key: [rows_of(cv) for cv in frames[key]] for key in ("run", "idle")}

    def js_rows(rows):
        return "[\n      " + ",\n      ".join("'%s'" % row for row in rows) + ",\n    ]"

    def js_frames(seq):
        return "[\n    " + ",\n    ".join(js_rows(rows) for rows in seq) + ",\n  ]"

    pal_lines = ",\n    ".join("'%s': '%s'" % (ch, hx) for hx, ch in colors.items())
    js = f"""// AUTO-GENERATED from {cfg['src']} by tmp_art/build_party.py - do not edit by hand.
// 月色（moonlit）像素{cfg['label']}：front-view run + idle 帧。'.' = 透明。
// feetRow = 角色脚底所在行（用于让脚踩在地面 y 上）。

export const {cfg['const']} = {{
  w: {w},
  h: {h},
  feetRow: {feet_row},
  palette: {{
    '.': null,
    {pal_lines},
  }},
  run: {js_frames(data['run'])},
  idle: {js_frames(data['idle'])},
}};
"""

    os.makedirs(os.path.dirname(cfg["out"]), exist_ok=True)
    with open(cfg["out"], "w", encoding="utf-8") as fh:
        fh.write(js)

    # Preview contact sheet for quick visual inspection.
    factor = 14
    pad = 6
    sheet = Image.new("RGB", ((w * factor + pad) * len(frames["run"]) + pad, h * factor + 2 * pad), (26, 28, 44))
    for i, cv in enumerate(frames["run"]):
        big = artlib.upscale(cv, factor)
        sheet.paste(big, ((w * factor + pad) * i + pad, pad), big)
    sheet.save(f"{OUT}/{cfg['const'].lower()}_run_sheet.png")

    print(
        f"{cfg['label']}: sprite {w}x{h}, feet_row={feet_row}, "
        f"colors={len(colors)}, wrote {cfg['out']}"
    )


def main():
    for cfg in CHARACTERS:
        build_character(cfg)


if __name__ == "__main__":
    main()
