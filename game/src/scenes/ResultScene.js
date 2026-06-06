/**
 * ResultScene - 结算页
 *
 * data:
 *   win: boolean
 *   parkourScore, bossDamage, maxCombo, hitsTaken, timeLeft  (赢的时候)
 *   reason, bossHpLeft  (输的时候)
 */
class ResultScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ResultScene' });
    }

    init(data) {
        this.data_ = data || {};
    }

    create() {
        const cx = GAME_CONFIG.WIDTH / 2;
        const cy = GAME_CONFIG.HEIGHT / 2;

        this.cameras.main.setBackgroundColor(this.data_.win ? 0x1a3010 : 0x301010);

        // 半透明背景板（加高以容纳按钮，避免按钮和总分框挤一起）
        this.add.rectangle(cx, cy + 20, 580, 500, 0x000000, 0.55);

        if (this.data_.win) {
            this.renderWin(cx, cy);
        } else {
            this.renderLose(cx, cy);
        }

        // 重玩按钮（下移到 cy+210，与总分框/数据行拉开距离）
        const btnRestart = this.add.rectangle(cx - 100, cy + 210, 160, 50, 0xFF6600)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx - 100, cy + 210, '再来一次', {
            fontSize: '20px', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        btnRestart.on('pointerdown', () => this.scene.start('GameScene'));

        // 分享按钮（截图）
        const btnShare = this.add.rectangle(cx + 100, cy + 210, 160, 50, 0x4488FF)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx + 100, cy + 210, '截图分享', {
            fontSize: '20px', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        btnShare.on('pointerdown', () => this.takeScreenshot());

        // 键盘快捷键
        this.input.keyboard.once('keydown-R', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));

        // 入场动画
        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    renderWin(cx, cy) {
        // 标题：通关火焰山
        this.add.text(cx, cy - 160, '🎉 火焰山通关 🎉', {
            fontSize: '40px', color: '#FFD700', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(cx, cy - 110, '铁扇公主已降服，前路漫漫……', {
            fontSize: '16px', color: '#FFCCAA', fontStyle: 'italic'
        }).setOrigin(0.5);

        // 数据
        const totalScore = this.data_.parkourScore + this.data_.bossDamage * 10
            + Math.floor(this.data_.timeLeft * 20)
            + this.data_.maxCombo * 50;

        const lines = [
            ['跑酷得分',     `${this.data_.parkourScore}`],
            ['Boss 总伤害',  `${this.data_.bossDamage}  ×10 = ${this.data_.bossDamage * 10}`],
            ['剩余时间',     `${this.data_.timeLeft.toFixed(1)}s  ×20 = ${Math.floor(this.data_.timeLeft * 20)}`],
            ['最高连击',     `×${this.data_.maxCombo}  ×50 = ${this.data_.maxCombo * 50}`],
            ['被击中',       `${this.data_.hitsTaken} 次`],
        ];
        let y = cy - 65;
        lines.forEach(([k, v]) => {
            this.add.text(cx - 200, y, k, { fontSize: '17px', color: '#FFFFFF' });
            this.add.text(cx + 200, y, v, { fontSize: '17px', color: '#FFEE88' }).setOrigin(1, 0);
            y += 28;
        });

        // 总分
        this.add.rectangle(cx, y + 25, 460, 50, 0xFFD700, 0.2);
        this.add.text(cx, y + 25, `总分  ${totalScore}`, {
            fontSize: '28px', color: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 评级
        const grade = totalScore > 3000 ? 'S' : totalScore > 2000 ? 'A' : totalScore > 1000 ? 'B' : 'C';
        const gradeColor = grade === 'S' ? '#FFD700' : grade === 'A' ? '#FF8844' : grade === 'B' ? '#88CCFF' : '#CCCCCC';
        this.add.text(cx + 230, y + 25, grade, {
            fontSize: '48px', color: gradeColor, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        // 保存最高分
        this.checkHighScore(totalScore);
    }

    renderLose(cx, cy) {
        this.add.text(cx, cy - 150, '闯关失败', {
            fontSize: '40px', color: '#FF4444', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(cx, cy - 100, this.data_.reason || '别灰心，再来一次', {
            fontSize: '18px', color: '#FFAAAA'
        }).setOrigin(0.5);

        const lines = [
            ['跑酷得分',     `${this.data_.parkourScore}`],
            ['Boss 已扣血',  `${this.data_.bossDamage} / ${GAME_CONFIG.BOSS_HP}`],
            ['Boss 剩余血量',`${this.data_.bossHpLeft || 0}`],
            ['最高连击',     `×${this.data_.maxCombo || 0}`],
        ];
        let y = cy - 40;
        lines.forEach(([k, v]) => {
            this.add.text(cx - 180, y, k, { fontSize: '17px', color: '#FFFFFF' });
            this.add.text(cx + 180, y, v, { fontSize: '17px', color: '#FFAA88' }).setOrigin(1, 0);
            y += 30;
        });

        this.add.text(cx, y + 30, '提示：画弧越快越完整，连击越多伤害越高', {
            fontSize: '14px', color: '#AAAAAA', fontStyle: 'italic'
        }).setOrigin(0.5);
    }

    checkHighScore(score) {
        const KEY = 'xiyou_highscore';
        let high = 0;
        try { high = parseInt(localStorage.getItem(KEY) || '0', 10); } catch (e) {}
        if (score > high) {
            try { localStorage.setItem(KEY, String(score)); } catch (e) {}
            this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 80, `🏆 新纪录！历史最高：${score}`, {
                fontSize: '18px', color: '#FFD700', fontStyle: 'bold'
            }).setOrigin(0.5);
        } else if (high > 0) {
            this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 80, `历史最高：${high}`, {
                fontSize: '14px', color: '#888888'
            }).setOrigin(0.5);
        }
    }

    takeScreenshot() {
        // 用 canvas 直接 toDataURL → 自动下载
        try {
            const canvas = this.sys.game.canvas;
            const dataURL = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = `xiyou-result-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            this.add.text(GAME_CONFIG.WIDTH / 2, 30, '✅ 截图已保存到下载文件夹', {
                fontSize: '16px', color: '#88FF88', fontStyle: 'bold',
                backgroundColor: '#000000', padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
        } catch (e) {
            console.error('截图失败：', e);
        }
    }
}
