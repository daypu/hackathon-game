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
- **CP4.5 修订**：kafka 觉得贴脸太挤，改为**关于画面中线对称**站位（玩家 200，Boss = WIDTH-200 = 760）→ 删 bbox 改 tween onComplete 触发即可

---

## CP5 阶段设计经验（会话 6）

### 用户提的方案有硬伤要直说，不要硬实现
- kafka 提"用技能才能过火墙" → 我立即指出硬伤：CD=10s + 火墙每 3s 出 = CD 期必死
- 不直说硬实现 → 用户玩两把发现废了 → 返工浪费更大
- **教训**：拒绝不是顶撞，**带替代方案的拒绝**才是负责任

### 数值改造 ≠ 玩法创新
- 我先提"Boss 战蓄能 / 得分倍率" → kafka 一眼看穿："还停留在传统打法"
- 蓄能/倍率本质是**加权重的数字**，玩家肌肉记忆没变化
- 真创新的标志：**操作维度增加 / 决策路径分支 / 反馈通道改变**
- kafka 自己提的"Boss 战引入技能 + 小妖怪刷新"满足第二条：从"画弧打 Boss"单线 → "画弧 + 切换 + 技能"三线决策

### 跨场景的"形态一致性"
- 之前 Boss 战玩家是个左下角的橙色小圆点 → 跟跑酷里的方块/圆**完全脱节**
- kafka 特别强调："3A 中你也改成和跑酷中一样的图案吧"
- **设计原则**：同一角色跨场景应该保持视觉特征（颜色、形状、装饰），让玩家"我还是那个我"
- 工程实现：新写 BossPlayer 类持有同样的 draw 逻辑，而非复用 Wukong/Bajie（因为 Boss 战不需要物理 body）

### 玩家拍板优于我设计的判据
- 我推荐"画弧统一"（A 方案，60 min 工作量）→ kafka 直接换了一个我没想到的角度
- kafka 方案省时间（50 min）+ 解决问题更多（5 个一锅炖：技能没用 / Boss 太脆 / 传统打法 / 跑酷克制弱 / 切换价值小）
- **设计原则**：用户是产品经理，开发者补技术细节。**先让用户充分表达，再补方案**

---

## CP5.5 阶段技术 / UX 发现（会话 7）

### Retina + Phaser 模糊三连
Mac Retina（devicePixelRatio=2）+ Phaser FIT 缩放下，**默认设置一定是糊的**。三个修复缺一不可：
1. `phaserConfig.resolution = window.devicePixelRatio || 1` —— 渲染分辨率跟物理像素对齐
2. `phaserConfig.render = { antialias: true, pixelArt: false, roundPixels: false }` —— 明确告诉 Phaser 用线性过滤、不强行整数像素
3. **删 `image-rendering: pixelated`** —— 这是给像素风的，不是的话用了就糊成马赛克
- **教训**：Phaser 模板复制时不要无脑保留 `image-rendering: pixelated`，先确认游戏风格

### Phaser InteractiveObject + 全局 pointerdown 误触陷阱
项目里 GameScene 注册过 `this.input.on('pointerdown', () => jump())`，BossScene 注册过手势识别开始监听 `pointerdown`。后来给卡片加 `setInteractive` + `pointerdown` 切角色，**结果点卡片角色会同时跳起来 / 进入画弧手势**。
- **根因**：Phaser 的 `setInteractive` 触发的事件**默认会冒泡**到 scene 级的全局 `input.on('pointerdown')`
- **修法**：在 InteractiveObject 的回调里 `event.stopPropagation()`：
  ```js
  this.wukongCard.on('pointerdown', (pointer, lx, ly, event) => {
      event.stopPropagation();
      this.switchTo('wukong');
  });
  ```
- **教训**：UI 元素 + 全局输入共存时，UI 回调一律先 stopPropagation

### 小字号 + 灰色 = 一定看不清
- 11px + #666 灰色文字，**100% 会被吐槽**
- 字号不够 → "免" 被看成 "兔"、"分" 被看成 "份"
- **经验值**：UI 文字字号下限 14px，颜色对比度 > 4:1（白底深字 or 黑底白字）
- **层级**：主信息 22-28px / 提示信息 14-16px / 装饰小注 11-12px（最小别再低于 11）

### 结算页布局留白经验
- 总分框（h=50）的**框底** 距下方按钮的**顶边** 应 ≥ 60-80px 才算清爽
- 之前 cy+72（框中心）+ 25（半高）= cy+97（框底），按钮在 cy+150 - 25 = cy+125（按钮顶）→ **仅 28px**，肉眼上完全贴一起
- 修改后：按钮挪到 cy+210，留白 88px
- **经验值**：信息块与交互按钮间至少留 1 个按钮高（这里 50px）的间距


---

## CP6 阶段技术发现（会话 8 - 像素素材接入）

### Phaser Image vs Rectangle/Circle 的 API 差异
| 操作 | Rectangle/Circle | Image |
|---|---|---|
| 改填充色 | `obj.fillColor = 0xFFD700` | `obj.setTint(0xFFD700)` |
| 恢复原色 | `obj.fillColor = origColor` | `obj.clearTint()` |
| 设置尺寸 | 构造时传 width/height | `obj.setDisplaySize(w, h)` |
| body 大小 | 自动跟着 visual | 必须 `body.setSize(w, h)` |
| scale 初始值 | 1 | setDisplaySize 后 ≠ 1 |

**致命坑**：image 没有 fillColor 属性，赋值不报错但完全无效（**静默失败**）；scale 不是 1，后续 tween 缩放写 `scale: 1.2` 会**变小**（因为原 scale 是 0.048）。修：用 `scale: this.visual.scale * 1.2` 相对值

### 像素图替代代码生成形状的工程清单
做的不仅是"换贴图"。要同时改：
1. **创建**：`add.image` 替代 `add.rectangle/circle`
2. **尺寸**：`setDisplaySize` 而非构造参数
3. **物理 body**：手动 `body.setSize`（hitbox 略小于贴图，留出 padding）
4. **改色**：所有 `fillColor =` 替换为 `setTint`，恢复用 `clearTint`
5. **死亡变灰**：基类 `die()` 加 `if (setTint)` 双兼容（防止其他场景也用同一基类但仍是 Rectangle）
6. **装饰简化**：像素图自带细节（眼睛/装饰），去掉代码画的眼睛/金箍/耳朵
7. **加标识**：换贴图后多角色色调可能相近，加"颜色光环"（GameScene/BossScene 都加）让玩家秒识当前角色

### 背景图接入的 3 行核心代码
```js
const bg = this.add.image(WIDTH/2, HEIGHT/2, 'huoyanshan');
bg.setDisplaySize(WIDTH, HEIGHT);
bg.setDepth(-10);
// 再加一层暗化（让背景成氛围）
this.add.rectangle(WIDTH/2, HEIGHT/2, WIDTH, HEIGHT, 0x000000, 0.25).setDepth(-9);
```
**经验值**：背景图 alpha 1.0 + 暗化层 alpha 0.25（跑酷）/0.4（Boss 战）= 视觉舒适
**避免**：直接用原图（角色看不清）/ 不加 setDepth（被地面盖住）

### 资源管理：复制 vs 软链接
- 跨项目共用素材：**复制更安全**，独立可移植（本项目 game/assets/images/ 自包含）
- 软链接：节省空间但跨项目依赖，迁移时容易丢
- 黑客松项目 6MB 不算大，复制是最优解

---

## CP6.5 阶段技术发现（会话 9 - 白底清除）

### PIL flood-fill 去除白底（保护角色内部浅色）
**问题**：素材白底需要去掉，但简单的"所有白色变透明"会误伤角色身上的眼睛、装饰、衣领等浅色元素

**解决：flood-fill 算法**
```python
from PIL import Image
from collections import deque

img = Image.open("wukong.png").convert("RGBA")
w, h = img.size
pixels = img.load()
visited = [[False] * h for _ in range(w)]
queue = deque()

THRESHOLD = 235  # RGB > 235 算白色
def is_white(x, y):
    r, g, b, a = pixels[x, y]
    return r > THRESHOLD and g > THRESHOLD and b > THRESHOLD and a > 0

# 1. 把四条边上所有白色像素加入队列（起点）
for x in range(w):
    for y in [0, h-1]:
        if is_white(x, y): queue.append((x, y)); visited[x][y] = True
for y in range(h):
    for x in [0, w-1]:
        if is_white(x, y): queue.append((x, y)); visited[x][y] = True

# 2. BFS 蔓延，标记所有连通到边的白色像素为透明
while queue:
    x, y = queue.popleft()
    pixels[x, y] = (255, 255, 255, 0)
    for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
        nx, ny = x+dx, y+dy
        if 0<=nx<w and 0<=ny<h and not visited[nx][ny] and is_white(nx, ny):
            visited[nx][ny] = True
            queue.append((nx, ny))

img.save("wukong.png")
```

**关键洞察**：
- 角色身上的眼睛/牙齿/衣领等浅色被"非白边缘"包围 → 不与四个边角连通 → flood-fill 不会到达 → 完整保留 ✅
- 简单的 `if rgb > 阈值: alpha=0` 会无差别擦除所有浅色 → ❌
- 阈值 235 是个保守选择，避免把"接近白"的脏色误判（如果角色边缘有抗锯齿的浅灰色，可适当降低）

**性能**：1254×1254 图，处理时间约 1.5s（够用了）

### 必先备份再处理图像
```bash
cp wukong.png wukong.bak.png && python3 process.py
```
- 备份成本：< 1 秒
- 处理失误回滚成本：1 秒（cp 反向）
- 不备份的回滚成本：可能要重新下载原文件、重新处理一遍
- 黑客松节奏下，**备份是 ROI 最高的预防措施**

### 不要急着加"防御性额外特征"
- CP6 给两个角色加了"颜色光环"，理由："担心两张像素图色调相近，玩家分不清"
- kafka CP6.5 反馈："光圈也去掉吧，没有用"
- 教训：**自己的"防御性设计"，用户不一定需要**。先给最简版让用户用，再根据真实反馈加特征。**少即是多**

