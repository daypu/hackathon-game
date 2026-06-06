// 键盘 + 指针输入，提供 isDown / justPressed 查询

const KEY_MAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'confirm',
  Enter: 'confirm',
  KeyP: 'pause',
  Escape: 'pause',
  KeyM: 'mute',
};

export class Input {
  constructor(canvas) {
    this.down = new Set();
    this.pressed = new Set(); // 本帧刚按下
    this.pointer = { x: 0, y: 0, justDown: false, down: false };

    window.addEventListener('keydown', (e) => {
      const a = KEY_MAP[e.code];
      if (!a) return;
      if (!this.down.has(a)) this.pressed.add(a);
      this.down.add(a);
      if (a !== 'mute') e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      const a = KEY_MAP[e.code];
      if (a) this.down.delete(a);
    });

    if (canvas) {
      const toLocal = (e) => {
        const r = canvas.getBoundingClientRect();
        const sx = canvas.width / r.width;
        const sy = canvas.height / r.height;
        this.pointer.x = (e.clientX - r.left) * sx;
        this.pointer.y = (e.clientY - r.top) * sy;
      };
      canvas.addEventListener('pointerdown', (e) => {
        toLocal(e);
        this.pointer.down = true;
        this.pointer.justDown = true;
        this.pressed.add('confirm');
      });
      canvas.addEventListener('pointermove', toLocal);
      window.addEventListener('pointerup', () => {
        this.pointer.down = false;
      });
    }
  }

  isDown(a) {
    return this.down.has(a);
  }

  just(a) {
    return this.pressed.has(a);
  }

  // 水平/垂直方向轴（-1 / 0 / 1）
  axisY() {
    return (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0);
  }
  axisX() {
    return (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0);
  }

  // 每帧末尾调用，清空一次性状态
  postUpdate() {
    this.pressed.clear();
    this.pointer.justDown = false;
  }
}
