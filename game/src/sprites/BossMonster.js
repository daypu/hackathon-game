/**
 * BossMonster - Boss 战里冲向玩家的小妖怪
 *
 * 跟跑酷里的 monster 视觉风格一致（绿身红眼獠牙），但行为不同：
 * - 从右侧生成，向左侧玩家位置直线冲过去
 * - 接触玩家 = 扣 1 次容错（和火球同算）
 * - 八戒护盾激活时无法靠近（被推开 / 自爆）
 * - 玩家画弧扫到 = 死
 * - 悟空"消灭一排"技能 = 屏幕内全死
 */
class BossMonster {
    constructor(scene, fromX, fromY, targetX, targetY) {
        this.scene = scene;
        this.alive = true;
        this.targetX = targetX;
        this.targetY = targetY;

        // 速度
        const dx = targetX - fromX;
        const dy = targetY - fromY;
        const len = Math.hypot(dx, dy) || 1;
        const speed = GAME_CONFIG.BOSS_MONSTER_SPEED;
        this.vx = (dx / len) * speed;
        this.vy = (dy / len) * speed;

        this.x = fromX;
        this.y = fromY;
        this.radius = 22;        // 命中判定半径

        this.decorations = [];
        this.draw(fromX, fromY);
    }

    draw(x, y) {
        const size = 40;
        // 随机选择陆地或飞行妖怪（Boss战里不区分，都在空中乱飞）
        const imageName = Math.random() < 0.5 ? 'ludiyaoguai' : 'feixingyaoguai';
        this.body = this.scene.add.image(x, y, imageName).setDepth(400);
        this.body.setDisplaySize(size, size);
        this.body.setOrigin(0.5, 0.5);  // 中心锚点（Boss战里妖怪在空中飞，不需要底部对齐）

        this.decorations.push(this.body);
    }

    update(delta) {
        if (!this.alive) return;
        const dx = this.vx * delta / 1000;
        const dy = this.vy * delta / 1000;
        this.x += dx;
        this.y += dy;
        this.decorations.forEach(d => { d.x += dx; d.y += dy; });

        // 出屏销毁（向左跑出去）
        if (this.x < -50 || this.x > GAME_CONFIG.WIDTH + 50) {
            this.destroy();
        }
    }

    /**
     * 检查是否撞到一个点（玩家/弧线点）
     */
    hitsPoint(px, py, extraRadius = 0) {
        return Math.hypot(this.x - px, this.y - py) < (this.radius + extraRadius);
    }

    /**
     * 被技能/画弧消灭 - 死亡特效
     */
    kill() {
        if (!this.alive) return;
        this.alive = false;
        // 黑烟扩散
        const puff = this.scene.add.circle(this.x, this.y, 8, 0x222222, 0.7).setDepth(500);
        this.scene.tweens.add({
            targets: puff,
            radius: 35,
            alpha: 0,
            duration: 300,
            onComplete: () => puff.destroy(),
        });
        this.destroyVisuals();
    }

    /**
     * 被八戒护盾推开 - 反向飞出
     */
    pushAway(centerX, centerY) {
        if (!this.alive) return;
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const len = Math.hypot(dx, dy) || 1;
        // 反弹速度（更快）
        const speed = GAME_CONFIG.BOSS_MONSTER_SPEED * 1.5;
        this.vx = (dx / len) * speed;
        this.vy = (dy / len) * speed;
        // 视觉变灰表示被推开
        this.body.setFillStyle(0x888888);
    }

    destroy() {
        this.alive = false;
        this.destroyVisuals();
    }

    destroyVisuals() {
        this.decorations.forEach(d => d.destroy());
        this.decorations = [];
    }
}
