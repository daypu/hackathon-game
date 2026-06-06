/**
 * main.js - 游戏入口
 * 初始化 Phaser 游戏实例
 */
const phaserConfig = {
    type: Phaser.AUTO,           // 自动选择 WebGL 或 Canvas
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'game-container',    // 挂载到 index.html 的 div
    backgroundColor: GAME_CONFIG.COLOR_BG,
    // 关键：用设备像素比渲染，Retina 屏才不糊
    resolution: window.devicePixelRatio || 1,

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: GAME_CONFIG.GRAVITY },
            debug: GAME_CONFIG.DEBUG_PHYSICS,
        },
    },

    scale: {
        mode: Phaser.Scale.FIT,          // 自适应缩放但保持比例
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    render: {
        antialias: true,         // 抗锯齿（默认 true，显式标明）
        pixelArt: false,         // 明确不是像素风，让 Phaser 用线性过滤
        roundPixels: false,      // 文字小数位置时不强行取整，更平滑
    },

    scene: [BootScene, GameScene, BossScene, ResultScene],
};

// 启动游戏
const game = new Phaser.Game(phaserConfig);
