import { GAME, PICKUPS } from '../config.js';
import { heroFrame, drawHero } from '../sprites/hero.js';
import { World } from '../world.js';
import { Pickup } from '../entities/Pickup.js';
import { PlayScene } from './PlayScene.js';
import { choice } from '../engine/utils.js';

const PICK_KEYS = Object.keys(PICKUPS);

export class MenuScene {
  constructor(game) {
    this.g = game;
    this.r = game.r;
  }

  enter() {
    this.world = new World();
    this.ambient = [];
    for (let i = 0; i < 4; i++) {
      const p = new Pickup(choice(PICK_KEYS), 200 + Math.random() * 280);
      p.x = Math.random() * GAME.width;
      this.ambient.push(p);
    }
  }

  update(dt) {
    this.world.update(dt, 120);
    for (const p of this.ambient) {
      p.update(dt, 120);
      if (p.dead) {
        const np = new Pickup(choice(PICK_KEYS), 200 + Math.random() * 280);
        Object.assign(p, np);
      }
    }
    const input = this.g.input;
    if (input.just('confirm')) {
      this.g.audio.ensure();
      this.g.audio.sfx('start');
      this.g.setScene(new PlayScene(this.g));
    }
  }

  draw() {
    const r = this.r;
    const ctx = r.ctx;
    const t = this.g.t;

    this.world.draw(r, 0.35, t, 0);
    for (const p of this.ambient) p.draw(r);

    // 孙悟空（月色像素）在营地前奔跑
    const hx = 172;
    const hy = GAME.roadBottom - 38; // 脚底所在 Y
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(hx, hy + 1, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawHero(r, heroFrame(true, t), hx, hy);

    // 标题遮罩
    ctx.fillStyle = 'rgba(8,6,16,0.45)';
    ctx.fillRect(0, 70, GAME.width, 230);

    r.text('西游 · 群魔幻境', GAME.width / 2, 120, {
      size: 22,
      color: '#cdbfe8',
      align: 'center',
      weight: '700',
      shadow: 'rgba(0,0,0,0.6)',
    });
    r.text('万 象 迷 途', GAME.width / 2, 188, {
      size: 72,
      color: '#ffce54',
      align: 'center',
      weight: '900',
      shadow: 'rgba(120,40,10,0.8)',
    });
    r.text('—— 取经者的试炼 ——', GAME.width / 2, 226, {
      size: 18,
      color: '#e8d9a8',
      align: 'center',
      weight: '600',
    });

    const lines = [
      '妖气幻化迷途，唐僧师徒误入万象之境。',
      '躲避妖风、落石、火焰、蛛网与陷阱，收集佛光、经文、仙桃、筋斗云与护身符。',
      '守住法力、信念与经书完整度，护送师徒抵达灵山。',
    ];
    lines.forEach((ln, i) => {
      r.text(ln, GAME.width / 2, 262 + i * 20, {
        size: 13,
        color: '#b6abd0',
        align: 'center',
        weight: '500',
      });
    });

    // 操作提示
    r.text('方向键 / WASD 移动     ·     P 暂停     ·     M 静音', GAME.width / 2, GAME.height - 56, {
      size: 13,
      color: '#8a82a8',
      align: 'center',
    });

    // 闪烁开始提示
    const blink = 0.5 + 0.5 * Math.sin(t * 4);
    r.text('按 空格 / 点击屏幕  开始取经', GAME.width / 2, GAME.height - 28, {
      size: 20,
      color: '#fff2b0',
      align: 'center',
      weight: '800',
      alpha: 0.4 + blink * 0.6,
      shadow: 'rgba(0,0,0,0.6)',
    });
  }
}
