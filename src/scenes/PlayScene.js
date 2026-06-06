import { GAME } from '../config.js';
import { Player } from '../entities/Player.js';
import { Npc } from '../entities/Npc.js';
import { Monster } from '../entities/Monster.js';
import { ParticleSystem } from '../entities/particles.js';
import { combatButtonAt, drawHubHud, partySlotAt, shopHitAt } from '../ui/hud.js';
import { MONSTER_SPAWNS, SKILL_COOLDOWN, skillFor } from '../combat.js';
import {
  NPCS,
  completeStoryObjective,
  createStoryState,
  currentChapter,
  currentStoryInfo,
  isLevelUnlocked,
  levelProgressState,
  triggerNpcStory,
} from '../story.js';
import {
  WORLD,
  LEVELS,
  drawWorld,
  makeCamera,
  worldBounds,
  levelAt,
  getWorldImage,
} from '../openWorld.js';

// 关卡总图（hub）：自由探索，走入发光法阵即可进入对应关卡。
// 关卡玩法内容待开发，这里通过 #startLevel 保留统一接入接口。
export class PlayScene {
  constructor(game) {
    this.g = game;
    this.r = game.r;
    // 调试：URL 带 ?overview 时进入全图法阵校对视图
    this.debugOverview = new URLSearchParams(location.search).has('overview');
  }

  enter() {
    this.player = new Player();
    this.player.setPosition(WORLD.spawn.x, WORLD.spawn.y);
    this.fx = new ParticleSystem();
    this.story = createStoryState();
    this.npcs = NPCS.map((def) => new Npc(def));
    this.monsters = MONSTER_SPAWNS.map((spawn) => new Monster(spawn));
    this.skillEffects = [];
    this.shopOpen = false;
    this.camera = makeCamera(this.player);
    this.state = 'playing'; // playing | paused
    this.activeLevel = null;
    this.nearNpc = null;
    this.dialogue = null;
    this.message = currentStoryInfo(this.story).objective;
    this.messageTimer = 5;
    this.toast = '';
    this.toastTimer = 0;
    this.enterLock = 0.3;
    this.coins = 0;
    this.attackCooldown = 0;
    this.skillCooldown = 0;
    this.g.audio.ensure();
    this.g.audio.startBgm();
  }

  exit() {
    this.g.audio.stopBgm();
  }

  update(dt) {
    const input = this.g.input;

    if (this.state === 'paused') {
      if (input.just('pause') || input.just('confirm')) this.state = 'playing';
      return;
    }
    if (input.just('pause')) {
      this.state = 'paused';
      return;
    }

    if (this.dialogue) {
      if (input.just('confirm')) this.#advanceDialogue();
      this.fx.update(dt);
      this.#updateSkillEffects(dt);
      this.messageTimer = Math.max(0, this.messageTimer - dt);
      this.toastTimer = Math.max(0, this.toastTimer - dt);
      return;
    }

    if (!this.debugOverview && input.pointer.justDown) {
      const shopHit = shopHitAt(input.pointer.x, input.pointer.y, this.shopOpen);
      if (shopHit) {
        if (shopHit.action === 'toggle') this.shopOpen = !this.shopOpen;
        else if (shopHit.action === 'item') this.#buyShopItem(shopHit.item);
        else if (shopHit.action === 'close') this.shopOpen = false;
        return;
      }

      const combatAction = combatButtonAt(input.pointer.x, input.pointer.y);
      if (combatAction) {
        if (combatAction === 'attack') this.#normalAttack(this.#inputAim(input));
        else this.#useSkill(this.#inputAim(input));
        return;
      }

      const slot = partySlotAt(input.pointer.x, input.pointer.y);
      if (slot) {
        if (this.player.setCharacter(slot.key)) {
          this.toast = `已切换为「${slot.label}」`;
          this.toastTimer = 1.2;
          this.g.audio.sfx('select');
        }
        return;
      }
    }

    this.player.updateFree(dt, input, worldBounds(), WORLD.colliders, WORLD.walkZones);
    this.camera = makeCamera(this.player);
    for (const npc of this.npcs) npc.update(dt, this.player);
    this.#updateMonsters(dt);
    this.#updateSkillEffects(dt);
    this.nearNpc = this.#nearestNpc();

    // 进入/离开法阵检测
    const lv = levelAt(this.player.x, this.player.y);
    if (lv !== this.activeLevel) {
      this.activeLevel = lv;
      if (lv) {
        const storyInfo = currentStoryInfo(this.story);
        const state = levelProgressState(this.story, lv.key);
        this.message =
          state === 'unlocked'
            ? `已解锁「${lv.label}」法阵 —— 按 空格 点亮进度`
            : state === 'completed'
              ? `「${lv.label}」进度已点亮，可继续寻找下一段剧情。`
              : `「${lv.label}」尚未解锁：${storyInfo.objective}`;
        this.messageTimer = 6;
        this.g.audio.sfx('select');
        this.fx.burst(lv.x, lv.y, state === 'locked' ? 8 : 20, {
          color: state === 'locked' ? '#8e849b' : lv.color,
          speed: 150,
          life: 0.6,
          size: 5,
        });
      }
    }

    this.enterLock = Math.max(0, this.enterLock - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.skillCooldown = Math.max(0, this.skillCooldown - dt);

    if (input.just('attack')) {
      this.#normalAttack(this.#inputAim(input));
    }
    if (input.just('skill')) {
      this.#useSkill(this.#inputAim(input));
    }

    if (this.nearNpc && input.just('confirm')) {
      this.#startDialogue(this.nearNpc);
      return;
    }
    if (lv && this.enterLock <= 0 && input.just('confirm')) {
      this.#startLevel(lv);
    }

    this.fx.update(dt);
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    this.toastTimer = Math.max(0, this.toastTimer - dt);
  }

  #updateMonsters(dt) {
    for (const monster of this.monsters) {
      const hit = monster.update(dt, this.player);
      if (!hit) continue;
      if (hit.projectile) {
        this.skillEffects.push({
          type: 'bolt',
          x1: hit.from.x,
          y1: hit.from.y - 12,
          x2: hit.to.x,
          y2: hit.to.y - 10,
          color: hit.color,
          life: 0.28,
          max: 0.28,
        });
      }
      if (this.player.isCurrentDead()) continue;
      const result = this.player.damage('mana', hit.damage, {
        stun: hit.stun,
      });
      if (result.applied) {
        this.fx.text(this.player.x, this.player.y - 32, `-${hit.damage}`, '#ff7a6a');
        if (hit.stun) this.fx.text(this.player.x, this.player.y - 50, '眩晕', '#fff2b0', { size: 14, life: 0.7 });
        if (hit.slow) this.player.applyWeb(hit.slow);
      }
    }
    this.monsters = this.monsters.filter((m) => !m.dead);
  }

  #normalAttack(dir = null) {
    if (this.attackCooldown > 0) return;
    if (this.player.isCurrentDead()) {
      this.fx.text(this.player.x, this.player.y - 38, '角色倒下', '#ff6b5e', { size: 14, life: 0.7 });
      return;
    }
    this.attackCooldown = 0.72;
    const aim = dir || this.#aimDir();
    this.player.playAction('attack', '#ffce54', aim);
    const targets = this.#frontConeMonsters(92, 1.05, aim);
    if (targets.length === 0) {
      this.fx.text(this.player.x, this.player.y - 36, '未命中', '#cfc6e8');
      return;
    }
    for (const target of targets) {
      this.#damageMonster(target, 8 + this.player.attackBonus, {
        color: '#ffce54',
        label: '普攻',
        knockback: { x: aim.x, y: aim.y, force: 34 },
      });
    }
  }

  #useSkill(dir = null) {
    if (this.skillCooldown > 0) {
      return;
    }
    if (this.player.isCurrentDead()) {
      this.fx.text(this.player.x, this.player.y - 38, '角色倒下', '#ff6b5e', { size: 14, life: 0.7 });
      return;
    }
    const skill = skillFor(this.player.characterKey);
    const aim = dir || this.#aimDir();
    this.skillCooldown = SKILL_COOLDOWN;
    this.player.playAction('skill', skill.color, aim);
    const effect = this.#createSkillEffect(skill, aim);
    const targets = this.#skillTargets(skill, effect);
    this.skillEffects.push(effect);

    for (const monster of targets) {
      this.#damageMonster(monster, skill.damage + this.player.skillBonus, {
        color: skill.color,
        label: skill.label,
        slow: skill.slow,
      });
    }
    if (skill.heal) {
      this.player.heal('faith', skill.heal);
      this.fx.text(this.player.x, this.player.y - 48, `信念 +${skill.heal}`, '#fff2b0');
    }
    this.fx.burst(this.player.x, this.player.y, 18, {
      color: skill.color,
      speed: 170,
      life: 0.45,
      size: 5,
    });
    this.g.audio.sfx('good');
  }

  #createSkillEffect(skill, dir) {
    const origin = { x: this.player.x, y: this.player.y - 14 };
    const end = {
      x: origin.x + dir.x * skill.range,
      y: origin.y + dir.y * skill.range,
    };

    if (skill.type === 'aoe') {
      return {
        type: 'ring',
        x: this.player.x,
        y: this.player.y,
        r: skill.range,
        color: skill.color,
        life: 0.52,
        max: 0.52,
      };
    }
    if (skill.type === 'cone') {
      return {
        type: 'cone',
        x: this.player.x,
        y: this.player.y,
        dir,
        range: skill.range,
        angle: skill.angle,
        color: skill.color,
        life: 0.42,
        max: 0.42,
      };
    }
    return {
      type: skill.type === 'beam' ? 'beam' : 'wave',
      x1: origin.x,
      y1: origin.y,
      x2: end.x,
      y2: end.y,
      width: skill.width || 30,
      color: skill.color,
      life: skill.type === 'beam' ? 0.28 : 0.46,
      max: skill.type === 'beam' ? 0.28 : 0.46,
    };
  }

  #skillTargets(skill, effect) {
    if (skill.type === 'aoe') {
      return this.monsters.filter((m) => this.#distToPlayer(m) <= skill.range);
    }
    if (skill.type === 'cone') {
      return this.monsters.filter((m) => {
        const dx = m.x - effect.x;
        const dy = m.y - effect.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist > skill.range) return false;
        const dot = (dx / dist) * effect.dir.x + (dy / dist) * effect.dir.y;
        return dot >= Math.cos(skill.angle / 2);
      });
    }
    return this.monsters.filter((m) => {
      const d2 = distanceToSegmentSq(m.x, m.y, effect.x1, effect.y1, effect.x2, effect.y2);
      const hitR = (skill.width || 30) + m.r * 0.7;
      return d2 <= hitR * hitR;
    });
  }

  #updateSkillEffects(dt) {
    for (const e of this.skillEffects) e.life -= dt;
    this.skillEffects = this.skillEffects.filter((e) => e.life > 0);
  }

  #damageMonster(monster, damage, opts = {}) {
    const killed = monster.takeDamage(damage, opts);
    this.fx.text(monster.x, monster.y - 30, `${opts.label || '攻击'} -${damage}`, opts.color || '#ffce54');
    this.fx.burst(monster.x, monster.y, 10, {
      color: opts.color || '#ffce54',
      speed: 120,
      life: 0.35,
      size: 4,
    });
    if (killed) {
      this.coins += monster.coins;
      this.g.audio.sfx('pickup');
      this.fx.text(monster.x, monster.y - 48, `+${monster.coins} 金币`, '#ffce54');
    } else {
      this.g.audio.sfx('hit');
    }
  }

  #buyShopItem(item) {
    if (this.coins < item.cost) {
      this.fx.text(this.player.x, this.player.y - 38, '金币不足', '#cfc6e8', {
        size: 14,
        life: 0.55,
      });
      this.g.audio.sfx('select');
      return;
    }
    if (!this.player.applyShopItem(item.key)) return;
    this.coins -= item.cost;
    this.fx.text(this.player.x, this.player.y - 46, `${item.label} 生效`, item.color, {
      size: 16,
      life: 0.8,
    });
    this.fx.burst(this.player.x, this.player.y, 14, {
      color: item.color,
      speed: 125,
      life: 0.45,
      size: 4,
    });
    this.g.audio.sfx('good');
  }

  #nearestMonster(range) {
    let best = null;
    let bestDist = Infinity;
    for (const monster of this.monsters) {
      const dist = this.#distToPlayer(monster);
      if (dist <= range && dist < bestDist) {
        best = monster;
        bestDist = dist;
      }
    }
    return best;
  }

  #frontConeMonster(range, angle, dir = null) {
    const targets = this.#frontConeMonsters(range, angle, dir);
    return targets[0] || null;
  }

  #frontConeMonsters(range, angle, dir = null) {
    const hits = [];
    const aim = dir || this.#aimDir();
    for (const monster of this.monsters) {
      const dx = monster.x - this.player.x;
      const dy = monster.y - this.player.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > range) continue;
      const dot = (dx / dist) * aim.x + (dy / dist) * aim.y;
      if (dot < Math.cos(angle / 2)) continue;
      hits.push({ monster, dist });
    }
    return hits.sort((a, b) => a.dist - b.dist).map((h) => h.monster);
  }

  #distToPlayer(ent) {
    return Math.hypot(ent.x - this.player.x, ent.y - this.player.y);
  }

  #inputAim(input) {
    const ax = input.axisX();
    const ay = input.axisY();
    if (ax === 0 && ay === 0) return this.#aimDir();
    return cardinalAim(ax, ay);
  }

  #aimDir() {
    return normalize(this.player.aimX || this.player.facing, this.player.aimY || 0);
  }

  // ★ 关卡接入接口（内容待开发）★
  // 未来在此切换到对应关卡的玩法场景，例如：
  //   this.g.setScene(new LevelScene(this.g, lv.key));
  // lv.key 取值：huaguoshan / gaolaozhuang / liushahe / huoyanshan / leiyinsi
  #startLevel(lv) {
    const before = currentChapter(this.story);
    if (!isLevelUnlocked(this.story, lv.key)) {
      const state = levelProgressState(this.story, lv.key);
      const storyInfo = currentStoryInfo(this.story);
      this.toast =
        state === 'completed'
          ? `「${lv.label}」进度已点亮`
          : `尚未解锁：先触发 NPC 剧情`;
      this.message = state === 'completed' ? storyInfo.objective : storyInfo.objective;
      this.messageTimer = 5;
      this.toastTimer = 2.2;
      this.enterLock = 0.5;
      this.g.audio.sfx('select');
      return;
    }
    const result = completeStoryObjective(this.story, lv.key);
    if (result.advanced) {
      this.toast = `已点亮：${lv.label}`;
      this.message = currentStoryInfo(this.story).objective || result.chapter.startMessage;
      this.messageTimer = 6;
    } else if (before.targetLevel) {
      const target = LEVELS.find((level) => level.key === before.targetLevel);
      this.toast = `主线目标：先去「${target ? target.label : before.targetLevel}」`;
      this.message = before.objective;
      this.messageTimer = 5;
    } else {
      this.toast = '主线已完成，可继续自由探索';
      this.message = before.objective;
      this.messageTimer = 5;
    }
    this.toastTimer = 2.4;
    this.enterLock = 0.6;
    this.g.audio.sfx('start');
    this.fx.burst(this.player.x, this.player.y, 26, {
      color: lv.color,
      speed: 200,
      life: 0.8,
      size: 6,
      up: 30,
    });
  }

  #nearestNpc() {
    let best = null;
    let bestDist = Infinity;
    for (const npc of this.npcs) {
      const dist = npc.distanceTo(this.player);
      if (dist < bestDist && npc.canInteract(this.player)) {
        best = npc;
        bestDist = dist;
      }
    }
    return best;
  }

  #startDialogue(npc) {
    this.dialogue = {
      npc,
      lines: npc.lines(this.story),
      index: 0,
    };
    this.message = `正在与「${npc.def.name}」对话`;
    this.messageTimer = 2;
    this.g.audio.sfx('select');
  }

  #advanceDialogue() {
    if (!this.dialogue) return;
    if (this.dialogue.index < this.dialogue.lines.length - 1) {
      this.dialogue.index++;
      this.g.audio.sfx('select');
      return;
    }
    const result = triggerNpcStory(this.story, this.dialogue.npc.def.key);
    const storyInfo = currentStoryInfo(this.story);
    if (result.triggered && storyInfo.targetLevel) {
      const target = LEVELS.find((level) => level.key === storyInfo.targetLevel);
      this.toast = `已解锁：${target ? target.label : '当前法阵'}`;
      this.toastTimer = 2.2;
    }
    this.dialogue = null;
    this.message = storyInfo.objective;
    this.messageTimer = 6;
  }

  draw() {
    const r = this.r;
    const ctx = r.ctx;
    const t = this.g.t;

    if (this.debugOverview) {
      this.#drawOverview(r, t);
      return;
    }

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    drawWorld(r, t, this.activeLevel ? this.activeLevel.key : null, this.#levelStates());
    this.#drawActors(r, t);
    this.#drawSkillEffects(r, t);
    this.fx.draw(r);
    ctx.restore();

    drawHubHud(r, this.player, t, {
      camera: this.camera,
      levels: LEVELS,
      activeLevel: this.activeLevel,
      story: currentStoryInfo(this.story),
      levelStates: this.#levelStates(),
      combat: {
        coins: this.coins,
        attackCooldown: this.attackCooldown,
        attackMaxCooldown: 0.72,
        skillCooldown: this.skillCooldown,
        skillMaxCooldown: SKILL_COOLDOWN,
        skillLabel: skillFor(this.player.characterKey).label,
        skillColor: skillFor(this.player.characterKey).color,
      },
      shop: {
        coins: this.coins,
        open: this.shopOpen,
      },
      revive: {
        visible: this.player.isCurrentDead(),
        seconds: this.player.reviveTimers[this.player.characterKey] || 0,
      },
      nearNpc: this.nearNpc ? this.nearNpc.def : null,
      dialogue: this.dialogue
        ? {
            name: this.dialogue.npc.def.name,
            role: this.dialogue.npc.def.role,
            color: this.dialogue.npc.def.color,
            line: this.dialogue.lines[this.dialogue.index],
            index: this.dialogue.index,
            total: this.dialogue.lines.length,
          }
        : null,
      message: this.messageTimer > 0 ? this.message : '',
      toast: this.toastTimer > 0 ? this.toast : '',
    });

    if (this.state === 'paused') this.#drawPause(r);
  }

  #drawActors(r, t) {
    const beforePlayer = this.npcs.filter((npc) => npc.y <= this.player.y);
    const afterPlayer = this.npcs.filter((npc) => npc.y > this.player.y);
    const drawNpc = (npc) => npc.draw(r, t, this.story, npc === this.nearNpc || (this.dialogue && npc === this.dialogue.npc));
    const beforeMonsters = this.monsters.filter((monster) => monster.y <= this.player.y);
    const afterMonsters = this.monsters.filter((monster) => monster.y > this.player.y);
    for (const npc of beforePlayer) drawNpc(npc);
    for (const monster of beforeMonsters) monster.draw(r, t);
    this.player.draw(r, t);
    for (const monster of afterMonsters) monster.draw(r, t);
    for (const npc of afterPlayer) drawNpc(npc);
  }

  #levelStates() {
    return Object.fromEntries(LEVELS.map((level) => [level.key, levelProgressState(this.story, level.key)]));
  }

  #drawSkillEffects(r, t) {
    const ctx = r.ctx;
    for (const e of this.skillEffects) {
      const a = Math.max(0, e.life / e.max);
      if (e.type === 'beam') {
        ctx.save();
        ctx.globalAlpha = 0.25 + a * 0.55;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#fff2b0';
        ctx.lineWidth = e.width * 0.42;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();
        ctx.strokeStyle = e.color;
        ctx.lineWidth = e.width;
        ctx.globalAlpha = 0.2 + a * 0.45;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const p = i / 7;
          const x = e.x1 + (e.x2 - e.x1) * p;
          const y = e.y1 + (e.y2 - e.y1) * p + Math.sin(t * 30 + i) * 4;
          r.rect(x - 4, y - 4, 8, 8, i % 2 ? '#ffce54' : '#ff5b22');
        }
        ctx.restore();
      } else if (e.type === 'wave') {
        ctx.save();
        ctx.globalAlpha = 0.18 + a * 0.45;
        ctx.lineCap = 'round';
        ctx.strokeStyle = e.color;
        ctx.lineWidth = e.width;
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -t * 80;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.6 * a;
        r.circle(e.x2, e.y2, 16 + (1 - a) * 18, e.color);
        ctx.restore();
      } else if (e.type === 'ring') {
        ctx.save();
        const radius = e.r * (0.25 + (1 - a) * 0.75);
        ctx.globalAlpha = 0.18 + a * 0.35;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.16 * a;
        r.circle(e.x, e.y, radius * 0.65, e.color);
        ctx.restore();
      } else if (e.type === 'cone') {
        ctx.save();
        const facingAngle = Math.atan2(e.dir.y, e.dir.x);
        const start = facingAngle - e.angle / 2;
        const end = facingAngle + e.angle / 2;
        ctx.globalAlpha = 0.16 + a * 0.28;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.arc(e.x, e.y, e.range * (1.05 - a * 0.15), start, end);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.65 * a;
        ctx.strokeStyle = '#fff2b0';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'bolt') {
        ctx.save();
        ctx.globalAlpha = 0.25 + a * 0.55;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();
        ctx.globalAlpha = 0.8 * a;
        r.circle(e.x2, e.y2, 7 + (1 - a) * 8, e.color);
        ctx.restore();
      }
    }
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
    r.text('按 空格 / P 继续探索', GAME.width / 2, GAME.height / 2 + 34, {
      size: 16,
      color: '#cfc6e8',
      align: 'center',
    });
  }

  // 调试：把整张大地图缩放到一屏，叠加 5 个法阵圈用于校对位置
  #drawOverview(r, t) {
    const ctx = r.ctx;
    const s = Math.min(GAME.width / WORLD.w, GAME.height / WORLD.h);
    const dw = WORLD.w * s;
    const dh = WORLD.h * s;
    const ox = (GAME.width - dw) / 2;
    const oy = (GAME.height - dh) / 2;
    const X = (wx) => ox + wx * s;
    const Y = (wy) => oy + wy * s;

    r.rect(0, 0, GAME.width, GAME.height, '#05040a');
    const img = getWorldImage();
    if (img) {
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, ox, oy, dw, dh);
      ctx.imageSmoothingEnabled = prev;
    }

    // 可走区域与实体碰撞调试层
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#7ed957';
    ctx.strokeStyle = '#7ed957';
    for (const zone of WORLD.walkZones || []) {
      if (zone.type === 'circle') {
        ctx.beginPath();
        ctx.arc(X(zone.x), Y(zone.y), zone.r * s, 0, Math.PI * 2);
        ctx.fill();
      } else if (zone.type === 'segment') {
        ctx.lineCap = 'round';
        ctx.lineWidth = zone.r * 2 * s;
        ctx.beginPath();
        ctx.moveTo(X(zone.x1), Y(zone.y1));
        ctx.lineTo(X(zone.x2), Y(zone.y2));
        ctx.stroke();
      } else if (zone.type === 'rect') {
        ctx.fillRect(X(zone.x), Y(zone.y), zone.w * s, zone.h * s);
      }
    }
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ff4f4f';
    for (const c of WORLD.colliders || []) {
      ctx.fillRect(X(c.x), Y(c.y), c.w * s, c.h * s);
    }
    ctx.restore();

    for (const lv of LEVELS) {
      const cx = X(lv.x);
      const cy = Y(lv.y);
      const rr = lv.r * s;
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = lv.color;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = lv.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      r.circle(cx, cy, 2.5, '#ffffff');
      r.text(lv.label, cx, cy - rr - 4, {
        size: 12,
        color: '#fff2b0',
        align: 'center',
        weight: '800',
        shadow: 'rgba(0,0,0,0.85)',
      });
      r.text(`${lv.x},${lv.y}`, cx, cy + rr + 12, {
        size: 10,
        color: '#cfc6e8',
        align: 'center',
        shadow: 'rgba(0,0,0,0.85)',
      });
    }

    // 出生点
    r.circle(X(WORLD.spawn.x), Y(WORLD.spawn.y), 4, '#4aa3ff');
    r.text('spawn', X(WORLD.spawn.x), Y(WORLD.spawn.y) + 14, {
      size: 10,
      color: '#9fd0ff',
      align: 'center',
      shadow: 'rgba(0,0,0,0.85)',
    });

    // 玩家当前位置
    r.circle(X(this.player.x), Y(this.player.y), 4, '#ffffff');

    r.text('OVERVIEW · 全图法阵校对（移除 URL 中的 ?overview 退出）', GAME.width / 2, 14, {
      size: 13,
      color: '#ffce54',
      align: 'center',
      weight: '800',
      shadow: 'rgba(0,0,0,0.85)',
    });
  }
}

function normalize(x, y) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

function cardinalAim(ax, ay) {
  if (Math.abs(ax) >= Math.abs(ay)) return { x: ax >= 0 ? 1 : -1, y: 0 };
  return { x: 0, y: ay >= 0 ? 1 : -1 };
}

function distanceToSegmentSq(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const cx = x1 + dx * t;
  const cy = y1 + dy * t;
  const ox = px - cx;
  const oy = py - cy;
  return ox * ox + oy * oy;
}
