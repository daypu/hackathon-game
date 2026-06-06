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
  // 不可通行实体：用于在可走区域内部继续挡住建筑、巨石、岩浆口等实物。
  colliders: [
    { x: 1738, y: 322, w: 150, h: 128 }, // 火焰山主熔岩口核心
    { x: 2290, y: 160, w: 115, h: 110 }, // 雷音寺主殿核心
  ],
  // 空气墙：玩家脚底必须落在这些可走区域内。
  // 坐标按底图白色主路校准；流沙河横向路段约在 y=620~690。
  walkZones: [
    // 剧情区域活动圈（适中半径，避免和路带抢边界）
    { type: 'circle', x: 360, y: 1040, r: 220 },
    { type: 'circle', x: 285, y: 215, r: 240 },
    { type: 'circle', x: 795, y: 295, r: 300 },
    { type: 'circle', x: 1295, y: 570, r: 200 },
    { type: 'circle', x: 1650, y: 590, r: 250 },
    { type: 'circle', x: 2255, y: 330, r: 320 },

    // 流沙河横向主路：低矮窄条（仅 ~90px 高，不向上延伸到 y=400 一带）
    { type: 'rect', x: 930, y: 610, w: 620, h: 90 },

    // 出生点 -> 花果山
    { type: 'segment', x1: 330, y1: 1060, x2: 480, y2: 920, r: 130 },
    { type: 'segment', x1: 480, y1: 920, x2: 370, y2: 740, r: 135 },
    { type: 'segment', x1: 370, y1: 740, x2: 260, y2: 560, r: 130 },
    { type: 'segment', x1: 260, y1: 560, x2: 240, y2: 360, r: 130 },
    { type: 'segment', x1: 240, y1: 360, x2: 285, y2: 215, r: 130 },

    // 出生点 -> 高老庄 -> 流沙河入口
    { type: 'segment', x1: 330, y1: 1060, x2: 560, y2: 950, r: 130 },
    { type: 'segment', x1: 560, y1: 950, x2: 780, y2: 820, r: 130 },
    { type: 'segment', x1: 780, y1: 820, x2: 960, y2: 700, r: 135 },
    { type: 'segment', x1: 960, y1: 700, x2: 1120, y2: 655, r: 130 },
    { type: 'segment', x1: 795, y1: 295, x2: 920, y2: 480, r: 130 },

    // 流沙河横向 -> 火焰山（沿底部沙路向东，不再斜向上拐到 y=430）
    { type: 'segment', x1: 1120, y1: 655, x2: 1320, y2: 630, r: 125 },
    { type: 'segment', x1: 1320, y1: 630, x2: 1510, y2: 640, r: 125 },
    { type: 'segment', x1: 1510, y1: 640, x2: 1650, y2: 590, r: 130 },
    { type: 'segment', x1: 1650, y1: 590, x2: 1790, y2: 720, r: 130 },
    { type: 'segment', x1: 1790, y1: 720, x2: 1940, y2: 780, r: 125 },

    // 火焰山 -> 雷音寺
    { type: 'segment', x1: 1940, y1: 780, x2: 2120, y2: 660, r: 125 },
    { type: 'segment', x1: 2120, y1: 660, x2: 2230, y2: 510, r: 130 },
    { type: 'segment', x1: 2230, y1: 510, x2: 2255, y2: 330, r: 130 },
  ],
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

// 脚底判定留少量余量，避免贴边走时一帧内反复进出边界造成卡顿。
const WALK_PAD = 10;

export function isWalkablePoint(x, y, zones = WORLD.walkZones) {
  if (!zones || zones.length === 0) return true;
  return zones.some((zone) => {
    if (zone.type === 'circle') {
      const dx = x - zone.x;
      const dy = y - zone.y;
      const r = zone.r + WALK_PAD;
      return dx * dx + dy * dy <= r * r;
    }
    if (zone.type === 'segment') {
      const r = zone.r + WALK_PAD;
      return distanceToSegmentSq(x, y, zone.x1, zone.y1, zone.x2, zone.y2) <= r * r;
    }
    if (zone.type === 'rect') {
      return (
        x >= zone.x - WALK_PAD &&
        x <= zone.x + zone.w + WALK_PAD &&
        y >= zone.y - WALK_PAD &&
        y <= zone.y + zone.h + WALK_PAD
      );
    }
    return false;
  });
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

// ---------------------------------------------------------------
//  绘制（世界坐标，调用方负责相机 translate）
// ---------------------------------------------------------------

export function drawWorld(r, t, activeKey, levelStates = {}) {
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
  for (const lv of LEVELS) drawLevelRing(r, lv, t, lv.key === activeKey, levelStates[lv.key] || 'locked');
}

function drawLevelRing(r, lv, t, active, state) {
  const ctx = r.ctx;
  const locked = state === 'locked';
  const completed = state === 'completed';
  const color = locked ? '#7d7485' : completed ? '#fff2b0' : lv.color;
  const pulse = 1 + Math.sin(t * 3 + lv.x * 0.01) * 0.06;
  const R = lv.r * pulse;
  ctx.save();

  // 底部光晕
  ctx.globalAlpha = locked ? (active ? 0.16 : 0.07) : active ? 0.34 : completed ? 0.24 : 0.18;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(lv.x, lv.y, R, 0, Math.PI * 2);
  ctx.fill();

  // 外圈
  ctx.globalAlpha = locked ? (active ? 0.58 : 0.35) : active ? 1 : 0.82;
  ctx.strokeStyle = color;
  ctx.lineWidth = active ? 7 : completed ? 5 : 4;
  ctx.beginPath();
  ctx.arc(lv.x, lv.y, R, 0, Math.PI * 2);
  ctx.stroke();

  // 内圈旋转虚线（法阵感）
  ctx.globalAlpha = locked ? 0.22 : 0.7;
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 14]);
  ctx.lineDashOffset = locked ? 0 : -t * 34;
  ctx.beginPath();
  ctx.arc(lv.x, lv.y, R * 0.66, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 旋转符点
  if (!locked) {
    ctx.globalAlpha = completed ? 0.75 : 0.95;
    for (let i = 0; i < 6; i++) {
      const a = t * 1.5 + (i / 6) * Math.PI * 2;
      r.circle(lv.x + Math.cos(a) * R, lv.y + Math.sin(a) * R * 0.5, active ? 4 : 3, color);
    }
  }
  if (completed) {
    ctx.globalAlpha = 0.95;
    r.text('✓', lv.x, lv.y + 13, {
      size: 38,
      color: '#fff2b0',
      align: 'center',
      weight: '900',
      shadow: 'rgba(0,0,0,0.8)',
    });
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // 名牌
  const tw = r.measure(lv.label, 18, '800') + 28;
  r.roundRect(lv.x - tw / 2, lv.y - R - 40, tw, 30, 9, 'rgba(10,8,18,0.84)', color, 2);
  r.text(lv.label, lv.x, lv.y - R - 19, {
    size: 18,
    color: locked ? '#b8afc4' : '#fff2b0',
    align: 'center',
    weight: '800',
    shadow: 'rgba(0,0,0,0.7)',
  });
}
