import { drawCharacter } from '../sprites/hero.js';
import { npcFrame } from '../sprites/npc.js';
import { npcLines, npcStatus } from '../story.js';

const INTERACT_RADIUS = 74;

export class Npc {
  constructor(def) {
    this.def = def;
    this.x = def.x;
    this.y = def.y;
    this.animTime = Math.random() * 10;
    this.facing = 1;
  }

  update(dt, player) {
    this.animTime += dt;
    if (player) this.facing = player.x < this.x ? -1 : 1;
  }

  distanceTo(player) {
    return Math.hypot(player.x - this.x, player.y - this.y);
  }

  canInteract(player) {
    return this.distanceTo(player) <= INTERACT_RADIUS;
  }

  lines(story) {
    return npcLines(story, this.def);
  }

  status(story) {
    return npcStatus(story, this.def);
  }

  draw(r, t, story, active = false) {
    const ctx = r.ctx;
    const status = this.status(story);
    const talking = active && Math.sin(t * 10) > -0.2;
    const bob = Math.sin((this.animTime + this.x * 0.01) * 2.3) * 1.5;
    const footY = this.y + 15 + bob;
    const color = status === 'locked' ? '#8e849b' : this.def.color;
    const alpha = status === 'locked' ? 0.58 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 17, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawCharacter(r, npcFrame(this.def.key, talking, this.animTime), this.x, footY, 1.9, {
      alpha,
      flip: this.facing < 0,
      outline: '#07060c',
    });

    this.#drawMarker(r, t, color, status, active);
    this.#drawName(r, color);
  }

  #drawMarker(r, t, color, status, active) {
    const ctx = r.ctx;
    const y = this.y - 56 + Math.sin(t * 4) * 3;
    ctx.save();
    ctx.globalAlpha = status === 'locked' ? 0.45 : 0.9;
    r.circle(this.x, y, active ? 10 : 8, 'rgba(5,4,10,0.88)');
    r.text(status === 'active' ? '!' : status === 'done' ? '✓' : '?', this.x, y + 5, {
      size: active ? 18 : 15,
      color,
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.8)',
    });
    ctx.restore();
  }

  #drawName(r, color) {
    const w = r.measure(this.def.name, 12, '800') + 18;
    r.roundRect(this.x - w / 2, this.y + 26, w, 20, 7, 'rgba(8,6,14,0.72)', color, 1);
    r.text(this.def.name, this.x, this.y + 40, {
      size: 12,
      color: '#fff2b0',
      align: 'center',
      weight: '800',
      shadow: 'rgba(0,0,0,0.75)',
    });
  }
}
