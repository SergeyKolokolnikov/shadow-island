// ─── Particle System (Explosions, Effects) ───────────────────────────────────
const Particles = {
  list: [],

  // Spawn a pixel explosion
  explode(x, y, color, count) {
    count = count || 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 40 + Math.random() * 80;
      this.list.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.5,
        size: 2 + Math.random() * 3,
        color: color || '#ff6600',
      });
    }
  },

  // Spawn hit sparks
  sparks(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      this.list.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.15 + Math.random() * 0.15,
        maxLife: 0.3,
        size: 1 + Math.random() * 2,
        color: '#ffcc00',
      });
    }
  },

  // Alert indicator
  alert(x, y) {
    this.list.push({
      x, y: y - 20,
      vx: 0, vy: -15,
      life: 0.8,
      maxLife: 0.8,
      size: 6,
      color: '#ff0000',
      text: '!',
    });
  },

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.list.splice(i, 1);
      }
    }
  },

  draw(ctx) {
    for (const p of this.list) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;

      if (p.text) {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  },

  clear() {
    this.list = [];
  },
};
