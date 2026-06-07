/**
 * 全局配置 - 所有可调参数集中在这里
 * 调游戏手感时直接改这里的数值即可
 */
const GAME_CONFIG = {
    // 画布尺寸
    WIDTH: 960,
    HEIGHT: 540,

    // 物理参数
    GRAVITY: 1500,           // 重力（越大下落越快）
    GROUND_HEIGHT: 80,       // 地面高度（从底部往上）

    // 角色参数
    PLAYER_START_X: 200,     // 角色起始 X 位置
    PLAYER_SIZE: 60,         // 角色尺寸（悟空）—— CP6.5+ 放大（背景占比 ~11%）
    PLAYER_BAJIE_SIZE: 68,   // 八戒尺寸（更大更粗）—— CP6.5+ 放大
    JUMP_POWER: 700,         // 跳跃初速度（越大跳越高）
    JUMP_POWER_WUKONG: 800,  // 悟空跳更高
    JUMP_POWER_BAJIE: 650,   // 八戒跳稍低
    // 注：实际跳跃感觉 = JUMP_POWER 与 GRAVITY 的比值
    // 当前比值 700/1500 ≈ 0.47s 滞空时间，比较跟手

    // 世界滚动速度
    WORLD_SPEED: 320,        // 障碍物向左移动速度（像素/秒）
    WORLD_SPEED_MAX: 520,    // 最高速度（30s 后达到）
    SPEED_INCREASE_PER_S: 2, // 每秒钟速度加这么多
    DIFFICULTY_TIME_CAP: 30, // 30 秒后难度不再增加

    // 障碍物
    OBSTACLE_MIN_INTERVAL: 1100,  // 生成最小间隔（ms）
    OBSTACLE_MAX_INTERVAL: 1800,  // 生成最大间隔（ms）
    OBSTACLE_SIZE: 36,            // 障碍物尺寸
    FIRE_WALL_HEIGHT: 460,        // 火墙高度（顶天，跳不过去，必须切悟空穿）
    BOULDER_RADIUS: 80,           // 巨石半径（贴地超宽，跳不过去，必须切八戒穿）

    // 障碍类型解锁时间（秒）—— 30s 关卡，全部内容 16s 内出齐
    UNLOCK_MONSTER: 0,        // 小妖怪（地面+空中两种姿态）：开局即有，跳跃躲避，两个角色都不能撞
    UNLOCK_FIRE_WALL: 8,      // 火墙：8 秒解锁（必须切悟空穿）
    UNLOCK_BOULDER: 16,       // 巨石：16 秒解锁（必须切八戒穿）

    // 小妖怪：地面 vs 空中比例
    MONSTER_AIR_RATIO: 0.4,   // 40% 概率生成空中姿态
    MONSTER_AIR_HEIGHT: 95,   // 空中妖怪离地高度（玩家可跳过）

    // 跑酷关卡时长（秒）—— 跑过这个时间，铁扇公主出现
    STAGE_DURATION: 30,
    OBSTACLE_STOP_AT: 25,     // 25s 后停止生成新障碍（给玩家清场感）
    BOSS_APPEAR_AT: 30,       // 30s 时 Boss 入场

    // Boss 战参数（铁扇公主）
    BOSS_HP: 180,             // 血量（之前 100 太脆）
    BOSS_TIME_LIMIT: 25000,   // 倒计时 25 秒（加血同步加时）
    BOSS_BASE_DAMAGE: 5,      // 基础伤害
    BOSS_FIREBALL_INTERVAL_1: 2200,  // 阶段 1 (HP 120~180) 火球间隔（更密）
    BOSS_FIREBALL_INTERVAL_2: 1300,  // 阶段 2 (HP 60~120)
    BOSS_FIREBALL_INTERVAL_3: 700,   // 阶段 3 (HP 0~60) 暴怒
    BOSS_FIREBALL_SPEED: 460,        // 火球飞行速度（更快）
    BOSS_FIREBALL_MULTI_PHASE2: 2,   // 阶段 2 一次扔几个
    BOSS_FIREBALL_MULTI_PHASE3: 3,   // 阶段 3 一次扔几个
    BOSS_FIREBALL_SPREAD: 22,        // 多发火球的夹角（度）
    BOSS_FIREBALL_HIT_LIMIT: 4,      // 被击中 4 次 = 失败（容错+1，补偿小妖怪）

    // Boss 战小妖怪
    BOSS_MONSTER_SPEED: 180,             // 冲向玩家速度（px/s）
    BOSS_MONSTER_INTERVAL_NORMAL: 1500,  // Boss HP > 60% 时的生成间隔
    BOSS_MONSTER_INTERVAL_RAGE: 800,     // Boss HP < 60% 暴怒期间隔
    BOSS_MONSTER_FIRST_DELAY: 2500,      // 首发延迟（让玩家先反应一下）

    // Boss 战技能（比跑酷版 CD 短）
    BOSS_WUKONG_SKILL_CD: 5000,      // 5s
    BOSS_BAJIE_SKILL_CD: 8000,       // 8s
    BOSS_BAJIE_SHIELD_DURATION: 2500,// 八戒护盾持续时间（小妖怪不能靠近）
    BOSS_BAJIE_SHIELD_RADIUS: 70,    // 护盾半径


    // 手势识别
    GESTURE_MIN_POINTS: 8,    // 最少采样点数（防作弊）
    GESTURE_MIN_ARC: 60,      // 最小弧度（度）
    GESTURE_BASE_SPEED: 1.5,  // 基准速度（px/ms），1× 伤害的参考点
    GESTURE_MAX_SPEED: 3.0,   // 最大速度倍率上限
    GESTURE_COMBO_WINDOW: 600,// 连击判定窗口（ms）

    // 技能参数
    WUKONG_SKILL_CD: 10000,   // 悟空技能冷却（毫秒）
    WUKONG_SKILL_DURATION: 500, // 技能动画时长
    BAJIE_SKILL_CD: 12000,    // 八戒技能冷却
    BAJIE_SKILL_DURATION: 3000,// 八戒技能持续（无敌时长）

    // 计分
    SCORE_PER_SECOND: 5,     // 每秒得分

    // 颜色
    COLOR_BG: 0x2a1810,           // 背景：深褐色（火焰山土地）
    COLOR_GROUND: 0x8B4513,       // 地面：棕色
    COLOR_GROUND_TOP: 0xCD853F,   // 地面顶层：沙黄色
    COLOR_WUKONG: 0xFF6600,       // 悟空：橙色
    COLOR_BAJIE: 0xFF69B4,        // 八戒：粉紫色
    COLOR_OBSTACLE: 0x444444,     // 障碍物：深灰
    COLOR_MONSTER_BODY: 0x3aa856, // 小妖怪：草绿身体
    COLOR_MONSTER_BELLY: 0x88dd88,// 小妖怪：浅绿肚皮
    COLOR_MONSTER_EYE: 0xff4444,  // 小妖怪：红眼睛
    COLOR_MONSTER_TUSK: 0xfff4d0, // 小妖怪：象牙白獠牙
    COLOR_FIRE_WALL: 0xFF2200,    // 火墙：鲜红
    COLOR_BOULDER: 0x555555,      // 巨石：中灰
    COLOR_SKILL_READY: 0x00FF88,  // 技能就绪：亮绿
    COLOR_SKILL_CD: 0x444444,     // 技能冷却：暗灰

    // 调试
    DEBUG_PHYSICS: false,    // 是否显示物理碰撞框（出问题时改 true 看判定）
};
