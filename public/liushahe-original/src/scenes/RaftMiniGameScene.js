import { GAME, PAL, TUNING } from '../config.js';
import { clamp } from '../engine/utils.js';
import { TANGSENG, SHASENG, characterFrame, drawCharacter } from '../sprites/partySprites.js';

const TOP_HUD_H = 80;
const BOTTOM_HUD_H = 104;
const BOAT_CY = 315;
const BOAT_HULL_H = 96;
const DEMON_ROW_FACTOR = 0.42;
const DEMON_BAIL_FACTOR = 0.55;
const WAVE_BUILD_FRAC = 0.45;
const WAVE_IMPACT_SECONDS = 0.5;

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
      distGlowTimer: 0,
      distHintCooldown: 0,

      waterLevel: 0,
      bailCooldownTimer: 0,
      bailPraiseCooldown: 0,
      waterSloshTimer: 0,
      waveActive: false,
      waveSide: null,
      waveStage: null,
      waveStageTimer: 0,
      waveBuildTimer: 0,
      waveImpactTimer: 0,
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
    const baseRot = 0;
    const rowK = clamp((s.rowFeedbackTimer || 0) / (TUNING.action.feedbackSeconds || 0.35), 0, 1);
    const rowRot = s.lastRowKey ? (s.lastRowKey === 'left' ? 0.014 : -0.014) * rowK : 0;
    const idleRot = Math.sin(t * 1.3) * 0.004;
    const rot = baseRot + rowRot + idleRot;

    let drawW = 280;
    let drawH = 150;
    if (boatImg) {
      const targetW = 320;
      drawW = targetW;
      drawH = targetW * (boatImg.height / Math.max(1, boatImg.width));
      drawW = clamp(drawW, 260, 360);
      drawH = clamp(drawH, 140, 240);
    }

    const riverBottom = GAME.height - BOTTOM_HUD_H;
    const halfH = drawH / 2;
    const overflow = baseCy + halfH - (riverBottom - 8);
    const cy = overflow > 0 ? baseCy - overflow : baseCy;

    const baseFwd = { x: 0.78, y: -0.62 };
    const baseRight = { x: -baseFwd.y, y: baseFwd.x };
    const fwd = this._rotatePoint(baseFwd.x, baseFwd.y, rot);
    const right = this._rotatePoint(baseRight.x, baseRight.y, rot);
    const len = drawW * 0.46;
    const wid = drawH * 0.42;
    const bowX = cx + fwd.x * len;
    const bowY = cy + fwd.y * len;
    const tailX = cx - fwd.x * len;
    const tailY = cy - fwd.y * len;

    return {
      cx,
      cy,
      drawW,
      drawH,
      rot,
      fwd,
      right,
      len,
      wid,
      bowX,
      bowY,
      tailX,
      tailY,
    };
  }

  _getBoatAnchors(s, t) {
    const boat = this._boatPose(s, t);
    const back = { x: -boat.fwd.x, y: -boat.fwd.y };
    const sideOffset = boat.drawW * 0.22;
    const along = boat.len * 0.06;
    const waterline = 6;
    const leftOar = {
      x: boat.cx - sideOffset + boat.fwd.x * along,
      y: boat.cy + boat.fwd.y * along + waterline,
    };
    const rightOar = {
      x: boat.cx + sideOffset + boat.fwd.x * along,
      y: boat.cy + boat.fwd.y * along + waterline,
    };
    const center = { x: boat.cx, y: boat.cy };
    const bow = { x: boat.bowX, y: boat.bowY };
    const stern = { x: boat.tailX, y: boat.tailY };
    const sternWake = { x: stern.x + back.x * 10, y: stern.y + back.y * 10 };
    const interiorWater = {
      x: boat.cx - boat.fwd.x * 10 - boat.right.x * 10,
      y: boat.cy - boat.fwd.y * 10 - boat.right.y * 10 + 6,
    };
    const shaX = boat.cx - boat.fwd.x * 28 - boat.right.x * 18;
    const shaY = boat.cy - boat.fwd.y * 28 - boat.right.y * 18;
    const bailFrom = { x: shaX + boat.fwd.x * 2, y: shaY + boat.fwd.y * 2 + 10 };
    const preferLeft = !(s?.frontDemonActive && s?.demonSide === 'left');
    const bailSide = preferLeft ? 'left' : 'right';
    const bailTo0 = bailSide === 'left' ? leftOar : rightOar;
    const bailOut = { x: bailSide === 'left' ? -1 : 1, y: 0 };
    const bailTo = { x: bailTo0.x + bailOut.x * 74 + back.x * 10, y: bailTo0.y + 26 + back.y * 6 };
    return { boat, center, bow, stern, leftOar, rightOar, sternWake, interiorWater, bailFrom, bailTo, back };
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
    const boatBottom = boat.tailY + 18;

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
    s.distGlowTimer = Math.max(0, s.distGlowTimer - dt);
    s.distHintCooldown = Math.max(0, s.distHintCooldown - dt);
    s.waveImpactFlash = Math.max(0, s.waveImpactFlash - dt);
    s.demonHitFlash = Math.max(0, s.demonHitFlash - dt);
    s.demonWrongFlash = Math.max(0, s.demonWrongFlash - dt);
    s.actionLockTimer = Math.max(0, s.actionLockTimer - dt);
    s.speedDebuffTimer = Math.max(0, s.speedDebuffTimer - dt);
    s.bailCooldownTimer = Math.max(0, s.bailCooldownTimer - dt);
    s.bailPraiseCooldown = Math.max(0, s.bailPraiseCooldown - dt);
    s.waterSloshTimer = Math.max(0, s.waterSloshTimer - dt);
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

    const nearFull = s.monsterDistance >= T.monster.startDistance * 0.98;
    if (nearFull) s.distGlowTimer = Math.max(s.distGlowTimer, 0.65);
    if (nearFull && !same && s.distHintCooldown <= 0) {
      this._say(Math.random() < 0.5 ? '稳住节奏！' : '保持距离！', 0.9);
      s.distHintCooldown = 2.4;
    }

    const side = key === 'left' ? -1 : 1;
    const a = this._getBoatAnchors(s, this.g.t);
    const out = { x: side, y: 0 };
    const oar = side < 0 ? a.leftOar : a.rightOar;
    const sx = oar.x;
    const sy = oar.y;
    const tx = a.sternWake.x;
    const ty = a.sternWake.y;
    const boost = nearFull ? 1.25 : 1;
    const sprayN = same ? 4 : Math.round(6 * boost);
    const wakeN = same ? 6 : Math.round(9 * boost);
    this._spawnFx('spray', sx, sy, out.x * 190 * boost + a.back.x * 60, out.y * 44 + a.back.y * 60, 0.52, sprayN);
    this._spawnFx('wake', tx, ty, a.back.x * 26, a.back.y * 88 * boost, 0.6, wakeN);
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
      this._spawnFx('spray', sx, sy, out.x * (240 + v) + a.back.x * 90, out.y * 60 + a.back.y * (90 + v * 0.4), 0.6, burst);
      this._spawnFx('wake', tx, ty, a.back.x * 40, a.back.y * (110 + v), 0.6, burst);

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
    const a = this._getBoatAnchors(s, this.g.t);
    const out = { x: a.bailTo.x - a.bailFrom.x, y: a.bailTo.y - a.bailFrom.y };
    const outLen = Math.hypot(out.x, out.y) || 1;
    out.x /= outLen;
    out.y /= outLen;
    const bx = a.bailTo.x;
    const by = a.bailTo.y;
    if (s.bailCooldownTimer > 0) {
      this.fx.p.push({
        kind: 'bailSplash',
        layer: 'under',
        x: bx,
        y: by,
        vx: out.x * 10,
        vy: out.y * 10,
        life: 0.28,
        age: 0,
        r: 10,
        a0: 0.22,
      });
      this._spawnFx('spray', bx, by, out.x * 120 + a.back.x * 40, out.y * 80 + a.back.y * 40, 0.32, 3);
      return;
    }
    const prev = s.waterLevel;
    const protect = s.elapsed > 26 && s.waterLevel > 85 ? 1.03 : 1;
    s.waterLevel = Math.max(0, s.waterLevel - T.water.bailAmount * factor * protect);
    s.bailCooldownTimer = cd;
    if (s.stats) s.stats.bails += 1;
    s.waterSloshTimer = Math.max(s.waterSloshTimer, 0.38);

    this.fx.p.push({
      kind: 'bailArc',
      layer: 'boat',
      x0: a.bailFrom.x,
      y0: a.bailFrom.y,
      x1: a.bailTo.x,
      y1: a.bailTo.y,
      life: 0.34,
      age: 0,
      r: 1,
    });
    this.fx.p.push({
      kind: 'bailSplash',
      layer: 'under',
      x: bx,
      y: by,
      vx: out.x * 14,
      vy: out.y * 10,
      life: 0.5,
      age: -0.12,
      r: 20,
      a0: 0.34,
    });
    this._spawnFx('spray', bx, by, out.x * 170 + a.back.x * 50, out.y * 120 + a.back.y * 40, 0.55, 12);
    this._spawnFx('spray', a.interiorWater.x, a.interiorWater.y, out.x * 20, -90, 0.35, 4);
    const lift = clamp(prev / T.water.max, 0, 1);
    if (lift > 0.55) {
      const n = 5 + Math.floor(lift * 8);
      this._spawnFx('spray', bx, by, out.x * 120 + a.back.x * 60, out.y * 110 + a.back.y * 60, 0.55, n);
      this._spawnFx('spray', bx, by, out.x * 150 + a.back.x * 70, out.y * 130 + a.back.y * 70, 0.55, n);
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
      if (a.kind === 'bailArc') {
        if (a.age >= a.life) p.splice(i, 1);
        continue;
      }
      if (a.x != null) a.x += (a.vx || 0) * dt;
      if (a.y != null) a.y += (a.vy || 0) * dt;
      if (a.kind === 'wake') {
        a.vx *= Math.pow(0.3, dt);
        a.vy *= Math.pow(0.3, dt);
      } else if (a.kind === 'wave') {
        a.vx *= Math.pow(0.22, dt);
        a.vy *= Math.pow(0.22, dt);
      } else if (a.kind === 'bailSplash') {
        a.vx *= Math.pow(0.25, dt);
        a.vy = a.vy * Math.pow(0.3, dt) + 120 * dt;
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
    s.waveStage = 'warn';
    s.waveBuildTimer = Math.max(0.25, (T.wave.warningSeconds || 1) * WAVE_BUILD_FRAC);
    s.waveStageTimer = Math.max(0.05, (T.wave.warningSeconds || 1) - s.waveBuildTimer);
    s.waveImpactTimer = 0;
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

    if (s.waveStage === 'warn') {
      s.waveStageTimer -= dt;
      if (s.waveStageTimer <= 0) {
        s.waveStage = 'build';
        s.waveStageTimer = s.waveBuildTimer;
        const side = s.waveSide === 'left' ? -1 : 1;
        const riverTop = TOP_HUD_H + 4;
        const y = riverTop + 56 + (this._noise1D(this.g.t * 3, 811) * 10);
        this._spawnFx('wave', GAME.width / 2 + side * 260, y, -side * 160, 0, 0.7, 10);
      }
      return;
    }

    if (s.waveStage === 'build') {
      s.waveStageTimer -= dt;
      if (s.waveStageTimer <= 0) {
        s.waveStage = 'impact';
        s.waveStageTimer = WAVE_IMPACT_SECONDS;
        s.waveImpactTimer = WAVE_IMPACT_SECONDS;
        s.waveImpactFlash = 0.35;
        s.waterSloshTimer = Math.max(s.waterSloshTimer, 0.42);
        const waveMul = s.runMods?.waveMul ?? 1;
        const fearMul = s.runMods?.fearMul ?? 1;
        s.waterLevel = Math.min(T.water.max, s.waterLevel + T.water.waveAdd * waveMul);
        s.monkFear = clamp(s.monkFear + T.fear.hitByWaveAdd * fearMul, 0, T.fear.max);
        if (s.stats) s.stats.waveHits += 1;
        this._say('水浪进船！连点 Space 舀水！', 1.2);
        const side = s.waveSide === 'left' ? -1 : 1;
        const a = this._getBoatAnchors(s, this.g.t);
        const hitX = (side < 0 ? a.leftOar.x : a.rightOar.x) + side * 32;
        const hitY = (side < 0 ? a.leftOar.y : a.rightOar.y) - 10;
        this._spawnFx('wave', hitX, hitY, -side * 180, -30, 0.7, 18);
        this._spawnFx('spray', hitX - side * 12, hitY + 14, -side * 40, -120, 0.65, 16);
        this._spawnFx('wake', a.sternWake.x, a.sternWake.y, a.back.x * 40, a.back.y * 120, 0.65, 14);
      }
      return;
    }

    if (s.waveStage === 'impact') {
      s.waveStageTimer -= dt;
      s.waveImpactTimer = Math.max(0, s.waveImpactTimer - dt);
      if (s.waveStageTimer <= 0) {
        s.waveActive = false;
        s.waveStage = null;
        s.waveStageTimer = 0;
        s.waveImpactTimer = 0;
      }
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
    const sign = s.demonSide === 'left' ? -1 : 1;
    const aBoat = this._getBoatAnchors(s, this.g.t);
    const x = aBoat.center.x + aBoat.boat.fwd.x * (aBoat.boat.len * 0.65) + aBoat.boat.right.x * sign * (aBoat.boat.wid * 1.55);
    const y0 = aBoat.center.y + aBoat.boat.fwd.y * (aBoat.boat.len * 0.65) + aBoat.boat.right.y * sign * (aBoat.boat.wid * 1.55) + 14;
    const y = clamp(y0, TOP_HUD_H + 110, GAME.height - BOTTOM_HUD_H - 120);
    this._spawnFx('hit', x, y - 30, 0, -60, 0.35, 8);
    if (s.demonIndex >= s.demonSequence.length) {
      const side = s.demonSide;
      s.frontDemonActive = false;
      s.demonSide = null;
      s.demonTimer = 0;
      s.demonTimerMax = 0;
      s.demonSequence = [];
      s.demonIndex = 0;
      if (s.stats) s.stats.demonHit += 1;
      this._spawnFx('hit', x, y - 30, 0, -80, 0.5, 14);
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
      if (a.layer) {
        if (a.layer !== layer) continue;
      } else {
        if (layer === 'boat') continue;
        const under = a.kind === 'wake' || a.kind === 'wave';
        if ((layer === 'under') !== under) continue;
      }

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
      } else if (a.kind === 'bailArc') {
        const p0 = clamp(a.age / Math.max(0.001, a.life), 0, 1);
        const x0 = a.x0;
        const y0 = a.y0;
        const x1 = a.x1;
        const y1 = a.y1;
        const mx = (x0 + x1) * 0.5;
        const my = (y0 + y1) * 0.5 - 76;
        const steps = 10;
        ctx.save();
        ctx.globalAlpha = 0.15 + 0.65 * (1 - p0);
        ctx.strokeStyle = 'rgba(189,239,255,0.9)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const tt = (i / steps) * p0;
          const it = 1 - tt;
          const x = it * it * x0 + 2 * it * tt * mx + tt * tt * x1;
          const y = it * it * y0 + 2 * it * tt * my + tt * tt * y1;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha *= 0.55;
        r.circle(x1, y1, 3 + p0 * 3, 'rgba(255,206,84,0.7)');
        ctx.restore();
      } else if (a.kind === 'bailSplash') {
        const t0 = clamp(a.age / Math.max(0.001, a.life), 0, 1);
        const grow = 1 - Math.pow(1 - t0, 2);
        ctx.save();
        const a0 = a.a0 ?? 0.3;
        ctx.globalAlpha = a.age < 0 ? 0 : a0 * (1 - t0);
        ctx.strokeStyle = 'rgba(189,239,255,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(a.x, a.y, a.r * grow, a.r * 0.55 * grow, 0, 0.1, Math.PI * 1.9);
        ctx.stroke();
        ctx.globalAlpha *= 0.8;
        r.circle(a.x, a.y, 2 + grow * 3, 'rgba(189,239,255,0.9)');
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
    if (distRatio > 0.96) {
      const pulse = 0.5 + 0.5 * Math.sin(this.g.t * 7.2);
      const gk = clamp((s.distGlowTimer || 0) / 0.65, 0, 1);
      const a = (0.08 + 0.16 * pulse) * (0.4 + 0.6 * gk);
      r.roundRect(bx + 1, by + 21, bw - 2, 10, 5, `rgba(255,206,84,${a})`, `rgba(255,206,84,${0.28 + a})`, 2);
    }

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
      const stage = s.waveStage || 'warn';
      const timeToHit =
        stage === 'warn' ? Math.max(0, s.waveStageTimer) + Math.max(0, s.waveBuildTimer || 0) : stage === 'build' ? Math.max(0, s.waveStageTimer) : 0;
      const total = TUNING.wave.warningSeconds || 1;
      const p = 1 - clamp(timeToHit / Math.max(0.001, total), 0, 1);
      const buildK = stage === 'warn' ? 0 : stage === 'build' ? 1 - clamp(timeToHit / Math.max(0.001, s.waveBuildTimer || 0.001), 0, 1) : 1;
      const side = s.waveSide;
      const x = side === 'left' ? 0 : W - 180;
      r.roundRect(x + 18, topY, 162, 44, 12, `rgba(74,163,255,${0.12 + 0.22 * p})`, '#4aa3ff', 2);
      r.text(`${this._sideLabel(side)}水浪！`, x + 99, topY + 26, { size: 14, color: '#9fd0ff', align: 'center', weight: '900' });
      r.text(`即将拍来 ${timeToHit.toFixed(1)}s`, x + 99, topY + 44, { size: 12, color: '#cfc6e8', align: 'center', weight: '800' });

      const img = this._img(side === 'left' ? 'waveLeft' : 'waveRight');
      if (img) {
        const riverTop = TOP_HUD_H + 4;
        const riverH = GAME.height - TOP_HUD_H - BOTTOM_HUD_H - 6;
        const ar = img.width / Math.max(1, img.height);
        const h = riverH;
        const w2 = h * ar;
        const shift = (0.15 + 0.85 * p) * 240;
        const baseX = side === 'left' ? -w2 + shift : W - shift;
        const jitter = this._noise1D(this.g.t * 9, 771) * (2 + p * 6);
        const scale = 0.96 + buildK * 0.08;
        ctx.save();
        ctx.globalAlpha = 0.12 + p * 0.72;
        ctx.translate(baseX + jitter + w2 / 2, riverTop + h / 2);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -w2 / 2, -h / 2, w2, h);
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
      const sign = side === 'left' ? -1 : 1;
      const aBoat = this._getBoatAnchors(s, this.g.t);
      const bob = Math.sin(this.g.t * 6) * 4;
      const demonX = aBoat.center.x + aBoat.boat.fwd.x * (aBoat.boat.len * 0.65) + aBoat.boat.right.x * sign * (aBoat.boat.wid * 1.55);
      const demonY0 = aBoat.center.y + aBoat.boat.fwd.y * (aBoat.boat.len * 0.65) + aBoat.boat.right.y * sign * (aBoat.boat.wid * 1.55) + 14;
      const demonY = clamp(demonY0 + bob, TOP_HUD_H + 110, GAME.height - BOTTOM_HUD_H - 120);

      const qteX = side === 'left' ? 168 : W - 168;
      const py = TOP_HUD_H + 64;
      const n = s.demonSequence.length;
      const done = s.demonIndex;
      const w = 24 * n + 22;
      const flash = clamp(s.demonWrongFlash / 0.35, 0, 1);
      const bg = flash > 0 ? `rgba(255,122,106,${0.12 + flash * 0.18})` : 'rgba(20,14,28,0.65)';
      const stroke = flash > 0 ? '#ff7a6a' : '#ff7a6a';
      r.roundRect(qteX - 86, py, 172, 82, 12, bg, stroke, 2);
      r.text(`${side === 'left' ? '左前' : '右前'}妖怪`, qteX, py + 22, { size: 14, color: '#ff7a6a', align: 'center', weight: '900' });

      r.roundRect(qteX - w / 2, py + 32, w, 28, 10, 'rgba(10,8,18,0.65)', 'rgba(255,255,255,0.14)', 1);
      for (let i = 0; i < n; i++) {
        const xx = qteX - w / 2 + 12 + i * 24;
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
      r.roundRect(qteX - 62, py + 66, 124, 8, 4, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.4)', 1);
      r.roundRect(qteX - 60, py + 68, 120 * ratio, 4, 3, '#ff7a6a');

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#2d1c2c';
      ctx.beginPath();
      ctx.moveTo(qteX, py - 10);
      ctx.lineTo(qteX + (side === 'left' ? -24 : 24), py + 16);
      ctx.lineTo(qteX, py + 22);
      ctx.lineTo(qteX + (side === 'left' ? 18 : -18), py + 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      const demonImg = this._img('monsterFrontDemon');
      const auraPulse = 0.6 + 0.4 * Math.sin(this.g.t * 5.4);
      const auraA = (0.14 + 0.26 * auraPulse) * (1 - flash * 0.4);
      ctx.save();
      ctx.globalAlpha = auraA;
      const g = ctx.createRadialGradient(demonX, demonY + 16, 10, demonX, demonY + 16, 140);
      g.addColorStop(0, 'rgba(110,40,150,0.75)');
      g.addColorStop(0.55, 'rgba(60,20,90,0.35)');
      g.addColorStop(1, 'rgba(20,10,35,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(demonX, demonY + 16, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (demonImg) {
        const baseW = 210;
        const ar = demonImg.height / Math.max(1, demonImg.width);
        const w2 = baseW * (1 + flash * 0.08);
        const h2 = w2 * ar;
        ctx.save();
        ctx.shadowColor = 'rgba(170,90,255,0.65)';
        ctx.shadowBlur = 26;
        this._drawSpriteRotated(demonImg, demonX, demonY, w2, h2, 0, 0.74 + (flash > 0 ? 0.08 : 0), side === 'left');
        ctx.restore();
        if (flash > 0) {
          ctx.save();
          ctx.translate(demonX, demonY);
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
        ctx.moveTo(demonX, demonY - 18);
        ctx.lineTo(demonX + (side === 'left' ? -26 : 26), demonY + 18);
        ctx.lineTo(demonX, demonY + 12);
        ctx.lineTo(demonX + (side === 'left' ? 18 : -18), demonY + 18);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.35;
        r.circle(demonX - 8, demonY - 2, 3, '#ffce54');
        r.circle(demonX + 8, demonY - 2, 3, '#ffce54');
      }
      ctx.restore();

      ctx.save();
      const burstK = 0.7 + 0.3 * Math.sin(this.g.t * 8.2);
      ctx.globalAlpha = (0.08 + 0.18 * burstK) * (1 - flash * 0.5);
      const nBurst = 8;
      for (let i = 0; i < nBurst; i++) {
        const kk = this.g.t * 9 + i * 1.8;
        const ox = Math.sin(kk * 2.1) * (26 + burstK * 22);
        const oy = Math.cos(kk * 1.7) * (10 + burstK * 10);
        r.circle(demonX + ox, demonY + 44 + oy, 3 + burstK * 4, 'rgba(189,239,255,0.95)');
      }
      ctx.restore();
    }

    if (!s.frontDemonActive && s.demonDefeatTimer > 0 && s.demonDefeatSide) {
      const side = s.demonDefeatSide;
      const sign = side === 'left' ? -1 : 1;
      const aBoat = this._getBoatAnchors(s, this.g.t);
      const x0 = aBoat.center.x + aBoat.boat.fwd.x * (aBoat.boat.len * 0.65) + aBoat.boat.right.x * sign * (aBoat.boat.wid * 1.55);
      const y00 = aBoat.center.y + aBoat.boat.fwd.y * (aBoat.boat.len * 0.65) + aBoat.boat.right.y * sign * (aBoat.boat.wid * 1.55) + 14;
      const y0 = clamp(y00, TOP_HUD_H + 110, GAME.height - BOTTOM_HUD_H - 120);
      const k = clamp(s.demonDefeatTimer / 0.65, 0, 1);
      const p = 1 - k;
      const x = x0 + sign * (40 + p * 180);
      const y = y0 - p * (60 + p * 60);
      ctx.save();
      const demonImg = this._img('monsterFrontDemon');
      if (demonImg) {
        const baseW = 210;
        const ar = demonImg.height / Math.max(1, demonImg.width);
        const w2 = baseW * (0.9 + p * 0.35);
        const h2 = w2 * ar;
        ctx.save();
        ctx.shadowColor = 'rgba(170,90,255,0.55)';
        ctx.shadowBlur = 18;
        this._drawSpriteRotated(demonImg, x, y, w2, h2, 0, 0.42 * k, side === 'left');
        ctx.restore();
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

    const boat = this._boatPose(s, t);
    const mx = boat.tailX + Math.sin(t * 1.1) * (10 + near * 8);
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
      const tailX = boat2.tailX;
      const tailY = boat2.tailY;
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
    const rowK = clamp((s.rowFeedbackTimer || 0) / (TUNING.action.feedbackSeconds || 0.35), 0, 1);
    const speedK = clamp(s.boatSpeed / Math.max(1, TUNING.boat.speedMax), 0, 1);
    const waterRatio = clamp(s.waterLevel / TUNING.water.max, 0, 1);
    const fwdAng = Math.atan2(boat.fwd.y, boat.fwd.x);

    ctx.save();
    ctx.translate(cx + joltX * 0.6, cy + joltY * 0.6 + 10);
    ctx.rotate(fwdAng);
    ctx.fillStyle = 'rgba(6,14,24,1)';
    ctx.save();
    ctx.globalAlpha = 0.16 + speedK * 0.06;
    ctx.beginPath();
    ctx.ellipse(0, 0, boat.len * 0.82, boat.wid * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.1 + speedK * 0.04;
    ctx.beginPath();
    ctx.ellipse(0, 2, boat.len * 0.96, boat.wid * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.06 + speedK * 0.03;
    ctx.beginPath();
    ctx.ellipse(0, 4, boat.len * 1.12, boat.wid * 0.88, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.045 + rowK * 0.05;
    ctx.translate(cx, cy);
    ctx.rotate(fwdAng);
    ctx.fillStyle = 'rgba(20,90,130,1)';
    ctx.beginPath();
    ctx.ellipse(0, 2, boat.len * 1.35, boat.wid * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.18 + rowK * 0.18;
    ctx.strokeStyle = 'rgba(189,239,255,0.45)';
    ctx.lineWidth = 2;
    for (let sgn = -1; sgn <= 1; sgn += 2) {
      const sx = cx + boat.right.x * sgn * boat.wid * 0.78;
      const sy = cy + boat.right.y * sgn * boat.wid * 0.78;
      ctx.beginPath();
      ctx.ellipse(sx, sy, boat.len * 0.28, boat.wid * 0.16, fwdAng, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.12 + speedK * 0.25 + rowK * 0.12;
    ctx.strokeStyle = 'rgba(189,239,255,0.62)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(boat.bowX + boat.right.x * 6, boat.bowY + boat.right.y * 6, 18, 9, fwdAng, -0.2, Math.PI + 0.2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.08 + speedK * 0.18;
    const back = { x: -boat.fwd.x, y: -boat.fwd.y };
    for (let i = 0; i < 5; i++) {
      const k = t * 2.8 + i * 1.7;
      const ox = Math.sin(k) * (6 + speedK * 10);
      const oy = Math.cos(k * 1.2) * (4 + speedK * 8);
      r.circle(boat.tailX + back.x * (10 + i * 8) + ox, boat.tailY + back.y * (10 + i * 8) + oy, 2 + speedK * 2, 'rgba(189,239,255,0.75)');
    }
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
    this._drawBoatWater(r, s, boat, hullW, hullH, waterRatio);

    this._drawBoatDamage(r, -hullW / 2, -hullH / 2, hullW, hullH, waterRatio);
    this._drawBoatActions(r, s, hullW, hullH);
    ctx.restore();

    this._drawFx(r, 'boat');

    const shaX = cx - boat.fwd.x * 28 - boat.right.x * 18;
    const shaY = cy - boat.fwd.y * 28 - boat.right.y * 18;
    const tangX = cx + boat.fwd.x * 30 + boat.right.x * 18;
    const tangY = cy + boat.fwd.y * 30 + boat.right.y * 18;

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.beginPath();
    ctx.ellipse(shaX, shaY + 22, 14, 8, fwdAng, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(tangX, tangY + 22, 14, 8, fwdAng, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._drawShaSeng(r, shaX, shaY, s);
    this._drawTangSeng(r, tangX, tangY, s);

    if (waterRatio > 0.82) {
      const blink = 0.4 + 0.6 * Math.sin(t * 10);
      r.text('积水过高！', cx, cy + hullH * 0.42, {
        size: 12,
        color: `rgba(255,122,106,${0.55 + blink * 0.45})`,
        align: 'center',
        weight: '900',
        shadow: 'rgba(0,0,0,0.75)',
      });
    }
  }

  _drawBoatWater(r, s, boat, hullW, hullH, waterRatio) {
    if (waterRatio <= 0.01) return;
    const ctx = r.ctx;
    const t = this.g.t;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-hullW * 0.06, hullH * 0.02, hullW * 0.34, hullH * 0.26, -0.6, 0, Math.PI * 2);
    ctx.clip();

    const slosh = clamp((s.waterSloshTimer || 0) / 0.42, 0, 1);
    const fillA = 0.16 + waterRatio * 0.46 + slosh * 0.06;
    const deepA = 0.14 + waterRatio * 0.26 + slosh * 0.04;
    const pools = 2 + Math.floor(waterRatio * 7);
    const baseFwd = { x: 0.78, y: -0.62 };
    const baseRight = { x: -baseFwd.y, y: baseFwd.x };
    const drift = (1 - waterRatio) * 0.16;
    const slx = (s.lastRowKey === 'left' ? -1 : s.lastRowKey === 'right' ? 1 : 0) * slosh;
    const cx0 = -baseFwd.x * hullW * drift - hullW * 0.08 + slx * 10;
    const cy0 = -baseFwd.y * hullW * drift + hullH * 0.06 + slosh * 6;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(30,107,156,${fillA})`;
    for (let i = 0; i < pools; i++) {
      const n1 = this._noise1D(t * 0.6 + i * 7.1, 333);
      const n2 = this._noise1D(t * 0.7 + i * 5.3, 337);
      const along = (-0.06 + waterRatio * 0.18) + n1 * 0.08;
      const side = n2 * (0.14 + waterRatio * 0.28);
      const px = cx0 + baseFwd.x * (hullW * along) + baseRight.x * (hullW * side);
      const py = cy0 + baseFwd.y * (hullW * along) + baseRight.y * (hullW * side);
      const rx = 14 + waterRatio * 46 + Math.abs(n1) * 10;
      const ry = 8 + waterRatio * 30 + Math.abs(n2) * 8;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, -0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(20,80,120,${deepA})`;
    for (let i = 0; i < 3 + Math.floor(waterRatio * 4); i++) {
      const n1 = this._noise1D(t * 0.9 + i * 9.7, 353);
      const n2 = this._noise1D(t * 0.8 + i * 8.1, 357);
      const px = cx0 - hullW * 0.08 + n1 * (10 + waterRatio * 18);
      const py = cy0 + hullH * 0.02 + n2 * (8 + waterRatio * 16);
      const rx = 18 + waterRatio * 28;
      const ry = 10 + waterRatio * 22;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, -0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const shimmer = 0.5 + 0.5 * Math.sin(t * (5.2 + waterRatio * 4) + s.boatSpeed * 0.06);
    ctx.save();
    ctx.globalAlpha = (0.16 + waterRatio * 0.22) * shimmer;
    ctx.strokeStyle = 'rgba(189,239,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx0 + hullW * (-0.02 + waterRatio * 0.12), cy0 + hullH * 0.02, hullW * (0.14 + waterRatio * 0.16), hullH * (0.08 + waterRatio * 0.12), -0.6, -0.15, Math.PI + 0.2);
    ctx.stroke();
    ctx.restore();

    if (waterRatio > 0.82) {
      const blink = 0.55 + 0.45 * Math.sin(t * 10);
      ctx.save();
      ctx.globalAlpha = 0.08 + 0.06 * blink;
      ctx.fillStyle = 'rgba(255,122,106,1)';
      ctx.beginPath();
      ctx.ellipse(-hullW * 0.06, hullH * 0.02, hullW * 0.32, hullH * 0.24, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
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
      ctx.moveTo(side * (hullW * 0.14 - k * 6), hullH * 0.06 + k * 6);
      ctx.lineTo(side * (hullW * 0.32 + k * 10), hullH * 0.12 + 42 + k * 10);
      ctx.stroke();
      ctx.strokeStyle = '#7a6b52';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(side * (hullW * 0.32 + k * 10), hullH * 0.12 + 42 + k * 10);
      ctx.lineTo(side * (hullW * 0.38 + k * 14), hullH * 0.12 + 62 + k * 16);
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
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.98;
    const baseY = 44;
    const sprite = characterFrame(SHASENG, acting, this.g.t);
    ctx.save();
    ctx.globalAlpha = 0.14;
    r.circle(0, baseY - 2, 12, 'rgba(0,0,0,0.4)');
    r.circle(0, 30, 10, 'rgba(0,0,0,0.18)');
    ctx.restore();
    drawCharacter(r, sprite, 0, baseY, 3.15, { outline: '#120c15' });

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

    ctx.save();
    ctx.translate(x + jx, y + jy);
    ctx.globalAlpha = 0.98;
    const baseY = 44;
    const sprite = characterFrame(TANGSENG, panicState, this.g.t);
    ctx.save();
    ctx.globalAlpha = 0.14;
    r.circle(0, baseY - 2, 12, 'rgba(0,0,0,0.4)');
    r.circle(0, 30, 10, 'rgba(0,0,0,0.18)');
    ctx.restore();
    drawCharacter(r, sprite, 0, baseY, 3.2, { outline: '#120c15' });

    if (calm > 0.01) {
      const blink = 0.45 + 0.55 * Math.sin(this.g.t * 8);
      ctx.save();
      ctx.globalAlpha = 0.14 + calm * 0.22 * blink;
      r.circle(0, -8, 20 + calm * 10, 'rgba(255,206,84,0.55)');
      ctx.restore();
    }

    this._drawPanicEffects(r, 0, -8, panicV);

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

  _drawSceneImageBackdrop(r, imgKeys, overlay = 'rgba(5,4,10,0.55)', vignette = 'rgba(0,0,0,0.55)') {
    const ctx = r.ctx;
    const W = GAME.width;
    const H = GAME.height;
    let img = null;
    for (const k of imgKeys) {
      img = this._img(k);
      if (img) break;
    }
    if (img) this._drawImageCover(r, img, 0, 0, W, H);
    else r.vgrad(0, 0, W, H, PAL.sand0, PAL.sand1);

    r.rect(0, 0, W, H, overlay);
    ctx.save();
    const vg = ctx.createRadialGradient(W / 2, H / 2, 150, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.6, 'rgba(0,0,0,0.08)');
    vg.addColorStop(1, vignette);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  _drawMiniBar(r, x, y, w, h, ratio, color) {
    r.roundRect(x, y, w, h, Math.max(2, h / 2), 'rgba(10,8,18,0.75)', 'rgba(255,255,255,0.14)', 1);
    r.roundRect(x + 2, y + 2, (w - 4) * clamp(ratio, 0, 1), h - 4, Math.max(2, (h - 4) / 2), color);
  }

  _drawStatRow(r, x, y, label, value, ratio, color) {
    r.text(label, x, y, { size: 13, color: '#9fd0ff', weight: '900' });
    r.text(value, x + 300, y, { size: 13, color: '#fff2b0', align: 'right', weight: '900', shadow: 'rgba(0,0,0,0.65)' });
    this._drawMiniBar(r, x, y + 10, 300, 10, ratio, color);
  }

  _drawIntroControlCard(r, x, y, key, text) {
    r.roundRect(x, y, 308, 52, 14, 'rgba(5,4,10,0.52)', 'rgba(74,163,255,0.18)', 1);
    r.roundRect(x + 10, y + 10, 86, 32, 12, 'rgba(10,8,18,0.68)', 'rgba(255,206,84,0.22)', 1);
    r.text(key, x + 53, y + 32, { size: 15, color: '#fff2b0', align: 'center', weight: '900' });
    r.text(text, x + 108, y + 32, { size: 14, color: '#cfc6e8', align: 'left', weight: '900' });
  }

  _drawFailed(r) {
    const ctx = r.ctx;
    const W = GAME.width;
    const H = GAME.height;
    this._drawSceneImageBackdrop(r, ['bgResultFail', 'bgTitle', 'bgMain'], 'rgba(6,4,10,0.58)', 'rgba(0,0,0,0.68)');
    ctx.save();
    ctx.globalAlpha = 0.25;
    r.rect(0, 0, W, H, 'rgba(120,30,60,0.35)');
    ctx.restore();

    const reason = this.result?.reason;
    const title = reason === 'monster' ? '水怪追上破船！' : reason === 'water' ? '破船沉没了！' : '唐僧惊慌过度！';
    r.text(title, W / 2, 86, { size: 46, color: '#ff7a6a', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.85)' });

    const tip = reason === 'monster'
      ? '建议：A/D 要交替，不要一直按同一边。'
      : reason === 'water'
        ? '建议：水浪命中后立刻连点 Space 舀水。'
        : '建议：出现 1/2 序列时优先完成安抚。';
    const s = this.state;
    const px = W / 2 - 330;
    const py = 126;
    const pw = 660;
    const ph = 330;
    r.roundRect(px, py, pw, ph, 18, 'rgba(10,8,18,0.78)', 'rgba(255,122,106,0.55)', 2);
    r.roundRect(px + 10, py + 10, pw - 20, ph - 20, 14, null, 'rgba(255,255,255,0.14)', 1);

    r.text('失败复盘', W / 2, py + 50, { size: 18, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.75)' });
    r.roundRect(px + 22, py + 72, pw - 44, 64, 14, 'rgba(120,30,60,0.18)', 'rgba(255,122,106,0.35)', 1);
    r.text(tip, W / 2, py + 110, { size: 15, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.65)' });

    const distText = `${Math.round(s.monsterDistance)} / ${TUNING.monster.startDistance}`;
    const waterText = `${Math.round(s.waterLevel)} / ${TUNING.water.max}`;
    const fearText = `${Math.round(s.monkFear)} / ${TUNING.fear.max}`;
    this._drawStatRow(r, px + 38, py + 160, '水怪距离', distText, clamp(s.monsterDistance / TUNING.monster.startDistance, 0, 1), '#ff7a6a');
    this._drawStatRow(r, px + 38, py + 206, '进水值', waterText, clamp(s.waterLevel / TUNING.water.max, 0, 1), '#4aa3ff');
    this._drawStatRow(r, px + 38, py + 252, '惊慌值', fearText, clamp(s.monkFear / TUNING.fear.max, 0, 1), '#ffce54');

    const st = s.stats || {};
    const perf = [
      `最大连击：${st.maxCombo || 0}`,
      `舀水次数：${st.bails || 0}`,
      `成功安抚：${st.dialogueSuccess || 0}`,
      `击退妖怪：${st.demonHit || 0}`,
    ];
    const x0 = px + 360;
    const y0 = py + 174;
    for (let i = 0; i < perf.length; i++) {
      r.text(perf[i], x0, y0 + i * 22, { size: 12, color: '#cfc6e8', align: 'left', weight: '800' });
    }

    r.text('Space / Enter：重新挑战', W / 2, H - 68, { size: 18, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.75)' });
    r.text('Esc：返回开始界面', W / 2, H - 40, { size: 14, color: '#cfc6e8', align: 'center', weight: '800', shadow: 'rgba(0,0,0,0.7)' });
  }

  _drawSuccess(r) {
    const ctx = r.ctx;
    const W = GAME.width;
    const H = GAME.height;
    this._drawSceneImageBackdrop(r, ['bgResultSuccess', 'bgTitle', 'bgMain'], 'rgba(5,4,16,0.52)', 'rgba(0,0,0,0.62)');
    ctx.save();
    const glow = ctx.createRadialGradient(W / 2, 80, 20, W / 2, 80, 340);
    glow.addColorStop(0, 'rgba(255,206,84,0.25)');
    glow.addColorStop(0.5, 'rgba(255,206,84,0.08)');
    glow.addColorStop(1, 'rgba(255,206,84,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    r.text('冲出流沙河！', W / 2, 86, { size: 46, color: '#ffce54', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.85)' });
    const s = this.state;
    const score = this.result?.score ?? this._computeScore();
    const rank = this.result?.rank ?? this._getRank(score);
    const px = W / 2 - 330;
    const py = 126;
    const pw = 660;
    const ph = 350;
    r.roundRect(px, py, pw, ph, 18, 'rgba(10,8,18,0.76)', 'rgba(255,206,84,0.55)', 2);
    r.roundRect(px + 10, py + 10, pw - 20, ph - 20, 14, null, 'rgba(255,255,255,0.14)', 1);

    r.text(`评分 ${score}`, W / 2, py + 62, { size: 18, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.75)' });
    r.text(rank.grade, W / 2, py + 126, { size: 64, color: '#ffce54', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.75)' });
    r.text(rank.title, W / 2, py + 164, { size: 16, color: '#cfc6e8', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.65)' });

    r.text('破船冲出妖浪，师徒暂得安宁。', W / 2, py + 206, { size: 14, color: '#cfc6e8', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.6)' });

    const distText = `${Math.round(s.monsterDistance)} / ${TUNING.monster.startDistance}`;
    const waterText = `${Math.round(s.waterLevel)} / ${TUNING.water.max}`;
    const fearText = `${Math.round(s.monkFear)} / ${TUNING.fear.max}`;
    this._drawStatRow(r, px + 38, py + 240, '剩余水怪距离', distText, clamp(s.monsterDistance / TUNING.monster.startDistance, 0, 1), '#7ed957');
    this._drawStatRow(r, px + 38, py + 286, '最终进水值', waterText, clamp(s.waterLevel / TUNING.water.max, 0, 1), '#4aa3ff');
    this._drawStatRow(r, px + 38, py + 332, '唐僧惊慌值', fearText, clamp(s.monkFear / TUNING.fear.max, 0, 1), '#ffce54');

    const st = s.stats || {};
    const perf = [
      `最大划船连击：${st.maxCombo || 0}`,
      `舀水次数：${st.bails || 0}`,
      `成功安抚：${st.dialogueSuccess || 0}`,
      `击退妖怪：${st.demonHit || 0}`,
      `水浪命中：${st.waveHits || 0}`,
    ];
    const x0 = px + pw - 38;
    const y0 = py + 64;
    for (let i = 0; i < perf.length; i++) {
      r.text(perf[i], x0, y0 + i * 22, { size: 12, color: '#cfc6e8', align: 'right', weight: '800' });
    }

    r.text('Space / Enter：重新挑战', W / 2, H - 68, { size: 18, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.75)' });
    r.text('Esc：返回开始界面', W / 2, H - 40, { size: 14, color: '#cfc6e8', align: 'center', weight: '800', shadow: 'rgba(0,0,0,0.7)' });
  }

  _drawIntro(r) {
    const ctx = r.ctx;
    const W = GAME.width;
    const H = GAME.height;
    this._drawSceneImageBackdrop(r, ['bgTitle', 'bgMain'], 'rgba(5,4,10,0.68)', 'rgba(0,0,0,0.68)');

    const w = 760;
    const h = 388;
    const x = W / 2 - w / 2;
    const y = 76;
    r.roundRect(x, y, w, h, 18, 'rgba(10,8,18,0.82)', 'rgba(255,206,84,0.55)', 2);
    r.roundRect(x + 10, y + 10, w - 20, h - 20, 14, null, 'rgba(255,255,255,0.14)', 1);

    r.text('任务简报', W / 2, y + 56, { size: 26, color: '#ffce54', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.75)' });
    r.text('撑过 30 秒，不让水怪追上！', W / 2, y + 92, { size: 16, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.6)' });

    const cx0 = x + 62;
    const cy0 = y + 128;
    this._drawIntroControlCard(r, cx0, cy0, 'A / D', '交替划船，拉开水怪距离');
    this._drawIntroControlCard(r, cx0 + 328, cy0, 'Space', '舀出船舱积水');
    this._drawIntroControlCard(r, cx0, cy0 + 64, '1 / 2', '按序列安抚唐僧');
    this._drawIntroControlCard(r, cx0 + 328, cy0 + 64, 'Q / E', '击退前方妖怪');

    r.roundRect(x + 62, y + 268, w - 124, 66, 16, 'rgba(74,163,255,0.12)', 'rgba(74,163,255,0.28)', 1);
    r.text('优先级：水怪极近先划船｜进水过高先舀水｜惊慌过高先安抚', W / 2, y + 304, {
      size: 14,
      color: '#cfc6e8',
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.6)',
    });

    const remain = Math.ceil(this.introTimer);
    const blink = 0.45 + 0.55 * Math.sin(this.g.t * 6);
    ctx.save();
    ctx.globalAlpha = 0.5 + blink * 0.5;
    r.text(`${remain}`, x + w - 86, y + h - 86, { size: 58, color: '#ffce54', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.8)' });
    ctx.restore();
    r.text('秒后开始', x + w - 86, y + h - 42, { size: 14, color: '#fff2b0', align: 'center', weight: '900', shadow: 'rgba(0,0,0,0.65)' });
    ctx.save();
    ctx.globalAlpha = 0.45 + blink * 0.55;
    r.text('Space 立即开始', x + 108, y + h - 44, { size: 16, color: '#fff2b0', align: 'left', weight: '900', shadow: 'rgba(0,0,0,0.75)' });
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
