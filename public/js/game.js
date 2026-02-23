// ─── Main Game Engine ────────────────────────────────────────────────────────
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.totalTime = 0;

    // Game objects
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.boss = null;
    this.lasers = [];
    this.destructibles = [];
    this.pickups = [];
    this.desks = [];
    this.starPickups = [];
    this.npcs = [];

    // Level
    this.currentLevelIndex = 0;
    this.currentLevel = null;
    this.levelName = '';
    this.mapWidth = 480;
    this.mapHeight = 700;

    // Countdown (for server room)
    this.countdown = 0;
    this.wavesSpawned = {};

    // Camera
    this.camX = 0;
    this.camY = 0;

    // Callbacks
    this.onGameOver = null;
    this.onVictory = null;

    // Hacking state for mansion level
    this.hackingTriggered = false;
    this.hackingDone = false;

    this.resize();
  }

  resize() {
    const wrapper = this.canvas.parentElement;
    const maxW = Math.min(480, wrapper.clientWidth);
    const maxH = Math.min(800, wrapper.clientHeight);

    // Use device pixel ratio for crisp rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = maxW * dpr;
    this.canvas.height = maxH * dpr;
    this.canvas.style.width = maxW + 'px';
    this.canvas.style.height = maxH + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.viewW = maxW;
    this.viewH = maxH;
  }

  // ── Start a new game ───────────────────────────────────────────────────
  start() {
    this.currentLevelIndex = 0;
    this.totalTime = 0;
    this.running = true;
    this.loadLevel(LEVEL_ORDER[0]);
    UI.startTransition(this.currentLevel.name);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  // ── Load a level by key ────────────────────────────────────────────────
  loadLevel(key) {
    const level = Levels[key];
    this.currentLevel = level;
    this.levelName = level.name;
    this.mapWidth = level.mapWidth;
    this.mapHeight = level.mapHeight;

    // Player
    if (!this.player || !this.player.alive) {
      this.player = new Player(level.playerStart.x, level.playerStart.y);
    } else {
      this.player.x = level.playerStart.x;
      this.player.y = level.playerStart.y;
    }

    // Enemies
    this.enemies = level.createEnemies();

    // Boss
    this.boss = level.createBoss ? level.createBoss() : null;

    // Projectiles
    this.projectiles = [];

    // Lasers (mansion)
    this.lasers = level.createLasers ? level.createLasers() : [];

    // Destructibles (server room)
    this.destructibles = level.createServers ? level.createServers() : [];

    // Easter egg desks
    this.desks = level.createDesks ? level.createDesks() : [];
    this.starPickups = [];
    this.npcs = [];

    // Pickups
    this.pickups = [];

    // Countdown
    this.countdown = level.countdown || 0;
    this.wavesSpawned = {};

    // Hacking
    this.hackingTriggered = false;
    this.hackingDone = false;
    if (level === Levels.mansion) {
      level.hackingComplete = false;
    }

    Particles.clear();
  }

  // ── Wall collision check ───────────────────────────────────────────────
  collidesWithWalls(x, y, w, h) {
    if (!this.currentLevel) return false;
    for (const wall of this.currentLevel.walls) {
      if (x < wall.x + wall.w && x + w > wall.x &&
          y < wall.y + wall.h && y + h > wall.y) {
        return true;
      }
    }
    return false;
  }

  // ── Main game loop ─────────────────────────────────────────────────────
  loop(timestamp) {
    if (!this.running) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // Cap delta
    this.lastTime = timestamp;

    if (!UI.transition.active && !UI.hacking.active) {
      this.update(dt);
    }

    // Update transition
    if (UI.transition.active) {
      const done = UI.updateTransition(dt);
      if (done) {
        // Transition complete — continue gameplay
      }
    }

    // Update hacking mini-game
    if (UI.hacking.active) {
      UI.updateHacking(dt);
      if (UI.hacking.success) {
        this.hackingDone = true;
        if (this.currentLevel === Levels.mansion) {
          Levels.mansion.hackingComplete = true;
        }
        this.player.score += 500;
      } else if (UI.hacking.failed) {
        // Take damage on fail, can retry
        this.player.takeDamage(1);
        this.hackingTriggered = false;
      }
    }

    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  // ── Update ─────────────────────────────────────────────────────────────
  update(dt) {
    this.totalTime += dt;

    // Player
    this.player.update(dt, this);

    // Enemies
    for (const e of this.enemies) {
      e.update(dt, this);
    }

    // Boss
    if (this.boss) {
      this.boss.update(dt, this);
    }

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      this.projectiles[i].update(dt, this);
      if (!this.projectiles[i].alive) {
        this.projectiles.splice(i, 1);
      }
    }

    // Lasers
    for (const l of this.lasers) {
      l.update(dt, this);
    }

    // Destructibles
    for (const d of this.destructibles) {
      // Just for drawing, updates handled by player attack
    }

    // Health pickups
    for (const p of this.pickups) {
      p.update(dt);
    }

    // Star pickups (from desks)
    for (const s of this.starPickups) {
      s.update(dt);
    }

    // NPCs (easter egg characters like Maduro)
    for (let i = this.npcs.length - 1; i >= 0; i--) {
      this.npcs[i].update(dt, this);
      if (!this.npcs[i].alive) this.npcs.splice(i, 1);
    }

    // Countdown
    if (this.countdown > 0) {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.countdown = 0;
        // Time's up — game over if servers not destroyed
        if (this.currentLevel === Levels.serverRoom) {
          const allDestroyed = this.destructibles.every(s => s.destroyed);
          if (!allDestroyed) {
            this.player.alive = false;
          }
        }
      }
    }

    // Server room wave spawning
    if (this.currentLevel === Levels.serverRoom && this.countdown > 0) {
      const cfg = Levels.serverRoom.waveConfig;
      for (const wave of cfg) {
        if (this.countdown <= wave.time && !this.wavesSpawned[wave.time]) {
          this.wavesSpawned[wave.time] = true;
          for (let i = 0; i < wave.enemies; i++) {
            Levels.serverRoom.spawnWaveEnemy(this);
          }
        }
      }
    }

    // Hacking terminal — trigger on kick near terminal (not just proximity)
    if (this.currentLevel === Levels.mansion && !this.hackingDone && !this.hackingTriggered) {
      const t = Levels.mansion.hackingTerminal;
      const px = this.player.x + this.player.w / 2;
      const py = this.player.y + this.player.h / 2;
      const dist = Math.hypot(px - (t.x + t.w / 2), py - (t.y + t.h / 2));
      // Show hint when close, trigger on kick
      if (dist < 40 && this.player.kickTimer > 0) {
        this.hackingTriggered = true;
        UI.startHacking();
      }
    }

    // Particles
    Particles.update(dt);

    // Camera follow
    this.camX = this.player.x + this.player.w / 2 - this.viewW / 2;
    this.camY = this.player.y + this.player.h / 2 - this.viewH / 2;
    this.camX = Math.max(0, Math.min(this.mapWidth - this.viewW, this.camX));
    this.camY = Math.max(0, Math.min(this.mapHeight - this.viewH, this.camY));

    // Check player death — wait for death animation to finish
    if (this.player.dying) {
      // Still animating — update player for death anim, skip everything else
      return;
    }
    if (!this.player.alive) {
      this.gameOver();
      return;
    }

    // Check win condition
    if (this.currentLevel && this.currentLevel.checkWin(this)) {
      this.nextLevel();
    }
  }

  // ── Draw ───────────────────────────────────────────────────────────────
  draw() {
    const ctx = this.ctx;
    ctx.save();

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    // Camera transform
    ctx.translate(-this.camX, -this.camY);

    // Background
    if (this.currentLevel) {
      this.currentLevel.drawBackground(ctx, this.mapWidth, this.mapHeight);
      this.currentLevel.drawWalls(ctx);
    }

    // Lasers
    for (const l of this.lasers) {
      l.draw(ctx);
    }

    // Destructibles
    for (const d of this.destructibles) {
      d.draw(ctx);
    }

    // Easter egg desks
    for (const d of this.desks) {
      d.draw(ctx);
    }

    // Health pickups
    for (const p of this.pickups) {
      p.draw(ctx);
    }

    // Star pickups
    for (const s of this.starPickups) {
      s.draw(ctx);
    }

    // NPCs (easter egg)
    for (const n of this.npcs) {
      n.draw(ctx);
    }

    // Enemies
    for (const e of this.enemies) {
      e.draw(ctx);
    }

    // Boss
    if (this.boss) {
      this.boss.draw(ctx);
    }

    // Projectiles
    for (const p of this.projectiles) {
      p.draw(ctx);
    }

    // Player
    this.player.draw(ctx);

    // Particles
    Particles.draw(ctx);

    ctx.restore();

    // HUD (screen-space)
    UI.drawHUD(ctx, this);

    // Hacking overlay
    UI.drawHacking(ctx);

    // Transition overlay
    UI.drawTransition(ctx);
  }

  // ── Next level ─────────────────────────────────────────────────────────
  nextLevel() {
    this.currentLevelIndex++;
    if (this.currentLevelIndex >= LEVEL_ORDER.length) {
      // Victory!
      this.victory();
      return;
    }

    const nextKey = LEVEL_ORDER[this.currentLevelIndex];
    UI.startTransition(Levels[nextKey].name);
    // Load after a short delay so transition plays
    setTimeout(() => {
      this.loadLevel(nextKey);
    }, 1200);
  }

  // ── Game over ──────────────────────────────────────────────────────────
  gameOver() {
    this.running = false;
    if (this.onGameOver) this.onGameOver();
  }

  // ── Victory ────────────────────────────────────────────────────────────
  victory() {
    this.running = false;
    this.player.score += Math.floor(Math.max(0, 600 - this.totalTime) * 10); // Time bonus
    if (this.onVictory) this.onVictory(this.player.score, this.totalTime);
  }

  // ── Restart ────────────────────────────────────────────────────────────
  restart() {
    this.player = null;
    this.start();
  }
}
