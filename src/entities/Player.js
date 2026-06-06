import { GAME, STAT_MAX } from '../config.js';
import { SPR, PARTY_ORDER } from '../sprites.js';
import { clamp, approach } from '../engine/utils.js';

const SP = 6; // 队列成员之间的历史帧间隔
const PX = GAME.px;

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = GAME.playerX;
    this.y = (GAME.roadTop + GAME.roadBottom) / 2;
    this.vy = 0;
    this.baseSpeed = 300;
    this.stats = { mana: STAT_MAX, faith: STAT_MAX, scripture: STAT_MAX };
    this.shield = false;
    this.cloudTimer = 0;
    this.webTimer = 0;
    this.invuln = 0;
    this.flash = 0;
    this.shieldFx = 0;
    this.grace = 1.2; // 开场护佑：短暂无敌，避免一进场即受击
    this.history = [];
    for (let i = 0; i < PARTY_ORDER.length * SP + 4; i++) {
      this.history.push({ x: this.x, y: this.y });
    }
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    for (let i = 0; i < this.history.length; i++) {
      this.history[i] = { x, y };
    }
  }

  update(dt, input) {
    let speed = this.baseSpeed;
    if (this.webTimer > 0) speed *= 0.42; // 被蛛网粘住，行动迟缓
    if (this.cloudTimer > 0) speed *= 1.4; // 筋斗云加速

    this.vy = input.axisY() * speed;
    this.y = clamp(this.y + this.vy * dt, GAME.roadTop, GAME.roadBottom);

    const hx = input.axisX();
    if (hx !== 0) {
      this.x += hx * speed * 0.7 * dt;
    } else {
      // 无输入时缓缓回到基准水平位置
      this.x = approach(this.x, GAME.playerX, 70 * dt);
    }
    this.x = clamp(this.x, 120, 440);

    this.cloudTimer = Math.max(0, this.cloudTimer - dt);
    this.webTimer = Math.max(0, this.webTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.shieldFx = Math.max(0, this.shieldFx - dt);
    this.grace = Math.max(0, this.grace - dt);

    this.history.unshift({ x: this.x, y: this.y });
    const maxLen = PARTY_ORDER.length * SP + 4;
    if (this.history.length > maxLen) this.history.length = maxLen;
  }

  updateFree(dt, input, bounds) {
    let speed = this.baseSpeed;
    if (this.webTimer > 0) speed *= 0.42; // 被蛛网粘住，行动迟缓
    if (this.cloudTimer > 0) speed *= 1.4; // 筋斗云加速

    const ax = input.axisX();
    const ay = input.axisY();
    const len = Math.hypot(ax, ay) || 1;
    this.x = clamp(this.x + (ax / len) * speed * dt, bounds.x, bounds.x + bounds.w);
    this.y = clamp(this.y + (ay / len) * speed * dt, bounds.y, bounds.y + bounds.h);
    this.vy = (ay / len) * speed;

    this.cloudTimer = Math.max(0, this.cloudTimer - dt);
    this.webTimer = Math.max(0, this.webTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.shieldFx = Math.max(0, this.shieldFx - dt);
    this.grace = Math.max(0, this.grace - dt);

    this.history.unshift({ x: this.x, y: this.y });
    const maxLen = PARTY_ORDER.length * SP + 4;
    if (this.history.length > maxLen) this.history.length = maxLen;
  }

  pushback(px) {
    this.x = clamp(this.x - px, 120, 440);
  }

  push(dx, dy, bounds = null) {
    if (bounds) {
      this.x = clamp(this.x + dx, bounds.x, bounds.x + bounds.w);
      this.y = clamp(this.y + dy, bounds.y, bounds.y + bounds.h);
    } else {
      this.x += dx;
      this.y += dy;
    }
  }

  isInvincible() {
    return this.cloudTimer > 0 || this.invuln > 0 || this.grace > 0;
  }

  isDead() {
    return (
      this.stats.mana <= 0 ||
      this.stats.faith <= 0 ||
      this.stats.scripture <= 0
    );
  }

  deadStat() {
    if (this.stats.mana <= 0) return 'mana';
    if (this.stats.faith <= 0) return 'faith';
    if (this.stats.scripture <= 0) return 'scripture';
    return null;
  }

  // 返回 { blocked } 或 { applied, stat }
  damage(stat, amount) {
    if (this.grace > 0) return { blocked: 'grace' };
    if (this.cloudTimer > 0) return { blocked: 'cloud' };
    if (this.invuln > 0) return { blocked: 'invuln' };
    if (this.shield) {
      this.shield = false;
      this.shieldFx = 0.5;
      this.invuln = 0.6;
      return { blocked: 'shield' };
    }
    this.stats[stat] = clamp(this.stats[stat] - amount, 0, STAT_MAX);
    this.invuln = 0.9;
    this.flash = 0.9;
    return { applied: amount, stat };
  }

  heal(stat, amount) {
    this.stats[stat] = clamp(this.stats[stat] + amount, 0, STAT_MAX);
  }

  applyCloud(dur) {
    this.cloudTimer = Math.max(this.cloudTimer, dur);
  }
  applyShield() {
    this.shield = true;
    this.shieldFx = 0.5;
  }
  applyWeb(dur) {
    this.webTimer = Math.max(this.webTimer, dur);
  }

  getHitbox() {
    return { x: this.x - 15, y: this.y - 20, w: 30, h: 42 };
  }

  draw(r, t) {
    const ctx = r.ctx;
    // 受击时整队闪烁
    let alpha = 1;
    if (this.invuln > 0 && this.cloudTimer <= 0) {
      alpha = Math.sin(t * 40) > 0 ? 0.35 : 1;
    }

    // 从队尾向队首绘制（队首在最上层）
    for (let i = PARTY_ORDER.length - 1; i >= 0; i--) {
      const key = PARTY_ORDER[i];
      const idx = Math.min(i * SP, this.history.length - 1);
      const h = this.history[idx] || { x: this.x, y: this.y };
      // 横向排成取经队列，纵向用延迟轨迹形成蜿蜒跟随
      this.#drawMember(r, key, this.x - i * 40, h.y, t, i, alpha);
    }

    // 护盾光环
    if (this.shield || this.shieldFx > 0) {
      const pulse = 1 + Math.sin(t * 8) * 0.05;
      ctx.save();
      ctx.globalAlpha = this.shield ? 0.5 : this.shieldFx;
      ctx.strokeStyle = '#ff8a5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y - 2, 34 * pulse, 42 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffb38a';
      ctx.fill();
      ctx.restore();
    }
  }

  #drawMember(r, key, cx, cy, t, i, alpha) {
    const ctx = r.ctx;
    const sp = SPR[key];
    const w = r.spriteWidth(sp, PX);
    const hgt = r.spriteHeight(sp, PX);
    const bob = Math.sin(t * 7 + i * 1.3) * 2; // 行走起伏
    const lift = this.cloudTimer > 0 ? -7 : 0;

    // 地面阴影
    ctx.save();
    ctx.globalAlpha = 0.28 * alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 22, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 筋斗云
    if (this.cloudTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.9 * alpha;
      ctx.fillStyle = '#eaf4ff';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 20, 22, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cfe4ff';
      ctx.beginPath();
      ctx.ellipse(cx - 8, cy + 22, 8, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 9, cy + 22, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Outline
    r.sprite(sp, cx - w / 2 - PX, cy - hgt / 2 + bob + lift, PX, { alpha, colorOverride: '#111' });
    r.sprite(sp, cx - w / 2 + PX, cy - hgt / 2 + bob + lift, PX, { alpha, colorOverride: '#111' });
    r.sprite(sp, cx - w / 2, cy - hgt / 2 + bob + lift - PX, PX, { alpha, colorOverride: '#111' });
    r.sprite(sp, cx - w / 2, cy - hgt / 2 + bob + lift + PX, PX, { alpha, colorOverride: '#111' });
    
    // Main sprite
    r.sprite(sp, cx - w / 2, cy - hgt / 2 + bob + lift, PX, { alpha });
  }
}
