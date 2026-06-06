/**
 * GestureRecognizer - 手势识别（画弧检测）
 *
 * 检测玩家的鼠标/触摸轨迹是否构成一道"扇风弧线"，并量化其威力。
 *
 * 用法：
 *   const gr = new GestureRecognizer(scene);
 *   gr.onArc((result) => { ... });  // result: {valid, arcAngle, speed, damage, points, combo}
 *   // 玩家画弧 → 自动触发回调
 */
class GestureRecognizer {
    constructor(scene) {
        this.scene = scene;
        this.points = [];           // 当前正在记录的轨迹点 [{x,y,t}]
        this.startTime = 0;
        this.isTracking = false;
        this.callbacks = [];

        // 连击状态
        this.lastValidTime = 0;
        this.combo = 0;

        // 可视化轨迹（光带）
        this.trailGraphics = scene.add.graphics();
        this.trailGraphics.setDepth(1000);

        this.bindInput();
    }

    bindInput() {
        this.scene.input.on('pointerdown', (p) => {
            console.log('[Gesture] down', p.x, p.y);
            this.start(p);
        });
        this.scene.input.on('pointermove', (p) => this.move(p));
        this.scene.input.on('pointerup',   (p) => {
            console.log('[Gesture] up, points=', this.points.length);
            this.end(p);
        });
    }

    start(p) {
        this.points = [{ x: p.x, y: p.y, t: this.scene.time.now }];
        this.startTime = this.scene.time.now;
        this.isTracking = true;
        this.trailGraphics.clear();
    }

    move(p) {
        if (!this.isTracking) return;
        const now = this.scene.time.now;
        const last = this.points[this.points.length - 1];
        // 距离去重，避免一动不动堆点
        if (Math.hypot(p.x - last.x, p.y - last.y) < 3) return;
        this.points.push({ x: p.x, y: p.y, t: now });
        this.drawTrail();
    }

    end(p) {
        if (!this.isTracking) return;
        this.isTracking = false;
        const result = this.evaluate();
        this.fadeOutTrail();
        this.callbacks.forEach(cb => cb(result));
    }

    /**
     * 实时绘制光带（金色，淡出）
     */
    drawTrail() {
        this.trailGraphics.clear();
        if (this.points.length < 2) return;
        this.trailGraphics.lineStyle(6, 0xFFD700, 0.85);
        this.trailGraphics.beginPath();
        this.trailGraphics.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            this.trailGraphics.lineTo(this.points[i].x, this.points[i].y);
        }
        this.trailGraphics.strokePath();
    }

    fadeOutTrail() {
        this.scene.tweens.add({
            targets: this.trailGraphics,
            alpha: 0,
            duration: 250,
            onComplete: () => {
                this.trailGraphics.clear();
                this.trailGraphics.alpha = 1;
            }
        });
    }

    /**
     * 评估当前轨迹 → 返回结构化伤害数据
     */
    evaluate() {
        const pts = this.points;
        const result = {
            valid: false,
            arcAngle: 0,
            speed: 0,
            length: 0,
            duration: 0,
            damage: 0,
            combo: 0,
            points: pts,
        };

        if (pts.length < GAME_CONFIG.GESTURE_MIN_POINTS) {
            return result;  // 点太少 → 无效
        }

        // 总长度 & 时长
        let len = 0;
        for (let i = 1; i < pts.length; i++) {
            len += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
        }
        const dur = pts[pts.length - 1].t - pts[0].t;
        const speed = dur > 0 ? len / dur : 0;  // px/ms

        // 弧度：首末点连线 vs 中点构成的三角形偏离程度
        // 用"轨迹长度 / 首末直线距离"作为代理 —— 1.0 = 直线，> 1.2 = 有弧
        const first = pts[0];
        const last = pts[pts.length - 1];
        const chord = Math.hypot(last.x - first.x, last.y - first.y);

        // 弧度近似：用中点偏离首末连线的距离来推算
        const mid = pts[Math.floor(pts.length / 2)];
        const midDeviation = this.pointToLineDistance(mid, first, last);
        // 弧度 ≈ 4 * atan(2h / c) where h=midDeviation, c=chord
        const arcAngle = chord > 5
            ? (4 * Math.atan2(2 * midDeviation, chord) * 180 / Math.PI)
            : 0;

        result.length = len;
        result.duration = dur;
        result.speed = speed;
        result.arcAngle = arcAngle;

        // 必须够弧
        if (arcAngle < GAME_CONFIG.GESTURE_MIN_ARC) {
            return result;
        }

        // 计算连击
        const now = this.scene.time.now;
        if (now - this.lastValidTime < GAME_CONFIG.GESTURE_COMBO_WINDOW) {
            this.combo++;
        } else {
            this.combo = 1;
        }
        this.lastValidTime = now;

        // 伤害公式：基础 × 弧度 × 速度 × 连击
        const arcBonus = Math.min(arcAngle / 180, 1.0);
        const speedMul = Phaser.Math.Clamp(
            speed / GAME_CONFIG.GESTURE_BASE_SPEED,
            0.5,
            GAME_CONFIG.GESTURE_MAX_SPEED
        );
        const comboMul = 1 + (this.combo - 1) * 0.5;

        result.valid = true;
        result.combo = this.combo;
        result.damage = Math.floor(
            GAME_CONFIG.BOSS_BASE_DAMAGE * arcBonus * speedMul * comboMul
        );
        result.arcBonus = arcBonus;
        result.speedMul = speedMul;
        result.comboMul = comboMul;
        result.isPerfect = (arcBonus > 0.8 && speedMul > 2.5);
        return result;
    }

    /**
     * 点到直线的距离
     */
    pointToLineDistance(p, a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return 0;
        return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
    }

    /**
     * 检测轨迹是否经过某个点附近（用于扇飞火球）
     */
    didPassNear(x, y, radius = 50) {
        for (const p of this.points) {
            if (Math.hypot(p.x - x, p.y - y) < radius) return true;
        }
        return false;
    }

    /**
     * 注册回调
     */
    onArc(cb) {
        this.callbacks.push(cb);
    }

    /**
     * 重置连击（场景切换时调用）
     */
    resetCombo() {
        this.combo = 0;
        this.lastValidTime = 0;
    }

    destroy() {
        this.trailGraphics.destroy();
        this.callbacks = [];
        this.scene.input.removeAllListeners('pointerdown');
        this.scene.input.removeAllListeners('pointermove');
        this.scene.input.removeAllListeners('pointerup');
    }
}
