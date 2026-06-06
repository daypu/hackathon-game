import { GAME } from '../config.js';
import { SHOP_ITEMS } from '../combat.js';
import { WORLD, getWorldImage } from '../openWorld.js';
import { PARTY, characterFrame, drawCharacter } from '../sprites/hero.js';

const COMBAT_BUTTON_SIZE = 68;
const COMBAT_BUTTON_GAP = 16;
const COMBAT_BUTTON_PAD = 22;

// 关卡总图 HUD：标题 + 全局小地图（5 个关卡法阵 + 玩家 + 视口框）+ 提示/toast。
export function drawHubHud(r, player, t, info) {
  const ctx = r.ctx;

  // 顶部渐隐遮罩
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, 120);
  g.addColorStop(0, 'rgba(5,4,10,0.85)');
  g.addColorStop(1, 'rgba(5,4,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME.width, 120);
  ctx.restore();

  // 左上角全局小地图
  drawWorldMini(r, player, info, t);
  drawShopPanel(r, info.shop || {}, t);
  drawPartySelector(r, player, t);
  drawCombatButtons(r, info.combat || {}, t);
  drawRevivePanel(r, info.revive || {});

  if (info.story) drawStoryPanel(r, info.story);

  // 当前法阵提示
  if (info.activeLevel) {
    const lv = info.activeLevel;
    const blink = 0.5 + 0.5 * Math.sin(t * 5);
    r.text(`「${lv.label}」· ${lv.desc}`, GAME.width / 2, 80, {
      size: 14,
      color: lv.color,
      align: 'center',
      weight: '800',
      alpha: 0.6 + blink * 0.4,
      shadow: 'rgba(0,0,0,0.7)',
    });
  }

  if (info.nearNpc && !info.dialogue) drawNpcPrompt(r, info.nearNpc, t);

  // 底部信息条
  if (info.message && !info.dialogue) {
    r.roundRect(202, GAME.height - 60, 556, 32, 8, 'rgba(10,8,18,0.82)', '#6b5a7e', 2);
    r.text(info.message, GAME.width / 2, GAME.height - 39, {
      size: 13,
      color: '#fff2b0',
      align: 'center',
      weight: '700',
      shadow: 'rgba(0,0,0,0.7)',
    });
  }

  if (info.dialogue) drawDialogue(r, info.dialogue);

  // toast（进入关卡反馈）
  if (info.toast) {
    const w = r.measure(info.toast, 20, '800') + 60;
    r.roundRect(GAME.width / 2 - w / 2, GAME.height / 2 - 26, w, 52, 12, 'rgba(10,8,18,0.9)', '#ffce54', 3);
    r.text(info.toast, GAME.width / 2, GAME.height / 2 + 7, {
      size: 20,
      color: '#fff2b0',
      align: 'center',
      weight: '800',
      shadow: 'rgba(0,0,0,0.7)',
    });
  }
}

function combatButtons() {
  const y = GAME.height - COMBAT_BUTTON_PAD - COMBAT_BUTTON_SIZE;
  const attackX = GAME.width - COMBAT_BUTTON_PAD - COMBAT_BUTTON_SIZE;
  const skillX = attackX - COMBAT_BUTTON_GAP - COMBAT_BUTTON_SIZE;
  return {
    skill: { x: skillX, y, w: COMBAT_BUTTON_SIZE, h: COMBAT_BUTTON_SIZE, label: '技', name: 'skill' },
    attack: { x: attackX, y, w: COMBAT_BUTTON_SIZE, h: COMBAT_BUTTON_SIZE, label: '攻', name: 'attack' },
  };
}

export function combatButtonAt(x, y) {
  const buttons = combatButtons();
  return Object.values(buttons).find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)?.name || null;
}

const SHOP_X = 12;
const SHOP_Y = 138;
const SHOP_W = 196;
const SHOP_ROW_H = 42;
const SHOP_BTN_H = 38;

export function shopHitAt(x, y, open) {
  if (x >= SHOP_X && x <= SHOP_X + SHOP_W && y >= SHOP_Y && y <= SHOP_Y + SHOP_BTN_H) {
    return { action: 'toggle' };
  }
  if (!open) return null;
  const winY = SHOP_Y + SHOP_BTN_H + 8;
  if (x >= SHOP_X + SHOP_W - 28 && x <= SHOP_X + SHOP_W - 8 && y >= winY + 8 && y <= winY + 28) {
    return { action: 'close' };
  }
  const startY = winY + 35;
  const idx = Math.floor((y - startY) / SHOP_ROW_H);
  if (idx < 0 || idx >= SHOP_ITEMS.length) return null;
  const rowY = startY + idx * SHOP_ROW_H;
  if (y < rowY || y > rowY + SHOP_ROW_H - 6) return null;
  return { action: 'item', item: SHOP_ITEMS[idx] };
}

function drawShopPanel(r, shop, t) {
  r.roundRect(SHOP_X, SHOP_Y, SHOP_W, SHOP_BTN_H, 10, 'rgba(10,8,18,0.82)', '#ffce54', 2);
  r.text(shop.open ? '收起商店' : '云游商店', SHOP_X + 16, SHOP_Y + 24, {
    size: 15,
    color: '#ffce54',
    weight: '900',
    shadow: 'rgba(0,0,0,0.7)',
  });
  r.text(`金币 ${shop.coins || 0}`, SHOP_X + SHOP_W - 12, SHOP_Y + 21, {
    size: 12,
    color: '#fff2b0',
    align: 'right',
    weight: '800',
    shadow: 'rgba(0,0,0,0.7)',
  });
  if (!shop.open) return;

  const winY = SHOP_Y + SHOP_BTN_H + 8;
  const h = 35 + SHOP_ITEMS.length * SHOP_ROW_H + 8;
  r.roundRect(SHOP_X, winY, SHOP_W, h, 10, 'rgba(10,8,18,0.92)', '#6b5a7e', 2);
  r.text('选择道具', SHOP_X + 12, winY + 23, {
    size: 13,
    color: '#fff2b0',
    weight: '900',
    shadow: 'rgba(0,0,0,0.7)',
  });
  r.text('×', SHOP_X + SHOP_W - 18, winY + 23, {
    size: 15,
    color: '#cfc6e8',
    align: 'center',
    weight: '900',
  });

  SHOP_ITEMS.forEach((item, i) => {
    const y = winY + 35 + i * SHOP_ROW_H;
    const affordable = (shop.coins || 0) >= item.cost;
    const pulse = affordable ? 0.02 * Math.sin(t * 5 + i) : 0;
    r.roundRect(
      SHOP_X + 8,
      y,
      SHOP_W - 16,
      SHOP_ROW_H - 6,
      8,
      affordable ? 'rgba(255,206,84,0.11)' : 'rgba(5,4,10,0.54)',
      affordable ? item.color : 'rgba(207,198,232,0.32)',
      affordable ? 2 : 1
    );
    r.circle(SHOP_X + 24, y + 17, 8 + pulse * 20, item.color);
    r.text(item.label, SHOP_X + 40, y + 15, {
      size: 12,
      color: affordable ? '#fff2b0' : '#9a91aa',
      weight: '900',
      shadow: 'rgba(0,0,0,0.7)',
    });
    r.text(`${item.cost} 金`, SHOP_X + SHOP_W - 18, y + 15, {
      size: 11,
      color: affordable ? '#ffce54' : '#7f768e',
      align: 'right',
      weight: '800',
    });
    r.text(item.desc, SHOP_X + 40, y + 30, {
      size: 10,
      color: affordable ? '#cfc6e8' : '#766f83',
      weight: '600',
    });
  });
}

const REVIVE_W = 240;
const REVIVE_H = 54;

function drawRevivePanel(r, revive) {
  if (!revive.visible) return;
  const x = GAME.width / 2 - REVIVE_W / 2;
  const y = GAME.height - 130;
  r.roundRect(x, y, REVIVE_W, REVIVE_H, 14, 'rgba(10,8,18,0.9)', '#fff2b0', 3);
  r.text('角色倒下', x + REVIVE_W / 2, y + 20, {
    size: 15,
    color: '#ffce54',
    align: 'center',
    weight: '900',
    shadow: 'rgba(0,0,0,0.75)',
  });
  r.text(`${Math.ceil(revive.seconds || 0)} 秒后自动复活`, x + REVIVE_W / 2, y + 40, {
    size: 14,
    color: '#fff2b0',
    align: 'center',
    weight: '800',
    shadow: 'rgba(0,0,0,0.75)',
  });
}

function drawCombatButtons(r, combat, t) {
  const ctx = r.ctx;
  const buttons = combatButtons();
  drawCombatButton(r, buttons.skill, {
    title: combat.skillLabel || '技能',
    cd: combat.skillCooldown || 0,
    maxCd: combat.skillMaxCooldown || 8,
    color: combat.skillColor || '#6fb0c8',
    pulse: Math.sin(t * 5) * 0.04,
  });
  drawCombatButton(r, buttons.attack, {
    title: '普攻',
    cd: combat.attackCooldown || 0,
    maxCd: combat.attackMaxCooldown || 0.72,
    color: '#ffce54',
    pulse: Math.sin(t * 6 + 1) * 0.04,
  });

  ctx.save();
  ctx.globalAlpha = 0.78;
  r.text('K', buttons.skill.x + buttons.skill.w - 11, buttons.skill.y + 15, {
    size: 11,
    color: '#f5efe0',
    align: 'center',
    weight: '900',
  });
  r.text('J', buttons.attack.x + buttons.attack.w - 11, buttons.attack.y + 15, {
    size: 11,
    color: '#f5efe0',
    align: 'center',
    weight: '900',
  });
  ctx.restore();
}

function drawCombatButton(r, b, info) {
  const ctx = r.ctx;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const radius = b.w / 2;
  const ready = info.cd <= 0;
  ctx.save();
  ctx.globalAlpha = ready ? 0.72 : 0.42;
  r.circle(cx, cy, radius, 'rgba(10,8,18,0.78)');
  ctx.globalAlpha = ready ? 0.9 : 0.5;
  ctx.strokeStyle = info.color;
  ctx.lineWidth = ready ? 4 : 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 3 + info.pulse * 10, 0, Math.PI * 2);
  ctx.stroke();

  if (info.cd > 0) {
    const ratio = Math.min(1, info.cd / info.maxCd);
    ctx.globalAlpha = 0.58;
    ctx.fillStyle = '#05040a';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  r.text(b.label, cx, cy + 10, {
    size: 30,
    color: ready ? '#fff2b0' : '#9a91aa',
    align: 'center',
    weight: '900',
    shadow: 'rgba(0,0,0,0.75)',
  });
  r.text(info.cd > 0 ? info.cd.toFixed(1) : info.title, cx, b.y - 8, {
    size: 12,
    color: ready ? info.color : '#cfc6e8',
    align: 'center',
    weight: '800',
    shadow: 'rgba(0,0,0,0.8)',
  });
}

function drawStoryPanel(r, story) {
  const x = GAME.width - 326;
  const y = 12;
  const w = 314;
  const h = 86;
  r.roundRect(x, y, w, h, 10, 'rgba(10,8,18,0.82)', '#6b5a7e', 2);
  r.text(`当前剧情 · ${story.title}`, x + 14, y + 24, {
    size: 14,
    color: '#ffce54',
    weight: '900',
    shadow: 'rgba(0,0,0,0.7)',
  });
  const status = story.npcTriggered ? '法阵已解锁' : '等待 NPC 剧情';
  r.text(status, x + w - 14, y + 24, {
    size: 12,
    color: story.npcTriggered ? '#7ed957' : '#ffce54',
    align: 'right',
    weight: '800',
    shadow: 'rgba(0,0,0,0.7)',
  });
  const lines = wrapText(r, story.objective, w - 28, 12, '700', 2);
  for (let i = 0; i < lines.length; i++) {
    r.text(lines[i], x + 14, y + 48 + i * 17, {
      size: 12,
      color: '#fff2b0',
      weight: '700',
      shadow: 'rgba(0,0,0,0.7)',
    });
  }
}

function drawNpcPrompt(r, npc, t) {
  const pulse = 0.65 + Math.sin(t * 5) * 0.18;
  const text = `靠近「${npc.name}」· 按 空格 对话`;
  const w = r.measure(text, 15, '800') + 42;
  r.roundRect(GAME.width / 2 - w / 2, GAME.height - 100, w, 34, 10, 'rgba(10,8,18,0.86)', npc.color, 2);
  r.text(text, GAME.width / 2, GAME.height - 78, {
    size: 15,
    color: '#fff2b0',
    align: 'center',
    weight: '800',
    alpha: pulse,
    shadow: 'rgba(0,0,0,0.75)',
  });
}

function drawDialogue(r, dialogue) {
  const x = 86;
  const y = GAME.height - 150;
  const w = GAME.width - 172;
  const h = 122;
  r.roundRect(x, y, w, h, 14, 'rgba(8,6,14,0.94)', dialogue.color, 3);
  r.roundRect(x + 16, y - 22, 210, 38, 10, 'rgba(8,6,14,0.96)', dialogue.color, 2);
  r.text(dialogue.name, x + 30, y + 2, {
    size: 18,
    color: '#fff2b0',
    weight: '900',
    shadow: 'rgba(0,0,0,0.8)',
  });
  r.text(dialogue.role, x + 140, y + 1, {
    size: 12,
    color: '#cfc6e8',
    weight: '700',
  });

  const lines = wrapText(r, dialogue.line, w - 52, 18, '700', 3);
  for (let i = 0; i < lines.length; i++) {
    r.text(lines[i], x + 26, y + 44 + i * 24, {
      size: 18,
      color: '#f5efe0',
      weight: '700',
      shadow: 'rgba(0,0,0,0.75)',
    });
  }

  r.text(`${dialogue.index + 1}/${dialogue.total} · 空格继续`, x + w - 24, y + h - 18, {
    size: 12,
    color: '#ffce54',
    align: 'right',
    weight: '800',
    shadow: 'rgba(0,0,0,0.75)',
  });
}

function wrapText(r, text, maxWidth, size, weight, maxLines = 3) {
  const chars = Array.from(text);
  const lines = [];
  let line = '';
  for (const ch of chars) {
    const next = line + ch;
    if (line && r.measure(next, size, weight) > maxWidth) {
      lines.push(line);
      line = ch;
      if (lines.length === maxLines - 1) break;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

const SELECTOR_SIZE = 44;
const SELECTOR_GAP = 8;
const SELECTOR_PAD = 12;
const SELECTOR_HP_H = 6;

function partySlots() {
  const totalW = PARTY.length * SELECTOR_SIZE + (PARTY.length - 1) * SELECTOR_GAP;
  const x0 = 222;
  const y0 = 20;
  return PARTY.map((member, i) => ({
    ...member,
    x: x0 + i * (SELECTOR_SIZE + SELECTOR_GAP),
    y: y0,
    w: SELECTOR_SIZE,
    h: SELECTOR_SIZE,
  }));
}

export function partySlotAt(x, y) {
  return partySlots().find((slot) => x >= slot.x && x <= slot.x + slot.w && y >= slot.y && y <= slot.y + slot.h) || null;
}

function drawPartySelector(r, player, t) {
  const ctx = r.ctx;
  const slots = partySlots();
  const panelX = slots[0].x - 7;
  const panelY = slots[0].y - 7;
  const panelW = PARTY.length * SELECTOR_SIZE + (PARTY.length - 1) * SELECTOR_GAP + 14;
  r.roundRect(panelX, panelY, panelW, SELECTOR_SIZE + 24, 12, 'rgba(5,4,10,0.62)', 'rgba(255,206,84,0.22)', 1);
  for (const slot of slots) {
    const active = player.characterKey === slot.key;
    const pulse = active ? 0.5 + 0.5 * Math.sin(t * 5) : 0;
    r.roundRect(
      slot.x,
      slot.y,
      slot.w,
      slot.h,
      8,
      active ? 'rgba(255,206,84,0.22)' : 'rgba(10,8,18,0.78)',
      active ? '#ffce54' : 'rgba(207,198,232,0.55)',
      active ? 3 : 2
    );
    if (active) {
      ctx.save();
      ctx.globalAlpha = 0.2 + pulse * 0.18;
      ctx.strokeStyle = slot.color;
      ctx.lineWidth = 5;
      ctx.strokeRect(slot.x + 4, slot.y + 4, slot.w - 8, slot.h - 8);
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(slot.x + slot.w / 2, slot.y + slot.h - 7, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawCharacter(r, characterFrame(slot.character, active, t + slot.x * 0.01), slot.x + slot.w / 2, slot.y + slot.h - 6, 1.45, {
      outline: '#06050a',
    });
    drawPartyHp(r, player, slot);
  }
}

function drawPartyHp(r, player, slot) {
  const hp = player.partyHp ? player.partyHp[slot.key] ?? 100 : 100;
  const maxHp = player.maxPartyHp ? player.maxPartyHp[slot.key] ?? 100 : 100;
  const ratio = Math.max(0, Math.min(1, hp / maxHp));
  const x = slot.x + 4;
  const y = slot.y + slot.h + 5;
  const w = slot.w - 8;
  r.roundRect(x, y, w, SELECTOR_HP_H, 3, 'rgba(0,0,0,0.72)');
  r.roundRect(x + 1, y + 1, (w - 2) * ratio, SELECTOR_HP_H - 2, 2, ratio > 0.35 ? '#7ed957' : '#ff6b5e');
}

function drawWorldMini(r, player, info, t) {
  const ctx = r.ctx;
  const panelX = 12;
  const panelY = 12;
  const panelW = 196;
  const panelH = 117;
  r.roundRect(panelX, panelY, panelW, panelH, 8, 'rgba(10,8,18,0.85)', '#caa23a', 2);

  const mapX = panelX + 8;
  const mapY = panelY + 8;
  const mapW = 180;
  const mapH = 101;
  const img = getWorldImage();
  if (img) {
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, mapX, mapY, mapW, mapH);
    ctx.imageSmoothingEnabled = prev;
  } else {
    r.rect(mapX, mapY, mapW, mapH, '#23301f');
  }

  const sx = mapW / WORLD.w;
  const sy = mapH / WORLD.h;

  // 5 个关卡法阵点
  for (const lv of info.levels) {
    const active = info.activeLevel && info.activeLevel.key === lv.key;
    const state = info.levelStates ? info.levelStates[lv.key] || 'locked' : 'locked';
    const unlocked = state === 'unlocked';
    const completed = state === 'completed';
    const target = info.story && info.story.targetLevel === lv.key && unlocked;
    const color = completed ? '#fff2b0' : state === 'locked' ? '#7d7485' : lv.color;
    const px = mapX + lv.x * sx;
    const py = mapY + lv.y * sy;
    if (active || target || completed) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.globalAlpha = completed ? 0.65 : active ? 0.4 + pulse * 0.5 : 0.28 + pulse * 0.28;
      r.circle(px, py, target || completed ? 7 : 6, target || completed ? '#fff2b0' : color);
      ctx.globalAlpha = 1;
    }
    r.circle(px, py, active || unlocked || completed ? 4 : 3, color);
  }

  // 相机视口框
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.strokeRect(mapX + info.camera.x * sx, mapY + info.camera.y * sy, GAME.width * sx, GAME.height * sy);

  // 玩家位置（闪烁）
  const blink = 0.5 + 0.5 * Math.sin(t * 6);
  ctx.globalAlpha = blink;
  r.circle(mapX + player.x * sx, mapY + player.y * sy, 4.5, 'rgba(255,242,176,0.5)');
  ctx.globalAlpha = 1;
  r.circle(mapX + player.x * sx, mapY + player.y * sy, 2.5, '#fff2b0');
}
