/**
 * BossPlayer - Boss 战里的玩家形态
 *
 * 跟跑酷里的 Wukong/Bajie 用同样的视觉（橙方块/粉圆），但站着不动。
 * 持有切换 + 技能 CD 状态，技能效果由 BossScene 触发（消灭小妖怪/无敌护盾）。
 *
 * 不挂物理 body —— Boss 战不需要物理碰撞，所有命中用距离判定。
 */
class BossPlayer {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.currentRole = 'wukong';        // 'wukong' | 'bajie'
        this.decorations = [];               // 当前角色的所有视觉元素

        // 技能 CD（Boss 战版本，比跑酷短）
        this.wukongCD = 0;
        this.bajieCD = 0;
        this.wukongMaxCD = GAME_CONFIG.BOSS_WUKONG_SKILL_CD;
        this.bajieMaxCD = GAME_CONFIG.BOSS_BAJIE_SKILL_CD;

        // 八戒无敌状态（小妖怪不能靠近）
        this.shieldActive = false;
        this.shieldEndTime = 0;
        this.shieldVisual = null;

        this.draw();
    }

    /**
     * 根据 currentRole 重绘视觉
     */
    draw() {
        this.clear();
        if (this.currentRole === 'wukong') {
            this.drawWukong();
        } else {
            this.drawBajie();
        }
    }

    drawWukong() {
        const size = GAME_CONFIG.PLAYER_SIZE;
        // 橙色方块主体
        const body = this.scene.add.rectangle(this.x, this.y, size, size, GAME_CONFIG.COLOR_WUKONG);
        body.setDepth(100);
        // 眼睛
        const eye = this.scene.add.circle(this.x + 8, this.y - 4, 3, 0xFFFFFF).setDepth(101);
        const pupil = this.scene.add.circle(this.x + 8, this.y - 4, 1.5, 0x000000).setDepth(102);
        // 金箍
        const crown = this.scene.add.graphics().setDepth(101);
        crown.lineStyle(2, 0xFFD700, 1);
        crown.strokeRect(this.x - size/2, this.y - size/2 - 2, size, 4);
        // 头顶 label
        const label = this.scene.add.text(this.x, this.y - size/2 - 18, '悟空', {
            fontSize: '14px', color: '#FF6600', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(103);
        this.decorations.push(body, eye, pupil, crown, label);
        this.body = body;
    }

    drawBajie() {
        const size = GAME_CONFIG.PLAYER_BAJIE_SIZE;
        // 粉紫圆形主体
        const body = this.scene.add.circle(this.x, this.y, size / 2, GAME_CONFIG.COLOR_BAJIE).setDepth(100);
        // 双眼
        const le = this.scene.add.circle(this.x - 6, this.y - 6, 3, 0xFFFFFF).setDepth(101);
        const re = this.scene.add.circle(this.x + 6, this.y - 6, 3, 0xFFFFFF).setDepth(101);
        const lp = this.scene.add.circle(this.x - 6, this.y - 6, 1.5, 0x000000).setDepth(102);
        const rp = this.scene.add.circle(this.x + 6, this.y - 6, 1.5, 0x000000).setDepth(102);
        // 耳朵
        const ears = this.scene.add.graphics().setDepth(101);
        ears.fillStyle(GAME_CONFIG.COLOR_BAJIE, 1);
        ears.fillTriangle(this.x - 16, this.y - 14, this.x - 8, this.y - 22, this.x - 6, this.y - 12);
        ears.fillTriangle(this.x + 6, this.y - 12, this.x + 8, this.y - 22, this.x + 16, this.y - 14);
        // 头顶 label
        const label = this.scene.add.text(this.x, this.y - size/2 - 18, '八戒', {
            fontSize: '14px', color: '#FF69B4', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(103);
        this.decorations.push(body, le, re, lp, rp, ears, label);
        this.body = body;
    }

    clear() {
        this.decorations.forEach(d => d.destroy());
        this.decorations = [];
    }

    /**
     * 切角色
     */
    switchTo(role) {
        if (this.currentRole === role) return;
        this.currentRole = role;
        this.draw();
        // 切换闪光
        const flash = this.scene.add.circle(this.x, this.y, 10, 0xFFFFFF).setDepth(200);
        this.scene.tweens.add({
            targets: flash,
            radius: 60,
            alpha: 0,
            duration: 300,
            onComplete: () => flash.destroy(),
        });
    }

    /**
     * 释放当前角色技能
     * 返回：{ ok, type, effect }
     *   ok=false: CD 中
     *   type='sweep': 悟空消灭一排小妖怪
     *   type='shield': 八戒护盾（一段时间内小妖怪不能靠近）
     */
    useSkill() {
        if (this.currentRole === 'wukong') {
            if (this.wukongCD > 0) return { ok: false };
            this.wukongCD = this.wukongMaxCD;
            return { ok: true, type: 'sweep' };
        } else {
            if (this.bajieCD > 0) return { ok: false };
            this.bajieCD = this.bajieMaxCD;
            this.shieldActive = true;
            this.shieldEndTime = this.scene.time.now + GAME_CONFIG.BOSS_BAJIE_SHIELD_DURATION;
            this.spawnShieldVisual();
            return { ok: true, type: 'shield' };
        }
    }

    spawnShieldVisual() {
        if (this.shieldVisual) this.shieldVisual.destroy();
        // 金色光环
        this.shieldVisual = this.scene.add.circle(this.x, this.y, 50, 0xFFD700, 0.25).setDepth(50);
        this.shieldVisual.setStrokeStyle(3, 0xFFEE44, 0.8);
        // 脉动
        this.scene.tweens.add({
            targets: this.shieldVisual,
            scale: { from: 1, to: 1.15 },
            alpha: { from: 0.25, to: 0.4 },
            duration: 400,
            yoyo: true,
            repeat: -1,
        });
    }

    /**
     * 每帧更新（CD + 护盾持续）
     */
    update(time, delta) {
        if (this.wukongCD > 0) this.wukongCD = Math.max(0, this.wukongCD - delta);
        if (this.bajieCD > 0) this.bajieCD = Math.max(0, this.bajieCD - delta);

        if (this.shieldActive && time >= this.shieldEndTime) {
            this.shieldActive = false;
            if (this.shieldVisual) {
                this.scene.tweens.killTweensOf(this.shieldVisual);
                this.scene.tweens.add({
                    targets: this.shieldVisual,
                    alpha: 0,
                    scale: 1.5,
                    duration: 200,
                    onComplete: () => {
                        if (this.shieldVisual) {
                            this.shieldVisual.destroy();
                            this.shieldVisual = null;
                        }
                    },
                });
            }
        }
    }

    /**
     * 受击震动
     */
    hitFlash() {
        this.decorations.forEach(d => {
            this.scene.tweens.add({
                targets: d,
                x: d.x + 6,
                duration: 50,
                yoyo: true,
                repeat: 2,
            });
        });
    }

    /**
     * 获取碰撞距离判定中心
     */
    getCenter() {
        return { x: this.x, y: this.y };
    }

    destroy() {
        this.clear();
        if (this.shieldVisual) this.shieldVisual.destroy();
    }
}
