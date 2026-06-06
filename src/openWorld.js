import { GAME } from './config.js';
import { Hazard } from './entities/Hazard.js';
import { Pickup } from './entities/Pickup.js';

const bgCache = {};

export const WORLD_BOUNDS = { x: 42, y: 96, w: GAME.width - 84, h: GAME.height - 130 };

export const SCENE_ORDER = ['changan', 'liusha', 'huoyan', 'pansi', 'yaolin', 'lingshan'];

export const SCENES = {
  changan: {
    key: 'changan',
    label: '长安营地',
    desc: '取经队伍整装出发，草地、土路与小屋构成安全起点。',
    edge: '#8f704d',
    miasma: 0.08,
    spawn: { x: 190, y: 382 },
    exits: [
      { x: 846, y: 268, w: 84, h: 86, to: 'liusha', spawn: { x: 96, y: 284 }, label: '前往流沙河' },
    ],
    hazards: [
      ['trap', 670, 376],
      ['yaofeng', 742, 208],
    ],
    pickups: [
      ['peach', 610, 326],
      ['buddhalight', 475, 252],
      ['scripturePage', 720, 144],
      ['amulet', 354, 404],
    ],
  },
  liusha: {
    key: 'liusha',
    label: '流沙河',
    desc: '河水横贯，渡口旁散落经页，妖风与落石在岸边盘旋。',
    edge: '#6f8ca8',
    miasma: 0.28,
    spawn: { x: 96, y: 284 },
    exits: [
      { x: 0, y: 248, w: 54, h: 96, to: 'changan', spawn: { x: 828, y: 300 }, label: '回到长安营地' },
      { x: 856, y: 318, w: 74, h: 98, to: 'huoyan', spawn: { x: 100, y: 360 }, label: '前往火焰山' },
      { x: 438, y: 96, w: 98, h: 54, to: 'pansi', spawn: { x: 486, y: 440 }, label: '进入盘丝洞' },
    ],
    hazards: [
      ['yaofeng', 690, 250],
      ['rock', 742, 372],
      ['trap', 352, 414],
    ],
    pickups: [
      ['scripturePage', 526, 218],
      ['peach', 648, 414],
      ['cloud', 280, 212],
      ['buddhalight', 816, 168],
    ],
  },
  huoyan: {
    key: 'huoyan',
    label: '火焰山',
    desc: '赤土与岩浆割裂道路，火焰会消耗法力。',
    edge: '#d56a3a',
    miasma: 0.5,
    spawn: { x: 100, y: 360 },
    exits: [
      { x: 0, y: 320, w: 54, h: 96, to: 'liusha', spawn: { x: 820, y: 366 }, label: '返回流沙河' },
      { x: 846, y: 156, w: 78, h: 104, to: 'yaolin', spawn: { x: 108, y: 214 }, label: '穿过山口' },
    ],
    hazards: [
      ['flame', 374, 318],
      ['flame', 560, 386],
      ['rock', 646, 202],
      ['trap', 742, 430],
    ],
    pickups: [
      ['peach', 220, 214],
      ['cloud', 462, 166],
      ['amulet', 686, 326],
      ['scripturePage', 804, 120],
    ],
  },
  pansi: {
    key: 'pansi',
    label: '盘丝洞',
    desc: '藤蔓与蛛网遮蔽小径，踩中蛛丝会被拖慢。',
    edge: '#d8d2c0',
    miasma: 0.58,
    spawn: { x: 486, y: 440 },
    exits: [
      { x: 430, y: 466, w: 112, h: 54, to: 'liusha', spawn: { x: 486, y: 172 }, label: '回到流沙河' },
      { x: 848, y: 224, w: 74, h: 110, to: 'yaolin', spawn: { x: 104, y: 300 }, label: '钻出洞口' },
    ],
    hazards: [
      ['web', 354, 210],
      ['web', 632, 300],
      ['trap', 736, 402],
      ['yaofeng', 204, 390],
    ],
    pickups: [
      ['buddhalight', 238, 192],
      ['scripturePage', 482, 260],
      ['amulet', 692, 188],
      ['peach', 312, 426],
    ],
  },
  yaolin: {
    key: 'yaolin',
    label: '万象妖林',
    desc: '妖林深处路径交错，是抵达灵山前的最后迷途。',
    edge: '#6fb06d',
    miasma: 0.74,
    spawn: { x: 108, y: 300 },
    exits: [
      { x: 0, y: 178, w: 54, h: 98, to: 'huoyan', spawn: { x: 820, y: 208 }, label: '返回火焰山' },
      { x: 0, y: 286, w: 54, h: 98, to: 'pansi', spawn: { x: 820, y: 280 }, label: '返回盘丝洞' },
      { x: 828, y: 138, w: 96, h: 102, to: 'lingshan', spawn: { x: 120, y: 306 }, label: '前往灵山入口' },
    ],
    hazards: [
      ['yaofeng', 456, 212],
      ['web', 612, 360],
      ['flame', 730, 270],
      ['trap', 360, 420],
    ],
    pickups: [
      ['buddhalight', 204, 210],
      ['scripturePage', 530, 166],
      ['cloud', 742, 404],
      ['amulet', 650, 150],
    ],
  },
  lingshan: {
    key: 'lingshan',
    label: '灵山入口',
    desc: '金光照见心念，走到宝塔前即可结算取经成果。',
    edge: '#ffce54',
    miasma: 0.16,
    spawn: { x: 120, y: 306 },
    exits: [
      { x: 0, y: 268, w: 54, h: 96, to: 'yaolin', spawn: { x: 804, y: 190 }, label: '返回万象妖林' },
    ],
    goal: { x: 742, y: 212, w: 124, h: 132 },
    hazards: [
      ['yaofeng', 364, 332],
      ['rock', 492, 408],
    ],
    pickups: [
      ['buddhalight', 540, 200],
      ['scripturePage', 666, 360],
      ['amulet', 274, 210],
    ],
  },
};

export const ZONES = SCENE_ORDER.map((key, index) => ({
  ...SCENES[key],
  progressIndex: index,
}));

export const LANDMARKS = ZONES.map((z, i) => ({
  key: z.key,
  label: z.label,
  x: 18 + i * 18,
  y: 42 + (i % 2) * 18,
}));

export function getZoneAt(_x, _y, sceneKey = 'changan') {
  return SCENES[sceneKey] || SCENES.changan;
}

export function sceneProgress(sceneKey, discovered) {
  const idx = Math.max(0, SCENE_ORDER.indexOf(sceneKey));
  return Math.min(1, (idx + discovered.size * 0.22) / (SCENE_ORDER.length + 1));
}

export function isInRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function makeCamera() {
  return { x: 0, y: 0 };
}

export function distanceToLingshan() {
  return 0;
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

export function drawOpenWorld(r, _camera, state, t) {
  const scene = SCENES[state.sceneKey] || SCENES.changan;
  const bg = getCachedBackground(scene);
  r.ctx.drawImage(bg, 0, 0);

  drawSceneDetails(r, scene, t);
  drawExits(r, scene, t);
}

function getCachedBackground(scene) {
  if (bgCache[scene.key]) return bgCache[scene.key];

  const canvas = document.createElement('canvas');
  canvas.width = GAME.width;
  canvas.height = GAME.height;
  const ctx = canvas.getContext('2d');
  const r = {
    ctx,
    rect: (x, y, w, h, c) => { if (c) ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, Math.ceil(w), Math.ceil(h)); },
    circle: (x, y, rad, c) => { ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); if (c) ctx.fillStyle = c; ctx.fill(); }
  };

  const palette = scenePalette(scene.key);
  r.rect(0, 0, GAME.width, GAME.height, palette.base);

  // 高精度像素化地面纹理
  for (let y = 0; y < GAME.height; y += 4) {
    for (let x = 0; x < GAME.width; x += 4) {
      const n = pseudoNoise(x, y, scene.key);
      if (n > 0.75) r.rect(x, y, 4, 4, palette.alt);
      else if (n < 0.15) r.rect(x, y, 4, 4, palette.dark);

      if (n > 0.98) {
        r.rect(x, y, 2, 8, palette.detail);
        r.rect(x + 4, y + 2, 2, 6, palette.detail);
        r.rect(x - 4, y + 3, 2, 5, palette.detail);
      }
    }
  }

  drawStaticPaths(r, scene.key, palette);

  // 柔和暗角与屏幕边界
  const g = ctx.createRadialGradient(GAME.width / 2, GAME.height / 2, 200, GAME.width / 2, GAME.height / 2, 600);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME.width, GAME.height);

  ctx.strokeStyle = 'rgba(20,15,10,0.45)';
  ctx.lineWidth = 16;
  ctx.strokeRect(30, 78, GAME.width - 60, GAME.height - 106);

  bgCache[scene.key] = canvas;
  return canvas;
}

function scenePalette(key) {
  const palettes = {
    changan: { base: '#5b8c44', alt: '#669c4d', dark: '#4e7a3a', detail: '#3a6b2a', pebble: '#d9bf7a', path: '#c49a52', pathDark: '#a67d3d' },
    liusha: { base: '#c7a765', alt: '#d4b472', dark: '#b39454', detail: '#8e7650', pebble: '#e6c883', path: '#dfbd73', pathDark: '#c29f55' },
    huoyan: { base: '#9c4c31', alt: '#ab5638', dark: '#823c24', detail: '#622a16', pebble: '#c46843', path: '#b8613c', pathDark: '#964b2b' },
    pansi: { base: '#4a5445', alt: '#535e4d', dark: '#3b4536', detail: '#2a3326', pebble: '#6a7863', path: '#63594b', pathDark: '#4a4135' },
    yaolin: { base: '#2d663b', alt: '#347544', dark: '#24542f', detail: '#1a4022', pebble: '#428c53', path: '#8c7544', pathDark: '#6b5830' },
    lingshan: { base: '#6b9c5c', alt: '#78ab68', dark: '#5c8a4e', detail: '#f0d46a', pebble: '#8e8567', path: '#d8bd66', pathDark: '#b59c4c' },
  };
  return palettes[key] || palettes.changan;
}

function drawStaticPaths(r, key, pal) {
  let pts = [];
  if (key === 'changan') pts = [[60, 340], [260, 340], [438, 250], [900, 300]];
  else if (key === 'liusha') pts = [[40, 316], [260, 318], [470, 262], [650, 338], [910, 366]];
  else if (key === 'huoyan') pts = [[42, 382], [236, 348], [428, 260], [648, 236], [910, 198]];
  else if (key === 'pansi') pts = [[486, 500], [480, 384], [620, 300], [900, 280]];
  else if (key === 'yaolin') pts = [[44, 310], [240, 300], [430, 238], [650, 202], [904, 190]];
  else if (key === 'lingshan') pts = [[40, 320], [236, 300], [458, 266], [748, 270]];

  if (!pts.length) return;

  const ctx = r.ctx;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Border/Shadow
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 52;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();

  // Base
  ctx.strokeStyle = pal.path;
  ctx.lineWidth = 44;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();

  // Inner detail
  ctx.strokeStyle = pal.pathDark;
  ctx.lineWidth = 32;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();

  // Path pixel noise
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.floor(dist / 8);
    for (let j = 0; j < steps; j++) {
      const bx = p1[0] + (p2[0] - p1[0]) * (j / steps);
      const by = p1[1] + (p2[1] - p1[1]) * (j / steps);
      const n1 = pseudoNoise(bx, by, 'px') - 0.5;
      const n2 = pseudoNoise(bx, by, 'py') - 0.5;
      r.rect(bx + n1 * 36, by + n2 * 36, 4, 4);
    }
  }
  ctx.restore();
}

function drawSceneDetails(r, scene, t) {
  switch (scene.key) {
    case 'changan':
      drawHouse(r, 210, 130);
      drawFarm(r, 54, 126);
      drawTrees(r, [[670, 132], [744, 128], [806, 170], [566, 398], [646, 420]]);
      drawWell(r, 792, 356);
      break;
    case 'liusha':
      drawWater(r, 0, 122, 960, 122, t);
      drawBridge(r, 416, 190);
      drawRocks(r, [[160, 420], [730, 130], [820, 436], [590, 406]]);
      break;
    case 'huoyan':
      drawLava(r, 268, 130, 170, 68, t);
      drawLava(r, 522, 398, 230, 60, t);
      drawVolcano(r, 742, 112);
      drawRocks(r, [[220, 160], [600, 178], [802, 396], [466, 340]]);
      break;
    case 'pansi':
      drawCave(r, 110, 122);
      drawWebs(r, [[330, 170], [610, 220], [760, 380]]);
      drawTrees(r, [[196, 410], [286, 426], [748, 126], [836, 152]]);
      break;
    case 'yaolin':
      drawTrees(r, [[120, 142], [210, 178], [310, 136], [514, 356], [690, 356], [782, 310], [842, 414]]);
      drawPond(r, 402, 384, t);
      drawShrine(r, 620, 110);
      break;
    case 'lingshan':
      drawPagoda(r, 746, 122, t);
      drawTrees(r, [[182, 164], [258, 402], [564, 420], [852, 420]]);
      drawCloudPads(r, t);
      break;
  }
}

function drawExits(r, scene, t) {
  for (const ex of scene.exits) drawPortal(r, ex, scene.edge, t);
  if (scene.goal) drawPortal(r, scene.goal, '#ffce54', t, '灵山');
}

function drawPortal(r, rect, color, t, label = rect.label) {
  const ctx = r.ctx;
  ctx.save();
  ctx.globalAlpha = 0.25 + Math.sin(t * 5) * 0.08;
  r.roundRect(rect.x, rect.y, rect.w, rect.h, 12, color);
  ctx.globalAlpha = 1;
  r.roundRect(rect.x, rect.y, rect.w, rect.h, 12, null, color, 3);
  r.text(label, rect.x + rect.w / 2, rect.y - 8, {
    size: 12,
    color: '#fff2b0',
    align: 'center',
    weight: '800',
    shadow: 'rgba(0,0,0,0.6)',
  });
  ctx.restore();
}

function drawHouse(r, x, y) {
  // Base shadow
  r.rect(x, y + 60, 200, 120, 'rgba(0,0,0,0.3)');
  // Walls (wood planks)
  r.rect(x, y + 60, 200, 100, '#e4bc84');
  for (let i = 0; i < 200; i += 12) r.rect(x + i, y + 60, 2, 100, '#d2a66b');
  // Roof
  r.rect(x - 10, y, 220, 70, '#b84638');
  for (let yy = 0; yy < 70; yy += 10) {
    for (let xx = 0; xx < 220; xx += 15) {
      r.rect(x - 10 + xx + (yy % 20 === 0 ? 7 : 0), y + yy, 13, 8, '#cf5b38');
      r.rect(x - 10 + xx + (yy % 20 === 0 ? 7 : 0), y + yy + 8, 13, 2, '#8a3328');
    }
  }
  // Door
  r.rect(x + 78, y + 108, 44, 52, '#5c3a21');
  r.rect(x + 80, y + 110, 40, 50, '#8b5a34');
  r.circle(x + 110, y + 135, 4, '#ffce54');
  // Windows
  const drawWin = (wx, wy) => {
    r.rect(wx, wy, 30, 30, '#5c3a21');
    r.rect(wx + 2, wy + 2, 26, 26, '#4a9fc8');
    r.rect(wx + 14, wy + 2, 2, 26, '#5c3a21');
    r.rect(wx + 2, wy + 14, 26, 2, '#5c3a21');
    r.rect(wx + 4, wy + 4, 8, 8, 'rgba(255,255,255,0.4)');
  };
  drawWin(x + 20, y + 90);
  drawWin(x + 150, y + 90);
  // Porch
  r.rect(x - 10, y + 160, 220, 20, '#a67b5b');
  for (let i = 0; i < 220; i += 10) r.rect(x - 10 + i, y + 160, 2, 20, '#8b5a34');
}

function drawFarm(r, x, y) {
  r.rect(x, y, 180, 120, '#5c3a21'); // Dark dirt
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const px = x + 10 + col * 55;
      const py = y + 10 + row * 35;
      r.rect(px, py, 45, 25, '#8b5a34'); // Raised bed
      // Crop
      r.rect(px + 20, py + 5, 4, 15, '#3a8a40'); // Stem
      r.rect(px + 15, py + 5, 14, 8, '#46a64c'); // Leaves
      r.rect(px + 17, py + 2, 10, 5, '#6fdb6f'); // Highlight
    }
  }
}

function drawTrees(r, trees) {
  for (const [x, y] of trees) {
    // Shadow
    r.circle(x, y + 20, 20, 'rgba(0,0,0,0.3)');
    // Trunk
    r.rect(x - 6, y - 10, 12, 35, '#7a4a28');
    r.rect(x - 6, y - 10, 4, 35, '#5c361c'); // trunk shadow
    // Leaves
    r.circle(x, y - 20, 35, '#2d6b32');
    r.circle(x - 10, y - 25, 25, '#3a8a40');
    r.circle(x + 10, y - 15, 25, '#245428');
    r.circle(x, y - 35, 20, '#46a64c');
    // Highlights
    r.rect(x - 15, y - 45, 6, 6, '#55b355');
    r.rect(x + 5, y - 35, 6, 6, '#55b355');
    r.rect(x - 20, y - 15, 6, 6, '#55b355');
  }
}

function drawWell(r, x, y) {
  // Shadow
  r.circle(x, y + 15, 35, 'rgba(0,0,0,0.3)');
  // Base stones
  r.rect(x - 30, y - 10, 60, 30, '#5a544b');
  for (let i = 0; i < 60; i += 15) {
    r.rect(x - 30 + i, y - 10, 14, 14, '#7a7366');
    r.rect(x - 30 + i - 7, y + 4, 14, 14, '#6a6356');
  }
  // Hole
  r.rect(x - 24, y - 10, 48, 14, '#222');
  r.rect(x - 20, y - 6, 40, 14, '#3a8ebf'); // water inside
  // Roof supports
  r.rect(x - 28, y - 50, 6, 50, '#5c3a21');
  r.rect(x + 22, y - 50, 6, 50, '#5c3a21');
  // Roof
  r.rect(x - 35, y - 65, 70, 20, '#b84638');
  r.rect(x - 35, y - 45, 70, 4, '#8a3328');
  // Crank
  r.rect(x + 28, y - 30, 10, 4, '#444');
  r.rect(x + 34, y - 30, 4, 12, '#444');
}

function drawWater(r, x, y, w, h, t) {
  r.rect(x, y, w, h, '#1e6b9c');
  // Shoreline
  r.rect(x, y, w, 8, '#4a9fc8');
  r.rect(x, y + h - 8, w, 8, '#4a9fc8');

  // Animated pixel waves
  for (let yy = y + 16; yy < y + h - 16; yy += 24) {
    for (let xx = x; xx < x + w; xx += 40) {
      const offset = (t * 30 + yy * 2) % 40;
      r.rect(xx + offset, yy, 16, 4, '#4a9fc8');
      r.rect(xx + offset + 4, yy + 4, 8, 4, '#75bde0');
    }
  }
}

function drawBridge(r, x, y) {
  // Shadow
  r.rect(x, y + 10, 200, 130, 'rgba(0,0,0,0.3)');
  // Planks
  for (let i = 0; i < 7; i++) {
    const px = x + i * 28;
    r.rect(px, y, 26, 130, '#8b5a34');
    // Wood grain
    r.rect(px + 4, y, 2, 130, '#704627');
    r.rect(px + 12, y, 4, 130, '#704627');
    r.rect(px + 20, y, 2, 130, '#704627');
    // Nails
    r.rect(px + 4, y + 10, 4, 4, '#444');
    r.rect(px + 18, y + 10, 4, 4, '#444');
    r.rect(px + 4, y + 116, 4, 4, '#444');
    r.rect(px + 18, y + 116, 4, 4, '#444');
  }
  // Rails
  r.rect(x - 10, y + 15, 216, 10, '#5c3a21');
  r.rect(x - 10, y + 105, 216, 10, '#5c3a21');
  // Rail posts
  for (let i = 0; i <= 7; i++) {
    r.rect(x - 6 + i * 28, y + 5, 8, 20, '#4a2e1a');
    r.rect(x - 6 + i * 28, y + 95, 8, 20, '#4a2e1a');
  }
}

function drawRocks(r, rocks) {
  for (const [x, y] of rocks) {
    // Shadow
    r.circle(x, y + 10, 25, 'rgba(0,0,0,0.3)');
    // Base shape
    r.rect(x - 24, y - 16, 48, 32, '#5a544b');
    r.rect(x - 20, y - 22, 40, 40, '#5a544b');
    // Highlights
    r.rect(x - 20, y - 22, 36, 12, '#7a7366');
    r.rect(x - 16, y - 10, 16, 16, '#8c8475');
    // Cracks/Shadows
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
  // Base Mountain
  ctx.fillStyle = '#4a2a1e';
  ctx.beginPath();
  ctx.moveTo(x - 100, y + 160);
  ctx.lineTo(x - 30, y);
  ctx.lineTo(x + 30, y);
  ctx.lineTo(x + 100, y + 160);
  ctx.closePath();
  ctx.fill();

  // Ridges/Shadows
  ctx.fillStyle = '#361e14';
  ctx.beginPath();
  ctx.moveTo(x, y + 160);
  ctx.lineTo(x - 10, y);
  ctx.lineTo(x + 30, y);
  ctx.lineTo(x + 100, y + 160);
  ctx.closePath();
  ctx.fill();

  // Crater
  r.circle(x, y, 30, '#1f110b');
  r.rect(x - 20, y - 5, 40, 10, '#cf4023');

  // Lava flow
  ctx.fillStyle = '#f07122';
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 5);
  ctx.lineTo(x - 15, y + 60);
  ctx.lineTo(x + 5, y + 120);
  ctx.lineTo(x + 15, y + 60);
  ctx.lineTo(x + 10, y + 5);
  ctx.closePath();
  ctx.fill();
}

function drawCave(r, x, y) {
  // Shadow
  r.rect(x, y + 20, 220, 140, 'rgba(0,0,0,0.4)');
  // Outer rock
  r.rect(x + 10, y, 200, 150, '#4a4552');
  r.rect(x, y + 10, 220, 130, '#4a4552');
  r.rect(x + 20, y + 10, 180, 130, '#5c5666');
  // Entrance
  r.rect(x + 60, y + 50, 100, 100, '#110e14');
  // Rock details
  r.rect(x + 30, y + 30, 40, 20, '#6e677a');
  r.rect(x + 160, y + 80, 30, 40, '#3a3640');
  // Vines hanging
  r.rect(x + 70, y + 40, 4, 30, '#3a6b2a');
  r.rect(x + 90, y + 40, 4, 50, '#3a6b2a');
  r.rect(x + 130, y + 40, 4, 20, '#3a6b2a');
}

function drawWebs(r, webs) {
  const ctx = r.ctx;
  ctx.strokeStyle = 'rgba(230,230,220,0.72)';
  ctx.lineWidth = 2;
  for (const [x, y] of webs) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 52, y + Math.sin(a) * 52);
      ctx.stroke();
    }
    r.circle(x, y, 6, '#d8d2c0');
  }
}

function drawPond(r, x, y, t) {
  r.rect(x + 10, y, 170, 92, '#4a9fc8');
  r.rect(x, y + 10, 190, 72, '#4a9fc8');
  r.rect(x + 10, y + 10, 170, 72, '#2f6f92');
  for (let i = 0; i < 5; i++) {
    r.rect(x + 30 + i * 30 + Math.sin(t + i) * 3, y + 30 + (i % 2) * 20, 20, 4, '#bdefff');
  }
}

function drawShrine(r, x, y) {
  // Shadow
  r.rect(x - 50, y + 70, 100, 70, 'rgba(0,0,0,0.3)');
  // Base
  r.rect(x - 40, y + 100, 80, 40, '#8a8175');
  r.rect(x - 35, y + 105, 70, 30, '#70685e');
  // Pillars
  r.rect(x - 35, y + 50, 10, 50, '#b84638');
  r.rect(x + 25, y + 50, 10, 50, '#b84638');
  // Roof
  r.rect(x - 50, y + 30, 100, 20, '#3d8268');
  r.rect(x - 40, y + 15, 80, 15, '#3d8268');
  r.rect(x - 50, y + 45, 100, 5, '#265442');
  // Altar
  r.rect(x - 15, y + 80, 30, 20, '#b84638');
  r.circle(x, y + 75, 8, '#ffce54');
}

function drawPagoda(r, x, y, t) {
  // Glow
  r.circle(x, y + 80, 100 + Math.sin(t * 3) * 10, 'rgba(255,226,130,0.15)');
  // Base
  r.rect(x - 80, y + 190, 160, 20, '#8a8175');

  for (let i = 0; i < 5; i++) {
    const w = 130 - i * 20;
    const py = y + 150 - i * 35;
    // Wall
    r.rect(x - w / 2 + 10, py, w - 20, 40, '#b84638');
    // Pillars/Doors
    r.rect(x - w / 2 + 20, py + 10, 10, 30, '#8a3328');
    r.rect(x + w / 2 - 30, py + 10, 10, 30, '#8a3328');
    r.rect(x - 10, py + 10, 20, 30, '#d9a441'); // Golden door
    // Roof
    r.rect(x - w / 2, py - 10, w, 15, '#3d8268');
    r.rect(x - w / 2 - 10, py + 5, w + 20, 5, '#265442');
  }
  // Spire
  r.rect(x - 4, y - 25, 8, 40, '#d9a441');
  r.circle(x, y - 30, 6, '#ffce54');
}

function drawCloudPads(r, t) {
  for (const [x, y] of [[240, 180], [402, 118], [550, 318]]) {
    const oy = Math.sin(t * 2 + x) * 5;
    // Shadow
    r.circle(x, y + 20, 30, 'rgba(0,0,0,0.15)');
    // Cloud
    r.circle(x - 20, y + oy, 20, '#fff');
    r.circle(x + 20, y + oy, 20, '#fff');
    r.circle(x, y - 10 + oy, 25, '#fff');
    r.rect(x - 30, y + 5 + oy, 60, 15, '#fff');
    // Shading
    r.rect(x - 25, y + 15 + oy, 50, 5, '#d4e5f2');
  }
}

function pseudoNoise(x, y, key) {
  let h = key.length * 97 + x * 17 + y * 31;
  h = Math.imul(h ^ (h >>> 15), 1 | h);
  return ((h ^ (h >>> 7)) >>> 0) / 4294967295;
}
