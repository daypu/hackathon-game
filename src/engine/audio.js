// 基于 WebAudio 的程序化音效（无需任何音频资源文件）

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone(freq, dur, type = 'square', vol = 0.2, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur = 0.2, vol = 0.25) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(
      1,
      this.ctx.sampleRate * dur,
      this.ctx.sampleRate
    );
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'pickup':
        this.tone(660, 0.08, 'square', 0.18);
        this.tone(990, 0.12, 'square', 0.16, 1320);
        break;
      case 'good': // 特殊正向（云/符）
        this.tone(523, 0.1, 'triangle', 0.2);
        this.tone(784, 0.12, 'triangle', 0.2);
        this.tone(1046, 0.16, 'triangle', 0.18, 1320);
        break;
      case 'hit':
        this.noise(0.18, 0.3);
        this.tone(180, 0.18, 'sawtooth', 0.2, 80);
        break;
      case 'shield':
        this.tone(300, 0.18, 'sine', 0.25, 600);
        break;
      case 'select':
        this.tone(440, 0.06, 'square', 0.15);
        break;
      case 'start':
        this.tone(523, 0.1, 'square', 0.2);
        this.tone(659, 0.1, 'square', 0.2);
        this.tone(784, 0.18, 'square', 0.2);
        break;
      case 'win':
        [523, 659, 784, 1046].forEach((f, i) =>
          setTimeout(() => this.tone(f, 0.22, 'triangle', 0.22), i * 130)
        );
        break;
      case 'lose':
        [392, 330, 262, 196].forEach((f, i) =>
          setTimeout(() => this.tone(f, 0.26, 'sawtooth', 0.2), i * 150)
        );
        break;
      default:
        break;
    }
  }

  // 简易循环氛围音（五声音阶踱步低音），营造取经路上的节奏
  startBgm() {
    if (this.bgmTimer || !this.ctx) return;
    const scale = [196, 220, 262, 294, 330]; // 商调式近似
    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => {
      if (this.muted) return;
      const n = scale[this.bgmStep % scale.length];
      this.tone(n, 0.22, 'triangle', 0.06);
      if (this.bgmStep % 2 === 0) this.tone(n / 2, 0.4, 'sine', 0.05);
      this.bgmStep++;
    }, 320);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}
