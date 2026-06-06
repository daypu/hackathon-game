import { STATS, STAT_MAX, GAME } from '../config.js';

function drawBar(r, x, y, w, h, ratio, color, glow) {
  const ctx = r.ctx;
  // 外框 + 底
  r.roundRect(x, y, w, h, 4, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
  const innerW = (w - 4) * Math.max(0, Math.min(1, ratio));
  if (innerW > 1) {
    r.roundRect(x + 2, y + 2, innerW, h - 4, 3, color);
    // 顶部高光
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x + 3, y + 3, innerW - 2, 2);
    ctx.globalAlpha = 1;
  }
  // 分格线
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const gx = x + (w / 5) * i;
    ctx.beginPath();
    ctx.moveTo(gx, y + 2);
    ctx.lineTo(gx, y + h - 2);
    ctx.stroke();
  }
}

export function drawHud(r, player, miasma, distPct, t) {
  const ctx = r.ctx;
  // 顶部渐隐遮罩
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, 120);
  g.addColorStop(0, 'rgba(5,4,10,0.85)');
  g.addColorStop(1, 'rgba(5,4,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME.width, 120);
  ctx.restore();

  // 三属性条（左上）
  STATS.forEach((st, i) => {
    const y = 14 + i * 22;
    r.text(st.label, 16, y + 13, { size: 14, color: st.glow, weight: '700' });
    const bx = 58;
    const bw = 150;
    drawBar(r, bx, y, bw, 16, player.stats[st.key] / STAT_MAX, st.color, st.glow);
    r.text(`${player.stats[st.key] | 0}`, bx + bw + 8, y + 13, {
      size: 13,
      color: '#e8e0c8',
      weight: '700',
    });
  });

  // 取经进度（顶部中央）
  const px1 = 300;
  const px2 = GAME.width - 220;
  const py = 30;
  r.text('长安', px1 - 30, py + 5, { size: 12, color: '#9a90b8', align: 'center' });
  r.text('灵山', px2 + 30, py + 5, { size: 12, color: '#ffce54', align: 'center' });
  r.roundRect(px1, py - 4, px2 - px1, 9, 4, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
  const fillW = (px2 - px1) * Math.max(0, Math.min(1, distPct));
  r.roundRect(px1 + 1, py - 3, fillW, 7, 3, '#ffce54');
  // 队伍位置标记
  const mx = px1 + fillW;
  ctx.fillStyle = '#fff2b0';
  ctx.beginPath();
  ctx.arc(mx, py + 0.5, 5, 0, Math.PI * 2);
  ctx.fill();
  r.text(`取经路程 ${Math.round(distPct * 100)}%`, (px1 + px2) / 2, py + 22, {
    size: 12,
    color: '#cfc6e8',
    align: 'center',
    weight: '600',
  });

  // 妖气等级（右上）
  const mxr = GAME.width - 168;
  const my = 60;
  r.text('妖气', mxr - 8, my + 12, { size: 13, color: '#ff8a6a', weight: '700' });
  r.roundRect(mxr + 28, my, 120, 14, 4, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
  const mw = 116 * Math.max(0, Math.min(1, miasma));
  const mc = miasma < 0.5 ? '#d86bd0' : miasma < 0.8 ? '#e0533d' : '#ff3a2a';
  r.roundRect(mxr + 30, my + 2, mw, 10, 3, mc);

  // 当前增益/减益状态（属性条下方）
  let ex = 16;
  const ey = 92;
  const drawChip = (label, color, ratio) => {
    const w = 78;
    r.roundRect(ex, ey, w, 18, 5, 'rgba(10,8,18,0.8)', color, 2);
    if (ratio != null) {
      r.roundRect(ex + 2, ey + 14, (w - 4) * ratio, 3, 2, color);
    }
    r.text(label, ex + w / 2, ey + 13, {
      size: 12,
      color,
      align: 'center',
      weight: '700',
    });
    ex += w + 8;
  };
  if (player.shield) drawChip('护身符', '#ff8a5e', null);
  if (player.cloudTimer > 0) drawChip('筋斗云', '#9fd0ff', player.cloudTimer / 4);
  if (player.webTimer > 0) drawChip('蛛网·迟缓', '#d8d2c0', player.webTimer / 1.6);
}

export function drawOpenWorldHud(r, player, miasma, progress, t, info) {
  const ctx = r.ctx;
  // 顶部渐隐遮罩
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, 130);
  g.addColorStop(0, 'rgba(5,4,10,0.9)');
  g.addColorStop(1, 'rgba(5,4,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME.width, 130);
  ctx.restore();

  // 左上角全局小地图
  drawWorldMiniMap(r, player, info, t);

  // 三属性条（小地图右侧）
  const bx = 216;
  STATS.forEach((st, i) => {
    const y = 16 + i * 22;
    r.text(st.label, bx, y + 13, { size: 13, color: st.glow, weight: '700' });
    drawBar(r, bx + 40, y, 132, 16, player.stats[st.key] / STAT_MAX, st.color, st.glow);
    r.text(`${player.stats[st.key] | 0}`, bx + 178, y + 13, {
      size: 12,
      color: '#e8e0c8',
      weight: '700',
    });
  });

  // 当前场景名 + 取经进度（顶部中央）
  r.text(info.zone.label, GAME.width / 2, 30, {
    size: 18,
    color: info.zone.edge,
    align: 'center',
    weight: '900',
    shadow: 'rgba(0,0,0,0.7)',
  });
  const px = GAME.width / 2 - 100;
  r.roundRect(px, 50, 200, 10, 5, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
  r.roundRect(px + 2, 52, 196 * progress, 6, 3, '#ffce54');
  r.text(`取经进度 ${Math.round(progress * 100)}%`, GAME.width / 2, 76, {
    size: 11,
    color: '#ffe9a8',
    align: 'center',
    weight: '700',
  });

  // 妖气 / 经文 / 区域（右上）
  const rx = GAME.width - 150;
  r.text('妖气', rx, 24, { size: 13, color: '#ff8a6a', weight: '700' });
  r.roundRect(rx + 36, 13, 100, 13, 4, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
  const mc = miasma < 0.5 ? '#d86bd0' : miasma < 0.8 ? '#e0533d' : '#ff3a2a';
  r.roundRect(rx + 38, 15, 96 * miasma, 9, 3, mc);
  r.text(`经文残页 ${info.relics}`, rx, 48, { size: 13, color: '#e9dca8', weight: '800' });
  r.text(`已历 ${info.discovered.size}/${info.totalZones} 处`, rx, 70, {
    size: 12,
    color: '#b6abd0',
    weight: '600',
  });

  drawOpenWorldChips(r, player);

  if (info.message) {
    r.roundRect(222, GAME.height - 62, 516, 34, 8, 'rgba(10,8,18,0.82)', info.zone.edge, 2);
    r.text(info.message, GAME.width / 2, GAME.height - 40, {
      size: 13,
      color: '#fff2b0',
      align: 'center',
      weight: '700',
      shadow: 'rgba(0,0,0,0.7)',
    });
  }

  if (info.nearLingshan) {
    const blink = 0.45 + 0.55 * Math.sin(t * 5);
    r.text('灵山就在眼前：走到宝塔金光处结算取经成果', GAME.width / 2, GAME.height - 88, {
      size: 18,
      color: '#fff2b0',
      align: 'center',
      weight: '900',
      alpha: blink,
      shadow: 'rgba(0,0,0,0.8)',
    });
  }
}

function drawWorldMiniMap(r, player, info, t) {
  const scene = info.scene;
  const camera = info.camera;
  const panelX = 12;
  const panelY = 12;
  const panelW = 192;
  const panelH = 132;
  r.roundRect(panelX, panelY, panelW, panelH, 8, 'rgba(10,8,18,0.85)', scene.edge, 2);
  r.text(`舆图 · ${scene.label}`, panelX + panelW / 2, panelY + 15, {
    size: 12,
    color: '#cfc6e8',
    align: 'center',
    weight: '800',
  });

  const mapX = panelX + 8;
  const mapY = panelY + 24;
  const mapW = 176;
  const mapH = 99;
  r.rect(mapX, mapY, mapW, mapH, info.floorColor || '#2d3326');
  const sx = mapW / scene.w;
  const sy = mapH / scene.h;

  // 出口与终点
  for (const ex of scene.exits) {
    r.rect(mapX + ex.x * sx, mapY + ex.y * sy, Math.max(3, ex.w * sx), Math.max(3, ex.h * sy), scene.edge);
  }
  if (scene.goal) {
    r.rect(mapX + scene.goal.x * sx, mapY + scene.goal.y * sy, Math.max(4, scene.goal.w * sx), Math.max(4, scene.goal.h * sy), '#ffce54');
  }

  // 收集物（亮点）与妖障（暗红点）
  for (const p of info.pickups) r.rect(mapX + p.x * sx - 1, mapY + p.y * sy - 1, 3, 3, p.def.color);
  for (const h of info.hazards) r.rect(mapX + h.x * sx - 1, mapY + h.y * sy - 1, 3, 3, h.def.color);

  // 相机视口框
  const ctx = r.ctx;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.strokeRect(mapX + camera.x * sx, mapY + camera.y * sy, GAME.width * sx, GAME.height * sy);

  // 玩家位置（闪烁）
  const blink = 0.5 + 0.5 * Math.sin(t * 6);
  ctx.globalAlpha = blink;
  r.circle(mapX + player.x * sx, mapY + player.y * sy, 4.5, 'rgba(255,242,176,0.5)');
  ctx.globalAlpha = 1;
  r.circle(mapX + player.x * sx, mapY + player.y * sy, 2.5, '#fff2b0');
}

function drawOpenWorldChips(r, player) {
  let ex = 16;
  const ey = 92;
  const drawChip = (label, color, ratio) => {
    const w = 82;
    r.roundRect(ex, ey, w, 18, 5, 'rgba(10,8,18,0.8)', color, 2);
    if (ratio != null) r.roundRect(ex + 2, ey + 14, (w - 4) * ratio, 3, 2, color);
    r.text(label, ex + w / 2, ey + 13, {
      size: 12,
      color,
      align: 'center',
      weight: '700',
    });
    ex += w + 8;
  };
  if (player.shield) drawChip('护身符', '#ff8a5e', null);
  if (player.cloudTimer > 0) drawChip('筋斗云', '#9fd0ff', player.cloudTimer / 4);
  if (player.webTimer > 0) drawChip('蛛网·迟缓', '#d8d2c0', player.webTimer / 1.6);
}
