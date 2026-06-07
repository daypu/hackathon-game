/**
 * Obstacle - 障碍物（按类型分形态）
 *
 * 类型：
 * - monster     👹 小妖怪：地面跑 OR 半空飘，两个角色都不能撞（必须跳）
 * - fire_wall   🔥 火墙：全屏火焰墙，必须悟空技能
 * - boulder     🗿 巨石：地面大灰球，必须八戒技能
 */
class Obstacle {
    constructor(scene, type) {
        this.scene = scene;
        this.type = type;
        this.variant = null;       // monster 子类型：'ground' | 'air'
        this.visual = null;
        this.decorations = [];

        this.create();
    }

    create() {
        const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT;
        const speed = -this.scene.getWorldSpeed();
        const spawnX = GAME_CONFIG.WIDTH + 50;

        switch (this.type) {
            case 'monster':
                // 按比例随机：空中飘 vs 地面跑
                this.variant = (Math.random() < GAME_CONFIG.MONSTER_AIR_RATIO) ? 'air' : 'ground';
                this.createMonster(spawnX, groundY, speed, this.variant);
                break;
            case 'fire_wall':
                this.createFireWall(spawnX, groundY, speed);
                break;
            case 'boulder':
                this.createBoulder(spawnX, groundY, speed);
                break;
        }
    }

    /**
     * 小妖怪：使用像素图
     * - ground：陆地妖怪，站在地上跑
     * - air：飞行妖怪，飘在跳跃可达高度
     */
    createMonster(x, groundY, speed, variant) {
        const size = 40;
        const y = (variant === 'air')
            ? groundY - GAME_CONFIG.MONSTER_AIR_HEIGHT
            : groundY;

        // 使用对应的像素图
        const imageName = (variant === 'air') ? 'feixingyaoguai' : 'ludiyaoguai';
        this.visual = this.scene.add.image(x, y, imageName);
        this.visual.setDisplaySize(size, size);
        this.visual.setOrigin(0.5, 1.0);  // 底部对齐

        this.scene.physics.add.existing(this.visual);
        this.visual.body.setAllowGravity(false);
        this.visual.body.setVelocityX(speed);
        this.visual.body.setSize(size * 0.8, size * 0.8);

        // 空中款：上下浮动
        if (variant === 'air') {
            this.scene.tweens.add({
                targets: this.visual,
                y: y - 8,
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }
    }

    createFireWall(x, groundY, speed) {
        // 全屏火墙：从地面到顶部的红色墙体
        const w = 60;
        const h = GAME_CONFIG.FIRE_WALL_HEIGHT;
        const y = groundY - h / 2;
        this.visual = this.scene.add.rectangle(x, y, w, h, GAME_CONFIG.COLOR_FIRE_WALL);
        this.scene.physics.add.existing(this.visual);
        this.visual.body.setAllowGravity(false);
        this.visual.body.setVelocityX(speed);
        // 装饰：火焰摇曳效果（边缘加亮色条）
        const inner = this.scene.add.rectangle(x, y, w - 16, h - 10, 0xFF6600);
        const core = this.scene.add.rectangle(x, y, w - 32, h - 30, 0xFFCC00);
        inner.setAlpha(0.8);
        core.setAlpha(0.6);
        this.decorations.push(inner, core);
    }

    createBoulder(x, groundY, speed) {
        // 大巨石（贴地超宽，无法跳过）
        const r = GAME_CONFIG.BOULDER_RADIUS;
        const y = groundY - r;
        this.visual = this.scene.add.circle(x, y, r, GAME_CONFIG.COLOR_BOULDER);
        this.scene.physics.add.existing(this.visual);
        this.visual.body.setCircle(r);
        this.visual.body.setAllowGravity(false);
        this.visual.body.setVelocityX(speed);
        // 装饰：高光
        const hi = this.scene.add.circle(x - r * 0.3, y - r * 0.3, r * 0.2, 0x888888);
        this.decorations.push(hi);
    }

    /**
     * 每帧更新装饰位置 + 销毁离屏障碍
     */
    update() {
        if (!this.visual.active) return true;  // 已销毁

        // 装饰跟随主体移动
        const dx = this.visual.body.deltaX();
        const dy = this.visual.body.deltaY();  // 空中妖怪有上下浮动 tween
        this.decorations.forEach(d => {
            d.x += dx;
            d.y += dy;
        });

        // 离屏销毁
        if (this.visual.x < -100) {
            this.destroy();
            return true;
        }
        return false;
    }

    destroy() {
        if (this.visual && this.visual.active) {
            this.scene.tweens.killTweensOf(this.visual);
            this.visual.destroy();
        }
        this.decorations.forEach(d => d.destroy());
        this.decorations = [];
    }

    setVelocityX(vx) {
        if (this.visual && this.visual.body) {
            this.visual.body.setVelocityX(vx);
        }
    }

    getBounds() {
        return this.visual.getBounds();
    }
}
