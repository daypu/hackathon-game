"""Explore: pixelate 孙悟空.png into a moonlit pixel sprite at several sizes.
Outputs upscaled previews into tmp_art/preview/ so we can eyeball quality.
"""
import os
from collections import deque
import numpy as np
from PIL import Image

SRC = "arts/孙悟空.png"
OUT = "tmp_art/preview"
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
arr = np.array(img)
H, W = arr.shape[:2]
print("loaded", img.size, "bands", img.getbands())

# --- detect background from the 4 corners ---
corners = np.concatenate([
    arr[:8, :8, :3].reshape(-1, 3),
    arr[:8, -8:, :3].reshape(-1, 3),
    arr[-8:, :8, :3].reshape(-1, 3),
    arr[-8:, -8:, :3].reshape(-1, 3),
])
bg = np.median(corners, axis=0)
print("bg color (corners median):", bg)

# --- flood fill from borders to remove only the connected background ---
rgb = arr[:, :, :3].astype(np.int32)
dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
TOL = 48.0
bgmask = dist < TOL  # candidate background pixels

visited = np.zeros((H, W), dtype=bool)
q = deque()
for x in range(W):
    for y in (0, H - 1):
        if bgmask[y, x] and not visited[y, x]:
            visited[y, x] = True; q.append((y, x))
for y in range(H):
    for x in (0, W - 1):
        if bgmask[y, x] and not visited[y, x]:
            visited[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
        ny, nx = y+dy, x+dx
        if 0<=ny<H and 0<=nx<W and not visited[ny,nx] and bgmask[ny,nx]:
            visited[ny,nx] = True; q.append((ny,nx))

alpha = np.where(visited, 0, 255).astype(np.uint8)
arr[:, :, 3] = alpha

# --- crop to content bbox ---
ys, xs = np.where(alpha > 0)
y0, y1, x0, x1 = ys.min(), ys.max()+1, xs.min(), xs.max()+1
content = Image.fromarray(arr[y0:y1, x0:x1])
print("content bbox", content.size)


def moonlit(rgba):
    """Apply a moonlit night grade: cool shadows, preserved warmth & gold glow,
    keeping the character readable (not murky)."""
    a = np.array(rgba).astype(np.float32)
    rgbf = a[:, :, :3] / 255.0
    al = a[:, :, 3:4] / 255.0
    r, g, b = rgbf[:,:,0], rgbf[:,:,1], rgbf[:,:,2]
    L = (0.299*r + 0.587*g + 0.114*b)[:,:,None]
    gold = ((r > 0.6) & (g > 0.42) & (b < 0.55))[:,:,None].astype(np.float32)

    # gentle desaturation (keep identity)
    out = rgbf*(1-0.16) + L*0.16
    # cooling concentrated in the shadows only; highlights stay warm
    coolness = (1.0 - L)**1.4 * 0.55
    moon = np.array([0.80, 0.92, 1.18])
    out = out*(1-coolness) + (out*moon)*coolness
    # flat night ambient + slight overall dim
    out = out*0.92 + np.array([0.0, 0.008, 0.03])
    # preserve / boost gold accents (crown, staff) so they glow under moonlight
    warm = np.clip(rgbf*np.array([1.12, 0.98, 0.52]) + np.array([0.04,0.02,0.0]), 0, 1)
    out = out*(1-gold*0.7) + warm*(gold*0.7)
    # cool cyan rim on the brightest pixels
    hi = np.clip((L-0.7)/0.3, 0, 1)
    out = out + hi*np.array([0.03, 0.09, 0.13])
    out = np.clip(out, 0, 1)
    res = np.concatenate([out*255, al*255], axis=2)
    return Image.fromarray(res.astype(np.uint8))


def pixelate(src, target_h):
    w, h = src.size
    tw = max(1, round(w * target_h / h))
    small = src.resize((tw, target_h), Image.LANCZOS)
    # harden alpha
    sa = np.array(small)
    sa[:, :, 3] = np.where(sa[:, :, 3] > 110, 255, 0)
    return Image.fromarray(sa)


def upscale(im, factor):
    return im.resize((im.width*factor, im.height*factor), Image.NEAREST)


def checker(im, factor):
    """composite onto a checkerboard so transparency is visible."""
    big = upscale(im, factor)
    bgc = Image.new("RGBA", big.size, (0,0,0,0))
    cs = factor
    px = bgc.load()
    for yy in range(big.height):
        for xx in range(big.width):
            c = 90 if ((xx//cs)+(yy//cs)) % 2 else 60
            px[xx, yy] = (c, c, c, 255)
    bgc.alpha_composite(big)
    return bgc

# contact sheet across sizes x variants
sizes = [16, 20, 24, 28]
rows = []
for th in sizes:
    base = pixelate(content, th)
    moon = pixelate(moonlit(content), th)
    factor = max(1, 360 // th)
    checker(base, factor).save(f"{OUT}/faithful_{th}.png")
    checker(moon, factor).save(f"{OUT}/moonlit_{th}.png")
    print(f"h={th}: sprite {base.size}, preview x{factor}")

# big side-by-side for the two most likely sizes
for th in (20, 24):
    base = upscale(pixelate(content, th), 16)
    moon = upscale(pixelate(moonlit(content), th), 16)
    combo = Image.new("RGBA", (base.width+moon.width+30, max(base.height, moon.height)+30), (40,40,50,255))
    combo.alpha_composite(base, (10, 15))
    combo.alpha_composite(moon, (base.width+20, 15))
    combo.convert("RGB").save(f"{OUT}/compare_{th}.png")

# night-context: moonlit sprite on an indigo night ground, to judge readability
def night_scene(th, factor=14):
    moon = upscale(pixelate(moonlit(content), th), factor)
    W2, H2 = moon.width + 160, moon.height + 120
    bg = Image.new("RGB", (W2, H2))
    px = bg.load()
    for yy in range(H2):
        t = yy / H2
        # indigo night gradient
        c = (int(18 + 14*t), int(20 + 16*t), int(42 + 26*t))
        for xx in range(W2):
            px[xx, yy] = c
    # soft moon glow top-right
    mglow = Image.new("RGBA", (W2, H2), (0,0,0,0))
    mp = mglow.load()
    mx, my = int(W2*0.80), int(H2*0.22)
    for yy in range(H2):
        for xx in range(W2):
            d = ((xx-mx)**2 + (yy-my)**2) ** 0.5
            a = max(0, 1 - d/(W2*0.5))
            if a > 0:
                mp[xx, yy] = (200, 215, 255, int(60*a*a))
    bg = bg.convert("RGBA"); bg.alpha_composite(mglow)
    bg.alpha_composite(moon, ((W2-moon.width)//2, (H2-moon.height)//2 + 10))
    bg.convert("RGB").save(f"{OUT}/night_{th}.png")

night_scene(24)
night_scene(20)


print("done")
