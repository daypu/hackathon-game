import { GAME, PAL } from './config.js';

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerpColor(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

export class World {
  constructor() {
    this.scroll = 0;
    this.farScroll = 0;
  }

  reset() {
    this.scroll = 0;
    this.farScroll = 0;
  }

  update(dt, scrollSpeed) {
    this.scroll += scrollSpeed * dt;
    this.farScroll += scrollSpeed * 0.22 * dt;
  }

  draw(r, miasma, t, distPct) {
    this.#sky(r, miasma);
    this.#mountains(r, miasma);
    this.#fog(r, miasma, t);
    this.#goal(r, distPct, t);
    this.#road(r, miasma);
  }

  #sky(r, miasma) {
    const top = lerpColor(PAL.skyTop, '#3a0f22', miasma);
    const bot = lerpColor(PAL.skyBottom, '#5a1a2e', miasma);
    r.vgrad(0, 0, GAME.width, GAME.roadTop + 30, top, bot);
    // 妖月
    r.circle(GAME.width - 130, 70, 34, lerpColor('#cdbfe8', '#ff8a6a', miasma));
    r.ctx.globalAlpha = 0.25;
    r.circle(GAME.width - 130, 70, 50, lerpColor('#cdbfe8', '#ff8a6a', miasma));
    r.ctx.globalAlpha = 1;
  }

  #mountains(r, miasma) {
    const ctx = r.ctx;
    const horizon = GAME.roadTop + 6;
    // 远层
    this.#range(ctx, this.farScroll * 0.5, horizon, 70, 220,
      lerpColor('#2a2140', '#3a1430', miasma));
    // 近层
    this.#range(ctx, this.farScroll, horizon, 48, 160,
      lerpColor('#352a52', '#4a1a38', miasma));
  }

  #range(ctx, scroll, baseY, amp, wave, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    const off = scroll % wave;
    for (let x = -off; x <= GAME.width + wave; x += 8) {
      const y = baseY - amp * (0.5 + 0.5 * Math.sin((x + scroll) / wave * Math.PI * 2));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(GAME.width, baseY);
    ctx.closePath();
    ctx.fill();
  }

  #fog(r, miasma, t) {
    const ctx = r.ctx;
    const n = 5;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = ((i * 240 - this.scroll * 0.4) % (GAME.width + 240) + GAME.width + 240) %
        (GAME.width + 240) - 120;
      const y = 40 + (i % 3) * 34 + Math.sin(t * 0.8 + i) * 8;
      ctx.globalAlpha = (0.05 + miasma * 0.18) * (0.7 + 0.3 * Math.sin(t + i));
      ctx.fillStyle = i % 2 ? '#7a4a9a' : '#5a3a7a';
      ctx.beginPath();
      ctx.ellipse(x, y, 90, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  #goal(r, distPct, t) {
    if (distPct < 0.8) return;
    const p = (distPct - 0.8) / 0.2; // 0..1 靠近灵山
    const ctx = r.ctx;
    const cx = GAME.width - 120 + (1 - p) * 200;
    const baseY = GAME.roadTop + 4;
    const scale = 0.6 + p * 0.9;
    // 金光
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 3);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(cx, baseY - 60 * scale, 70 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 宝塔
    ctx.fillStyle = '#d9a441';
    const w0 = 60 * scale;
    for (let lvl = 0; lvl < 4; lvl++) {
      const w = (w0 - lvl * 12 * scale);
      const h = 18 * scale;
      const y = baseY - h * (lvl + 1) - 6 * scale * lvl;
      ctx.fillRect(cx - w / 2, y, w, h);
      ctx.fillStyle = lvl % 2 ? '#b9842f' : '#e7b85a';
      // 檐
      ctx.fillRect(cx - w / 2 - 4 * scale, y, w + 8 * scale, 4 * scale);
    }
    ctx.fillStyle = '#ffce54';
    ctx.fillRect(cx - 4 * scale, baseY - 90 * scale, 8 * scale, 16 * scale);
  }

  #road(r, miasma) {
    const ctx = r.ctx;
    const top = GAME.roadTop;
    const bot = GAME.roadBottom;
    const h = bot - top;
    // 路面
    r.vgrad(0, top, GAME.width, h + (GAME.height - bot),
      lerpColor(PAL.roadDark, '#3a2438', miasma),
      lerpColor(PAL.road, '#4a3322', miasma));
    // 上下边缘
    r.rect(0, top, GAME.width, 4, lerpColor('#7a6347', '#8a5040', miasma));
    r.rect(0, bot - 2, GAME.width, 4, PAL.roadDark);

    // 滚动石板缝（竖线，营造前进速度感）
    const tile = 80;
    const off = this.scroll % tile;
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    for (let x = -off; x < GAME.width; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, top + 6);
      ctx.lineTo(x - 12, bot);
      ctx.stroke();
    }
    // 水平车道暗纹
    ctx.strokeStyle = 'rgba(255,240,200,0.05)';
    for (let i = 1; i < 4; i++) {
      const y = top + (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME.width, y);
      ctx.stroke();
    }
  }
}
