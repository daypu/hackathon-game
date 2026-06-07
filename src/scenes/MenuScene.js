import { GAME, PICKUPS } from '../config.js';
import { TANGSENG, WUKONG, BAJIE, SHASENG, characterFrame, drawCharacter } from '../sprites/hero.js';
import { Pickup } from '../entities/Pickup.js';
import { PlayScene } from './PlayScene.js';
import { choice } from '../engine/utils.js';
import menuBgUrl from '../../arts/bg_liusha_river_main.png';

const PICK_KEYS = Object.keys(PICKUPS);

export class MenuScene {
  constructor(game) {
    this.g = game;
    this.r = game.r;
  }

  enter() {
    const params = new URLSearchParams(location.search);
    if (params.has('boss') || params.has('gaolaozhuang') || params.get('mini') === 'gaolaozhuang') {
      this.g.setScene(new PlayScene(this.g));
      return;
    }
    this.menuBg = new Image();
    this.menuBg.src = menuBgUrl;
    this.ambient = [];
    for (let i = 0; i < 4; i++) {
      const p = new Pickup(choice(PICK_KEYS), 200 + Math.random() * 280);
      p.x = Math.random() * GAME.width;
      this.ambient.push(p);
    }
  }

  update(dt) {
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

    if (this.menuBg?.complete) drawImageCover(ctx, this.menuBg, 0, 0, GAME.width, GAME.height);
    else r.vgrad(0, 0, GAME.width, GAME.height, '#08142c', '#163d77');
    ctx.fillStyle = 'rgba(4,10,24,0.26)';
    ctx.fillRect(0, 0, GAME.width, GAME.height);
    for (const p of this.ambient) p.draw(r);

    // 四人动态队伍预览：游戏内仍先以悟空为主控，其他角色先作为动画素材接入。
    const party = [
      { sp: TANGSENG, x: 114, label: '唐僧' },
      { sp: WUKONG, x: 162, label: '悟空' },
      { sp: BAJIE, x: 214, label: '八戒' },
      { sp: SHASENG, x: 268, label: '沙僧' },
    ];
    const hy = GAME.roadBottom - 38; // 脚底所在 Y
    for (const member of party) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(member.x, hy + 1, member.sp.w + 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawCharacter(r, characterFrame(member.sp, true, t + member.x * 0.01), member.x, hy);
      r.text(member.label, member.x, hy + 22, {
        size: 10,
        color: '#cfc6e8',
        align: 'center',
        weight: '700',
        shadow: 'rgba(0,0,0,0.75)',
      });
    }

    // 标题遮罩
    ctx.fillStyle = 'rgba(8,6,16,0.45)';
    ctx.fillRect(0, 70, GAME.width, 230);

    r.text('西游冒险主题动作游戏', GAME.width / 2, 120, {
      size: 22,
      color: '#cdbfe8',
      align: 'center',
      weight: '700',
      shadow: 'rgba(0,0,0,0.6)',
    });
    r.text('西 天 之 旅', GAME.width / 2, 188, {
      size: 72,
      color: '#ffce54',
      align: 'center',
      weight: '900',
      shadow: 'rgba(120,40,10,0.8)',
    });
    r.text('—— 师徒四人的西行冒险 ——', GAME.width / 2, 226, {
      size: 18,
      color: '#e8d9a8',
      align: 'center',
      weight: '600',
    });

    const lines = [
      '妖气遮天，唐僧师徒踏上通往西天的艰险旅程。',
      '穿越高老庄、流沙河、火焰山等关卡，破解妖魔阻拦与机关试炼。',
      '守住法力、信念与经书完整度，护送师徒一路西行抵达灵山。',
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
    r.text('按 空格 / 点击屏幕  开始西天之旅', GAME.width / 2, GAME.height - 28, {
      size: 20,
      color: '#fff2b0',
      align: 'center',
      weight: '800',
      alpha: 0.4 + blink * 0.6,
      shadow: 'rgba(0,0,0,0.6)',
    });
  }
}

function drawImageCover(ctx, img, x, y, w, h) {
  const iw = img.width || 1;
  const ih = img.height || 1;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}
