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

  // 三属性条
  STATS.forEach((st, i) => {
    const y = 14 + i * 22;
    r.text(st.label, 16, y + 13, { size: 14, color: st.glow, weight: '700' });
    drawBar(r, 58, y, 150, 16, player.stats[st.key] / STAT_MAX, st.color, st.glow);
    r.text(`${player.stats[st.key] | 0}`, 216, y + 13, {
      size: 13,
      color: '#e8e0c8',
      weight: '700',
    });
  });

  // 当前区域与探索进度
  r.text(info.zone.label, GAME.width / 2, 25, {
    size: 18,
    color: info.zone.edge,
    align: 'center',
    weight: '900',
    shadow: 'rgba(0,0,0,0.7)',
  });
  r.text(info.zone.desc, GAME.width / 2, 48, {
    size: 12,
    color: '#cfc6e8',
    align: 'center',
    weight: '500',
  });
  const px = GAME.width / 2 - 150;
  r.roundRect(px, 62, 300, 11, 5, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
  r.roundRect(px + 2, 64, 296 * progress, 7, 4, '#ffce54');
  r.text(`开放世界探索 ${Math.round(progress * 100)}%`, GAME.width / 2, 92, {
    size: 12,
    color: '#ffe9a8',
    align: 'center',
    weight: '700',
  });

  // 妖气与经文
  r.text('妖气', GAME.width - 296, 34, { size: 13, color: '#ff8a6a', weight: '700' });
  r.roundRect(GAME.width - 252, 22, 118, 14, 4, 'rgba(10,8,18,0.85)', 'rgba(0,0,0,0.6)', 2);
  const mc = miasma < 0.5 ? '#d86bd0' : miasma < 0.8 ? '#e0533d' : '#ff3a2a';
  r.roundRect(GAME.width - 250, 24, 114 * miasma, 10, 3, mc);
  r.text(`经文残页 ${info.relics}`, GAME.width - 296, 60, {
    size: 13,
    color: '#e9dca8',
    weight: '800',
  });
  r.text(`已发现 ${info.discovered.size}/${info.totalZones} 区域`, GAME.width - 296, 82, {
    size: 12,
    color: '#b6abd0',
    weight: '600',
  });

  drawMiniMap(r, player, info);
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

function drawMiniMap(r, player, info) {
  const mapW = 136;
  const mapH = 80;
  const x = GAME.width - mapW - 16;
  const y = GAME.height - mapH - 16;

  r.roundRect(x - 6, y - 20, mapW + 12, mapH + 26, 8, 'rgba(10,8,18,0.82)', '#6b5a7e', 2);
  r.text('场景舆图', x + mapW / 2, y - 5, {
    size: 12,
    color: '#cfc6e8',
    align: 'center',
    weight: '800',
  });
  r.rect(x, y, mapW, mapH, '#242033');

  const nodes = [
    { key: 'changan', x: 14, y: 54 },
    { key: 'liusha', x: 38, y: 42 },
    { key: 'huoyan', x: 66, y: 56 },
    { key: 'pansi', x: 64, y: 22 },
    { key: 'yaolin', x: 96, y: 34 },
    { key: 'lingshan', x: 122, y: 18 },
  ];
  r.ctx.strokeStyle = 'rgba(255,206,84,0.35)';
  r.ctx.lineWidth = 2;
  r.ctx.beginPath();
  nodes.forEach((n, i) => {
    const px = x + n.x;
    const py = y + n.y;
    i === 0 ? r.ctx.moveTo(px, py) : r.ctx.lineTo(px, py);
  });
  r.ctx.stroke();

  for (const lm of info.landmarks) {
    const n = nodes.find((node) => node.key === lm.key);
    if (!n) continue;
    const discovered = info.discovered.has(lm.key);
    const active = info.sceneKey === lm.key;
    r.circle(x + n.x, y + n.y, active ? 5 : discovered ? 3 : 2, active ? '#fff2b0' : discovered ? '#ffce54' : '#6b627d');
  }
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
