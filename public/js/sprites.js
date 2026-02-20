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

  // ── Security boss sprite (blonde billionaire — Trump caricature) ─────────
  securityBoss() {
    return this.create(48, 48, (ctx) => {
      const B = '#111';
      const W = '#ffffff';
      const SUIT = '#1a1a6a'; // dark blue suit
      const TIE = '#cc0000'; // red power tie
      const SKIN = '#f0c090'; // orange-tinted skin
      const HAIR = '#f5d442'; // blonde
      const HAIR_HI = '#ffe066';

      // Legs
      ctx.fillStyle = '#111133';
      ctx.fillRect(14, 40, 8, 8);
      ctx.fillRect(26, 40, 8, 8);

      // Body (suit)
      ctx.fillStyle = SUIT;
      ctx.fillRect(8, 20, 32, 22);
      // Lapels
      ctx.fillStyle = '#222255';
      ctx.fillRect(10, 20, 5, 12);
      ctx.fillRect(33, 20, 5, 12);
      // White shirt
      ctx.fillStyle = W;
      ctx.beginPath();
      ctx.moveTo(20, 20);
      ctx.lineTo(28, 20);
      ctx.lineTo(24, 30);
      ctx.closePath();
      ctx.fill();
      // Red tie
      ctx.fillStyle = TIE;
      ctx.fillRect(22, 22, 4, 14);
      ctx.fillRect(21, 36, 6, 3);

      // Arms
      ctx.fillStyle = SUIT;
      ctx.fillRect(3, 22, 7, 14);
      ctx.fillRect(38, 22, 7, 14);
      // Hands
      ctx.fillStyle = SKIN;
      ctx.fillRect(3, 34, 7, 5);
      ctx.fillRect(38, 34, 7, 5);

      // Head
      ctx.fillStyle = SKIN;
      ctx.fillRect(12, 3, 24, 18);
      ctx.fillRect(14, 2, 20, 20);

      // Blonde hair — combover
      ctx.fillStyle = HAIR;
      ctx.fillRect(10, 0, 28, 6);
      ctx.fillRect(8, 1, 5, 5);
      ctx.fillRect(35, 1, 5, 4);
      ctx.fillRect(36, 0, 8, 3);
      ctx.fillStyle = HAIR_HI;
      ctx.fillRect(12, 0, 18, 3);

      // Eyes (squinting)
      ctx.fillStyle = W;
      ctx.fillRect(15, 9, 6, 3);
      ctx.fillRect(27, 9, 6, 3);
      ctx.fillStyle = '#3366cc';
      ctx.fillRect(18, 9, 3, 3);
      ctx.fillRect(30, 9, 3, 3);
      ctx.fillStyle = B;
      ctx.fillRect(19, 10, 2, 2);
      ctx.fillRect(31, 10, 2, 2);
      // Eyebrows
      ctx.fillStyle = '#ccaa22';
      ctx.fillRect(14, 7, 8, 2);
      ctx.fillRect(26, 7, 8, 2);

      // Mouth
      ctx.fillStyle = '#cc6644';
      ctx.fillRect(18, 16, 12, 2);
      ctx.fillStyle = W;
      ctx.fillRect(20, 16, 8, 2);
    });
  },

  // ── Final villain sprite (island keeper — Epstein caricature) ────────────
  villain() {
    return this.create(56, 56, (ctx) => {
      const B = '#111';
      const W = '#ffffff';
      const G = '#ddaa00'; // gold
      const SKIN = '#d4a574'; // tanned skin
      const HAIR = '#1a1a1a'; // dark hair
      const SHIRT = '#4488aa'; // open collar shirt
      const PANTS = '#ccbb88'; // khaki

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(28, 54, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs (khaki)
      ctx.fillStyle = PANTS;
      ctx.fillRect(16, 44, 10, 10);
      ctx.fillRect(30, 44, 10, 10);
      // Shoes
      ctx.fillStyle = '#443322';
      ctx.fillRect(14, 52, 12, 4);
      ctx.fillRect(30, 52, 12, 4);

      // Body (casual open-collar shirt)
      ctx.fillStyle = SHIRT;
      ctx.fillRect(10, 20, 36, 26);
      // Collar
      ctx.fillStyle = '#55aacc';
      ctx.beginPath();
      ctx.moveTo(22, 20);
      ctx.lineTo(28, 28);
      ctx.lineTo(34, 20);
      ctx.closePath();
      ctx.fill();
      // Chest exposed in V
      ctx.fillStyle = SKIN;
      ctx.beginPath();
      ctx.moveTo(23, 20);
      ctx.lineTo(28, 27);
      ctx.lineTo(33, 20);
      ctx.closePath();
      ctx.fill();

      // Arms
      ctx.fillStyle = SHIRT;
      ctx.fillRect(4, 22, 8, 14);
      ctx.fillRect(44, 22, 8, 14);
      // Forearms (exposed skin — short sleeves)
      ctx.fillStyle = SKIN;
      ctx.fillRect(4, 34, 8, 8);
      ctx.fillRect(44, 34, 8, 8);

      // Head (egg-shaped, longer face)
      ctx.fillStyle = SKIN;
      ctx.fillRect(15, 1, 26, 21);
      ctx.fillRect(17, 0, 22, 23);

      // Dark hair — receding, short on sides
      ctx.fillStyle = HAIR;
      ctx.fillRect(17, -1, 22, 5);
      ctx.fillRect(15, 1, 4, 8);
      ctx.fillRect(37, 1, 4, 8);
      // Slight receding at temples
      ctx.fillStyle = SKIN;
      ctx.fillRect(18, 0, 3, 2);
      ctx.fillRect(35, 0, 3, 2);

      // Ears
      ctx.fillStyle = SKIN;
      ctx.fillRect(13, 8, 3, 6);
      ctx.fillRect(40, 8, 3, 6);

      // Eyes (heavy-lidded)
      ctx.fillStyle = W;
      ctx.fillRect(20, 9, 6, 4);
      ctx.fillRect(32, 9, 6, 4);
      ctx.fillStyle = '#443322'; // dark brown
      ctx.fillRect(23, 10, 3, 3);
      ctx.fillRect(35, 10, 3, 3);
      ctx.fillStyle = B;
      ctx.fillRect(24, 10, 2, 2);
      ctx.fillRect(36, 10, 2, 2);
      // Heavy eyebrows
      ctx.fillStyle = HAIR;
      ctx.fillRect(19, 7, 8, 2);
      ctx.fillRect(31, 7, 8, 2);
      // Bags under eyes
      ctx.fillStyle = '#b8956a';
      ctx.fillRect(20, 13, 6, 1);
      ctx.fillRect(32, 13, 6, 1);

      // Nose (prominent)
      ctx.fillStyle = '#c49060';
      ctx.fillRect(27, 11, 4, 5);
      ctx.fillRect(26, 15, 6, 2);

      // Mouth (thin smirk)
      ctx.fillStyle = '#994444';
      ctx.fillRect(23, 18, 12, 2);
      // Slight smirk curl
      ctx.fillStyle = '#aa5555';
      ctx.fillRect(34, 17, 2, 1);

      // Chin
      ctx.fillStyle = '#c49a6a';
      ctx.fillRect(24, 20, 10, 2);
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
