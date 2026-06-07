// 键盘 + 指针输入，提供 isDown / justPressed 查询
import { GAME } from '../config.js';

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
  KeyJ: 'attack',
  KeyK: 'skill',
  KeyP: 'pause',
  Escape: 'pause',
  KeyM: 'mute',
};

export class Input {
  constructor(canvas) {
    this.down = new Set();
    this.pressed = new Set(); // 本帧刚按下
    this.released = new Set(); // 本帧刚松开
    this.pointer = { x: 0, y: 0, justDown: false, down: false };
    this.touchMode = this.#detectTouchMode();
    this.touch = {
      joystickPointerId: null,
      joystickActive: false,
      joyX: 0,
      joyY: 0,
      buttonPointers: new Map(),
      activePointers: new Set(),
    };

    window.addEventListener('keydown', (e) => {
      const a = KEY_MAP[e.code];
      if (!a) return;
      if (!this.down.has(a)) this.pressed.add(a);
      this.down.add(a);
      if (a !== 'mute') e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      const a = KEY_MAP[e.code];
      if (a) {
        this.down.delete(a);
        this.released.add(a);
      }
    });

    if (canvas) {
      const toLocal = (e) => {
        const rect = canvas.getBoundingClientRect();
        // 映射到逻辑坐标（与画布物理分辨率 / DPR 无关）
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * GAME.width;
        this.pointer.y = ((e.clientY - rect.top) / rect.height) * GAME.height;
      };
      canvas.addEventListener('pointerdown', (e) => {
        toLocal(e);
        this.touch.activePointers.add(e.pointerId);
        const control = this.touchMode ? this.#hitTouchControl(this.pointer.x, this.pointer.y) : null;
        if (control) {
          this.pointer.down = true;
          this.#handleTouchControlDown(control, e.pointerId, this.pointer.x, this.pointer.y);
          e.preventDefault();
          return;
        }
        this.pointer.down = true;
        this.pointer.justDown = true;
        this.pressed.add('confirm');
      });
      canvas.addEventListener('pointermove', (e) => {
        toLocal(e);
        if (this.touchMode) this.#handleTouchControlMove(e.pointerId, this.pointer.x, this.pointer.y);
      });
      const handlePointerUp = (e) => {
        this.touch.activePointers.delete(e.pointerId);
        if (this.touchMode) this.#handleTouchControlUp(e.pointerId);
        this.pointer.down = this.touch.activePointers.size > 0;
      };
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      window.addEventListener('blur', () => {
        this.touch.activePointers.clear();
        this.pointer.down = false;
        this.#resetTouchControls();
      });
    }
  }

  isDown(a) {
    return this.down.has(a);
  }

  just(a) {
    return this.pressed.has(a);
  }

  justReleased(a) {
    return this.released.has(a);
  }

  // 水平/垂直方向轴（-1 / 0 / 1）
  axisY() {
    const keyboard = (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0);
    const touch = this.touchMode ? this.touch.joyY : 0;
    return clampAxis(keyboard + touch);
  }
  axisX() {
    const keyboard = (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0);
    const touch = this.touchMode ? this.touch.joyX : 0;
    return clampAxis(keyboard + touch);
  }

  drawOverlay(r) {
    if (!this.touchMode) return;
    const ctx = r.ctx;
    const ui = this.#touchLayout();
    ctx.save();
    ctx.globalAlpha = 0.92;
    this.#drawJoystick(r, ui.joystick);
    this.#drawButton(r, ui.confirm, {
      label: '\u4ea4',
      active: this.down.has('confirm') && this.touch.buttonPointers.has('confirm'),
      color: '#6fb0c8',
    });
    this.#drawButton(r, ui.skill, {
      label: '\u6280',
      active: this.down.has('skill') && this.touch.buttonPointers.has('skill'),
      color: '#6fb0c8',
    });
    this.#drawButton(r, ui.attack, {
      label: '\u653b',
      active: this.down.has('attack') && this.touch.buttonPointers.has('attack'),
      color: '#ffce54',
    });
    ctx.restore();
  }

  // 每帧末尾调用，清空一次性状态
  postUpdate() {
    this.pressed.clear();
    this.released.clear();
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
    const size = 68;
    const gap = 16;
    const pad = 22;
    const y = GAME.height - pad - size / 2;
    const attackX = GAME.width - pad - size / 2;
    const skillX = attackX - gap - size;
    return {
      joystick: {
        x: 98,
        y: GAME.height - 98,
        r: 56,
        knob: 24,
      },
      confirm: {
        x: 98,
        y: GAME.height - 208,
        r: 26,
        action: 'confirm',
      },
      skill: {
        x: skillX + size / 2,
        y,
        r: size / 2,
        action: 'skill',
      },
      attack: {
        x: attackX,
        y,
        r: size / 2,
        action: 'attack',
      },
    };
  }

  #hitTouchControl(x, y) {
    const ui = this.#touchLayout();
    if (distanceSq(x, y, ui.joystick.x, ui.joystick.y) <= (ui.joystick.r + 20) ** 2) return { type: 'joystick', ...ui.joystick };
    for (const button of [ui.confirm, ui.skill, ui.attack]) {
      if (distanceSq(x, y, button.x, button.y) <= button.r ** 2) return { type: 'button', ...button };
    }
    return null;
  }

  #handleTouchControlDown(control, pointerId, x, y) {
    if (control.type === 'joystick') {
      this.touch.joystickPointerId = pointerId;
      this.touch.joystickActive = true;
      this.#updateJoystick(x, y, control);
      return;
    }
    this.touch.buttonPointers.set(control.action, pointerId);
    this.#pressAction(control.action);
  }

  #handleTouchControlMove(pointerId, x, y) {
    if (pointerId !== this.touch.joystickPointerId) return;
    this.#updateJoystick(x, y, this.#touchLayout().joystick);
  }

  #handleTouchControlUp(pointerId) {
    if (pointerId === this.touch.joystickPointerId) {
      this.touch.joystickPointerId = null;
      this.touch.joystickActive = false;
      this.touch.joyX = 0;
      this.touch.joyY = 0;
    }
    for (const [action, id] of this.touch.buttonPointers.entries()) {
      if (id !== pointerId) continue;
      this.touch.buttonPointers.delete(action);
      this.#releaseAction(action);
    }
  }

  #updateJoystick(x, y, joystick) {
    const dx = x - joystick.x;
    const dy = y - joystick.y;
    const len = Math.hypot(dx, dy);
    const max = joystick.r;
    const k = len > max ? max / len : 1;
    this.touch.joyX = (dx * k) / max;
    this.touch.joyY = (dy * k) / max;
    const dead = 0.16;
    if (Math.abs(this.touch.joyX) < dead) this.touch.joyX = 0;
    if (Math.abs(this.touch.joyY) < dead) this.touch.joyY = 0;
  }

  #pressAction(action) {
    if (!this.down.has(action)) this.pressed.add(action);
    this.down.add(action);
  }

  #releaseAction(action) {
    if (this.down.has(action)) this.released.add(action);
    this.down.delete(action);
  }

  #resetTouchControls() {
    this.touch.joystickPointerId = null;
    this.touch.joystickActive = false;
    this.touch.joyX = 0;
    this.touch.joyY = 0;
    for (const action of this.touch.buttonPointers.keys()) this.#releaseAction(action);
    this.touch.buttonPointers.clear();
  }

  #drawJoystick(r, joystick) {
    const ctx = r.ctx;
    const knobX = joystick.x + this.touch.joyX * joystick.r;
    const knobY = joystick.y + this.touch.joyY * joystick.r;
    ctx.save();
    ctx.globalAlpha = 0.36;
    r.circle(joystick.x, joystick.y, joystick.r + 8, 'rgba(10,8,18,0.82)');
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(joystick.x, joystick.y, joystick.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.92;
    r.circle(knobX, knobY, joystick.knob, this.touch.joystickActive ? 'rgba(255,206,84,0.92)' : 'rgba(207,198,232,0.78)');
    r.text('\u79fb\u52a8', joystick.x, joystick.y + joystick.r + 24, {
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
    ctx.save();
    ctx.globalAlpha = info.active ? 0.95 : 0.78;
    r.circle(button.x, button.y, button.r, 'rgba(10,8,18,0.84)');
    ctx.lineWidth = info.active ? 4 : 3;
    ctx.strokeStyle = info.color;
    ctx.beginPath();
    ctx.arc(button.x, button.y, button.r - 3, 0, Math.PI * 2);
    ctx.stroke();
    r.text(info.label, button.x, button.y + 7, {
      size: 24,
      color: info.active ? '#fff2b0' : '#f5efe0',
      align: 'center',
      weight: '900',
    });
    ctx.restore();
  }
}

function clampAxis(v) {
  return Math.max(-1, Math.min(1, v));
}

function distanceSq(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}
