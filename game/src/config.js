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
    PLAYER_SIZE: 40,         // 角色尺寸（悟空）
    PLAYER_BAJIE_SIZE: 46,   // 八戒尺寸（更大更粗）
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

    // 障碍类型解锁时间（秒）—— 30s 关卡，全部内容 18s 内出齐
    UNLOCK_ROCK: 0,           // 岩石：开局即有
    UNLOCK_FIRE: 0,           // 火焰：开局即有
    UNLOCK_FLY_ROCK: 5,       // 飞石：5 秒解锁
    UNLOCK_FIRE_WALL: 10,     // 火墙：10 秒解锁
    UNLOCK_BOULDER: 18,       // 巨石：18 秒解锁

    // 跑酷关卡时长（秒）—— 跑过这个时间，铁扇公主出现
    STAGE_DURATION: 30,
    OBSTACLE_STOP_AT: 25,     // 25s 后停止生成新障碍（给玩家清场感）
    BOSS_APPEAR_AT: 30,       // 30s 时 Boss 入场

    // Boss 战参数（铁扇公主）
    BOSS_HP: 100,             // 血量
    BOSS_TIME_LIMIT: 20000,   // 倒计时 20 秒
    BOSS_BASE_DAMAGE: 5,      // 基础伤害
    BOSS_FIREBALL_INTERVAL_1: 4000,  // 阶段 1 (HP 100~66) 火球间隔
    BOSS_FIREBALL_INTERVAL_2: 2500,  // 阶段 2 (HP 66~33)
    BOSS_FIREBALL_INTERVAL_3: 1500,  // 阶段 3 (HP 33~0) 暴怒
    BOSS_FIREBALL_SPEED: 380,        // 火球飞行速度
    BOSS_FIREBALL_HIT_LIMIT: 3,      // 被击中 3 次 = 失败

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
    COLOR_FIRE: 0xFF3300,         // 火焰：亮红
    COLOR_ROCK: 0x666666,         // 岩石：灰
    COLOR_FLY_ROCK: 0x888888,     // 飞石：浅灰
    COLOR_FIRE_WALL: 0xFF2200,    // 火墙：鲜红
    COLOR_BOULDER: 0x555555,      // 巨石：中灰
    COLOR_SKILL_READY: 0x00FF88,  // 技能就绪：亮绿
    COLOR_SKILL_CD: 0x444444,     // 技能冷却：暗灰

    // 调试
    DEBUG_PHYSICS: false,    // 是否显示物理碰撞框（出问题时改 true 看判定）
};
