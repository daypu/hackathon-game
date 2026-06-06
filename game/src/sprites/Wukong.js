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
        // 橙色方块（主体）
        this.visual = this.scene.add.rectangle(
            this.x, this.y, this.size, this.size, this.color
        );
        this.scene.physics.add.existing(this.visual);
        this.visual.body.setCollideWorldBounds(true);

        // 装饰：眼睛
        const eye = this.scene.add.circle(this.x + 8, this.y - 4, 3, 0xFFFFFF);
        const pupil = this.scene.add.circle(this.x + 8, this.y - 4, 1.5, 0x000000);
        // 装饰：金箍
        const crown = this.scene.add.graphics();
        this.decorations.push(eye, pupil, crown);
        this.crown = crown;
    }

    updateDecorations() {
        const [eye, pupil] = this.decorations;
        eye.setPosition(this.visual.x + 8, this.visual.y - 4);
        pupil.setPosition(this.visual.x + 8, this.visual.y - 4);
        this.crown.clear();
        this.crown.lineStyle(2, 0xFFD700, 1);
        this.crown.strokeRect(
            this.visual.x - this.size/2,
            this.visual.y - this.size/2 - 2,
            this.size, 4
        );
    }

    canPass(obstacle) {
        // 火焰类全部免疫
        if (obstacle.type === 'fire' || obstacle.type === 'fire_wall') {
            return true;
        }
        // 岩石、飞石、巨石都会死
        return false;
    }

    useSkill() {
        if (!super.useSkill()) return false;

        // 清除屏幕内所有火焰类障碍
        const obstacles = this.scene.obstacleManager.getObstacles();
        let cleared = 0;
        obstacles.forEach(o => {
            if (o.type === 'fire' || o.type === 'fire_wall') {
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
