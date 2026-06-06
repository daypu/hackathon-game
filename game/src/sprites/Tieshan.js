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
        // 身体：紫红色长方形（裙袍）
        this.body = this.scene.add.rectangle(this.x, this.y, 100, 140, 0xB03060);
        this.decorations.push(this.body);

        // 头：肤色圆
        this.head = this.scene.add.circle(this.x, this.y - 90, 28, 0xFFE0BD);
        this.decorations.push(this.head);

        // 头发：黑色弧
        const hair = this.scene.add.rectangle(this.x, this.y - 100, 50, 18, 0x222222);
        this.decorations.push(hair);

        // 发髻
        const bun = this.scene.add.circle(this.x, this.y - 118, 12, 0x222222);
        this.decorations.push(bun);

        // 眼睛
        this.eyeL = this.scene.add.circle(this.x - 8, this.y - 88, 2.5, 0x000000);
        this.eyeR = this.scene.add.circle(this.x + 8, this.y - 88, 2.5, 0x000000);
        this.decorations.push(this.eyeL, this.eyeR);

        // 嘴（怒）
        this.mouth = this.scene.add.rectangle(this.x, this.y - 78, 10, 2, 0xAA0000);
        this.decorations.push(this.mouth);

        // 芭蕉扇（绿色三角形 + 把手）
        this.fanG = this.scene.add.graphics();
        this.fanG.x = this.x - 65;
        this.fanG.y = this.y - 20;
        this.drawFan();
        this.decorations.push(this.fanG);

        // 装饰：宽袖口
        const sleeveL = this.scene.add.rectangle(this.x - 50, this.y - 10, 25, 50, 0x901040);
        const sleeveR = this.scene.add.rectangle(this.x + 50, this.y - 10, 25, 50, 0x901040);
        this.decorations.push(sleeveL, sleeveR);

        // 进场动画：从右边飘进来（每个 decoration 独立 tween 避免数组 from/to 兼容问题）
        this.decorations.forEach(d => {
            const finalX = d.x;
            d.x = finalX + 200;  // 先挪到右边
            this.scene.tweens.add({
                targets: d,
                x: finalX,
                duration: 800,
                ease: 'Cubic.easeOut',
            });
        });
    }

    drawFan() {
        const g = this.fanG;
        g.clear();
        // 扇面
        g.fillStyle(0x2E8B2E, 1);
        g.beginPath();
        g.arc(0, 0, 45, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false);
        g.lineTo(0, 0);
        g.closePath();
        g.fillPath();
        // 扇骨纹理
        g.lineStyle(2, 0x1F5F1F, 1);
        for (let a = -60; a <= 60; a += 20) {
            const rad = Phaser.Math.DegToRad(a);
            g.beginPath();
            g.moveTo(0, 0);
            g.lineTo(Math.cos(rad) * 45, Math.sin(rad) * 45);
            g.strokePath();
        }
        // 把手
        g.fillStyle(0x553311, 1);
        g.fillRect(-3, -5, 6, 18);
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
