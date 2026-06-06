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

### 阶段7：视觉特效精修 [pending]
**前置**：✅ CP4 Boss 战 kafka 已验收
**输出**：
- [ ] 切换角色烟雾粒子
- [ ] 穿越火焰/岩石的克制特效
- [ ] 跑步动画（脚步抖动）
- [ ] 通关动画
**预计耗时**：1-2 小时（视时间）

### 阶段8：像素素材升级 [optional]
**目标**：如果时间充足，替换为真实像素风
**条件**：前面阶段提前完成

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
