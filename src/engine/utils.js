// 轻量数学/工具函数集合

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

export const lerp = (a, b, t) => a + (b - a) * t;

// 让 current 以 step 速度趋近 target（带阻尼的线性插值）
export const approach = (current, target, step) => {
  if (current < target) return Math.min(current + step, target);
  if (current > target) return Math.max(current - step, target);
  return current;
};

export const rand = (min, max) => min + Math.random() * (max - min);

export const randInt = (min, max) => Math.floor(rand(min, max + 1));

export const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const chance = (p) => Math.random() < p;

// 轴对齐包围盒碰撞检测
export const aabb = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// 两个圆是否相交（用于更柔和的拾取判定）
export const circleHit = (ax, ay, ar, bx, by, br) => {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
};

export const now = () => performance.now();

// 可复现随机数（mulberry32），开放世界做地图生成时会用到
export const makeRng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutQuad = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
