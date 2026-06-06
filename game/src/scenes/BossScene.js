/**
 * BossScene - Boss 战场景（铁扇公主）
 *
 * 核心玩法：
 *   玩家用鼠标画弧 → 扇风 → 攻击 Boss
 *   速度越快、弧度越完整、连击越高 → 伤害越高
 *   Boss 会扔火球，火球可被画弧扇飞
 *
 * 进入：GameScene 跑酷 30s 后碰到 Boss 触发
 * 退出：Boss 死 → ResultScene(win) / 失败 → ResultScene(lose)
 *
 * data: { score: number }  来自 GameScene 的跑酷分数
 */
class BossScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossScene' });
    }

    init(data) {
        this.parkourScore = data.score || 0;
    }

    create() {
        console.log('[BossScene] create() called, parkourScore=', this.parkourScore);

        // === 状态 ===
        this.startTime = -1;  // 在第一次 update 里设为 time（避免 this.time.now 和 update 的 time 不同步）
        this.isOver = false;
        this.hitCount = 0;
        this.dealtDamage = 0;
        this.maxCombo = 0;
        this.lastFireballTime = 0;   // 0 表示立即可以扔（首帧检查就触发首发火球）
        this.firstFireballDelay = 1500;  // 但 Boss 入场后稍等一下再扔
        this.fireballs = [];

        // === 背景：火焰山顶（更红更暴怒） ===
        this.cameras.main.setBackgroundColor(0x4a1408);
        this.drawBackdrop();

        // === Boss ===
        this.boss = new Tieshan(this, GAME_CONFIG.WIDTH - 150, 250);

        // === 玩家小图标（左下，仅显示） ===
        this.playerIcon = this.add.circle(80, GAME_CONFIG.HEIGHT - 90, 18, 0xFF6600);
        this.add.text(80, GAME_CONFIG.HEIGHT - 90, '悟', {
            fontSize: '20px', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);

        // === 手势识别 ===
        this.gesture = new GestureRecognizer(this);
        this.gesture.onArc((result) => this.onArcGesture(result));

        // === UI ===
        this.createUI();

        // === Boss 入场提示 ===
        const titleBg = this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 600, 100, 0x000000, 0.7);
        const title = this.add.text(
            GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 15,
            '铁扇公主拦路！', {
            fontSize: '42px', color: '#FF6666', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);
        const sub = this.add.text(
            GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 25,
            '鼠标画弧 = 扇风 │ 越快越完整伤害越高', {
            fontSize: '18px', color: '#FFCC88'
        }).setOrigin(0.5);
        this.time.delayedCall(1800, () => {
            this.tweens.add({
                targets: [titleBg, title, sub],
                alpha: 0,
                duration: 400,
                onComplete: () => { titleBg.destroy(); title.destroy(); sub.destroy(); }
            });
        });

        // ESC / R 重玩快捷键
        this.input.keyboard.on('keydown-R', () => this.scene.restart({ score: this.parkourScore }));
    }

    drawBackdrop() {
        // 远山（更高更尖，火焰山顶）
        const g = this.add.graphics();
        g.fillStyle(0x2a0808, 1);
        const baseY = GAME_CONFIG.HEIGHT - 60;
        for (let x = 0; x < GAME_CONFIG.WIDTH; x += 140) {
            const h = 180 + Phaser.Math.Between(-30, 80);
            g.fillTriangle(x - 80, baseY, x, baseY - h, x + 80, baseY);
        }
        // 地面
        g.fillStyle(0x6B2E10, 1);
        g.fillRect(0, baseY, GAME_CONFIG.WIDTH, 60);
        g.fillStyle(0xA04020, 1);
        g.fillRect(0, baseY, GAME_CONFIG.WIDTH, 4);

        // 飘动的火星粒子（背景氛围）
        for (let i = 0; i < 12; i++) {
            const ember = this.add.circle(
                Phaser.Math.Between(0, GAME_CONFIG.WIDTH),
                Phaser.Math.Between(100, GAME_CONFIG.HEIGHT - 80),
                Phaser.Math.Between(2, 4),
                0xFF6633, 0.6
            );
            this.tweens.add({
                targets: ember,
                y: ember.y - 80,
                alpha: 0,
                duration: Phaser.Math.Between(2000, 4000),
                repeat: -1,
            });
        }
    }

    createUI() {
        // Boss 血条
        this.hpBarBg = this.add.rectangle(GAME_CONFIG.WIDTH / 2, 30, 600, 28, 0x000000, 0.6);
        this.hpBar = this.add.rectangle(
            GAME_CONFIG.WIDTH / 2 - 300, 30, 600, 22, 0xFF3344
        ).setOrigin(0, 0.5);
        this.hpText = this.add.text(
            GAME_CONFIG.WIDTH / 2, 30,
            `铁扇公主  ${this.boss.hp}/${this.boss.hpMax}`,
            { fontSize: '16px', color: '#FFFFFF', fontStyle: 'bold' }
        ).setOrigin(0.5);

        // 倒计时
        this.timerText = this.add.text(20, 60, '⏱ 20.0s', {
            fontSize: '24px', color: '#FFD700', fontStyle: 'bold'
        });

        // 被击中次数
        this.hitText = this.add.text(20, 90, `❤ 剩余 ${GAME_CONFIG.BOSS_FIREBALL_HIT_LIMIT}`, {
            fontSize: '20px', color: '#FF6688', fontStyle: 'bold'
        });

        // 连击显示（居中偏上，大字）
        this.comboText = this.add.text(GAME_CONFIG.WIDTH / 2, 110, '', {
            fontSize: '36px', color: '#FFD700', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);

        // 操作提示
        this.add.text(
            GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 20,
            '按住鼠标画弧 = 扇风攻击 │ 画弧穿过火球 = 扇飞反击 │ R=重打',
            { fontSize: '12px', color: '#888888' }
        ).setOrigin(0.5);
    }

    /**
     * 玩家画了一道弧
     */
    onArcGesture(result) {
        if (this.isOver) return;

        // 先检查是否扇飞了火球
        let deflectedAny = false;
        this.fireballs.forEach(fb => {
            if (fb.alive && !fb.deflected) {
                if (this.gestureHitsFireball(result, fb)) {
                    fb.deflect(this.boss.x, this.boss.y);
                    deflectedAny = true;
                    // 扇飞特效：蓝光
                    this.cameras.main.flash(80, 100, 180, 255);
                }
            }
        });

        if (!result.valid) {
            // 无效弧，但若扇飞了火球也算成功
            if (deflectedAny) {
                this.showFloatingText('扇飞！', GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, '#88CCFF', 28);
            }
            return;
        }

        // 造成伤害
        this.boss.takeDamage(result.damage, result.isPerfect);
        this.dealtDamage += result.damage;

        if (result.combo > this.maxCombo) this.maxCombo = result.combo;

        // 连击显示
        if (result.combo >= 2) {
            this.comboText.setText(`连击 ×${result.combo}`);
            this.comboText.setAlpha(1);
            this.tweens.killTweensOf(this.comboText);
            this.tweens.add({
                targets: this.comboText,
                scale: { from: 1.3, to: 1 },
                alpha: { from: 1, to: 0 },
                duration: 800,
            });
        }

        // 完美打击
        if (result.isPerfect) {
            this.cameras.main.flash(120, 255, 220, 100);
            this.cameras.main.shake(100, 0.008);
            this.showFloatingText('PERFECT!', GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 50, '#FFD700', 40);
        }

        // 检查 Boss 死亡
        if (this.boss.isDead()) {
            this.win();
        }
    }

    /**
     * 弧线是否穿过火球
     */
    gestureHitsFireball(result, fb) {
        if (!result.points || result.points.length < 2) return false;
        return result.points.some(p => fb.hitsPoint(p.x, p.y, 35));
    }

    showFloatingText(text, x, y, color, size) {
        const t = this.add.text(x, y, text, {
            fontSize: `${size}px`, color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(3000);
        this.tweens.add({
            targets: t,
            y: y - 50,
            alpha: 0,
            duration: 900,
            onComplete: () => t.destroy(),
        });
    }

    /**
     * Boss 扔火球
     */
    spawnFireball() {
        if (this.isOver) return;
        // 目标：玩家小图标位置附近
        const tx = this.playerIcon.x + Phaser.Math.Between(-50, 50);
        const ty = this.playerIcon.y + Phaser.Math.Between(-30, 30);
        const fb = new Fireball(this, this.boss.x - 50, this.boss.y - 20, tx, ty);
        this.fireballs.push(fb);
        // Boss 扇子动一下
        this.tweens.add({
            targets: this.boss.fanG,
            angle: { from: -20, to: 20 },
            duration: 200,
            yoyo: true,
        });
    }

    /**
     * 玩家被火球击中
     */
    onPlayerHit(fb) {
        fb.destroy();
        this.hitCount++;
        this.cameras.main.shake(180, 0.012);
        this.cameras.main.flash(120, 255, 80, 80);
        this.hitText.setText(`❤ 剩余 ${Math.max(0, GAME_CONFIG.BOSS_FIREBALL_HIT_LIMIT - this.hitCount)}`);

        // 玩家图标震动
        this.tweens.add({
            targets: this.playerIcon,
            x: this.playerIcon.x + 10,
            duration: 50,
            yoyo: true,
            repeat: 3,
        });

        if (this.hitCount >= GAME_CONFIG.BOSS_FIREBALL_HIT_LIMIT) {
            this.lose('被火球击败');
        }
    }

    win() {
        if (this.isOver) return;
        this.isOver = true;
        this.cameras.main.flash(400, 255, 255, 200);
        this.cameras.main.shake(400, 0.02);
        this.boss.destroy();

        this.time.delayedCall(900, () => {
            this.scene.start('ResultScene', {
                win: true,
                parkourScore: this.parkourScore,
                bossDamage: this.dealtDamage,
                maxCombo: this.maxCombo,
                hitsTaken: this.hitCount,
                timeLeft: this.getTimeLeft(),
            });
        });
    }

    lose(reason) {
        if (this.isOver) return;
        this.isOver = true;
        this.cameras.main.shake(300, 0.02);
        this.cameras.main.flash(200, 255, 0, 0);

        this.time.delayedCall(700, () => {
            this.scene.start('ResultScene', {
                win: false,
                reason: reason,
                parkourScore: this.parkourScore,
                bossDamage: this.dealtDamage,
                bossHpLeft: this.boss.hp,
                maxCombo: this.maxCombo,
            });
        });
    }

    getTimeLeft() {
        if (this.startTime < 0) return GAME_CONFIG.BOSS_TIME_LIMIT / 1000;  // 初始化期间返回满血
        const elapsed = this.time.now - this.startTime;
        return Math.max(0, GAME_CONFIG.BOSS_TIME_LIMIT - elapsed) / 1000;
    }

    update(time, delta) {
        if (this.isOver) return;

        // 第一次 update：把 startTime 设为当前帧时间（避免 create 里的 this.time.now 和 update 的 time 不同步）
        if (this.startTime < 0) {
            this.startTime = time;
            console.log('[BossScene] first update, startTime=', this.startTime, 'time_limit=', GAME_CONFIG.BOSS_TIME_LIMIT);
        }

        // 倒计时
        const left = this.getTimeLeft();
        this.timerText.setText(`⏱ ${left.toFixed(1)}s`);
        if (left < 5) this.timerText.setColor('#FF4444');

        // 时间到
        if (left <= 0) {
            console.log('[BossScene] TIMEOUT triggered, elapsed=', this.time.now - this.startTime, 'time=', time);
            this.lose('时间不够');
            return;
        }

        // Boss 扔火球（基于已经过了多少时间）
        const elapsed = time - this.startTime;
        const interval = this.boss.getFireballInterval();
        if (elapsed > this.firstFireballDelay && time - this.lastFireballTime > interval) {
            this.spawnFireball();
            this.lastFireballTime = time;
        }

        // 更新火球
        this.fireballs.forEach(fb => fb.update(delta));

        // 火球碰撞：玩家 OR 被扇飞回 Boss
        this.fireballs = this.fireballs.filter(fb => {
            if (!fb.alive) return false;
            if (!fb.deflected) {
                // 击中玩家？
                if (fb.hitsPoint(this.playerIcon.x, this.playerIcon.y, 22)) {
                    this.onPlayerHit(fb);
                    return false;
                }
            } else {
                // 被扇飞 → 检查是否命中 Boss
                if (fb.hitsPoint(this.boss.x, this.boss.y, 55)) {
                    const dmg = 15;  // 扇飞反击固定伤害
                    this.boss.takeDamage(dmg, false);
                    this.dealtDamage += dmg;
                    fb.destroy();
                    if (this.boss.isDead()) this.win();
                    return false;
                }
            }
            return true;
        });

        // 更新血条 UI
        const ratio = this.boss.hp / this.boss.hpMax;
        this.hpBar.setScale(ratio, 1);
        if (ratio > 0.66)      this.hpBar.setFillStyle(0xFF3344);
        else if (ratio > 0.33) this.hpBar.setFillStyle(0xFF8833);
        else                   this.hpBar.setFillStyle(0xFFCC33);
        this.hpText.setText(`铁扇公主  ${this.boss.hp}/${this.boss.hpMax}`);

        // 阶段 3 暴怒视觉
        if (this.boss.getPhase() === 3 && !this.ragingApplied) {
            this.ragingApplied = true;
            this.cameras.main.setBackgroundColor(0x6a0808);
        }
    }
}
