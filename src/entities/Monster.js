const MONSTER_TYPES = {
  1: { hp: 50, atk: 6, coins: 5, color: '#7a4ac8', accent: '#b06bd8', speed: 40 },
  2: { hp: 78, atk: 9, coins: 9, color: '#a04436', accent: '#ff7a5a', speed: 36 },
  3: { hp: 110, atk: 12, coins: 14, color: '#4b4a65', accent: '#ffce54', speed: 32 },
};

const MONSTER_KINDS = {
  grunt: { name: '小妖', range: 42, colorShift: null },
  venom: { name: '毒雾妖', range: 46, colorShift: { a: '#3f9c5a', b: '#246b3b', c: '#9ee66f' }, slow: 1.1 },
  ranged: { name: '妖火射手', range: 235, minRange: 105, colorShift: { a: '#2d6fb3', b: '#1b416d', c: '#7fd7ff' }, projectile: true },
  stunner: { name: '震魂妖', range: 48, colorShift: { a: '#b8892e', b: '#77511d', c: '#fff2b0' }, stun: 0.65 },
  brute: { name: '石甲妖', range: 44, colorShift: { a: '#6b6678', b: '#3d394d', c: '#ff8a5e' }, atkMul: 1.25 },
};

const MONSTER_PIXEL = {
  1: {
    scale: 2,
    palette: {
      '.': null,
      k: '#100b18',
      a: '#7a4ac8',
      b: '#4c2b82',
      c: '#b06bd8',
      e: '#fff2b0',
      r: '#ff5b4d',
      s: '#2a183a',
    },
  },
  2: {
    scale: 2.15,
    palette: {
      '.': null,
      k: '#180c0b',
      a: '#a04436',
      b: '#66251f',
      c: '#ff7a5a',
      e: '#fff2b0',
      r: '#ffce54',
      s: '#321312',
    },
  },
  3: {
    scale: 2.3,
    palette: {
      '.': null,
      k: '#090812',
      a: '#4b4a65',
      b: '#2b2a40',
      c: '#ffce54',
      e: '#fff2b0',
      r: '#ff5b4d',
      s: '#171623',
    },
  },
};

const MONSTER_FRAMES = [
  [
    '...c......c...',
    '..ck....kc...',
    '...kkkkkk....',
    '..kbbbbbbk...',
    '.kbbaabbabk..',
    '.kbaaeeaabk..',
    'kbbabssbabk..',
    'kbaaaaaaaabk.',
    'kbaaarrraaak.',
    '.kbaaaaaabk..',
    '..kbbccbbk...',
    '...kk..kk....',
    '..kk....kk...',
    '.kk......kk..',
  ],
  [
    '...c......c...',
    '..ck....kc...',
    '...kkkkkk....',
    '..kbbbbbbk...',
    '.kbbaabbabk..',
    '.kbaaeeaabk..',
    'kbbabssbabk..',
    'kbaaaaaaaabk.',
    'kbaaarrraaak.',
    '.kbaaaaaabk..',
    '..kbbccbbk...',
    '...kk..kk....',
    '.kk......kk..',
    '..kk....kk...',
  ],
];

export class Monster {
  constructor(spawn) {
    const def = MONSTER_TYPES[spawn.tier] || MONSTER_TYPES[1];
    const kind = MONSTER_KINDS[spawn.kind] || MONSTER_KINDS.grunt;
    this.x = spawn.x;
    this.y = spawn.y;
    this.homeX = spawn.x;
    this.homeY = spawn.y;
    this.tier = spawn.tier || 1;
    this.kind = spawn.kind || 'grunt';
    this.kindDef = kind;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.atk = Math.round(def.atk * (kind.atkMul || 1));
    this.coins = def.coins;
    this.color = def.color;
    this.accent = kind.colorShift?.c || def.accent;
    this.speed = def.speed;
    this.r = 18 + this.tier * 2;
    this.attackCd = 0;
    this.hitFlash = 0;
    this.slowTimer = 0;
    this.dead = false;
  }

  update(dt, player) {
    if (this.dead) return null;
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.slowTimer = Math.max(0, this.slowTimer - dt);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const desiredMin = this.kindDef.minRange || 34;
    if (dist < 230 && dist > desiredMin && this.slowTimer <= 0) {
      const speed = this.speed * (dist < 95 ? 0.75 : 1);
      this.x += (dx / dist) * speed * dt;
      this.y += (dy / dist) * speed * dt;
    } else if (this.kindDef.projectile && dist < desiredMin * 0.82 && this.slowTimer <= 0) {
      this.x -= (dx / dist) * this.speed * 0.55 * dt;
      this.y -= (dy / dist) * this.speed * 0.55 * dt;
    } else if (dist >= 210) {
      const hx = this.homeX - this.x;
      const hy = this.homeY - this.y;
      const homeDist = Math.hypot(hx, hy) || 1;
      if (homeDist > 4) {
        this.x += (hx / homeDist) * this.speed * 0.35 * dt;
        this.y += (hy / homeDist) * this.speed * 0.35 * dt;
      }
    }

    if (dist <= this.kindDef.range && this.attackCd <= 0) {
      this.attackCd = this.kindDef.projectile ? 1.9 : 1.25;
      return {
        damage: this.atk,
        stun: this.kindDef.stun || 0,
        slow: this.kindDef.slow || 0,
        projectile: Boolean(this.kindDef.projectile),
        color: this.accent,
        from: { x: this.x, y: this.y },
        to: { x: player.x, y: player.y },
      };
    }
    return null;
  }

  takeDamage(amount, opts = {}) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.18;
    if (opts.slow) this.slowTimer = Math.max(this.slowTimer, opts.slow);
    if (opts.knockback) {
      const force = opts.knockback.force || 0;
      this.x += opts.knockback.x * force;
      this.y += opts.knockback.y * force;
    }
    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  draw(r, t) {
    if (this.dead) return;
    const ctx = r.ctx;
    const bob = Math.sin(t * 5 + this.x * 0.01) * 2;
    const art = MONSTER_PIXEL[this.tier] || MONSTER_PIXEL[1];
    const frame = MONSTER_FRAMES[Math.floor(t * 4 + this.x * 0.01) % MONSTER_FRAMES.length];
    const palette = this.kindDef.colorShift ? { ...art.palette, ...this.kindDef.colorShift } : art.palette;
    const sp = {
      data: frame,
      palette: this.hitFlash > 0 ? { ...palette, a: '#fff2b0', b: '#f0d46a', c: '#ffffff' } : palette,
    };
    const scale = art.scale;
    const w = frame[0].length * scale;
    const h = frame.length * scale;

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 18, this.r, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4 向描边，和主角/NPC 的像素风保持一致。
    const x0 = this.x - w / 2;
    const y0 = this.y + bob - h / 2;
    const o = scale;
    for (const [ox, oy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) {
      r.sprite(sp, x0 + ox, y0 + oy, scale, { colorOverride: '#07050c' });
    }
    r.sprite(sp, x0, y0, scale);

    if (this.slowTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = '#9fd0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, this.r + 6, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.#drawHp(r);
  }

  #drawHp(r) {
    const w = 54;
    const h = 8;
    const x = this.x - w / 2;
    const y = this.y - this.r - 18;
    r.roundRect(x, y, w, h, 3, 'rgba(0,0,0,0.78)', 'rgba(255,255,255,0.22)', 1);
    r.roundRect(x + 2, y + 2, (w - 4) * (this.hp / this.maxHp), h - 4, 2, '#ff5b4d');
  }
}
