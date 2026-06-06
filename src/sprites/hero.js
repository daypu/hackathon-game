// 孙悟空（月色像素）动画渲染辅助。
// 数据来自自动生成的 ./wukong.js；本文件是手写逻辑层。
import { WUKONG } from './wukong.js';

export { WUKONG };

export const HERO_SCALE = 2;          // 每个精灵像素 = 2 屏幕像素
export const HERO_GROUND_OFFSET = 16; // 脚底相对玩家 y 的下移量（与碰撞/影子对齐）

const RUN_FPS = 11;   // 奔跑动画速度
const IDLE_FPS = 2.4; // 站立呼吸速度

// 依据移动状态与动画时钟选当前帧，返回 { data, palette } 供 r.sprite 使用。
export function heroFrame(moving, clock) {
  const frames = moving ? WUKONG.run : WUKONG.idle;
  const fps = moving ? RUN_FPS : IDLE_FPS;
  const idx = Math.floor(Math.max(0, clock) * fps) % frames.length;
  return { data: frames[idx], palette: WUKONG.palette };
}

// 绘制孙悟空：cx = 中心 X，footY = 脚底应落在的 Y。
// 自动加 4 向描边让角色在彩色地图上更醒目。
export function drawHero(r, sp, cx, footY, scale = HERO_SCALE, opts = {}) {
  const { alpha = 1, flip = false, outline = '#0c0a12' } = opts;
  const w = WUKONG.w * scale;
  const x0 = Math.round(cx - w / 2);
  const y0 = Math.round(footY - WUKONG.feetRow * scale);
  if (outline) {
    const o = scale;
    for (const [ox, oy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) {
      r.sprite(sp, x0 + ox, y0 + oy, scale, { alpha, flipX: flip, colorOverride: outline });
    }
  }
  r.sprite(sp, x0, y0, scale, { alpha, flipX: flip });
}
