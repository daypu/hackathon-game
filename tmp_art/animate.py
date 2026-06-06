"""Build a front-view run cycle for moonlit Wukong and render previews."""
import os, math
import numpy as np
from PIL import Image
import artlib

OUT = "tmp_art/preview"
os.makedirs(OUT, exist_ok=True)

# ---- tunables ----
BASE_H   = 22     # body raster height (before cropping feet)
FEET_CROP = 2     # rows trimmed off the bottom (original tiny feet)
NCOLORS  = 40
N        = 6      # frames in the run cycle
LEG_H    = 5
LEAN     = 1      # forward shear (px across body height)

content = artlib.load_content("arts/孙悟空.png")
base = artlib.pixelate_base(content, BASE_H, NCOLORS)     # numpy RGBA
body = base[:BASE_H - FEET_CROP]                          # drop original feet
bh, bw = body.shape[:2]

# sample palette colours from the body for the legs
op = body[body[:, :, 3] > 0][:, :3].astype(np.int32)
goldness = (op[:,0] + op[:,1]) - 2*op[:,2]
TRIM = tuple(int(v) for v in op[np.argmax(goldness)])      # gold
# thigh = median robe colour sampled from the lower-centre of the body (the robe)
lc = body[bh-6:bh-1, bw//2-3:bw//2+3]
lcop = lc[lc[:, :, 3] > 0][:, :3]
THIGH = tuple(int(v) for v in np.median(lcop, axis=0)) if len(lcop) else (150, 52, 58)
BOOT  = (40, 32, 48)                                       # dark cool boot
TOE   = (60, 50, 66)
DUST1 = (214, 222, 236)
DUST2 = (150, 168, 200)
print("THIGH", THIGH, "BOOT", BOOT, "TRIM", TRIM)

CW = bw + 6
CH = bh + LEG_H + 4
GROUND_Y = CH - 1
LEG_TOP = CH - LEG_H            # canvas y of leg origin when planted
BODY_TOP0 = (LEG_TOP + 1) - bh  # body bottom overlaps leg tops by 1
BODY_CX = CW // 2


def put(canvas, x, y, rgb, a=255):
    if 0 <= y < canvas.shape[0] and 0 <= x < canvas.shape[1] and a:
        canvas[y, x] = (rgb[0], rgb[1], rgb[2], a)


def leg(canvas, ox, oy, toe_dir):
    # width-2 leg: 3 rows thigh (robe), 2 rows boot + a toe, gold trim at knee
    for yy in range(3):
        put(canvas, ox, oy+yy, THIGH); put(canvas, ox+1, oy+yy, THIGH)
    put(canvas, ox, oy+2, TRIM)
    for yy in (3, 4):
        put(canvas, ox, oy+yy, BOOT); put(canvas, ox+1, oy+yy, BOOT)
    put(canvas, ox + (1 if toe_dir > 0 else 0) + toe_dir, oy+4, TOE)  # toe nub


def paste_body(canvas, frame_i, bob, sway):
    bx = 3 + sway
    for ry in range(bh):
        shear = round((bh - 1 - ry) / max(1, bh - 1) * LEAN)
        cy = BODY_TOP0 + bob + ry
        for rx in range(bw):
            px = body[ry, rx]
            if px[3] > 0:
                put(canvas, bx + rx + shear, cy, px[:3])


def dust(canvas, cx, frame_i, intensity):
    # a couple of light puffs kicked up near a planted foot
    if intensity < 0.5:
        return
    put(canvas, cx, GROUND_Y, DUST1)
    put(canvas, cx-1, GROUND_Y, DUST2)
    put(canvas, cx+1, GROUND_Y-1, DUST2)
    if frame_i % 2 == 0:
        put(canvas, cx-2, GROUND_Y-1, DUST1)


frames = []
for i in range(N):
    f = i / N
    liftL = max(0.0, math.sin(2*math.pi*f))
    liftR = max(0.0, math.sin(2*math.pi*(f+0.5)))
    dyL, dxL = -round(liftL*3), round(liftL*1)
    dyR, dxR = -round(liftR*3), -round(liftR*1)
    bob  = -round(2*abs(math.sin(2*math.pi*f)))
    sway = round(math.sin(2*math.pi*f))

    cv = np.zeros((CH, CW, 4), np.uint8)
    lx = BODY_CX - 3 + dxL
    rx = BODY_CX + 1 + dxR
    # dust behind the planted (low) foot
    dust(cv, lx, i, 1.0 - liftL)
    dust(cv, rx+1, i, 1.0 - liftR)
    leg(cv, lx, LEG_TOP + dyL, -1)
    leg(cv, rx, LEG_TOP + dyR, +1)
    paste_body(cv, i, bob, sway)
    frames.append(cv)

# ---- contact sheet (frames in a row) ----
F = 14
pad = 6
sheet = Image.new("RGB", ((CW*F + pad)*N + pad, CH*F + 2*pad), (26, 28, 44))
for i, cv in enumerate(frames):
    big = artlib.upscale(cv, F)
    sheet.paste(big, ((CW*F + pad)*i + pad, pad), big)
sheet.save(f"{OUT}/run_sheet.png")

# ---- looping GIF on a night ground ----
G = 10
gframes = []
for cv in frames:
    big = artlib.upscale(cv, G).convert("RGBA")
    ground = Image.new("RGBA", big.size, (22, 24, 46, 255))
    ground.alpha_composite(big)
    gframes.append(ground.convert("P", palette=Image.ADAPTIVE))
gframes[0].save(f"{OUT}/run.gif", save_all=True, append_images=gframes[1:],
                duration=95, loop=0, disposal=2)

# first frame still, larger, on night bg (so we can Read it)
big0 = artlib.upscale(frames[0], 18).convert("RGBA")
g0 = Image.new("RGBA", big0.size, (22, 24, 46, 255)); g0.alpha_composite(big0)
g0.convert("RGB").save(f"{OUT}/run_frame0.png")
print("canvas", CW, "x", CH, "| frames", N, "-> run_sheet.png, run.gif")
