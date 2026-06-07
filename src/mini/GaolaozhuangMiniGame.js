import { GAME } from '../config.js';
import { BAJIE, WUKONG, characterFrame, drawCharacter } from '../sprites/hero.js';

const LANES = [226, 316, 406];
const HERO_X = 178;
const DIST_TO_WIN = 5200;
const BASE_SPEED = 205;
const SPAWN_GAP = [0.58, 0.95];
const GOAL_PEACHES = 10;
const WARN_DURATION = 1.2;

export class GaolaozhuangMiniGame {
  constructor({ onComplete } = {}) {
    this.onComplete = onComplete;
    this.reset();
  }

  reset() {
    this.state = 'intro';
    this.dialogueIndex = 0;
    this.dialogue = [
      { name: '猪八戒', text: '俺老猪正在高老庄享清福，谁要跟你们去取经？' },
      { name: '孙悟空', text: '呆子！庄外妖雾绕路，先随俺冲出猪妖阵！' },
      { name: '猪八戒', text: '若能一路护住仙桃、避开钉耙陷阱，俺便随你去西天。' },
      { name: '高太公', text: '路上有护身符与钱袋，善用它们，莫让妖怪冲散队伍。' },
    ];
    this.lane = 1;
    this.targetLane = 1;
    this.x = HERO_X;
    this.jump = 0;
    this.vy = 0;
    this.distance = 0;
    this.peaches = 0;
    this.coins = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.shields = 0;
    this.team = ['wukong'];
    this.spawnTimer = 0.8;
    this.objects = [];
    this.particles = [];
    this.result = null;
    this.finished = false;
    this.t = 0;
    this.flash = 0;
    this.rescueSpawned = false;
    this.invuln = 0;
    this.eventText = '';
    this.eventTimer = 0;
    this.warning = null;
    this.phase = 1;
  }

  update(dt, input) {
    this.t += dt;
    this.#updateParticles(dt);
    this.flash = Math.max(0, this.flash - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.eventTimer = Math.max(0, this.eventTimer - dt);
    if (this.eventTimer <= 0) this.eventText = '';
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    if (this.state === 'intro') {
      if (input.just('confirm')) {
        this.dialogueIndex++;
        if (this.dialogueIndex >= this.dialogue.length) this.state = 'running';
      }
      return;
    }

    if (this.state === 'result') {
      if (input.just('confirm')) this.onComplete?.(this.result);
      return;
    }

    if (input.just('left')) this.targetLane = Math.max(0, this.targetLane - 1);
    if (input.just('right')) this.targetLane = Math.min(LANES.length - 1, this.targetLane + 1);
    if ((input.just('up') || input.just('confirm')) && this.jump <= 0) this.vy = 520;

    this.lane += (this.targetLane - this.lane) * Math.min(1, dt * 12);
    this.jump = Math.max(0, this.jump + this.vy * dt);
    if (this.jump > 0 || this.vy > 0) this.vy -= 1350 * dt;
    if (this.jump <= 0 && this.vy < 0) {
      this.jump = 0;
      this.vy = 0;
    }

    const speed = BASE_SPEED + Math.min(150, this.distance * 0.025);
    this.distance += speed * dt;
    this.phase = this.distance > DIST_TO_WIN * 0.66 ? 3 : this.distance > DIST_TO_WIN * 0.34 ? 2 : 1;
    if (this.distance >= DIST_TO_WIN) {
      this.#finish(this.team.includes('bajie') && this.peaches >= GOAL_PEACHES);
      return;
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.#spawn();
      const [a, b] = SPAWN_GAP;
      this.spawnTimer = a + Math.random() * (b - a);
    }

    if (!this.rescueSpawned && this.distance > DIST_TO_WIN * 0.58) {
      this.rescueSpawned = true;
      this.#showEvent('八戒就在前方！收集足够仙桃再带他入队');
      this.objects.push({ type: 'bajie', lane: 1, x: GAME.width + 80, y: LANES[1], r: 34, low: false });
    }

    if (!this.warning && this.phase >= 2 && Math.random() < dt * 0.16) {
      const lane = Math.floor(Math.random() * LANES.length);
      this.warning = { lane, timer: WARN_DURATION, x: GAME.width + 30 };
    }

    if (this.warning) {
      this.warning.timer -= dt;
      this.warning.x -= speed * dt * 0.7;
      if (this.warning.timer <= 0) {
        this.objects.push({
          type: 'charge',
          lane: this.warning.lane,
          x: GAME.width + 80,
          y: LANES[this.warning.lane],
          r: 32,
          low: false,
          fast: true,
        });
        this.warning = null;
      }
    }

    const heroY = LANES[Math.round(this.lane)] - this.jump;
    for (const obj of this.objects) {
      obj.x -= speed * dt;
      if (obj.hit) continue;
      if (Math.abs(obj.x - this.x) < obj.r + 24 && Math.abs(obj.y - heroY) < obj.r + 28) {
        if (obj.type === 'enemy') {
          if (obj.low && this.jump > 42) continue;
          if (this.invuln > 0) {
            obj.hit = true;
            continue;
          }
          obj.hit = true;
          this.#hitEnemy(obj);
        } else if (obj.type === 'peach') {
          obj.hit = true;
          this.peaches++;
          this.combo++;
          this.comboTimer = 2.1;
          this.#burst(obj.x, obj.y, '#ff9fc4', 12);
        } else if (obj.type === 'coin') {
          obj.hit = true;
          const gain = 2 + Math.min(8, this.combo);
          this.coins += gain;
          this.#burst(obj.x, obj.y, '#ffce54', 10);
        } else if (obj.type === 'shield') {
          obj.hit = true;
          this.shields++;
          this.#showEvent('获得护身符，可抵挡一次冲撞');
          this.#burst(obj.x, obj.y, '#9fd0ff', 16);
        } else if (obj.type === 'bajie') {
          obj.hit = true;
          if (this.peaches >= GOAL_PEACHES) {
            if (!this.team.includes('bajie')) this.team.push('bajie');
            this.#showEvent('八戒入队！护送他冲出高老庄');
            this.#burst(obj.x, obj.y, '#f0a05a', 26);
          } else {
            this.#showEvent(`还需要 ${GOAL_PEACHES - this.peaches} 个仙桃说服八戒`);
            this.objects.push({ ...obj, hit: false, x: obj.x + 360 });
          }
        }
      }
    }
    this.objects = this.objects.filter((obj) => obj.x > -80 && !obj.hit);
  }

  draw(r) {
    this.#drawBackground(r);
    if (this.state === 'intro') {
      this.#drawIntro(r);
      return;
    }

    this.#drawRoad(r);
    this.#drawObjects(r);
    this.#drawHero(r);
    this.#drawParticles(r);
    this.#drawHud(r);

    if (this.state === 'result') this.#drawResult(r);
  }

  #spawn() {
    const lane = Math.floor(Math.random() * LANES.length);
    const roll = Math.random();
    const enemyRate = this.phase === 1 ? 0.46 : this.phase === 2 ? 0.54 : 0.62;
    if (roll < enemyRate) {
      this.objects.push({
        type: Math.random() < 0.18 + this.phase * 0.04 ? 'trap' : 'enemy',
        lane,
        x: GAME.width + 55,
        y: LANES[lane],
        r: 26,
        low: Math.random() < 0.38,
      });
    } else if (roll < enemyRate + 0.18) {
      this.objects.push({
        type: 'coin',
        lane,
        x: GAME.width + 55,
        y: LANES[lane] - 12,
        r: 18,
        low: false,
      });
    } else if (roll < enemyRate + 0.25) {
      this.objects.push({
        type: 'shield',
        lane,
        x: GAME.width + 55,
        y: LANES[lane] - 12,
        r: 18,
        low: false,
      });
    } else {
      this.objects.push({
        type: 'peach',
        lane,
        x: GAME.width + 55,
        y: LANES[lane] - 8,
        r: 20,
        low: false,
      });
    }
  }

  #hitEnemy(obj) {
    this.flash = 0.25;
    this.combo = 0;
    this.comboTimer = 0;
    this.#burst(obj.x, obj.y, '#ff6b5e', 18);
    if (this.shields > 0) {
      this.shields--;
      this.invuln = 1;
      this.#showEvent('护身符抵挡了冲撞');
      return;
    }
    if (this.team.length > 1) {
      this.team.pop();
      this.invuln = 1;
    } else {
      this.#finish(false);
    }
  }

  #finish(success) {
    this.state = 'result';
    this.finished = true;
    this.result = {
      success,
      failed: !success,
      peaches: this.peaches,
      coins: this.coins,
      team: [...this.team],
      progress: Math.min(1, this.distance / DIST_TO_WIN),
    };
  }

  #drawBackground(r) {
    const ctx = r.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, GAME.height);
    g.addColorStop(0, '#8fd1e8');
    g.addColorStop(0.42, '#7cc56f');
    g.addColorStop(1, '#456f34');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GAME.width, GAME.height);

    // 多层远景：山、云、村庄、田地。
    for (let i = 0; i < 5; i++) {
      const x = i * 230 - (this.distance * 0.05) % 230;
      r.circle(x + 70, 96, 72, 'rgba(50,110,70,0.35)');
      r.circle(x + 132, 112, 54, 'rgba(40,90,60,0.34)');
    }
    for (let i = 0; i < 4; i++) {
      const x = 60 + i * 260 - (this.distance * 0.03) % 260;
      r.circle(x, 52, 22, 'rgba(255,255,255,0.35)');
      r.circle(x + 24, 48, 28, 'rgba(255,255,255,0.28)');
      r.rect(x - 18, 55, 70, 10, 'rgba(255,255,255,0.25)');
    }

    this.#drawHouse(r, 54, 96, 0.9);
    this.#drawHouse(r, 700, 92, 1.05);
    this.#drawWell(r, 214, 150);
    for (let i = 0; i < 10; i++) {
      const x = 292 + i * 38;
      r.rect(x, 126, 28, 46, i % 2 ? '#6f9c3d' : '#8ebf4f');
      r.rect(x + 4, 132, 20, 4, 'rgba(255,242,176,0.28)');
    }
    r.rect(0, 170, GAME.width, 8, 'rgba(60,45,25,0.55)');
  }

  #drawRoad(r) {
    const ctx = r.ctx;
    r.roundRect(42, 186, GAME.width - 84, 292, 30, '#5c3a21');
    r.roundRect(50, 190, GAME.width - 100, 284, 26, '#b88a52', '#5c3a21', 3);
    for (let x = 60 - (this.distance * 0.45) % 34; x < GAME.width - 60; x += 34) {
      for (let y = 198; y < 466; y += 34) {
        ctx.globalAlpha = 0.12;
        r.rect(x, y, 3, 3, '#3a2418');
      }
    }
    ctx.globalAlpha = 1;
    for (const y of LANES) {
      r.rect(70, y + 28, GAME.width - 140, 3, 'rgba(255,242,176,0.24)');
      for (let x = 90 - (this.distance % 48); x < GAME.width - 80; x += 48) {
        r.rect(x, y - 2, 17, 5, 'rgba(255,242,176,0.52)');
      }
    }
    if (this.warning) {
      const y = LANES[this.warning.lane];
      const p = this.warning.timer / WARN_DURATION;
      r.roundRect(80, y - 34, GAME.width - 160, 66, 12, `rgba(255,90,60,${0.15 + (1 - p) * 0.22})`, '#ff6b5e', 3);
      r.text('猪妖冲锋!', GAME.width / 2, y - 42, {
        size: 15,
        color: '#fff2b0',
        align: 'center',
        weight: '900',
        shadow: 'rgba(0,0,0,0.75)',
      });
    }
  }

  #drawObjects(r) {
    for (const obj of this.objects) {
      if (obj.type === 'enemy' || obj.type === 'trap' || obj.type === 'charge') this.#drawPigDemon(r, obj);
      else if (obj.type === 'peach') this.#drawPeach(r, obj);
      else if (obj.type === 'coin') this.#drawCoin(r, obj);
      else if (obj.type === 'shield') this.#drawShield(r, obj);
      else this.#drawBajiePickup(r, obj);
    }
  }

  #drawHero(r) {
    const laneY = lerp(LANES[0], LANES[2], this.lane / 2);
    const y = laneY - this.jump;
    const sp = characterFrame(WUKONG, true, this.t);
    drawCharacter(r, sp, this.x, y + 24, 2.15, {
      alpha: this.invuln > 0 && Math.floor(this.t * 12) % 2 === 0 ? 0.45 : 1,
    });
    if (this.team.includes('bajie')) {
      drawCharacter(r, characterFrame(BAJIE, true, this.t + 0.4), this.x - 42, y + 48, 1.85);
    }
  }

  #drawPigDemon(r, obj) {
    const y = obj.y + Math.sin(this.t * 8 + obj.x * 0.02) * 2;
    r.circle(obj.x, y + 12, 20, 'rgba(0,0,0,0.25)');
    const body = obj.type === 'charge' ? '#7d2c28' : obj.type === 'trap' ? '#6b4c2c' : '#5b3150';
    const accent = obj.type === 'charge' ? '#ff7a5a' : '#ff9fc4';
    r.circle(obj.x, y, obj.low ? 18 : 24, body);
    r.circle(obj.x - 9, y - 8, 7, accent);
    r.circle(obj.x + 9, y - 8, 7, accent);
    r.rect(obj.x - 11, y - 1, 22, 10, obj.type === 'trap' ? '#d9a441' : '#d58a9f');
    r.circle(obj.x - 5, y + 3, 2, '#2a1524');
    r.circle(obj.x + 5, y + 3, 2, '#2a1524');
    if (!obj.low) {
      r.rect(obj.x - 21, y - 26, 8, 13, '#f0d37a');
      r.rect(obj.x + 13, y - 26, 8, 13, '#f0d37a');
    }
  }

  #drawPeach(r, obj) {
    r.circle(obj.x, obj.y, 15 + Math.sin(this.t * 5 + obj.x) * 1.5, '#ff9fc4');
    r.circle(obj.x - 5, obj.y - 4, 8, '#ffb3d0');
    r.rect(obj.x + 4, obj.y - 19, 5, 9, '#4a8a3f');
  }

  #drawCoin(r, obj) {
    const spin = Math.abs(Math.sin(this.t * 7 + obj.x * 0.01));
    r.circle(obj.x, obj.y, 14, '#ffce54');
    r.rect(obj.x - 3 * spin, obj.y - 10, 6 * spin + 2, 20, '#fff2b0');
    r.text('金', obj.x, obj.y + 5, {
      size: 13,
      color: '#7a4a18',
      align: 'center',
      weight: '900',
    });
  }

  #drawShield(r, obj) {
    r.circle(obj.x, obj.y, 16, '#9fd0ff');
    r.circle(obj.x, obj.y, 10, '#fff2b0');
    r.text('符', obj.x, obj.y + 5, {
      size: 13,
      color: '#2a5470',
      align: 'center',
      weight: '900',
    });
  }

  #drawBajiePickup(r, obj) {
    r.circle(obj.x, obj.y + 16, 28, 'rgba(255,206,84,0.22)');
    drawCharacter(r, characterFrame(BAJIE, true, this.t), obj.x, obj.y + 35, 2);
    r.text('八戒', obj.x, obj.y - 36, {
      size: 14,
      color: '#fff2b0',
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.8)',
    });
  }

  #drawHud(r) {
    const p = Math.min(1, this.distance / DIST_TO_WIN);
    r.roundRect(24, 18, 320, 42, 12, 'rgba(10,8,18,0.75)', '#ffce54', 2);
    r.text('高老庄 · 收服八戒', 40, 44, {
      size: 17,
      color: '#fff2b0',
      weight: '900',
      shadow: 'rgba(0,0,0,0.7)',
    });
    r.roundRect(370, 28, 420, 16, 7, 'rgba(0,0,0,0.55)', '#5c3a21', 2);
    r.roundRect(373, 31, 414 * p, 10, 5, '#ffce54');
    r.text(`仙桃 ${this.peaches}`, 826, 43, {
      size: 15,
      color: '#fff2b0',
      align: 'right',
      weight: '900',
      shadow: 'rgba(0,0,0,0.7)',
    });
    r.text(`金币 ${this.coins} · 连击 ${this.combo || 0} · 护符 ${this.shields}`, 826, 66, {
      size: 12,
      color: '#fff2b0',
      align: 'right',
      weight: '800',
      shadow: 'rgba(0,0,0,0.7)',
    });
    r.text(`目标：收集 ${GOAL_PEACHES} 仙桃并带八戒冲出庄口`, GAME.width / 2, 80, {
      size: 13,
      color: this.peaches >= GOAL_PEACHES ? '#7ed957' : '#fff2b0',
      align: 'center',
      weight: '800',
      shadow: 'rgba(0,0,0,0.7)',
    });
    r.text('← → / A D 变道 · ↑ / W / 空格 跳跃', GAME.width / 2, GAME.height - 20, {
      size: 14,
      color: '#fff2b0',
      align: 'center',
      weight: '800',
      shadow: 'rgba(0,0,0,0.7)',
    });
    if (this.flash > 0) r.rect(0, 0, GAME.width, GAME.height, `rgba(255,60,60,${this.flash * 0.7})`);
    if (this.eventText) {
      r.roundRect(268, 104, 424, 34, 10, 'rgba(10,8,18,0.72)', '#ffce54', 2);
      r.text(this.eventText, GAME.width / 2, 126, {
        size: 14,
        color: '#fff2b0',
        align: 'center',
        weight: '900',
        shadow: 'rgba(0,0,0,0.7)',
      });
    }
  }

  #drawIntro(r) {
    this.#drawRoad(r);
    this.#drawHero(r);
    const line = this.dialogue[this.dialogueIndex];
    r.roundRect(112, 334, 736, 126, 16, 'rgba(10,8,18,0.9)', '#ffce54', 3);
    r.text(line.name, 144, 370, {
      size: 20,
      color: '#ffce54',
      weight: '900',
      shadow: 'rgba(0,0,0,0.7)',
    });
    r.text(line.text, GAME.width / 2, 410, {
      size: 18,
      color: '#fff2b0',
      align: 'center',
      weight: '800',
      shadow: 'rgba(0,0,0,0.7)',
    });
    r.text('按 空格 继续', GAME.width / 2, 442, {
      size: 13,
      color: '#cfc6e8',
      align: 'center',
    });
  }

  #drawResult(r) {
    const success = this.result?.success;
    r.rect(0, 0, GAME.width, GAME.height, 'rgba(5,4,10,0.62)');
    r.roundRect(188, 160, 584, 210, 20, 'rgba(10,8,18,0.94)', success ? '#ffce54' : '#ff6b5e', 3);
    r.text(success ? '高老庄通过！' : '高老庄受阻', GAME.width / 2, 214, {
      size: 32,
      color: success ? '#fff2b0' : '#ff9b8f',
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.85)',
    });
    r.text(success ? `八戒入队 · 仙桃 ${this.peaches} · 金币 ${this.coins}` : `进度 ${Math.round(this.result.progress * 100)}% · 仙桃 ${this.peaches}`, GAME.width / 2, 266, {
      size: 18,
      color: '#cfc6e8',
      align: 'center',
      weight: '800',
    });
    r.text('按 空格 返回万象迷途', GAME.width / 2, 328, {
      size: 16,
      color: '#fff2b0',
      align: 'center',
      weight: '800',
    });
  }

  #burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.55,
        max: 0.55,
        color,
      });
    }
  }

  #updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  #drawParticles(r) {
    const ctx = r.ctx;
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      r.rect(p.x, p.y, 5, 5, p.color);
    }
    ctx.globalAlpha = 1;
  }

  #showEvent(text) {
    this.eventText = text;
    this.eventTimer = 2.2;
  }

  #drawHouse(r, x, y, scale = 1) {
    const w = 128 * scale;
    const h = 70 * scale;
    r.rect(x, y + 30 * scale, w, h, '#8b5a34');
    r.rect(x + 8 * scale, y + 40 * scale, w - 16 * scale, h - 10 * scale, '#caa26a');
    r.rect(x - 10 * scale, y + 8 * scale, w + 20 * scale, 34 * scale, '#b84638');
    r.rect(x + 45 * scale, y + 64 * scale, 26 * scale, 36 * scale, '#5c3a21');
    r.rect(x + 14 * scale, y + 54 * scale, 20 * scale, 18 * scale, '#5fa8e8');
    r.rect(x + 90 * scale, y + 54 * scale, 20 * scale, 18 * scale, '#5fa8e8');
  }

  #drawWell(r, x, y) {
    r.circle(x, y + 12, 24, 'rgba(0,0,0,0.22)');
    r.rect(x - 22, y, 44, 20, '#7a7366');
    r.rect(x - 18, y + 4, 36, 12, '#3f6f88');
    r.rect(x - 20, y - 34, 5, 34, '#5c3a21');
    r.rect(x + 15, y - 34, 5, 34, '#5c3a21');
    r.rect(x - 28, y - 42, 56, 12, '#b84638');
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
