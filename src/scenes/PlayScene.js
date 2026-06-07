import { GAME } from '../config.js';
import { Player } from '../entities/Player.js';
import { Npc } from '../entities/Npc.js';
import { Monster } from '../entities/Monster.js';
import { ParticleSystem } from '../entities/particles.js';
import { combatButtonAt, drawHubHud, partySlotAt, shopHitAt } from '../ui/hud.js';
import { MONSTER_SPAWNS, SKILL_COOLDOWN, skillFor } from '../combat.js';
import { WUZI_BOSS_FRAME, WUZI_BOSS_PHASES } from '../assets/boss/index.js';
import { GaolaozhuangMiniGame } from '../mini/GaolaozhuangMiniGame.js';
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

const BOSS_MAX_HP = 360;
const BOSS_SPAWN = { x: 2050, y: 610 };
const BOSS_PLAYER_SPAWN = { x: 1870, y: 745 };
const CHARGE_ATTACK_SECONDS = 3;
const bossSheets = WUZI_BOSS_PHASES.map((phase) => {
  const img = new Image();
  img.src = phase.sheet;
  return img;
});

// 关卡总图（hub）：自由探索，走入发光法阵即可进入对应关卡。
// 关卡玩法内容待开发，这里通过 #startLevel 保留统一接入接口。
export class PlayScene {
  constructor(game) {
    this.g = game;
    this.r = game.r;
    // 调试：URL 带 ?overview 时进入全图法阵校对视图
    this.debugOverview = new URLSearchParams(location.search).has('overview');
    // 调试：URL 带 ?boss 时直接进入无字经魔 Boss 战
    this.debugBoss = new URLSearchParams(location.search).has('boss');
    // 调试：URL 带 ?gaolaozhuang 或 ?mini=gaolaozhuang 时直接进入高老庄小游戏
    const params = new URLSearchParams(location.search);
    this.debugGaolaozhuang = params.has('gaolaozhuang') || params.get('mini') === 'gaolaozhuang';
    this.debugLiushahe = params.has('liushahe') || params.get('mini') === 'liushahe';
    this.debugHuoyanshan = params.has('huoyanshan') || params.get('mini') === 'huoyanshan';
  }

  enter() {
    this.player = new Player();
    this.player.setPosition(WORLD.spawn.x, WORLD.spawn.y);
    this.fx = new ParticleSystem();
    this.story = createStoryState();
    this.npcs = NPCS.map((def) => new Npc(def));
    this.monsters = MONSTER_SPAWNS.map((spawn) => new Monster(spawn));
    this.skillEffects = [];
    this.delayedAttacks = [];
    this.shopOpen = false;
    this.boss = null;
    this.bossCleared = false;
    this.camera = makeCamera(this.player);
    this.state = 'playing'; // playing | paused
    this.miniGame = null;
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
    this.attackCharging = false;
    this.attackCharge = 0;
    this.pointerAttackDown = false;
    this.g.audio.ensure();
    this.g.audio.startBgm();
    if (this.debugBoss) this.#startBossPrelude();
    else if (this.debugGaolaozhuang) {
      const lv = LEVELS.find((level) => level.key === 'gaolaozhuang');
      if (lv) this.#startGaolaozhuangLevel(lv);
    }
    else if (this.debugLiushahe) this.#openOriginalLiushahe();
    else if (this.debugHuoyanshan) this.#openOriginalHuoyanshan();
  }

  exit() {
    if (this.miniGame) {
      this.miniGame.destroy?.();
      this.miniGame = null;
    }
    this.g.audio.stopBgm();
  }

  update(dt) {
    const input = this.g.input;

    if (this.state === 'minigame') {
      this.miniGame?.update(dt, input);
      return;
    }

    if (this.boss) {
      this.#updateBoss(dt, input);
      return;
    }

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
      this.#updateDelayedAttacks(dt);
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
        if (combatAction === 'attack') this.#beginAttackCharge(this.#inputAim(input), true);
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
    this.#updateDelayedAttacks(dt);
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
    this.#updateAttackCharge(dt, input);
    this.#updateAttackCharge(dt, input);

    if (input.just('attack')) this.#beginAttackCharge(this.#inputAim(input), false);
    if (input.justReleased('attack')) this.#releaseAttackCharge(this.#inputAim(input));
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
        this.#queueDelayedAttack({
          x1: hit.from.x,
          y1: hit.from.y - 12,
          x: hit.to.x,
          y: hit.to.y,
          r: 28,
          delay: 1.15,
          damage: hit.damage,
          stun: hit.stun,
          slow: hit.slow,
          color: hit.color,
          label: '妖火',
        });
        continue;
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
    this.#performNormalAttack(dir, false);
  }

  #beginAttackCharge(dir = null, pointer = false) {
    if (this.attackCooldown > 0 || this.player.isCurrentDead()) return;
    this.attackCharging = true;
    this.attackCharge = 0;
    this.chargeAim = dir || this.#aimDir();
    this.pointerAttackDown = pointer;
  }

  #updateAttackCharge(dt, input) {
    if (!this.attackCharging) return;
    this.attackCharge = Math.min(CHARGE_ATTACK_SECONDS, this.attackCharge + dt);
    this.chargeAim = this.#inputAim(input);
    if (this.pointerAttackDown && !input.pointer.down) {
      if (this.boss?.state === 'fight') this.#releaseBossAttackCharge(this.chargeAim);
      else this.#releaseAttackCharge(this.chargeAim);
    }
  }

  #releaseAttackCharge(dir = null) {
    if (!this.attackCharging) return;
    const charged = this.attackCharge >= CHARGE_ATTACK_SECONDS;
    this.attackCharging = false;
    this.pointerAttackDown = false;
    this.#performNormalAttack(dir || this.chargeAim || this.#aimDir(), charged);
  }

  #performNormalAttack(dir = null, charged = false) {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = charged ? 1.05 : 0.72;
    const aim = dir || this.#aimDir();
    this.player.playAction(charged ? 'chargedAttack' : 'attack', charged ? '#fff2b0' : '#ffce54', aim);
    const targets = this.#frontConeMonsters(charged ? 150 : 92, charged ? 1.35 : 1.05, aim);
    if (targets.length === 0) {
      this.fx.text(this.player.x, this.player.y - 36, '未命中', '#cfc6e8');
      return;
    }
    for (const target of targets) {
      this.#damageMonster(target, (charged ? 22 : 8) + this.player.attackBonus, {
        color: charged ? '#fff2b0' : '#ffce54',
        label: charged ? '蓄力击' : '普攻',
        knockback: { x: aim.x, y: aim.y, force: charged ? 78 : 34 },
      });
    }
    if (charged) {
      this.fx.burst(this.player.x + aim.x * 52, this.player.y + aim.y * 52, 26, {
        color: '#fff2b0',
        speed: 210,
        life: 0.5,
        size: 5,
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

  #queueDelayedAttack(opts) {
    this.delayedAttacks.push({
      ...opts,
      timer: opts.delay,
      max: opts.delay,
      exploded: false,
    });
  }

  #updateDelayedAttacks(dt) {
    for (const atk of this.delayedAttacks) {
      atk.timer -= dt;
      if (atk.timer > 0 || atk.exploded) continue;
      atk.exploded = true;
      this.skillEffects.push({
        type: 'impact',
        x: atk.x,
        y: atk.y,
        r: atk.r,
        color: atk.color,
        life: 0.32,
        max: 0.32,
      });
      if (!this.player.isCurrentDead() && Math.hypot(this.player.x - atk.x, this.player.y - atk.y) <= atk.r) {
        const result = this.player.damage('mana', atk.damage, { stun: atk.stun || 0 });
        if (result.applied) {
          this.fx.text(this.player.x, this.player.y - 32, `${atk.label || '远程'} -${atk.damage}`, '#ff7a6a');
          if (atk.slow) this.player.applyWeb(atk.slow);
        }
      }
    }
    this.delayedAttacks = this.delayedAttacks.filter((atk) => !atk.exploded);
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
    if (lv.key === 'gaolaozhuang') {
      this.#startGaolaozhuangLevel(lv);
      return;
    }
    if (lv.key === 'liushahe') {
      this.#openOriginalLiushahe();
      return;
    }
    if (lv.key === 'huoyanshan') {
      this.#openOriginalHuoyanshan();
      return;
    }
    const result = completeStoryObjective(this.story, lv.key);
    if (result.advanced) {
      this.toast = `已点亮：${lv.label}`;
      this.message = currentStoryInfo(this.story).objective || result.chapter.startMessage;
      this.messageTimer = 6;
      if (lv.key === 'huoyanshan' && !this.bossCleared) {
        this.#startBossPrelude();
        return;
      }
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

  #startGaolaozhuangLevel(lv) {
    this.state = 'minigame';
    this.toast = '';
    this.toastTimer = 0;
    this.message = '进入高老庄试炼：帮助悟空收服八戒。';
    this.messageTimer = 4;
    this.miniGame = new GaolaozhuangMiniGame({
      onComplete: ({ success, result } = {}) => {
        this.miniGame = null;
        this.state = 'playing';
        this.enterLock = 0.6;
        if (success) {
          const advanced = completeStoryObjective(this.story, lv.key);
          this.toast = '高老庄通过，八戒入队';
          this.toastTimer = 2.2;
          this.message = currentStoryInfo(this.story).objective || advanced.chapter.startMessage;
          this.messageTimer = 6;
          this.fx.burst(lv.x, lv.y, 28, {
            color: lv.color,
            speed: 190,
            life: 0.75,
            size: 6,
            up: 20,
          });
          // 将小游戏表现转为主地图资源奖励，作为模块融合反馈。
          const peaches = result?.peaches || 0;
          const coinReward = Math.min(40, (result?.coins || 0) + peaches);
          if (coinReward > 0) {
            this.coins += coinReward;
            this.fx.text(this.player.x, this.player.y - 44, `高老庄奖励 +${coinReward} 金币`, '#ffce54');
          }
        } else {
          this.toast = '高老庄试炼未完成';
          this.toastTimer = 2;
          this.message = '重新进入高老庄法阵，可再次挑战收服八戒。';
          this.messageTimer = 5;
        }
      },
    });
  }

  #openOriginalLiushahe() {
    const base = import.meta.env.BASE_URL || '/';
    const originalUrl = `${base}liushahe-original/index.html`;
    window.location.assign(originalUrl);
  }

  #openOriginalHuoyanshan() {
    const base = import.meta.env.BASE_URL || '/';
    const originalUrl = `${base}huoyanshan-original/index.html`;
    window.location.assign(originalUrl);
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

    if (this.state === 'minigame') {
      this.miniGame?.draw(r);
      return;
    }

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    drawWorld(r, t, this.activeLevel ? this.activeLevel.key : null, this.#levelStates());
    if (this.boss) this.#drawBossWorld(r, t);
    this.#drawActors(r, t);
    this.#drawSkillEffects(r, t);
    this.fx.draw(r);
    ctx.restore();

    if (!this.boss) drawHubHud(r, this.player, t, {
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
        attackCharge: this.attackCharge,
        attackChargeMax: CHARGE_ATTACK_SECONDS,
        attackCharging: this.attackCharging,
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
    else this.#drawBossOverlay(r);

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

  #startBossPrelude() {
    this.bossReturn = { ...BOSS_PLAYER_SPAWN };
    this.player.setPosition(BOSS_PLAYER_SPAWN.x, BOSS_PLAYER_SPAWN.y);
    this.camera = makeCamera(this.player);
    this.shopOpen = false;
    this.boss = {
      state: 'intro',
      hp: BOSS_MAX_HP,
      maxHp: BOSS_MAX_HP,
      phase: 0,
      attackTimer: 1.2,
      hurtFlash: 0,
      introIndex: 0,
      winTimer: 0,
      x: BOSS_SPAWN.x,
      y: BOSS_SPAWN.y,
      lines: [
        '火焰山妖火退去，通往灵山的经页却忽然化为一片空白。',
        '六贼影相自无字经中浮现：若心念未定，见经亦无经。',
        '无字经魔降临。击破三重心魔，雷音寺金光方能显现。',
      ],
    };
    this.g.audio.sfx('start');
  }

  #updateBoss(dt, input) {
    this.fx.update(dt);
    this.#updateSkillEffects(dt);
    this.#updateDelayedAttacks(dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.skillCooldown = Math.max(0, this.skillCooldown - dt);

    if (this.boss.state === 'intro') {
      if (input.just('confirm')) {
        if (this.boss.introIndex < this.boss.lines.length - 1) this.boss.introIndex++;
        else this.boss.state = 'fight';
      }
      return;
    }

    if (this.boss.state === 'won') {
      this.boss.winTimer += dt;
      if (input.just('confirm') && this.boss.winTimer > 0.4) {
        this.bossCleared = true;
        this.player.setPosition(this.bossReturn.x, this.bossReturn.y);
        this.camera = makeCamera(this.player);
        this.message = '无字经魔退散，雷音寺金光重新显现。去寻找接引僧，完成最后一步。';
        this.messageTimer = 6;
        this.boss = null;
      }
      return;
    }

    this.player.updateFree(dt, input, worldBounds(), WORLD.colliders, WORLD.walkZones);
    this.camera = makeCamera(this.player);
    if (input.just('attack')) this.#beginAttackCharge(this.#inputAim(input), false);
    if (input.justReleased('attack')) this.#releaseBossAttackCharge(this.#inputAim(input));
    if (input.just('skill')) this.#bossSkill(this.#inputAim(input));
    if (input.pointer.justDown) {
      const combatAction = combatButtonAt(input.pointer.x, input.pointer.y);
      if (combatAction === 'attack') this.#beginAttackCharge(this.#inputAim(input), true);
      if (combatAction === 'skill') this.#bossSkill(this.#inputAim(input));
    }

    this.boss.hurtFlash = Math.max(0, this.boss.hurtFlash - dt);
    this.boss.phase = this.#bossPhase();
    this.boss.attackTimer -= dt;
    if (this.boss.attackTimer <= 0) {
      this.#bossAttack();
      this.boss.attackTimer = [1.45, 1.18, 0.92][this.boss.phase];
    }
  }

  #bossNormalAttack(dir) {
    if (this.attackCooldown > 0 || this.boss.state !== 'fight') return;
    this.#performBossAttack(dir, false);
  }

  #releaseBossAttackCharge(dir = null) {
    if (!this.attackCharging) return;
    const charged = this.attackCharge >= CHARGE_ATTACK_SECONDS;
    this.attackCharging = false;
    this.pointerAttackDown = false;
    this.#performBossAttack(dir || this.chargeAim || this.#aimDir(), charged);
  }

  #performBossAttack(dir, charged) {
    if (this.attackCooldown > 0 || this.boss.state !== 'fight') return;
    this.attackCooldown = charged ? 1.05 : 0.72;
    const aim = dir || this.#aimDir();
    this.player.playAction(charged ? 'chargedAttack' : 'attack', charged ? '#fff2b0' : '#ffce54', aim);
    if (this.#bossInCone(charged ? 165 : 105, charged ? 1.35 : 1.05, aim)) {
      this.#damageBoss((charged ? 22 : 8) + this.player.attackBonus, charged ? '#fff2b0' : '#ffce54', charged ? '蓄力击' : '普攻');
    } else {
      this.fx.text(this.player.x, this.player.y - 36, '未命中', '#cfc6e8', { size: 14, life: 0.55 });
    }
  }

  #bossSkill(dir) {
    if (this.skillCooldown > 0 || this.boss.state !== 'fight') return;
    const skill = skillFor(this.player.characterKey);
    const aim = dir || this.#aimDir();
    this.skillCooldown = SKILL_COOLDOWN;
    this.player.playAction('skill', skill.color, aim);
    const effect = this.#createSkillEffect(skill, aim);
    this.skillEffects.push(effect);
    if (this.#skillHitsBoss(skill, effect)) {
      this.#damageBoss(skill.damage + this.player.skillBonus, skill.color, skill.label);
    }
    if (skill.heal) {
      this.player.heal('faith', skill.heal);
      this.fx.text(this.player.x, this.player.y - 48, `信念 +${skill.heal}`, '#fff2b0');
    }
    this.g.audio.sfx('good');
  }

  #bossAttack() {
    const phase = this.#bossPhase();
    const damage = [7, 10, 13][phase];
    const color = ['#b06bd8', '#ff7a22', '#ffce54'][phase];
    this.#queueDelayedAttack({
      x1: this.boss.x,
      y1: this.boss.y - 95,
      x: this.player.x,
      y: this.player.y,
      r: [54, 62, 72][phase],
      delay: [0.9, 0.78, 0.66][phase],
      damage,
      stun: phase === 2 ? 0.25 : 0,
      color,
      label: '心魔',
    });
  }

  #damageBoss(amount, color, label) {
    this.boss.hp = Math.max(0, this.boss.hp - amount);
    this.boss.hurtFlash = 0.2;
    this.fx.text(this.boss.x, this.boss.y - 130, `${label} -${amount}`, color, { size: 18, life: 0.7 });
    this.fx.burst(this.boss.x, this.boss.y - 40, 18, { color, speed: 150, life: 0.45, size: 5 });
    if (this.boss.hp <= 0) {
      this.boss.state = 'won';
      this.boss.winTimer = 0;
      this.fx.burst(this.boss.x, this.boss.y - 40, 55, { color: '#fff2b0', speed: 260, life: 1, size: 6 });
      this.g.audio.sfx('win');
    } else {
      const newPhase = this.#bossPhase();
      if (newPhase !== this.boss.phase) {
        this.boss.phase = newPhase;
        this.fx.burst(this.boss.x, this.boss.y - 45, 42, { color: '#ff7a22', speed: 220, life: 0.8, size: 6 });
      }
      this.g.audio.sfx('hit');
    }
  }

  #bossPhase() {
    const ratio = this.boss.hp / this.boss.maxHp;
    if (ratio > 0.66) return 0;
    if (ratio > 0.33) return 1;
    return 2;
  }

  #bossCenter() {
    return { x: this.boss.x, y: this.boss.y - 35, r: 178 };
  }

  #bossInCone(range, angle, dir) {
    const b = this.#bossCenter();
    const dx = b.x - this.player.x;
    const dy = b.y - this.player.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > range + b.r * 0.65) return false;
    const dot = (dx / dist) * dir.x + (dy / dist) * dir.y;
    return dot >= Math.cos(angle / 2);
  }

  #skillHitsBoss(skill, effect) {
    const b = this.#bossCenter();
    if (skill.type === 'aoe') return Math.hypot(b.x - effect.x, b.y - effect.y) <= effect.r + b.r * 0.5;
    if (skill.type === 'cone') {
      const dx = b.x - effect.x;
      const dy = b.y - effect.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > effect.range + b.r * 0.45) return false;
      const dot = (dx / dist) * effect.dir.x + (dy / dist) * effect.dir.y;
      return dot >= Math.cos(effect.angle / 2);
    }
    const d2 = distanceToSegmentSq(b.x, b.y, effect.x1, effect.y1, effect.x2, effect.y2);
    const hitR = (skill.width || 30) + b.r * 0.55;
    return d2 <= hitR * hitR;
  }

  #drawBossWorld(r, t) {
    const ctx = r.ctx;
    const g = ctx.createRadialGradient(this.boss.x, this.boss.y - 55, 40, this.boss.x, this.boss.y - 55, 300);
    g.addColorStop(0, 'rgba(120,64,180,0.38)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(this.boss.x - 330, this.boss.y - 360, 660, 660);
    this.#drawBossSprite(r, t);
  }

  #drawBossOverlay(r) {
    this.#drawBossHp(r);
    if (this.boss.state === 'intro') {
      this.#drawBossIntro(r);
      return;
    }
    this.#drawBossCombatButtons(r);

    if (this.boss.state === 'won') {
      r.roundRect(170, 394, 620, 74, 16, 'rgba(10,8,18,0.88)', '#fff2b0', 3);
      r.text('无字经魔退散，经页显现金字。', GAME.width / 2, 424, {
        size: 22,
        color: '#fff2b0',
        align: 'center',
        weight: '900',
        shadow: 'rgba(0,0,0,0.8)',
      });
      r.text('按 空格 返回大地图，继续前往雷音寺', GAME.width / 2, 451, {
        size: 14,
        color: '#cfc6e8',
        align: 'center',
        weight: '700',
      });
    }
  }

  #drawBossIntro(r) {
    const line = this.boss.lines[this.boss.introIndex];
    r.roundRect(120, 360, 720, 112, 18, 'rgba(10,8,18,0.92)', '#b06bd8', 3);
    r.text('无字经魔', GAME.width / 2, 392, {
      size: 26,
      color: '#ffce54',
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.85)',
    });
    r.text(line, GAME.width / 2, 424, {
      size: 16,
      color: '#fff2b0',
      align: 'center',
      weight: '800',
      shadow: 'rgba(0,0,0,0.85)',
    });
    r.text('按 空格 继续', GAME.width / 2, 452, {
      size: 13,
      color: '#cfc6e8',
      align: 'center',
      weight: '700',
    });
  }

  #drawBossSprite(r, t) {
    const ctx = r.ctx;
    const phase = this.boss ? this.#bossPhase() : 0;
    const img = bossSheets[phase];
    if (!img || !img.complete) return;
    const frame = Math.floor(t * (phase === 2 ? 7 : 5)) % WUZI_BOSS_FRAME.count;
    const size = 292 + Math.sin(t * 2) * 5;
    const x = this.boss.x - size / 2;
    const y = this.boss.y - size / 2 + Math.sin(t * 2.5) * 3;
    ctx.save();
    if (this.boss?.hurtFlash > 0) ctx.globalAlpha = 0.72;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      img,
      frame * WUZI_BOSS_FRAME.w,
      0,
      WUZI_BOSS_FRAME.w,
      WUZI_BOSS_FRAME.h,
      x,
      y,
      size,
      size
    );
    ctx.restore();
  }

  #drawBossHp(r) {
    const w = 520;
    const h = 8;
    const x = GAME.width / 2 - w / 2;
    const y = 30;
    const life = this.boss.maxHp / 3;
    r.roundRect(x - 10, y - 23, w + 20, 47, 12, 'rgba(5,4,10,0.78)', '#ffce54', 2);
    r.text(`无字经魔 · ${WUZI_BOSS_PHASES[this.#bossPhase()].label}`, GAME.width / 2, y - 7, {
      size: 15,
      color: '#fff2b0',
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.85)',
    });
    for (let i = 0; i < 3; i++) {
      const barY = y + 7 + i * 10;
      const remaining = Math.max(0, Math.min(life, this.boss.hp - life * (2 - i)));
      const ratio = remaining / life;
      const color = i === 0 ? '#ff5b32' : i === 1 ? '#ff7a22' : '#b06bd8';
      r.roundRect(x, barY, w, h, 4, 'rgba(0,0,0,0.72)', 'rgba(255,255,255,0.16)', 1);
      if (ratio > 0) r.roundRect(x + 2, barY + 2, (w - 4) * ratio, h - 4, 2, color);
    }
  }

  #drawBossCombatButtons(r) {
    // Boss 战中保留右下角按钮提示，点击判定沿用 HUD 的 combatButtonAt。
    r.roundRect(GAME.width - 174, GAME.height - 88, 68, 68, 34, 'rgba(10,8,18,0.7)', '#6fb0c8', 3);
    r.roundRect(GAME.width - 90, GAME.height - 88, 68, 68, 34, 'rgba(10,8,18,0.7)', '#ffce54', 3);
    r.text('技', GAME.width - 140, GAME.height - 45, { size: 30, color: '#fff2b0', align: 'center', weight: '900' });
    r.text('攻', GAME.width - 56, GAME.height - 45, { size: 30, color: '#fff2b0', align: 'center', weight: '900' });
    if (this.skillCooldown > 0) {
      r.text(this.skillCooldown.toFixed(1), GAME.width - 140, GAME.height - 94, {
        size: 12,
        color: '#cfc6e8',
        align: 'center',
        weight: '800',
      });
    }
    if (this.attackCharging) {
      const ratio = Math.min(1, this.attackCharge / CHARGE_ATTACK_SECONDS);
      const cx = GAME.width - 56;
      const cy = GAME.height - 54;
      const ctx = r.ctx;
      ctx.save();
      ctx.strokeStyle = '#fff2b0';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 39, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
      ctx.restore();
    }
  }

  #drawSkillEffects(r, t) {
    const ctx = r.ctx;
    for (const atk of this.delayedAttacks) {
      const p = Math.max(0, Math.min(1, 1 - atk.timer / atk.max));
      ctx.save();
      if (atk.x1 !== undefined && atk.y1 !== undefined) {
        const headX = atk.x1 + (atk.x - atk.x1) * p;
        const headY = atk.y1 + (atk.y - atk.y1) * p;
        ctx.globalAlpha = 0.22 + p * 0.46;
        ctx.strokeStyle = atk.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -t * 85;
        ctx.beginPath();
        ctx.moveTo(atk.x1, atk.y1);
        ctx.lineTo(headX, headY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.85;
        r.circle(headX, headY, 6 + p * 3, atk.color);
        ctx.globalAlpha = 0.55;
        r.circle(headX, headY, 12 + p * 7, atk.color);
      }
      ctx.globalAlpha = 0.22 + p * 0.34;
      ctx.fillStyle = atk.color;
      ctx.beginPath();
      ctx.arc(atk.x, atk.y, atk.r * (0.45 + p * 0.55), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = '#fff2b0';
      ctx.lineWidth = 2 + p * 3;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -t * 50;
      ctx.beginPath();
      ctx.arc(atk.x, atk.y, atk.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
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
      } else if (e.type === 'impact') {
        ctx.save();
        ctx.globalAlpha = 0.18 + a * 0.42;
        r.circle(e.x, e.y, e.r * (1.15 - a * 0.25), e.color);
        ctx.globalAlpha = 0.7 * a;
        ctx.strokeStyle = '#fff2b0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * (1.25 - a * 0.2), 0, Math.PI * 2);
        ctx.stroke();
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
