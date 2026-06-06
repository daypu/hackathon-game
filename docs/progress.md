# 进度日志

## 会话 1 - 2026-06-06

### 启动规划系统
- 读取想法文档
- 创建规划文件
- 开始交互设计阶段

### 已完成
- ✅ 阶段1：交互设计（统一跑酷 + 角色切换 + 克制系统）
- ✅ 阶段2：技术方案（Phaser 3 + JavaScript）
- ✅ 生成完整开发文档（`docs/开发文档.md`）
- ✅ 确立目录约定：`docs/` 放文档，`game/` 放代码
- ✅ 整理项目目录：所有文档移入 `docs/`

### 关键决策
1. **角色克制玩法**（kafka 提出）：不同障碍只能由对应角色处理，增加策略性
   - 悟空免疫火焰、克制火墙
   - 八戒免疫岩石、克制巨石
2. **目录强制规范**（kafka 提出）：所有文档统一进 `docs/`，避免根目录散乱

---

## 会话 2 - 2026-06-06

### 执行阶段 3 / 4 / 5（CP1 → CP2 → CP3）
- 按预定验收节奏（5个 CP，逐级 kafka 试玩验收）
- 用 Python 本地 HTTP 服务器在 8000 端口测试

### CP1：项目搭建（阶段3）✅ kafka 已通过
- 下载 Phaser 3.70 到 `game/lib/phaser.min.js`（1.1MB）
- 完整目录结构 + index.html + main.js + config.js + BootScene + GameScene 初版
- 验收画面：火焰山剪影 + 沙黄色地面 + 橙色悟空 + 顶部标题

### CP2：核心跑酷（阶段4）✅ kafka 已通过 ("逻辑都是对的")
- 跳跃（空格 / ↑ / 点击）、障碍生成、AABB 碰撞、计分
- **遇到 bug**：障碍物原地不动
  - **根因**：`physics.add.group()` 默认 classType=Sprite，add Rectangle 时重新初始化 body，清空了 velocity
  - **修复**：改用普通 group + 手动挂 physics body；碰撞改为手动 AABB 检测（getBounds() + RectangleToRectangle）

### CP3：角色切换 + 克制系统（阶段5）⏳ 已交付待 kafka 验收
- **新增 5 个文件**：Player（基类，组合模式）/ Wukong / Bajie / Obstacle / ObstacleManager
- **2 个角色**：悟空（橙方块，免火焰怕岩石）+ 八戒（粉紫圆，免岩石怕火焰）
- **5 种障碍**：火焰 / 岩石 / 飞石 / 火墙 / 巨石，按时间解锁
- **技能**：
  - 悟空 J 键 → 金箍棒横扫（清屏火焰类，CD 10s，金色光带 + 屏幕闪光）
  - 八戒 J 键 → 变胖冲撞（3 秒无敌，CD 12s，变金 + 缩放震荡）
- **完整 UI**：顶部角色名 / 底部双角色卡片 + 黄色高亮边框 / 实时技能 CD / 死亡原因提示
- **难度递增**：速度 320 → 520 随 120s 线性，间隔最多缩短 40%
- **巧妙设计**：火墙/巨石只在对应技能就绪时才生成，避免必死局

### 关键决策
1. **组合模式代替继承 Phaser 对象**：Player 不 extends Rectangle/Circle，而是内部持有 visual + body。绕开 Phaser 继承的多个坑
2. **手动 AABB 碰撞**：因为 obstacle 不在 physics group 里（避免 body 被重置），改用 getBounds() 检测，更可控
3. **技能就绪才出必杀障碍**：体验更友好

### 当前状态
- CP1 ✅ / CP2 ✅ / CP3 ⏳ 等 kafka 试玩
- 剩余：CP4（视觉特效）/ CP5（结算 + 截图分享）

### 下一步
- kafka 试玩 CP3，确认切换 / 克制 / 技能正常
- 通过 → 进 CP4（粒子特效、屏幕震动、连击系统、穿火反馈）
- 出 bug → 立刻定位修复（已知小风险点：角色切换时 body.enable 的时机）

### 项目当前文件结构
```
work/
├── docs/                          (5 个文档全在)
│   ├── 开发文档.md / task_plan.md
│   ├── findings.md / progress.md / 想法.txt
└── game/                          (完整可玩 Demo)
    ├── index.html                 (引入9个JS文件)
    ├── lib/phaser.min.js          (1.1MB Phaser 3.70)
    └── src/
        ├── main.js                (29行)
        ├── config.js              (69行, 全部参数集中)
        ├── scenes/
        │   ├── BootScene.js       (30行)
        │   └── GameScene.js       (386行, 核心场景)
        ├── sprites/
        │   ├── Player.js          (108行, 基类)
        │   ├── Wukong.js          (90行)
        │   ├── Bajie.js           (97行)
        │   └── Obstacle.js        (154行, 5种障碍)
        └── managers/
            └── ObstacleManager.js (97行)
    └── assets/                    (空, CP6 可选)
```
**代码总量**：约 1060 行 JS + 42 行 HTML

---

## 会话 3 - 2026-06-06（CP3 验收 → CP4 Boss 战）

### kafka CP3 验收反馈（关键设计修订）
1. **角色卡片下移** → 已改 y: 460 → 495（贴底）
2. **设计硬伤**：所有障碍都能用跳跃躲，切换形同虚设
   - 修：火墙顶天 (h=460)，巨石贴地宽 (r=80)，物理上跳不过 → **必须切角色**
   - 删除"技能就绪才生成"逻辑（节奏更稳定）
   - 保留 fire/rock 为"可跳可穿"普通障碍（kafka 要求）
3. **关卡时长 120s → 30s**（kafka 觉得太长）
   - 障碍解锁压缩：fire/rock=0s, fly_rock=5s, fire_wall=10s, boulder=18s
   - 25s 停止生成，30s 触发 Boss

### kafka 新创意：Boss 战 + 画弧手势
- 跑酷不够新颖 → 加铁扇公主 Boss 战收尾
- **核心创新**：鼠标画弧 = 扇芭蕉扇 = 攻击 Boss
- 画弧速度 / 弧度 / 连击 → 三重伤害放大
- 火球可被画弧路径**扇飞回 Boss**（双重作用，爽感拉满）
- **文案纠正**：通关火焰山 ≠ 取经成功，只是西游第一难

### CP4 编码交付（新增 6 个文件）
| 文件 | 行数 | 用途 |
|---|---|---|
| `src/utils/GestureRecognizer.js` | 170 | 画弧检测器（弧度+速度+连击+扇飞） |
| `src/sprites/Tieshan.js` | 165 | 铁扇公主（紫红裙袍+三阶段血量+扇子） |
| `src/sprites/Fireball.js` | 75 | 火球（生成/碰撞/被扇飞反向） |
| `src/scenes/BossScene.js` | 340 | Boss 战完整场景 |
| `src/scenes/ResultScene.js` | 165 | 结算页+S/A/B/C 评级+截图+最高分 |
| `src/utils/DevLog.js` | 35 | 浏览器 log → 终端转发（dev_server 配套） |
| `dev_server.py` | 60 | 替代 http.server，接收 /log POST 实时彩色打印 |

### kafka 试玩反馈（CP4 首版 bug）
> "鼠标左键滑动没有效果，只有人物跳起来的效果。boss战也没有火球。boss战中铁扇公主也没有攻击我。"

→ 三个症状一个根因猜测：**Boss 场景根本没切过去**，画面停在 GameScene 但变暗了

### Bug 排查与修复（3 个并发问题）
1. **`lastFireballTime = this.time.now` 在 create 时不准** → 改 0 + 引入 `firstFireballDelay=1500ms`
2. **`Tieshan.takeDamage` 用了非法 `x: {from: array, to: array}` tween** → 每个 decoration 独立 tween
3. **GameScene.enterBossFight 的 fade(500, 30, 5, 5)** 让玩家以为没切场景 → 删 fade，加 `bossEntering` 防重入
4. 加诊断 log：`[GameScene]` / `[BossScene]` / `[Gesture]` 三组

### 终端实时日志系统（kafka 不熟悉浏览器 console）
- 写了 `dev_server.py`：HTTP server + POST /log endpoint，彩色输出到 stdout
- 写了 `DevLog.js`：hook `console.log/warn/error` + 捕获 `window.onerror` / `unhandledrejection`
- index.html 最先加载 DevLog.js，确保所有后续 log 都能转发
- 在 background 起好了 dev_server（task: bn62og38a）

### 当前状态
- ✅ CP1 项目搭建
- ✅ CP2 核心跑酷
- ✅ CP3 角色切换+克制
- ✅ CP3.5 硬切修订（kafka 验收通过）
- ⚠️ CP4 Boss 战代码完整，bug 修复待 kafka 验收
- ✅ 终端日志系统就绪

### 项目当前文件结构
```
work/
├── docs/                          (5 个文档)
└── game/
    ├── dev_server.py             (60行, 替代 http.server)
    ├── index.html                (47行, 引入 14 个 JS)
    ├── lib/phaser.min.js         (1.1MB Phaser 3.70)
    └── src/
        ├── main.js               (29行)
        ├── config.js             (95行, 加入 Boss/手势参数)
        ├── scenes/
        │   ├── BootScene.js      (30行)
        │   ├── GameScene.js      (380行, 加 Boss 入场)
        │   ├── BossScene.js      (340行, 新)
        │   └── ResultScene.js    (165行, 新)
        ├── sprites/
        │   ├── Player.js         (108行)
        │   ├── Wukong.js         (90行)
        │   ├── Bajie.js          (97行)
        │   ├── Obstacle.js       (154行)
        │   ├── Tieshan.js        (165行, 新)
        │   └── Fireball.js       (75行, 新)
        ├── managers/
        │   └── ObstacleManager.js (102行)
        └── utils/
            ├── GestureRecognizer.js (170行, 新)
            └── DevLog.js         (35行, 新)
```
**代码总量**：约 2050 行 JS + 47 行 HTML + 60 行 Python（约翻倍）

### 下一步
- kafka 强刷浏览器试玩 → 观察终端实时日志
- 如果 bug 仍存在，根据 log 精确定位
- 全部通过 → 进 CP5（视觉精修：粒子/烟雾/通关动画）

### 关键经验沉淀
1. **Phaser tween 不支持 `x: {from: array, to: array}`** —— 数组 targets 配标量 from/to 才行，要做"每个元素独立终点"必须 forEach 起多个 tween
2. **`this.time.now` 在 scene.create() 里不一定是 0 起点** —— 用 `0` 初始化时间戳，让首次比较立即满足
3. **camera.fade 在切场景时会误导调试** —— 看起来像没切，其实切了但画面黑了
4. **浏览器 → 终端的桥**：fetch keepalive POST + Python BaseHTTPRequestHandler，30 行搞定

---

## 会话 4 - 2026-06-06（CP4 Bug 修复马拉松 → kafka 全验收 ✅）

### 背景
kafka 强刷浏览器试玩 CP4 Boss 战，触发**一连串连锁 bug**，本会话全部解决。

### 修复的 5 个连锁 bug（按发现顺序）

#### Bug #1：localhost:8000 浏览器打不开 / curl hang
- **症状**：端口 8000 在 LISTEN，但 curl 3s 超时
- **真凶 A**：`http.server.HTTPServer` 是**单线程**的，一个 hung 的 `fetch keepalive` POST 阻塞整个 server
- **真凶 B**：VSCode 的 Node 插件常驻 `127.0.0.1:8000`，与 dev_server 的 `*:8000` 冲突，浏览器优先连 VSCode（→ 永远没响应）
- **修复**：
  1. `HTTPServer` → `ThreadingHTTPServer`（一行）
  2. PORT 8000 → **8765**（避开 VSCode）
- **教训**：端口在 LISTEN 但 curl hang → 第一时间换 ThreadingHTTPServer

#### Bug #2：铁扇公主入场不动（Tween 数组陷阱踩第 2 次）
- **症状**：30s 后 Boss 应该出场，但屏幕空空
- **真凶**：`tweens.add({ targets: [body, head], x: {from: WIDTH+80, to: bossEnterX} })` —— 数组 targets 配 from/to 标量**静默失败**（不报错也不动）
- **修复**：每个 decoration 独立 `tweens.add`
- **教训**：findings.md 标红"踩 2 次"——以后写 Phaser 先翻 findings

#### Bug #3：玩家撞不到 Boss
- **症状**：Boss 走到位置停下，但 BossScene 永不触发
- **真凶**：**跑酷里玩家 x 固定在 200**（是世界向左移动，玩家原地跑），Boss 停在 x=810，bbox 永远差 600 像素
- **kafka 决策**：两人走到画面中间直接进入战斗
- **修复**：删 bbox 碰撞检测，改 tween onComplete 自动触发。Boss 入场三段式：
  1. 屏幕外 → 中间 x=624（1.0s，"拦路"亮相）
  2. 停 0.4s（戏剧停顿）
  3. → 玩家前 x=280（1.2s）
  4. 对峙 0.5s → 自动进 BossScene

#### Bug #4：进 BossScene 一秒就显示"时间不够"（time.now 坑踩第 2 次）
- **症状**：BossScene 加载完立刻 lose("时间不够")
- **真凶**：`this.time.now` 是 Phaser **全局时间**（游戏启动起算），跑酷玩了 30s 后已经 30000+ms。在 create 里 `startTime = this.time.now` 跟 update 里的 `time` 参数不同步，导致首次 `elapsed > BOSS_TIME_LIMIT(20000)` → 直接判定超时
- **修复**：`startTime = -1` 标记未初始化，第一次 `update(time, delta)` 触发时 `startTime = time`，与 update 时间戳完全同步。`getTimeLeft()` 初始化期间返回满血时间避免假阳性
- **教训**：scene 时间戳要么从 0 起，要么必须用 update 的 time 参数。**findings.md 已记录此坑，但我又踩了一次** → 加重警示

### kafka 验收 ✅
> "现在已经解决bug了！真厉害！"

完整链路打通：
1. 跑酷 30s → 铁扇公主从右走到中间 → 继续逼近玩家 → 对峙 → 自动进战
2. BossScene 倒计时 20s 正常
3. 鼠标画弧 → 金色光带 + 伤害数字
4. 火球扔向玩家 + 画弧可扇飞反击
5. 结算页 S/A/B/C 评级 + 截图

### 修改的文件（本会话）
- `game/dev_server.py`：`HTTPServer → ThreadingHTTPServer` + PORT 8000→8765
- `game/src/scenes/GameScene.js`：spawnBoss 数组 tween 拆分 + tween onComplete 触发 enterBossFight + 删 bbox 检测
- `game/src/scenes/BossScene.js`：startTime = -1 + 首次 update 赋值 + getTimeLeft 初始化保护 + 诊断 log
- `docs/findings.md`：新增 4 条（Tween 数组踩 2 次、http.server 单线程、VSCode 抢端口、跑酷玩家固定 x）

### 当前状态
- ✅ CP1 / CP2 / CP3 / CP3.5 / CP4 全通过 kafka 验收
- ⏳ CP5（视觉精修）/ CP6（像素素材）/ 录演示视频 / 校准数值 → 等 kafka 决定优先级

### 下一步
按 CLAUDE.md "极度结果导向"原则，列出 4 个候选方向让 kafka 选：
1. CP5 视觉精修（粒子/烟雾/克制特效）—— 让 demo 更抓眼
2. 完整通关 1-2 把校准手感（数值调整）
3. 现在录演示视频（黑客松提交在即）
4. 修玩起来觉得别扭的小问题

### 关键经验沉淀（会话 4）
1. **VSCode 在 macOS 上会抢 8000 端口** —— dev server 必须用冷门端口（8765/3001 之类）
2. **跑酷"玩家不动 ≠ 玩家在跑"** —— 任何依赖玩家位置的碰撞都要先想清楚玩家实际坐标
3. **`this.time.now` 在 scene.create() 跨场景切换时不可靠** —— **强制规范**：scene 时间戳一律在第一次 update 里赋值
4. **同样的坑会重复踩** —— Tween 数组陷阱 + time.now 坑都是踩第 2 次。**findings.md 必须先翻**
5. **bug 是 5 层洋葱** —— 每修一层才能看到下一层。耐心、log 驱动、一个一个剥

