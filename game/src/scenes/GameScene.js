/**
 * GameScene - 主游戏场景
 * CP3：角色切换 + 克制系统 + 技能 + 难度递增
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // 统一文字样式（解决中文字符顶部截断 + Retina 模糊）
        TextStyle.patch(this);

        // === 1. 状态初始化 ===
        this.isGameOver = false;
        this.score = 0;
        this.startTime = this.time.now;
        this.currentRole = 'wukong';  // 当前控制的角色：'wukong' | 'bajie'
        this.bossSpawned = false;     // 铁扇公主是否已入场
        this.bossEntering = false;    // 是否正在进 BossScene（防重入，scene 重启时必须复位！）
        this.bossSprite = null;       // 铁扇公主在跑酷场景中的视觉
        this.bossEnterX = GAME_CONFIG.WIDTH - 150;  // 铁扇公主最终停留位置

        // === 2. 背景与远景 ===
        this.cameras.main.setBackgroundColor(GAME_CONFIG.COLOR_BG);
        this.drawMountains();

        // === 3. 地面 ===
        this.createGround();

        // === 4. 两个角色都创建好，只显示当前激活的 ===
        this.createPlayers();

        // === 5. 障碍管理器 ===
        this.obstacleManager = new ObstacleManager(this);

        // === 6. 碰撞 ===
        this.physics.add.collider(this.wukong.visual, this.ground);
        this.physics.add.collider(this.bajie.visual, this.ground);

        // === 7. 输入 ===
        this.setupInput();

        // === 8. UI ===
        this.createUI();
    }

    // ===== 创建系列 =====

    drawMountains() {
        // 用火焰山像素背景图替代代码生成的山头剪影
        // 图片原始 1672×941，铺满 960×540 画布
        const bg = this.add.image(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 'huoyanshan');
        bg.setDisplaySize(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        bg.setDepth(-10);  // 压到最底层
        // 暗化覆盖层：降低背景对比度，让角色和障碍更突出
        const dim = this.add.rectangle(
            GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2,
            GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT,
            0x000000, 0.25
        );
        dim.setDepth(-9);
    }

    createGround() {
        const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT;
        const g = this.add.graphics();
        g.fillStyle(GAME_CONFIG.COLOR_GROUND, 1);
        g.fillRect(0, groundY, GAME_CONFIG.WIDTH, GAME_CONFIG.GROUND_HEIGHT);
        g.fillStyle(GAME_CONFIG.COLOR_GROUND_TOP, 1);
        g.fillRect(0, groundY, GAME_CONFIG.WIDTH, 6);
        g.fillStyle(0x6B3410, 1);
        for (let i = 0; i < 40; i++) {
            const x = Phaser.Math.Between(0, GAME_CONFIG.WIDTH);
            const y = Phaser.Math.Between(groundY + 15, GAME_CONFIG.HEIGHT - 5);
            g.fillRect(x, y, 4, 4);
        }

        // 物理地面：顶部对齐视觉地面顶部（groundY）
        this.ground = this.physics.add.staticGroup();
        const groundBody = this.add.rectangle(
            GAME_CONFIG.WIDTH / 2,
            groundY-50,  // 直接使用groundY，让物理地面顶部=视觉地面顶部
            GAME_CONFIG.WIDTH,
            GAME_CONFIG.GROUND_HEIGHT
        );
        // 关键：设置origin让Rectangle的顶部作为锚点
        groundBody.setOrigin(0.5, 0);
        this.ground.add(groundBody);
        this.ground.refresh();

        console.log('=== 地面物理体 ===');
        console.log('groundY (视觉顶部):', groundY);
        console.log('groundBody.y (物理体顶部):', groundBody.y);
        console.log('groundBody.body.y:', groundBody.body.y);
        console.log('GROUND_HEIGHT:', GAME_CONFIG.GROUND_HEIGHT);
    }

    createPlayers() {
        const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT;
        const x = GAME_CONFIG.PLAYER_START_X;

        console.log('=== 地面基线坐标 ===');
        console.log('groundY:', groundY);

        // 悟空（初始显示）- y = groundY 让底部贴地（配合 setOrigin 0.5, 1.0）
        this.wukong = new Wukong(this, x, groundY);
        this.wukong.createVisual();
        console.log('悟空 this.y:', this.wukong.y);
        console.log('悟空 visual.y:', this.wukong.visual.y);
        console.log('悟空 visual.body.y:', this.wukong.visual.body.y);

        // 八戒（初始隐藏，放在屏幕外）
        this.bajie = new Bajie(this, x, groundY);
        this.bajie.createVisual();
        console.log('八戒 this.y:', this.bajie.y);
        console.log('八戒 visual.y:', this.bajie.visual.y);
        console.log('八戒 visual.body.y:', this.bajie.visual.body.y);
        this.setPlayerVisible(this.bajie, false);

        this.activePlayer = this.wukong;
    }

    setPlayerVisible(player, visible) {
        player.visual.setVisible(visible);
        player.decorations.forEach(d => d.setVisible(visible));
        // 隐藏的角色不参与物理（避免在屏幕外乱跳）
        if (player.visual.body) {
            player.visual.body.enable = visible;
        }
    }

    // ===== 输入 =====

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        // 跑酷阶段不要 J 键技能：技能完全留给 Boss 战

        // 鼠标点击：跳跃
        this.input.on('pointerdown', () => {
            if (!this.isGameOver) {
                this.activePlayer.jump();
            }
        });
    }

    switchTo(role) {
        if (this.currentRole === role) return;
        if (this.isGameOver) return;

        const oldPlayer = this.activePlayer;
        const newPlayer = (role === 'wukong') ? this.wukong : this.bajie;

        console.log('=== 角色切换 ===');
        console.log('从', oldPlayer.type, '切到', newPlayer.type);
        console.log('旧角色 visual.y:', oldPlayer.visual.y, 'body.y:', oldPlayer.visual.body.y);

        // 新角色继承旧角色的 x 坐标，但 y 坐标重置为地面基线
        const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT;
        newPlayer.x = oldPlayer.visual.x;
        newPlayer.y = groundY;  // 重置为地面基线，让物理引擎自动处理落地
        newPlayer.visual.x = oldPlayer.visual.x;
        newPlayer.visual.y = groundY;  // 重置为地面基线

        console.log('切换后 新角色 visual.y:', newPlayer.visual.y);
        console.log('切换后 新角色 this.y:', newPlayer.y);
        console.log('切换后 新角色 body.y:', newPlayer.visual.body.y);

        if (newPlayer.visual.body && oldPlayer.visual.body) {
            // 只继承 x 方向速度，y 方向清零（让重力自然处理）
            newPlayer.visual.body.setVelocity(
                oldPlayer.visual.body.velocity.x,
                0
            );
        }

        this.setPlayerVisible(oldPlayer, false);
        this.setPlayerVisible(newPlayer, true);
        this.activePlayer = newPlayer;
        this.currentRole = role;

        // 切换特效：白色闪光圈
        const flash = this.add.circle(
            newPlayer.visual.x, newPlayer.visual.y,
            10, 0xFFFFFF
        );
        this.tweens.add({
            targets: flash,
            radius: 60,
            alpha: 0,
            duration: 300,
            onComplete: () => flash.destroy(),
        });
    }

    // ===== UI =====

    createUI() {
        // 分数 & 时间
        this.scoreText = this.add.text(20, 15, '分数: 0', {
            fontSize: '22px', color: '#FFD700', fontStyle: 'bold'
        });
        this.timeText = this.add.text(GAME_CONFIG.WIDTH - 20, 15, '时间: 0.0s', {
            fontSize: '22px', color: '#FFFFFF'
        }).setOrigin(1, 0);

        // 当前角色指示
        this.roleText = this.add.text(GAME_CONFIG.WIDTH / 2, 15, '【悟空】', {
            fontSize: '20px', color: '#FF6600', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        // 底部角色卡片 + 技能 CD
        this.createRoleCards();

        // 顶部操作提示（让位给卡片）
        this.add.text(
            GAME_CONFIG.WIDTH / 2, 50,
            '空格=跳跃 │ 1=悟空 2=八戒 │ 火墙切悟空 巨石切八戒 妖怪必跳',
            { fontSize: '16px', color: '#FFFFFF', fontStyle: 'bold' }
        ).setOrigin(0.5);
    }

    createRoleCards() {
        const y = 80;  // 上移到分数下面

        // 悟空卡片（可点击切换）
        this.wukongCard = this.add.rectangle(80, y, 110, 40, GAME_CONFIG.COLOR_WUKONG)
            .setInteractive({ useHandCursor: true });
        this.wukongCard.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();   // 阻止冒泡到全局 pointerdown（避免误触跳跃）
            this.switchTo('wukong');
        });
        this.add.text(80, y - 5, '悟空 [1]', {
            fontSize: '14px', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.wukongCDText = this.add.text(80, y + 12, '防火墙', {
            fontSize: '11px', color: '#FFFFFF'
        }).setOrigin(0.5);

        // 八戒卡片（可点击切换）
        this.bajieCard = this.add.rectangle(210, y, 110, 40, GAME_CONFIG.COLOR_BAJIE)
            .setInteractive({ useHandCursor: true });
        this.bajieCard.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            this.switchTo('bajie');
        });
        this.add.text(210, y - 5, '八戒 [2]', {
            fontSize: '14px', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.bajieCDText = this.add.text(210, y + 12, '防巨石', {
            fontSize: '11px', color: '#FFFFFF'
        }).setOrigin(0.5);

        // 当前角色的高亮边框
        this.activeCardBorder = this.add.graphics();
        this.updateActiveCardBorder();
    }

    updateActiveCardBorder() {
        this.activeCardBorder.clear();
        this.activeCardBorder.lineStyle(3, 0xFFFF00, 1);
        const card = (this.currentRole === 'wukong') ? this.wukongCard : this.bajieCard;
        this.activeCardBorder.strokeRect(
            card.x - card.width / 2 - 2,
            card.y - card.height / 2 - 2,
            card.width + 4, card.height + 4
        );
    }

    // ===== 接口（供 ObstacleManager 调用）=====

    getElapsedSec() {
        return (this.time.now - this.startTime) / 1000;
    }

    /**
     * 当前世界滚动速度（按难度递增）
     */
    getWorldSpeed() {
        const elapsed = this.getElapsedSec();
        const cap = GAME_CONFIG.DIFFICULTY_TIME_CAP;
        const progress = Math.min(elapsed / cap, 1);
        return GAME_CONFIG.WORLD_SPEED +
               (GAME_CONFIG.WORLD_SPEED_MAX - GAME_CONFIG.WORLD_SPEED) * progress;
    }

    // ===== 碰撞 =====

    checkOverlap(playerBounds, obstacleBounds) {
        return Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, obstacleBounds);
    }

    onHitObstacle(obstacle) {
        if (this.isGameOver) return;

        // 八戒技能无敌
        if (this.activePlayer.isInvincible) {
            // 撞碎可破坏的障碍（小妖怪和巨石都能撞碎）
            if (this.activePlayer.canPass(obstacle) ||
                obstacle.type === 'monster' || obstacle.type === 'boulder') {
                obstacle.destroy();
            }
            return;
        }

        // 克制判断：可以安全穿过
        if (this.activePlayer.canPass(obstacle)) {
            return;
        }

        // 真死亡
        this.gameOver(obstacle);
    }

    gameOver(killer) {
        this.isGameOver = true;
        this.activePlayer.die();
        this.obstacleManager.stopAll();
        this.cameras.main.shake(250, 0.015);
        this.cameras.main.flash(150, 255, 0, 0);

        const dieReason = killer
            ? `${this.activePlayer.type === 'wukong' ? '悟空' : '八戒'}撞上了${this.obstacleName(killer.type)}`
            : '撞上铁扇公主之前已倒下';

        // 跑酷阶段死亡 → 进结算页（失败）
        this.time.delayedCall(700, () => {
            this.scene.start('ResultScene', {
                win: false,
                reason: dieReason,
                parkourScore: this.score,
                bossDamage: 0,
                bossHpLeft: GAME_CONFIG.BOSS_HP,
                maxCombo: 0,
            });
        });
    }

    /**
     * 铁扇公主从右边进场 —— 30s 时触发
     */
    spawnBoss() {
        if (this.bossSpawned) return;
        this.bossSpawned = true;

        // 提示
        const tip = this.add.text(
            GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 80,
            '铁扇公主拦路！',
            {
                fontSize: '32px', color: '#FF6666', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(3000);
        this.tweens.add({
            targets: tip,
            y: GAME_CONFIG.HEIGHT / 2 - 120,
            alpha: 0,
            duration: 1800,
            onComplete: () => tip.destroy(),
        });

        // 视觉：铁扇公主像素图从右边走过来，停在 bossEnterX
        const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT;
        const bossSize = 140;
        this.bossSprite = this.add.image(
            GAME_CONFIG.WIDTH + 80, groundY, 'tieshangongzhu'
        );
        this.bossSprite.setDisplaySize(bossSize, bossSize);
        this.bossSprite.setOrigin(0.5, 1.0);  // 底部对齐
        this.bossDecorations = [this.bossSprite];

        // 走过来：数组 targets 不能用 `x: {from, to}`（Phaser 数组陷阱）
        // → 每个 decoration 独立 tween 到各自的目标 x
        // 玩家固定在 PLAYER_START_X=200（画面 20.8%），Boss 站到对称位 760（画面 79.2%）
        // 两人关于画面中线对称对峙，然后自动触发 BossScene
        const finalX = GAME_CONFIG.WIDTH - GAME_CONFIG.PLAYER_START_X;  // 760，关于中线对称

        const walkBoss = (target, onAllDone) => {
            this.tweens.add({
                targets: target,
                x: finalX,
                duration: 1400,
                ease: 'Sine.easeOut',
                onComplete: onAllDone,
            });
        };
        // bossSprite 回调触发 Boss 战
        walkBoss(this.bossSprite, () => {
            console.log('[GameScene] 铁扇公主已就位（对称对峙）→ 触发 Boss 战');
            // 对峙 0.7s 后切场景，让玩家看清"两人对望"
            this.time.delayedCall(700, () => this.enterBossFight());
        });
    }

    /**
     * 玩家撞到铁扇公主 → 进 BossScene
     */
    enterBossFight() {
        if (this.bossEntering) return;
        this.bossEntering = true;
        this.isGameOver = true;
        console.log('[GameScene] enterBossFight → BossScene, score=', this.score);
        this.cameras.main.flash(300, 255, 200, 100);

        this.time.delayedCall(400, () => {
            console.log('[GameScene] starting BossScene now');
            this.scene.start('BossScene', { score: this.score, role: this.currentRole });
        });
    }

    obstacleName(type) {
        const names = {
            monster: '小妖怪',
            fire_wall: '火墙', boulder: '巨石'
        };
        return names[type] || '障碍';
    }

    // ===== 主循环 =====

    update(time, delta) {
        if (this.isGameOver) return;

        const elapsed = this.getElapsedSec();

        // 30s → Boss 入场
        if (!this.bossSpawned && elapsed >= GAME_CONFIG.BOSS_APPEAR_AT) {
            this.spawnBoss();
        }

        // === 输入 ===
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.activePlayer.jump();
        }
        if (Phaser.Input.Keyboard.JustDown(this.key1)) {
            this.switchTo('wukong');
        }
        if (Phaser.Input.Keyboard.JustDown(this.key2)) {
            this.switchTo('bajie');
        }

        // === 更新角色 ===
        this.wukong.update(time, delta);
        this.bajie.update(time, delta);

        // === 更新障碍 ===
        this.obstacleManager.update(time, delta);

        // === 碰撞检测（手动 AABB）===
        const playerBounds = this.activePlayer.getBounds();
        for (const o of this.obstacleManager.getObstacles()) {
            if (this.checkOverlap(playerBounds, o.getBounds())) {
                this.onHitObstacle(o);
                break;  // 一次撞击就够
            }
        }

        // === Boss 入场后由 tween onComplete 自动触发 enterBossFight（不依赖 bbox 重叠）===

        // === UI 更新 ===
        this.score = Math.floor(elapsed * GAME_CONFIG.SCORE_PER_SECOND);
        this.scoreText.setText(`分数: ${this.score}`);
        this.timeText.setText(`时间: ${elapsed.toFixed(1)}s / ${GAME_CONFIG.STAGE_DURATION}s`);
        this.roleText.setText(this.currentRole === 'wukong' ? '【悟空】' : '【八戒】');
        this.roleText.setColor(this.currentRole === 'wukong' ? '#FF6600' : '#FF69B4');

        // 跑酷阶段不显示技能 CD（技能改到 Boss 战才用），卡片文字保持"免火墙/免巨石"静态
        this.updateActiveCardBorder();
    }
}
