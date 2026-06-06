import { PICKUPS, GAME } from '../config.js';

export class Pickup {
  constructor(typeKey, y, x = GAME.width + 40) {
    this.type = typeKey;
    this.def = PICKUPS[typeKey];
    this.r = this.def.r;
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.t = Math.random() * 10;
    this.dead = false;
    this.collected = false;
  }

  update(dt, scroll) {
    this.t += dt;
    this.x -= scroll * dt;
    this.y = this.baseY + Math.sin(this.t * 3) * 6; // 上下漂浮
    if (scroll > 0 && this.x + this.r < -40) this.dead = true;
  }

  center() {
    return { x: this.x, y: this.y };
  }

  draw(r) {
    const ctx = r.ctx;
    const x = this.x;
    const y = this.y;
    const t = this.t;
    const pulse = 0.85 + Math.sin(t * 4) * 0.15;

    // 通用底光
    ctx.save();
    ctx.globalAlpha = 0.25 * pulse;
    ctx.fillStyle = this.def.color;
    ctx.beginPath();
    ctx.arc(x, y, this.r + 10 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    switch (this.type) {
      case 'buddhalight':
        this.#drawBuddha(ctx, x, y, t, pulse);
        break;
      case 'scripturePage':
        this.#drawPage(ctx, x, y);
        break;
      case 'peach':
        this.#drawPeach(ctx, x, y);
        break;
      case 'cloud':
        this.#drawCloud(ctx, x, y, t);
        break;
      case 'amulet':
        this.#drawAmulet(ctx, x, y);
        break;
    }
  }

  #drawBuddha(ctx, x, y, t, pulse) {
    // 放射光线
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.6);
    ctx.strokeStyle = 'rgba(255,228,140,0.9)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.lineTo(Math.cos(a) * (16 + pulse * 4), Math.sin(a) * (16 + pulse * 4));
      ctx.stroke();
    }
    ctx.restore();
    // 金色佛珠核心
    ctx.fillStyle = '#fff2b0';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffce54';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  #drawPage(ctx, x, y) {
    ctx.fillStyle = '#e9dca8';
    ctx.fillRect(x - 12, y - 15, 24, 30);
    ctx.fillStyle = '#cdbd84';
    ctx.fillRect(x - 12, y - 15, 24, 3);
    ctx.fillRect(x - 12, y + 12, 24, 3);
    // 经文竖线
    ctx.fillStyle = '#7a5a3a';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x - 8 + i * 6, y - 9, 2, 18);
    }
  }

  #drawPeach(ctx, x, y) {
    // 桃身
    ctx.fillStyle = '#ff9fc4';
    ctx.beginPath();
    ctx.arc(x - 6, y + 2, 9, 0, Math.PI * 2);
    ctx.arc(x + 6, y + 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 14, y);
    ctx.quadraticCurveTo(x, y + 20, x + 14, y);
    ctx.fill();
    // 高光
    ctx.fillStyle = '#ffd0e2';
    ctx.fillRect(x - 7, y - 4, 4, 6);
    // 叶子
    ctx.fillStyle = '#6fc05a';
    ctx.beginPath();
    ctx.ellipse(x + 6, y - 12, 8, 4, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  #drawCloud(ctx, x, y, t) {
    const dx = Math.sin(t * 3) * 2;
    ctx.fillStyle = '#eaf4ff';
    ctx.beginPath();
    ctx.arc(x - 9 + dx, y + 2, 8, 0, Math.PI * 2);
    ctx.arc(x + 9 + dx, y + 2, 9, 0, Math.PI * 2);
    ctx.arc(x + dx, y - 4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bcd6f5';
    ctx.fillRect(x - 14 + dx, y + 6, 28, 4);
    // 卷边
    ctx.strokeStyle = '#9fc0e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 9 + dx, y + 8, 3, 0, Math.PI);
    ctx.arc(x + 3 + dx, y + 8, 3, 0, Math.PI);
    ctx.stroke();
  }

  #drawAmulet(ctx, x, y) {
    // 朱红符纸
    ctx.fillStyle = '#e23b2e';
    ctx.fillRect(x - 9, y - 16, 18, 32);
    ctx.fillStyle = '#ff6b5e';
    ctx.fillRect(x - 9, y - 16, 18, 4);
    // 金色符文
    ctx.strokeStyle = '#ffce54';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y + 12);
    ctx.moveTo(x - 5, y - 6);
    ctx.lineTo(x + 5, y - 6);
    ctx.moveTo(x - 5, y + 2);
    ctx.lineTo(x + 5, y + 2);
    ctx.stroke();
  }
}
