import { GAME } from '../config.js';
import { RaftMiniGameScene } from './RaftMiniGameScene.js';

export class StartScene {
  constructor(game) {
    this.g = game;
    this.r = game.r;
  }

  enter() {
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    if (this.g.input.just('confirm')) {
      this.g.setScene(new RaftMiniGameScene(this.g, { startScene: this }));
    }
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

    const lines = ['A/D：交替划船（核心）', 'Space：连点舀水', '1/2：顺序安抚', 'Q/E：击退妖怪'];
    lines.forEach((ln, i) => {
      r.text(ln, GAME.width / 2, 278 + i * 26, {
        size: 16,
        color: '#cfc6e8',
        align: 'center',
        weight: '800',
      });
    });

    r.text('按 Space / Enter 开始挑战', GAME.width / 2, 420, {
      size: 22,
      color: '#fff2b0',
      align: 'center',
      weight: '900',
      alpha: 0.35 + blink * 0.65,
      shadow: 'rgba(0,0,0,0.7)',
    });
  }
}
