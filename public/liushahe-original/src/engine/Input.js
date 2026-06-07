const KEY_MAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Digit1: 'one',
  Numpad1: 'one',
  Digit2: 'two',
  Numpad2: 'two',
  KeyQ: 'q',
  KeyE: 'e',
  Space: 'confirm',
  Enter: 'confirm',
  KeyP: 'pause',
  Escape: 'pause',
};

export class Input {
  constructor(canvas) {
    this.down = new Set();
    this.pressed = new Set();
    this.pointer = { x: 0, y: 0, justDown: false, down: false };
    this.touchMode = this.#detectTouchMode();
    this.touch = {
      joystickPointerId: null,
      buttonPointers: new Map(),
      activePointers: new Set(),
      joyDX: 0,
      joyDY: 0,
      joyDir: null,
    };

    window.addEventListener('keydown', (e) => {
      const a = KEY_MAP[e.code];
      if (!a) return;
      if (!this.down.has(a)) this.pressed.add(a);
      this.down.add(a);
      e.preventDefault();
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
        this.touch.activePointers.add(e.pointerId);
        const control = this.touchMode ? this.#hitTouchControl(this.pointer.x, this.pointer.y) : null;
        if (control) {
          this.pointer.down = true;
          this.#handleTouchDown(control, e.pointerId, this.pointer.x, this.pointer.y);
          e.preventDefault();
          return;
        }
        this.pointer.down = true;
        this.pointer.justDown = true;
        this.pressed.add('confirm');
      });
      canvas.addEventListener('pointermove', (e) => {
        toLocal(e);
        if (this.touchMode) this.#handleTouchMove(e.pointerId, this.pointer.x, this.pointer.y);
      });
      const handlePointerUp = (e) => {
        this.touch.activePointers.delete(e.pointerId);
        if (this.touchMode) this.#handleTouchUp(e.pointerId);
        this.pointer.down = this.touch.activePointers.size > 0;
      };
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      window.addEventListener('blur', () => {
        this.touch.activePointers.clear();
        this.pointer.down = false;
        this.#resetTouch();
      });
    }
  }

  isDown(a) {
    return this.down.has(a);
  }

  just(a) {
    return this.pressed.has(a);
  }

  axisY() {
    return (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0);
  }

  axisX() {
    return (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0);
  }

  drawOverlay(r, scene) {
    if (!this.touchMode) return;
    const ui = this.#touchLayout();
    const phase = scene?.phase || '';
    const gameplay = scene?.constructor?.name === 'RaftMiniGameScene';
    this.#drawJoystick(r, ui.joystick);
    this.#drawButton(r, ui.confirm, {
      label: gameplay && phase !== 'intro' && phase !== 'paused' ? '\u8200' : '\u786e',
      active: this.down.has('confirm') && this.touch.buttonPointers.has('confirm'),
      color: '#ffce54',
    });
    this.#drawButton(r, ui.pause, {
      label: '\u505c',
      active: this.down.has('pause') && this.touch.buttonPointers.has('pause'),
      color: '#cfc6e8',
      mini: true,
    });
    if (!gameplay) return;
    this.#drawButton(r, ui.one, {
      label: '1',
      active: this.down.has('one') && this.touch.buttonPointers.has('one'),
      color: '#7ed957',
    });
    this.#drawButton(r, ui.two, {
      label: '2',
      active: this.down.has('two') && this.touch.buttonPointers.has('two'),
      color: '#4aa3ff',
    });
    this.#drawButton(r, ui.q, {
      label: 'Q',
      active: this.down.has('q') && this.touch.buttonPointers.has('q'),
      color: '#ff7a6a',
    });
    this.#drawButton(r, ui.e, {
      label: 'E',
      active: this.down.has('e') && this.touch.buttonPointers.has('e'),
      color: '#ff9f43',
    });
  }

  postUpdate() {
    this.pressed.clear();
    this.pointer.justDown = false;
  }

  #detectTouchMode() {
    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return true;
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        if (window.matchMedia('(pointer: coarse)').matches) return true;
      } catch {
        // ignore
      }
    }
    return false;
  }

  #touchLayout() {
    return {
      joystick: { x: 104, y: GAME.height - 98, r: 56, knob: 23 },
      confirm: { x: GAME.width - 92, y: GAME.height - 96, r: 34, action: 'confirm' },
      q: { x: GAME.width - 198, y: GAME.height - 146, r: 26, action: 'q' },
      e: { x: GAME.width - 132, y: GAME.height - 146, r: 26, action: 'e' },
      one: { x: GAME.width - 198, y: GAME.height - 78, r: 26, action: 'one' },
      two: { x: GAME.width - 132, y: GAME.height - 78, r: 26, action: 'two' },
      pause: { x: GAME.width - 34, y: 34, r: 20, action: 'pause' },
    };
  }

  #hitTouchControl(x, y) {
    const ui = this.#touchLayout();
    if (distSq(x, y, ui.joystick.x, ui.joystick.y) <= (ui.joystick.r + 18) ** 2) return { type: 'joystick', ...ui.joystick };
    for (const button of [ui.confirm, ui.q, ui.e, ui.one, ui.two, ui.pause]) {
      if (distSq(x, y, button.x, button.y) <= button.r ** 2) return { type: 'button', ...button };
    }
    return null;
  }

  #handleTouchDown(control, pointerId, x, y) {
    if (control.type === 'joystick') {
      this.touch.joystickPointerId = pointerId;
      this.#updateJoystick(x, y, control);
      return;
    }
    this.touch.buttonPointers.set(control.action, pointerId);
    this.#pressAction(control.action);
  }

  #handleTouchMove(pointerId, x, y) {
    if (pointerId !== this.touch.joystickPointerId) return;
    this.#updateJoystick(x, y, this.#touchLayout().joystick);
  }

  #handleTouchUp(pointerId) {
    if (pointerId === this.touch.joystickPointerId) {
      this.touch.joystickPointerId = null;
      this.touch.joyDX = 0;
      this.touch.joyDY = 0;
      this.touch.joyDir = null;
    }
    for (const [action, id] of this.touch.buttonPointers.entries()) {
      if (id !== pointerId) continue;
      this.touch.buttonPointers.delete(action);
      this.down.delete(action);
    }
  }

  #updateJoystick(x, y, joystick) {
    const dx = x - joystick.x;
    const dy = y - joystick.y;
    const len = Math.hypot(dx, dy);
    const max = joystick.r;
    const k = len > max ? max / len : 1;
    this.touch.joyDX = dx * k;
    this.touch.joyDY = dy * k;
    const centered = len < joystick.r * 0.26;
    if (centered) {
      this.touch.joyDir = null;
      return;
    }
    if (Math.abs(this.touch.joyDX) < Math.abs(this.touch.joyDY)) return;
    const dir = this.touch.joyDX < 0 ? 'left' : 'right';
    if (dir === this.touch.joyDir) return;
    this.touch.joyDir = dir;
    this.pressed.add(dir);
  }

  #pressAction(action) {
    if (!this.down.has(action)) this.pressed.add(action);
    this.down.add(action);
  }

  #resetTouch() {
    this.touch.joystickPointerId = null;
    this.touch.joyDX = 0;
    this.touch.joyDY = 0;
    this.touch.joyDir = null;
    this.touch.buttonPointers.clear();
  }

  #drawJoystick(r, joystick) {
    const knobX = joystick.x + this.touch.joyDX;
    const knobY = joystick.y + this.touch.joyDY;
    const ctx = r.ctx;
    ctx.save();
    ctx.globalAlpha = 0.36;
    r.circle(joystick.x, joystick.y, joystick.r + 8, 'rgba(10,8,18,0.82)');
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(joystick.x, joystick.y, joystick.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.92;
    r.circle(knobX, knobY, joystick.knob, this.touch.joystickPointerId != null ? 'rgba(255,206,84,0.92)' : 'rgba(207,198,232,0.8)');
    r.text('\u5212\u8239', joystick.x, joystick.y + joystick.r + 22, {
      size: 12,
      color: '#f5efe0',
      align: 'center',
      weight: '900',
      alpha: 0.84,
    });
    ctx.restore();
  }

  #drawButton(r, button, info) {
    const ctx = r.ctx;
    const radius = info.mini ? button.r - 2 : button.r;
    ctx.save();
    ctx.globalAlpha = info.active ? 0.95 : 0.8;
    r.circle(button.x, button.y, radius, 'rgba(10,8,18,0.84)');
    ctx.lineWidth = info.mini ? 2 : 3;
    ctx.strokeStyle = info.color;
    ctx.beginPath();
    ctx.arc(button.x, button.y, radius - 3, 0, Math.PI * 2);
    ctx.stroke();
    r.text(info.label, button.x, button.y + (info.mini ? 5 : 7), {
      size: info.mini ? 16 : 22,
      color: info.active ? '#fff2b0' : '#f5efe0',
      align: 'center',
      weight: '900',
    });
    ctx.restore();
  }
}

function distSq(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}
