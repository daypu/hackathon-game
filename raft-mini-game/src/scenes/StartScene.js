import { ASSETS, GAME } from '../config.js';
import { RaftMiniGameScene } from './RaftMiniGameScene.js';

export class StartScene {
  constructor(game) {
    this.g = game;
    this.r = game.r;
  }

  _img(key) {
    return this.g.shared?.images?.[key] || null;
  }

  _drawImageCover(r, img, x, y, w, h) {
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
    const W = GAME.width;
    const H = GAME.height;
    const ctx = r.ctx;

    const bg = this._img('bgTitle') || this._img('bgMain');
    if (bg) this._drawImageCover(r, bg, 0, 0, W, H);
    else r.vgrad(0, 0, W, H, '#0c223a', '#133955');

    r.rect(0, 0, W, H, 'rgba(5,4,10,0.52)');
    ctx.save();
    const vg = ctx.createRadialGradient(W / 2, H / 2, 140, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.55, 'rgba(0,0,0,0.06)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    const blink = 0.45 + 0.55 * Math.sin(t * 4);
    r.text('流沙河：破船惊魂', W / 2, 132, {
      size: 58,
      color: '#ffce54',
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.85)',
    });
    r.text('护送唐僧，撑过 30 秒', W / 2, 178, {
      size: 18,
      color: '#fff2b0',
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.75)',
    });
    r.text('妖雾翻涌，破船将沉。悟净，快撑住！', W / 2, 214, {
      size: 16,
      color: '#cfc6e8',
      align: 'center',
      weight: '800',
      shadow: 'rgba(0,0,0,0.65)',
    });

    const ready = this.load.done;
    const pct = Math.floor((this.load.loaded / Math.max(1, this.load.total)) * 100);
    const btnLabel = ready ? 'Space / Enter  开始挑战' : `加载素材中  ${pct}%`;
    const bx = W / 2 - 240;
    const by = 284;
    const bw = 480;
    const bh = 62;
    const pulse = ready ? 0.55 + 0.45 * Math.sin(t * 3.2) : 0.6 + 0.4 * Math.sin(t * 2.2);
    const a = 0.65 + pulse * 0.35;
    r.roundRect(bx, by, bw, bh, 16, `rgba(10,8,18,${0.55 + a * 0.18})`, `rgba(255,206,84,${0.28 + a * 0.3})`, 2);
    r.roundRect(bx + 6, by + 6, bw - 12, bh - 12, 12, null, 'rgba(255,255,255,0.14)', 1);
    r.text(btnLabel, W / 2, by + 40, {
      size: 22,
      color: ready ? '#fff2b0' : '#cfc6e8',
      align: 'center',
      weight: '900',
      alpha: 0.7 + blink * 0.3,
      shadow: 'rgba(0,0,0,0.75)',
    });

    const cards = [
      ['A / D', '交替划船'],
      ['Space', '舀水'],
      ['1 / 2', '安抚唐僧'],
      ['Q / E', '击退妖怪'],
    ];
    const cw = 210;
    const ch = 56;
    const gap = 12;
    const total = cw * cards.length + gap * (cards.length - 1);
    const cx0 = (W - total) / 2;
    const cy0 = H - 112;
    for (let i = 0; i < cards.length; i++) {
      const x = cx0 + i * (cw + gap);
      r.roundRect(x, cy0, cw, ch, 14, 'rgba(5,4,10,0.48)', 'rgba(74,163,255,0.18)', 1);
      r.roundRect(x + 6, cy0 + 8, 76, 40, 12, 'rgba(10,8,18,0.68)', 'rgba(255,206,84,0.22)', 1);
      r.text(cards[i][0], x + 44, cy0 + 34, { size: 14, color: '#fff2b0', align: 'center', weight: '900' });
      r.text(cards[i][1], x + 92, cy0 + 34, { size: 14, color: '#cfc6e8', align: 'left', weight: '800' });
    }

    if (!ready) {
      r.text('素材加载失败将自动回退显示', W / 2, H - 22, { size: 12, color: '#9a90b8', align: 'center', weight: '800', alpha: 0.75 });
    }
  }
}
