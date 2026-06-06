// 万象迷途 · 关卡总图（hub）
// 一张融合大地图，按区域放置 5 个关卡触发法阵；走入法阵触发对应关卡（内容待接入）。
import { GAME } from './config.js';
import worldMap from './assets/maps/world.png';

const worldImg = new Image();
worldImg.src = worldMap;

export function getWorldImage() {
  return worldImg.complete && worldImg.naturalWidth > 0 ? worldImg : null;
}

// 大地图世界尺寸（底图等比放大，留出探索空间）
export const WORLD = {
  label: '万象迷途',
  w: 2508,
  h: 1410,
  spawn: { x: 330, y: 1060 },
  // 不可通行实体；暂留空（自由探索），后续可按图加入山体/水域碰撞
  colliders: [],
  // 5 个关卡触发法阵：放在各区域的地标建筑处（需离开主路上行进入），避免沿主路一条线走完
  levels: [
    { key: 'huaguoshan', label: '花果山', desc: '美猴王的出身之地', x: 285, y: 215, r: 60, color: '#7fd06a' },
    { key: 'gaolaozhuang', label: '高老庄', desc: '八戒入赘的村庄', x: 795, y: 295, r: 60, color: '#e8b84a' },
    { key: 'liushahe', label: '流沙河', desc: '沙僧皈依之处', x: 1295, y: 555, r: 60, color: '#6fb0c8' },
    { key: 'huoyanshan', label: '火焰山', desc: '烈焰难越的险关', x: 1650, y: 590, r: 60, color: '#e0533d' },
    { key: 'leiyinsi', label: '灵山雷音寺', desc: '取经的终点', x: 2255, y: 330, r: 64, color: '#ffce54' },
  ],
};

export const LEVELS = WORLD.levels;

const PLAY_MARGIN = 30;

export function worldBounds() {
  return {
    x: PLAY_MARGIN,
    y: PLAY_MARGIN,
    w: WORLD.w - PLAY_MARGIN * 2,
    h: WORLD.h - PLAY_MARGIN * 2,
  };
}

export function makeCamera(player) {
  return {
    x: Math.round(Math.max(0, Math.min(WORLD.w - GAME.width, player.x - GAME.width / 2))),
    y: Math.round(Math.max(0, Math.min(WORLD.h - GAME.height, player.y - GAME.height / 2))),
  };
}

// 玩家所在的关卡法阵（圆形判定）；不在任何法阵内返回 null
export function levelAt(px, py) {
  for (const lv of LEVELS) {
    const dx = px - lv.x;
    const dy = py - lv.y;
    if (dx * dx + dy * dy <= lv.r * lv.r) return lv;
  }
  return null;
}

export function isInRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

// ---------------------------------------------------------------
//  绘制（世界坐标，调用方负责相机 translate）
// ---------------------------------------------------------------

export function drawWorld(r, t, activeKey) {
  const ctx = r.ctx;
  const img = getWorldImage();
  if (img) {
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, WORLD.w, WORLD.h);
    ctx.imageSmoothingEnabled = prev;
  } else {
    r.rect(0, 0, WORLD.w, WORLD.h, '#23301f');
  }
  for (const lv of LEVELS) drawLevelRing(r, lv, t, lv.key === activeKey);
}

function drawLevelRing(r, lv, t, active) {
  const ctx = r.ctx;
  const pulse = 1 + Math.sin(t * 3 + lv.x * 0.01) * 0.06;
  const R = lv.r * pulse;
  ctx.save();

  // 底部光晕
  ctx.globalAlpha = active ? 0.34 : 0.18;
  ctx.fillStyle = lv.color;
  ctx.beginPath();
  ctx.arc(lv.x, lv.y, R, 0, Math.PI * 2);
  ctx.fill();

  // 外圈
  ctx.globalAlpha = active ? 1 : 0.82;
  ctx.strokeStyle = lv.color;
  ctx.lineWidth = active ? 7 : 4;
  ctx.beginPath();
  ctx.arc(lv.x, lv.y, R, 0, Math.PI * 2);
  ctx.stroke();

  // 内圈旋转虚线（法阵感）
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 14]);
  ctx.lineDashOffset = -t * 34;
  ctx.beginPath();
  ctx.arc(lv.x, lv.y, R * 0.66, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 旋转符点
  ctx.globalAlpha = 0.95;
  for (let i = 0; i < 6; i++) {
    const a = t * 1.5 + (i / 6) * Math.PI * 2;
    r.circle(lv.x + Math.cos(a) * R, lv.y + Math.sin(a) * R * 0.5, active ? 4 : 3, lv.color);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // 名牌
  const tw = r.measure(lv.label, 18, '800') + 28;
  r.roundRect(lv.x - tw / 2, lv.y - R - 40, tw, 30, 9, 'rgba(10,8,18,0.84)', lv.color, 2);
  r.text(lv.label, lv.x, lv.y - R - 19, {
    size: 18,
    color: '#fff2b0',
    align: 'center',
    weight: '800',
    shadow: 'rgba(0,0,0,0.7)',
  });
}
