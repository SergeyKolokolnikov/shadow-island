// ─── Level Definitions ───────────────────────────────────────────────────────
// Each level defines: walls, enemies, boss, special objects, background, and win condition.

const Levels = {

  // ── LEVEL 1: Beach Landing ─────────────────────────────────────────────
  beach: {
    name: 'BEACH LANDING',
    mapWidth: 480,
    mapHeight: 700,
    playerStart: { x: 220, y: 650 },

    // Wall rects: {x, y, w, h}
    walls: [
      // Rocky outcrops
      { x: 0, y: 0, w: 480, h: 20 },         // top
      { x: 0, y: 0, w: 20, h: 700 },         // left
      { x: 460, y: 0, w: 20, h: 700 },       // right
      { x: 0, y: 680, w: 480, h: 20 },       // bottom
      // Cover objects (crates, rocks)
      { x: 80, y: 500, w: 40, h: 40 },
      { x: 350, y: 520, w: 50, h: 30 },
      { x: 180, y: 380, w: 30, h: 50 },
      { x: 320, y: 300, w: 40, h: 40 },
      { x: 60, y: 250, w: 50, h: 30 },
      { x: 200, y: 150, w: 80, h: 20 },
    ],

    createEnemies() {
      return [
        new Guard(120, 450, [{ x: 120, y: 450 }, { x: 300, y: 450 }]),
        new Guard(350, 350, [{ x: 350, y: 350 }, { x: 350, y: 200 }]),
        new Guard(100, 200, [{ x: 100, y: 200 }, { x: 250, y: 200 }]),
        new Guard(380, 150, [{ x: 380, y: 150 }, { x: 380, y: 350 }, { x: 200, y: 350 }]),
      ];
    },

    createBoss() {
      return new Drone(200, 60);
    },

    drawBackground(ctx, w, h) {
      // Sandy beach gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#2a4a2a');    // jungle top
      grad.addColorStop(0.3, '#3a6a3a');  // vegetation
      grad.addColorStop(0.7, '#c4a65a');  // sand
      grad.addColorStop(1, '#2244aa');    // water
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Sand texture pixels
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      for (let i = 0; i < 100; i++) {
        ctx.fillRect(
          Math.random() * w,
          h * 0.5 + Math.random() * h * 0.35,
          2, 2
        );
      }

      // Palm tree silhouettes
      this.drawPalm(ctx, 30, 300);
      this.drawPalm(ctx, 430, 280);
      this.drawPalm(ctx, 250, 100);
    },

    drawPalm(ctx, x, y) {
      ctx.fillStyle = '#1a3a1a';
      ctx.fillRect(x - 3, y, 6, 40);
      // Leaves
      ctx.fillStyle = '#2a5a2a';
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 15, y - 5 + Math.sin(a) * 10, 18, 5, a, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    drawWalls(ctx) {
      // Crates and rocks
      for (let i = 4; i < this.walls.length; i++) {
        const w = this.walls[i];
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
        // Crate lines
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(w.x + 4, w.y + 4, w.w - 8, w.h - 8);
      }
    },

    // Win when boss is dead and all guards eliminated
    checkWin(game) {
      if (!game.boss || !game.boss.alive) {
        const allDead = game.enemies.every(e => !e.alive);
        return allDead;
      }
      return false;
    },
  },

  // ── LEVEL 2: Mansion ───────────────────────────────────────────────────
  mansion: {
    name: 'THE MANSION',
    mapWidth: 480,
    mapHeight: 700,
    playerStart: { x: 220, y: 650 },

    walls: [
      // Boundary
      { x: 0, y: 0, w: 480, h: 20 },
      { x: 0, y: 0, w: 20, h: 700 },
      { x: 460, y: 0, w: 20, h: 700 },
      { x: 0, y: 680, w: 480, h: 20 },
      // Room structure
      { x: 20, y: 200, w: 160, h: 15 },  // inner wall
      { x: 300, y: 200, w: 160, h: 15 },  // inner wall
      { x: 200, y: 350, w: 15, h: 150 },  // vertical wall
      { x: 265, y: 350, w: 15, h: 150 },  // vertical wall
      // Furniture
      { x: 60, y: 550, w: 60, h: 30 },
      { x: 360, y: 550, w: 60, h: 30 },
      { x: 100, y: 100, w: 40, h: 40 },
      { x: 340, y: 100, w: 40, h: 40 },
    ],

    lasers: [
      // Horizontal lasers
      { x1: 100, y1: 300, x2: 380, y2: 300, speed: 2.5 },
      { x1: 50, y1: 450, x2: 200, y2: 450, speed: 2.0 },
      { x1: 280, y1: 450, x2: 430, y2: 450, speed: 3.0 },
      // Vertical lasers
      { x1: 150, y1: 500, x2: 150, y2: 620, speed: 1.8 },
      { x1: 330, y1: 500, x2: 330, y2: 620, speed: 2.2 },
    ],

    hackingTerminal: { x: 220, y: 50, w: 40, h: 30 },
    hackingComplete: false,

    createEnemies() {
      return [
        new Guard(100, 500, [{ x: 100, y: 500 }, { x: 100, y: 600 }]),
        new Guard(380, 500, [{ x: 380, y: 500 }, { x: 380, y: 600 }]),
        new Guard(240, 250, [{ x: 160, y: 250 }, { x: 320, y: 250 }]),
      ];
    },

    createBoss() {
      return new SecurityBoss(210, 80);
    },

    createDesks() {
      return [
        new DestructibleDesk(60, 610, 'trump'),    // below left furniture
        new DestructibleDesk(360, 610, 'trump'),   // below right furniture
      ];
    },

    createLasers() {
      return this.lasers.map(l => new LaserBeam(l.x1, l.y1, l.x2, l.y2, l.speed));
    },

    drawBackground(ctx, w, h) {
      // Mansion interior
      ctx.fillStyle = '#2a2222';
      ctx.fillRect(0, 0, w, h);

      // Floor tiles
      ctx.fillStyle = '#332a2a';
      for (let ty = 0; ty < h; ty += 32) {
        for (let tx = 0; tx < w; tx += 32) {
          if ((tx / 32 + ty / 32) % 2 === 0) {
            ctx.fillRect(tx, ty, 32, 32);
          }
        }
      }

      // Carpet runner
      ctx.fillStyle = '#4a1111';
      ctx.fillRect(210, 200, 60, 500);
      ctx.fillStyle = '#5a2222';
      ctx.fillRect(215, 200, 50, 500);

      // Hacking terminal
      if (!this.hackingComplete) {
        const t = this.hackingTerminal;
        ctx.fillStyle = '#334455';
        ctx.fillRect(t.x, t.y, t.w, t.h);
        ctx.fillStyle = '#22aa44';
        ctx.fillRect(t.x + 4, t.y + 4, t.w - 8, t.h - 12);
        ctx.fillStyle = '#fff';
        ctx.font = '8px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('HACK', t.x + t.w / 2, t.y + t.h + 12);
      }
    },

    drawWalls(ctx) {
      // Inner walls — mansion style
      for (let i = 4; i < this.walls.length; i++) {
        const w = this.walls[i];
        ctx.fillStyle = i < 8 ? '#554444' : '#443333';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        if (i < 8) {
          ctx.fillStyle = '#665555';
          ctx.fillRect(w.x, w.y, w.w, 3);
        }
      }
    },

    checkWin(game) {
      return game.boss && !game.boss.alive;
    },
  },

  // ── LEVEL 3: Underground Server Room ───────────────────────────────────
  serverRoom: {
    name: 'SERVER ROOM',
    mapWidth: 480,
    mapHeight: 700,
    playerStart: { x: 220, y: 600 },
    countdown: 120, // 2 minutes

    walls: [
      { x: 0, y: 0, w: 480, h: 20 },
      { x: 0, y: 0, w: 20, h: 700 },
      { x: 460, y: 0, w: 20, h: 700 },
      { x: 0, y: 680, w: 480, h: 20 },
      // Server rack walls
      { x: 80, y: 100, w: 20, h: 200 },
      { x: 200, y: 100, w: 20, h: 200 },
      { x: 260, y: 100, w: 20, h: 200 },
      { x: 380, y: 100, w: 20, h: 200 },
    ],

    createEnemies() {
      // Waves will be spawned dynamically
      return [
        new Guard(100, 300, [{ x: 100, y: 300 }, { x: 400, y: 300 }]),
        new Guard(380, 400, [{ x: 380, y: 400 }, { x: 100, y: 400 }]),
      ];
    },

    createBoss() {
      return new TechBoss(220, 50);
    },

    createServers() {
      return [
        new DestructibleServer(120, 140),
        new DestructibleServer(224, 140),
        new DestructibleServer(340, 140),
      ];
    },

    // Waves of enemies that spawn over time
    waveConfig: [
      { time: 110, enemies: 2 }, // 10s in
      { time: 90, enemies: 3 },  // 30s in
      { time: 60, enemies: 3 },  // 60s in
      { time: 30, enemies: 4 },  // 90s in
    ],

    spawnWaveEnemy(game) {
      const side = Math.random() > 0.5 ? 440 : 30;
      const y = 500 + Math.random() * 100;
      const target = { x: 240, y: 300 };
      const enemy = new Guard(side, y, [
        { x: side, y },
        { x: target.x + (Math.random() - 0.5) * 100, y: target.y + (Math.random() - 0.5) * 100 },
      ]);
      enemy.alertMode = true;
      enemy.alertTimer = 999; // Always alert
      game.enemies.push(enemy);
    },

    drawBackground(ctx, w, h) {
      // Dark tech room
      ctx.fillStyle = '#111118';
      ctx.fillRect(0, 0, w, h);

      // Grid floor
      ctx.strokeStyle = 'rgba(0, 255, 100, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Cable runs
      ctx.strokeStyle = '#222233';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(140, 0);
      ctx.lineTo(140, h);
      ctx.moveTo(340, 0);
      ctx.lineTo(340, h);
      ctx.stroke();
    },

    drawWalls(ctx) {
      for (let i = 4; i < this.walls.length; i++) {
        const w = this.walls[i];
        ctx.fillStyle = '#333344';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        // Rack detail
        ctx.fillStyle = '#2a2a3a';
        for (let y = w.y; y < w.y + w.h; y += 12) {
          ctx.fillRect(w.x + 2, y, w.w - 4, 2);
        }
      }
    },

    checkWin(game) {
      if (!game.destructibles) return false;
      const serversDown = game.destructibles.every(s => s.destroyed);
      const bossDown = !game.boss || !game.boss.alive;
      return serversDown && bossDown;
    },
  },

  // ── LEVEL 4: Villa Ballroom ─────────────────────────────────────────────
  villa: {
    name: 'THE VILLA',
    mapWidth: 520,
    mapHeight: 750,
    playerStart: { x: 250, y: 700 },

    walls: [
      // Boundary
      { x: 0, y: 0, w: 520, h: 20 },
      { x: 0, y: 0, w: 20, h: 750 },
      { x: 500, y: 0, w: 20, h: 750 },
      { x: 0, y: 730, w: 520, h: 20 },
      // Grand pillars in ballroom
      { x: 80, y: 150, w: 24, h: 24 },
      { x: 416, y: 150, w: 24, h: 24 },
      { x: 80, y: 350, w: 24, h: 24 },
      { x: 416, y: 350, w: 24, h: 24 },
      { x: 80, y: 550, w: 24, h: 24 },
      { x: 416, y: 550, w: 24, h: 24 },
      // Central stage/podium area
      { x: 200, y: 80, w: 120, h: 20 },
      // Side furniture
      { x: 30, y: 400, w: 40, h: 25 },
      { x: 450, y: 400, w: 40, h: 25 },
    ],

    createEnemies() {
      return [
        new Guard(100, 600, [{ x: 100, y: 600 }, { x: 400, y: 600 }]),
        new Guard(420, 300, [{ x: 420, y: 300 }, { x: 420, y: 500 }]),
        new Guard(100, 250, [{ x: 100, y: 250 }, { x: 300, y: 250 }]),
      ];
    },

    createBoss() {
      return new PoliticianBoss(230, 120);
    },

    createDesks() {
      return [
        new DestructibleDesk(30, 450, 'biden'),    // left side below furniture
        new DestructibleDesk(450, 450, 'biden'),   // right side below furniture
        new DestructibleDesk(200, 55, 'biden'),    // on stage near podium
      ];
    },

    drawBackground(ctx, w, h) {
      // Elegant ballroom floor
      ctx.fillStyle = '#2a1a10';
      ctx.fillRect(0, 0, w, h);

      // Parquet floor pattern
      for (let ty = 0; ty < h; ty += 40) {
        for (let tx = 0; tx < w; tx += 40) {
          const checker = ((tx / 40) + (ty / 40)) % 2;
          ctx.fillStyle = checker ? '#3a2818' : '#2e1e12';
          ctx.fillRect(tx, ty, 40, 40);
          // Wood grain lines
          ctx.strokeStyle = 'rgba(255,200,100,0.04)';
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(tx, ty + 8 + i * 12);
            ctx.lineTo(tx + 40, ty + 8 + i * 12);
            ctx.stroke();
          }
        }
      }

      // Grand carpet down center
      ctx.fillStyle = '#4a1111';
      ctx.fillRect(180, 0, 160, h);
      ctx.fillStyle = '#5a1818';
      ctx.fillRect(190, 0, 140, h);
      // Gold border on carpet
      ctx.fillStyle = '#aa8822';
      ctx.fillRect(185, 0, 2, h);
      ctx.fillRect(333, 0, 2, h);

      // Stage at top
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(140, 30, 240, 70);
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(145, 35, 230, 60);
      // Podium
      ctx.fillStyle = '#5a4830';
      ctx.fillRect(240, 45, 40, 40);
      ctx.fillStyle = '#6a5840';
      ctx.fillRect(245, 50, 30, 30);
      // Presidential seal (circle)
      ctx.fillStyle = '#aa8822';
      ctx.beginPath();
      ctx.arc(260, 65, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2244aa';
      ctx.beginPath();
      ctx.arc(260, 65, 7, 0, Math.PI * 2);
      ctx.fill();

      // Chandeliers (decorative circles)
      ctx.fillStyle = 'rgba(255, 220, 100, 0.06)';
      ctx.beginPath();
      ctx.arc(160, 250, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(360, 250, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(260, 450, 80, 0, Math.PI * 2);
      ctx.fill();

      // Wall paintings (decorative rectangles on sides)
      ctx.fillStyle = '#4a3a28';
      ctx.fillRect(25, 150, 30, 40);
      ctx.fillRect(465, 150, 30, 40);
      ctx.fillStyle = '#2244aa';
      ctx.fillRect(28, 153, 24, 34);
      ctx.fillRect(468, 153, 24, 34);

      // American flags at stage
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(155, 35, 8, 25);
      ctx.fillRect(357, 35, 8, 25);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(155, 40, 8, 3);
      ctx.fillRect(155, 46, 8, 3);
      ctx.fillRect(357, 40, 8, 3);
      ctx.fillRect(357, 46, 8, 3);
      ctx.fillStyle = '#2244aa';
      ctx.fillRect(155, 35, 4, 8);
      ctx.fillRect(357, 35, 4, 8);
    },

    drawWalls(ctx) {
      // Pillars — marble style
      for (let i = 4; i <= 9; i++) {
        const w = this.walls[i];
        // Pillar base
        ctx.fillStyle = '#d8c8a8';
        ctx.fillRect(w.x - 2, w.y - 2, w.w + 4, w.h + 4);
        // Pillar body
        ctx.fillStyle = '#e8d8b8';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        // Pillar highlight
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(w.x + 2, w.y + 2, w.w / 2 - 2, w.h - 4);
        // Gold cap
        ctx.fillStyle = '#ccaa44';
        ctx.fillRect(w.x - 1, w.y - 1, w.w + 2, 3);
      }
      // Stage wall
      const sw = this.walls[10];
      ctx.fillStyle = '#4a3a28';
      ctx.fillRect(sw.x, sw.y, sw.w, sw.h);
      ctx.fillStyle = '#5a4a38';
      ctx.fillRect(sw.x + 2, sw.y + 2, sw.w - 4, sw.h - 4);
      // Side furniture
      for (let i = 11; i < this.walls.length; i++) {
        const w = this.walls[i];
        ctx.fillStyle = '#5a3a2a';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#6a4a3a';
        ctx.fillRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
      }
    },

    checkWin(game) {
      return game.boss && !game.boss.alive;
    },
  },

  // ── FINAL BOSS ARENA ───────────────────────────────────────────────────
  bossArena: {
    name: 'DR. VORTEX',
    mapWidth: 480,
    mapHeight: 700,
    playerStart: { x: 220, y: 600 },

    walls: [
      { x: 0, y: 0, w: 480, h: 20 },
      { x: 0, y: 0, w: 20, h: 700 },
      { x: 460, y: 0, w: 20, h: 700 },
      { x: 0, y: 680, w: 480, h: 20 },
      // Pillars for cover
      { x: 100, y: 200, w: 30, h: 30 },
      { x: 350, y: 200, w: 30, h: 30 },
      { x: 100, y: 480, w: 30, h: 30 },
      { x: 350, y: 480, w: 30, h: 30 },
      { x: 220, y: 340, w: 40, h: 40 },
    ],

    createEnemies() {
      return [];
    },

    createBoss() {
      return new FinalBoss(200, 80);
    },

    drawBackground(ctx, w, h) {
      // Ominous lair
      ctx.fillStyle = '#0a0008';
      ctx.fillRect(0, 0, w, h);

      // Dark floor pattern
      ctx.fillStyle = '#120010';
      for (let ty = 0; ty < h; ty += 40) {
        for (let tx = 0; tx < w; tx += 40) {
          if ((tx / 40 + ty / 40) % 2 === 0) {
            ctx.fillRect(tx, ty, 40, 40);
          }
        }
      }

      // Red ambient glow from edges
      const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, 350);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(80,0,0,0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Decorative lines
      ctx.strokeStyle = 'rgba(255,0,0,0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w, h);
      ctx.moveTo(w, 0); ctx.lineTo(0, h);
      ctx.stroke();
    },

    drawWalls(ctx) {
      for (let i = 4; i < this.walls.length; i++) {
        const w = this.walls[i];
        ctx.fillStyle = '#2a1a2a';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#3a2a3a';
        ctx.fillRect(w.x + 3, w.y + 3, w.w - 6, w.h - 6);
        // Gold trim on pillar tops
        ctx.fillStyle = '#aa8800';
        ctx.fillRect(w.x, w.y, w.w, 3);
      }
    },

    checkWin(game) {
      return game.boss && !game.boss.alive;
    },
  },
};

// Level order
const LEVEL_ORDER = ['beach', 'mansion', 'serverRoom', 'villa', 'bossArena'];
