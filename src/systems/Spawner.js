import { HAZARDS, PICKUPS, GAME } from '../config.js';
import { lerp, rand } from '../engine/utils.js';
import { Hazard } from '../entities/Hazard.js';
import { Pickup } from '../entities/Pickup.js';

function weightedKey(defs) {
  const entries = Object.values(defs);
  const total = entries.reduce((s, d) => s + (d.weight || 1), 0);
  let r = Math.random() * total;
  for (const d of entries) {
    r -= d.weight || 1;
    if (r <= 0) return d.key;
  }
  return entries[0].key;
}

// 妖气越重，妖障越密、越多
export class Spawner {
  constructor() {
    this.reset();
  }

  reset() {
    this.timer = 1.0;
    this.lastY = (GAME.roadTop + GAME.roadBottom) / 2;
  }

  #pickY() {
    // 与上一次的 y 拉开距离，保证有可通行的缝隙
    let y;
    let tries = 0;
    do {
      y = rand(GAME.roadTop + 24, GAME.roadBottom - 24);
      tries++;
    } while (Math.abs(y - this.lastY) < 70 && tries < 6);
    this.lastY = y;
    return y;
  }

  update(dt, miasma, onSpawn) {
    this.timer -= dt;
    if (this.timer > 0) return;

    const pHazard = lerp(0.45, 0.78, miasma);
    if (Math.random() < pHazard) {
      onSpawn('hazard', new Hazard(weightedKey(HAZARDS), this.#pickY()));
      // 高妖气时偶尔成对出现
      if (miasma > 0.55 && Math.random() < (miasma - 0.55) * 0.9) {
        onSpawn('hazard', new Hazard(weightedKey(HAZARDS), this.#pickY()));
      }
    } else {
      onSpawn('pickup', new Pickup(weightedKey(PICKUPS), this.#pickY()));
    }

    const minD = 0.42;
    const maxD = 1.05;
    this.timer = lerp(maxD, minD, miasma) * rand(0.82, 1.25);
  }
}
