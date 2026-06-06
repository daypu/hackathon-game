// Canvas 2D 像素渲染封装

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width;
    this.h = canvas.height;
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x | 0, y | 0, Math.ceil(w), Math.ceil(h));
  }

  stroke(x, y, w, h, color, lw = 2) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lw;
    this.ctx.strokeRect(x, y, w, h);
  }

  roundRect(x, y, w, h, r, color, stroke = null, lw = 2) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (color) {
      ctx.fillStyle = color;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }

  circle(x, y, r, color) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // 线性垂直渐变矩形
  vgrad(x, y, w, h, c0, c1) {
    const g = this.ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    this.ctx.fillStyle = g;
    this.ctx.fillRect(x, y, w, h);
  }

  // 绘制像素精灵：sp = { w, h, data: string[], palette: {char: color} }
  sprite(sp, x, y, scale, opts = {}) {
    const { flipX = false, alpha = 1, colorOverride = null } = opts;
    const ctx = this.ctx;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    const { data, palette } = sp;
    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        const color = palette[ch];
        if (!color) continue;
        const px = flipX ? x + (row.length - 1 - c) * scale : x + c * scale;
        ctx.fillStyle = colorOverride || color;
        ctx.fillRect(px | 0, (y + r * scale) | 0, scale, scale);
      }
    }
    if (alpha !== 1) ctx.globalAlpha = 1;
  }

  spriteWidth(sp, scale) {
    return sp.data[0].length * scale;
  }
  spriteHeight(sp, scale) {
    return sp.data.length * scale;
  }

  text(str, x, y, opts = {}) {
    const {
      size = 16,
      color = '#fff',
      align = 'left',
      baseline = 'alphabetic',
      weight = '600',
      family = '"PingFang SC","Microsoft YaHei",system-ui,sans-serif',
      shadow = null,
      alpha = 1,
    } = opts;
    const ctx = this.ctx;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    if (shadow) {
      ctx.fillStyle = shadow;
      ctx.fillText(str, x + 2, y + 2);
    }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    if (alpha !== 1) ctx.globalAlpha = 1;
  }

  measure(str, size = 16, weight = '600') {
    this.ctx.font = `${weight} ${size}px "PingFang SC","Microsoft YaHei",system-ui,sans-serif`;
    return this.ctx.measureText(str).width;
  }
}
