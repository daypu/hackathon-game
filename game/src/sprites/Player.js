/**
 * Player 基类 - 玩家角色的通用行为
 *
 * 设计：组合而非继承 Phaser 对象
 * 内部持有 visual（Rectangle/Circle）+ body（独立挂载的 Arcade body）
 * Wukong/Bajie 继承此类，只重写差异部分
 */
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.size = GAME_CONFIG.PLAYER_SIZE;
        this.jumpPower = GAME_CONFIG.JUMP_POWER;
        this.color = 0xFFFFFF;            // 子类覆盖
        this.type = 'base';               // 子类覆盖：'wukong' | 'bajie'

        this.isAlive = true;
        this.isInvincible = false;        // 八戒技能时为 true
        this.skillCooldown = 0;           // 当前剩余冷却（毫秒）
        this.skillMaxCD = 10000;          // 子类覆盖

        // 由子类调用 createVisual() 创建 sprite/visual
        this.visual = null;     // 主体形状
        this.decorations = [];  // 装饰图层（眼睛、金箍等）
    }

    /**
     * 子类负责实现：创建视觉对象
     * 必须给 this.visual 赋值，并 add physics body
     */
    createVisual() {
        throw new Error('子类必须实现 createVisual()');
    }

    /**
     * 跳跃 - 仅在地面时生效
     */
    jump() {
        if (!this.isAlive) return;
        const body = this.visual.body;
        if (body.blocked.down || body.touching.down) {
            body.setVelocityY(-this.jumpPower);
        }
    }

    /**
     * 克制系统：判断能否安全通过此障碍
     * @param {Obstacle} obstacle
     * @returns {boolean} true=安全穿过, false=碰到就死
     */
    canPass(obstacle) {
        return false;  // 基类默认全部致命，子类按类型放行
    }

    /**
     * 释放技能 - 子类实现
     * @returns {boolean} 是否成功释放
     */
    useSkill() {
        if (this.skillCooldown > 0) return false;
        this.skillCooldown = this.skillMaxCD;
        return true;
    }

    /**
     * 死亡处理
     */
    die() {
        this.isAlive = false;
        this.visual.fillColor = 0x666666;
        const body = this.visual.body;
        if (body) body.setVelocity(0, 0);
    }

    /**
     * 销毁 - 切换角色时调用
     */
    destroy() {
        if (this.visual) this.visual.destroy();
        this.decorations.forEach(d => d.destroy());
        this.decorations = [];
    }

    /**
     * 每帧更新（位置、装饰图层、冷却时间）
     */
    update(time, delta) {
        if (this.skillCooldown > 0) {
            this.skillCooldown = Math.max(0, this.skillCooldown - delta);
        }
        this.updateDecorations();
    }

    /**
     * 子类实现：让装饰图层（眼睛等）跟随主体
     */
    updateDecorations() {
        // 子类覆盖
    }

    /**
     * 获取碰撞包围盒（供 GameScene 手动检测使用）
     */
    getBounds() {
        return this.visual.getBounds();
    }
}
