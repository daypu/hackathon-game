# 抖音AI创变者计划 - 西游取经游戏开发

## 目标
24小时内开发一款基于西游记主题的2D游戏，满足：有趣、社交属性、即时奖励、可反复游玩

## 约束条件
- **时间**：24小时黑客松
- **技术**：最好离线可玩
- **核心**：小乐趣 > 复杂系统
- **社交**：玩法要能引起围观/讨论
- **目录约定**：`docs/` 放所有文档，`game/` 放所有代码和素材，根目录禁止散文件 ⚠️

## 当前状态
- ✅ 游戏基础设定已确定（2D移动+躲避+收集）
- ✅ 故事背景已确定（西游记万象迷途）
- ✅ 交互逻辑已确定（统一跑酷 + 角色切换 + 技能系统）
- ✅ 技术方案已确定（Phaser 3 + JavaScript）
- ✅ 美术方案已确定（先用代码生成图形，后期替换像素素材）

## 阶段规划

### 阶段1：交互设计确定 [complete]
**目标**：确定核心玩法和交互方式
**输出**：
- [x] 确定交互模式（统一跑酷 + 角色切换）
- [x] 确定故事闭环范围（火焰山单关卡，无尽模式）
- [x] 设计关卡结构（悟空+八戒双角色，技能系统）
- [x] 定义社交传播点（双手滑动切换角色，结算截图分享）
**实际耗时**：1.5小时

**关键决策**：
- 选择"一关做精"而非多关卡，降低风险
- 角色切换为核心创新点
- 先用代码生成图形，专注玩法

### 阶段2：技术方案设计 [complete]
**目标**：选定技术栈，设计架构
**输出**：
- [x] 选择开发框架：Phaser 3 + JavaScript
- [x] 设计代码架构：场景分离 + OOP + Manager模式
- [x] 评估离线可行性：Web本地运行，完全可行
**实际耗时**：0.5小时

**技术栈**：
- Phaser 3（轻量级Web游戏引擎）
- Vanilla JavaScript（无需构建工具）
- Arcade Physics（轻量物理引擎）

**架构设计**：
```
work/
├── docs/                  # 📚 所有文档统一放这里
│   ├── 开发文档.md
│   ├── task_plan.md
│   ├── findings.md
│   ├── progress.md
│   └── 想法.txt
└── game/                  # 🎮 所有代码和素材
    ├── index.html
    ├── lib/phaser.min.js
    ├── src/
    │   ├── main.js
    │   ├── config.js
    │   ├── scenes/        (GameScene, ResultScene...)
    │   ├── sprites/       (Player, Wukong, Bajie, Obstacle...)
    │   ├── managers/      (ObstacleManager, ScoreManager...)
    │   └── utils/
    └── assets/            (images, sounds)
```

**⚠️ 目录约定（强制）**：
- 所有 `.md` / `.txt` 文档 → `docs/`
- 所有游戏代码和素材 → `game/`
- 项目根目录只保留 `docs/` 和 `game/`，禁止散落文件

### 阶段3：项目搭建 [complete]
**目标**：创建项目结构，配置Phaser
**输出**：
- [x] 创建 `docs/` 和 `game/` 目录结构 ✅
- [x] 在 `game/` 下创建 src/scenes、src/sprites、src/managers、src/utils、lib、assets 等子目录 ✅
- [x] 下载 Phaser 3.70 到 `game/lib/phaser.min.js`（1.1MB）✅
- [x] 编写 `game/index.html`（引入Phaser + 所有源码）✅
- [x] 编写 `game/src/main.js`（游戏配置）✅
- [x] 编写 `game/src/config.js`（全局参数集中管理）✅
- [x] 实现 BootScene + GameScene 初版 ✅
**实际耗时**：约0.5小时
**验收**：✅ 浏览器看到带火焰山剪影、地面、角色的画面（CP1 通过）

### 阶段4：核心跑酷实现 [complete]
**目标**：实现基础可玩的跑酷
**输出**：
- [x] 地面和角色显示（代码生成图形）✅
- [x] 跳跃控制（空格 / ↑ / 点击）✅
- [x] 障碍物生成与移动 ✅
- [x] 手动 AABB 碰撞检测（碰到 Game Over）✅
- [x] 实时计分系统 ✅
- [x] 屏幕震动 + 重玩按钮 ✅
**实际耗时**：约0.5小时
**验收**：✅ 可玩跑酷，kafka 确认"逻辑都是对的"（CP2 通过）

### 阶段5：角色切换系统 [complete] ✅ kafka 已验收
**目标**：实现核心创新点
**输出**：所有角色/克制/技能 13 项均已完成（详见 progress.md）
**实际耗时**：CP3 编码约 30 分钟
**里程碑**：必须切换角色才能通关 → 已通过 kafka 试玩确认

### 阶段5.5：克制硬切修订 [complete] ✅
**触发**：kafka 反馈"所有障碍都能跳过去 → 切换形同虚设"
**输出**：
- [x] 火墙高度 280 → 460（顶天，跳不过去）✅
- [x] 巨石半径 50 → 80（贴地宽，跳不过去）✅
- [x] 删除"技能就绪才生成"判断（节奏更稳定）✅
- [x] 角色卡片下移到 y=495（贴底）✅
- [x] 操作提示挪到顶部、字号缩到 11px ✅
**实际耗时**：5 分钟

### 阶段6：Boss 战 + 结算页（CP4）[complete] ✅ kafka 已验收
**目标**：把"撑多久"变成"打通关"，加入画弧手势创新交互
**输出**：
- [x] 关卡时长压缩到 30s（原 120s）✅
- [x] 障碍解锁表压缩（fire/rock=0, fly_rock=5, fire_wall=10, boulder=18）✅
- [x] 25s 停止生成新障碍 + 30s 铁扇公主入场 ✅
- [x] GestureRecognizer：画弧检测（弧度+速度+连击）✅
- [x] Tieshan（铁扇公主）：紫红裙袍+三阶段血量+扇子 ✅
- [x] Fireball：火球生成+碰撞+被扇飞反击 ✅
- [x] BossScene：完整 Boss 战场景 ✅
- [x] ResultScene：结算页+S/A/B/C 评级+截图分享+LocalStorage 最高分 ✅
**关键创新**：**鼠标画弧扇风 + 火球扇飞反击**（抖音传播点）
**实际耗时**：编码约 60 分钟

### 阶段6.1：Boss 战 bug 修复 [complete] ✅
**触发**：kafka 反馈"画弧无效 + 没有火球 + Boss 不攻击"
**已修（CP4 修复总共 5 个连锁 bug）**：
- [x] BossScene.lastFireballTime 改 0 + firstFireballDelay=1500 ✅
- [x] Tieshan.takeDamage 数组 tween 改单独 tween ✅
- [x] Tieshan 入场动画改每元素独立 tween ✅
- [x] GameScene.enterBossFight 加防重入 + 删 fade ✅
- [x] **GameScene.spawnBoss 数组 tween 陷阱**（踩第 2 次）→ 每元素独立 tween ✅
- [x] **dev_server 单线程死锁**（HTTPServer → ThreadingHTTPServer）✅
- [x] **VSCode 抢端口 8000**（PORT 改 8765）✅
- [x] **跑酷玩家 x 固定 → bbox 撞不到 Boss**（删 bbox 检测，改 tween onComplete 触发）✅
- [x] **BossScene.startTime 用 this.time.now（踩 time.now 坑第 2 次）**→ 改首次 update 才赋值 ✅
- [x] 加诊断 log（[GameScene][BossScene][Gesture]）✅
**kafka 验收**：所有 bug 解决 ✅

### 阶段6.2：开发服务器 + 终端实时日志 [complete] ✅
**触发**：kafka "能在终端实时打印吗？"
**输出**：
- [x] dev_server.py：替代 python -m http.server，新增 POST /log endpoint ✅
- [x] src/utils/DevLog.js：浏览器 hook console.log/warn/error → fetch POST /log ✅
- [x] index.html 加载 DevLog.js（最先加载，确保后续 log 都被捕获）✅
**实际耗时**：5 分钟

### 阶段7：视觉特效精修 [pending] ⏸ 暂缓（CP5 优先级更高）
**前置**：✅ CP4 Boss 战 kafka 已验收
**输出**：
- [ ] 切换角色烟雾粒子
- [ ] 穿越火焰/岩石的克制特效
- [ ] 跑步动画（脚步抖动）
- [ ] 通关动画
**预计耗时**：1-2 小时（视时间）

### 阶段7.5：障碍统一为小妖怪 + Boss 站位对称 [complete] ✅
**触发**：kafka 反馈三点（火/石/飞石视觉太碎、Boss 走太近不对称、感叹号丑）
**输出**：
- [x] 删除 fire/rock/fly_rock 三类，统一为 `monster`（绿身红眼獠牙）✅
- [x] 小妖怪两种姿态：地面跑 + 半空飘（40% 概率空中款带翅膀+上下浮动 tween）✅
- [x] 两个角色都不能撞小妖怪（必须跳）✅
- [x] 火墙/巨石保留（克制玩法仍在）✅
- [x] 解锁时间精简：monster=0s、fire_wall=8s、boulder=16s ✅
- [x] Boss 站位对称：玩家 x=200，Boss 最终 x=760（关于画面中线 480 对称）✅
- [x] 删除 ⚠ 感叹号、删除中间停顿（走得更干脆）✅
**实际耗时**：约 20 分钟

### 阶段8：Boss 战创新玩法（技能 + 小妖怪刷新）[complete] ✅
**触发**：kafka 提两个问题
  1. "现在这个技能没有什么用呀" —— 跑酷里技能是省力按钮，不是必要按钮
  2. "现在感觉还停留在传统打法啊，能想到用技能做一些创新吗" —— 我提了 4 个方案
**kafka 拍板方案**：
> "最后的boss战阶段引入技能，孙悟空的技能可以消灭一排小妖怪，猪八戒的技能可以保证一段时间内小妖怪不能靠近，小妖怪一直刷新，直到铁扇公主被击败。前面的就完全只做成跑酷游戏。"
**4 个决策（kafka 全部说"都可以"）**：
  1. 跑酷保留切角色 + 火墙/巨石克制，但**删 J 键技能**
  2. 小妖怪接触玩家 = 扣 1 容错（和火球同算）
  3. 玩家在 Boss 战形态跟跑酷一样（橙方块/粉圆，**不是小图标**）—— kafka 特别强调
  4. 技能 CD：悟空 5s（清屏所有妖怪）/八戒 8s（护盾 2.5s 妖怪不能靠近）

**输出**：
- [x] 新增 `src/sprites/BossPlayer.js`（170 行）：Boss 战玩家形态，跟跑酷一致 ✅
- [x] 新增 `src/sprites/BossMonster.js`（110 行）：Boss 战小妖怪，从右冲向玩家 ✅
- [x] 重写 `src/scenes/BossScene.js`（490 行）：技能 + 小妖怪 + 多发火球散射 + 切角色 ✅
- [x] 跑酷 `GameScene.js`：删 J 键技能，卡片改静态"免火墙/免巨石"提示 ✅
- [x] `config.js` 加 Boss 战参数（Boss HP/时长加，火球密度+速度增，多发散射，妖怪间隔）✅
- [x] `index.html` 加载新两文件 ✅
- [x] 把当前角色 currentRole 从 GameScene 传给 BossScene（进战角色不变）✅

**Boss 战数值改造（数值平衡）**：
| 参数 | 旧 | 新 | 理由 |
|---|---|---|---|
| Boss HP | 100 | 180 | kafka 反馈太脆 |
| 倒计时 | 20s | 25s | 加血同步加时 |
| 火球间隔阶段1 | 4000ms | 2200ms | 更猛 |
| 火球间隔阶段2 | 2500ms | 1300ms | 更猛 |
| 火球间隔阶段3 | 1500ms | 700ms | 暴怒期 |
| 火球速度 | 380 | 460 | 更快 |
| 多发火球 | 1 | 阶段2=2 / 阶段3=3 | "同时多" |
| 容错 | 3 次 | 4 次 | 补偿小妖怪 |

**Boss 战核心循环（创新点）**：
鼠标画弧（攻击 Boss）⟷ 1/2 切换角色 ⟷ J 放技能 ⟷ 三路压力同时管理（小怪冲、火球散、Boss 血）

**实际耗时**：编码约 50 分钟

### 阶段8.5：CP5.5 体验打磨（UX/可读性/可点击）[complete] ✅
**触发**：kafka 试玩 CP5 后批量反馈 3 批 7 个问题
**输出**：
- [x] **可点击切角色**：跑酷+Boss战 两个场景的角色卡片均加 `setInteractive` + `pointerdown`（带 `event.stopPropagation()` 防误触跳跃/画弧）✅
- [x] **失败文案**：ResultScene 标题 "取经失败" → "闯关失败" ✅
- [x] **画面模糊修复**（双根因）：
  - index.html 删 `image-rendering: pixelated` 两行 ✅
  - main.js 加 `resolution: window.devicePixelRatio` + `render: {antialias: true, pixelArt: false, roundPixels: false}` ✅
- [x] **卡片文案**："免火墙/免巨石" → "防火墙/防巨石"（"免"小字号下被看成"兔"）✅
- [x] **结算页布局**：按钮 cy+150 → cy+210（多 60px 间距），背景板 420 → 500 高 ✅
- [x] **操作提示字体**：GameScene 顶部 11px 灰 → 16px 白粗体；BossScene 底部 12px 灰 → 15px 白粗体 ✅
**实际耗时**：约 25 分钟
**沉淀**：findings.md 加 CP5.5 章节（Retina 模糊三连 / Phaser Interactive 误触陷阱 / 小字号灰色 = 一定看不清 / 结算页留白经验）

### 阶段9：像素素材升级 [complete] ✅
**触发**：kafka 决定把 hackathon-game 项目的像素素材搬到本项目（背景 + 角色）
**输出**：
- [x] 复制 3 张 PNG 到 `game/assets/images/`（wukong.png 1.1M / bajie.png 1.4M / huoyanshan.png 3.1M）✅
- [x] `BootScene.preload()` 加载 3 张 PNG ✅
- [x] `Wukong.js` createVisual 改 image，hitbox = size * 0.7 × 0.85（略宽容）+ 橙色光环标识 ✅
- [x] `Bajie.js` createVisual 改 image，hitbox = size * 0.75 × 0.85 + 粉色光环标识 ✅
- [x] `Bajie.useSkill` 的 `fillColor=金` 改 `setTint`，恢复用 `clearTint` ✅
- [x] `Player.die()` 兼容 image（setTint）和 rectangle/circle（fillColor）✅
- [x] `GameScene.drawMountains` 替换为火焰山.png 背景 + 25% 暗化层（不挡角色）✅
- [x] `BossScene.drawBackdrop` 替换为火焰山.png 背景 + 40% 暗化层（决战氛围）✅
- [x] `BossPlayer.drawWukong/drawBajie` 改 image，保留头顶 label + 光环 ✅
**决策**：保持像素 60/65 不变；跑酷+Boss战都用火焰山背景（kafka 拍板"都换"）
**实际耗时**：约 25 分钟

### 阶段9.5：像素图白底清除 + 删除光环 [complete] ✅
**触发**：kafka 反馈"这个png是有白底的，我要把白底去掉。然后那个光圈也去掉吧，没有用。"
**实现**：
- [x] 备份原图：wukong.bak.png / bajie.bak.png ✅
- [x] 写 `/tmp/remove_white_bg.py`：用 PIL flood-fill 从四个边角向内蔓延，alpha 设为 0（只擦连通到边的白色，不误伤角色身上眼睛/装饰）✅
- [x] 处理：wukong.png 清除 68.6% 像素 / bajie.png 清除 70.4% 像素 ✅
- [x] `Wukong.js` 删 aura graphics + updateDecorations 改空函数 ✅
- [x] `Bajie.js` 删 aura graphics + updateDecorations 改空函数 ✅
- [x] `BossPlayer.js` drawWukong/drawBajie 删 aura graphics（保留头顶 label）✅
**关键技术**：flood-fill BFS + RGB 阈值 235（保守，避免误伤）
**实际耗时**：约 15 分钟

## 核心决策记录
1. **交互模式**：✅ 统一跑酷 + 角色切换（平衡创新与可行性）
2. **故事范围**：✅ 火焰山单关卡，无尽模式（专注打磨一关）
3. **技术栈**：✅ Phaser 3 + JavaScript（Web直接运行，适合Demo）
4. **社交点**：✅ 双手滑动切换角色 + 结算截图分享
5. **美术方案**：✅ 先用代码生成，后期可换像素素材（降低风险）

## 玩法设计细节
### 角色设定
- **悟空**：橙色方块，技能-金箍棒（清除所有障碍，CD 10秒）
- **八戒**：紫色圆形，特性-体积大（吸收范围更广，但更容易碰到障碍）

### 障碍物类型
- 火焰（地面）：红色三角形
- 飞石（空中）：灰色圆形
- 火墙（全屏）：需要用技能破解

### 难度曲线
- 每30秒速度+10%
- 生成间隔从2秒逐渐缩短到0.8秒
- 火墙出现频率随时间增加

## 风险与缓解
| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 时间不足 | 高 | 优先核心玩法，砍掉次要功能 |
| 技术选型失误 | 高 | 选择团队熟悉的技术栈 |
| 玩法不够有趣 | 高 | 快速原型验证，早期测试 |
| 美术资源不足 | 中 | 使用简化风格或免费素材 |

## 遇到的错误
| 错误 | 尝试次数 | 解决方案 |
|------|---------|---------|
| Write 工具参数为空导致 InputValidationError | 2 | 重新调用并提供完整参数 |
| 障碍物生成后原地不动（CP2）| 1 | `physics.add.group()` 默认 classType=Sprite，会重置 Rectangle 的 body 并清零速度。改用普通 group + 手动挂载 body，碰撞改为手动 AABB 检测 |
| 设计硬伤：所有障碍都能跳过（CP3 后 kafka 发现）| 1 | 火墙顶天 460、巨石贴地 r=80，物理上跳不过 → 必须切角色 |
| Boss 战画弧/火球/攻击全部无效（CP4 kafka 试玩）| 修复完成 ✅ | 3 个根因并发：(1) lastFireballTime=this.time.now 在 create 阶段不准；(2) Tieshan.takeDamage 用了非法 `x:{from:array,to:array}` tween 写法，首次受伤就抛错；(3) Tieshan 入场动画 `x:'-=200'` 对数组 targets 不稳。修：lastFireballTime=0+延迟首发、每个元素独立 tween、enterBossFight 加防重入 |
| 浏览器 log 看不到（控制台不熟悉）| 1 | 写 dev_server.py 接收 /log POST + DevLog.js hook console → 终端实时彩色打印 |
| localhost:8000 浏览器打不开（dev_server 卡死）| 2 | 真凶 #1：`HTTPServer` 是单线程的，浏览器 keepalive POST 阻塞整个 server。换 `ThreadingHTTPServer`。真凶 #2：VSCode 的 Node 插件常驻 `127.0.0.1:8000`，与 dev_server 的 `*:8000` 冲突，浏览器优先连 VSCode。改端口 8000→8765 一锅端解决 |
| GameScene.spawnBoss 铁扇公主原地不动（数组 tween 陷阱踩第 2 次）| 1 | 数组 targets + `x:{from,to}` 静默失败。改每个 decoration 独立 tween。findings.md 标红"踩 2 次" |
| 跑酷里玩家 x 固定，Boss 入场到屏幕中间永远撞不上（差 600 像素）| 1 | 跑酷里世界向左移动，玩家位置不变。删 bbox 碰撞检测，改 tween onComplete 自动触发 enterBossFight。Boss 入场三段式：屏幕外→中间停 0.4s→走到玩家前 280px→对峙 0.5s→自动进 Boss 战 |
| 进 BossScene 一秒就显示"时间不够"（time.now 坑踩第 2 次）| 1 | `this.time.now` 在 scene.create() 不是 0 起点，跑酷玩了 30s 已经 30000+ms。startTime 改在第一次 update(time) 里赋值 time，确保与 update 的 time 完全同步。getTimeLeft() 在初始化期间返回满血时间避免假阳性 |
| 跑酷里技能形同虚设（kafka 反馈）| 设计决策 | kafka 自己想出方案：跑酷只跑酷，技能改到 Boss 战。悟空清屏、八戒护盾。我先推了"画弧统一"方案 kafka 不感冒，他自己提的方案更优 — 把"技能没用"和"Boss 太脆"两个问题一锅炖了 |
| 用户提"用过技能才能过火墙"方案（CD 期必死）| 设计拒绝 | 必须拒绝并解释清楚：CD=10s，火墙每 ~3s 出一个 → CD 期必死。绕开切换玩法 = 自废武功。教训：用户提方案有硬伤要直说，不要硬实现 |
| Retina 屏画面全糊 / 字体马赛克化（CP5 试玩 kafka 反馈）| 1 | 双根因：(1) index.html `image-rendering: pixelated` 是给像素风用的，本项目非像素风，反而让 FIT 缩放后字体糊；(2) Phaser 默认 1:1 渲染，DPR=2 的 Retina 屏物理像素只有逻辑像素一半。删 pixelated + main.js 加 `resolution: window.devicePixelRatio` + `render: {pixelArt: false}` 三连修 |
| 卡片"免"字被看成"兔"字（kafka 反馈）| 1 | 字号 11px + 画面模糊 → "免疫"的"免"被错认。直接换"防"更直白通俗。教训：UI 文字 14px 起步，优先选简单单字 |
| 卡片可点击切角色（kafka 反馈：只能键盘切）| 1 | `setInteractive({useHandCursor:true})` + `pointerdown` 回调。**关键**：回调里 `event.stopPropagation()` 阻断冒泡到全局 pointerdown（否则点 UI 会同时跳跃/触发画弧手势）|
| 结算页"总分 xxxx"框和按钮重叠（kafka 反馈）| 1 | 旧 cy+72 框底（cy+97）→ cy+125 按钮顶，只剩 28px。按钮挪 cy+150→cy+210，背景板高 420→500，间距给到 88px |
| 像素图带白底（kafka 反馈：要去白底 + 去光圈）| 1 | PIL flood-fill 从边角向内蔓延，连通的白色像素 alpha=0。阈值 235 + 4 邻居 BFS。角色身上的眼睛/装饰因为不与边角连通而保留。Wukong/Bajie/BossPlayer 三个文件删 aura graphics 即可 |
