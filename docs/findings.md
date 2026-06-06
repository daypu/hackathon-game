# 研究与发现

## 赛事要求分析

### 成功案例特征
1. **叠方块游戏**
   - 简单机制：对齐越好得分越高
   - 难度递增：速度越来越快
   - 即时反馈：每次叠加立即看到结果

2. **老年痴呆体验器**
   - 创新角度：让人体验特殊感受
   - 情感共鸣：有教育意义

3. **肖申克2D游戏**
   - 故事沉浸：经典IP改编
   - 情节推进：跟随剧情体验

4. **陀螺仪迷宫**
   - 物理交互：利用手机硬件
   - 社交属性：公共场合会引起注意
   - 真实反馈：身体动作对应游戏

### 关键成功要素
- **有趣好玩**：机制简单但有挑战
- **反复可玩**：一局结束想再玩一局
- **社交属性**：能引起围观/传播
- **即时奖励**：小乐趣为主

## 西游记IP分析

### 经典桥段（可选用）
1. **三打白骨精** - 识破伪装，多次判断
2. **火焰山** - 躲避火焰，借芭蕉扇
3. **盘丝洞** - 躲避蛛网陷阱
4. **流沙河** - 水中闯关
5. **女儿国** - 特殊诱惑机制

### 角色特色
- 悟空：筋斗云、金箍棒
- 八戒：贪吃、偷懒
- 沙僧：挑担、老实
- 唐僧：诵经、慈悲

## 交互设计思路

### 方案对比
| 维度 | 单一跑酷 | 多样玩法 |
|------|---------|---------|
| 开发时间 | 短（6-8h） | 长（12-16h） |
| 学习成本 | 低 | 中等 |
| 趣味性 | 中等 | 高 |
| 可反复性 | 依赖难度曲线 | 依赖关卡设计 |
| 风险 | 低 | 高（可能做不完） |

## 初步建议
待填充...

---

## CP4 阶段技术发现

### Phaser Tweens 数组陷阱
- `tweens.add({ targets: array, x: '-=200' })` ✅ 合法（相对位移对每个元素生效）
- `tweens.add({ targets: array, x: { from: array, to: array } })` ❌ 不合法（from/to 必须是标量）
- `tweens.add({ targets: array, x: { from: scalar, to: scalar } })` ❌ **也不工作**（不报错，但 tween 静默失败 → 元素根本不动）
- 解决：每个元素独立 `tweens.add`，foreach 起多个 tween
- **教训**：踩过两次了（Tieshan.js 入场动画 + GameScene.spawnBoss），数组 targets 配 from/to 任何形式都不要用，直接每元素独立 tween

### Scene 时间戳的坑
- `scene.create()` 里 `this.time.now` 不是 0 起点，是 Phaser 全局 game time
- 在 create 里把 lastFireEventTime 设为 `this.time.now`，然后在 update 里比较 `time - lastFireEventTime` —— **首次 update 的 time 可能与 create 时记录的 this.time.now 差距极小，永远 < interval**
- 修法：初始化为 `0`，让首次 update 立即触发

### camera.fade 调试反模式
- 切场景前调用 `cameras.main.fade(500, ...)` 让画面渐暗
- 如果 `scene.start` 因为任何原因失败（脚本错误、scene 未注册等），玩家看到**变暗的旧场景**，误以为"切了但坏了"
- 调试期间应该用 `flash`（亮一下）或干脆不加过渡

### 浏览器 log 转发到终端
- `fetch('/log', { method: 'POST', keepalive: true })` keepalive 是关键 —— 即使页面 navigate 也能发出去
- Python `http.server.SimpleHTTPRequestHandler` 子类，只需 override `do_POST` + `do_OPTIONS`
- ANSI 颜色码 `\033[91m` 红 / `\033[93m` 黄 / `\033[96m` 青，配 `flush=True` 实时刷新

### 手势识别核心算法
- 弧度近似：中点到首末连线的距离 h、首末距离 c → `arcAngle ≈ 4 * atan(2h/c)`
- 防作弊：要求 ≥8 个采样点，过滤"瞬间点击"
- 连击窗口：相邻有效弧 < 600ms 算连击
- 速度 = 总路径长度 / 时长（px/ms），基准 1.5

### Python http.server 单线程死锁
- `HTTPServer` 默认单线程：一个 hung 的请求（特别是 `fetch keepalive` POST）会阻塞**整个 server**，端口仍在 LISTEN 但所有新请求 hang
- 症状：浏览器打不开 / curl 卡死 / `lsof -i :8000` 显示 python3 在 LISTEN
- 修复：换 `ThreadingHTTPServer`（Py3.7+ 自带），一行改动彻底解决
- 排查口诀：**"端口活但请求死" → 第一时间换 ThreadingHTTPServer**

### macOS VSCode 抢端口 8000
- VSCode 的某些扩展（Code Helper）会监听 8000
- `lsof -i :8000` 会看到两个 LISTEN（python3 + Code Helper）
- 杀 dev_server 后端口可能仍被占 → 用 `kill -9 $(lsof -ti :8000)` 一锅端

### 跑酷里"撞到 Boss"的坐标陷阱
- 跑酷里玩家位置**固定不变**（PLAYER_START_X=200），是世界在向左移动
- 如果让 Boss 停在屏幕右侧（如 x=810），玩家永远撞不到（差 600 像素）
- 正确做法：Boss 入场要走到**玩家附近**（如 PLAYER_START_X + 80 = 280）才能触发碰撞
- 体验优化：中间停一段（让玩家看见拦路），再继续逼近 → 既有戏剧感又能撞上
