/**
 * BootScene - 启动场景
 * 用代码生成基础贴图，然后跳转到 GameScene
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // CP1 阶段所有图形都用 Phaser Graphics 在 GameScene 直接画，无需 preload
        // 后续接入像素素材时，这里会加 this.load.image(...)
    }

    create() {
        // 显示一行加载提示，然后立刻跳转
        const text = this.add.text(
            GAME_CONFIG.WIDTH / 2,
            GAME_CONFIG.HEIGHT / 2,
            '万象迷途 加载中...',
            { fontSize: '24px', color: '#FFD700' }
        );
        text.setOrigin(0.5);

        // 200ms 后跳到游戏场景（短暂停留让玩家看到 logo）
        this.time.delayedCall(200, () => {
            this.scene.start('GameScene');
        });
    }
}
