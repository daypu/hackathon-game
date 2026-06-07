# 流沙河：破船惊魂（raft-mini-game）

一个可独立运行的 H5 Canvas 小游戏（Vite + 原生 Canvas 2D）。

流程：
开始界面（标题页） → 任务简报（3 秒倒计时/Space 立即开始） → 正式游戏 → 成功/失败结算 → 重新挑战/返回开始界面

## 运行

在本目录执行：

```bash
npm install
npm run dev
```

打开终端输出的本地地址（端口可能是 5173/5174/517x）。

## 构建 / 预览

```bash
npm run build
npm run preview
```

## 素材

将美术素材放到 `public/assets/` 后，开始界面会自动预加载并在场景中使用；若某张图缺失或加载失败，会自动回退到占位绘制，游戏仍可运行。

建议目录（包含三张背景图）：

```
public/assets/
  bg/
    bg_liusha_river_main.png        # 正式游戏场景背景（playing）
    bg_title_liusha.png             # 开始界面 + 任务简报（title / intro）
    bg_result_success.png           # 成功结算页
    bg_result_fail.png              # 失败结算页
  boat/boat_broken_ferry.png
  characters/shaseng_idle.png
  characters/shaseng_action.png
  characters/tangseng_idle.png
  characters/tangseng_panic.png
  monster/monster_rear_river.png
  monster/monster_front_demon.png
  fx/wave_left.png
  fx/wave_right.png
```

背景使用与回退顺序（概念说明）：
- 开始界面：bgTitle → bgMain → 渐变 fallback
- 任务简报：bgTitle → bgMain → 渐变 fallback
- 成功结算：bgResultSuccess → bgTitle → bgMain → 渐变 fallback
- 失败结算：bgResultFail → bgTitle → bgMain → 渐变 fallback

## 目标

撑过 30 秒，护送唐僧渡过流沙河，不让后方水怪追上破船。

## 操作

- `A/D` 或 `←/→`：交替划船（核心）
- `Space` / `Enter`：舀水（降低船舱进水）
- `1/2`：顺序安抚唐僧（对话序列）
- `Q/E`：击退前方妖怪
- `P` / `Esc`：暂停

## 成功 / 失败

- 成功：撑过 30 秒
- 失败：
  - 后方水怪追上破船
  - 船舱进水过多，沉没
  - 唐僧惊慌过度

成功或失败后：
- `Space` / `Enter`：重新挑战
- `Esc`：返回开始界面

## 自查：确认你看到的是最新背景

启动 dev server 后，可以直接访问下面 URL 检查是否 200 且图片正确（把端口替换成你实际运行的端口）：

- `/assets/bg/bg_title_liusha.png`
- `/assets/bg/bg_result_success.png`
- `/assets/bg/bg_result_fail.png`
