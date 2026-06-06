/**
 * Obstacle - 障碍物（按类型分形态）
 *
 * 类型：
 * - fire        🔴 火焰：地面红色三角，悟空免疫
 * - rock        🪨 岩石：地面灰色方块，八戒免疫
 * - fly_rock    💨 飞石：空中灰色圆，两者都怕（必须跳）
 * - fire_wall   🔥 火墙：全屏火焰墙，必须悟空技能
 * - boulder     🗿 巨石：地面大灰球，必须八戒技能
 */
class Obstacle {
    constructor(scene, type) {
        this.scene = scene;
        this.type = type;
        this.visual = null;
        this.decorations = [];

        this.create();
    }

    create() {
        const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT;
        const speed = -this.scene.getWorldSpeed();
        const spawnX = GAME_CONFIG.WIDTH + 50;

        switch (this.type) {
            case 'fire':
                this.createFire(spawnX, groundY, speed);
                break;
            case 'rock':
                this.createRock(spawnX, groundY, speed);
                break;
            case 'fly_rock':
                this.createFlyRock(spawnX, groundY, speed);
                break;
            case 'fire_wall':
                this.createFireWall(spawnX, groundY, speed);
                break;
            case 'boulder':
                this.createBoulder(spawnX, groundY, speed);
                break;
        }
    }

    createFire(x, groundY, speed) {
        // 三角形火焰
        const size = 36;
        const y = groundY - size / 2;
        const g = this.scene.add.graphics();
        g.fillStyle(GAME_CONFIG.COLOR_FIRE, 1);
        g.fillTriangle(-size/2, size/2, 0, -size/2, size/2, size/2);
        g.fillStyle(0xFFAA00, 1);
        g.fillTriangle(-size/4, size/2, 0, -size/4, size/4, size/2);
        g.x = x; g.y = y;
        // 用 zone 做物理体
        this.visual = this.scene.add.zone(x, y, size, size);
        this.scene.physics.add.existing(this.visual);
        this.visual.body.setAllowGravity(false);
        this.visual.body.setVelocityX(speed);
        this.visualGraphic = g;
        this.decorations.push(g);
    }

    createRock(x, groundY, speed) {
        const size = 36;
        const y = groundY - size / 2;
        this.visual = this.scene.add.rectangle(x, y, size, size, GAME_CONFIG.COLOR_ROCK);
        this.scene.physics.add.existing(this.visual);
        this.visual.body.setAllowGravity(false);
        this.visual.body.setVelocityX(speed);
        // 装饰：顶部一道高光
        const top = this.scene.add.rectangle(x, y - size/2 + 3, size - 6, 4, 0x999999);
        this.decorations.push(top);
    }

    createFlyRock(x, groundY, speed) {
        // 空中飞石，高度在跳跃可达区域
        const r = 18;
        const y = groundY - 100;  // 离地 100px 高
        this.visual = this.scene.add.circle(x, y, r, GAME_CONFIG.COLOR_FLY_ROCK);
        this.scene.physics.add.existing(this.visual);
        this.visual.body.setCircle(r);
        this.visual.body.setAllowGravity(false);
        this.visual.body.setVelocityX(speed);
        // 装饰：小高光
        const hi = this.scene.add.circle(x - 5, y - 5, 3, 0xCCCCCC);
        this.decorations.push(hi);
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
        this.decorations.forEach(d => { d.x += dx; });

        // 离屏销毁
        if (this.visual.x < -100) {
            this.destroy();
            return true;
        }
        return false;
    }

    destroy() {
        if (this.visual && this.visual.active) this.visual.destroy();
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
