/**
 * Bajie - 八戒（力量型）
 * - 免疫岩石、巨石
 * - 怕火焰、火墙、飞石
 * - 技能：变胖冲撞，3 秒无敌
 */
class Bajie extends Player {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.type = 'bajie';
        this.color = GAME_CONFIG.COLOR_BAJIE;
        this.size = GAME_CONFIG.PLAYER_BAJIE_SIZE;
        this.jumpPower = GAME_CONFIG.JUMP_POWER_BAJIE;
        this.skillMaxCD = GAME_CONFIG.BAJIE_SKILL_CD;
        this.skillName = '变胖冲撞';
    }

    createVisual() {
        // 像素图替代粉紫圆（保持 hitbox 尺寸）
        this.visual = this.scene.add.image(this.x, this.y, 'bajie');
        this.visual.setDisplaySize(this.size, this.size);
        // 关键：setOrigin(0.5, 1.0) 让图片底部作为锚点 → 图片底边 = 物理体底边 = 地面
        this.visual.setOrigin(0.5, 1.0);
        this.scene.physics.add.existing(this.visual);
        // body 满高度，宽度 0.75 保留命中宽容
        this.visual.body.setSize(this.size * 0.75, this.size);
        this.visual.body.setCollideWorldBounds(true);
    }

    updateDecorations() {
        // 无光环，纯像素图
    }

    canPass(obstacle) {
        // 只免疫巨石（克制系统：必须切八戒穿）
        if (obstacle.type === 'boulder') {
            return true;
        }
        // 小妖怪、火墙都会死（小妖怪必须跳，火墙必须切悟空）
        return false;
    }

    useSkill() {
        if (!super.useSkill()) return false;

        // 进入无敌
        this.isInvincible = true;
        // 视觉反馈：贴图染金色 tint + 微微变大
        this.visual.setTint(0xFFD700);
        this.scene.tweens.add({
            targets: this.visual,
            scale: this.visual.scale * 1.2,
            duration: 200,
            yoyo: true,
            repeat: Math.floor(GAME_CONFIG.BAJIE_SKILL_DURATION / 400) - 1,
        });

        // 持续时间结束后解除
        this.scene.time.delayedCall(GAME_CONFIG.BAJIE_SKILL_DURATION, () => {
            if (!this.isAlive) return;
            this.isInvincible = false;
            this.visual.clearTint();
            this.visual.setDisplaySize(this.size, this.size);
        });

        return true;
    }
}
