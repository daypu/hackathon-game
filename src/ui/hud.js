import { GAME } from '../config.js';
import { WORLD, getWorldImage } from '../openWorld.js';

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

  // 标题（顶部中央）
  r.text('万 象 迷 途 · 关 卡 总 图', GAME.width / 2, 32, {
    size: 20,
    color: '#ffce54',
    align: 'center',
    weight: '900',
    shadow: 'rgba(0,0,0,0.7)',
  });
  r.text('方向键 / WASD 自由探索 · 走入发光法阵后按 空格 进入关卡', GAME.width / 2, 56, {
    size: 12,
    color: '#cfc6e8',
    align: 'center',
    weight: '600',
  });

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

  // 底部信息条
  if (info.message) {
    r.roundRect(202, GAME.height - 60, 556, 32, 8, 'rgba(10,8,18,0.82)', '#6b5a7e', 2);
    r.text(info.message, GAME.width / 2, GAME.height - 39, {
      size: 13,
      color: '#fff2b0',
      align: 'center',
      weight: '700',
      shadow: 'rgba(0,0,0,0.7)',
    });
  }

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

function drawWorldMini(r, player, info, t) {
  const ctx = r.ctx;
  const panelX = 12;
  const panelY = 12;
  const panelW = 196;
  const panelH = 134;
  r.roundRect(panelX, panelY, panelW, panelH, 8, 'rgba(10,8,18,0.85)', '#caa23a', 2);
  r.text('万象舆图', panelX + panelW / 2, panelY + 15, {
    size: 12,
    color: '#cfc6e8',
    align: 'center',
    weight: '800',
  });

  const mapX = panelX + 8;
  const mapY = panelY + 24;
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
    const px = mapX + lv.x * sx;
    const py = mapY + lv.y * sy;
    if (active) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.globalAlpha = 0.4 + pulse * 0.5;
      r.circle(px, py, 6, lv.color);
      ctx.globalAlpha = 1;
    }
    r.circle(px, py, active ? 4 : 3, lv.color);
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
