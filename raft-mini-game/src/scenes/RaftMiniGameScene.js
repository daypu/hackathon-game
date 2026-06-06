import { GAME, PAL } from '../config.js';
import { clamp } from '../engine/utils.js';

const ROUND_SECONDS = 30;
const INTRO_SECONDS = 3;

export class RaftMiniGameScene {
  constructor(game, opts = {}) {
    this.g = game;
    this.r = game.r;
    this.input = game.input;
    this.opts = opts;
  }

  enter() {
    this.phase = 'intro';
    this.result = null;
    this.message = '';
    this.messageTimer = 0;
    this._resetState();
    this.introTimer = INTRO_SECONDS;
  }

  _say(msg, t = 1.6) {
    this.message = msg;
    this.messageTimer = t;
  }

  _resetState() {
    this.state = {
      raftAngle: 0,
      raftVelocity: 0,
      raftHP: 100,
      monkFear: 20,
      progress: 0,
      elapsed: 0,

      comfortCooldown: 0,
      repairCooldown: 0,
      attackCooldown: 0,
      calmTimer: 0,

      repairing: false,
      repairTimer: 0,

      monsterActive: false,
      monsterSide: null,
      monsterDamageTimer: 0,
      monsterSpawnTimer: 8,

      waveWarning: null,
      waveSpawnTimer: 5,

      capsizeTimer: 0,

      maxAbsAngle: 0,
      comfortCount: 0,
      repairCount: 0,
      monsterDefeatCount: 0,
      highestFear: 20,
    };
  }

  _rand(a, b) {
    return a + Math.random() * (b - a);
  }

  _sideLabel(side) {
    return side === 'left' ? '左侧' : '右侧';
  }

  _sideSign(side) {
    return side === 'left' ? -1 : 1;
  }

  update(dt) {
    const input = this.input;

    if (this.phase === 'intro') {
      this.introTimer = Math.max(0, this.introTimer - dt);
      if (input.just('confirm') || this.introTimer <= 0) {
        this.phase = 'playing';
        this._say('按 A/D 稳住木筏！', 1.2);
      }
      return;
    }

    if (this.phase === 'paused') {
      if (input.just('pause')) this.phase = 'playing';
      return;
    }

    if (this.phase === 'failed' || this.phase === 'success') {
      if (input.just('confirm')) {
        this.enter();
        return;
      }
      if (input.just('pause')) {
        this._returnToStart();
        return;
      }
      return;
    }

    if (input.just('pause')) {
      this.phase = 'paused';
      return;
    }

    const s = this.state;

    s.elapsed += dt;
    s.progress = clamp((s.elapsed / ROUND_SECONDS) * 100, 0, 100);

    s.comfortCooldown = Math.max(0, s.comfortCooldown - dt);
    s.repairCooldown = Math.max(0, s.repairCooldown - dt);
    s.attackCooldown = Math.max(0, s.attackCooldown - dt);
    s.calmTimer = Math.max(0, s.calmTimer - dt);

    const axis = input.axisX();
    const control = 92;
    const damping = 0.86;

    const drift = Math.sin(this.g.t * 1.15) * 18 + Math.sin(this.g.t * 2.4) * 10;
    const fearFactor = s.calmTimer > 0 ? 0.35 : 1;
    const fearShake = (Math.random() - 0.5) * 28 * (s.monkFear / 100) * fearFactor;
    const monsterTorque = s.monsterActive ? this._sideSign(s.monsterSide) * 22 : 0;

    s.raftVelocity += axis * control * dt;
    s.raftVelocity += (drift + fearShake + monsterTorque) * dt;
    s.raftVelocity *= Math.pow(damping, dt * 60);
    s.raftAngle += s.raftVelocity * dt;
    s.raftAngle = clamp(s.raftAngle, -55, 55);

    const absA = Math.abs(s.raftAngle);
    s.maxAbsAngle = Math.max(s.maxAbsAngle, absA);

    if (absA > 30) s.raftHP = Math.max(0, s.raftHP - 2.2 * dt);

    s.monkFear += 1.2 * dt;
    if (absA > 15) s.monkFear += 6 * dt;
    if (absA > 30) s.monkFear += 12 * dt;
    if (s.raftHP < 70) s.monkFear += (70 - s.raftHP) * 0.03 * dt;
    if (s.monsterActive) s.monkFear += 4 * dt;
    s.monkFear = clamp(s.monkFear, 0, 100);
    s.highestFear = Math.max(s.highestFear, s.monkFear);

    if (input.just('confirm')) this._tryComfort();
    if (input.just('repair')) this._tryStartRepair();
    if (input.just('attack')) this._tryAttack();

    this._updateRepair(dt, absA);
    this._updateWaves(dt);
    this._updateMonster(dt);

    if (absA > 40) s.capsizeTimer += dt;
    else s.capsizeTimer = 0;

    if (s.raftHP <= 0) {
      this.phase = 'failed';
      this.result = { success: false, reason: 'broken' };
      this._writeResult(false, 'broken');
      this._say('木筏破碎！', 1.8);
      return;
    }

    if (s.capsizeTimer >= 1) {
      this.phase = 'failed';
      this.result = { success: false, reason: 'capsize' };
      this._writeResult(false, 'capsize');
      this._say('木筏翻了！', 1.8);
      return;
    }

    if (s.elapsed >= ROUND_SECONDS) {
      this.phase = 'success';
      this.result = { success: true, reason: 'success' };
      this._writeResult(true, 'success');
      this._say('成功渡过流沙河！', 2.0);
      return;
    }

    this.messageTimer = Math.max(0, this.messageTimer - dt);
  }

  _tryComfort() {
    const s = this.state;
    if (s.comfortCooldown > 0) {
      this._say('师父刚刚安定下来，稍后再安抚。', 1.6);
      return;
    }
    s.monkFear = clamp(s.monkFear - 25, 0, 100);
    s.calmTimer = 3;
    s.comfortCooldown = 5;
    s.comfortCount += 1;
    this._say('唐僧慌了？按 Space 安抚！', 1.4);
  }

  _tryStartRepair() {
    const s = this.state;
    if (s.repairCooldown > 0) {
      this._say(`修理冷却：${s.repairCooldown.toFixed(1)}s`, 1.4);
      return;
    }
    if (s.raftHP >= 100) {
      this._say('木筏已满，不用修。', 1.4);
      return;
    }
    if (Math.abs(s.raftAngle) > 15) {
      this._say('木筏太晃！先稳住再按 1！', 1.6);
      return;
    }
    s.repairing = true;
    s.repairTimer = 1.2;
    s.repairCooldown = 4;
    this._say('修理中，保持平衡！', 1.4);
  }

  _updateRepair(dt, absA) {
    const s = this.state;
    if (!s.repairing) return;

    if (absA > 15) {
      s.repairing = false;
      this._say('太晃了！修理被打断！', 1.6);
      return;
    }

    s.repairTimer -= dt;
    if (s.repairTimer <= 0) {
      s.repairing = false;
      s.raftHP = Math.min(100, s.raftHP + 15);
      s.repairCount += 1;
      this._say('修理完成！', 1.2);
    }
  }

  _tryAttack() {
    const s = this.state;
    if (s.attackCooldown > 0) return;
    s.attackCooldown = 1;

    if (!s.monsterActive) {
      this._say('没有河怪，打了个空！', 1.4);
      return;
    }

    s.monsterActive = false;
    s.monsterSide = null;
    s.monsterDamageTimer = 0;
    s.monsterDefeatCount += 1;
    this._say('河怪被击退了！', 1.4);
  }

  _updateMonster(dt) {
    const s = this.state;

    if (!s.monsterActive) {
      s.monsterSpawnTimer -= dt;
      if (s.progress > 35 && s.monsterSpawnTimer <= 0) {
        s.monsterActive = true;
        s.monsterSide = Math.random() < 0.5 ? 'left' : 'right';
        s.monsterDamageTimer = 2;
        s.monsterSpawnTimer = this._rand(7, 11);
        this._say(`${this._sideLabel(s.monsterSide)}河怪！按 2！`, 1.6);
      }
      return;
    }

    s.monsterDamageTimer -= dt;
    if (s.monsterDamageTimer <= 0) {
      s.raftHP = Math.max(0, s.raftHP - 8);
      s.monkFear = clamp(s.monkFear + 15, 0, 100);
      s.highestFear = Math.max(s.highestFear, s.monkFear);
      s.monsterDamageTimer = 2;
      this._say('河怪在破坏！按 2！', 1.2);
    }
  }

  _updateWaves(dt) {
    const s = this.state;

    if (!s.waveWarning) {
      s.waveSpawnTimer -= dt;
      if (s.progress > 15 && s.waveSpawnTimer <= 0) {
        s.waveWarning = { side: Math.random() < 0.5 ? 'left' : 'right', timer: 1 };
        s.waveSpawnTimer = this._rand(5, 8);
        this._say(`${this._sideLabel(s.waveWarning.side)}水浪预警！稳住！`, 1.2);
      }
      return;
    }

    s.waveWarning.timer -= dt;
    if (s.waveWarning.timer <= 0) {
      const side = s.waveWarning.side;
      const impulse = side === 'left' ? 34 : -34;
      s.raftVelocity += impulse;
      s.raftHP = Math.max(0, s.raftHP - 5);
      s.monkFear = clamp(s.monkFear + 10, 0, 100);
      s.highestFear = Math.max(s.highestFear, s.monkFear);
      s.waveWarning = null;
      this._say('水浪冲击！稳住！', 1.2);
    }
  }

  _getRating(success, reason) {
    const s = this.state;
    if (!success && reason === 'capsize') return '流沙吞舟';
    if (!success && reason === 'broken') return '木筏破碎';
    if (s.raftHP > 80 && s.highestFear < 60 && s.maxAbsAngle < 28) return '稳如灵山';
    if (s.raftHP > 50) return '有惊无险';
    return '勉强渡河';
  }

  _writeResult(success, reason) {
    const s = this.state;
    this.g.shared.raftResult = {
      success,
      reason,
      progress: Math.min(100, s.progress),
      raftHP: Math.round(s.raftHP),
      highestFear: Math.round(s.highestFear),
      maxAbsAngle: Math.round(s.maxAbsAngle),
      comfortCount: s.comfortCount,
      repairCount: s.repairCount,
      monsterDefeatCount: s.monsterDefeatCount,
      rating: this._getRating(success, reason),
    };
  }

  _returnToStart() {
    const back = this.opts.startScene;
    if (!back) return;
    this.g.setScene(back);
  }

  draw() {
    const r = this.r;
    const s = this.state;
    const W = GAME.width;
    const H = GAME.height;

    r.vgrad(0, 0, W, H, '#0c223a', '#133955');

    const t = this.g.t;
    for (let i = 0; i < 14; i++) {
      const y = 96 + i * 26;
      const x = ((t * 54 + i * 120) % (W + 220)) - 220;
      r.rect(x, y, 120, 3, 'rgba(110,190,220,0.26)');
      r.rect(x + 40, y + 10, 80, 2, 'rgba(110,190,220,0.18)');
    }

    r.rect(0, 0, W, 110, 'rgba(5,4,10,0.55)');
    r.rect(0, H - 96, W, 96, 'rgba(5,4,10,0.62)');

    this._drawTopHud(r, s);
    this._drawRaft(r, s);
    this._drawBottomHud(r, s);

    const absA = Math.abs(s.raftAngle);
    if (absA > 30 && this.phase === 'playing') this._drawWarning(r, absA);

    if (this.phase === 'playing') this._drawSideKeys(r, s);
    if (this.phase === 'playing') this._drawMainPrompt(r, s);

    if (this.phase === 'paused') this._drawPause(r);
    if (this.phase === 'failed') this._drawFailed(r);
    if (this.phase === 'success') this._drawSuccess(r);
    if (this.phase === 'intro') this._drawIntro(r);
  }

  _drawTopHud(r, s) {
    const absA = Math.abs(s.raftAngle);
    const danger = absA > 30;
    r.text('流沙河：木筏惊魂', 18, 28, { size: 18, color: '#cfc6e8', weight: '900' });

    const angleText = `倾斜 ${(s.raftAngle > 0 ? '+' : '') + (s.raftAngle | 0)}°`;
    r.text(angleText, 18, 56, { size: 14, color: danger ? '#ff7a6a' : '#fff2b0', weight: '800' });

    const bx = 220;
    const by = 16;
    const bw = 330;
    const remain = Math.max(0, ROUND_SECONDS - s.elapsed);
    r.text(`目标：撑过 ${ROUND_SECONDS}s   剩余 ${Math.ceil(remain)}s`, bx, by + 14, {
      size: 13,
      color: '#ffe9a8',
      weight: '800',
    });
    r.roundRect(bx, by + 20, bw, 12, 6, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
    r.roundRect(bx + 2, by + 22, (bw - 4) * clamp(s.elapsed / ROUND_SECONDS, 0, 1), 8, 4, '#ffce54');

    const hx = 570;
    r.text(`耐久 ${Math.round(s.raftHP)}`, hx, by + 14, { size: 13, color: '#9fd0ff', weight: '800' });
    r.roundRect(hx, by + 20, 160, 12, 6, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
    const hpRatio = clamp(s.raftHP / 100, 0, 1);
    const hpColor = s.raftHP > 60 ? '#7ed957' : s.raftHP > 30 ? '#ffce54' : '#ff7a6a';
    r.roundRect(hx + 2, by + 22, (160 - 4) * hpRatio, 8, 4, hpColor);

    const fx = 760;
    r.text(`惊慌 ${Math.round(s.monkFear)}`, fx, by + 14, { size: 13, color: '#ff9a9a', weight: '800' });
    r.roundRect(fx, by + 20, 180, 12, 6, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
    const fearRatio = clamp(s.monkFear / 100, 0, 1);
    const fearColor = s.monkFear < 40 ? '#7ed957' : s.monkFear < 70 ? '#ffce54' : '#ff7a6a';
    r.roundRect(fx + 2, by + 22, (180 - 4) * fearRatio, 8, 4, fearColor);
  }

  _drawRaft(r, s) {
    const ctx = r.ctx;
    const cx = GAME.width / 2;
    const cy = 310;
    const ang = (s.raftAngle * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    r.roundRect(-140, -26, 280, 52, 10, '#8b5a2b', '#2c1b0c', 3);
    r.rect(-124, -14, 248, 10, '#b98145');
    r.rect(-124, 6, 248, 10, '#b98145');
    r.roundRect(-110, -40, 220, 10, 5, 'rgba(10,8,18,0.25)', null, 2);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.28;
    r.circle(cx, cy + 40, 120, '#000');
    ctx.restore();

    if (s.repairing) {
      const w = 260;
      const x = GAME.width / 2 - w / 2;
      const y = 222;
      r.roundRect(x, y, w, 14, 7, 'rgba(10,8,18,0.85)', PAL.gold, 2);
      const ratio = clamp(1 - s.repairTimer / 1.2, 0, 1);
      r.roundRect(x + 2, y + 2, (w - 4) * ratio, 10, 5, '#ffce54');
      r.text('修理中…保持平衡', GAME.width / 2, y - 6, { size: 13, color: '#fff2b0', align: 'center', weight: '900' });
    }

    if (s.monkFear >= 70) {
      const blink = s.monkFear >= 100 ? 0.35 + 0.65 * Math.sin(this.g.t * 10) : 1;
      r.text('！', GAME.width / 2 + 66, 250, { size: 28, color: '#ffce54', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.8)', alpha: blink });
      r.text('唐僧慌了！按 Space', GAME.width / 2 + 66, 232, { size: 12, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.8)' });
    }

    if (s.waveWarning) {
      const side = s.waveWarning.side;
      const x = side === 'left' ? 70 : GAME.width - 70;
      const alpha = clamp(s.waveWarning.timer / 1, 0, 1);
      const sec = Math.max(0, s.waveWarning.timer);
      r.roundRect(side === 'left' ? 16 : GAME.width - 136, 150, 120, 30, 10, `rgba(74,163,255,${0.22 + 0.28 * alpha})`, '#4aa3ff', 2);
      r.text(`${this._sideLabel(side)}水浪！稳住`, x, 170, { size: 13, color: '#9fd0ff', align: 'center', weight: '900' });
      r.text(`${sec.toFixed(1)}s`, x, 188, { size: 12, color: '#cfc6e8', align: 'center', weight: '800' });
    }

    if (s.monsterActive) {
      const side = s.monsterSide;
      const x = side === 'left' ? 240 : GAME.width - 240;
      r.roundRect(side === 'left' ? 120 : GAME.width - 260, 340, 140, 46, 10, 'rgba(20,14,28,0.65)', '#ff7a6a', 2);
      r.text(`${this._sideLabel(side)}河怪！按 2`, x, 369, { size: 14, color: '#ff7a6a', align: 'center', weight: '900' });
    }

    if (s.raftHP < 35) {
      const absA = Math.abs(s.raftAngle);
      const txt = absA > 15 ? '太晃了！先稳住' : '木筏破了！按 1';
      r.text(txt, GAME.width / 2, 356, { size: 13, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.8)' });
    }
  }

  _drawBottomHud(r, s) {
    const y = GAME.height - 88;
    const bw = 210;
    const bh = 66;
    const gap = 18;
    const startX = GAME.width / 2 - (bw * 3 + gap * 2) / 2;

    const spaceReady = s.comfortCooldown <= 0;
    const spaceHot = s.monkFear > 70;
    const spaceSub = spaceReady ? '可用' : `冷却 ${s.comfortCooldown.toFixed(1)}s`;

    const absA = Math.abs(s.raftAngle);
    const repairReady = s.repairCooldown <= 0 && s.raftHP < 100 && absA <= 15;
    const repairHot = s.raftHP < 35 && absA <= 15;
    const repairSub = s.repairCooldown > 0
      ? `冷却 ${s.repairCooldown.toFixed(1)}s`
      : s.raftHP >= 100
        ? '已满'
        : absA > 15
          ? '太晃'
          : '可修';

    const attackReady = s.attackCooldown <= 0;
    const attackHot = s.monsterActive;
    const attackSub = s.attackCooldown > 0 ? `冷却 ${s.attackCooldown.toFixed(1)}s` : s.monsterActive ? '按 2！' : '暂无';

    this._drawButtonCard(r, startX, y, bw, bh, 'Space', '安抚唐僧', spaceSub, spaceHot, !spaceReady);
    this._drawButtonCard(r, startX + (bw + gap), y, bw, bh, '1', '修理木筏', repairSub, repairHot, !repairReady);
    this._drawButtonCard(r, startX + (bw + gap) * 2, y, bw, bh, '2', '击退河怪', attackSub, attackHot, !(attackReady && s.monsterActive));

    r.text('P/Esc：暂停', 18, GAME.height - 28, { size: 13, color: '#9a90b8', weight: '700' });

    const msg = this.messageTimer > 0 ? this.message : '';
    if (msg) {
      r.roundRect(160, GAME.height - 162, 640, 44, 10, 'rgba(10,8,18,0.82)', PAL.gold, 2);
      r.text(msg, GAME.width / 2, GAME.height - 134, { size: 14, color: '#fff2b0', align: 'center', weight: '900' });
    }
  }

  _drawButtonCard(r, x, y, w, h, key, title, sub, hot, dim) {
    const ctx = r.ctx;
    const blink = 0.5 + 0.5 * Math.sin(this.g.t * 6);
    const edge = hot ? '#ffce54' : 'rgba(255,255,255,0.16)';
    const fill = hot ? `rgba(255,206,84,${0.14 + blink * 0.08})` : 'rgba(10,8,18,0.78)';
    ctx.save();
    if (dim) ctx.globalAlpha = 0.65;
    r.roundRect(x, y, w, h, 12, fill, edge, 2);
    r.roundRect(x + 6, y + 6, w - 12, h - 12, 10, null, 'rgba(255,255,255,0.10)', 1);
    r.text(key, x + 26, y + 36, { size: 26, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    r.text(title, x + 62, y + 30, { size: 14, color: '#cfc6e8', align: 'left', weight: '900' });
    r.text(sub, x + 62, y + 52, { size: 12, color: hot ? '#fff2b0' : '#9a90b8', align: 'left', weight: '800' });
    ctx.restore();
  }

  _drawSideKeys(r, s) {
    const absA = Math.abs(s.raftAngle);
    const need = absA < 4 ? null : s.raftAngle > 0 ? 'A' : 'D';
    const more = absA > 30;
    const blink = 0.45 + 0.55 * Math.sin(this.g.t * (more ? 10 : 6));

    this._drawSideKeyCard(r, 22, 160, 132, 118, 'A', '向左稳', need === 'A', blink, absA);
    this._drawSideKeyCard(r, GAME.width - 154, 160, 132, 118, 'D', '向右稳', need === 'D', blink, absA);
  }

  _drawSideKeyCard(r, x, y, w, h, key, sub, hot, blink, absA) {
    const ctx = r.ctx;
    const intense = absA > 40 ? 1 : absA > 30 ? 0.75 : 0.45;
    const a = hot ? 0.18 + blink * 0.22 * intense : 0.06;
    const edge = hot ? '#ffce54' : 'rgba(255,255,255,0.10)';
    r.roundRect(x, y, w, h, 14, `rgba(255,206,84,${a})`, edge, 2);
    r.roundRect(x + 8, y + 8, w - 16, h - 16, 12, null, 'rgba(255,255,255,0.10)', 1);
    r.text(key, x + w / 2, y + 58, { size: 56, color: hot ? '#fff2b0' : '#cfc6e8', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    r.text(sub, x + w / 2, y + 92, { size: 14, color: hot ? '#fff2b0' : '#9a90b8', align: 'center', weight: '900' });
    if (hot && absA > 30) {
      ctx.save();
      ctx.globalAlpha = 0.6 + blink * 0.4;
      r.text('现在按！', x + w / 2, y + 20, { size: 12, color: '#ffce54', align: 'center', weight: '900' });
      ctx.restore();
    }
  }

  _drawMainPrompt(r, s) {
    const prompt = this._getMainPrompt(s);
    if (!prompt) return;
    const blink = 0.5 + 0.5 * Math.sin(this.g.t * 8);
    r.roundRect(GAME.width / 2 - 290, 118, 580, 40, 12, `rgba(10,8,18,${0.62 + blink * 0.12})`, '#ffce54', 2);
    r.text(prompt, GAME.width / 2, 145, { size: 16, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
  }

  _getMainPrompt(s) {
    const absA = Math.abs(s.raftAngle);
    if (absA > 40) {
      const key = s.raftAngle > 0 ? 'A' : 'D';
      return `快翻了！按 ${key} 拉回来！`;
    }
    if (s.monsterActive) return `${this._sideLabel(s.monsterSide)}河怪！按 2！`;
    if (s.monkFear > 80) return '唐僧慌了！按 Space！';
    if (s.raftHP < 35) {
      if (absA > 15) return '木筏破了！先稳住！';
      return '木筏破了！平稳后按 1！';
    }
    if (s.waveWarning) return `${this._sideLabel(s.waveWarning.side)}水浪！稳住！`;
    if (this.messageTimer > 0) return null;
    return '先稳住木筏，再处理危机！';
  }

  _drawWarning(r, absA) {
    const ctx = r.ctx;
    const strength = clamp((absA - 30) / 25, 0, 1);
    const a = 0.15 + strength * 0.35;
    const g = ctx.createRadialGradient(GAME.width / 2, GAME.height / 2, 160, GAME.width / 2, GAME.height / 2, 520);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(140,0,0,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GAME.width, GAME.height);
  }

  _drawPause(r) {
    r.rect(0, 0, GAME.width, GAME.height, 'rgba(5,4,10,0.62)');
    r.text('暂停', GAME.width / 2, GAME.height / 2 - 8, { size: 46, color: '#ffce54', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    r.text('按 P / Esc 继续', GAME.width / 2, GAME.height / 2 + 34, { size: 16, color: '#cfc6e8', align: 'center', weight: '700' });
  }

  _drawFailed(r) {
    r.rect(0, 0, GAME.width, GAME.height, 'rgba(5,4,10,0.7)');
    const title = this.result?.reason === 'broken' ? '木筏破碎！' : '木筏翻了！';
    r.text(title, GAME.width / 2, GAME.height / 2 - 44, { size: 44, color: '#ff7a6a', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    const reason = this.result?.reason === 'broken' ? '原因：木筏耐久归零' : '原因：倾斜超过 ±40° 太久';
    const tip = this.result?.reason === 'broken' ? '提示：耐久低时找平稳窗口按 1 修理' : '提示：优先用 A/D 稳住木筏';
    r.text(reason, GAME.width / 2, GAME.height / 2 + 0, { size: 14, color: '#cfc6e8', align: 'center', weight: '800' });
    r.text(tip, GAME.width / 2, GAME.height / 2 + 24, { size: 14, color: '#fff2b0', align: 'center', weight: '800' });
    r.text('Space / Enter：重新挑战', GAME.width / 2, GAME.height / 2 + 62, { size: 16, color: '#fff2b0', align: 'center', weight: '900' });
    r.text('Esc：返回开始界面', GAME.width / 2, GAME.height / 2 + 88, { size: 14, color: '#cfc6e8', align: 'center', weight: '700' });
  }

  _drawSuccess(r) {
    r.rect(0, 0, GAME.width, GAME.height, 'rgba(5,4,10,0.7)');
    r.text('成功渡过流沙河！', GAME.width / 2, GAME.height / 2 - 56, { size: 40, color: '#ffce54', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    const rating = this.g.shared.raftResult?.rating || '有惊无险';
    const s = this.state;
    r.text('你完成了：', GAME.width / 2, GAME.height / 2 - 20, { size: 14, color: '#cfc6e8', align: 'center', weight: '900' });
    const lines = [
      `坚持渡河：${ROUND_SECONDS} 秒`,
      `安抚唐僧：${s.comfortCount} 次   修理木筏：${s.repairCount} 次`,
      `击退河怪：${s.monsterDefeatCount} 次   最大倾斜：${Math.round(s.maxAbsAngle)}°`,
      `评级：${rating}`,
    ];
    lines.forEach((ln, i) => {
      r.text(ln, GAME.width / 2, GAME.height / 2 + 4 + i * 18, { size: 13, color: i === 3 ? '#fff2b0' : '#cfc6e8', align: 'center', weight: '800' });
    });
    r.text('Space / Enter：重新挑战', GAME.width / 2, GAME.height / 2 + 94, { size: 16, color: '#fff2b0', align: 'center', weight: '900' });
    r.text('Esc：返回开始界面', GAME.width / 2, GAME.height / 2 + 120, { size: 14, color: '#cfc6e8', align: 'center', weight: '700' });
  }

  _drawIntro(r) {
    const ctx = r.ctx;
    r.rect(0, 0, GAME.width, GAME.height, 'rgba(5,4,10,0.62)');

    const w = 720;
    const h = 360;
    const x = GAME.width / 2 - w / 2;
    const y = 88;
    r.roundRect(x, y, w, h, 16, 'rgba(10,8,18,0.92)', '#ffce54', 3);
    r.roundRect(x + 10, y + 10, w - 20, h - 20, 12, null, 'rgba(255,255,255,0.14)', 1);

    r.text('流沙河：木筏惊魂', GAME.width / 2, y + 56, { size: 34, color: '#ffce54', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    r.text(`目标：撑过 ${ROUND_SECONDS} 秒，不让木筏翻！`, GAME.width / 2, y + 96, { size: 16, color: '#fff2b0', align: 'center', weight: '900' });

    const left = x + 92;
    const top = y + 140;
    const items = [
      ['A / D', '左右稳船（核心）'],
      ['Space', '安抚唐僧'],
      ['1', '修理木筏'],
      ['2', '击退河怪'],
    ];
    items.forEach((it, i) => {
      const iy = top + i * 42;
      r.roundRect(left, iy - 20, 100, 34, 10, 'rgba(20,14,28,0.85)', 'rgba(255,255,255,0.14)', 1);
      r.text(it[0], left + 50, iy + 2, { size: 16, color: '#fff2b0', align: 'center', weight: '900' });
      r.text(it[1], left + 122, iy + 2, { size: 15, color: '#cfc6e8', align: 'left', weight: '800' });
    });

    r.text('提示：先稳住木筏，再处理危机！', GAME.width / 2, y + h - 72, { size: 15, color: '#cfc6e8', align: 'center', weight: '900' });
    const remain = Math.ceil(this.introTimer);
    const blink = 0.45 + 0.55 * Math.sin(this.g.t * 6);
    ctx.save();
    ctx.globalAlpha = 0.45 + blink * 0.55;
    r.text(`${remain} 秒后开始 / 按 Space 立即开始`, GAME.width / 2, y + h - 34, { size: 16, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    ctx.restore();
  }
}

