import { GAME, STAT_MAX } from '../config.js';
import { PARTY, WUKONG, characterFrame, drawCharacter, HERO_SCALE, HERO_GROUND_OFFSET } from '../sprites/hero.js';
import { clamp } from '../engine/utils.js';
import { isWalkablePoint } from '../openWorld.js';

const REVIVE_SECONDS = 20;

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = GAME.playerX;
    this.y = (GAME.roadTop + GAME.roadBottom) / 2;
    this.vy = 0;
    this.baseSpeed = 180;
    this.attackBonus = 0;
    this.skillBonus = 0;
    this.maxPartyHp = {
      tangseng: 100,
      wukong: 100,
      bajie: 100,
      shaseng: 100,
    };
    this.reviveTimers = {
      tangseng: 0,
      wukong: 0,
      bajie: 0,
      shaseng: 0,
    };
    this.stats = { mana: STAT_MAX, faith: STAT_MAX, scripture: STAT_MAX };
    this.partyHp = {
      tangseng: 100,
      wukong: 100,
      bajie: 100,
      shaseng: 100,
    };
    this.shield = false;
    this.cloudTimer = 0;
    this.webTimer = 0;
    this.stunTimer = 0;
    this.invuln = 0;
    this.flash = 0;
    this.shieldFx = 0;
    this.grace = 1.2; // 开场护佑：短暂无敌，避免一进场即受击
    this.animTime = 0; // 奔跑动画相位
    this.moving = false;
    this.facing = 1; // 1 朝右，-1 朝左
    this.aimX = 1;
    this.aimY = 0;
    this.characterKey = 'wukong';
    this.character = WUKONG;
    this.action = null;
    this.actionTimer = 0;
    this.actionMax = 0;
    this.actionColor = '#fff2b0';
    this.actionDirX = 1;
    this.actionDirY = 0;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setCharacter(key) {
    const member = PARTY.find((p) => p.key === key);
    if (!member || this.characterKey === key) return false;
    if ((this.partyHp[member.key] ?? 0) <= 0) return false;
    this.characterKey = member.key;
    this.character = member.character;
    this.animTime = 0;
    return true;
  }

  playAction(type, color = '#fff2b0', dir = null) {
    this.action = type;
    this.actionColor = color;
    this.actionDirX = dir ? dir.x : this.aimX || this.facing;
    this.actionDirY = dir ? dir.y : this.aimY || 0;
    this.actionTimer = type === 'skill' ? 0.55 : 0.34;
    this.actionMax = this.actionTimer;
    this.animTime += type === 'skill' ? 0.3 : 0.24;
  }

  updateFree(dt, input, bounds, colliders = [], walkZones = null) {
    this.#tickTimers(dt);
    if (this.isCurrentDead() || this.stunTimer > 0) {
      this.moving = false;
      return;
    }

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
    if (!this.#blocked(nx, this.y, colliders, walkZones)) this.x = nx;
    const ny = clamp(this.y + vy * dt, bounds.y, bounds.y + bounds.h);
    if (!this.#blocked(this.x, ny, colliders, walkZones)) this.y = ny;
    this.vy = vy;

    this.moving = ax !== 0 || ay !== 0;
    if (this.moving) {
      this.animTime += dt;
      const aim = cardinalAim(ax, ay);
      this.aimX = aim.x;
      this.aimY = aim.y;
      if (ax > 0.1) this.facing = 1;
      else if (ax < -0.1) this.facing = -1;
    }
  }

  #tickTimers(dt) {
    for (const key of Object.keys(this.reviveTimers)) {
      if (this.reviveTimers[key] <= 0) continue;
      this.reviveTimers[key] = Math.max(0, this.reviveTimers[key] - dt);
      if (this.reviveTimers[key] <= 0 && (this.partyHp[key] ?? 0) <= 0) {
        this.partyHp[key] = Math.max(45, Math.floor(this.maxPartyHp[key] * 0.55));
        if (key === this.characterKey) {
          this.invuln = 1.2;
          this.stunTimer = 0;
        }
      }
    }
    this.cloudTimer = Math.max(0, this.cloudTimer - dt);
    this.webTimer = Math.max(0, this.webTimer - dt);
    this.stunTimer = Math.max(0, this.stunTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.shieldFx = Math.max(0, this.shieldFx - dt);
    this.grace = Math.max(0, this.grace - dt);
    this.actionTimer = Math.max(0, this.actionTimer - dt);
    if (this.actionTimer <= 0) this.action = null;
  }

  // 只用脚底极小范围做实体碰撞，避免贴着道路/建筑边缘移动时卡顿。
  #blocked(x, y, colliders, walkZones) {
    if (walkZones && !isWalkablePoint(x, y + 9, walkZones)) return true;
    if (!colliders || colliders.length === 0) return false;
    const fx = x - 6;
    const fy = y + 10;
    const fw = 12;
    const fh = 6;
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
  damage(stat, amount, opts = {}) {
    if (this.grace > 0) return { blocked: 'grace' };
    if (this.cloudTimer > 0) return { blocked: 'cloud' };
    if (this.invuln > 0) return { blocked: 'invuln' };
    if (this.shield) {
      this.shield = false;
      this.shieldFx = 0.5;
      this.invuln = 0.6;
      return { blocked: 'shield' };
    }
    if (this.partyHp[this.characterKey] !== undefined) {
      this.partyHp[this.characterKey] = clamp(
        this.partyHp[this.characterKey] - amount,
        0,
        this.maxPartyHp[this.characterKey]
      );
      if (this.partyHp[this.characterKey] <= 0 && this.reviveTimers[this.characterKey] <= 0) {
        this.reviveTimers[this.characterKey] = REVIVE_SECONDS;
      }
    }
    if (opts.stun) this.stunTimer = Math.max(this.stunTimer, opts.stun);
    this.stats[stat] = clamp(this.stats[stat] - amount, 0, STAT_MAX);
    this.invuln = 0.9;
    this.flash = 0.9;
    return { applied: amount, stat };
  }

  heal(stat, amount) {
    this.stats[stat] = clamp(this.stats[stat] + amount, 0, STAT_MAX);
  }

  isCurrentDead() {
    return (this.partyHp[this.characterKey] ?? 0) <= 0;
  }

  reviveCurrent() {
    this.reviveTimers[this.characterKey] = 0;
    this.partyHp[this.characterKey] = Math.max(45, Math.floor(this.maxPartyHp[this.characterKey] * 0.55));
    this.invuln = 1.2;
    this.stunTimer = 0;
  }

  applyShopItem(key) {
    if (key === 'hp') {
      this.maxPartyHp[this.characterKey] = Math.min(180, this.maxPartyHp[this.characterKey] + 20);
      this.partyHp[this.characterKey] = clamp(this.partyHp[this.characterKey] + 20, 0, this.maxPartyHp[this.characterKey]);
      return true;
    }
    if (key === 'attack') {
      this.attackBonus = Math.min(20, this.attackBonus + 2);
      return true;
    }
    if (key === 'speed') {
      this.baseSpeed = Math.min(260, this.baseSpeed + 12);
      return true;
    }
    if (key === 'skill') {
      this.skillBonus = Math.min(24, this.skillBonus + 3);
      return true;
    }
    return false;
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

    this.#drawCurrentCharacter(r, t, alpha);

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

  // 绘制当前月色像素角色（奔跑/站立帧动画 + 描边 + 阴影 + 筋斗云）
  #drawCurrentCharacter(r, t, alpha) {
    const ctx = r.ctx;
    const actioning = Boolean(this.action);
    const progress = this.actionMax > 0 ? 1 - this.actionTimer / this.actionMax : 1;
    const clock = this.moving || actioning ? this.animTime + progress * 0.5 : t;
    const sp = characterFrame(this.character, this.moving || actioning, clock);
    const lift = this.cloudTimer > 0 ? -6 : 0;
    const footY = this.y + HERO_GROUND_OFFSET;
    const attackCurve = this.action === 'attack' ? Math.sin(progress * Math.PI) : 0;
    const recoil = this.action === 'attack' ? Math.max(0, progress - 0.55) * 10 : 0;
    const lunge = this.action === 'attack' ? attackCurve * 22 - recoil : 0;
    const skillLift = this.action === 'skill' ? Math.sin(progress * Math.PI) * 13 : 0;
    const drawX = this.x + lunge * this.actionDirX;
    const drawFootY = footY + lift - skillLift + lunge * this.actionDirY;

    // 地面阴影
    ctx.save();
    ctx.globalAlpha = 0.3 * alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(drawX, footY + 1, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.action === 'attack') {
      const slash = Math.sin(progress * Math.PI);
      const angle = Math.atan2(this.actionDirY, this.actionDirX);
      ctx.save();
      ctx.globalAlpha = 0.18 * slash;
      drawCharacter(r, sp, drawX - this.actionDirX * 12, drawFootY - this.actionDirY * 12 + 2, HERO_SCALE, {
        alpha: 0.28,
        flip: this.facing < 0,
        outline: null,
      });
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.62 * slash;
      ctx.strokeStyle = '#ffce54';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(drawX + this.actionDirX * 27, drawFootY - 18 + this.actionDirY * 18, 24, angle - 1.05, angle + 1.05);
      ctx.stroke();
      ctx.globalAlpha = 0.35 * slash;
      ctx.strokeStyle = '#fff2b0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(drawX + this.actionDirX * 32, drawFootY - 18 + this.actionDirY * 18, 31, angle - 0.8, angle + 0.8);
      ctx.stroke();
      ctx.restore();
    }

    if (this.action === 'skill') {
      const pulse = Math.sin(progress * Math.PI);
      ctx.save();
      ctx.globalAlpha = 0.25 + pulse * 0.35;
      ctx.strokeStyle = this.actionColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(drawX, drawFootY - 18, 34 + pulse * 20, 20 + pulse * 10, progress * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.18 + pulse * 0.18;
      ctx.beginPath();
      ctx.ellipse(drawX, drawFootY - 18, 18 + pulse * 34, 38 + pulse * 10, -progress * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 筋斗云
    if (this.cloudTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.9 * alpha;
      ctx.fillStyle = '#eaf4ff';
      ctx.beginPath();
      ctx.ellipse(drawX, drawFootY, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cfe4ff';
      ctx.beginPath();
      ctx.ellipse(drawX - 7, drawFootY + 2, 6, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(drawX + 8, drawFootY + 2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawCharacter(r, sp, drawX, drawFootY, HERO_SCALE, {
      alpha,
      flip: this.facing < 0,
    });
  }
}

function cardinalAim(ax, ay) {
  if (Math.abs(ax) >= Math.abs(ay)) return { x: ax >= 0 ? 1 : -1, y: 0 };
  return { x: 0, y: ay >= 0 ? 1 : -1 };
}
