import { GAME } from './config.js';
import { Hazard } from './entities/Hazard.js';
import { Pickup } from './entities/Pickup.js';

// 每个场景都是一张大地图（相机跟随，走到边缘传送点切换场景）
export const SCENE_W = 1920;
export const SCENE_H = 1080;

const bgCache = {};
const PLAY_MARGIN_X = 56;
const PLAY_MARGIN_TOP = 140; // 顶部给 HUD 留空间
const PLAY_MARGIN_BOTTOM = 56;

export const SCENE_ORDER = ['changan', 'liusha', 'huoyan', 'pansi', 'yaolin', 'lingshan'];

export const SCENES = {
  changan: {
    key: 'changan',
    label: '长安营地',
    desc: '取经队伍整装出发，草地、农田与小屋构成安全起点。',
    edge: '#8f704d',
    miasma: 0.08,
    w: SCENE_W,
    h: SCENE_H,
    spawn: { x: 300, y: 620 },
    exits: [
      { x: 1856, y: 520, w: 64, h: 240, to: 'liusha', spawn: { x: 140, y: 620 }, label: '前往流沙河' },
    ],
    hazards: [
      ['trap', 820, 560], ['yaofeng', 1240, 380], ['trap', 1500, 760],
      ['yaofeng', 1020, 880], ['trap', 660, 400],
    ],
    pickups: [
      ['peach', 560, 460], ['buddhalight', 900, 660], ['scripturePage', 1320, 320],
      ['amulet', 1140, 840], ['peach', 1560, 560], ['cloud', 440, 820], ['buddhalight', 1680, 440],
    ],
  },
  liusha: {
    key: 'liusha',
    label: '流沙河',
    desc: '河水横贯，渡口旁散落经页，妖风与落石在岸边盘旋。',
    edge: '#6f8ca8',
    miasma: 0.28,
    w: SCENE_W,
    h: SCENE_H,
    spawn: { x: 140, y: 620 },
    exits: [
      { x: 0, y: 520, w: 64, h: 240, to: 'changan', spawn: { x: 1780, y: 620 }, label: '回到长安营地' },
      { x: 1856, y: 520, w: 64, h: 240, to: 'huoyan', spawn: { x: 140, y: 620 }, label: '前往火焰山' },
      { x: 850, y: 1016, w: 240, h: 64, to: 'pansi', spawn: { x: 960, y: 240 }, label: '进入盘丝洞' },
    ],
    hazards: [
      ['rock', 640, 640], ['yaofeng', 1200, 600], ['trap', 1480, 760],
      ['rock', 900, 860], ['yaofeng', 1640, 660], ['trap', 520, 840],
    ],
    pickups: [
      ['scripturePage', 520, 620], ['peach', 860, 700], ['cloud', 1280, 600],
      ['buddhalight', 1560, 620], ['amulet', 720, 880], ['scripturePage', 1700, 780], ['peach', 1080, 860],
    ],
  },
  huoyan: {
    key: 'huoyan',
    label: '火焰山',
    desc: '赤土与岩浆割裂道路，火焰会持续消耗法力。',
    edge: '#d56a3a',
    miasma: 0.5,
    w: SCENE_W,
    h: SCENE_H,
    spawn: { x: 140, y: 620 },
    exits: [
      { x: 0, y: 520, w: 64, h: 240, to: 'liusha', spawn: { x: 1780, y: 620 }, label: '返回流沙河' },
      { x: 1856, y: 520, w: 64, h: 240, to: 'yaolin', spawn: { x: 140, y: 560 }, label: '穿过山口' },
    ],
    hazards: [
      ['flame', 520, 560], ['flame', 900, 700], ['rock', 1240, 460], ['trap', 1520, 760],
      ['flame', 1120, 880], ['rock', 700, 880], ['flame', 1660, 560],
    ],
    pickups: [
      ['peach', 440, 600], ['cloud', 800, 460], ['amulet', 1180, 680],
      ['scripturePage', 1560, 520], ['peach', 1380, 860], ['cloud', 980, 800],
    ],
  },
  pansi: {
    key: 'pansi',
    label: '盘丝洞',
    desc: '藤蔓与蛛网遮蔽小径，踩中蛛丝会被拖慢脚步。',
    edge: '#d8d2c0',
    miasma: 0.58,
    w: SCENE_W,
    h: SCENE_H,
    spawn: { x: 960, y: 240 },
    exits: [
      { x: 850, y: 1016, w: 240, h: 64, to: 'liusha', spawn: { x: 960, y: 240 }, label: '回到流沙河' },
      { x: 1856, y: 520, w: 64, h: 240, to: 'yaolin', spawn: { x: 140, y: 840 }, label: '钻出洞口' },
    ],
    hazards: [
      ['web', 520, 460], ['web', 1080, 600], ['trap', 1480, 780], ['yaofeng', 760, 860],
      ['web', 1320, 420], ['trap', 980, 680],
    ],
    pickups: [
      ['buddhalight', 460, 600], ['scripturePage', 880, 440], ['amulet', 1240, 680],
      ['peach', 1560, 560], ['cloud', 680, 880], ['buddhalight', 1480, 420],
    ],
  },
  yaolin: {
    key: 'yaolin',
    label: '万象妖林',
    desc: '妖林深处道路交错，是抵达灵山前最后的迷途。',
    edge: '#6fb06d',
    miasma: 0.74,
    w: SCENE_W,
    h: SCENE_H,
    spawn: { x: 140, y: 560 },
    exits: [
      { x: 0, y: 340, w: 64, h: 200, to: 'huoyan', spawn: { x: 1780, y: 620 }, label: '返回火焰山' },
      { x: 0, y: 760, w: 64, h: 200, to: 'pansi', spawn: { x: 1780, y: 540 }, label: '返回盘丝洞' },
      { x: 1856, y: 520, w: 64, h: 240, to: 'lingshan', spawn: { x: 140, y: 560 }, label: '前往灵山入口' },
    ],
    hazards: [
      ['yaofeng', 560, 460], ['web', 980, 660], ['flame', 1320, 460], ['trap', 760, 860],
      ['yaofeng', 1500, 740], ['web', 1140, 880], ['flame', 1660, 560],
    ],
    pickups: [
      ['buddhalight', 460, 600], ['scripturePage', 880, 420], ['cloud', 1240, 680],
      ['amulet', 1520, 460], ['peach', 700, 880], ['buddhalight', 1660, 780], ['scripturePage', 1040, 880],
    ],
  },
  lingshan: {
    key: 'lingshan',
    label: '灵山入口',
    desc: '金光照见心念，走到宝塔前即可结算取经成果。',
    edge: '#ffce54',
    miasma: 0.16,
    w: SCENE_W,
    h: SCENE_H,
    spawn: { x: 140, y: 560 },
    exits: [
      { x: 0, y: 520, w: 64, h: 240, to: 'yaolin', spawn: { x: 1780, y: 560 }, label: '返回万象妖林' },
    ],
    goal: { x: 1460, y: 430, w: 240, h: 280 },
    hazards: [
      ['yaofeng', 560, 560], ['rock', 900, 760], ['yaofeng', 1180, 460],
    ],
    pickups: [
      ['buddhalight', 520, 400], ['scripturePage', 840, 600], ['amulet', 440, 800], ['peach', 1100, 840],
    ],
  },
};

export const ZONES = SCENE_ORDER.map((key, index) => ({ ...SCENES[key], progressIndex: index }));

export const LANDMARKS = ZONES.map((z, i) => ({ key: z.key, label: z.label }));

export function getZoneAt(_x, _y, sceneKey = 'changan') {
  return SCENES[sceneKey] || SCENES.changan;
}

export function sceneBounds(scene) {
  return {
    x: PLAY_MARGIN_X,
    y: PLAY_MARGIN_TOP,
    w: scene.w - PLAY_MARGIN_X * 2,
    h: scene.h - PLAY_MARGIN_TOP - PLAY_MARGIN_BOTTOM,
  };
}

export function makeCamera(player, scene) {
  return {
    x: Math.round(Math.max(0, Math.min(scene.w - GAME.width, player.x - GAME.width / 2))),
    y: Math.round(Math.max(0, Math.min(scene.h - GAME.height, player.y - GAME.height / 2))),
  };
}

export function sceneProgress(sceneKey, discovered) {
  const idx = Math.max(0, SCENE_ORDER.indexOf(sceneKey));
  return Math.min(1, (idx + discovered.size * 0.22) / (SCENE_ORDER.length + 1));
}

export function isInRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function generateOpenWorldEntities() {
  const byScene = {};
  for (const key of SCENE_ORDER) {
    const scene = SCENES[key];
    byScene[key] = {
      hazards: scene.hazards.map(([type, x, y]) => new Hazard(type, y, x, { static: true })),
      pickups: scene.pickups.map(([type, x, y]) => new Pickup(type, y, x)),
    };
  }
  return byScene;
}

// ---------------------------------------------------------------
//  绘制（世界坐标，调用方负责相机 translate）
// ---------------------------------------------------------------

export function drawOpenWorld(r, scene, t) {
  const bg = getCachedBackground(scene);
  r.ctx.drawImage(bg, 0, 0);
  drawDynamicDetails(r, scene, t);
  drawExits(r, scene, t);
}

export function scenePalette(key) {
  const palettes = {
    changan: { base: '#5b8c44', alt: '#669c4d', dark: '#4e7a3a', detail: '#3a6b2a', path: '#c49a52', pathDark: '#a67d3d' },
    liusha: { base: '#c7a765', alt: '#d4b472', dark: '#b39454', detail: '#8e7650', path: '#dfbd73', pathDark: '#c29f55' },
    huoyan: { base: '#9c4c31', alt: '#ab5638', dark: '#823c24', detail: '#622a16', path: '#b8613c', pathDark: '#964b2b' },
    pansi: { base: '#4a5445', alt: '#535e4d', dark: '#3b4536', detail: '#2a3326', path: '#63594b', pathDark: '#4a4135' },
    yaolin: { base: '#2d663b', alt: '#347544', dark: '#24542f', detail: '#1a4022', path: '#8c7544', pathDark: '#6b5830' },
    lingshan: { base: '#6b9c5c', alt: '#78ab68', dark: '#5c8a4e', detail: '#f0d46a', path: '#d8bd66', pathDark: '#b59c4c' },
  };
  return palettes[key] || palettes.changan;
}

function getCachedBackground(scene) {
  if (bgCache[scene.key]) return bgCache[scene.key];

  const canvas = document.createElement('canvas');
  canvas.width = scene.w;
  canvas.height = scene.h;
  const ctx = canvas.getContext('2d');
  const r = {
    ctx,
    rect: (x, y, w, h, c) => { if (c) ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, Math.ceil(w), Math.ceil(h)); },
    circle: (x, y, rad, c) => { ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); if (c) ctx.fillStyle = c; ctx.fill(); },
  };

  const pal = scenePalette(scene.key);
  r.rect(0, 0, scene.w, scene.h, pal.base);

  // 高精度像素地表纹理
  for (let y = 0; y < scene.h; y += 4) {
    for (let x = 0; x < scene.w; x += 4) {
      const n = pseudoNoise(x, y, scene.key);
      if (n > 0.74) r.rect(x, y, 4, 4, pal.alt);
      else if (n < 0.16) r.rect(x, y, 4, 4, pal.dark);
      if (n > 0.985) {
        r.rect(x, y, 2, 8, pal.detail);
        r.rect(x + 4, y + 2, 2, 6, pal.detail);
        r.rect(x - 4, y + 3, 2, 5, pal.detail);
      }
    }
  }

  drawStaticPaths(r, scene.key, pal);
  drawStaticDetails(r, scene.key);

  // 边缘暗角，让场景更有层次
  const g = ctx.createRadialGradient(scene.w / 2, scene.h / 2, scene.h * 0.35, scene.w / 2, scene.h / 2, scene.h * 0.85);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, scene.w, scene.h);

  bgCache[scene.key] = canvas;
  return canvas;
}

function scenePaths(key) {
  switch (key) {
    case 'changan': return [[[200, 640], [620, 620], [1080, 600], [1560, 600], [1900, 620]]];
    case 'liusha': return [[[20, 620], [520, 620], [960, 600], [1420, 600], [1900, 620]], [[960, 600], [960, 1060]]];
    case 'huoyan': return [[[20, 620], [520, 600], [1020, 560], [1500, 560], [1900, 560]]];
    case 'pansi': return [[[960, 200], [960, 580], [1400, 560], [1900, 560]]];
    case 'yaolin': return [[[20, 440], [420, 520], [920, 540], [1420, 540], [1900, 560]], [[20, 840], [420, 760], [820, 600]]];
    case 'lingshan': return [[[20, 560], [620, 560], [1120, 520], [1580, 480]]];
    default: return [];
  }
}

function drawStaticPaths(r, key, pal) {
  const ctx = r.ctx;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const pts of scenePaths(key)) {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 56;
    strokePolyline(ctx, pts);
    ctx.strokeStyle = pal.path;
    ctx.lineWidth = 46;
    strokePolyline(ctx, pts);
    ctx.strokeStyle = pal.pathDark;
    ctx.lineWidth = 32;
    strokePolyline(ctx, pts);
    // 路面碎石
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const steps = Math.floor(Math.hypot(x2 - x1, y2 - y1) / 9);
      for (let j = 0; j < steps; j++) {
        const bx = x1 + (x2 - x1) * (j / steps);
        const by = y1 + (y2 - y1) * (j / steps);
        r.rect(bx + (pseudoNoise(bx, by, 'a') - 0.5) * 38, by + (pseudoNoise(bx, by, 'b') - 0.5) * 38, 4, 4);
      }
    }
  }
  ctx.restore();
}

function strokePolyline(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
}

function drawStaticDetails(r, key) {
  switch (key) {
    case 'changan':
      drawHouse(r, 620, 170);
      drawFarm(r, 150, 230);
      drawTrees(r, [[1320, 250], [1460, 300], [1180, 820], [1620, 780], [760, 860], [300, 760]]);
      drawWell(r, 1640, 640);
      break;
    case 'liusha':
      drawBridge(r, 760, 210);
      drawRocks(r, [[1480, 740], [700, 880], [1660, 420], [520, 420], [300, 760]]);
      break;
    case 'huoyan':
      drawVolcano(r, 1500, 150);
      drawRocks(r, [[440, 420], [1100, 840], [1660, 780], [820, 880], [320, 760]]);
      break;
    case 'pansi':
      drawCave(r, 820, 110);
      drawWebs(r, [[520, 460], [1080, 600], [1320, 420], [1500, 780], [320, 820]]);
      drawTrees(r, [[1660, 320], [300, 880], [1760, 760]]);
      break;
    case 'yaolin':
      drawTrees(r, [[300, 300], [520, 360], [780, 280], [1100, 320], [1400, 300], [1660, 360], [420, 840], [880, 880], [1520, 860], [200, 600]]);
      drawShrine(r, 1200, 150);
      break;
    case 'lingshan':
      drawTrees(r, [[300, 780], [1000, 840], [260, 380], [1760, 820]]);
      break;
  }
}

function drawDynamicDetails(r, scene, t) {
  switch (scene.key) {
    case 'liusha':
      drawWater(r, 0, 200, scene.w, 250, t);
      break;
    case 'huoyan':
      drawLava(r, 360, 820, 320, 80, t);
      drawLava(r, 1160, 360, 300, 80, t);
      drawLava(r, 760, 540, 260, 70, t);
      break;
    case 'yaolin':
      drawPond(r, 820, 820, 280, 130, t);
      break;
    case 'lingshan':
      drawPagoda(r, 1580, 300, t);
      drawCloudPads(r, [[420, 320], [820, 250], [1120, 660]], t);
      break;
  }
}

function drawExits(r, scene, t) {
  for (const ex of scene.exits) drawPortal(r, ex, scene.edge, t);
  if (scene.goal) drawPortal(r, scene.goal, '#ffce54', t, '灵山');
}

function drawPortal(r, rect, color, t, label = rect.label) {
  const ctx = r.ctx;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  // 传送光柱
  ctx.globalAlpha = 0.18 + Math.sin(t * 5) * 0.06;
  r.roundRect(rect.x, rect.y, rect.w, rect.h, 12, color);
  ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.2;
  r.roundRect(rect.x, rect.y, rect.w, rect.h, 12, null, color, 3);
  // 旋转的传送粒子
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 5; i++) {
    const a = t * 2 + (i / 5) * Math.PI * 2;
    const rad = Math.min(rect.w, rect.h) * 0.32;
    r.circle(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.8, 3, color);
  }
  ctx.globalAlpha = 1;
  r.text(label, cx, rect.y - 10, {
    size: 13,
    color: '#fff2b0',
    align: 'center',
    weight: '800',
    shadow: 'rgba(0,0,0,0.7)',
  });
  ctx.restore();
}

// ---------------- 物件绘制（与之前一致，坐标按大地图传入）----------------

function drawHouse(r, x, y) {
  r.rect(x, y + 60, 200, 120, 'rgba(0,0,0,0.3)');
  r.rect(x, y + 60, 200, 100, '#e4bc84');
  for (let i = 0; i < 200; i += 12) r.rect(x + i, y + 60, 2, 100, '#d2a66b');
  r.rect(x - 10, y, 220, 70, '#b84638');
  for (let yy = 0; yy < 70; yy += 10) {
    for (let xx = 0; xx < 220; xx += 15) {
      r.rect(x - 10 + xx + (yy % 20 === 0 ? 7 : 0), y + yy, 13, 8, '#cf5b38');
      r.rect(x - 10 + xx + (yy % 20 === 0 ? 7 : 0), y + yy + 8, 13, 2, '#8a3328');
    }
  }
  r.rect(x + 78, y + 108, 44, 52, '#5c3a21');
  r.rect(x + 80, y + 110, 40, 50, '#8b5a34');
  r.circle(x + 110, y + 135, 4, '#ffce54');
  const drawWin = (wx, wy) => {
    r.rect(wx, wy, 30, 30, '#5c3a21');
    r.rect(wx + 2, wy + 2, 26, 26, '#4a9fc8');
    r.rect(wx + 14, wy + 2, 2, 26, '#5c3a21');
    r.rect(wx + 2, wy + 14, 26, 2, '#5c3a21');
    r.rect(wx + 4, wy + 4, 8, 8, 'rgba(255,255,255,0.4)');
  };
  drawWin(x + 20, y + 90);
  drawWin(x + 150, y + 90);
  r.rect(x - 10, y + 160, 220, 20, '#a67b5b');
  for (let i = 0; i < 220; i += 10) r.rect(x - 10 + i, y + 160, 2, 20, '#8b5a34');
}

function drawFarm(r, x, y) {
  r.rect(x, y, 180, 120, '#5c3a21');
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const px = x + 10 + col * 55;
      const py = y + 10 + row * 35;
      r.rect(px, py, 45, 25, '#8b5a34');
      r.rect(px + 20, py + 5, 4, 15, '#3a8a40');
      r.rect(px + 15, py + 5, 14, 8, '#46a64c');
      r.rect(px + 17, py + 2, 10, 5, '#6fdb6f');
    }
  }
}

function drawTrees(r, trees) {
  for (const [x, y] of trees) {
    r.circle(x, y + 20, 20, 'rgba(0,0,0,0.3)');
    r.rect(x - 6, y - 10, 12, 35, '#7a4a28');
    r.rect(x - 6, y - 10, 4, 35, '#5c361c');
    r.circle(x, y - 20, 35, '#2d6b32');
    r.circle(x - 10, y - 25, 25, '#3a8a40');
    r.circle(x + 10, y - 15, 25, '#245428');
    r.circle(x, y - 35, 20, '#46a64c');
    r.rect(x - 15, y - 45, 6, 6, '#55b355');
    r.rect(x + 5, y - 35, 6, 6, '#55b355');
    r.rect(x - 20, y - 15, 6, 6, '#55b355');
  }
}

function drawWell(r, x, y) {
  r.circle(x, y + 15, 35, 'rgba(0,0,0,0.3)');
  r.rect(x - 30, y - 10, 60, 30, '#5a544b');
  for (let i = 0; i < 60; i += 15) {
    r.rect(x - 30 + i, y - 10, 14, 14, '#7a7366');
    r.rect(x - 30 + i - 7, y + 4, 14, 14, '#6a6356');
  }
  r.rect(x - 24, y - 10, 48, 14, '#222');
  r.rect(x - 20, y - 6, 40, 14, '#3a8ebf');
  r.rect(x - 28, y - 50, 6, 50, '#5c3a21');
  r.rect(x + 22, y - 50, 6, 50, '#5c3a21');
  r.rect(x - 35, y - 65, 70, 20, '#b84638');
  r.rect(x - 35, y - 45, 70, 4, '#8a3328');
}

function drawWater(r, x, y, w, h, t) {
  r.rect(x, y, w, h, '#1e6b9c');
  r.rect(x, y, w, 8, '#4a9fc8');
  r.rect(x, y + h - 8, w, 8, '#4a9fc8');
  for (let yy = y + 16; yy < y + h - 16; yy += 24) {
    for (let xx = x; xx < x + w; xx += 40) {
      const offset = (t * 30 + yy * 2) % 40;
      r.rect(xx + offset, yy, 16, 4, '#4a9fc8');
      r.rect(xx + offset + 4, yy + 4, 8, 4, '#75bde0');
    }
  }
}

function drawBridge(r, x, y) {
  r.rect(x, y + 10, 200, 250, 'rgba(0,0,0,0.25)');
  for (let i = 0; i < 7; i++) {
    const px = x + i * 28;
    r.rect(px, y, 26, 250, '#8b5a34');
    r.rect(px + 4, y, 2, 250, '#704627');
    r.rect(px + 12, y, 4, 250, '#704627');
    r.rect(px + 20, y, 2, 250, '#704627');
  }
  r.rect(x - 10, y + 20, 216, 10, '#5c3a21');
  r.rect(x - 10, y + 220, 216, 10, '#5c3a21');
}

function drawRocks(r, rocks) {
  for (const [x, y] of rocks) {
    r.circle(x, y + 10, 25, 'rgba(0,0,0,0.3)');
    r.rect(x - 24, y - 16, 48, 32, '#5a544b');
    r.rect(x - 20, y - 22, 40, 40, '#5a544b');
    r.rect(x - 20, y - 22, 36, 12, '#7a7366');
    r.rect(x - 16, y - 10, 16, 16, '#8c8475');
    r.rect(x + 4, y - 4, 4, 16, '#3d3933');
    r.rect(x - 12, y + 6, 12, 4, '#3d3933');
  }
}

function drawLava(r, x, y, w, h, t) {
  r.rect(x, y, w, h, '#cf4023');
  r.rect(x, y, w, 8, '#8a2815');
  r.rect(x, y + h - 8, w, 8, '#8a2815');
  for (let yy = y + 12; yy < y + h - 12; yy += 20) {
    for (let xx = x; xx < x + w - 20; xx += 30) {
      const offset = (t * 20 + yy * 3) % 30;
      r.rect(xx + offset, yy, 12, 6, '#f07122');
      r.rect(xx + offset + 4, yy + 6, 6, 4, '#f5a622');
    }
  }
}

function drawVolcano(r, x, y) {
  const ctx = r.ctx;
  ctx.fillStyle = '#4a2a1e';
  ctx.beginPath();
  ctx.moveTo(x - 130, y + 200);
  ctx.lineTo(x - 40, y);
  ctx.lineTo(x + 40, y);
  ctx.lineTo(x + 130, y + 200);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#361e14';
  ctx.beginPath();
  ctx.moveTo(x, y + 200);
  ctx.lineTo(x - 14, y);
  ctx.lineTo(x + 40, y);
  ctx.lineTo(x + 130, y + 200);
  ctx.closePath();
  ctx.fill();
  r.circle(x, y, 34, '#1f110b');
  r.rect(x - 22, y - 6, 44, 12, '#cf4023');
  ctx.fillStyle = '#f07122';
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 6);
  ctx.lineTo(x - 18, y + 80);
  ctx.lineTo(x + 6, y + 150);
  ctx.lineTo(x + 18, y + 80);
  ctx.lineTo(x + 12, y + 6);
  ctx.closePath();
  ctx.fill();
}

function drawCave(r, x, y) {
  r.rect(x, y + 20, 280, 170, 'rgba(0,0,0,0.4)');
  r.rect(x + 14, y, 252, 180, '#4a4552');
  r.rect(x, y + 12, 280, 160, '#4a4552');
  r.rect(x + 24, y + 12, 232, 160, '#5c5666');
  r.rect(x + 80, y + 60, 120, 120, '#110e14');
  r.rect(x + 40, y + 36, 50, 24, '#6e677a');
  r.rect(x + 200, y + 100, 36, 48, '#3a3640');
  r.rect(x + 96, y + 50, 4, 40, '#3a6b2a');
  r.rect(x + 120, y + 50, 4, 60, '#3a6b2a');
  r.rect(x + 168, y + 50, 4, 30, '#3a6b2a');
}

function drawWebs(r, webs) {
  const ctx = r.ctx;
  ctx.strokeStyle = 'rgba(230,230,220,0.7)';
  ctx.lineWidth = 2;
  for (const [x, y] of webs) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 52, y + Math.sin(a) * 52);
      ctx.stroke();
    }
    for (let ring = 1; ring <= 3; ring++) {
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rr = (52 / 3) * ring;
        i === 0 ? ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.stroke();
    }
  }
}

function drawPond(r, x, y, t) {
  r.rect(x + 10, y, 260, 130, '#4a9fc8');
  r.rect(x, y + 10, 280, 110, '#4a9fc8');
  r.rect(x + 10, y + 10, 260, 110, '#2f6f92');
  for (let i = 0; i < 6; i++) {
    r.rect(x + 30 + i * 40 + Math.sin(t + i) * 4, y + 36 + (i % 2) * 36, 24, 5, '#bdefff');
  }
}

function drawShrine(r, x, y) {
  r.rect(x - 50, y + 70, 100, 70, 'rgba(0,0,0,0.3)');
  r.rect(x - 40, y + 100, 80, 40, '#8a8175');
  r.rect(x - 35, y + 105, 70, 30, '#70685e');
  r.rect(x - 35, y + 50, 10, 50, '#b84638');
  r.rect(x + 25, y + 50, 10, 50, '#b84638');
  r.rect(x - 50, y + 30, 100, 20, '#3d8268');
  r.rect(x - 40, y + 15, 80, 15, '#3d8268');
  r.rect(x - 50, y + 45, 100, 5, '#265442');
  r.rect(x - 15, y + 80, 30, 20, '#b84638');
  r.circle(x, y + 75, 8, '#ffce54');
}

function drawPagoda(r, x, y, t) {
  r.circle(x, y + 80, 100 + Math.sin(t * 3) * 10, 'rgba(255,226,130,0.15)');
  r.rect(x - 80, y + 190, 160, 20, '#8a8175');
  for (let i = 0; i < 5; i++) {
    const w = 130 - i * 20;
    const py = y + 150 - i * 35;
    r.rect(x - w / 2 + 10, py, w - 20, 40, '#b84638');
    r.rect(x - w / 2 + 20, py + 10, 10, 30, '#8a3328');
    r.rect(x + w / 2 - 30, py + 10, 10, 30, '#8a3328');
    r.rect(x - 10, py + 10, 20, 30, '#d9a441');
    r.rect(x - w / 2, py - 10, w, 15, '#3d8268');
    r.rect(x - w / 2 - 10, py + 5, w + 20, 5, '#265442');
  }
  r.rect(x - 4, y - 25, 8, 40, '#d9a441');
  r.circle(x, y - 30, 6, '#ffce54');
}

function drawCloudPads(r, pads, t) {
  for (const [x, y] of pads) {
    const oy = Math.sin(t * 2 + x) * 5;
    r.circle(x, y + 20, 30, 'rgba(0,0,0,0.12)');
    r.circle(x - 20, y + oy, 20, '#fff');
    r.circle(x + 20, y + oy, 20, '#fff');
    r.circle(x, y - 10 + oy, 25, '#fff');
    r.rect(x - 30, y + 5 + oy, 60, 15, '#fff');
    r.rect(x - 25, y + 15 + oy, 50, 5, '#d4e5f2');
  }
}

function pseudoNoise(x, y, key) {
  let h = key.length * 97 + (x | 0) * 17 + (y | 0) * 31;
  h = Math.imul(h ^ (h >>> 15), 1 | h);
  return ((h ^ (h >>> 7)) >>> 0) / 4294967295;
}
