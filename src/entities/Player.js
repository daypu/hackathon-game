import { GAME, STAT_MAX } from '../config.js';
import { heroFrame, drawHero, HERO_SCALE, HERO_GROUND_OFFSET } from '../sprites/hero.js';
import { clamp } from '../engine/utils.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = GAME.playerX;
    this.y = (GAME.roadTop + GAME.roadBottom) / 2;
    this.vy = 0;
    this.baseSpeed = 180;
    this.stats = { mana: STAT_MAX, faith: STAT_MAX, scripture: STAT_MAX };
    this.shield = false;
    this.cloudTimer = 0;
    this.webTimer = 0;
    this.invuln = 0;
    this.flash = 0;
    this.shieldFx = 0;
    this.grace = 1.2; // 开场护佑：短暂无敌，避免一进场即受击
    this.animTime = 0; // 奔跑动画相位
    this.moving = false;
    this.facing = 1; // 1 朝右，-1 朝左
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  updateFree(dt, input, bounds, colliders = []) {
    let speed = this.baseSpeed;
    if (this.webTimer > 0) speed *= 0.42; // 被蛛网粘住，行动迟缓
    if (this.cloudTimer > 0) speed *= 1.4; // 筋斗云加速

    const ax = input.axisX();
    const ay = input.axisY();
    const len = Math.hypot(ax, ay) || 1;
    const vx = (ax / len) * speed;
    const vy = (ay / len) * speed;

    // 分轴移动 + 滑动碰撞（撞到建筑/水域时仍可沿墙滑行）
    const nx = clamp(this.x + vx * dt, bounds.x, bounds.x + bounds.w);
    if (!this.#blocked(nx, this.y, colliders)) this.x = nx;
    const ny = clamp(this.y + vy * dt, bounds.y, bounds.y + bounds.h);
    if (!this.#blocked(this.x, ny, colliders)) this.y = ny;
    this.vy = vy;

    this.moving = ax !== 0 || ay !== 0;
    if (this.moving) {
      this.animTime += dt;
      if (ax > 0.1) this.facing = 1;
      else if (ax < -0.1) this.facing = -1;
    }

    this.cloudTimer = Math.max(0, this.cloudTimer - dt);
    this.webTimer = Math.max(0, this.webTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.shieldFx = Math.max(0, this.shieldFx - dt);
    this.grace = Math.max(0, this.grace - dt);
  }

  // 脚部碰撞盒是否与任一实体矩形重叠
  #blocked(x, y, colliders) {
    if (!colliders || colliders.length === 0) return false;
    const fx = x - 11;
    const fy = y + 2;
    const fw = 22;
    const fh = 15;
    for (const c of colliders) {
      if (fx < c.x + c.w && fx + fw > c.x && fy < c.y + c.h && fy + fh > c.y) return true;
    }
    return false;
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
    return { x: this.x - 12, y: this.y - 15, w: 24, h: 32 };
  }

  draw(r, t) {
    const ctx = r.ctx;
    // 受击时闪烁
    let alpha = 1;
    if (this.invuln > 0 && this.cloudTimer <= 0) {
      alpha = Math.sin(t * 40) > 0 ? 0.35 : 1;
    }

    this.#drawWukong(r, t, alpha);

    // 护盾光环
    if (this.shield || this.shieldFx > 0) {
      const pulse = 1 + Math.sin(t * 8) * 0.05;
      ctx.save();
      ctx.globalAlpha = this.shield ? 0.5 : this.shieldFx;
      ctx.strokeStyle = '#ff8a5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y - 2, 26 * pulse, 32 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffb38a';
      ctx.fill();
      ctx.restore();
    }
  }

  // 单独绘制月色像素孙悟空（奔跑/站立帧动画 + 描边 + 阴影 + 筋斗云）
  #drawWukong(r, t, alpha) {
    const ctx = r.ctx;
    const clock = this.moving ? this.animTime : t;
    const sp = heroFrame(this.moving, clock);
    const lift = this.cloudTimer > 0 ? -6 : 0;
    const footY = this.y + HERO_GROUND_OFFSET;

    // 地面阴影
    ctx.save();
    ctx.globalAlpha = 0.3 * alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x, footY + 1, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 筋斗云
    if (this.cloudTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.9 * alpha;
      ctx.fillStyle = '#eaf4ff';
      ctx.beginPath();
      ctx.ellipse(this.x, footY, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cfe4ff';
      ctx.beginPath();
      ctx.ellipse(this.x - 7, footY + 2, 6, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(this.x + 8, footY + 2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawHero(r, sp, this.x, footY + lift, HERO_SCALE, {
      alpha,
      flip: this.facing < 0,
    });
  }
}
