import { clamp } from '../engine/utils.js';

export class ParticleSystem {
  constructor() {
    this.parts = [];
    this.texts = [];
  }

  reset() {
    this.parts.length = 0;
    this.texts.length = 0;
  }

  add(x, y, opts = {}) {
    this.parts.push({
      x,
      y,
      vx: opts.vx ?? 0,
      vy: opts.vy ?? 0,
      g: opts.g ?? 0,
      life: opts.life ?? 0.6,
      max: opts.life ?? 0.6,
      size: opts.size ?? 4,
      color: opts.color ?? '#fff',
      shrink: opts.shrink ?? true,
    });
  }

  burst(x, y, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (opts.speed ?? 80) * (0.4 + Math.random() * 0.6);
      this.add(x, y, {
        ...opts,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (opts.up ?? 0),
        life: (opts.life ?? 0.6) * (0.6 + Math.random() * 0.6),
        size: (opts.size ?? 4) * (0.6 + Math.random() * 0.8),
      });
    }
  }

  text(x, y, str, color = '#fff', opts = {}) {
    this.texts.push({
      x,
      y,
      str,
      color,
      life: opts.life ?? 1.0,
      max: opts.life ?? 1.0,
      vy: opts.vy ?? -42,
      size: opts.size ?? 18,
    });
  }

  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.life -= dt;
      if (p.life <= 0) this.parts.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const tx = this.texts[i];
      tx.y += tx.vy * dt;
      tx.vy *= 0.92;
      tx.life -= dt;
      if (tx.life <= 0) this.texts.splice(i, 1);
    }
  }

  draw(r) {
    const ctx = r.ctx;
    for (const p of this.parts) {
      const a = clamp(p.life / p.max, 0, 1);
      const s = p.shrink ? p.size * a : p.size;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    for (const tx of this.texts) {
      const a = clamp(tx.life / tx.max, 0, 1);
      r.text(tx.str, tx.x, tx.y, {
        size: tx.size,
        color: tx.color,
        align: 'center',
        weight: '800',
        shadow: 'rgba(0,0,0,0.6)',
        alpha: a,
      });
    }
  }
}
