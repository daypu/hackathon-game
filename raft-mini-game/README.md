# 流沙河：破船惊魂（独立版）

一个可独立运行的 H5 Canvas 小游戏（Vite + 原生 Canvas 2D），打开后直接进入开始界面。

## 运行

```bash
npm install
npm run dev
```

然后打开终端输出的本地地址（通常是 `http://localhost:5173/`）。

## 素材（可选）

将美术素材放到 `public/assets/` 后，游戏会在开始界面自动预加载并在场景中使用；若某张图缺失或加载失败，会自动回退到占位绘制，游戏仍可运行。

建议目录：

```
public/assets/
  bg/bg_liusha_river_main.png
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

## 目标

撑过 30 秒，护送唐僧渡过流沙河，不让后方水怪追上破船。

## 操作

- `A/D` 或 `←/→`：交替划船（核心）
- `Space` / `Enter`：连点舀水（降低船舱进水）
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
