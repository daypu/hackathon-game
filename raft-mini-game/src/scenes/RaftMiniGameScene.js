import { GAME, PAL, TUNING } from '../config.js';
import { clamp } from '../engine/utils.js';

const TOP_HUD_H = 80;
const BOTTOM_HUD_H = 104;
const BOAT_CY = 315;
const BOAT_HULL_H = 96;
const DEMON_ROW_FACTOR = 0.42;
const DEMON_BAIL_FACTOR = 0.55;

export class RaftMiniGameScene {
  constructor(game, opts = {}) {
    this.g = game;
    this.r = game.r;
    this.input = game.input;
    this.opts = opts;
    this.fx = { p: [] };
  }

  enter() {
    this.phase = 'intro';
    this.result = null;
    this.message = '';
    this.messageTimer = 0;
    this._resetState();
    this._applyRunMods();
    this.fx.p = [];
    this.introTimer = TUNING.introSeconds;
  }

  _say(msg, t = 1.6) {
    this.message = msg;
    this.messageTimer = t;
  }

  _resetState() {
    this.state = {
      elapsed: 0,
      progress: 0,

      monsterDistance: TUNING.monster.startDistance,
      boatSpeed: 0,
      lastRowKey: null,
      rowCombo: 0,
      rowFeedbackTimer: 0,
      rowHintCooldown: 0,
      lockHintCooldown: 0,
      rowPraiseCooldown: 0,

      waterLevel: 0,
      bailCooldownTimer: 0,
      bailPraiseCooldown: 0,
      waveActive: false,
      waveSide: null,
      waveWarningTimer: 0,
      waveImpactFlash: 0,

      monkFear: TUNING.fear.start,
      monkCalmTimer: 0,
      dialogueActive: false,
      dialogueSequence: [],
      dialogueInput: [],
      dialogueTimer: 0,

      frontDemonActive: false,
      demonSide: null,
      demonTimer: 0,
      demonTimerMax: 0,
      demonSequence: [],
      demonIndex: 0,
      demonHitFlash: 0,
      demonWrongFlash: 0,
      demonDefeatTimer: 0,
      demonDefeatSide: null,

      speedDebuffTimer: 0,

      actionMode: 'idle',
      actionLockTimer: 0,

      scriptEvents: this._makeScript(),

      runMods: null,
      runHint: '',

      camShakeTimer: 0,
      camShakeAmp: 0,
      boatJoltTimer: 0,
      boatJoltX: 0,
      boatJoltY: 0,
      monsterRecoilTimer: 0,
      rescueFlashTimer: 0,
      rescueFlashColor: '#ffce54',

      stats: {
        rows: 0,
        altRows: 0,
        sameKey: 0,
        maxCombo: 0,
        bails: 0,
        waveHits: 0,
        dialogueStarted: 0,
        dialogueSuccess: 0,
        dialogueFail: 0,
        demonSpawned: 0,
        demonHit: 0,
        demonMiss: 0,
        demonFail: 0,
      },

      failReason: '',
    };
  }

  _rand(a, b) {
    return a + Math.random() * (b - a);
  }

  _img(key) {
    // 由 StartScene 预加载，失败则为 null；绘制时按需 fallback
    return this.g.shared?.images?.[key] || null;
  }

  _drawImageCover(r, img, x, y, w, h) {
    // 等比铺满 + 居中裁切（cover）
    const ctx = r.ctx;
    const iw = img.width || 1;
    const ih = img.height || 1;
    const s = Math.max(w / iw, h / ih);
    const dw = iw * s;
    const dh = ih * s;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  _drawImageCentered(r, img, cx, cy, w, h, alpha = 1) {
    const ctx = r.ctx;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }

  _drawSpriteRotated(img, cx, cy, w, h, rotation = 0, alpha = 1, flipX = false) {
    const ctx = this.r.ctx;
    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    if (flipX) ctx.scale(-1, 1);
    ctx.globalAlpha *= alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    ctx.imageSmoothingEnabled = prevSmooth;
  }

  _rotatePoint(x, y, rot) {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    return { x: x * c - y * s, y: x * s + y * c };
  }

  _boatPose(s, t) {
    const cx = GAME.width / 2;
    const baseCy = BOAT_CY + Math.sin(t * 2) * 2;
    const boatImg = this._img('boat');
    const baseRot = -Math.PI / 2;
    const rowK = clamp((s.rowFeedbackTimer || 0) / (TUNING.action.feedbackSeconds || 0.35), 0, 1);
    const rowRot = s.lastRowKey ? (s.lastRowKey === 'left' ? 0.025 : -0.025) * rowK : 0;
    const idleRot = Math.sin(t * 1.3) * 0.004;
    const rot = baseRot + rowRot + idleRot;

    let drawW = 280;
    let drawH = 150;
    if (boatImg) {
      const targetLen = 292;
      const s0 = targetLen / Math.max(1, boatImg.width);
      drawW = boatImg.width * s0;
      drawH = boatImg.height * s0;
      const worldWidth = drawH;
      if (worldWidth < 130) {
        const k = 130 / Math.max(1, worldWidth);
        drawW *= k;
        drawH *= k;
      } else if (worldWidth > 180) {
        const k = 180 / worldWidth;
        drawW *= k;
        drawH *= k;
      }
      const worldLen = drawW;
      if (worldLen < 260) {
        const k = 260 / Math.max(1, worldLen);
        drawW *= k;
        drawH *= k;
      } else if (worldLen > 320) {
        const k = 320 / worldLen;
        drawW *= k;
        drawH *= k;
      }
    }

    const riverBottom = GAME.height - BOTTOM_HUD_H;
    const halfLen = drawW / 2;
    const overflow = baseCy + halfLen - (riverBottom - 8);
    const cy = overflow > 0 ? baseCy - overflow : baseCy;

    return { cx, cy, drawW, drawH, rot };
  }

  _makeRunMods() {
    const chaseMul = this._rand(1.08, 1.18);
    const waveMul = this._rand(1.06, 1.16);
    const fearMul = this._rand(1.06, 1.16);
    const demonMul = this._rand(1.08, 1.2);
    const startDistPenalty = this._rand(6, 16);
    const startWater = this._rand(0, 12);
    const startFear = this._rand(0, 10);
    return { chaseMul, waveMul, fearMul, demonMul, startDistPenalty, startWater, startFear };
  }

  _applyRunMods() {
    const s = this.state;
    const T = TUNING;
    const m = this._makeRunMods();
    s.runMods = m;
    s.monsterDistance = clamp(T.monster.startDistance - m.startDistPenalty, T.monster.startDistance * 0.55, 120);
    s.waterLevel = clamp(m.startWater, 0, 25);
    s.monkFear = clamp(T.fear.start + m.startFear, 0, T.fear.max);
    const p = (x) => Math.round((x - 1) * 100);
    s.runHint = `随机加点：追击+${p(m.chaseMul)}% 进水+${p(m.waveMul)}% 惊慌+${p(m.fearMul)}%`;
  }

  _sideLabel(side) {
    return side === 'left' ? '左侧' : '右侧';
  }

  _sideSign(side) {
    return side === 'left' ? -1 : 1;
  }

  _monsterDistRatio(s) {
    return clamp(s.monsterDistance / TUNING.monster.startDistance, 0, 1);
  }

  _cameraOffset(s, t) {
    if (!s || s.camShakeTimer <= 0) return { x: 0, y: 0 };
    const k = clamp(s.camShakeTimer / 0.35, 0, 1);
    const a = (0.6 + 0.4 * Math.sin(t * 18)) * (s.camShakeAmp || 0) * k;
    const nx = this._noise1D(t * 40, 911);
    const ny = this._noise1D(t * 44, 919);
    return { x: nx * a, y: ny * a };
  }

  _rearMonsterVisual(s, t) {
    const distRatio = this._monsterDistRatio(s);
    const near = 1 - distRatio;
    const recoil = clamp((s.monsterRecoilTimer || 0) / 0.35, 0, 1);
    const nearV = clamp(near - recoil * 0.22, 0, 1);
    const riverBottom = GAME.height - BOTTOM_HUD_H;
    const boat = this._boatPose(s, t);
    const boatBottom = boat.cy + boat.drawW / 2;

    const topFar = riverBottom - 12;
    const topNear = boatBottom + 14;
    const topY = topFar + (topNear - topFar) * nearV;

    const radius = 14 + nearV * 18;
    const wobble = Math.sin(t * 2.1) * (1.2 + nearV * 3.2);
    const centerY = topY + radius + wobble;

    return { distRatio, near, nearV, recoil, riverBottom, boatBottom, topY, centerY, radius };
  }

  update(dt) {
    const input = this.input;
    const T = TUNING;

    if (this.phase === 'intro') {
      this.introTimer = Math.max(0, this.introTimer - dt);
      if (input.just('confirm') || this.introTimer <= 0) {
        this.phase = 'playing';
        const hint = this.state?.runHint ? `｜${this.state.runHint}` : '';
        this._say(`A/D 交替划船，别让水怪追上！${hint}`, 1.7);
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
    s.progress = clamp((s.elapsed / T.roundSeconds) * 100, 0, 100);

    s.rowFeedbackTimer = Math.max(0, s.rowFeedbackTimer - dt);
    s.rowHintCooldown = Math.max(0, s.rowHintCooldown - dt);
    s.lockHintCooldown = Math.max(0, s.lockHintCooldown - dt);
    s.rowPraiseCooldown = Math.max(0, s.rowPraiseCooldown - dt);
    s.waveImpactFlash = Math.max(0, s.waveImpactFlash - dt);
    s.demonHitFlash = Math.max(0, s.demonHitFlash - dt);
    s.demonWrongFlash = Math.max(0, s.demonWrongFlash - dt);
    s.actionLockTimer = Math.max(0, s.actionLockTimer - dt);
    s.speedDebuffTimer = Math.max(0, s.speedDebuffTimer - dt);
    s.bailCooldownTimer = Math.max(0, s.bailCooldownTimer - dt);
    s.bailPraiseCooldown = Math.max(0, s.bailPraiseCooldown - dt);
    s.monkCalmTimer = Math.max(0, s.monkCalmTimer - dt);
    s.demonDefeatTimer = Math.max(0, s.demonDefeatTimer - dt);
    s.camShakeTimer = Math.max(0, s.camShakeTimer - dt);
    s.boatJoltTimer = Math.max(0, s.boatJoltTimer - dt);
    s.monsterRecoilTimer = Math.max(0, s.monsterRecoilTimer - dt);
    s.rescueFlashTimer = Math.max(0, s.rescueFlashTimer - dt);

    this._runScript();
    this._updateWave(dt);
    this._updateDialogue(dt);
    this._updateFrontDemon(dt);

    if (s.dialogueActive) {
      const v = input.just('one') ? 1 : input.just('two') ? 2 : null;
      if (v != null) this._dialoguePress(v);
      if ((input.just('left') || input.just('right') || input.just('confirm') || input.just('q') || input.just('e')) && s.lockHintCooldown <= 0) {
        const need = s.dialogueSequence[s.dialogueInput.length];
        this._say(`安抚中：只能按 1/2（先按 ${need}）`, 1.0);
        s.lockHintCooldown = 0.9;
      }
    } else if (s.frontDemonActive) {
      const hit = input.just('q') ? 'q' : input.just('e') ? 'e' : null;
      if (hit) this._demonPress(hit);
      if ((input.just('left') || input.just('right')) && s.actionLockTimer <= 0) {
        if (input.just('left')) this._row('left', DEMON_ROW_FACTOR);
        if (input.just('right')) this._row('right', DEMON_ROW_FACTOR);
      }
      if (input.just('confirm')) this._startBailing(DEMON_BAIL_FACTOR);
      if ((input.just('one') || input.just('two')) && s.lockHintCooldown <= 0) {
        const need = s.demonSequence[s.demonIndex] === 'q' ? 'Q' : 'E';
        this._say(`妖怪缠斗中：先按 Q/E（先按 ${need}）`, 1.0);
        s.lockHintCooldown = 0.9;
      }
    } else {
      if (input.just('confirm')) this._startBailing(1);
      if (input.just('left')) this._row('left', 1);
      if (input.just('right')) this._row('right', 1);
    }

    s.boatSpeed = Math.max(0, s.boatSpeed - T.boat.speedDecayPerSec * dt);
    const speedMax = T.boat.speedMax * (s.speedDebuffTimer > 0 ? T.demon.speedDebuffFactor : 1);
    s.boatSpeed = clamp(s.boatSpeed, 0, speedMax);

    let chase = T.monster.chaseBase + T.monster.chaseRamp * clamp(s.elapsed / T.roundSeconds, 0, 1);
    if (s.elapsed > 15) chase *= 1 + 0.22 * clamp((s.elapsed - 15) / 15, 0, 1);
    if (s.elapsed > 26 && s.monsterDistance < T.monster.startDistance * 0.15) chase *= 0.97;
    chase *= s.runMods?.chaseMul ?? 1;
    s.monsterDistance -= chase * dt;
    s.monsterDistance += s.boatSpeed * dt;
    s.monsterDistance = clamp(s.monsterDistance, 0, 120);

    const leakMul = s.runMods?.waveMul ?? 1;
    s.waterLevel = Math.min(T.water.max, s.waterLevel + 1.35 * leakMul * dt);

    s.monkFear += T.fear.basePerSec * (s.runMods?.fearMul ?? 1) * dt;
    if (s.monsterDistance < T.monster.fearNearStart) {
      const k = 1 - clamp(s.monsterDistance / T.monster.fearNearStart, 0, 1);
      s.monkFear += T.monster.fearNearPerSec * k * dt;
    }
    if (s.waterLevel > 70) s.monkFear += (s.waterLevel - 70) * 0.02 * dt;
    s.monkFear = clamp(s.monkFear, 0, T.fear.max);

    if (s.monsterDistance <= 0) return this._fail('monster');
    if (s.waterLevel >= T.water.max) return this._fail('water');
    if (s.monkFear >= T.fear.max) return this._fail('fear');
    if (s.elapsed >= T.roundSeconds) return this._success();

    this._updateFx(dt);
    this.messageTimer = Math.max(0, this.messageTimer - dt);
  }

  _row(key, factor = 1) {
    const s = this.state;
    const T = TUNING;
    const st = s.stats;
    const distRatio = this._monsterDistRatio(s);

    s.actionMode = 'rowing';
    s.actionLockTimer = T.action.rowingSeconds;

    const same = s.lastRowKey === key;
    const combo = same ? 0 : Math.min(T.rowing.comboMax, s.rowCombo + 1);
    s.rowCombo = combo;
    s.lastRowKey = key;
    if (same && s.rowHintCooldown <= 0) {
      this._say('交替划船更快！', 0.9);
      s.rowHintCooldown = 1.2;
    }

    const comboFactor = 1 + combo * T.rowing.comboBonus;
    const eff = same ? T.rowing.sameKeyFactor : comboFactor;
    const fearK = clamp(s.monkFear / T.fear.max, 0, 1);
    const fearSlow = 1 - fearK * 0.18;
    const push = T.rowing.basePush * eff * factor * fearSlow;
    s.boatSpeed = clamp(s.boatSpeed + push, 0, T.boat.speedMax);
    s.rowFeedbackTimer = T.action.feedbackSeconds;

    if (st) {
      st.rows += 1;
      if (same) st.sameKey += 1;
      else st.altRows += 1;
      st.maxCombo = Math.max(st.maxCombo, combo);
    }

    const side = key === 'left' ? -1 : 1;
    const boat = this._boatPose(s, this.g.t);
    const p0 = this._rotatePoint(-boat.drawW * 0.12, side * (boat.drawH * 0.55), boat.rot);
    const tail = this._rotatePoint(-boat.drawW * 0.56, 0, boat.rot);
    const out = this._rotatePoint(0, side, boat.rot);
    const back = this._rotatePoint(-1, 0, boat.rot);
    const sx = boat.cx + p0.x;
    const sy = boat.cy + p0.y;
    const tx = boat.cx + tail.x;
    const ty = boat.cy + tail.y;
    const sprayN = same ? 4 : 6;
    const wakeN = same ? 6 : 9;
    this._spawnFx('spray', sx, sy, out.x * 160 + back.x * 70, out.y * 160 + back.y * 70, 0.5, sprayN);
    this._spawnFx('wake', tx, ty, back.x * 18, back.y * 64, 0.55, wakeN);
    if (!same) {
      s.boatJoltTimer = 0.14;
      s.boatJoltX = -side * 1.2;
      s.boatJoltY = -1.8;
    }

    if (!same && (combo === 3 || combo === 5 || combo === 8) && s.rowPraiseCooldown <= 0) {
      const critical = distRatio < 0.12;
      const danger = distRatio < 0.25;
      const msg = combo >= 8 ? '稳住了！' : combo >= 5 ? '划得好！' : '甩开一点！';
      this._say(danger || critical ? '甩开一点！A/D！' : msg, 0.95);
      s.rowPraiseCooldown = 0.9;

      const burst = combo >= 8 ? 18 : combo >= 5 ? 14 : 10;
      const v = combo >= 8 ? 64 : combo >= 5 ? 52 : 42;
      this._spawnFx('spray', sx, sy, out.x * (180 + v) + back.x * 90, out.y * (180 + v) + back.y * 90, 0.6, burst);
      this._spawnFx('wake', tx, ty, back.x * 28, back.y * (80 + v), 0.6, burst);

      if (danger) {
        s.camShakeTimer = 0.24;
        s.camShakeAmp = critical ? 8 : 5;
        s.monsterRecoilTimer = Math.max(s.monsterRecoilTimer, critical ? 0.32 : 0.22);
        s.rescueFlashTimer = 0.22;
        s.rescueFlashColor = critical ? '#ff7a6a' : '#ffce54';
      }

      s.boatJoltTimer = 0.18;
      s.boatJoltX = -side * (combo >= 8 ? 2.4 : 1.8);
      s.boatJoltY = -(combo >= 8 ? 5.2 : combo >= 5 ? 4.2 : 3.2);
    } else if (!same && distRatio < 0.12) {
      s.camShakeTimer = Math.max(s.camShakeTimer, 0.1);
      s.camShakeAmp = Math.max(s.camShakeAmp, 3.5);
    }
  }

  _startBailing(factor) {
    const s = this.state;
    const T = TUNING;
    s.actionMode = 'bailing';
    s.actionLockTimer = T.action.bailingSeconds;
    const cd = T.water.bailCooldownSeconds ?? T.action.bailingSeconds;
    const boat = this._boatPose(s, this.g.t);
    const p0 = this._rotatePoint(-boat.drawW * 0.06, boat.drawH * 0.55, boat.rot);
    const out = this._rotatePoint(0, 1, boat.rot);
    const back = this._rotatePoint(-1, 0, boat.rot);
    const bx = boat.cx + p0.x;
    const by = boat.cy + p0.y;
    if (s.bailCooldownTimer > 0) {
      this._spawnFx('spray', bx, by, out.x * 120 + back.x * 40, out.y * 120 + back.y * 40, 0.35, 4);
      return;
    }
    const prev = s.waterLevel;
    const protect = s.elapsed > 26 && s.waterLevel > 85 ? 1.03 : 1;
    s.waterLevel = Math.max(0, s.waterLevel - T.water.bailAmount * factor * protect);
    s.bailCooldownTimer = cd;
    if (s.stats) s.stats.bails += 1;
    this._spawnFx('spray', bx, by, out.x * 160 + back.x * 60, out.y * 160 + back.y * 60, 0.5, 10);
    const lift = clamp(prev / T.water.max, 0, 1);
    if (lift > 0.55) {
      const n = 5 + Math.floor(lift * 8);
      this._spawnFx('spray', bx, by, out.x * 120 + back.x * 70, out.y * 120 + back.y * 70, 0.55, n);
      this._spawnFx('spray', bx, by, out.x * 150 + back.x * 80, out.y * 150 + back.y * 80, 0.55, n);
    }
    if (prev > 70 && s.waterLevel < 64 && s.bailPraiseCooldown <= 0) {
      this._say('水位降下来了！', 1.0);
      s.bailPraiseCooldown = 1.2;
      s.rescueFlashTimer = 0.22;
      s.rescueFlashColor = '#9fd0ff';
    }
  }

  _spawnFx(kind, x, y, vx, vy, life, count) {
    const p = this.fx.p;
    const t = this.g.t;
    for (let i = 0; i < count; i++) {
      const k = t * 13 + i * 17 + (kind === 'wake' ? 101 : 303);
      const n1 = this._noise1D(k, 19);
      const n2 = this._noise1D(k, 23);
      p.push({
        kind,
        x: x + n1 * 10,
        y: y + n2 * 8,
        vx: vx + n1 * 40,
        vy: vy + n2 * 30,
        life,
        age: 0,
        r: kind === 'wake' || kind === 'wave' ? 3 + (n2 + 1) * 2 : 2 + (n2 + 1) * 2,
      });
    }
  }

  _updateFx(dt) {
    const p = this.fx.p;
    for (let i = p.length - 1; i >= 0; i--) {
      const a = p[i];
      a.age += dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.kind === 'wake') {
        a.vx *= Math.pow(0.3, dt);
        a.vy *= Math.pow(0.3, dt);
      } else if (a.kind === 'wave') {
        a.vx *= Math.pow(0.22, dt);
        a.vy *= Math.pow(0.22, dt);
      } else {
        a.vx *= Math.pow(0.12, dt);
        a.vy = a.vy * Math.pow(0.2, dt) + 90 * dt;
      }
      if (a.age >= a.life) p.splice(i, 1);
    }
  }

  _makeScript() {
    return [
      { t: 6.4, type: 'wave', side: 'left', done: false },
      { t: 12.6, type: 'dialogue', maxSeconds: TUNING.dialogue.maxSeconds, done: false },
      { t: 18.6, type: 'demon', side: 'left', done: false },
      { t: 21.8, type: 'wave', side: 'right', done: false },
      { t: 24.4, type: 'wave', side: 'right', done: false },
      { t: 27.6, type: 'wave', side: 'left', done: false },
    ];
  }

  _runScript() {
    const s = this.state;
    if (!s.scriptEvents) return;
    if (this.phase !== 'playing') return;

    const t = s.elapsed;
    const early = t < 24;
    if (early && (s.dialogueActive || s.frontDemonActive)) return;

    for (const e of s.scriptEvents) {
      if (e.done) continue;
      if (t < e.t) break;
      if (e.type === 'wave') this._startWave(e.side);
      if (e.type === 'dialogue') this._startDialogue(e.seqLen, e.maxSeconds);
      if (e.type === 'demon') this._startFrontDemon(e.side, e.seqLen);
      e.done = true;
      break;
    }
  }

  _startWave(side) {
    const s = this.state;
    const T = TUNING;
    s.waveActive = true;
    s.waveSide = side;
    s.waveWarningTimer = T.wave.warningSeconds;
    this._say(`${this._sideLabel(s.waveSide)}水浪！准备舀水！`, 1.2);
  }

  _startDialogue(seqLen, maxSeconds) {
    const s = this.state;
    const T = TUNING;
    s.dialogueActive = true;
    s.dialogueInput = [];
    const len = seqLen ?? this._randInt(T.dialogue.seqMin, T.dialogue.seqMax);
    s.dialogueSequence = this._makeSeq(len);
    s.dialogueTimer = Math.min(T.dialogue.maxSeconds, maxSeconds);
    s.actionMode = 'comforting';
    s.actionLockTimer = 0;
    if (s.stats) s.stats.dialogueStarted += 1;
    this._say(`安抚唐僧：${s.dialogueSequence.join(' → ')}`, 1.2);
  }

  _startFrontDemon(side, seqLen) {
    const s = this.state;
    const T = TUNING;
    s.frontDemonActive = true;
    s.demonSide = side;
    const len = seqLen ?? this._randInt(T.demon.seqMin ?? 2, T.demon.seqMax ?? 3);
    const seq = this._makeDemonSeq(len, side);
    s.demonSequence = seq;
    s.demonIndex = 0;
    s.demonTimerMax = T.demon.baseSeconds + T.demon.stepSeconds * seq.length;
    s.demonTimer = s.demonTimerMax;
    if (s.stats) s.stats.demonSpawned += 1;
    this._say(`${s.demonSide === 'left' ? '左前' : '右前'}妖怪！按序列 ${this._formatDemonSeq(seq)}！`, 1.2);
  }

  _updateWave(dt) {
    const s = this.state;
    const T = TUNING;

    if (!s.waveActive) return;

    s.waveWarningTimer -= dt;
    if (s.waveWarningTimer <= 0) {
      s.waveActive = false;
      s.waveWarningTimer = 0;
      s.waveImpactFlash = 0.35;
      const waveMul = s.runMods?.waveMul ?? 1;
      const fearMul = s.runMods?.fearMul ?? 1;
      s.waterLevel = Math.min(T.water.max, s.waterLevel + T.water.waveAdd * waveMul);
      s.monkFear = clamp(s.monkFear + T.fear.hitByWaveAdd * fearMul, 0, T.fear.max);
      if (s.stats) s.stats.waveHits += 1;
      this._say('水浪进船！连点 Space 舀水！', 1.2);
      const side = s.waveSide === 'left' ? -1 : 1;
      const x = GAME.width / 2 + side * 160;
      this._spawnFx('wave', x, 310, -side * 120, 10, 0.6, 14);
      this._spawnFx('spray', GAME.width / 2 + side * 64, 318, -side * 20, -80, 0.55, 10);
    }
  }

  _updateDialogue(dt) {
    const s = this.state;
    const T = TUNING;

    if (!s.dialogueActive) return;

    s.dialogueTimer -= dt;
    if (s.dialogueTimer <= 0) {
      s.dialogueActive = false;
      s.monkFear = clamp(s.monkFear + T.fear.comfortFailAdd * (s.runMods?.fearMul ?? 1), 0, T.fear.max);
      if (s.stats) s.stats.dialogueFail += 1;
      this._say('安抚超时！', 1.2);
      s.actionMode = 'idle';
    }
  }

  _dialoguePress(v) {
    const s = this.state;
    const T = TUNING;
    if (!s.dialogueActive) return;

    const idx = s.dialogueInput.length;
    const need = s.dialogueSequence[idx];
    if (v !== need) {
      s.dialogueActive = false;
      s.dialogueInput = [];
      s.monkFear = clamp(s.monkFear + T.fear.comfortFailAdd * (s.runMods?.fearMul ?? 1), 0, T.fear.max);
      if (s.stats) s.stats.dialogueFail += 1;
      this._say('按错了！唐僧更慌了！', 1.3);
      s.actionMode = 'idle';
      return;
    }

    s.dialogueInput.push(v);
    if (s.dialogueInput.length >= s.dialogueSequence.length) {
      s.dialogueActive = false;
      s.dialogueInput = [];
      s.monkFear = clamp(s.monkFear - T.fear.comfortSuccessReduce, 0, T.fear.max);
      if (s.stats) s.stats.dialogueSuccess += 1;
      this._say('唐僧安定下来。', 1.1);
      s.monkCalmTimer = 1.2;
      s.rescueFlashTimer = 0.24;
      s.rescueFlashColor = '#ffce54';
      s.actionMode = 'idle';
    }
  }

  _updateFrontDemon(dt) {
    const s = this.state;
    const T = TUNING;

    if (!s.frontDemonActive) return;

    s.demonTimer -= dt;
    if (s.demonTimer <= 0) {
      s.frontDemonActive = false;
      s.demonSide = null;
      s.demonTimer = 0;
      s.demonTimerMax = 0;
      s.demonIndex = 0;
      s.demonSequence = [];
      s.demonHitFlash = 0.45;
      const dm = s.runMods?.demonMul ?? 1;
      s.monkFear = clamp(s.monkFear + T.demon.timeoutFearAdd * dm, 0, T.fear.max);
      s.speedDebuffTimer = Math.max(s.speedDebuffTimer, T.demon.speedDebuffSeconds * dm);
      const waveMul = s.runMods?.waveMul ?? 1;
      s.waterLevel = Math.min(T.water.max, s.waterLevel + (T.water.waveAdd + 6) * waveMul);
      if (s.stats) s.stats.demonFail += 1;
      this._say('妖怪缠斗太久！船速下降！进水增加！', 1.3);
      s.actionMode = 'idle';
    }
  }

  _demonPress(k) {
    const s = this.state;
    const T = TUNING;
    s.actionMode = 'attacking';
    s.actionLockTimer = T.action.attackingSeconds;
    if (!s.frontDemonActive) return;
    const need = s.demonSequence[s.demonIndex];
    if (k !== need) {
      s.demonWrongFlash = 0.35;
      s.demonHitFlash = 0.2;
      s.demonIndex = 0;
      s.monkFear = clamp(s.monkFear + T.demon.wrongFearAdd * (s.runMods?.demonMul ?? 1), 0, T.fear.max);
      const waveMul = s.runMods?.waveMul ?? 1;
      s.waterLevel = Math.min(T.water.max, s.waterLevel + (T.water.waveAdd + 3) * waveMul);
      if (s.stats) s.stats.demonMiss += 1;
      this._say('按错了！进水！重来！', 1.05);
      return;
    }

    s.demonIndex += 1;
    const x = GAME.width / 2 + (s.demonSide === 'left' ? -220 : 220);
    this._spawnFx('hit', x, 170, 0, -40, 0.35, 6);
    if (s.demonIndex >= s.demonSequence.length) {
      const side = s.demonSide;
      s.frontDemonActive = false;
      s.demonSide = null;
      s.demonTimer = 0;
      s.demonTimerMax = 0;
      s.demonSequence = [];
      s.demonIndex = 0;
      if (s.stats) s.stats.demonHit += 1;
      this._spawnFx('hit', x, 170, 0, -60, 0.5, 10);
      this._say('击退妖怪！', 1.0);
      s.demonDefeatTimer = 0.65;
      s.demonDefeatSide = side;
      s.camShakeTimer = 0.22;
      s.camShakeAmp = 6;
      s.rescueFlashTimer = 0.22;
      s.rescueFlashColor = '#ffce54';
    }
  }

  _makeDemonSeq(n, side) {
    const seq = [];
    const first = side === 'left' ? 'q' : 'e';
    seq.push(first);
    for (let i = 1; i < n; i++) seq.push(Math.random() < 0.5 ? 'q' : 'e');
    return seq;
  }

  _formatDemonSeq(seq) {
    return seq.map((k) => (k === 'q' ? 'Q' : 'E')).join(' → ');
  }

  _makeSeq(n) {
    const seq = [];
    for (let i = 0; i < n; i++) seq.push(Math.random() < 0.5 ? 1 : 2);
    return seq;
  }

  _randInt(a, b) {
    return Math.floor(this._rand(a, b + 1));
  }

  _fail(reason) {
    const s = this.state;
    s.failReason = reason;
    this.phase = 'failed';
    this.result = { success: false, reason };
    if (reason === 'monster') this._say('水怪追上破船！', 1.8);
    if (reason === 'water') this._say('破船进水过多，沉没了！', 1.8);
    if (reason === 'fear') this._say('唐僧惊慌过度！', 1.8);
  }

  _success() {
    this.phase = 'success';
    const score = this._computeScore();
    const rank = this._getRank(score);
    this.result = { success: true, reason: 'success', score, rank };
    this.g.shared.lastScore = { score, rank, stats: this.state.stats };
    this._say('成功渡过流沙河！', 2.0);
  }

  _getRank(score) {
    const ranks = TUNING.score.ranks || [];
    for (const r of ranks) {
      if (score >= r.min) return r;
    }
    return ranks[ranks.length - 1] || { grade: 'D', title: '险象环生', min: 0 };
  }

  _computeScore() {
    const s = this.state;
    const T = TUNING;
    const st = s.stats || {};

    const dist = clamp(s.monsterDistance / T.monster.startDistance, 0, 1);
    const water = clamp(1 - s.waterLevel / T.water.max, 0, 1);
    const calm = clamp(1 - s.monkFear / T.fear.max, 0, 1);

    let score = 0;
    score += T.score.base;
    score += dist * T.score.dist;
    score += water * T.score.water;
    score += calm * T.score.calm;

    score += Math.min(st.maxCombo || 0, T.rowing.comboMax) * T.score.combo;
    score += (st.bails || 0) * T.score.bail;

    score += (st.dialogueSuccess || 0) * T.score.dialogueSuccess;
    score -= (st.dialogueFail || 0) * T.score.dialogueFail;

    score += (st.demonHit || 0) * T.score.demonHit;
    score -= (st.demonFail || 0) * T.score.demonFail;
    score -= (st.demonMiss || 0) * T.score.demonMiss;

    score -= (st.sameKey || 0) * T.score.sameKeyPenalty;

    return Math.round(clamp(score, 0, T.score.max));
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
    const ctx = r.ctx;

    this._drawBackground(r, this.g.t);

    r.rect(0, 0, W, TOP_HUD_H, 'rgba(5,4,10,0.55)');
    r.rect(0, H - BOTTOM_HUD_H, W, BOTTOM_HUD_H, 'rgba(5,4,10,0.62)');

    this._drawTopHud(r, s);
    ctx.save();
    const cam = this._cameraOffset(s, this.g.t);
    ctx.translate(cam.x, cam.y);
    this._drawThreats(r, s);
    this._drawFx(r, 'under');
    this._drawBoat(r, s);
    this._drawFx(r, 'over');
    ctx.restore();
    this._drawBottomHud(r, s);
    if (this.phase === 'playing') this._drawMainPrompt(r, s);

    if (this.phase === 'paused') this._drawPause(r);
    if (this.phase === 'failed') this._drawFailed(r);
    if (this.phase === 'success') this._drawSuccess(r);
    if (this.phase === 'intro') this._drawIntro(r);

    ctx.save();
    if (s.waveImpactFlash > 0) {
      ctx.globalAlpha = clamp(s.waveImpactFlash / 0.35, 0, 1) * 0.18;
      r.rect(0, 0, W, H, '#9fd0ff');
    }
    if (s.demonHitFlash > 0) {
      ctx.globalAlpha = clamp(s.demonHitFlash / 0.45, 0, 1) * 0.22;
      r.rect(0, 0, W, H, '#ff7a6a');
    }
    if (s.rescueFlashTimer > 0) {
      ctx.globalAlpha = clamp(s.rescueFlashTimer / 0.24, 0, 1) * 0.16;
      r.rect(0, 0, W, H, s.rescueFlashColor || '#ffce54');
    }
    ctx.restore();
  }

  _drawFx(r, layer) {
    const ctx = r.ctx;
    const p = this.fx.p;
    if (!p.length) return;

    for (const a of p) {
      const under = a.kind === 'wake' || a.kind === 'wave';
      if ((layer === 'under') !== under) continue;

      const t = clamp(1 - a.age / a.life, 0, 1);
      if (a.kind === 'wake') {
        ctx.save();
        ctx.globalAlpha = 0.08 + t * 0.18;
        r.circle(a.x, a.y, a.r + (1 - t) * 10, 'rgba(189,239,255,0.9)');
        ctx.restore();
      } else if (a.kind === 'wave') {
        ctx.save();
        ctx.globalAlpha = 0.1 + t * 0.22;
        r.circle(a.x, a.y, a.r + (1 - t) * 14, 'rgba(110,190,220,0.9)');
        ctx.restore();
      } else if (a.kind === 'spray') {
        ctx.save();
        ctx.globalAlpha = 0.15 + t * 0.55;
        r.circle(a.x, a.y, a.r, 'rgba(189,239,255,0.95)');
        ctx.restore();
      } else if (a.kind === 'hit') {
        ctx.save();
        ctx.globalAlpha = 0.18 + t * 0.6;
        r.circle(a.x, a.y, a.r + (1 - t) * 6, 'rgba(255,206,84,0.95)');
        ctx.restore();
      }
    }
  }

  _drawTopHud(r, s) {
    const T = TUNING;
    r.text('流沙河：破船惊魂', 18, 24, { size: 18, color: '#cfc6e8', weight: '900' });

    const remain = Math.max(0, T.roundSeconds - s.elapsed);
    const sec = Math.ceil(remain);
    const danger = remain <= 10;
    const final = remain <= 5;
    const blink = 0.45 + 0.55 * Math.sin(this.g.t * (final ? 14 : 10));
    r.text(`剩余 ${sec}s`, 18, 50, {
      size: final ? 18 : danger ? 16 : 14,
      color: final ? `rgba(255,122,106,${0.65 + blink * 0.35})` : danger ? `rgba(255,242,176,${0.65 + blink * 0.35})` : '#fff2b0',
      weight: '900',
      shadow: 'rgba(0,0,0,0.7)',
    });
    if (final && this.phase === 'playing') {
      r.text(`最后 ${sec} 秒！`, GAME.width / 2, 54, {
        size: 18,
        color: `rgba(255,122,106,${0.5 + blink * 0.5})`,
        align: 'center',
        weight: '900',
        shadow: 'rgba(0,0,0,0.75)',
      });
    }

    const bx = 160;
    const by = 10;
    const bw = 210;
    r.text('水怪距离', bx, by + 14, { size: 13, color: '#9fd0ff', weight: '800' });
    r.roundRect(bx, by + 20, bw, 12, 6, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
    const distRatio = this._monsterDistRatio(s);
    const distColor = s.monsterDistance > 40 ? '#7ed957' : s.monsterDistance > 22 ? '#ffce54' : '#ff7a6a';
    r.roundRect(bx + 2, by + 22, (bw - 4) * distRatio, 8, 4, distColor);

    const wx = 390;
    r.text(`进水 ${Math.round(s.waterLevel)}`, wx, by + 14, { size: 13, color: '#9fd0ff', weight: '800' });
    r.roundRect(wx, by + 20, 170, 12, 6, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
    const waterRatio = clamp(s.waterLevel / T.water.max, 0, 1);
    const waterColor = s.waterLevel < 35 ? '#7ed957' : s.waterLevel < 70 ? '#ffce54' : '#ff7a6a';
    r.roundRect(wx + 2, by + 22, (170 - 4) * waterRatio, 8, 4, waterColor);

    const fx = 585;
    r.text(`惊慌 ${Math.round(s.monkFear)}`, fx, by + 14, { size: 13, color: '#ff9a9a', weight: '800' });
    r.roundRect(fx, by + 20, 180, 12, 6, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
    const fearRatio = clamp(s.monkFear / T.fear.max, 0, 1);
    const fearColor = s.monkFear < 45 ? '#7ed957' : s.monkFear < 75 ? '#ffce54' : '#ff7a6a';
    r.roundRect(fx + 2, by + 22, (180 - 4) * fearRatio, 8, 4, fearColor);

    const crisis = this._getCrisisText(s);
    if (crisis) r.text(crisis, GAME.width - 18, 50, { size: 13, color: '#fff2b0', align: 'right', weight: '900' });
  }

  _getCrisisText(s) {
    const distRatio = this._monsterDistRatio(s);
    const waterRatio = clamp(s.waterLevel / TUNING.water.max, 0, 1);
    const fearRatio = clamp(s.monkFear / TUNING.fear.max, 0, 1);
    if (distRatio < 0.12) return '危机：水怪极近 A/D';
    if (distRatio < 0.25) return '危机：水怪逼近 A/D';
    if (waterRatio > 0.82) return '危机：进水过高 Space';
    if (fearRatio > 0.82) return '危机：惊慌过高 1/2';
    if (s.frontDemonActive) return '危机：前方妖怪 Q/E';
    if (s.dialogueActive) return '危机：安抚唐僧 1/2';
    if (s.waveActive) return `危机：${this._sideLabel(s.waveSide)}水浪`;
    if (s.waterLevel > 55) return '危机：舀水 Space';
    if (distRatio < 0.4) return '危机：划船 A/D';
    return '';
  }

  _drawBackground(r, t) {
    const img = this._img('bgMain');
    if (img) {
      this._drawImageCover(r, img, 0, 0, GAME.width, GAME.height);
      return;
    }
    r.vgrad(0, 0, GAME.width, GAME.height, PAL.sand0, PAL.sand1);
    this._drawRiver(r, t);
  }

  _drawRiver(r, t) {
    const W = GAME.width;
    const waterBottom = GAME.height - BOTTOM_HUD_H;
    const startY = TOP_HUD_H + 14;
    const rows = Math.ceil((waterBottom - startY) / 22);
    for (let i = 0; i < rows; i++) {
      const y = startY + i * 22;
      const x = ((t * 64 + i * 120) % (W + 220)) - 220;
      r.rect(x, y, 140, 3, 'rgba(110,190,220,0.24)');
      r.rect(x + 52, y + 10, 90, 2, 'rgba(110,190,220,0.14)');
    }
  }

  _drawThreats(r, s) {
    const ctx = r.ctx;
    const cx = GAME.width / 2;
    const W = GAME.width;
    const topY = TOP_HUD_H + 12;

    if (s.waveActive) {
      const a = clamp(s.waveWarningTimer / TUNING.wave.warningSeconds, 0, 1);
      const p = 1 - a;
      const side = s.waveSide;
      const x = side === 'left' ? 0 : W - 180;
      r.roundRect(x + 18, topY, 162, 44, 12, `rgba(74,163,255,${0.12 + 0.22 * p})`, '#4aa3ff', 2);
      r.text(`${this._sideLabel(side)}水浪！`, x + 99, topY + 26, { size: 14, color: '#9fd0ff', align: 'center', weight: '900' });
      r.text(`即将拍来 ${Math.max(0, s.waveWarningTimer).toFixed(1)}s`, x + 99, topY + 44, { size: 12, color: '#cfc6e8', align: 'center', weight: '800' });

      const img = this._img(side === 'left' ? 'waveLeft' : 'waveRight');
      if (img) {
        const riverTop = TOP_HUD_H + 4;
        const riverH = GAME.height - TOP_HUD_H - BOTTOM_HUD_H - 6;
        const ar = img.width / Math.max(1, img.height);
        const h = riverH;
        const w2 = h * ar;
        const shift = p * 220;
        const baseX = side === 'left' ? -w2 + shift : W - shift;
        const jitter = this._noise1D(this.g.t * 9, 771) * (2 + p * 4);
        ctx.save();
        ctx.globalAlpha = 0.2 + p * 0.6;
        ctx.drawImage(img, baseX + jitter, riverTop, w2, h);
        ctx.restore();
      } else {
        const wallW = 140;
        const wallShift = p * 200;
        const wallX = side === 'left' ? -wallW + wallShift : W - wallShift;
        ctx.save();
        ctx.globalAlpha = 0.18 + p * 0.2;
        r.rect(wallX, TOP_HUD_H + 4, wallW, GAME.height - TOP_HUD_H - BOTTOM_HUD_H - 6, 'rgba(74,163,255,0.65)');
        ctx.globalAlpha = 0.22 + p * 0.24;
        for (let i = 0; i < 18; i++) {
          const yy = topY + 16 + i * 18;
          const ox = this._noise1D(this.g.t * 2 + i * 1.7, 501) * 10;
          r.circle(wallX + (side === 'left' ? wallW - 18 : 18) + ox, yy, 8 + p * 8, 'rgba(189,239,255,0.85)');
        }
        ctx.restore();
      }
    }

    if (s.frontDemonActive) {
      const side = s.demonSide;
      const x = side === 'left' ? 330 : 630;
      let anchorY = 220 + (this.messageTimer > 0 ? 18 : 0);
      anchorY = clamp(anchorY, 190, 250);
      const bob = Math.sin(this.g.t * 6) * 4;
      const demonY = anchorY + bob;
      const py = clamp(demonY - 96, TOP_HUD_H + 8, GAME.height - BOTTOM_HUD_H - 170);
      const n = s.demonSequence.length;
      const done = s.demonIndex;
      const w = 24 * n + 22;
      const flash = clamp(s.demonWrongFlash / 0.35, 0, 1);
      const bg = flash > 0 ? `rgba(255,122,106,${0.12 + flash * 0.18})` : 'rgba(20,14,28,0.65)';
      const stroke = flash > 0 ? '#ff7a6a' : '#ff7a6a';
      r.roundRect(x - 86, py, 172, 82, 12, bg, stroke, 2);
      r.text(`${side === 'left' ? '左前' : '右前'}妖怪`, x, py + 22, { size: 14, color: '#ff7a6a', align: 'center', weight: '900' });

      r.roundRect(x - w / 2, py + 32, w, 28, 10, 'rgba(10,8,18,0.65)', 'rgba(255,255,255,0.14)', 1);
      for (let i = 0; i < n; i++) {
        const xx = x - w / 2 + 12 + i * 24;
        const hot = i === done;
        const ok = i < done;
        const pad = hot ? 2 : 0;
        const ww = hot ? 22 : 18;
        const hh = hot ? 22 : 18;
        r.roundRect(
          xx - pad,
          py + 38 - pad,
          ww,
          hh,
          6,
          ok ? 'rgba(126,217,87,0.22)' : hot ? 'rgba(255,206,84,0.18)' : 'rgba(255,255,255,0.08)',
          ok ? '#7ed957' : hot ? '#ffce54' : 'rgba(255,255,255,0.14)',
          2,
        );
        const ch = s.demonSequence[i] === 'q' ? 'Q' : 'E';
        r.text(ch, xx + 9, py + 52, { size: hot ? 14 : 12, color: ok ? '#7ed957' : hot ? '#fff2b0' : '#cfc6e8', align: 'center', weight: '900' });
      }

      const ratio = clamp(s.demonTimerMax > 0 ? s.demonTimer / s.demonTimerMax : 0, 0, 1);
      r.roundRect(x - 62, py + 66, 124, 8, 4, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.4)', 1);
      r.roundRect(x - 60, py + 68, 120 * ratio, 4, 3, '#ff7a6a');

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#2d1c2c';
      ctx.beginPath();
      ctx.moveTo(x, py - 10);
      ctx.lineTo(x + (side === 'left' ? -24 : 24), py + 16);
      ctx.lineTo(x, py + 22);
      ctx.lineTo(x + (side === 'left' ? 18 : -18), py + 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      const demonImg = this._img('monsterFrontDemon');
      if (demonImg) {
        const baseW = 140;
        const ar = demonImg.height / Math.max(1, demonImg.width);
        const w2 = baseW * (1 + flash * 0.08);
        const h2 = w2 * ar;
        this._drawSpriteRotated(demonImg, x, demonY, w2, h2, 0, 0.28 + (flash > 0 ? 0.08 : 0), side === 'left');
        if (flash > 0) {
          ctx.save();
          ctx.translate(x, demonY);
          if (side === 'left') ctx.scale(-1, 1);
          ctx.globalAlpha = 0.35 * flash;
          ctx.globalCompositeOperation = 'source-atop';
          ctx.fillStyle = 'rgba(255,122,106,0.95)';
          ctx.fillRect(-w2 / 2, -h2 / 2, w2, h2);
          ctx.restore();
        }
      } else {
        const demonA = 0.22 + (flash > 0 ? 0.1 : 0);
        ctx.globalAlpha = demonA;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.beginPath();
        ctx.moveTo(x, demonY - 18);
        ctx.lineTo(x + (side === 'left' ? -26 : 26), demonY + 18);
        ctx.lineTo(x, demonY + 12);
        ctx.lineTo(x + (side === 'left' ? 18 : -18), demonY + 18);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.35;
        r.circle(x - 8, demonY - 2, 3, '#ffce54');
        r.circle(x + 8, demonY - 2, 3, '#ffce54');
      }
      ctx.restore();
    }

    if (!s.frontDemonActive && s.demonDefeatTimer > 0 && s.demonDefeatSide) {
      const side = s.demonDefeatSide;
      const sign = side === 'left' ? -1 : 1;
      const x0 = side === 'left' ? 330 : 630;
      const y0 = 220;
      const k = clamp(s.demonDefeatTimer / 0.65, 0, 1);
      const p = 1 - k;
      const x = x0 + sign * (40 + p * 180);
      const y = y0 - p * (60 + p * 60);
      ctx.save();
      const demonImg = this._img('monsterFrontDemon');
      if (demonImg) {
        const baseW = 140;
        const ar = demonImg.height / Math.max(1, demonImg.width);
        const w2 = baseW * (0.9 + p * 0.35);
        const h2 = w2 * ar;
        this._drawSpriteRotated(demonImg, x, y, w2, h2, 0, 0.32 * k, side === 'left');
      } else {
        ctx.globalAlpha = 0.28 * k;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.beginPath();
        ctx.moveTo(x, y - 16);
        ctx.lineTo(x + sign * 26, y + 16);
        ctx.lineTo(x, y + 10);
        ctx.lineTo(x + sign * -18, y + 16);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 0.18 * k;
      r.circle(x, y, 24 + p * 18, 'rgba(255,206,84,0.65)');
      ctx.restore();
    }

    const t = this.g.t;
    const v = this._rearMonsterVisual(s, t);
    const distRatio = v.distRatio;
    const near = v.nearV;

    const riverTop = TOP_HUD_H;
    const riverH = GAME.height - TOP_HUD_H - BOTTOM_HUD_H;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, riverTop, GAME.width, riverH);
    ctx.clip();

    const mx = cx + Math.sin(t * 1.1) * (10 + near * 8);
    const my = v.centerY;
    const r0 = v.radius;

    const far = distRatio > 0.55;
    const mid = distRatio <= 0.55 && distRatio > 0.25;
    const danger = distRatio <= 0.25 && distRatio > 0.12;
    const critical = distRatio <= 0.12;
    const rearImg = this._img('monsterRear');
    if (rearImg) {
      const baseW = 170 * (0.58 + near * 0.92);
      const ar = rearImg.height / Math.max(1, rearImg.width);
      const w2 = baseW;
      const h2 = w2 * ar;
      const a = far ? 0.22 : 0.28 + near * 0.6;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.drawImage(rearImg, mx - w2 / 2, my - h2 / 2, w2, h2);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = far ? 0.12 : 0.12 + near * 0.22;
      r.circle(mx + Math.sin(t * 0.7) * 6, my + 10 + r0 * 0.6, r0 * (1.25 + near * 0.5), 'rgba(10,8,18,0.85)');
      ctx.restore();

      if (!far) {
        const bodyAlpha = 0.22 + near * 0.75;
        ctx.save();
        ctx.globalAlpha = bodyAlpha;
        r.circle(mx, my, r0 * (0.92 + near * 0.42), 'rgba(20,14,28,0.6)');
        r.circle(mx, my, r0 * (0.78 + near * 0.38), '#2d1c2c');
        ctx.restore();
      }
    }

    const eyeY = clamp(v.topY + 6 + near * 4 + Math.sin(t * 3.2) * 1.2, riverTop + 2, v.riverBottom - 2);
    const eyeDx = 7 + near * 5;
    const eyeR = 2.6 + near * 1.8;
    ctx.save();
    const eyeGlow = critical ? 0.7 + 0.3 * Math.sin(t * 14) : danger ? 0.55 + 0.25 * Math.sin(t * 10) : 1;
    ctx.globalAlpha = (far ? 0.18 : 0.25 + near * 0.75) * eyeGlow;
    const eyeCol = critical ? '#ff7a6a' : danger ? '#ffce54' : '#ffce54';
    r.circle(mx - eyeDx, eyeY, eyeR + (critical ? 1 : 0), eyeCol);
    r.circle(mx + eyeDx, eyeY, eyeR + (critical ? 1 : 0), eyeCol);
    ctx.restore();

    const splash = Math.max(0, near - 0.18);
    if (splash > 0.01) {
      ctx.save();
      ctx.globalAlpha = 0.08 + splash * 0.22;
      const n = 4 + Math.floor(splash * 12);
      for (let i = 0; i < n; i++) {
        const k = t * 9 + i * 1.7;
        const ox = Math.sin(k * 2.2) * (8 + splash * 22);
        const oy = Math.cos(k * 1.7) * (3 + splash * 10);
        r.circle(mx + ox, eyeY + 12 + oy, 2 + splash * 4, 'rgba(189,239,255,0.95)');
      }
      ctx.restore();
    }

    if (distRatio < 0.25) {
      const k = clamp((0.25 - distRatio) / 0.25, 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.06 + k * 0.14;
      r.rect(0, riverTop, GAME.width, riverH, 'rgba(0,0,0,0.85)');
      ctx.restore();

      ctx.save();
      const pulse = 0.7 + 0.3 * Math.sin(t * (critical ? 12 : 8));
      ctx.globalAlpha = (0.08 + k * 0.2) * pulse;
      const boat = this._boatPose(s, t);
      r.circle(boat.cx, boat.cy, 280, 'rgba(255,122,106,0.35)');
      ctx.restore();

      const boat2 = this._boatPose(s, t);
      const tail = this._rotatePoint(-boat2.drawW * 0.54, 0, boat2.rot);
      const tailX = boat2.cx + tail.x;
      const tailY = boat2.cy + tail.y;
      ctx.save();
      ctx.globalAlpha = 0.12 + k * 0.22;
      const m = 6 + Math.floor(k * 10);
      for (let i = 0; i < m; i++) {
        const kk = t * 10 + i * 2.4;
        const ox = Math.sin(kk * 2.1) * (18 + k * 26);
        const oy = Math.cos(kk * 1.4) * (5 + k * 10);
        r.circle(tailX + ox, tailY + oy, 2 + k * 4, 'rgba(189,239,255,0.95)');
      }
      ctx.restore();
    }

    const remain = Math.max(0, TUNING.roundSeconds - s.elapsed);
    if (remain <= 10) {
      const k = clamp((10 - remain) / 10, 0, 1);
      const pulse = 0.7 + 0.3 * Math.sin(t * 9);
      ctx.save();
      ctx.globalAlpha = (0.04 + k * 0.12) * pulse;
      r.rect(0, riverTop, GAME.width, riverH, 'rgba(0,0,0,0.85)');
      ctx.restore();
    }

    ctx.restore();
  }

  _drawBoat(r, s) {
    const ctx = r.ctx;
    const t = this.g.t;
    const boat = this._boatPose(s, t);
    const cx = boat.cx;
    const cy = boat.cy;
    const boatImg = this._img('boat');
    const hullW = boat.drawW;
    const hullH = boat.drawH;
    const distRatio = this._monsterDistRatio(s);
    const trembleK = distRatio < 0.25 ? clamp((0.25 - distRatio) / 0.25, 0, 1) : 0;
    const tremble = trembleK > 0 ? (0.6 + trembleK * 1.8) * Math.sin(t * (10 + trembleK * 8)) : 0;
    const jK = s.boatJoltTimer > 0 ? clamp(s.boatJoltTimer / 0.18, 0, 1) : 0;
    const joltX = jK > 0 ? s.boatJoltX * (0.4 + 0.6 * jK) : 0;
    const joltY = jK > 0 ? s.boatJoltY * (0.3 + 0.7 * jK) : 0;

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx + joltX * 0.6, cy + hullW * 0.22 + joltY * 0.6, hullH * 0.58, hullH * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx + joltX, cy + joltY + tremble);
    ctx.rotate(boat.rot);
    if (boatImg) {
      const prevSmooth = ctx.imageSmoothingEnabled;
      ctx.save();
      ctx.globalAlpha = 0.98;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(boatImg, -hullW / 2, -hullH / 2, hullW, hullH);
      ctx.restore();
      ctx.imageSmoothingEnabled = prevSmooth;
    } else {
      r.roundRect(-hullW / 2, -hullH / 2, hullW, hullH, 26, PAL.wood0, PAL.outline, 3);
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = PAL.wood2;
      ctx.beginPath();
      ctx.moveTo(hullW / 2 + 10, 0);
      ctx.lineTo(hullW / 2 - 14, 42);
      ctx.lineTo(hullW / 2 - 14, -42);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-hullW / 2 - 10, 0);
      ctx.lineTo(-hullW / 2 + 14, 38);
      ctx.lineTo(-hullW / 2 + 14, -38);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      r.roundRect(-hullW / 2 + 20, -hullH / 2 + 18, hullW - 40, hullH - 36, 18, 'rgba(10,8,18,0.26)', 'rgba(0,0,0,0.25)', 2);
      ctx.save();
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 5; i++) {
        const xx = -hullW / 2 + 26 + i * 14;
        r.roundRect(xx, -hullH / 2 + 26, 8, hullH - 52, 4, 'rgba(255,255,255,0.08)', null, 1);
      }
      ctx.restore();
    }

    const waterRatio = clamp(s.waterLevel / TUNING.water.max, 0, 1);
    if (waterRatio > 0.01) {
      const innerLen = hullW - 52;
      const innerWid = hullH - 44;
      const wl = innerLen * waterRatio;
      const wx = -hullW / 2 + 26;
      const wy = -innerWid / 2;
      r.roundRect(wx, wy, wl, innerWid, 14, 'rgba(30,107,156,0.75)', null, 2);
      const slosh = (0.8 + waterRatio * 4.2) * Math.sin(t * (4.8 + waterRatio * 4) + s.boatSpeed * 0.06);
      const edge = wx + wl - 6 + Math.sin(t * 6.2) * (2 + waterRatio * 4) + Math.sin(t * 3.1) * (1.2 + waterRatio * 3) + slosh;
      ctx.save();
      ctx.globalAlpha = 0.28 + waterRatio * 0.22;
      ctx.strokeStyle = 'rgba(189,239,255,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(edge, wy + 10);
      ctx.quadraticCurveTo(edge - 5, 0, edge, wy + innerWid - 10);
      ctx.stroke();
      ctx.restore();
    }

    this._drawBoatDamage(r, -hullW / 2, -hullH / 2, hullW, hullH, waterRatio);
    this._drawBoatActions(r, s, hullW, hullH);
    ctx.restore();

    const shaX = cx - 25;
    const shaY = cy + 25;
    const tangX = cx + 25;
    const tangY = cy - 30;
    this._drawShaSeng(r, shaX, shaY, s);
    this._drawTangSeng(r, tangX, tangY, s);

    if (waterRatio > 0.82) {
      const blink = 0.4 + 0.6 * Math.sin(t * 10);
      r.text('积水过高！', cx, cy + 58, {
        size: 12,
        color: `rgba(255,122,106,${0.55 + blink * 0.45})`,
        align: 'center',
        weight: '900',
        shadow: 'rgba(0,0,0,0.75)',
      });
    }
  }

  _drawBoatActions(r, s, hullW, hullH) {
    const ctx = r.ctx;
    const aRow = s.actionMode === 'rowing' ? clamp(s.rowFeedbackTimer / TUNING.action.feedbackSeconds, 0, 1) : 0;
    if (aRow > 0.01) {
      const side = s.lastRowKey === 'left' ? -1 : 1;
      const k = 1 - aRow;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#b9a47a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-hullW * 0.12 + k * 6, side * (hullH / 2 - 18));
      ctx.lineTo(-hullW * 0.26 - k * 10, side * (hullH / 2 + 58 + k * 18));
      ctx.stroke();
      ctx.strokeStyle = '#7a6b52';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-hullW * 0.26 - k * 10, side * (hullH / 2 + 58 + k * 18));
      ctx.lineTo(-hullW * 0.3 - k * 14, side * (hullH / 2 + 82 + k * 24));
      ctx.stroke();
      ctx.restore();
    }

    if (s.actionMode === 'bailing') {
      const a = clamp(s.actionLockTimer / TUNING.action.bailingSeconds, 0, 1);
      const k = 1 - a;
      ctx.save();
      ctx.globalAlpha = 0.55 + k * 0.35;
      r.roundRect(-hullW * 0.06 + k * 6, hullH / 2 - 54, 22, 14, 6, 'rgba(245,239,224,0.8)', 'rgba(0,0,0,0.25)', 2);
      ctx.strokeStyle = 'rgba(189,239,255,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-hullW * 0.06 + 20 + k * 6, hullH / 2 - 34, 16, -0.2, Math.PI + 0.1);
      ctx.stroke();
      ctx.restore();
    }

    if (s.actionMode === 'attacking') {
      const a = clamp(s.actionLockTimer / TUNING.action.attackingSeconds, 0, 1);
      const k = 1 - a;
      ctx.save();
      ctx.globalAlpha = 0.25 + k * 0.45;
      ctx.strokeStyle = 'rgba(255,206,84,0.75)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(hullW / 2 + 10, 0, 28 + k * 18, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawBoatDamage(r, x0, y0, w, h, waterRatio) {
    const ctx = r.ctx;
    const dmg = clamp(waterRatio * 1.1, 0, 1);
    if (dmg <= 0.02) return;
    const glow = 0.25 + 0.35 * Math.sin(this.g.t * 10);
    ctx.save();
    ctx.globalAlpha = 0.5 + dmg * 0.35;
    ctx.strokeStyle = `rgba(255,120,106,${0.2 + glow * 0.25})`;
    ctx.lineWidth = 2;
    const cracks = 2 + Math.floor(dmg * 3);
    for (let i = 0; i < cracks; i++) {
      const sx = x0 + 30 + i * 38 + this._noise1D(i * 3.2, 401) * 10;
      const sy = y0 + 34 + this._noise1D(i * 2.1, 409) * 12;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 32 + this._noise1D(i * 1.3 + 1, 419) * 18, sy + 10 + this._noise1D(i * 1.3 + 2, 421) * 12);
      ctx.lineTo(sx + 62 + this._noise1D(i * 1.3 + 3, 431) * 18, sy - 4 + this._noise1D(i * 1.3 + 4, 433) * 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawShaSeng(r, x, y, s) {
    const ctx = r.ctx;
    const acting = (s.actionMode === 'rowing' && s.rowFeedbackTimer > 0) || s.actionMode === 'attacking';
    const img = this._img(acting ? 'shasengAction' : 'shasengIdle') || this._img('shasengIdle');
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.98;

    if (img) {
      const w = 84;
      const h = w * (img.height / Math.max(1, img.width));
      const baseY = 44;
      ctx.save();
      ctx.globalAlpha = 0.22;
      r.circle(0, baseY - 2, 14, 'rgba(0,0,0,0.4)');
      ctx.restore();
      ctx.drawImage(img, -w / 2, -h + baseY, w, h);
      ctx.restore();
      return;
    }

    r.circle(0, 30, 10, 'rgba(0,0,0,0.18)');
    r.rect(-7, 10, 14, 22, PAL.teal0);
    r.rect(-9, 18, 18, 16, PAL.teal1);
    r.circle(0, 6, 12, PAL.skin);
    r.circle(-4, 4, 2, PAL.ink);
    r.circle(4, 4, 2, PAL.ink);
    r.rect(-4, 10, 8, 2, 'rgba(20,14,28,0.6)');

    if (s.actionMode === 'rowing' && s.rowFeedbackTimer > 0) {
      const a = clamp(s.rowFeedbackTimer / TUNING.action.feedbackSeconds, 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.2 + (1 - a) * 0.5;
      r.roundRect(-24, 34, 48, 10, 6, 'rgba(126,217,87,0.25)', '#7ed957', 2);
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = '#7a6b52';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, 8);
    ctx.lineTo(-18, 40);
    ctx.stroke();
    r.circle(-18, 6, 4, '#b9a47a');
    ctx.restore();

    ctx.restore();
  }

  _drawTangSeng(r, x, y, s) {
    const ctx = r.ctx;
    const panic = clamp((s.monkFear - 55) / 45, 0, 1);
    const calm = s.monkCalmTimer > 0 ? clamp(s.monkCalmTimer / 1.2, 0, 1) : 0;
    const panicV = clamp(panic * (1 - calm * 0.85), 0, 1);
    const jx = this._noise1D(this.g.t * 14, 71) * (0.35 + panicV * 2);
    const jy = this._noise1D(this.g.t * 18, 79) * (0.28 + panicV * 1.6);
    const panicState = s.dialogueActive || panicV > 0.25 || this._monsterDistRatio(s) < 0.25 || s.waterLevel > 70;
    const img = this._img(panicState ? 'tangsengPanic' : 'tangsengIdle') || this._img('tangsengIdle');

    ctx.save();
    ctx.translate(x + jx, y + jy);
    ctx.globalAlpha = 0.98;

    if (img) {
      const w = 86;
      const h = w * (img.height / Math.max(1, img.width));
      const baseY = 44;
      ctx.save();
      ctx.globalAlpha = 0.22;
      r.circle(0, baseY - 2, 14, 'rgba(0,0,0,0.4)');
      ctx.restore();
      ctx.drawImage(img, -w / 2, -h + baseY, w, h);

      if (calm > 0.01) {
        const blink = 0.45 + 0.55 * Math.sin(this.g.t * 8);
        ctx.save();
        ctx.globalAlpha = 0.14 + calm * 0.22 * blink;
        r.circle(0, -h + baseY + 34, 20 + calm * 10, 'rgba(255,206,84,0.55)');
        ctx.restore();
      }

      this._drawPanicEffects(r, 0, -h + baseY + 32, panicV);

      if (s.dialogueActive) {
        const n = s.dialogueSequence.length;
        const done = s.dialogueInput.length;
        const w2 = 22 * n + 18;
        r.roundRect(-w2 / 2, -h + baseY - 58, w2, 30, 10, 'rgba(10,8,18,0.78)', '#ffce54', 2);
        for (let i = 0; i < n; i++) {
          const xx = -w2 / 2 + 10 + i * 22;
          const hot = i === done;
          const ok = i < done;
          r.roundRect(xx, -h + baseY - 50, 18, 18, 6, ok ? 'rgba(126,217,87,0.22)' : hot ? 'rgba(255,206,84,0.18)' : 'rgba(255,255,255,0.08)', ok ? '#7ed957' : hot ? '#ffce54' : 'rgba(255,255,255,0.14)', 2);
          r.text(String(s.dialogueSequence[i]), xx + 9, -h + baseY - 36, { size: 12, color: ok ? '#7ed957' : hot ? '#fff2b0' : '#cfc6e8', align: 'center', weight: '900' });
        }
        const ratio = clamp(s.dialogueTimer / TUNING.dialogue.maxSeconds, 0, 1);
        r.roundRect(-w2 / 2 + 6, -h + baseY - 32, w2 - 12, 6, 3, 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.35)', 1);
        r.roundRect(-w2 / 2 + 6, -h + baseY - 32, (w2 - 12) * ratio, 6, 3, '#ffce54');
      }

      ctx.restore();
      return;
    }

    r.circle(0, 30, 10, 'rgba(0,0,0,0.18)');
    r.rect(-8, 10, 16, 22, PAL.robeRed);
    r.rect(-11, 18, 22, 16, PAL.robeGold);
    r.circle(0, 6, 12, PAL.skin);
    r.circle(-4, 4, 2, PAL.ink);
    r.circle(4, 4, 2, PAL.ink);
    r.rect(-5, 12, 10, 2, 'rgba(20,14,28,0.65)');
    r.rect(-2, 18, 4, 10, 'rgba(245,239,224,0.8)');
    r.rect(-6, 20, 4, 8, 'rgba(245,239,224,0.8)');
    r.rect(2, 20, 4, 8, 'rgba(245,239,224,0.8)');

    if (calm > 0.01) {
      const blink = 0.45 + 0.55 * Math.sin(this.g.t * 8);
      ctx.save();
      ctx.globalAlpha = 0.14 + calm * 0.22 * blink;
      r.circle(0, 6, 20 + calm * 10, 'rgba(255,206,84,0.55)');
      ctx.restore();
    }

    this._drawPanicEffects(r, 0, 0, panicV);

    if (s.dialogueActive) {
      const n = s.dialogueSequence.length;
      const done = s.dialogueInput.length;
      const w = 22 * n + 18;
      r.roundRect(-w / 2, -50, w, 30, 10, 'rgba(10,8,18,0.78)', '#ffce54', 2);
      for (let i = 0; i < n; i++) {
        const xx = -w / 2 + 10 + i * 22;
        const hot = i === done;
        const ok = i < done;
        r.roundRect(xx, -42, 18, 18, 6, ok ? 'rgba(126,217,87,0.22)' : hot ? 'rgba(255,206,84,0.18)' : 'rgba(255,255,255,0.08)', ok ? '#7ed957' : hot ? '#ffce54' : 'rgba(255,255,255,0.14)', 2);
        r.text(String(s.dialogueSequence[i]), xx + 9, -28, { size: 12, color: ok ? '#7ed957' : hot ? '#fff2b0' : '#cfc6e8', align: 'center', weight: '900' });
      }
      const ratio = clamp(s.dialogueTimer / TUNING.dialogue.maxSeconds, 0, 1);
      r.roundRect(-w / 2 + 6, -24, w - 12, 6, 3, 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.35)', 1);
      r.roundRect(-w / 2 + 6, -24, (w - 12) * ratio, 6, 3, '#ffce54');
    }

    ctx.restore();
  }

  _drawPanicEffects(r, x, y, panic) {
    const ctx = r.ctx;
    if (panic <= 0.01) return;

    const blink = 0.35 + 0.65 * Math.sin(this.g.t * (8 + panic * 6));
    ctx.save();
    ctx.globalAlpha = 0.7 + blink * 0.3;
    r.text('！', x, y - 12, { size: 22, color: '#ff7a6a', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.8)' });
    ctx.restore();

    const sweat = 1 + Math.floor(panic * 3);
    ctx.save();
    ctx.globalAlpha = 0.45 + 0.35 * blink;
    for (let i = 0; i < sweat; i++) {
      const sx = 12 + i * 4 + this._noise1D(this.g.t * 5 + i, 101) * 2;
      const sy = 6 + i * 3 + this._noise1D(this.g.t * 6 + i, 109) * 2;
      r.circle(x + sx, y + sy, 3, 'rgba(189,239,255,0.85)');
      r.rect(x + sx - 1, y + sy + 2, 2, 6, 'rgba(189,239,255,0.65)');
    }
    ctx.restore();
  }

  _drawBottomHud(r, s) {
    const y0 = GAME.height - BOTTOM_HUD_H;
    const distRatio = this._monsterDistRatio(s);
    const waterRatio = clamp(s.waterLevel / TUNING.water.max, 0, 1);
    const fearRatio = clamp(s.monkFear / TUNING.fear.max, 0, 1);
    const rowHot = !s.dialogueActive && distRatio < 0.4;
    const bailHot = !s.dialogueActive && (s.waveActive || waterRatio > 0.55);
    const comfortHot = s.dialogueActive || (!s.frontDemonActive && fearRatio > 0.82);
    const attackHot = s.frontDemonActive;

    const msg = this.messageTimer > 0 ? this.message : '';
    if (msg) {
      r.roundRect(160, y0 + 10, 640, 34, 10, 'rgba(10,8,18,0.82)', PAL.gold, 2);
      r.text(msg, GAME.width / 2, y0 + 33, { size: 14, color: '#fff2b0', align: 'center', weight: '900' });
    }

    const y = y0 + 78;
    const rowState = s.dialogueActive ? 'off' : s.frontDemonActive ? 'weak' : 'on';
    const bailState = s.dialogueActive ? 'off' : s.frontDemonActive ? 'weak' : 'on';
    const comfortState = s.dialogueActive ? 'on' : 'off';
    const attackState = s.frontDemonActive ? 'on' : 'off';
    this._drawKeySeg(r, 26, y, 'A/D', '划船', rowHot, rowState, rowState === 'weak' ? '弱' : '');
    this._drawKeySeg(r, 250, y, 'Space', '舀水', bailHot, bailState, s.bailCooldownTimer > 0 ? '冷却' : bailState === 'weak' ? '弱' : '');
    this._drawKeySeg(r, 470, y, '1/2', '安抚', comfortHot, comfortState, '');
    this._drawKeySeg(r, 660, y, 'Q/E', '击退', attackHot, attackState, '');
    r.text('P/Esc：暂停', GAME.width - 18, y, { size: 13, color: '#9a90b8', align: 'right', weight: '800' });
  }

  _drawKeySeg(r, x, y, key, label, hot, state, tag) {
    const ctx = r.ctx;
    const blink = 0.5 + 0.5 * Math.sin(this.g.t * 7);
    const enabled = state !== 'off';
    const weak = state === 'weak';
    const a = enabled ? (weak ? 0.65 : 1) : 0.28;
    const kCol = hot ? '#ffce54' : enabled ? '#9a90b8' : '#5d5770';
    const tCol = hot ? '#fff2b0' : enabled ? '#cfc6e8' : '#5d5770';
    ctx.save();
    ctx.globalAlpha = a;
    r.text(key, x, y, { size: 14, color: kCol, weight: '900' });
    r.text(label, x + 58, y, { size: 14, color: tCol, weight: '900' });
    if (tag) r.text(tag, x + 112, y, { size: 12, color: enabled ? '#9fd0ff' : '#5d5770', weight: '900' });
    else if (hot) r.text('现在', x + 112, y, { size: 12, color: `rgba(255,206,84,${0.35 + blink * 0.55})`, weight: '900' });
    ctx.restore();
  }

  _drawHintCard(r, x, y, w, h, key, label, hot) {
    const ctx = r.ctx;
    const blink = 0.5 + 0.5 * Math.sin(this.g.t * 7);
    const a = hot ? 0.16 + blink * 0.12 : 0.06;
    r.roundRect(x, y, w, h, 10, `rgba(255,206,84,${a})`, hot ? '#ffce54' : 'rgba(255,255,255,0.12)', 2);
    r.text(key, x + 30, y + 23, { size: 16, color: hot ? '#fff2b0' : '#cfc6e8', align: 'center', weight: '900' });
    r.text(label, x + 58, y + 23, { size: 14, color: hot ? '#fff2b0' : '#cfc6e8', align: 'left', weight: '900' });
    if (hot) {
      ctx.save();
      ctx.globalAlpha = 0.35 + blink * 0.35;
      r.text('现在！', x + w - 28, y + 23, { size: 12, color: '#ffce54', align: 'center', weight: '900' });
      ctx.restore();
    }
  }

  _drawMainPrompt(r, s) {
    const prompt = this._getMainPrompt(s);
    if (!prompt) return;
    const blink = 0.5 + 0.5 * Math.sin(this.g.t * 8);
    const y = TOP_HUD_H + 6;
    r.roundRect(GAME.width / 2 - 300, y, 600, 38, 12, `rgba(10,8,18,${0.58 + blink * 0.12})`, '#ffce54', 2);
    r.text(prompt, GAME.width / 2, y + 25, { size: 16, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
  }

  _getMainPrompt(s) {
    const distRatio = this._monsterDistRatio(s);
    const waterRatio = clamp(s.waterLevel / TUNING.water.max, 0, 1);
    const fearRatio = clamp(s.monkFear / TUNING.fear.max, 0, 1);
    if (!s.dialogueActive) {
      if (distRatio < 0.12) return '水怪极近！A/D 交替划船！';
      if (waterRatio > 0.9) return '进水过高！连点 Space 舀水！';
      if (fearRatio > 0.9) return '唐僧惊慌！等提示按 1/2！';
    }
    if (s.dialogueActive) {
      const need = s.dialogueSequence[s.dialogueInput.length];
      return `安抚！按 1 / 2（先按 ${need}）`;
    }
    if (s.frontDemonActive) {
      const need = s.demonSequence[s.demonIndex] === 'q' ? 'Q' : 'E';
      if (distRatio < 0.12) return '水怪逼近！先 A/D 交替！';
      if (waterRatio > 0.9) return '进水过高！先连点 Space！';
      return `妖怪！按 Q / E（先按 ${need}）`;
    }
    if (distRatio < 0.25) return '水怪逼近！A/D 交替划船！';
    if (waterRatio > 0.82) return '进水过高！连点 Space 舀水！';
    if (fearRatio > 0.82) return '唐僧惊慌！等提示按 1/2！';
    if (s.waveActive) return `${this._sideLabel(s.waveSide)}水浪预警！准备 Space！`;
    if (s.waterLevel > 55) return '船舱进水！连点 Space 舀水！';
    if (distRatio < 0.4) return '保持划船！A/D 交替更快';
    if (this.messageTimer > 0) return null;
    return '护送唐僧渡河：划船、舀水、安抚、击退！';
  }

  _drawPause(r) {
    r.rect(0, 0, GAME.width, GAME.height, 'rgba(5,4,10,0.62)');
    r.text('暂停', GAME.width / 2, GAME.height / 2 - 8, { size: 46, color: '#ffce54', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    r.text('按 P / Esc 继续', GAME.width / 2, GAME.height / 2 + 34, { size: 16, color: '#cfc6e8', align: 'center', weight: '700' });
  }

  _drawFailed(r) {
    r.rect(0, 0, GAME.width, GAME.height, 'rgba(5,4,10,0.7)');
    const reason = this.result?.reason;
    const title = reason === 'monster' ? '水怪追上破船！' : reason === 'water' ? '破船沉没了！' : '唐僧惊慌过度！';
    r.text(title, GAME.width / 2, GAME.height / 2 - 44, { size: 44, color: '#ff7a6a', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    const tip = reason === 'monster'
      ? '建议：A/D 要交替，不要一直按同一边。'
      : reason === 'water'
        ? '建议：水浪命中后立刻连点 Space 舀水。'
        : '建议：出现 1/2 序列时优先完成安抚。';
    r.text(tip, GAME.width / 2, GAME.height / 2 + 16, { size: 14, color: '#fff2b0', align: 'center', weight: '800' });
    const s = this.state;
    const lines = [
      `水怪距离：${Math.round(s.monsterDistance)} / ${TUNING.monster.startDistance}`,
      `进水值：${Math.round(s.waterLevel)} / ${TUNING.water.max}`,
      `惊慌值：${Math.round(s.monkFear)} / ${TUNING.fear.max}`,
    ];
    lines.forEach((ln, i) => {
      r.text(ln, GAME.width / 2, GAME.height / 2 + 42 + i * 18, { size: 13, color: '#cfc6e8', align: 'center', weight: '800' });
    });
    const st = s.stats || {};
    const perf = `最大连击 ${st.maxCombo || 0}｜舀水 ${st.bails || 0}｜安抚 ${st.dialogueSuccess || 0}｜击退 ${st.demonHit || 0}`;
    r.text(perf, GAME.width / 2, GAME.height / 2 + 100, { size: 12, color: '#9a90b8', align: 'center', weight: '800' });
    r.text('Space / Enter：重新挑战', GAME.width / 2, GAME.height / 2 + 136, { size: 16, color: '#fff2b0', align: 'center', weight: '900' });
    r.text('Esc：返回开始界面', GAME.width / 2, GAME.height / 2 + 162, { size: 14, color: '#cfc6e8', align: 'center', weight: '700' });
  }

  _drawSuccess(r) {
    r.rect(0, 0, GAME.width, GAME.height, 'rgba(5,4,10,0.7)');
    r.text('冲出流沙河！', GAME.width / 2, GAME.height / 2 - 62, { size: 44, color: '#ffce54', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    const s = this.state;
    r.text('展示面板', GAME.width / 2, GAME.height / 2 - 18, { size: 14, color: '#cfc6e8', align: 'center', weight: '900' });
    const score = this.result?.score ?? this._computeScore();
    const rank = this.result?.rank ?? this._getRank(score);
    r.text(`评分 ${score}   ${rank.grade} · ${rank.title}`, GAME.width / 2, GAME.height / 2 + 12, { size: 16, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.65)' });
    const lines = [
      `剩余距离：${Math.round(s.monsterDistance)} / ${TUNING.monster.startDistance}`,
      `船舱进水：${Math.round(s.waterLevel)} / ${TUNING.water.max}`,
      `唐僧惊慌：${Math.round(s.monkFear)} / ${TUNING.fear.max}`,
    ];
    lines.forEach((ln, i) => {
      r.text(ln, GAME.width / 2, GAME.height / 2 + 40 + i * 18, { size: 13, color: '#cfc6e8', align: 'center', weight: '800' });
    });
    const st = s.stats || {};
    const perf = [
      `最大划船连击：${st.maxCombo || 0}（同边 ${st.sameKey || 0}）`,
      `成功安抚次数：${st.dialogueSuccess || 0}（失败 ${st.dialogueFail || 0}）`,
      `击退妖怪次数：${st.demonHit || 0}（失误 ${st.demonMiss || 0}）`,
      `舀水次数：${st.bails || 0}（水浪命中 ${st.waveHits || 0}）`,
    ];
    perf.forEach((ln, i) => {
      r.text(ln, GAME.width / 2, GAME.height / 2 + 100 + i * 18, { size: 12, color: '#9a90b8', align: 'center', weight: '800' });
    });
    r.text('Space / Enter：重新挑战', GAME.width / 2, GAME.height / 2 + 182, { size: 16, color: '#fff2b0', align: 'center', weight: '900' });
    r.text('Esc：返回开始界面', GAME.width / 2, GAME.height / 2 + 208, { size: 14, color: '#cfc6e8', align: 'center', weight: '700' });
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

    r.text('流沙河：破船惊魂', GAME.width / 2, y + 56, { size: 34, color: '#ffce54', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    r.text(`目标：撑过 ${TUNING.roundSeconds} 秒，不让水怪追上！`, GAME.width / 2, y + 96, { size: 16, color: '#fff2b0', align: 'center', weight: '900' });

    const left = x + 92;
    const top = y + 140;
    const items = [
      ['A / D', '交替划船（核心）'],
      ['Space', '连点舀水'],
      ['1 / 2', '顺序安抚'],
      ['Q / E', '击退前方妖怪'],
    ];
    items.forEach((it, i) => {
      const iy = top + i * 42;
      r.roundRect(left, iy - 20, 100, 34, 10, 'rgba(20,14,28,0.85)', 'rgba(255,255,255,0.14)', 1);
      r.text(it[0], left + 50, iy + 2, { size: 16, color: '#fff2b0', align: 'center', weight: '900' });
      r.text(it[1], left + 122, iy + 2, { size: 15, color: '#cfc6e8', align: 'left', weight: '800' });
    });

    r.text('提示：先拉开水怪距离，再处理危机！', GAME.width / 2, y + h - 72, { size: 15, color: '#cfc6e8', align: 'center', weight: '900' });
    const remain = Math.ceil(this.introTimer);
    const blink = 0.45 + 0.55 * Math.sin(this.g.t * 6);
    ctx.save();
    ctx.globalAlpha = 0.45 + blink * 0.55;
    r.text(`${remain} 秒后开始 / 按 Space 立即开始`, GAME.width / 2, y + h - 34, { size: 16, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.7)' });
    ctx.restore();
  }

  _noise1D(x, seed = 0) {
    const i = Math.floor(x);
    const f = x - i;
    const a = this._hashToUnit(i + seed * 101);
    const b = this._hashToUnit(i + 1 + seed * 101);
    const u = f * f * (3 - 2 * f);
    return (a + (b - a) * u) * 2 - 1;
  }

  _hashToUnit(n) {
    let x = n | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  }
}
