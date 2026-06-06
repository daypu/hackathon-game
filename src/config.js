// ============================================================
//  西游·万象迷途 —— 全局配置与游戏数据定义
// ============================================================

export const GAME = {
  width: 960,
  height: 540,
  px: 3, // 像素单元：每个精灵像素 = 3 个屏幕像素（角色更小，地图显得更大）
  // 玩家垂直可活动区域（道路带）
  roadTop: 150,
  roadBottom: 506,
  playerX: 190, // 队伍固定的水平基准位置
  baseScroll: 230, // 基础卷轴速度（像素/秒）
  goalDistance: 22000, // 抵达灵山所需的累计路程（约 80~90 秒）
  worldWidth: 3600,
  worldHeight: 2200,
  startX: 260,
  startY: 1740,
  lingshanX: 3260,
  lingshanY: 260,
};

// ---------------- 像素调色板 ----------------
export const PAL = {
  skyTop: '#241a3a',
  skyBottom: '#3a2a4f',
  fogA: '#4b3a6b',
  fogB: '#2a2140',
  road: '#5a4632',
  roadDark: '#473526',
  roadLine: '#7a6347',
  white: '#f5efe0',
  ink: '#1a1526',
  gold: '#ffce54',
  red: '#e0533d',
  blue: '#4aa3ff',
  green: '#7ed957',
  purple: '#b06bd8',
  shadow: 'rgba(0,0,0,0.35)',
};

// ---------------- 三大核心属性 ----------------
// 法力(mana) / 信念(faith) / 经书完整度(scripture)
export const STATS = [
  { key: 'mana', label: '法力', color: '#4aa3ff', glow: '#9fd0ff' },
  { key: 'faith', label: '信念', color: '#ffce54', glow: '#ffe9a8' },
  { key: 'scripture', label: '经书', color: '#7ed957', glow: '#c4f5a3' },
];
export const STAT_MAX = 100;

// ---------------- 妖障（负向元素）----------------
// stat: 受击时扣减的属性；dmg: 扣减量；effect: 额外效果
export const HAZARDS = {
  yaofeng: {
    key: 'yaofeng',
    label: '妖风',
    stat: 'faith',
    dmg: 14,
    color: '#b06bd8',
    w: 64,
    h: 40,
    effect: 'pushback', // 把队伍向后吹
    speedMul: 1.15,
    weight: 1.1,
  },
  rock: {
    key: 'rock',
    label: '落石',
    stat: 'scripture',
    dmg: 20,
    color: '#8a8170',
    w: 48,
    h: 48,
    effect: 'fall', // 从上方砸落
    speedMul: 1.0,
    weight: 1.0,
  },
  flame: {
    key: 'flame',
    label: '火焰山余焰',
    stat: 'mana',
    dmg: 16,
    color: '#ff7a3d',
    w: 52,
    h: 56,
    effect: 'flicker',
    speedMul: 1.0,
    weight: 1.0,
  },
  web: {
    key: 'web',
    label: '盘丝洞蛛网',
    stat: 'faith',
    dmg: 8,
    color: '#d8d2c0',
    w: 70,
    h: 70,
    effect: 'slow', // 被粘住，减速一段时间
    speedMul: 0.85,
    weight: 0.9,
  },
  trap: {
    key: 'trap',
    label: '小妖陷阱',
    stat: 'mana',
    dmg: 12,
    color: '#c0553d',
    w: 46,
    h: 30,
    effect: 'random', // 随机额外扣一项
    speedMul: 1.0,
    weight: 0.85,
  },
};

// ---------------- 收集物（正向元素）----------------
export const PICKUPS = {
  buddhalight: {
    key: 'buddhalight',
    label: '佛光',
    stat: 'faith',
    heal: 16,
    color: '#fff2b0',
    r: 16,
    weight: 1.1,
  },
  scripturePage: {
    key: 'scripturePage',
    label: '经文残页',
    stat: 'scripture',
    heal: 16,
    color: '#e9dca8',
    r: 15,
    weight: 1.0,
  },
  peach: {
    key: 'peach',
    label: '仙桃',
    stat: 'mana',
    heal: 16,
    color: '#ff9fc4',
    r: 15,
    weight: 1.0,
  },
  cloud: {
    key: 'cloud',
    label: '筋斗云碎片',
    effect: 'cloud', // 短暂加速 + 无敌
    duration: 4,
    color: '#eaf4ff',
    r: 17,
    weight: 0.55,
  },
  amulet: {
    key: 'amulet',
    label: '护身符',
    effect: 'shield', // 获得一次护盾
    color: '#ff6b5e',
    r: 15,
    weight: 0.6,
  },
};

// ---------------- 取经称号（按最终评分映射）----------------
// score: 0~100 综合分；从高到低匹配第一个满足 min 的称号
export const TITLES = [
  { min: 92, name: '斗战胜佛 · 功德圆满', stars: 5, desc: '诸难尽历，真经无损，超凡入圣。' },
  { min: 80, name: '金身罗汉', stars: 5, desc: '心如磐石，妖障难侵，已近正果。' },
  { min: 68, name: '披荆斩棘的护法', stars: 4, desc: '一路斩妖除障，护得师徒周全。' },
  { min: 54, name: '心诚则灵的行者', stars: 3, desc: '虽有磕绊，信念不改，终见灵光。' },
  { min: 40, name: '凡心未泯的取经人', stars: 2, desc: '尘缘未了，仍需在红尘中多加修行。' },
  { min: 0, name: '迷途未醒的行脚僧', stars: 1, desc: '万象迷途，心神俱乱，来日方长。' },
];

// 未能抵达终点（属性耗尽）时的结局
export const FAIL_TITLE = {
  name: '困于万象迷途',
  stars: 0,
  desc: '法力、信念或真经其一耗尽，师徒受困于妖气之中……',
};
