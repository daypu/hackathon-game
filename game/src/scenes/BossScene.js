/**
 * BossScene - Boss 战场景（铁扇公主）
 *
 * 核心玩法（创新版）：
 *   1. 鼠标画弧 = 扇风攻击 Boss / 扇飞火球（保留）
 *   2. 玩家形态跟跑酷一样（悟空橙方块 / 八戒粉圆），站在左下，能切角色
 *   3. 1 键切悟空，2 键切八戒，J 键放技能
 *      - 悟空技能：金箍棒横扫 → 消灭屏幕内所有小妖怪
 *      - 八戒技能：金光护盾 → 一段时间内小妖怪靠近就被推开
 *   4. 小妖怪从右边不断冲向玩家，撞到 = 扣 1 次容错（和火球同算）
 *   5. 玩家画弧扫到小妖怪也能杀死
 *   6. 技能 CD 短，鼓励切换 + 放技能管理小怪压力
 *
 * 失败条件：被击中（火球 + 小妖怪）≥ BOSS_FIREBALL_HIT_LIMIT 次 OR 倒计时归零
 * 胜利条件：把 Boss 血量打到 0
 */
class BossScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossScene' });
    }

    init(data) {
        this.parkourScore = data.score || 0;
        this.fromRole = data.role || 'wukong';  // 跑酷里最后用的角色，开局沿用
    }

    create() {
        console.log('[BossScene] create() called, parkourScore=', this.parkourScore, 'role=', this.fromRole);

        // === 状态 ===
        this.startTime = -1;
        this.isOver = false;
        this.hitCount = 0;
        this.dealtDamage = 0;
        this.maxCombo = 0;
        this.skillUsedCount = 0;  // 用了几次技能（结算可展示）
        this.lastFireballTime = 0;
        this.firstFireballDelay = 1800;
        this.lastMonsterTime = 0;
        this.fireballs = [];
        this.monsters = [];

        // === 背景 ===
        this.cameras.main.setBackgroundColor(0x4a1408);
        this.drawBackdrop();

        // === Boss ===
        this.boss = new Tieshan(this, GAME_CONFIG.WIDTH - 150, 250);

        // === 玩家（跟跑酷一样的形态：悟空方块/八戒圆） ===
        const playerX = 110;
        const playerY = GAME_CONFIG.HEIGHT - 110;
        this.player = new BossPlayer(this, playerX, playerY);
        if (this.fromRole === 'bajie') {
            this.player.switchTo('bajie');
        }

        // === 输入 ===
        this.setupInput();

        // === 手势识别 ===
        this.gesture = new GestureRecognizer(this);
        this.gesture.onArc((result) => this.onArcGesture(result));

        // === UI ===
        this.createUI();

        // === Boss 入场提示 ===
        this.showEntryBanner();

        // ESC / R 重玩
        this.input.keyboard.on('keydown-R', () => this.scene.start('GameScene'));
    }

    setupInput() {
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    }

    showEntryBanner() {
        const titleBg = this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 680, 110, 0x000000, 0.7);
        const title = this.add.text(
            GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 18,
            '铁扇公主拦路！', {
            fontSize: '42px', color: '#FF6666', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);
        const sub = this.add.text(
            GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 25,
            '鼠标画弧=攻击 │ 1悟空 2八戒 │ J放技能（清妖/护盾）', {
            fontSize: '17px', color: '#FFCC88'
        }).setOrigin(0.5);
        this.time.delayedCall(2200, () => {
            this.tweens.add({
                targets: [titleBg, title, sub],
                alpha: 0,
                duration: 400,
                onComplete: () => { titleBg.destroy(); title.destroy(); sub.destroy(); }
            });
        });
    }

    drawBackdrop() {
        // 火焰山像素背景图
        const bg = this.add.image(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 'huoyanshan');
        bg.setDisplaySize(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        bg.setDepth(-10);
        // Boss 战暗化覆盖层（比跑酷更暗，营造决战氛围）
        const dim = this.add.rectangle(
            GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2,
            GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT,
            0x4a0808, 0.4
        );
        dim.setDepth(-9);

        // 地面横条（保留：让玩家有"地"的感觉）
        const baseY = GAME_CONFIG.HEIGHT - 60;
        const g = this.add.graphics().setDepth(-5);
        g.fillStyle(0x6B2E10, 0.85);
        g.fillRect(0, baseY, GAME_CONFIG.WIDTH, 60);
        g.fillStyle(0xA04020, 1);
        g.fillRect(0, baseY, GAME_CONFIG.WIDTH, 4);

        // 飘动的火星粒子（保留：动态氛围）
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
        this.timerText = this.add.text(20, 60, '⏱ 25.0s', {
            fontSize: '24px', color: '#FFD700', fontStyle: 'bold'
        });

        // 剩余容错
        this.hitText = this.add.text(20, 90, `❤ 剩余 ${GAME_CONFIG.BOSS_FIREBALL_HIT_LIMIT}`, {
            fontSize: '20px', color: '#FF6688', fontStyle: 'bold'
        });

        // 连击显示
        this.comboText = this.add.text(GAME_CONFIG.WIDTH / 2, 110, '', {
            fontSize: '36px', color: '#FFD700', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);

        // 底部角色卡片 + 技能 CD
        this.createRoleCards();

        // 操作提示
        this.add.text(
            GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 18,
            '画弧=攻击Boss/扫妖 │ 1悟空 2八戒切角色 │ J=技能 │ R=重打',
            { fontSize: '15px', color: '#FFFFFF', fontStyle: 'bold' }
        ).setOrigin(0.5);
    }

    createRoleCards() {
        const cardY = GAME_CONFIG.HEIGHT - 70;
        const cardW = 145, cardH = 50;

        // 悟空卡片：右下角，避开玩家视野（可点击切换）
        this.wukongCard = this.add.rectangle(
            GAME_CONFIG.WIDTH - 240, cardY, cardW, cardH, GAME_CONFIG.COLOR_WUKONG, 0.85
        ).setInteractive({ useHandCursor: true });
        this.wukongCard.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();   // 别让点击触发画弧手势
            this.player.switchTo('wukong');
        });
        this.add.text(GAME_CONFIG.WIDTH - 240, cardY - 10, '悟空 [1]  J=清妖', {
            fontSize: '13px', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.wukongCDText = this.add.text(GAME_CONFIG.WIDTH - 240, cardY + 10, '就绪', {
            fontSize: '12px', color: '#FFFFFF'
        }).setOrigin(0.5);

        // 八戒卡片（可点击切换）
        this.bajieCard = this.add.rectangle(
            GAME_CONFIG.WIDTH - 85, cardY, cardW, cardH, GAME_CONFIG.COLOR_BAJIE, 0.85
        ).setInteractive({ useHandCursor: true });
        this.bajieCard.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            this.player.switchTo('bajie');
        });
        this.add.text(GAME_CONFIG.WIDTH - 85, cardY - 10, '八戒 [2]  J=护盾', {
            fontSize: '13px', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.bajieCDText = this.add.text(GAME_CONFIG.WIDTH - 85, cardY + 10, '就绪', {
            fontSize: '12px', color: '#FFFFFF'
        }).setOrigin(0.5);

        this.activeCardBorder = this.add.graphics();
        this.updateActiveCardBorder();
    }

    updateActiveCardBorder() {
        this.activeCardBorder.clear();
        this.activeCardBorder.lineStyle(3, 0xFFFF00, 1);
        const card = (this.player.currentRole === 'wukong') ? this.wukongCard : this.bajieCard;
        this.activeCardBorder.strokeRect(
            card.x - card.width / 2 - 2,
            card.y - card.height / 2 - 2,
            card.width + 4, card.height + 4
        );
    }

    updateSkillCDText() {
        const wCd = this.player.wukongCD;
        const bCd = this.player.bajieCD;
        if (wCd <= 0) {
            this.wukongCDText.setText('就绪');
            this.wukongCDText.setColor('#00FF88');
        } else {
            this.wukongCDText.setText(`冷却 ${(wCd / 1000).toFixed(1)}s`);
            this.wukongCDText.setColor('#FFFFFF');
        }
        if (bCd <= 0) {
            this.bajieCDText.setText(this.player.shieldActive ? '护盾中' : '就绪');
            this.bajieCDText.setColor(this.player.shieldActive ? '#FFD700' : '#00FF88');
        } else {
            this.bajieCDText.setText(`冷却 ${(bCd / 1000).toFixed(1)}s`);
            this.bajieCDText.setColor('#FFFFFF');
        }
    }

    /**
     * 玩家画了一道弧 —— 同时检查：扇飞火球 + 攻击 Boss + 扫死小妖怪
     */
    onArcGesture(result) {
        if (this.isOver) return;

        // (a) 扇飞火球
        let deflectedAny = false;
        this.fireballs.forEach(fb => {
            if (fb.alive && !fb.deflected) {
                if (this.gestureHitsFireball(result, fb)) {
                    fb.deflect(this.boss.x, this.boss.y);
                    deflectedAny = true;
                    this.cameras.main.flash(80, 100, 180, 255);
                }
            }
        });

        // (b) 扫死路径上的小妖怪
        let killedMonsters = 0;
        if (result.points && result.points.length >= 2) {
            this.monsters.forEach(m => {
                if (m.alive && result.points.some(p => m.hitsPoint(p.x, p.y, 18))) {
                    m.kill();
                    killedMonsters++;
                }
            });
        }
        if (killedMonsters > 0) {
            this.showFloatingText(`斩 ×${killedMonsters}`, GAME_CONFIG.WIDTH / 2 - 100, GAME_CONFIG.HEIGHT / 2, '#88FF88', 22);
        }

        // (c) 攻击 Boss
        if (!result.valid) {
            if (deflectedAny) {
                this.showFloatingText('扇飞！', GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, '#88CCFF', 28);
            }
            return;
        }

        this.boss.takeDamage(result.damage, result.isPerfect);
        this.dealtDamage += result.damage;

        if (result.combo > this.maxCombo) this.maxCombo = result.combo;

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

        if (result.isPerfect) {
            this.cameras.main.flash(120, 255, 220, 100);
            this.cameras.main.shake(100, 0.008);
            this.showFloatingText('PERFECT!', GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 50, '#FFD700', 40);
        }

        if (this.boss.isDead()) {
            this.win();
        }
    }

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
     * 释放当前角色技能
     */
    onSkillPressed() {
        if (this.isOver) return;
        const res = this.player.useSkill();
        if (!res.ok) {
            // CD 中，提示一下
            this.showFloatingText('技能冷却中', this.player.x, this.player.y - 50, '#FF6666', 16);
            return;
        }
        this.skillUsedCount++;

        if (res.type === 'sweep') {
            // 悟空：金箍棒横扫，杀掉屏幕内所有小妖怪
            const killed = this.monsters.filter(m => m.alive).length;
            this.monsters.forEach(m => { if (m.alive) m.kill(); });

            // 屏幕闪光
            this.cameras.main.flash(200, 255, 200, 50);
            // 金色横扫光带
            const sweep = this.add.rectangle(
                GAME_CONFIG.WIDTH / 2, this.player.y,
                GAME_CONFIG.WIDTH * 1.2, 22, 0xFFD700
            ).setAlpha(0.9).setDepth(450);
            this.tweens.add({
                targets: sweep,
                scaleY: 0,
                alpha: 0,
                duration: 500,
                onComplete: () => sweep.destroy(),
            });
            this.showFloatingText(`金箍棒横扫！斩 ×${killed}`, GAME_CONFIG.WIDTH / 2, this.player.y - 60, '#FFD700', 24);
        } else if (res.type === 'shield') {
            // 八戒：护盾光环（小妖怪靠近就被推开，update 里处理）
            this.cameras.main.flash(120, 255, 220, 100);
            this.showFloatingText('金光护盾！', this.player.x, this.player.y - 60, '#FFD700', 22);
        }
    }

    /**
     * Boss 扔火球（可能多发）
     */
    spawnFireballs() {
        if (this.isOver) return;
        const phase = this.boss.getPhase();
        let count = 1;
        if (phase === 2) count = GAME_CONFIG.BOSS_FIREBALL_MULTI_PHASE2;
        else if (phase === 3) count = GAME_CONFIG.BOSS_FIREBALL_MULTI_PHASE3;

        const tx = this.player.x;
        const ty = this.player.y;
        const baseAngle = Math.atan2(ty - this.boss.y, tx - this.boss.x);
        const spreadRad = Phaser.Math.DegToRad(GAME_CONFIG.BOSS_FIREBALL_SPREAD);

        for (let i = 0; i < count; i++) {
            // 多发：左右散开
            const offset = (count === 1) ? 0 : (i - (count - 1) / 2) * spreadRad;
            const angle = baseAngle + offset;
            const dist = 600;  // 目标点距离（影响 vx/vy 方向）
            const targetX = this.boss.x + Math.cos(angle) * dist;
            const targetY = this.boss.y + Math.sin(angle) * dist;
            const fb = new Fireball(this, this.boss.x - 50, this.boss.y - 20, targetX, targetY);
            this.fireballs.push(fb);
        }

        // Boss 扇子动一下
        this.tweens.add({
            targets: this.boss.fanG,
            angle: { from: -20, to: 20 },
            duration: 200,
            yoyo: true,
        });
    }

    /**
     * 生成一个小妖怪（从右上某处冲向玩家）
     */
    spawnMonster() {
        if (this.isOver) return;
        const fromX = GAME_CONFIG.WIDTH + 30;
        // 高度随机：地上 / 半空，两种姿态混着出
        const fromY = Phaser.Math.Between(GAME_CONFIG.HEIGHT - 180, GAME_CONFIG.HEIGHT - 80);
        const m = new BossMonster(this, fromX, fromY, this.player.x, this.player.y);
        this.monsters.push(m);
    }

    /**
     * 玩家被火球击中
     */
    onPlayerHit(source) {
        this.hitCount++;
        this.cameras.main.shake(180, 0.012);
        this.cameras.main.flash(120, 255, 80, 80);
        this.hitText.setText(`❤ 剩余 ${Math.max(0, GAME_CONFIG.BOSS_FIREBALL_HIT_LIMIT - this.hitCount)}`);
        this.player.hitFlash();

        if (this.hitCount >= GAME_CONFIG.BOSS_FIREBALL_HIT_LIMIT) {
            this.lose(source === 'monster' ? '被妖怪击败' : '被火球击败');
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
                skillUsed: this.skillUsedCount,
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
                skillUsed: this.skillUsedCount,
            });
        });
    }

    getTimeLeft() {
        if (this.startTime < 0) return GAME_CONFIG.BOSS_TIME_LIMIT / 1000;
        const elapsed = this.time.now - this.startTime;
        return Math.max(0, GAME_CONFIG.BOSS_TIME_LIMIT - elapsed) / 1000;
    }

    update(time, delta) {
        if (this.isOver) return;

        // 第一次 update：把 startTime 设为当前帧时间
        if (this.startTime < 0) {
            this.startTime = time;
            this.lastMonsterTime = time + GAME_CONFIG.BOSS_MONSTER_FIRST_DELAY - this.getMonsterInterval();
            console.log('[BossScene] first update, startTime=', this.startTime);
        }

        // === 输入 ===
        if (Phaser.Input.Keyboard.JustDown(this.key1)) {
            this.player.switchTo('wukong');
        }
        if (Phaser.Input.Keyboard.JustDown(this.key2)) {
            this.player.switchTo('bajie');
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyJ)) {
            this.onSkillPressed();
        }

        // === 玩家 update（CD + 护盾过期）===
        this.player.update(time, delta);

        // === 倒计时 ===
        const left = this.getTimeLeft();
        this.timerText.setText(`⏱ ${left.toFixed(1)}s`);
        if (left < 5) this.timerText.setColor('#FF4444');
        if (left <= 0) {
            console.log('[BossScene] TIMEOUT triggered, elapsed=', this.time.now - this.startTime);
            this.lose('时间不够');
            return;
        }

        // === Boss 扔火球 ===
        const elapsed = time - this.startTime;
        const interval = this.boss.getFireballInterval();
        if (elapsed > this.firstFireballDelay && time - this.lastFireballTime > interval) {
            this.spawnFireballs();
            this.lastFireballTime = time;
        }

        // === 小妖怪生成 ===
        const monsterInterval = this.getMonsterInterval();
        if (time - this.lastMonsterTime > monsterInterval) {
            this.spawnMonster();
            this.lastMonsterTime = time;
        }

        // === 更新火球 ===
        this.fireballs.forEach(fb => fb.update(delta));
        this.fireballs = this.fireballs.filter(fb => {
            if (!fb.alive) return false;
            if (!fb.deflected) {
                // 击中玩家
                if (fb.hitsPoint(this.player.x, this.player.y, 22)) {
                    fb.destroy();
                    this.onPlayerHit('fireball');
                    return false;
                }
            } else {
                // 被扇飞 → 检查命中 Boss
                if (fb.hitsPoint(this.boss.x, this.boss.y, 55)) {
                    const dmg = 15;
                    this.boss.takeDamage(dmg, false);
                    this.dealtDamage += dmg;
                    fb.destroy();
                    if (this.boss.isDead()) this.win();
                    return false;
                }
            }
            return true;
        });

        // === 更新小妖怪 ===
        this.monsters.forEach(m => m.update(delta));
        // 护盾推开
        if (this.player.shieldActive) {
            const shieldR = GAME_CONFIG.BOSS_BAJIE_SHIELD_RADIUS;
            this.monsters.forEach(m => {
                if (m.alive && m.hitsPoint(this.player.x, this.player.y, shieldR)) {
                    m.pushAway(this.player.x, this.player.y);
                }
            });
        }
        // 小妖怪接触玩家
        this.monsters = this.monsters.filter(m => {
            if (!m.alive) return false;
            if (m.hitsPoint(this.player.x, this.player.y, 24)) {
                m.kill();
                this.onPlayerHit('monster');
                return false;
            }
            return true;
        });

        // === 更新血条 UI ===
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

        // === UI: 卡片高亮 + CD 文字 ===
        this.updateActiveCardBorder();
        this.updateSkillCDText();
    }

    /**
     * 当前小妖怪生成间隔（Boss HP < 60% → 暴怒期更密）
     */
    getMonsterInterval() {
        const ratio = this.boss.hp / this.boss.hpMax;
        return ratio < 0.6
            ? GAME_CONFIG.BOSS_MONSTER_INTERVAL_RAGE
            : GAME_CONFIG.BOSS_MONSTER_INTERVAL_NORMAL;
    }
}
