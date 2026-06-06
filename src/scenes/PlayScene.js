import { GAME } from '../config.js';
import { Player } from '../entities/Player.js';
import { ParticleSystem } from '../entities/particles.js';
import { drawHubHud } from '../ui/hud.js';
import {
  WORLD,
  LEVELS,
  drawWorld,
  makeCamera,
  worldBounds,
  levelAt,
  getWorldImage,
} from '../openWorld.js';

// 关卡总图（hub）：自由探索，走入发光法阵即可进入对应关卡。
// 关卡玩法内容待开发，这里通过 #startLevel 保留统一接入接口。
export class PlayScene {
  constructor(game) {
    this.g = game;
    this.r = game.r;
    // 调试：URL 带 ?overview 时进入全图法阵校对视图
    this.debugOverview = new URLSearchParams(location.search).has('overview');
  }

  enter() {
    this.player = new Player();
    this.player.setPosition(WORLD.spawn.x, WORLD.spawn.y);
    this.fx = new ParticleSystem();
    this.camera = makeCamera(this.player);
    this.state = 'playing'; // playing | paused
    this.activeLevel = null;
    this.message = '万象迷途：自由探索，走入发光法阵即可进入对应关卡。';
    this.messageTimer = 5;
    this.toast = '';
    this.toastTimer = 0;
    this.enterLock = 0.3;
    this.g.audio.ensure();
    this.g.audio.startBgm();
  }

  exit() {
    this.g.audio.stopBgm();
  }

  update(dt) {
    const input = this.g.input;

    if (this.state === 'paused') {
      if (input.just('pause') || input.just('confirm')) this.state = 'playing';
      return;
    }
    if (input.just('pause')) {
      this.state = 'paused';
      return;
    }

    this.player.updateFree(dt, input, worldBounds(), WORLD.colliders);
    this.camera = makeCamera(this.player);

    // 进入/离开法阵检测
    const lv = levelAt(this.player.x, this.player.y);
    if (lv !== this.activeLevel) {
      this.activeLevel = lv;
      if (lv) {
        this.message = `已进入「${lv.label}」法阵 —— 按 空格 开始关卡`;
        this.messageTimer = 6;
        this.g.audio.sfx('select');
        this.fx.burst(lv.x, lv.y, 20, { color: lv.color, speed: 150, life: 0.6, size: 5 });
      }
    }

    this.enterLock = Math.max(0, this.enterLock - dt);
    if (lv && this.enterLock <= 0 && input.just('confirm')) {
      this.#startLevel(lv);
    }

    this.fx.update(dt);
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    this.toastTimer = Math.max(0, this.toastTimer - dt);
  }

  // ★ 关卡接入接口（内容待开发）★
  // 未来在此切换到对应关卡的玩法场景，例如：
  //   this.g.setScene(new LevelScene(this.g, lv.key));
  // lv.key 取值：huaguoshan / gaolaozhuang / liushahe / huoyanshan / leiyinsi
  #startLevel(lv) {
    // TODO: 接入「${lv.label}」的具体关卡玩法。
    this.toast = `「${lv.label}」关卡开发中，敬请期待`;
    this.toastTimer = 2.4;
    this.enterLock = 0.6;
    this.g.audio.sfx('start');
    this.fx.burst(this.player.x, this.player.y, 26, {
      color: lv.color,
      speed: 200,
      life: 0.8,
      size: 6,
      up: 30,
    });
  }

  draw() {
    const r = this.r;
    const ctx = r.ctx;
    const t = this.g.t;

    if (this.debugOverview) {
      this.#drawOverview(r, t);
      return;
    }

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    drawWorld(r, t, this.activeLevel ? this.activeLevel.key : null);
    this.player.draw(r, t);
    this.fx.draw(r);
    ctx.restore();

    drawHubHud(r, this.player, t, {
      camera: this.camera,
      levels: LEVELS,
      activeLevel: this.activeLevel,
      message: this.messageTimer > 0 ? this.message : '',
      toast: this.toastTimer > 0 ? this.toast : '',
    });

    if (this.state === 'paused') this.#drawPause(r);
  }

  #drawPause(r) {
    r.rect(0, 0, GAME.width, GAME.height, 'rgba(5,4,10,0.6)');
    r.text('暂停', GAME.width / 2, GAME.height / 2 - 10, {
      size: 44,
      color: '#ffce54',
      align: 'center',
      weight: '800',
      shadow: 'rgba(0,0,0,0.6)',
    });
    r.text('按 空格 / P 继续探索', GAME.width / 2, GAME.height / 2 + 34, {
      size: 16,
      color: '#cfc6e8',
      align: 'center',
    });
  }

  // 调试：把整张大地图缩放到一屏，叠加 5 个法阵圈用于校对位置
  #drawOverview(r, t) {
    const ctx = r.ctx;
    const s = Math.min(GAME.width / WORLD.w, GAME.height / WORLD.h);
    const dw = WORLD.w * s;
    const dh = WORLD.h * s;
    const ox = (GAME.width - dw) / 2;
    const oy = (GAME.height - dh) / 2;
    const X = (wx) => ox + wx * s;
    const Y = (wy) => oy + wy * s;

    r.rect(0, 0, GAME.width, GAME.height, '#05040a');
    const img = getWorldImage();
    if (img) {
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, ox, oy, dw, dh);
      ctx.imageSmoothingEnabled = prev;
    }

    for (const lv of LEVELS) {
      const cx = X(lv.x);
      const cy = Y(lv.y);
      const rr = lv.r * s;
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = lv.color;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = lv.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      r.circle(cx, cy, 2.5, '#ffffff');
      r.text(lv.label, cx, cy - rr - 4, {
        size: 12,
        color: '#fff2b0',
        align: 'center',
        weight: '800',
        shadow: 'rgba(0,0,0,0.85)',
      });
      r.text(`${lv.x},${lv.y}`, cx, cy + rr + 12, {
        size: 10,
        color: '#cfc6e8',
        align: 'center',
        shadow: 'rgba(0,0,0,0.85)',
      });
    }

    // 出生点
    r.circle(X(WORLD.spawn.x), Y(WORLD.spawn.y), 4, '#4aa3ff');
    r.text('spawn', X(WORLD.spawn.x), Y(WORLD.spawn.y) + 14, {
      size: 10,
      color: '#9fd0ff',
      align: 'center',
      shadow: 'rgba(0,0,0,0.85)',
    });

    // 玩家当前位置
    r.circle(X(this.player.x), Y(this.player.y), 4, '#ffffff');

    r.text('OVERVIEW · 全图法阵校对（移除 URL 中的 ?overview 退出）', GAME.width / 2, 14, {
      size: 13,
      color: '#ffce54',
      align: 'center',
      weight: '800',
      shadow: 'rgba(0,0,0,0.85)',
    });
  }
}
