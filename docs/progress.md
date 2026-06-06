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

---

## 会话 5 - 2026-06-06（CP4.5 障碍统一 + Boss 站位）

### kafka 三个小改动反馈
1. **障碍太碎**：火/石/飞石三种合并成"小妖怪"，悟空八戒都不能撞
2. **Boss 走太近**：希望两人关于画面对称（之前 Boss 走到 x=280 太贴脸）
3. **去掉感叹号**：'⚠ 铁扇公主拦路！' 的 ⚠ 太丑

### 我的设计追问
- "小妖怪要不要做地面跑+空中飘两种姿态？"
- kafka："保留地面跑和半空飘两种吧"

### 实现
**新增 monster 障碍**：
- 视觉：绿身（COLOR_MONSTER_BODY=0x3aa856）+ 浅绿肚皮 + 红眼黑瞳 + 象牙白獠牙
- 空中款额外加左右翅膀 + Y 上下浮动 tween（无限循环）
- 40% 概率空中（MONSTER_AIR_RATIO）

**Wukong/Bajie 克制重写**：
- Wukong.canPass：只对 fire_wall 返 true（删除 fire 免疫）
- Bajie.canPass：只对 boulder 返 true（删除 rock 免疫）
- 两者都不能撞 monster → 必须跳跃

**解锁时间精简**：monster=0s / fire_wall=8s / boulder=16s（30s 关卡，全部 16s 内出齐）

**Boss 站位对称**：
- 玩家 x=200（画面 20.8%）→ Boss 最终 x = 960-200 = **760**（画面 79.2%）
- 删除中间停顿（更干脆，1.4s 直接走到位）
- 删除 '⚠' 感叹号

### 文件改动（本会话）
- `config.js`：UNLOCK_* 重写、COLOR_MONSTER_* 新增、MONSTER_AIR_RATIO/HEIGHT 新增
- `sprites/Obstacle.js`：完全重写，删 createFire/Rock/FlyRock，新增 createMonster
- `managers/ObstacleManager.js`：getAvailableTypes 简化为三类
- `sprites/Wukong.js` + `sprites/Bajie.js`：canPass + useSkill 适配
- `scenes/GameScene.js`：obstacleName 表更新、八戒无敌碎障判定改 monster、Boss tween 简化、'⚠' 删除

### 状态
- ✅ 三个小改动完成（待 kafka 试玩）

---

## 会话 6 - 2026-06-06（CP5 Boss 战创新玩法 —— 核心转折）

### kafka 关键反馈（直接戳玩法核心）
> "1.你有没有发现一个问题，现在这个技能没有什么用呀，对不对。要不改成只有孙悟空用了技能才能通过火焰。只有猪八戒用了技能才能通过石头。但是这个逻辑恰当吗
>  2.我觉得最后的铁扇公主boss可以发的火球同时多一点快一点，这样玩起来是不是更爽"

### 我的方案对话（拒绝 + 提替代）
**问题 1（技能没用）**：我**拒绝了** kafka 提的"用技能才能过火墙"方案
- 硬伤：悟空 CD=10s，火墙每 ~3s 出一个 → CD 期必死
- 替代方案：A=Boss 战蓄能 / B=得分倍率 / C=原方案拒绝 / D=技能改攻击
- 推荐 A

**kafka 再次反馈（直接戳痛点）**：
> "1.现在铁扇公主没打几下就死了，也得优化一下
>  2.现在感觉还停留在传统打法啊，你能想到用技能做一些创新吗"

**我承认蓄能/倍率是数值改造不是玩法创新**，憋出 4 个新方案：
- A=画弧统一（推荐）/ B=技能种桩 / C=切换爆残影 / D=妖怪掉法宝

### kafka 自己拍板（比我所有方案都好）
> "这样吧，要不我们就在最后的boss战阶段引入技能吧，孙悟空的技能可以消灭一排小妖怪，猪八戒的技能可以保证一段时间内小妖怪不能靠近，小妖怪是一直刷新的，直到铁扇公主被击败。你觉得怎么样？前面的就完全只做成跑酷游戏。"

**这方案为什么好**（5 个一锅炖）：
1. 解决"技能形同虚设" → 技能变 Boss 战生存必需
2. 解决"Boss 太脆" → 玩家被妖怪分心，画弧时间少了
3. 解决"传统打法" → Boss 战变三线作战（画弧+切换+技能）
4. 跑酷专心做反应训练，Boss 战做策略战场，分工清晰
5. 角色切换从"过特定障碍"升级为"管理战场节奏"

### 4 个设计决策（kafka 一句"都可以"全过）
1. 跑酷保留切角色+火墙/巨石克制，删 J 键
2. 小妖怪接触 = 扣 1 容错（火球同算）
3. **kafka 特别强调**：玩家形态要跟跑酷一样（**不是小图标**），左下角站着
4. 技能 CD：悟空 5s 清屏 / 八戒 8s 护盾 2.5s

### 实现（核心 7 个改动）
1. **新增 `BossPlayer.js`**（170 行）：跟跑酷一样的橙方块/粉圆，能切角色+用技能
2. **新增 `BossMonster.js`**（110 行）：从右冲向玩家，护盾推开+变灰、画弧扫死、技能炸黑烟
3. **重写 `BossScene.js`**（490 行）：
   - 三路压力：火球散射 + 小妖怪冲刺 + Boss 血量
   - 画弧三重作用：扇飞火球 + 攻击 Boss + 扫死路径妖怪
   - 1/2 切角色，J 放技能，右下角双卡片+CD
   - 多发火球 `spawnFireballs()`：按 phase 决定 1/2/3 发，按 BOSS_FIREBALL_SPREAD 散开
4. **`GameScene.js`**：删 J 键 + 角色卡片改静态"免火墙/免巨石"+ 把 currentRole 传给 BossScene
5. **`config.js`** 大改：BOSS_HP 100→180、TIME_LIMIT 20s→25s、火球间隔暴砍 4000→2200 / 2500→1300 / 1500→700、speed 380→460、多发 2/3 发、容错 3→4、新增 BOSS_MONSTER_* + BOSS_WUKONG_SKILL_CD=5000 + BOSS_BAJIE_SKILL_CD=8000 + BOSS_BAJIE_SHIELD_DURATION=2500 + BOSS_BAJIE_SHIELD_RADIUS=70
6. **`index.html`**：加载 BossPlayer.js + BossMonster.js
7. **Tieshan 入场动画保持不变**（已经一次性 tween 兼容好了）

### 关键设计原则（本会话沉淀）
- **kafka 提的方案有硬伤要直说**，不要硬实现 → 损害体验最终还得返工
- **数值改造 ≠ 玩法创新** —— 玩家能一眼看出来。蓄能/倍率是改造，三路压力是创新
- **kafka 的设计直觉强** —— 我憋了 4 个方案不如他一句话搞定。多让他先想，我再补技术细节
- **玩家形态保持一致** —— 跑酷和 Boss 战不要换成两套视觉，肌肉记忆一脉相承

### 当前状态
- ✅ CP1 / CP2 / CP3 / CP3.5 / CP4 / CP4.5 / CP5 编码完成
- ⏳ CP5 等 kafka 试玩验收
- 等 kafka 反馈再做下一步（CP6 视觉精修 or 录视频）

### 项目当前文件结构
```
work/
├── docs/                          (6 个文档)
└── game/
    ├── dev_server.py             (60行, ThreadingHTTPServer, 8765 端口)
    ├── index.html                (49行, 引入 16 个 JS)
    ├── lib/phaser.min.js         (1.1MB)
    └── src/
        ├── main.js               (29行)
        ├── config.js             (~115行, 加 Boss 战创新参数)
        ├── scenes/
        │   ├── BootScene.js      (30行)
        │   ├── GameScene.js      (~440行, 删 J 键)
        │   ├── BossScene.js      (~490行, 完全重写)
        │   └── ResultScene.js    (165行)
        ├── sprites/
        │   ├── Player.js         (108行)
        │   ├── Wukong.js         (90行)
        │   ├── Bajie.js          (95行)
        │   ├── Obstacle.js       (~165行, monster 单一类)
        │   ├── Tieshan.js        (165行)
        │   ├── Fireball.js       (75行)
        │   ├── BossPlayer.js     (170行, 新)
        │   └── BossMonster.js    (110行, 新)
        ├── managers/
        │   └── ObstacleManager.js (~90行)
        └── utils/
            ├── GestureRecognizer.js (220行)
            └── DevLog.js         (35行)
```
**代码总量**：约 2700 行 JS（比 CP4 多约 650 行）

### 下一步
等 kafka 试玩 Boss 战创新版反馈：
- 三路压力是否扛得住（HP 180、时长 25s 够不够）
- 技能 CD 5s/8s 是否合理（暴怒期需求多）
- 小妖怪冲刺速度 180 px/s 是否合适
- 玩家位置 (110, HEIGHT-110) 是否合适（左下角）

---

## 会话 7 - 2026-06-06（CP5.5 体验打磨 —— UX/可读性/可点击）

### kafka 反馈（三批 + 一次追问，共 7 个点）

**批 1（交互 + 文案 + 视觉）**
1. 跑酷和 Boss 战切角色，**点角色卡片**也要能切（之前只能键盘 1/2）
2. 失败画面"取经失败"改成"**闯关失败**"（kafka 原话："简单地叫取经失败吧"我先误解了，二次确认拿到"换成闯关失败"）
3. 画面**很模糊**，字体也糊

**批 2（卡片文案 + 结算页布局）**
4. 卡片上"免火墙/免巨石"被 kafka 看成"**兔**火墙/兔巨石"了 → 改成"防"
5. 结算页"总分 xxxx"框和"再来一次/截图分享"按钮**重叠**

**批 3（提示字体）**
6. 顶部那行"空格=跳跃 | 1=悟空 2=八戒..."**字太小太灰**，要大字白字

### 修复实现

#### 修 1：卡片点击切角色（最高 ROI 改动）
两个场景的卡片都加 `setInteractive({useHandCursor:true})` + `pointerdown` 回调：
```js
this.wukongCard.on('pointerdown', (pointer, lx, ly, event) => {
    event.stopPropagation();   // 阻止冒泡到全局 pointerdown
    this.switchTo('wukong');
});
```
**关键细节**：必须 `event.stopPropagation()` —— 否则 GameScene 全局 `pointerdown` 会让玩家**同时跳跃**，BossScene 会**同时触发画弧手势**

#### 修 2：文案
- `ResultScene.renderLose` 标题 "取经失败" → **"闯关失败"**

#### 修 3：画面模糊（双根因）
**根因 A**：`index.html` 里 `canvas { image-rendering: pixelated }` —— 这是给像素风游戏用的，本项目不是像素风，反而让 Retina + FIT 缩放后字体糊成马赛克。**删掉两行**
**根因 B**：Phaser 默认按 1:1 渲染，Retina 屏（DPR=2）下物理像素只有逻辑像素的一半。`main.js` 加：
```js
resolution: window.devicePixelRatio || 1,
render: { antialias: true, pixelArt: false, roundPixels: false },
```

#### 修 4：卡片文案"免" → "防"
"免疫"在小字号下被看成"兔"。"防"更直白通俗。GameScene 两张卡片均改。

#### 修 5：结算页布局
- 按钮 y 从 `cy+150` → **`cy+210`**（多 60px 间距）
- 背景板从 `420` 高 → **`500` 高** 并下移 `cy+20`（防按钮溢出板外）
- 总分框底 cy+97 → 按钮顶 cy+185 → **88px 留白**，非常清爽

#### 修 6：操作提示字体
| 位置 | 字号 | 颜色 |
|---|---|---|
| GameScene 顶部 | 11px → **16px** | #666 灰 → **#FFF 白粗体** |
| BossScene 底部 | 12px → **15px** | #888 灰 → **#FFF 白粗体** |

### 修改的文件（本会话）
- `game/index.html`：删 `image-rendering: pixelated` 两行
- `game/src/main.js`：加 `resolution` + `render` 配置
- `game/src/scenes/GameScene.js`：卡片可点击 + 文案"免"→"防"+ 顶部提示加大变白
- `game/src/scenes/BossScene.js`：卡片可点击（带 stopPropagation 防误触画弧）+ 底部提示加大变白
- `game/src/scenes/ResultScene.js`：标题"取经失败"→"闯关失败"+ 按钮下移 60px + 背景板加高

### 当前状态
- ✅ CP1 / CP2 / CP3 / CP3.5 / CP4 / CP4.5 / CP5 全部 kafka 验收
- ⏳ CP5.5 体验打磨完成，等 kafka 强刷试一把
- 等 kafka 反馈：模糊修没修干净？卡片点击手感如何？布局/字体满意？

### 关键经验沉淀（会话 7）
1. **Retina + Phaser 模糊三连**：`resolution: devicePixelRatio` + 删 `image-rendering: pixelated` + `pixelArt: false`，这三个不是像素风游戏一定要全配齐
2. **InteractiveObject + 全局 pointerdown 共存时必须 stopPropagation**：否则点 UI 会顺带触发"跳跃/画弧"等全局动作
3. **小字号 + 模糊画面下，"免"会被看成"兔"**：UI 文字字号至少给 14+，并优先选直白单字（"防/挡"优于"免疫"）
4. **kafka 试玩反馈往往 1 句话踩 1-2 个体验坑**：要拆开逐条修，每条都给"根因 + 修法 + 文件"——便于日后回看
5. **Phaser 文字字号选择**：主信息 22-28px / 提示信息 14-16px / 装饰小注 11-12px。**避免**用 11px 又用 #666 灰色 —— 一定会被吐槽看不清


---

## 会话 8 - 2026-06-06（CP6 像素素材升级 —— 接入 hackathon-game 资源）

### kafka 决策路径
1. kafka 提："我想把我这个游戏接在 hackathon-game 这个项目上，比如一个传送口就传到我这个游戏"
2. 我先回答两个问题，**不动手**（按 CLAUDE.md 决策确认原则）：
   - 项目合并 3 条路（浏览器跳转 / iframe / 移植融合），推荐方案 A
   - 像素素材 3 种用法（背景 / 角色 / 全套）
3. kafka 决策："1.先换素材 2.项目合并先不管"
4. 我又提 3 个细节问题（复制还是软链 / 是否调整角色尺寸 / 跑酷远景是否也换火焰山）
5. kafka 全部明确："1.复制 2.保持现在像素 3.都换火焰山"

### 实现（10 分钟内完成）
**复制资源**：
- `hackathon-game/arts/孙悟空.png` → `game/assets/images/wukong.png` (1.1M, 1254×1254)
- `hackathon-game/arts/猪八戒.png` → `game/assets/images/bajie.png` (1.4M, 1254×1254)
- `hackathon-game/arts/火焰山.png` → `game/assets/images/huoyanshan.png` (3.1M, 1672×941)

**代码改动 7 个文件**：
| 文件 | 改动 |
|---|---|
| `BootScene.js` | `preload()` 加载 3 张 PNG，loadingText 移到 preload |
| `Wukong.js` | `createVisual()`：rectangle → image；hitbox 0.7×0.85 SIZE；装饰：单橙色光环替代 眼睛+金箍 |
| `Bajie.js` | `createVisual()`：circle → image；hitbox 0.75×0.85 SIZE；装饰：单粉色光环替代 双眼+耳朵；`useSkill()` 染金从 `fillColor=` 改 `setTint`，恢复用 `clearTint`+`setDisplaySize` |
| `Player.js` | `die()` 染灰兼容 image（setTint）和 rect/circle（fillColor）双形态 |
| `GameScene.js` | `drawMountains()`：5 个三角形山头 → 火焰山 image 铺满 + 25% 黑色暗化层 |
| `BossScene.js` | `drawBackdrop()`：火焰山 image + 40% 红色暗化层（决战氛围更红）+ 保留火星粒子和地面 |
| `BossPlayer.js` | `drawWukong/drawBajie`：rectangle/circle → image；保留头顶 label + 加单色光环 |

### 关键设计点
1. **像素图 + 单色光环**：抛弃了"眼睛/金箍/耳朵"的代码生成装饰（像素图自带这些细节），改用单一颜色光环标识"当前角色"。同时弥补两张像素图色调可能太接近、玩家分不清的风险
2. **hitbox 略小于贴图**：`size * 0.7~0.75 × 0.85` —— 像素图边缘有透明 padding，按贴图原尺寸做 hitbox 会很苛刻。略小让玩家"擦边过"也算过
3. **背景暗化层**：跑酷 25%、Boss 战 40%。让背景成"氛围"而不是"干扰"，玩家视觉焦点仍在角色和障碍
4. **决策 die() 兼容**：因为之前 fillColor 是 Rectangle/Circle 的属性，image 没有；现在改成 `if (setTint)` 双兼容，避免运行时报错

### 等 kafka 验收
强刷浏览器（Cmd+Shift+R）后看：
- 跑酷开局：背景是火焰山图、悟空是像素图、外面包橙色光环
- 切八戒：像素图变猪八戒、光环变粉色
- 进 Boss 战：火焰山背景更红更暗、玩家像素图在左下、铁扇公主在右

### 项目当前文件结构
```
work/game/
├── dev_server.py
├── index.html
├── lib/phaser.min.js
├── assets/
│   └── images/                              ⭐ 新（5.6MB 像素素材）
│       ├── wukong.png      (1.1M)
│       ├── bajie.png       (1.4M)
│       └── huoyanshan.png  (3.1M)
└── src/
    ├── ...（其他不变）
    └── scenes/BootScene.js  (改 preload)
```

### 关键经验沉淀（会话 8）
1. **kafka 决策路径示范**：我先问，他再答，我又问，他再答 —— 中间 0 重写。比"猜+做+返工"高效得多
2. **像素图替换形状的工程要点**：(a) fillColor 不能用 → setTint；(b) hitbox 要手动 setSize；(c) 装饰可以大幅简化（图本身有细节）；(d) 加"标识光环"弥补图色调相近的问题
3. **背景图覆盖代码图形 = 关键操作**：直接 `setDisplaySize(WIDTH, HEIGHT)` + `setDepth(-10)` 一行搞定。配暗化层 alpha 0.25-0.4 是"氛围"和"干扰"的分界线
4. **Image 的 scale 不是 1**：setDisplaySize 后 scale = 显示尺寸/原始尺寸（0.048）；后续 tween 缩放要用 `this.visual.scale * 1.2`（相对值），不能写死 1.2

---

## 会话 9 - 2026-06-06（CP6.5 白底清除 + 删光环）

### kafka 两个具体反馈
> "我想强调的一个事是现在这个png是有白底的，我要把白底去掉，你懂我意思吧，然后那个光圈也去掉吧，没有用。"

### 实现路径（约 15 分钟）
1. **看图确认问题**：Read wukong.png / bajie.png 两张图，确认大片白色背景需要变透明
2. **备份原图**：`cp wukong.png wukong.bak.png` + 八戒同理（万一处理失误能秒回滚）
3. **写 PIL 脚本** `/tmp/remove_white_bg.py`：
   - flood-fill BFS 从四个边角向内蔓延
   - 阈值 RGB > 235 算白色
   - 4 邻居蔓延，连通到边的白色像素 alpha=0
   - **关键**：角色身上的眼睛/装饰因为不与边角连通而完整保留（这就是为什么用 flood-fill 而不是简单的色域阈值替换）
4. **处理结果**：wukong 清除 68.6% 像素 / bajie 清除 70.4% 像素 → 干净透明背景
5. **删光环代码**（3 个文件）：
   - `Wukong.js`：删 `this.aura = ...` 那两行 + updateDecorations 改空函数
   - `Bajie.js`：同上
   - `BossPlayer.js`：drawWukong/drawBajie 删 aura graphics（保留头顶 label）

### 关键技术：flood-fill vs 简单阈值替换
- 简单阈值（"所有白色都变透明"）会误伤角色身上的眼睛/牙齿/衣领等浅色元素 → ❌
- flood-fill 从边角开始蔓延 → 只擦"连通到边"的白色 → 角色内部的浅色被完整保留 ✅
- 这是图像处理里的经典技巧，3 行 BFS 解决

### 修改的文件（本会话）
- `game/assets/images/wukong.png`（用 PIL 处理过的）
- `game/assets/images/bajie.png`（用 PIL 处理过的）
- 备份：`wukong.bak.png` / `bajie.bak.png`
- `game/src/sprites/Wukong.js`：删 aura graphics
- `game/src/sprites/Bajie.js`：删 aura graphics
- `game/src/sprites/BossPlayer.js`：drawWukong/drawBajie 删 aura

### 当前状态
- ✅ CP1 → CP6 全部 kafka 验收
- ✅ CP6.5 白底清除 + 删光环 完成
- ⏳ 等 kafka 强刷浏览器验收

### 关键经验沉淀（会话 9）
1. **kafka 反馈给具体指令时（不带方案），不需要再问**：直接执行 + 解释做了什么。"白底去掉" + "光圈去掉" 就是非常具体的两个动作
2. **图像处理用 PIL flood-fill 比简单阈值替换强 10 倍**：保护角色身上的浅色元素不被误伤
3. **必先备份再处理图像**：cp wukong.png wukong.bak.png —— 处理失误能秒回滚，1 秒成本，无穷收益
4. **会话 8 加的"光环"被会话 9 删了**：教训 —— 不要急着加"防御性的额外特征"。kafka 看到原素材就明白了，光环只是我自己的过度设计。**少即是多**

---