// ─── UI Rendering (HUD, overlays) ────────────────────────────────────────────
const UI = {

  // Hacking mini-game state
  hacking: {
    active: false,
    sequence: [],
    input: [],
    timer: 0,
    maxTime: 6,
    success: false,
    failed: false,
    keys: ['W', 'A', 'S', 'D'],
  },

  // Level transition overlay
  transition: {
    active: false,
    timer: 0,
    text: '',
    alpha: 0,
  },

  // Draw the full HUD
  drawHUD(ctx, game) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const cw = ctx.canvas.width;

    // HP hearts (offset down to avoid Telegram close button)
    const heartSprite = Sprites.heart();
    for (let i = 0; i < game.player.maxHp; i++) {
      const hx = 10 + i * 16;
      const hy = 44;
      if (i < game.player.hp) {
        ctx.globalAlpha = 1;
        ctx.drawImage(heartSprite, hx, hy);
      } else {
        ctx.globalAlpha = 0.2;
        ctx.drawImage(heartSprite, hx, hy);
      }
    }
    ctx.globalAlpha = 1;

    // Level name
    ctx.fillStyle = '#aaa';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText(game.levelName, cw - 10, 50);

    // Score
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + game.player.score, 10, 68);

    // Timer (if applicable)
    if (game.countdown > 0) {
      const mins = Math.floor(game.countdown / 60);
      const secs = Math.floor(game.countdown % 60);
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      ctx.fillStyle = game.countdown < 30 ? '#ff3333' : '#ffcc00';
      ctx.font = 'bold 16px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, cw / 2, 54);
    }

    // Total elapsed time
    const totalMins = Math.floor(game.totalTime / 60);
    const totalSecs = Math.floor(game.totalTime % 60);
    ctx.fillStyle = '#666';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText(`${totalMins}:${totalSecs.toString().padStart(2, '0')}`, cw - 10, 64);

    ctx.restore();
  },

  // Hacking mini-game
  startHacking() {
    this.hacking.active = true;
    this.hacking.success = false;
    this.hacking.failed = false;
    this.hacking.input = [];
    this.hacking.timer = this.hacking.maxTime;
    // Generate random sequence of 6 keys
    this.hacking.sequence = [];
    for (let i = 0; i < 6; i++) {
      this.hacking.sequence.push(
        this.hacking.keys[Math.floor(Math.random() * 4)]
      );
    }
  },

  updateHacking(dt) {
    if (!this.hacking.active) return;

    this.hacking.timer -= dt;
    if (this.hacking.timer <= 0) {
      this.hacking.failed = true;
      this.hacking.active = false;
      return;
    }

    // Check key presses
    const idx = this.hacking.input.length;
    if (idx >= this.hacking.sequence.length) {
      this.hacking.success = true;
      this.hacking.active = false;
      return;
    }

    const expected = this.hacking.sequence[idx].toLowerCase();
    if (Input.keys[expected] && !this._lastKeys[expected]) {
      this.hacking.input.push(this.hacking.sequence[idx]);
    }

    // Track key state for edge detection
    this._lastKeys = { ...Input.keys };
  },

  _lastKeys: {},

  drawHacking(ctx) {
    if (!this.hacking.active) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, cw, ch);

    // Terminal frame
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(cw / 2 - 160, ch / 2 - 80, 320, 160);
    ctx.strokeStyle = '#00ff44';
    ctx.lineWidth = 2;
    ctx.strokeRect(cw / 2 - 160, ch / 2 - 80, 320, 160);

    // Title
    ctx.fillStyle = '#00ff44';
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('SECURITY TERMINAL', cw / 2, ch / 2 - 55);

    // Timer bar
    const barW = 280;
    const ratio = this.hacking.timer / this.hacking.maxTime;
    ctx.fillStyle = '#222';
    ctx.fillRect(cw / 2 - barW / 2, ch / 2 - 40, barW, 8);
    ctx.fillStyle = ratio > 0.3 ? '#00ff44' : '#ff3333';
    ctx.fillRect(cw / 2 - barW / 2, ch / 2 - 40, barW * ratio, 8);

    // Key sequence
    ctx.font = 'bold 24px Courier New';
    const seqY = ch / 2;
    for (let i = 0; i < this.hacking.sequence.length; i++) {
      const kx = cw / 2 - 90 + i * 32;
      if (i < this.hacking.input.length) {
        ctx.fillStyle = '#00ff44';
      } else if (i === this.hacking.input.length) {
        ctx.fillStyle = '#ffcc00';
      } else {
        ctx.fillStyle = '#335533';
      }
      ctx.fillText(this.hacking.sequence[i], kx, seqY);
    }

    // Instructions
    ctx.fillStyle = '#558855';
    ctx.font = '11px Courier New';
    ctx.fillText('Press keys in sequence!', cw / 2, ch / 2 + 40);

    ctx.restore();
  },

  // Level transition
  startTransition(text) {
    this.transition.active = true;
    this.transition.timer = 3;
    this.transition.text = text;
    this.transition.alpha = 0;
  },

  updateTransition(dt) {
    if (!this.transition.active) return false;

    this.transition.timer -= dt;

    if (this.transition.timer > 2) {
      // Fade in
      this.transition.alpha = Math.min(1, this.transition.alpha + dt * 2);
    } else if (this.transition.timer > 1) {
      this.transition.alpha = 1;
    } else if (this.transition.timer > 0) {
      // Fade out
      this.transition.alpha = Math.max(0, this.transition.timer);
    } else {
      this.transition.active = false;
      return true; // Transition complete
    }
    return false;
  },

  drawTransition(ctx) {
    if (!this.transition.active) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;

    ctx.globalAlpha = this.transition.alpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);

    if (this.transition.alpha > 0.5) {
      ctx.fillStyle = '#ff6600';
      ctx.font = 'bold 20px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(this.transition.text, cw / 2, ch / 2 - 10);

      ctx.fillStyle = '#888';
      ctx.font = '12px Courier New';
      ctx.fillText('Prepare yourself...', cw / 2, ch / 2 + 20);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  },
};
