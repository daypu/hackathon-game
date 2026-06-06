# 项目开发规则：西游 · 万象迷途

你正在维护一个基于 Canvas 2D 的像素风西游题材游戏原型。当前项目不是 Phaser / PixiJS 项目，不要引入新的游戏引擎，不要重写架构。

## 1. 开发前必须先读代码

在修改前，先阅读并理解以下文件：

- README.md
- package.json
- src/main.js
- src/config.js
- src/engine/Game.js
- src/engine/Input.js
- src/engine/Renderer.js
- src/scenes/MenuScene.js
- src/scenes/PlayScene.js
- src/scenes/ResultScene.js

如果某个文件结构与你预期不一致，不要凭空猜测，先说明你看到的实际结构，再调整方案。

## 2. 小步修改，不要大重构

本次任务只允许围绕“流沙河：木筏惊魂”小游戏做必要修改。

允许修改：
- src/engine/Input.js
- src/scenes/PlayScene.js
- 新增 src/scenes/RaftMiniGameScene.js
- README.md 可选更新操作说明

不要修改：
- 不要重写 Game.js
- 不要重写 Renderer.js
- 不要重写 MenuScene.js
- 不要重写 ResultScene.js
- 不要改动与本小游戏无关的实体、世界、评分系统
- 不要引入 Phaser、PixiJS、物理引擎或复杂依赖

## 3. 保持现有代码风格

沿用当前项目风格：
- ES Module 写法
- class Scene 结构
- enter / update / draw / exit 生命周期
- 使用 game.setScene(...) 切换场景
- 使用 game.shared 传递跨场景结果
- 使用 Renderer 的 rect / roundRect / circle / sprite / text / vgrad 等方法绘制
- 必要时可以直接使用 r.ctx 的 save / translate / rotate / restore 来画旋转木筏

不要为了“更现代”而引入无关抽象、复杂状态管理或大型配置系统。

## 4. 目标驱动

实现前先列出计划，计划必须包含：
- 要改哪些文件
- 每个文件改什么
- 如何从流沙河触发小游戏
- 如何返回主流程
- 如何判断成功 / 失败
- 如何验证功能

实现后必须自检：
- npm install 是否需要
- npm run dev 是否能启动
- 控制台是否有报错
- A/D 是否能控制木筏平衡
- Space 是否能安抚唐僧
- 1 是否能修木筏
- 2 是否能击退河怪
- 成功 / 失败面板是否出现
- 失败后是否能重试或返回

## 5. 不要静默失败

任何交互都必须有反馈：
- 修理冷却中：显示提示
- 木筏太晃无法修理：显示提示
- 没有河怪时按 2：显示空挥提示
- 唐僧安抚冷却中：显示提示
- 木筏快翻：明显警告
- 水浪预警：提前显示方向
- 河怪出现：显示方向和按键提示

## 6. 保留原有游戏体验

当前游戏是像素风、固定视角、单屏场景探索。新增小游戏也必须保持：
- Canvas 2D 像素风
- 960×540 单屏布局
- 中文 UI
- 与西游题材一致的文案
- 不破坏现有菜单、探索和结算流程

## 7. 先做 MVP

第一版只实现以下内容：
- A/D 控制木筏平衡
- 木筏倾斜角度
- 翻船失败
- 渡河进度
- 木筏耐久
- 唐僧惊慌
- Space 安抚唐僧
- 1 修理木筏
- 2 击退河怪
- 水浪随机事件
- 河怪随机事件
- 成功 / 失败面板
- 从流沙河触发小游戏
- 小游戏结束后返回主游戏

暂时不要做：
- 漩涡
- 沙僧 Boss
- 多种河怪
- 道具系统
- 角色站位移动
- 手机触控按钮
- 复杂动画资源
- 新音频资源

## 8. 每个改动都要能解释

每一处代码修改都必须能对应本次需求。

不要做：
- 顺手格式化全项目
- 顺手改命名
- 顺手优化旧逻辑
- 顺手重构无关文件
- 顺手添加复杂抽象

如果发现旧代码中有潜在问题，但与本任务无关，只在最后列为“后续建议”，不要直接修改。
