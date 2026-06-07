/**
 * Fireball - 铁扇公主扔的火球
 * 从 Boss 位置飞向左边目标点
 */
class Fireball {
    constructor(scene, fromX, fromY, toX, toY) {
        this.scene = scene;
        this.alive = true;
        this.deflected = false;  // 是否被扇飞

        // 速度向量
        const dx = toX - fromX;
        const dy = toY - fromY;
        const len = Math.hypot(dx, dy);
        const speed = GAME_CONFIG.BOSS_FIREBALL_SPEED;
        this.vx = (dx / len) * speed;
        this.vy = (dy / len) * speed;

        // 视觉：红色圆 + 橙色核 + 黄色亮点
        this.outer = scene.add.circle(fromX, fromY, 22, 0xFF3300);
        this.inner = scene.add.circle(fromX, fromY, 14, 0xFF9933);
        this.core  = scene.add.circle(fromX, fromY, 7,  0xFFFF66);
        this.outer.setDepth(500);
        this.inner.setDepth(501);
        this.core.setDepth(502);

        this.x = fromX;
        this.y = fromY;
        this.radius = 22;

        // 入场缩放动画
        [this.outer, this.inner, this.core].forEach(s => s.setScale(0.3));
        scene.tweens.add({
            targets: [this.outer, this.inner, this.core],
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut',
        });
    }

    update(delta) {
        if (!this.alive) return;
        this.x += this.vx * delta / 1000;
        this.y += this.vy * delta / 1000;
        this.outer.x = this.inner.x = this.core.x = this.x;
        this.outer.y = this.inner.y = this.core.y = this.y;

        // 火球抖动效果
        this.core.setScale(0.9 + Math.sin(this.scene.time.now / 50) * 0.15);

        // 出屏销毁
        if (this.x < -30 || this.x > GAME_CONFIG.WIDTH + 30 ||
            this.y < -30 || this.y > GAME_CONFIG.HEIGHT + 30) {
            this.destroy();
        }
    }

    /**
     * 被扇飞：反向飞回 Boss
     */
    deflect(toX, toY) {
        if (this.deflected) return;
        this.deflected = true;
        const dx = toX - this.x;
        const dy = toY - this.y;
        const len = Math.hypot(dx, dy);
        const speed = GAME_CONFIG.BOSS_FIREBALL_SPEED * 1.5;
        this.vx = (dx / len) * speed;
        this.vy = (dy / len) * speed;

        // 变蓝表示被扇飞
        this.outer.setFillStyle(0x4488FF);
        this.inner.setFillStyle(0x77AAFF);
        this.core.setFillStyle(0xCCEEFF);
    }

    hitsPoint(px, py, radius) {
        return Math.hypot(this.x - px, this.y - py) < this.radius + radius;
    }

    destroy() {
        this.alive = false;
        this.outer.destroy();
        this.inner.destroy();
        this.core.destroy();
    }
}
