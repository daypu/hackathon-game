/**
 * ObstacleManager - 障碍生成与难度管理
 * - 根据已用时间解锁障碍类型
 * - 按时间逐渐加快生成节奏
 * - 火墙/巨石仅在玩家技能就绪时生成（避免送死）
 */
class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];        // 当前活跃的 Obstacle 实例
        this.lastSpawnTime = 0;
        this.nextSpawnInterval = this.randomInterval();
    }

    /**
     * 获取当前可用障碍类型（按时间解锁）
     */
    getAvailableTypes(elapsedSec) {
        const types = [];
        if (elapsedSec >= GAME_CONFIG.UNLOCK_MONSTER) types.push('monster');
        if (elapsedSec >= GAME_CONFIG.UNLOCK_FIRE_WALL) types.push('fire_wall');
        if (elapsedSec >= GAME_CONFIG.UNLOCK_BOULDER) types.push('boulder');
        return types;
    }

    /**
     * 当前生成间隔（随时间缩短）
     */
    randomInterval() {
        const elapsedSec = this.scene.getElapsedSec();
        const progress = Math.min(elapsedSec / GAME_CONFIG.DIFFICULTY_TIME_CAP, 1);

        const minInt = GAME_CONFIG.OBSTACLE_MIN_INTERVAL * (1 - progress * 0.4);
        const maxInt = GAME_CONFIG.OBSTACLE_MAX_INTERVAL * (1 - progress * 0.4);
        return Phaser.Math.Between(Math.floor(minInt), Math.floor(maxInt));
    }

    /**
     * 每帧更新
     */
    update(time, delta) {
        const elapsedSec = this.scene.getElapsedSec();

        // 25s 后停止生成新障碍（给玩家清场感，Boss 即将出现）
        const stopAt = GAME_CONFIG.OBSTACLE_STOP_AT;
        if (elapsedSec < stopAt) {
            if (time - this.lastSpawnTime > this.nextSpawnInterval) {
                this.spawn();
                this.lastSpawnTime = time;
                this.nextSpawnInterval = this.randomInterval();
            }
        }

        // 更新所有障碍（清除离屏的）
        this.obstacles = this.obstacles.filter(o => !o.update());

        // 实时同步障碍速度（难度递增 → 速度变化时影响存量障碍）
        const speed = -this.scene.getWorldSpeed();
        this.obstacles.forEach(o => o.setVelocityX(speed));
    }

    spawn() {
        const elapsedSec = this.scene.getElapsedSec();
        const types = this.getAvailableTypes(elapsedSec);
        if (types.length === 0) return;

        const type = Phaser.Math.RND.pick(types);
        const obs = new Obstacle(this.scene, type);
        this.obstacles.push(obs);
    }

    getObstacles() {
        return this.obstacles;
    }

    /**
     * 死亡时停止所有障碍
     */
    stopAll() {
        this.obstacles.forEach(o => o.setVelocityX(0));
    }

    /**
     * 重玩时清空
     */
    clear() {
        this.obstacles.forEach(o => o.destroy());
        this.obstacles = [];
    }
}
