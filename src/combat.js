export const SKILL_COOLDOWN = 8;

export const HERO_SKILLS = {
  wukong: {
    label: '火眼金睛',
    desc: '释放远程火焰激光，灼穿路径上的小怪',
    range: 420,
    damage: 18,
    width: 34,
    type: 'beam',
    color: '#ff7a22',
  },
  tangseng: {
    label: '九环佛光',
    desc: '展开佛光法阵，范围伤害并恢复信念',
    range: 165,
    damage: 10,
    heal: 12,
    type: 'aoe',
    color: '#fff2b0',
  },
  bajie: {
    label: '天蓬裂地',
    desc: '向前方扇形猛砸，击退近身小怪',
    range: 165,
    angle: 1.75,
    damage: 15,
    type: 'cone',
    color: '#f0a05a',
  },
  shaseng: {
    label: '流沙锁链',
    desc: '召出流沙锁链，远程伤害并短暂定住小怪',
    range: 330,
    width: 42,
    damage: 13,
    slow: 2.4,
    type: 'wave',
    color: '#6fb0c8',
  },
};

export const MONSTER_SPAWNS = [
  { x: 330, y: 515, tier: 1, kind: 'grunt' },
  { x: 245, y: 335, tier: 1, kind: 'venom' },
  { x: 575, y: 930, tier: 1, kind: 'grunt' },
  { x: 690, y: 860, tier: 1, kind: 'venom' },
  { x: 770, y: 465, tier: 1, kind: 'ranged' },
  { x: 860, y: 780, tier: 1, kind: 'grunt' },
  { x: 945, y: 510, tier: 1, kind: 'stunner' },
  { x: 980, y: 700, tier: 1, kind: 'ranged' },
  { x: 1110, y: 650, tier: 1, kind: 'grunt' },
  { x: 1225, y: 625, tier: 1, kind: 'ranged' },
  { x: 1335, y: 630, tier: 2, kind: 'stunner' },
  { x: 1435, y: 635, tier: 1, kind: 'venom' },
  { x: 1535, y: 635, tier: 2, kind: 'ranged' },
  { x: 1635, y: 610, tier: 2, kind: 'stunner' },
  { x: 1690, y: 735, tier: 2, kind: 'venom' },
  { x: 1775, y: 720, tier: 3, kind: 'brute' },
  { x: 1905, y: 770, tier: 2, kind: 'ranged' },
  { x: 1985, y: 675, tier: 2, kind: 'stunner' },
  { x: 2055, y: 700, tier: 3, kind: 'brute' },
  { x: 2160, y: 590, tier: 2, kind: 'stunner' },
  { x: 2250, y: 470, tier: 2, kind: 'ranged' },
];

export const SHOP_ITEMS = [
  { key: 'hp', label: '蟠桃', desc: '当前角色血量上限 +20，并回复 20', cost: 18, color: '#ff9fc4' },
  { key: 'attack', label: '金箍碎片', desc: '普通攻击伤害 +2', cost: 24, color: '#ffce54' },
  { key: 'speed', label: '疾风符', desc: '移动速度 +12', cost: 20, color: '#9fd0ff' },
  { key: 'skill', label: '灵光符', desc: '技能伤害 +3', cost: 26, color: '#fff2b0' },
];

export function skillFor(key) {
  return HERO_SKILLS[key] || HERO_SKILLS.wukong;
}
