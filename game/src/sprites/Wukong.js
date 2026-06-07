/**
 * Wukong - 悟空（灵活型）
 * - 免疫火焰、火墙
 * - 怕岩石、飞石、巨石
 * - 技能：金箍棒横扫，清除屏幕所有火焰类障碍
 */
class Wukong extends Player {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.type = 'wukong';
        this.color = GAME_CONFIG.COLOR_WUKONG;
        this.size = GAME_CONFIG.PLAYER_SIZE;
        this.jumpPower = GAME_CONFIG.JUMP_POWER_WUKONG;
        this.skillMaxCD = GAME_CONFIG.WUKONG_SKILL_CD;
        this.skillName = '金箍棒横扫';
    }

    createVisual() {
        // 像素图替代橙方块（保持 hitbox 尺寸 = this.size）
        this.visual = this.scene.add.image(this.x, this.y, 'wukong');
        this.visual.setDisplaySize(this.size, this.size);
        // 关键：setOrigin(0.5, 1.0) 让图片底部作为锚点 → 图片底边 = 物理体底边 = 地面
        this.visual.setOrigin(0.5, 1.0);
        this.scene.physics.add.existing(this.visual);

        // 物理体尺寸
        const bodyWidth = this.size * 0.7;
        const bodyHeight = this.size * 0.8;
        this.visual.body.setSize(bodyWidth, bodyHeight);

        // 计算offset：让物理体底部对齐图片底部
        // offset = size - bodyHeight (60 - 48 = 12)
        const offsetX = (this.size - bodyWidth) / 2;
        const offsetY = this.size - bodyHeight;
        this.visual.body.setOffset(offsetX, offsetY);

        this.visual.body.setCollideWorldBounds(true);
    }

    updateDecorations() {
        // 无光环，纯像素图
    }

    canPass(obstacle) {
        // 只免疫火墙（克制系统：必须切悟空穿）
        if (obstacle.type === 'fire_wall') {
            return true;
        }
        // 小妖怪、巨石都会死（小妖怪必须跳，巨石必须切八戒）
        return false;
    }

    useSkill() {
        if (!super.useSkill()) return false;

        // 清除屏幕内所有火墙
        const obstacles = this.scene.obstacleManager.getObstacles();
        let cleared = 0;
        obstacles.forEach(o => {
            if (o.type === 'fire_wall') {
                o.destroy();
                cleared++;
            }
        });

        // 视觉特效：屏幕短暂闪光
        this.scene.cameras.main.flash(200, 255, 200, 50);

        // 横扫光带（一条粗金色横线快速划过）
        const flash = this.scene.add.rectangle(
            GAME_CONFIG.WIDTH / 2,
            GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT / 2 - 100,
            GAME_CONFIG.WIDTH * 1.2, 18, 0xFFD700
        );
        flash.setAlpha(0.9);
        this.scene.tweens.add({
            targets: flash,
            scaleY: 0,
            alpha: 0,
            duration: GAME_CONFIG.WUKONG_SKILL_DURATION,
            onComplete: () => flash.destroy(),
        });

        return true;
    }
}
