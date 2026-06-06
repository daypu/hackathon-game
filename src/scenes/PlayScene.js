import { GAME, STATS, STAT_MAX } from '../config.js';
import { clamp, aabb, circleHit } from '../engine/utils.js';
import { Player } from '../entities/Player.js';
import { ParticleSystem } from '../entities/particles.js';
import { drawOpenWorldHud } from '../ui/hud.js';
import { evaluate } from '../systems/ScoreSystem.js';
import { ResultScene } from './ResultScene.js';
import {
  SCENES,
  ZONES,
  drawOpenWorld,
  generateOpenWorldEntities,
  getZoneAt,
  isInRect,
  makeCamera,
  sceneBounds,
  scenePalette,
  sceneProgress,
} from '../openWorld.js';

const statByKey = (k) => STATS.find((s) => s.key === k);

export class PlayScene {
  constructor(game) {
    this.g = game;
    this.r = game.r;
  }

  enter() {
    this.player = new Player();
    const startParam =
      typeof location !== 'undefined'
        ? new URLSearchParams(location.search).get('scene')
        : null;
    this.sceneKey = SCENES[startParam] ? startParam : 'changan';
    this.currentScene = SCENES[this.sceneKey];
    this.player.setPosition(this.currentScene.spawn.x, this.currentScene.spawn.y);
    this.fx = new ParticleSystem();
    this.entitiesByScene = generateOpenWorldEntities();
    this.#loadSceneEntities();
    this.miasma = this.currentScene.miasma;
    this.shake = 0;
    this.state = 'playing'; // playing | paused | ending
    this.endTimer = 0;
    this.reached = false;
    this.camera = makeCamera(this.player, this.currentScene);
    this.transitionLock = 0.4;
    this.armedExits = new Set(); // 需先离开传送门再走入才触发，避免出生即被弹走
    this.debugColliders = typeof location !== 'undefined' && location.search.includes('colliders');
    this.discovered = new Set([this.sceneKey]);
    this.currentZone = getZoneAt(this.player.x, this.player.y, this.sceneKey);
    this.message = '大地图探索已开启：自由走动，相机会跟随，走到边缘传送点切换场景。';
    this.messageTimer = 4.5;
    this.run = {
      hits: 0,
      picks: 0,
      picksByType: {},
      pickTypes: new Set(),
      cloudUsed: 0,
      shieldBlocked: 0,
      streak: 0,
      maxStreak: 0,
      zonesDiscovered: 1,
    };
    this.g.audio.ensure();
    this.g.audio.startBgm();
  }

  exit() {
    this.g.audio.stopBgm();
  }

  #loadSceneEntities() {
    const sceneEntities = this.entitiesByScene[this.sceneKey];
    this.hazards = sceneEntities.hazards;
    this.pickups = sceneEntities.pickups;
  }

  update(dt) {
    const input = this.g.input;

    if (this.state === 'paused') {
      if (input.just('pause') || input.just('confirm')) this.state = 'playing';
      return;
    }
    if (this.state === 'playing' && input.just('pause')) {
      this.state = 'paused';
      return;
    }

    if (this.state === 'ending') {
      this.endTimer -= dt;
      this.fx.update(dt);
      this.shake = Math.max(0, this.shake - dt);
      if (this.endTimer <= 0) this.#finish();
      return;
    }

    this.player.updateFree(dt, input, sceneBounds(this.currentScene), this.currentScene.colliders || []);
    this.camera = makeCamera(this.player, this.currentScene);
    this.#updateZone();

    for (const h of this.hazards) h.update(dt, 0);
    for (const p of this.pickups) p.update(dt, 0);

    this.#collisions();

    this.hazards = this.hazards.filter((h) => !h.dead);
    this.pickups = this.pickups.filter((p) => !p.dead);
    this.entitiesByScene[this.sceneKey] = {
      hazards: this.hazards,
      pickups: this.pickups,
    };

    this.fx.update(dt);
    this.shake = Math.max(0, this.shake - dt);
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    this.transitionLock = Math.max(0, this.transitionLock - dt);

    if (this.player.isDead()) this.#beginEnd(false);
    else if (this.transitionLock <= 0 && this.#checkGoal()) this.#beginEnd(true);
    else if (this.transitionLock <= 0) this.#checkTransitions();
  }

  #updateZone() {
    const zone = getZoneAt(this.player.x, this.player.y, this.sceneKey);
    this.currentZone = zone;
    this.miasma = zone.miasma;
    if (!this.discovered.has(zone.key)) {
      this.discovered.add(zone.key);
      this.run.zonesDiscovered = this.discovered.size;
      this.message = `进入新场景：${zone.label}。${zone.desc}`;
      this.messageTimer = 4;
      this.g.audio.sfx('select');
      this.fx.text(this.player.x, this.player.y - 58, zone.label, '#fff2b0', {
        size: 22,
        life: 1.4,
      });
      this.fx.burst(this.player.x, this.player.y, 22, {
        color: zone.edge,
        speed: 160,
        life: 0.7,
        size: 5,
      });
    }
  }

  #checkTransitions() {
    const exits = this.currentScene.exits;
    for (let i = 0; i < exits.length; i++) {
      const ex = exits[i];
      const inside = isInRect(this.player, ex);
      if (!inside) {
        this.armedExits.add(i); // 玩家已离开此门，武装它
        continue;
      }
      if (this.armedExits.has(i)) {
        this.#transitionTo(ex.to, ex.spawn, ex.label);
        return;
      }
    }
  }

  #transitionTo(sceneKey, spawn, label) {
    this.sceneKey = sceneKey;
    this.currentScene = SCENES[sceneKey];
    this.#loadSceneEntities();
    this.player.setPosition(spawn.x, spawn.y);
    this.player.grace = 0.6; // 进入新场景短暂护佑
    this.camera = makeCamera(this.player, this.currentScene);
    this.transitionLock = 0.4;
    this.armedExits = new Set();
    this.currentZone = this.currentScene;
    this.miasma = this.currentScene.miasma;
    this.message = label ? `${label} —— ${this.currentScene.desc}` : `进入${this.currentScene.label}`;
    this.messageTimer = 3.5;
    this.g.audio.sfx('select');
    this.fx.reset();
    if (!this.discovered.has(sceneKey)) {
      this.discovered.add(sceneKey);
      this.run.zonesDiscovered = this.discovered.size;
    }
  }

  #checkGoal() {
    return this.currentScene.goal && isInRect(this.player, this.currentScene.goal);
  }

  #collisions() {
    const hb = this.player.getHitbox();
    for (const h of this.hazards) {
      if (h.used || h.dead) continue;
      if (aabb(hb, h.getHitbox())) this.#onHit(h);
    }
    const cx = this.player.x;
    const cy = this.player.y - 2;
    for (const p of this.pickups) {
      if (p.collected || p.dead) continue;
      if (circleHit(cx, cy, 20, p.x, p.y, p.r)) this.#onCollect(p);
    }
  }

  #onHit(h) {
    const def = h.def;
    const res = this.player.damage(def.stat, def.dmg);
    h.used = true;

    if (res.applied) {
      this.run.hits++;
      this.run.streak = 0;
      this.shake = 0.35;
      this.g.audio.sfx('hit');

      if (def.effect === 'pushback') {
        const dx = this.player.x - h.x;
        const dy = this.player.y - h.y;
        const len = Math.hypot(dx, dy) || 1;
        this.player.push((dx / len) * 90, (dy / len) * 90, sceneBounds(this.currentScene));
      }
      if (def.effect === 'slow') this.player.applyWeb(1.6);
      if (def.effect === 'random') {
        const others = ['mana', 'faith', 'scripture'].filter((k) => k !== def.stat);
        const k = others[(Math.random() * others.length) | 0];
        this.player.stats[k] = clamp(
          this.player.stats[k] - def.dmg * 0.5,
          0,
          STAT_MAX
        );
      }

      const st = statByKey(def.stat);
      this.fx.text(this.player.x, this.player.y - 36, `${st.label} -${def.dmg}`, '#ff7a6a');
      this.fx.burst(h.x, h.y, 14, { color: def.color, speed: 150, life: 0.5, size: 5 });
    } else if (res.blocked === 'shield') {
      this.run.shieldBlocked++;
      this.g.audio.sfx('shield');
      this.fx.text(this.player.x, this.player.y - 36, '护身符 抵挡!', '#ff8a5e');
      this.fx.burst(this.player.x, this.player.y, 18, {
        color: '#ff8a5e',
        speed: 170,
        life: 0.5,
        size: 5,
      });
    } else if (res.blocked === 'cloud') {
      this.fx.burst(h.x, h.y, 12, { color: '#eaf4ff', speed: 170, life: 0.4, size: 5 });
    }
  }

  #onCollect(p) {
    p.collected = true;
    p.dead = true;
    const def = p.def;
    this.run.picks++;
    this.run.picksByType[p.type] = (this.run.picksByType[p.type] || 0) + 1;
    this.run.pickTypes.add(p.type);

    if (def.effect === 'cloud') {
      this.player.applyCloud(def.duration);
      this.run.cloudUsed++;
      this.g.audio.sfx('good');
      this.fx.text(p.x, p.y - 22, '筋斗云!', '#9fd0ff');
    } else if (def.effect === 'shield') {
      this.player.applyShield();
      this.g.audio.sfx('good');
      this.fx.text(p.x, p.y - 22, '护身符!', '#ff8a5e');
    } else {
      this.player.heal(def.stat, def.heal);
      this.g.audio.sfx('pickup');
      const st = statByKey(def.stat);
      this.fx.text(p.x, p.y - 22, `${st.label} +${def.heal}`, st.glow);
    }
    this.run.streak++;
    this.run.maxStreak = Math.max(this.run.maxStreak, this.run.streak);
    this.fx.burst(p.x, p.y, 12, { color: def.color, speed: 120, life: 0.5, size: 4 });
  }

  #beginEnd(reached) {
    this.reached = reached;
    this.state = 'ending';
    this.endTimer = reached ? 1.0 : 0.9;
    this.g.audio.stopBgm();
    this.g.audio.sfx(reached ? 'win' : 'lose');
    if (!reached) this.shake = 0.5;
    const cx = this.player.x;
    const cy = this.player.y;
    const color = reached ? '#ffe9a8' : '#ff6a5a';
    this.fx.burst(cx, cy, 30, { color, speed: 220, life: 0.9, size: 6, up: 40 });
  }

  #finish() {
    this.g.shared.result = evaluate(this.player, this.run, this.reached, this.#progress());
    this.g.setScene(new ResultScene(this.g));
  }

  draw() {
    const r = this.r;
    const ctx = r.ctx;
    const t = this.g.t;

    ctx.save();
    if (this.shake > 0) {
      const s = this.shake * 10;
      ctx.translate((Math.random() * 2 - 1) * s, (Math.random() * 2 - 1) * s);
    }
    ctx.translate(-this.camera.x, -this.camera.y);
    drawOpenWorld(r, this.currentScene, t);
    for (const p of this.pickups) if (this.#visible(p, 80)) p.draw(r);
    for (const h of this.hazards) if (this.#visible(h, 100)) h.draw(r);
    this.player.draw(r, t);
    this.fx.draw(r);
    if (this.debugColliders) {
      ctx.lineWidth = 4;
      for (const c of this.currentScene.colliders || []) {
        ctx.fillStyle = 'rgba(255,0,255,0.25)';
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = '#ff2fff';
        ctx.strokeRect(c.x, c.y, c.w, c.h);
      }
      for (const ex of this.currentScene.exits) {
        ctx.fillStyle = 'rgba(0,220,255,0.3)';
        ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
        ctx.strokeStyle = '#00e0ff';
        ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
      }
      if (this.currentScene.goal) {
        const g = this.currentScene.goal;
        ctx.fillStyle = 'rgba(255,206,84,0.4)';
        ctx.fillRect(g.x, g.y, g.w, g.h);
      }
    }
    ctx.restore();

    drawOpenWorldHud(r, this.player, this.miasma, this.#progress(), t, {
      zone: this.currentZone,
      scene: this.currentScene,
      camera: this.camera,
      hazards: this.hazards,
      pickups: this.pickups,
      floorColor: scenePalette(this.sceneKey).base,
      discovered: this.discovered,
      totalZones: ZONES.length,
      nearLingshan: Boolean(this.currentScene.goal),
      message: this.messageTimer > 0 ? this.message : '',
      relics: this.run.picksByType.scripturePage || 0,
      sceneKey: this.sceneKey,
    });

    if (this.state === 'ending' && !this.reached) this.#vignette(r, 'rgba(80,0,0,0.45)');
    if (this.state === 'paused') this.#drawPause(r);
  }

  #progress() {
    return sceneProgress(this.sceneKey, this.discovered);
  }

  #visible(ent, pad) {
    return (
      ent.x > this.camera.x - pad &&
      ent.x < this.camera.x + GAME.width + pad &&
      ent.y > this.camera.y - pad &&
      ent.y < this.camera.y + GAME.height + pad
    );
  }

  #vignette(r, color) {
    const ctx = r.ctx;
    const g = ctx.createRadialGradient(
      GAME.width / 2, GAME.height / 2, 120,
      GAME.width / 2, GAME.height / 2, 520
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GAME.width, GAME.height);
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
    r.text('按 空格 / P 继续取经', GAME.width / 2, GAME.height / 2 + 34, {
      size: 16,
      color: '#cfc6e8',
      align: 'center',
    });
  }
}
