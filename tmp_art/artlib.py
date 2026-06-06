"""Reusable art ops: load + key + moonlit grade + pixelate/quantize."""
from collections import deque
import numpy as np
from PIL import Image


def load_content(src):
    """Load an image, flood-fill the connected white background to transparent,
    and crop to the character's bounding box. Returns RGBA PIL image."""
    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    H, W = arr.shape[:2]
    corners = np.concatenate([
        arr[:8, :8, :3].reshape(-1, 3), arr[:8, -8:, :3].reshape(-1, 3),
        arr[-8:, :8, :3].reshape(-1, 3), arr[-8:, -8:, :3].reshape(-1, 3),
    ])
    bg = np.median(corners, axis=0)
    rgb = arr[:, :, :3].astype(np.int32)
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    bgmask = dist < 48.0
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
            if 0 <= ny < H and 0 <= nx < W and not visited[ny,nx] and bgmask[ny,nx]:
                visited[ny,nx] = True; q.append((ny,nx))
    arr[:, :, 3] = np.where(visited, 0, 255).astype(np.uint8)
    ys, xs = np.where(arr[:, :, 3] > 0)
    return Image.fromarray(arr[ys.min():ys.max()+1, xs.min():xs.max()+1])


def moonlit(rgba):
    """Moonlit night grade: cool shadows, preserved warmth & gold glow, readable."""
    a = np.array(rgba).astype(np.float32)
    rgbf = a[:, :, :3] / 255.0
    al = a[:, :, 3:4] / 255.0
    r, g, b = rgbf[:,:,0], rgbf[:,:,1], rgbf[:,:,2]
    L = (0.299*r + 0.587*g + 0.114*b)[:,:,None]
    gold = ((r > 0.6) & (g > 0.42) & (b < 0.55))[:,:,None].astype(np.float32)
    out = rgbf*(1-0.16) + L*0.16
    coolness = (1.0 - L)**1.4 * 0.55
    moon = np.array([0.80, 0.92, 1.18])
    out = out*(1-coolness) + (out*moon)*coolness
    out = out*0.92 + np.array([0.0, 0.008, 0.03])
    warm = np.clip(rgbf*np.array([1.12, 0.98, 0.52]) + np.array([0.04,0.02,0.0]), 0, 1)
    out = out*(1-gold*0.7) + warm*(gold*0.7)
    hi = np.clip((L-0.7)/0.3, 0, 1)
    out = out + hi*np.array([0.03, 0.09, 0.13])
    out = np.clip(out, 0, 1)
    return Image.fromarray(np.concatenate([out*255, al*255], axis=2).astype(np.uint8))


def quantize_rgba(img, ncolors):
    """Quantize RGB to ncolors (median cut) while preserving a hard alpha mask."""
    a = np.array(img)
    alpha = a[:, :, 3]
    rgb = Image.fromarray(a[:, :, :3]).convert("RGB")
    q = rgb.quantize(colors=ncolors, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    out = np.dstack([np.array(q), alpha]).astype(np.uint8)
    out[alpha == 0] = (0, 0, 0, 0)
    return out  # numpy RGBA


def pixelate_base(content, h, ncolors=40):
    """Moonlit + downscale to height h + hard alpha + quantize -> numpy RGBA."""
    w, hh = content.size
    tw = max(1, round(w * h / hh))
    small = moonlit(content).resize((tw, h), Image.LANCZOS)
    sa = np.array(small)
    sa[:, :, 3] = np.where(sa[:, :, 3] > 110, 255, 0)
    return quantize_rgba(Image.fromarray(sa), ncolors)


def upscale(np_rgba, factor):
    im = Image.fromarray(np_rgba) if isinstance(np_rgba, np.ndarray) else np_rgba
    return im.resize((im.width*factor, im.height*factor), Image.NEAREST)
