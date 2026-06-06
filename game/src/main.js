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

    scene: [BootScene, GameScene, BossScene, ResultScene],
};

// 启动游戏
const game = new Phaser.Game(phaserConfig);
