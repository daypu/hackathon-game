// 月色像素角色动画渲染辅助。
// 数据来自自动生成的角色模块；本文件是手写逻辑层。
import { WUKONG } from './wukong.js';
import { TANGSENG } from './tangseng.js';
import { SHASENG } from './shaseng.js';
import { BAJIE } from './bajie.js';

export { WUKONG, TANGSENG, SHASENG, BAJIE };

export const PARTY = [
  { key: 'tangseng', label: '唐僧', character: TANGSENG, color: '#f0d37a' },
  { key: 'wukong', label: '悟空', character: WUKONG, color: '#e8a33f' },
  { key: 'bajie', label: '八戒', character: BAJIE, color: '#d58a54' },
  { key: 'shaseng', label: '沙僧', character: SHASENG, color: '#6fb0c8' },
];

export const HERO_SCALE = 2;          // 每个精灵像素 = 2 屏幕像素
export const HERO_GROUND_OFFSET = 16; // 脚底相对玩家 y 的下移量（与碰撞/影子对齐）

const RUN_FPS = 11;   // 奔跑动画速度
const IDLE_FPS = 2.4; // 站立呼吸速度

// 依据移动状态与动画时钟选当前帧，返回 { data, palette } 供 r.sprite 使用。
export function characterFrame(character, moving, clock) {
  const frames = moving ? character.run : character.idle;
  const fps = moving ? RUN_FPS : IDLE_FPS;
  const idx = Math.floor(Math.max(0, clock) * fps) % frames.length;
  return { data: frames[idx], palette: character.palette, character };
}

// 兼容旧接口：默认绘制孙悟空。
export function heroFrame(moving, clock) {
  return characterFrame(WUKONG, moving, clock);
}

// 绘制角色：cx = 中心 X，footY = 脚底应落在的 Y。
// 自动加 4 向描边让角色在彩色地图上更醒目。
export function drawCharacter(r, sp, cx, footY, scale = HERO_SCALE, opts = {}) {
  const { alpha = 1, flip = false, outline = '#0c0a12' } = opts;
  const character = sp.character || WUKONG;
  const w = character.w * scale;
  const x0 = Math.round(cx - w / 2);
  const y0 = Math.round(footY - character.feetRow * scale);
  if (outline) {
    const o = scale;
    for (const [ox, oy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) {
      r.sprite(sp, x0 + ox, y0 + oy, scale, { alpha, flipX: flip, colorOverride: outline });
    }
  }
  r.sprite(sp, x0, y0, scale, { alpha, flipX: flip });
}

// 兼容旧接口：默认绘制孙悟空。
export function drawHero(r, sp, cx, footY, scale = HERO_SCALE, opts = {}) {
  drawCharacter(r, sp, cx, footY, scale, opts);
}
