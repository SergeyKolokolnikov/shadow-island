// ─── Pixel Art Sprite Generator ──────────────────────────────────────────────
// All sprites are generated procedurally on canvas — no external assets needed.

const Sprites = {
  cache: {},

  // Create an offscreen canvas and draw pixels on it
  create(width, height, drawFn) {
    const key = drawFn.toString();
    if (this.cache[key]) return this.cache[key];

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    drawFn(ctx, width, height);
    this.cache[key] = c;
    return c;
  },

  // Helper: draw pixel grid from color map
  drawPixels(ctx, pixels, scale) {
    scale = scale || 1;
    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        if (pixels[y][x]) {
          ctx.fillStyle = pixels[y][x];
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  },

  // ── Player sprite (16x16 → drawn at 2x = 32x32) ────────────────────────
  player() {
    return this.create(32, 32, (ctx) => {
      const P = '#222'; // dark
      const S = '#445566'; // suit
      const H = '#ddbb88'; // skin
      const E = '#33ff88'; // goggles
      const B = '#111';
      const pixels = [
        [0,0,0,0,0,P,P,P,P,P,P,0,0,0,0,0],
        [0,0,0,0,P,P,P,P,P,P,P,P,0,0,0,0],
        [0,0,0,P,P,P,P,P,P,P,P,P,P,0,0,0],
        [0,0,0,P,H,H,H,H,H,H,H,H,P,0,0,0],
        [0,0,P,H,E,E,H,H,H,E,E,H,H,P,0,0],
        [0,0,P,H,E,E,H,H,H,E,E,H,H,P,0,0],
        [0,0,0,H,H,H,H,B,H,H,H,H,H,0,0,0],
        [0,0,0,0,H,H,H,H,H,H,H,H,0,0,0,0],
        [0,0,0,S,S,S,S,S,S,S,S,S,S,0,0,0],
        [0,0,S,S,S,S,S,S,S,S,S,S,S,S,0,0],
        [0,S,S,S,S,S,S,S,S,S,S,S,S,S,S,0],
        [0,S,S,H,S,S,S,S,S,S,S,S,H,S,S,0],
        [0,0,S,H,S,S,S,S,S,S,S,S,H,S,0,0],
        [0,0,0,0,S,S,S,S,S,S,S,S,0,0,0,0],
        [0,0,0,0,S,S,0,0,0,0,S,S,0,0,0,0],
        [0,0,0,P,P,P,0,0,0,0,P,P,P,0,0,0],
      ];
      this.drawPixels(ctx, pixels, 2);
    });
  },

  // ── Guard sprite ─────────────────────────────────────────────────────────
  guard() {
    return this.create(32, 32, (ctx) => {
      const R = '#cc2222'; // red beret
      const S = '#556655'; // military
      const H = '#ccaa77'; // skin
      const B = '#111';
      const G = '#334433';
      const pixels = [
        [0,0,0,0,R,R,R,R,R,R,R,0,0,0,0,0],
        [0,0,0,R,R,R,R,R,R,R,R,R,0,0,0,0],
        [0,0,0,R,R,R,R,R,R,R,R,R,0,0,0,0],
        [0,0,0,H,H,H,H,H,H,H,H,H,0,0,0,0],
        [0,0,H,H,B,B,H,H,H,B,B,H,H,0,0,0],
        [0,0,H,H,B,B,H,H,H,B,B,H,H,0,0,0],
        [0,0,0,H,H,H,H,H,H,H,H,H,0,0,0,0],
        [0,0,0,0,H,H,B,B,B,H,H,0,0,0,0,0],
        [0,0,0,S,S,S,S,S,S,S,S,S,0,0,0,0],
        [0,0,S,S,S,S,S,S,S,S,S,S,S,0,0,0],
        [0,S,S,S,S,S,S,S,S,S,S,S,S,S,0,0],
        [0,S,H,S,S,S,S,S,S,S,S,S,H,S,0,0],
        [0,0,H,G,S,S,S,S,S,S,S,G,H,0,0,0],
        [0,0,0,0,G,G,G,0,G,G,G,0,0,0,0,0],
        [0,0,0,0,G,G,0,0,0,G,G,0,0,0,0,0],
        [0,0,0,B,B,B,0,0,0,B,B,B,0,0,0,0],
      ];
      this.drawPixels(ctx, pixels, 2);
    });
  },

  // ── Drone sprite ─────────────────────────────────────────────────────────
  drone() {
    return this.create(40, 40, (ctx) => {
      const M = '#556677'; // metal
      const D = '#334455';
      const R = '#ff3333'; // red light
      const L = '#88aacc'; // light metal
      const pixels = [
        [0,0,0,0,0,0,0,D,D,D,D,D,D,D,0,0,0,0,0,0],
        [0,0,0,0,0,D,D,M,M,M,M,M,M,M,D,D,0,0,0,0],
        [0,0,0,D,D,M,M,M,L,L,L,L,M,M,M,D,D,0,0,0],
        [0,0,D,M,M,M,L,L,L,L,L,L,L,L,M,M,M,D,0,0],
        [0,D,M,M,L,L,L,R,L,L,L,L,R,L,L,L,M,M,D,0],
        [D,M,M,L,L,L,L,L,L,L,L,L,L,L,L,L,L,M,M,D],
        [D,M,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,M,D],
        [0,D,M,M,L,L,L,L,L,L,L,L,L,L,L,L,M,M,D,0],
        [0,0,D,M,M,M,L,L,L,L,L,L,L,L,M,M,M,D,0,0],
        [0,0,0,D,D,M,M,M,M,M,M,M,M,M,M,D,D,0,0,0],
      ];
      this.drawPixels(ctx, pixels, 2);
    });
  },

  // ── Security boss sprite ─────────────────────────────────────────────────
  securityBoss() {
    return this.create(48, 48, (ctx) => {
      const B = '#111';
      const S = '#222233'; // black suit
      const H = '#ccaa77';
      const G = '#888899'; // glasses
      const T = '#cc0000'; // tie
      ctx.fillStyle = S;
      ctx.fillRect(8, 20, 32, 24);
      ctx.fillStyle = H;
      ctx.fillRect(14, 4, 20, 18);
      ctx.fillStyle = G;
      ctx.fillRect(16, 10, 7, 4);
      ctx.fillRect(25, 10, 7, 4);
      ctx.fillStyle = B;
      ctx.fillRect(23, 10, 2, 4);
      ctx.fillStyle = T;
      ctx.fillRect(22, 22, 4, 16);
      ctx.fillStyle = H;
      ctx.fillRect(4, 26, 6, 12);
      ctx.fillRect(38, 26, 6, 12);
      ctx.fillStyle = S;
      ctx.fillRect(14, 40, 8, 8);
      ctx.fillRect(26, 40, 8, 8);
      ctx.fillStyle = B;
      ctx.fillRect(14, 2, 20, 4);
    });
  },

  // ── Final villain sprite ─────────────────────────────────────────────────
  villain() {
    return this.create(56, 56, (ctx) => {
      const B = '#111';
      const W = '#ffffff';
      const G = '#ddaa00'; // gold
      const S = '#880000'; // dark red suit
      const H = '#ccaa77';
      const C = '#ff2222'; // cape
      // Cape
      ctx.fillStyle = C;
      ctx.fillRect(4, 16, 48, 36);
      // Body
      ctx.fillStyle = S;
      ctx.fillRect(12, 18, 32, 28);
      // Gold trim
      ctx.fillStyle = G;
      ctx.fillRect(12, 18, 32, 3);
      ctx.fillRect(26, 18, 4, 28);
      // Head
      ctx.fillStyle = H;
      ctx.fillRect(16, 2, 24, 18);
      // Hair slicked back
      ctx.fillStyle = '#444';
      ctx.fillRect(16, 0, 24, 6);
      // Evil grin
      ctx.fillStyle = B;
      ctx.fillRect(22, 14, 12, 2);
      ctx.fillStyle = W;
      ctx.fillRect(24, 14, 2, 2);
      ctx.fillRect(30, 14, 2, 2);
      // Monocle
      ctx.fillStyle = G;
      ctx.strokeStyle = G;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(32, 9, 4, 0, Math.PI * 2);
      ctx.stroke();
      // Eyes
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(21, 8, 4, 4);
      ctx.fillRect(31, 8, 4, 4);
      ctx.fillStyle = B;
      ctx.fillRect(22, 9, 2, 2);
      ctx.fillRect(32, 9, 2, 2);
      // Legs
      ctx.fillStyle = '#222';
      ctx.fillRect(16, 46, 10, 10);
      ctx.fillRect(30, 46, 10, 10);
    });
  },

  // ── Projectile ───────────────────────────────────────────────────────────
  projectile() {
    return this.create(8, 8, (ctx) => {
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(2, 0, 4, 8);
      ctx.fillRect(0, 2, 8, 4);
      ctx.fillStyle = '#ffaa44';
      ctx.fillRect(3, 1, 2, 6);
      ctx.fillRect(1, 3, 6, 2);
    });
  },

  // ── Enemy projectile ────────────────────────────────────────────────────
  enemyProjectile() {
    return this.create(10, 10, (ctx) => {
      ctx.fillStyle = '#ff0044';
      ctx.beginPath();
      ctx.arc(5, 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6688';
      ctx.beginPath();
      ctx.arc(5, 5, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  // ── Server (destructible) ───────────────────────────────────────────────
  server() {
    return this.create(32, 48, (ctx) => {
      ctx.fillStyle = '#333344';
      ctx.fillRect(2, 0, 28, 48);
      ctx.fillStyle = '#222233';
      ctx.fillRect(4, 2, 24, 10);
      ctx.fillRect(4, 14, 24, 10);
      ctx.fillRect(4, 26, 24, 10);
      // Lights
      ctx.fillStyle = '#00ff44';
      ctx.fillRect(6, 5, 3, 3);
      ctx.fillRect(6, 17, 3, 3);
      ctx.fillRect(6, 29, 3, 3);
      ctx.fillStyle = '#44ff88';
      ctx.fillRect(12, 5, 3, 3);
      ctx.fillRect(12, 17, 3, 3);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(22, 5, 3, 3);
    });
  },

  // ── Heart / HP icon ─────────────────────────────────────────────────────
  heart() {
    return this.create(12, 12, (ctx) => {
      ctx.fillStyle = '#ff2244';
      const p = [
        [0,0,1,1,0,0,0,1,1,0,0,0],
        [0,1,1,1,1,0,1,1,1,1,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,1,0,0,0,0,0,0],
      ];
      for (let y = 0; y < p.length; y++)
        for (let x = 0; x < p[y].length; x++)
          if (p[y][x]) ctx.fillRect(x, y, 1, 1);
    });
  },
};
