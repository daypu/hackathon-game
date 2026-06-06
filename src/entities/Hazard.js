import { HAZARDS, GAME } from '../config.js';
import { rand } from '../engine/utils.js';

export class Hazard {
  constructor(typeKey, y, x = GAME.width + 50, opts = {}) {
    this.type = typeKey;
    this.def = HAZARDS[typeKey];
    this.w = this.def.w;
    this.h = this.def.h;
    this.x = x;
    this.y = y;
    this.t = Math.random() * 10;
    this.used = false;
    this.dead = false;

    if (typeKey === 'rock' && !opts.static) {
      this.targetY = y;
      this.y = GAME.roadTop - 120 - rand(0, 80);
      this.vy = rand(180, 240);
      this.spin = rand(-3, 3);
      this.angle = 0;
    }
  }

  update(dt, scroll) {
    this.t += dt;
    this.x -= scroll * this.def.speedMul * dt;
    if (this.type === 'rock' && Number.isFinite(this.vy)) {
      this.vy += 320 * dt;
      this.y += this.vy * dt;
      this.angle += this.spin * dt;
      if (this.y > this.targetY) {
        this.y = this.targetY;
        this.vy = 0;
      }
    }
    if (scroll > 0 && this.x + this.w < -60) this.dead = true;
  }

  getHitbox() {
    // 判定盒比可视略小，手感更宽容
    const pad = 8;
    return {
      x: this.x - this.w / 2 + pad,
      y: this.y - this.h / 2 + pad,
      w: this.w - pad * 2,
      h: this.h - pad * 2,
    };
  }

  draw(r) {
    const ctx = r.ctx;
    const x = this.x;
    const y = this.y;
    const t = this.t;
    switch (this.type) {
      case 'yaofeng':
        this.#drawWind(ctx, x, y, t);
        break;
      case 'rock':
        this.#drawRock(ctx, x, y);
        break;
      case 'flame':
        this.#drawFlame(ctx, x, y, t);
        break;
      case 'web':
        this.#drawWeb(ctx, x, y, t);
        break;
      case 'trap':
        this.#drawTrap(ctx, x, y, t);
        break;
    }
  }

  #drawWind(ctx, x, y, t) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < 4; i++) {
      const oy = (i - 1.5) * 11 + Math.sin(t * 6 + i) * 3;
      ctx.strokeStyle = i % 2 ? '#c98ce0' : '#9a55c8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const baseX = x - 28 + Math.sin(t * 5 + i) * 4;
      ctx.moveTo(baseX, y + oy);
      for (let s = 0; s <= 6; s++) {
        const px = baseX + s * 10;
        const py = y + oy + Math.sin(t * 8 + s * 0.9 + i) * 5;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // 风眼小妖虚影
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#5a2a72';
    ctx.fillRect(x - 6, y - 6, 12, 12);
    ctx.restore();
  }

  #drawRock(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.angle || 0);
    const P = 6;
    const pts = [
      [-3, -4], [0, -4], [3, -3], [4, 0], [3, 3], [0, 4], [-3, 3], [-4, 0],
    ];
    ctx.fillStyle = '#6f6757';
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * P, pts[0][1] * P);
    pts.forEach((p) => ctx.lineTo(p[0] * P, p[1] * P));
    ctx.closePath();
    ctx.fill();
    // 高光与裂纹
    ctx.fillStyle = '#8a8170';
    ctx.fillRect(-3 * P, -3 * P, 2 * P, 2 * P);
    ctx.fillStyle = '#4a4338';
    ctx.fillRect(0, -1 * P, P, 3 * P);
    ctx.fillRect(-1 * P, 1 * P, 2 * P, P);
    ctx.restore();
  }

  #drawFlame(ctx, x, y, t) {
    const flick = Math.sin(t * 18) * 3;
    const base = y + this.h / 2;
    // 外焰
    ctx.fillStyle = '#e0533d';
    this.#flameShape(ctx, x, base, 26, 56 + flick);
    // 中焰
    ctx.fillStyle = '#ff8a3d';
    this.#flameShape(ctx, x, base, 18, 42 + flick);
    // 内焰
    ctx.fillStyle = '#ffd24a';
    this.#flameShape(ctx, x, base, 9, 26 + flick * 0.6);
    // 余烬
    ctx.fillStyle = 'rgba(255,180,80,0.7)';
    for (let i = 0; i < 3; i++) {
      const ex = x + Math.sin(t * 5 + i * 2) * 14;
      const ey = base - 40 - ((t * 30 + i * 20) % 30);
      ctx.fillRect(ex, ey, 4, 4);
    }
  }

  #flameShape(ctx, cx, baseY, halfW, height) {
    ctx.beginPath();
    ctx.moveTo(cx - halfW, baseY);
    ctx.quadraticCurveTo(cx - halfW, baseY - height * 0.6, cx, baseY - height);
    ctx.quadraticCurveTo(cx + halfW, baseY - height * 0.6, cx + halfW, baseY);
    ctx.closePath();
    ctx.fill();
  }

  #drawWeb(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(225,222,205,0.75)';
    ctx.lineWidth = 2;
    const R = 34;
    const spokes = 8;
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
      ctx.stroke();
    }
    for (let ring = 1; ring <= 3; ring++) {
      const rr = (R / 3) * ring;
      ctx.beginPath();
      for (let i = 0; i <= spokes; i++) {
        const a = (i / spokes) * Math.PI * 2;
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // 蜘蛛
    const sx = Math.sin(t * 2) * 10;
    ctx.fillStyle = '#3a2030';
    ctx.fillRect(sx - 5, -5, 10, 10);
    ctx.restore();
  }

  #drawTrap(ctx, x, y, t) {
    const base = y + this.h / 2;
    // 底座
    ctx.fillStyle = '#3a2a26';
    ctx.fillRect(x - 24, base - 8, 48, 10);
    // 尖刺（开合）
    const open = 0.6 + Math.sin(t * 4) * 0.4;
    ctx.fillStyle = '#c0553d';
    for (let i = -2; i <= 2; i++) {
      const sx = x + i * 9;
      const h = 18 * open;
      ctx.beginPath();
      ctx.moveTo(sx - 4, base - 6);
      ctx.lineTo(sx, base - 6 - h);
      ctx.lineTo(sx + 4, base - 6);
      ctx.closePath();
      ctx.fill();
    }
    // 暗红微光
    ctx.fillStyle = 'rgba(255,80,60,0.5)';
    ctx.fillRect(x - 20, base - 2, 40, 3);
  }
}
