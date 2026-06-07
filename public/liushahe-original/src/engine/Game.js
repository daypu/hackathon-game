import { Renderer } from './Renderer.js';
import { Input } from './Input.js';

export class Game {
  constructor(canvas) {
    this.r = new Renderer(canvas);
    this.input = new Input(canvas);
    this.scene = null;
    this.shared = {};
    this.t = 0;
    this.last = 0;
    this.running = false;
    this._loop = this._loop.bind(this);
  }

  setScene(scene) {
    if (this.scene && this.scene.exit) this.scene.exit();
    this.scene = scene;
    if (scene.enter) scene.enter();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._loop);
  }

  _loop(ts) {
    let dt = (ts - this.last) / 1000;
    this.last = ts;
    if (dt > 0.05) dt = 0.05;
    this.t += dt;

    if (this.scene) {
      this.scene.update(dt);
      this.scene.draw();
    }

    this.input.postUpdate();
    requestAnimationFrame(this._loop);
  }
}

