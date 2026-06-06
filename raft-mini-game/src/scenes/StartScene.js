import { ASSETS, GAME } from '../config.js';
import { RaftMiniGameScene } from './RaftMiniGameScene.js';

export class StartScene {
  constructor(game) {
    this.g = game;
    this.r = game.r;
  }

  enter() {
    this.time = 0;
    this.load = { started: false, done: false, total: 0, loaded: 0 };
    this.pendingStart = false;
    this._beginPreload();
  }

  update(dt) {
    this.time += dt;
    if (this.g.input.just('confirm')) this.pendingStart = true;
    if (this.pendingStart && this.load.done) this.g.setScene(new RaftMiniGameScene(this.g, { startScene: this }));
  }

  _beginPreload() {
    if (this.load.started) return;
    this.load.started = true;
    if (!this.g.shared.images) this.g.shared.images = {};

    const entries = Object.entries(ASSETS || {});
    this.load.total = entries.length;
    if (this.load.total === 0) {
      this.load.done = true;
      return;
    }

    // 图片加载失败时返回 null，场景绘制层会自动 fallback 到占位绘制
    const loadOne = (url) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });

    // 并行预加载，避免开局卡顿
    Promise.all(
      entries.map(async ([k, url]) => {
        const img = await loadOne(url);
        this.load.loaded += 1;
        this.g.shared.images[k] = img;
      }),
    ).then(() => {
      this.load.done = true;
    });
  }

  draw() {
    const r = this.r;
    const t = this.time;
    r.vgrad(0, 0, GAME.width, GAME.height, '#0c223a', '#133955');

    const blink = 0.45 + 0.55 * Math.sin(t * 4);
    r.text('流沙河：破船惊魂', GAME.width / 2, 170, {
      size: 54,
      color: '#ffce54',
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.7)',
    });
    r.text('目标：撑过 30 秒，不让水怪追上！', GAME.width / 2, 228, {
      size: 18,
      color: '#fff2b0',
      align: 'center',
      weight: '900',
    });

    const lines = ['A/D：交替划船（核心）', 'Space：连点舀水', '1/2：顺序安抚', 'Q/E：击退前方妖怪'];
    lines.forEach((ln, i) => {
      r.text(ln, GAME.width / 2, 278 + i * 26, {
        size: 16,
        color: '#cfc6e8',
        align: 'center',
        weight: '800',
      });
    });

    const ready = this.load.done;
    const label = ready ? '按 Space / Enter 开始挑战' : `加载素材中 ${Math.floor((this.load.loaded / Math.max(1, this.load.total)) * 100)}%`;
    r.text(label, GAME.width / 2, 420, {
      size: 22,
      color: '#fff2b0',
      align: 'center',
      weight: '900',
      alpha: 0.35 + blink * 0.65,
      shadow: 'rgba(0,0,0,0.7)',
    });

    if (!ready) {
      r.text('素材加载失败会自动回退到占位绘制', GAME.width / 2, 452, {
        size: 13,
        color: '#cfc6e8',
        align: 'center',
        weight: '800',
        alpha: 0.65,
      });
    }
  }
}
