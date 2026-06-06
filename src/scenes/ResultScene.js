import { GAME, STATS, STAT_MAX } from '../config.js';
import { clamp } from '../engine/utils.js';
import { PlayScene } from './PlayScene.js';
import { MenuScene } from './MenuScene.js';

function star(ctx, cx, cy, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = '#ffce54';
    ctx.fill();
    ctx.strokeStyle = '#a86a1a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export class ResultScene {
  constructor(game) {
    this.g = game;
    this.r = game.r;
  }

  enter() {
    this.res = this.g.shared.result;
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    const input = this.g.input;
    if (this.time > 0.4 && input.just('confirm')) {
      this.g.audio.sfx('start');
      this.g.setScene(new PlayScene(this.g));
    } else if (this.time > 0.4 && input.just('pause')) {
      this.g.audio.sfx('select');
      this.g.setScene(new MenuScene(this.g));
    }
  }

  draw() {
    const r = this.r;
    const ctx = r.ctx;
    const res = this.res;
    const W = GAME.width;
    const reveal = clamp(this.time / 0.5, 0, 1);

    // 背景
    r.vgrad(0, 0, W, GAME.height, '#0d0a18', '#1a1024');
    const gg = ctx.createRadialGradient(W / 2, 250, 80, W / 2, 250, 520);
    gg.addColorStop(0, res.reached ? 'rgba(80,60,10,0.4)' : 'rgba(60,8,8,0.4)');
    gg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(0, 0, W, GAME.height);

    // 匾额面板
    const px = 160;
    const pw = 640;
    ctx.globalAlpha = reveal;
    r.roundRect(px, 46, pw, 462, 14, 'rgba(20,14,28,0.92)', '#caa23a', 3);
    r.roundRect(px + 8, 54, pw - 16, 446, 10, null, 'rgba(202,162,58,0.4)', 1);
    ctx.globalAlpha = 1;

    if (reveal < 1) ctx.globalAlpha = reveal;

    r.text('—— 取经功德簿 ——', W / 2, 86, {
      size: 14,
      color: '#9a90b8',
      align: 'center',
      weight: '600',
    });

    // 称号
    r.text(res.title, W / 2, 132, {
      size: 42,
      color: res.reached ? '#ffce54' : '#ff7a6a',
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.6)',
    });

    // 星级
    const sc = 5;
    const gap = 30;
    const sx = W / 2 - ((sc - 1) * gap) / 2;
    for (let i = 0; i < sc; i++) {
      star(ctx, sx + i * gap, 162, 12, i < res.stars);
    }

    // 评语
    r.text(res.desc, W / 2, 200, {
      size: 14,
      color: '#cfc6e8',
      align: 'center',
      weight: '500',
    });

    // 分隔
    ctx.strokeStyle = 'rgba(202,162,58,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 40, 218);
    ctx.lineTo(px + pw - 40, 218);
    ctx.stroke();

    // 综合评定
    r.text('综合评定', W / 2, 244, { size: 14, color: '#9a90b8', align: 'center' });
    const shown = Math.round(res.score * clamp((this.time - 0.3) / 0.8, 0, 1));
    r.text(`${shown}`, W / 2, 290, {
      size: 46,
      color: '#fff2b0',
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.5)',
    });
    r.text('分', W / 2 + 44, 290, { size: 16, color: '#9a90b8', align: 'left' });
    r.text(`护送师徒前行 ${res.distPct}% 路程`, W / 2, 314, {
      size: 13,
      color: '#b6abd0',
      align: 'center',
    });

    // 最终属性
    const barX = W / 2 - 90;
    const barW = 180;
    STATS.forEach((st, i) => {
      const y = 336 + i * 24;
      r.text(st.label, barX - 12, y + 11, { size: 13, color: st.glow, align: 'right', weight: '700' });
      r.roundRect(barX, y, barW, 14, 4, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.5)', 1.5);
      const ratio = clamp(res.stats[st.key] / STAT_MAX, 0, 1) * clamp((this.time - 0.4) / 0.7, 0, 1);
      if (ratio > 0) r.roundRect(barX + 1.5, y + 1.5, (barW - 3) * ratio, 11, 3, st.color);
      r.text(`${res.stats[st.key] | 0}`, barX + barW + 10, y + 11, {
        size: 12,
        color: '#e8e0c8',
        align: 'left',
        weight: '700',
      });
    });

    // 成就
    r.text('获得成就', W / 2, 424, {
      size: 15,
      color: '#ffce54',
      align: 'center',
      weight: '800',
    });
    const list = res.achievements.slice(0, 4);
    list.forEach((a, i) => {
      const reveal2 = clamp((this.time - 0.6 - i * 0.18) / 0.4, 0, 1);
      const y = 448 + i * 16;
      ctx.globalAlpha = reveal2;
      r.text(`✦ ${a.name}`, px + 70, y, {
        size: 13,
        color: '#ffe9a8',
        align: 'left',
        weight: '700',
      });
      r.text(a.desc, px + 200, y, {
        size: 12,
        color: '#9a90b8',
        align: 'left',
      });
      ctx.globalAlpha = 1;
    });
    if (res.achievements.length > 4) {
      r.text(`…等共 ${res.achievements.length} 项成就`, W / 2, 448 + 4 * 16, {
        size: 11,
        color: '#7a7298',
        align: 'center',
      });
    }

    ctx.globalAlpha = 1;

    // 操作提示
    const blink = 0.5 + 0.5 * Math.sin(this.time * 4);
    r.text('空格 / 点击  再次启程        Esc  返回首页', W / 2, 528, {
      size: 14,
      color: '#fff2b0',
      align: 'center',
      weight: '700',
      alpha: 0.5 + blink * 0.5,
    });
  }
}
