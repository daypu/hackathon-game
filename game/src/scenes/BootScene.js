/**
 * BootScene - 启动场景
 * 用代码生成基础贴图，然后跳转到 GameScene
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 统一文字样式（解决中文字符顶部截断 + Retina 模糊）
        TextStyle.patch(this);

        // 加载像素素材（来自 hackathon-game 项目）
        this.load.image('wukong', 'assets/images/wukong.png');
        this.load.image('bajie', 'assets/images/bajie.png');
        this.load.image('huoyanshan', 'assets/images/huoyanshan.png');
        this.load.image('tieshangongzhu', 'assets/images/tieshangongzhu.png');
        this.load.image('feixingyaoguai', 'assets/images/feixingyaoguai.png');
        this.load.image('ludiyaoguai', 'assets/images/ludiyaoguai.png');

        // 加载提示
        const loadingText = this.add.text(
            GAME_CONFIG.WIDTH / 2,
            GAME_CONFIG.HEIGHT / 2,
            '万象迷途 加载中...',
            { fontSize: '24px', color: '#FFD700' }
        ).setOrigin(0.5);
        // 加载完成会自动跳到 create
    }

    create() {
        // 200ms 后跳到游戏场景（短暂停留让玩家看到 logo）
        this.time.delayedCall(200, () => {
            this.scene.start('GameScene');
        });
    }
}
