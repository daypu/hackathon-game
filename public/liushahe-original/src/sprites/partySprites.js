import { TANGSENG } from './tangseng.js';
import { SHASENG } from './shaseng.js';

export { TANGSENG, SHASENG };

const RUN_FPS = 11;
const IDLE_FPS = 2.4;

export function characterFrame(character, moving, clock) {
  const frames = moving ? character.run : character.idle;
  const fps = moving ? RUN_FPS : IDLE_FPS;
  const idx = Math.floor(Math.max(0, clock) * fps) % frames.length;
  return { data: frames[idx], palette: character.palette, character };
}

export function drawCharacter(r, sp, cx, footY, scale = 2, opts = {}) {
  const { alpha = 1, flip = false, outline = '#0c0a12' } = opts;
  const character = sp.character;
  const w = character.w * scale;
  const x0 = Math.round(cx - w / 2);
  const y0 = Math.round(footY - character.feetRow * scale);
  if (outline) {
    const o = scale;
    for (const [ox, oy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) {
      r.sprite(sp, x0 + ox, y0 + oy, scale, { alpha, flipX: flip, colorOverride: outline });
    }
  }
  r.sprite(sp, x0, y0, scale, { alpha, flipX: flip });
}
