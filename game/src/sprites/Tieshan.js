/**
 * Tieshan - 铁扇公主 Boss
 * 位置：屏幕右侧，挥扇子，扔火球
 */
class Tieshan {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.hp = GAME_CONFIG.BOSS_HP;
        this.hpMax = GAME_CONFIG.BOSS_HP;
        this.decorations = [];
        this.createVisual();
    }

    createVisual() {
        // 铁扇公主像素图
        const size = 140;
        this.body = this.scene.add.image(this.x, this.y, 'tieshangongzhu');
        this.body.setDisplaySize(size, size);
        this.body.setOrigin(0.5, 1.0);  // 底部对齐
        this.decorations.push(this.body);

        // 进场动画：从右边飘进来
        const finalX = this.body.x;
        this.body.x = finalX + 200;  // 先挪到右边
        this.scene.tweens.add({
            targets: this.body,
            x: finalX,
            duration: 800,
            ease: 'Cubic.easeOut',
        });
    }

    /**
     * 受伤：扣血 + 闪红 + 飘伤害数字
     */
    takeDamage(amount, isPerfect) {
        this.hp = Math.max(0, this.hp - amount);

        // 闪红
        this.decorations.forEach(d => {
            if (d.setFillStyle) {
                const orig = d.fillColor;
                d.setFillStyle(0xFFFFFF);
                this.scene.time.delayedCall(80, () => {
                    if (d.active) d.setFillStyle(orig);
                });
            }
        });

        // 摇晃：每个 decoration 独立 tween，避开数组 from/to 不支持的问题
        this.decorations.forEach(d => {
            const origX = d.x;
            this.scene.tweens.add({
                targets: d,
                x: origX + 6,
                duration: 60,
                yoyo: true,
                ease: 'Sine.easeInOut',
            });
        });

        // 飘伤害数字
        const dmgText = this.scene.add.text(
            this.x + Phaser.Math.Between(-30, 30),
            this.y - 80,
            `-${amount}`,
            {
                fontSize: isPerfect ? '36px' : '24px',
                color: isPerfect ? '#FFD700' : '#FF4444',
                fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(2000);
        this.scene.tweens.add({
            targets: dmgText,
            y: dmgText.y - 60,
            alpha: 0,
            duration: 700,
            onComplete: () => dmgText.destroy(),
        });
    }

    /**
     * 当前阶段：返回火球生成间隔
     */
    getPhase() {
        const ratio = this.hp / this.hpMax;
        if (ratio > 0.66) return 1;
        if (ratio > 0.33) return 2;
        return 3;
    }

    getFireballInterval() {
        const p = this.getPhase();
        if (p === 1) return GAME_CONFIG.BOSS_FIREBALL_INTERVAL_1;
        if (p === 2) return GAME_CONFIG.BOSS_FIREBALL_INTERVAL_2;
        return GAME_CONFIG.BOSS_FIREBALL_INTERVAL_3;
    }

    isDead() {
        return this.hp <= 0;
    }

    destroy() {
        this.decorations.forEach(d => d.destroy());
        this.decorations = [];
    }
}
