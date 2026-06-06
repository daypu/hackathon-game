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
        // 粉紫圆形（主体）
        this.visual = this.scene.add.circle(
            this.x, this.y, this.size / 2, this.color
        );
        this.scene.physics.add.existing(this.visual);
        this.visual.body.setCircle(this.size / 2);
        this.visual.body.setCollideWorldBounds(true);

        // 装饰：双眼
        const leftEye = this.scene.add.circle(this.x - 6, this.y - 6, 3, 0xFFFFFF);
        const rightEye = this.scene.add.circle(this.x + 6, this.y - 6, 3, 0xFFFFFF);
        const leftPupil = this.scene.add.circle(this.x - 6, this.y - 6, 1.5, 0x000000);
        const rightPupil = this.scene.add.circle(this.x + 6, this.y - 6, 1.5, 0x000000);
        // 装饰：耳朵（两个小三角）
        const ears = this.scene.add.graphics();
        this.decorations.push(leftEye, rightEye, leftPupil, rightPupil, ears);
        this.ears = ears;
    }

    updateDecorations() {
        const [le, re, lp, rp] = this.decorations;
        const vx = this.visual.x, vy = this.visual.y;
        le.setPosition(vx - 6, vy - 6);
        re.setPosition(vx + 6, vy - 6);
        lp.setPosition(vx - 6, vy - 6);
        rp.setPosition(vx + 6, vy - 6);
        // 耳朵
        this.ears.clear();
        this.ears.fillStyle(this.color, 1);
        // 左耳
        this.ears.fillTriangle(
            vx - 16, vy - 14,
            vx - 8, vy - 22,
            vx - 6, vy - 12
        );
        // 右耳
        this.ears.fillTriangle(
            vx + 6, vy - 12,
            vx + 8, vy - 22,
            vx + 16, vy - 14
        );
    }

    canPass(obstacle) {
        // 岩石类全部免疫
        if (obstacle.type === 'rock' || obstacle.type === 'boulder') {
            return true;
        }
        // 火焰、飞石都会死
        return false;
    }

    useSkill() {
        if (!super.useSkill()) return false;

        // 进入无敌
        this.isInvincible = true;
        // 视觉反馈：变金色 + 微微变大
        const originalColor = this.color;
        this.visual.fillColor = 0xFFD700;
        this.scene.tweens.add({
            targets: this.visual,
            scale: 1.2,
            duration: 200,
            yoyo: true,
            repeat: Math.floor(GAME_CONFIG.BAJIE_SKILL_DURATION / 400) - 1,
        });

        // 持续时间结束后解除
        this.scene.time.delayedCall(GAME_CONFIG.BAJIE_SKILL_DURATION, () => {
            if (!this.isAlive) return;
            this.isInvincible = false;
            this.visual.fillColor = originalColor;
            this.visual.setScale(1);
        });

        return true;
    }
}
