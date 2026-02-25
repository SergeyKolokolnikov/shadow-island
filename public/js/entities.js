// ─── Game Entities ───────────────────────────────────────────────────────────

// ── Player ─────────────────────────────────────────────────────────────────
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 28;
    this.h = 28;
    this.speed = 120;
    this.hp = 5;
    this.maxHp = 5;
    this.alive = true;
    this.dying = false;       // death animation state
    this.deathAnim = 0;       // death animation timer
    this.invulnTime = 0;      // invulnerability frames
    this.attackCooldown = 0;
    this.attackRange = 36;
    this.attackDamage = 1;
    this.facingX = 0;
    this.facingY = 1;
    this.score = 0;
    this.flashTimer = 0;
    this.kickTimer = 0;       // visual: how long to show kick leg
    this.kickDirX = 0;        // kick direction for visual
    this.kickDirY = 0;
  }

  takeDamage(amount) {
    if (this.invulnTime > 0 || this.dying) return;
    this.hp -= amount;
    this.invulnTime = 0.8;
    this.flashTimer = 0.8;
    Particles.sparks(this.x + this.w / 2, this.y + this.h / 2);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dying = true;
      this.deathAnim = 2.5; // 2.5 second death animation
      Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#ff3333', 20);
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  update(dt, game) {
    if (!this.alive && !this.dying) return;

    // Death animation
    if (this.dying) {
      this.deathAnim -= dt;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;

      // Phase 1 (2.5 → 1.5): player stumbles, sparks fly
      if (this.deathAnim > 1.5) {
        this.x += Math.sin(this.deathAnim * 8) * 1.5;
        if (Math.random() < 0.3) {
          Particles.sparks(
            cx + (Math.random() - 0.5) * 20,
            cy + (Math.random() - 0.5) * 20
          );
        }
      }
      // Phase 2 (1.5 → 0.6): falls to knees, equipment scatters
      if (this.deathAnim <= 1.5 && this.deathAnim > 0.6) {
        if (Math.random() < 0.25) {
          const angle = Math.random() * Math.PI * 2;
          Particles.list.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * (30 + Math.random() * 50),
            vy: Math.sin(angle) * (30 + Math.random() * 50) - 15,
            life: 0.8 + Math.random() * 0.5,
            maxLife: 1.2,
            size: 2 + Math.random() * 3,
            color: ['#445566', '#33ff88', '#ddbb88', '#222'][Math.floor(Math.random() * 4)],
          });
        }
      }
      // Phase 3 (0.6 → 0): final collapse, red flash
      if (this.deathAnim <= 0.6 && !this._deathFinalBlast) {
        this._deathFinalBlast = true;
        Particles.explode(cx, cy, '#ff3333', 20);
        Particles.explode(cx, cy, '#ff6600', 15);
        Particles.explode(cx, cy, '#ffcc00', 10);
      }

      if (this.deathAnim <= 0) {
        this.alive = false;
        this.dying = false;
      }
      return;
    }

    this.invulnTime = Math.max(0, this.invulnTime - dt);
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.kickTimer = Math.max(0, this.kickTimer - dt);

    const dir = Input.getDirection();
    if (dir.dx !== 0 || dir.dy !== 0) {
      this.facingX = dir.dx;
      this.facingY = dir.dy;
    }

    let nx = this.x + dir.dx * this.speed * dt;
    let ny = this.y + dir.dy * this.speed * dt;

    // Keep in bounds
    nx = Math.max(0, Math.min(game.mapWidth - this.w, nx));
    ny = Math.max(0, Math.min(game.mapHeight - this.h, ny));

    // Wall collision
    if (!game.collidesWithWalls(nx, this.y, this.w, this.h)) this.x = nx;
    if (!game.collidesWithWalls(this.x, ny, this.w, this.h)) this.y = ny;

    // Keyboard attack (Space)
    if (Input.consumeAttack() && this.attackCooldown <= 0) {
      this.attackCooldown = 0.3;
      this.performKick(game, this.facingX, this.facingY);
    }

    // Kick joystick — continuous kicking while held in a direction
    if (Input.isKicking() && this.attackCooldown <= 0) {
      const kick = Input.getKickDirection();
      this.attackCooldown = 0.3;
      this.performKick(game, kick.dx, kick.dy);
    }

    // Kick joystick — fire on release
    if (Input.consumeKick() && this.attackCooldown <= 0) {
      const kick = Input.getKickDirection();
      if (kick.dx !== 0 || kick.dy !== 0) {
        this.attackCooldown = 0.3;
        this.performKick(game, kick.dx, kick.dy);
      }
    }

    // Pick up health items
    if (game.pickups) {
      for (let i = game.pickups.length - 1; i >= 0; i--) {
        const p = game.pickups[i];
        const dist = Math.hypot(
          (this.x + this.w / 2) - (p.x + p.w / 2),
          (this.y + this.h / 2) - (p.y + p.h / 2)
        );
        if (dist < 22) {
          this.heal(p.healAmount);
          Particles.sparks(p.x + p.w / 2, p.y + p.h / 2);
          game.pickups.splice(i, 1);
        }
      }
    }

    // Pick up star items (easter egg bonus)
    if (game.starPickups) {
      for (let i = game.starPickups.length - 1; i >= 0; i--) {
        const s = game.starPickups[i];
        if (s.collected) continue;
        const dist = Math.hypot(
          (this.x + this.w / 2) - (s.x + s.w / 2),
          (this.y + this.h / 2) - (s.y + s.h / 2)
        );
        if (dist < 24) {
          s.collected = true;
          this.score += s.points;
          // Gold sparkle explosion
          Particles.explode(s.x + s.w / 2, s.y + s.h / 2, '#ffd700', 15);
          Particles.explode(s.x + s.w / 2, s.y + s.h / 2, '#ffff88', 10);
          game.starPickups.splice(i, 1);
        }
      }
    }
  }

  performKick(game, dirX, dirY) {
    // Normalize kick direction
    const len = Math.hypot(dirX, dirY);
    if (len > 0) {
      dirX /= len;
      dirY /= len;
    } else {
      dirX = this.facingX;
      dirY = this.facingY;
    }

    this.kickDirX = dirX;
    this.kickDirY = dirY;
    this.kickTimer = 0.15;

    const cx = this.x + this.w / 2 + dirX * this.attackRange;
    const cy = this.y + this.h / 2 + dirY * this.attackRange;

    Particles.sparks(cx, cy);

    // Check hits on enemies
    for (const e of game.enemies) {
      if (!e.alive) continue;
      const ex = e.x + (e.w || 28) / 2;
      const ey = e.y + (e.h || 28) / 2;
      const dist = Math.hypot(cx - ex, cy - ey);
      if (dist < this.attackRange + 10) {
        e.takeDamage(this.attackDamage, game);
      }
    }

    // Check hits on boss
    if (game.boss && game.boss.alive) {
      const bx = game.boss.x + (game.boss.w || 40) / 2;
      const by = game.boss.y + (game.boss.h || 40) / 2;
      const dist = Math.hypot(cx - bx, cy - by);
      if (dist < this.attackRange + 20) {
        game.boss.takeDamage(this.attackDamage, game);
      }
    }

    // Check hits on destructibles (servers)
    if (game.destructibles) {
      for (const d of game.destructibles) {
        if (d.destroyed) continue;
        const dx2 = d.x + d.w / 2;
        const dy2 = d.y + d.h / 2;
        const dist = Math.hypot(cx - dx2, cy - dy2);
        if (dist < this.attackRange + 16) {
          d.takeDamage(this.attackDamage, game);
        }
      }
    }

    // Check hits on destructible desks (easter eggs)
    if (game.desks) {
      for (const d of game.desks) {
        if (d.destroyed) continue;
        const dx2 = d.x + d.w / 2;
        const dy2 = d.y + d.h / 2;
        const dist = Math.hypot(cx - dx2, cy - dy2);
        if (dist < this.attackRange + 18) {
          d.takeDamage(this.attackDamage, game);
        }
      }
    }
  }

  draw(ctx) {
    if (!this.alive && !this.dying) return;

    // Death animation rendering
    if (this.dying) {
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      const progress = 1 - (this.deathAnim / 2.5);

      // Red vignette flash
      if (this.deathAnim > 1.5) {
        ctx.fillStyle = `rgba(255, 0, 0, ${0.15 * Math.sin(this.deathAnim * 6)})`;
        ctx.fillRect(this.x - 40, this.y - 40, this.w + 80, this.h + 80);
      }

      // Shaking sprite
      const shake = (Math.random() - 0.5) * (6 + progress * 8);
      const alpha = Math.max(0.15, this.deathAnim / 2.5);
      ctx.globalAlpha = alpha;

      // Tilting as falling
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(progress * 0.8); // tilt to one side
      ctx.scale(1 - progress * 0.3, 1 + progress * 0.1); // squish
      ctx.drawImage(Sprites.player(), -this.w / 2 - 2 + shake, -this.h / 2 - 2);
      ctx.restore();

      ctx.globalAlpha = 1;

      // "MISSION FAILED" text during final phase
      if (this.deathAnim <= 1.0 && this.deathAnim > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;

        // Dark overlay growing
        const overlayAlpha = Math.min(0.7, (1.0 - this.deathAnim) * 1.5);
        ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
        ctx.fillRect(0, 0, cw, ch);

        // Text
        const textAlpha = Math.min(1, (1.0 - this.deathAnim) * 2);
        ctx.globalAlpha = textAlpha;

        // Skull icon
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 28px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('💀', cw / 2, ch / 2 - 20);

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 18px Courier New';
        ctx.fillText(I18n.t('agent_down'), cw / 2, ch / 2 + 10);

        ctx.fillStyle = '#888';
        ctx.font = '11px Courier New';
        ctx.fillText(I18n.t('mission_failed_dots'), cw / 2, ch / 2 + 30);

        ctx.globalAlpha = 1;
        ctx.restore();
      }

      return;
    }

    // Invulnerability blink
    if (this.invulnTime > 0 && Math.floor(this.invulnTime * 10) % 2) return;

    ctx.drawImage(Sprites.player(), this.x - 2, this.y - 2);

    // Draw kick leg visual
    if (this.kickTimer > 0) {
      const pcx = this.x + this.w / 2;
      const pcy = this.y + this.h / 2;
      const legLen = 18 + (0.15 - this.kickTimer) * 80; // extend out
      const legX = pcx + this.kickDirX * legLen;
      const legY = pcy + this.kickDirY * legLen;

      // Leg line
      ctx.strokeStyle = '#ddbb88';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pcx + this.kickDirX * 10, pcy + this.kickDirY * 10);
      ctx.lineTo(legX, legY);
      ctx.stroke();

      // Boot/foot
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(legX, legY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Impact flash
      if (this.kickTimer > 0.1) {
        ctx.fillStyle = 'rgba(255, 200, 50, 0.6)';
        ctx.beginPath();
        ctx.arc(legX, legY, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.lineWidth = 1;
      ctx.lineCap = 'butt';
    }
  }
}

// ── Star Pickup (dropped by destructible desks — easter egg) ──────────────
class StarPickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 16;
    this.h = 16;
    this.points = 250;
    this.timer = 0;
    this.collected = false;
  }

  update(dt) {
    this.timer += dt;
  }

  draw(ctx) {
    if (this.collected) return;
    const bob = Math.sin(this.timer * 5) * 3;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2 + bob;

    // Glow
    ctx.fillStyle = `rgba(255, 215, 0, ${0.15 + Math.sin(this.timer * 6) * 0.08})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    // Star shape
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 5;
      const r = 7;
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      const innerAngle = angle + Math.PI / 5;
      const ir = 3;
      ctx.lineTo(cx + Math.cos(innerAngle) * ir, cy + Math.sin(innerAngle) * ir);
    }
    ctx.closePath();
    ctx.fill();

    // Bright center
    ctx.fillStyle = '#fff8dc';
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle effect
    if (Math.sin(this.timer * 8) > 0.7) {
      ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
      ctx.fillRect(cx - 1, cy - 6 + bob, 2, 4);
      ctx.fillRect(cx - 1, cy + 3 + bob, 2, 4);
      ctx.fillRect(cx - 6, cy - 1 + bob, 4, 2);
      ctx.fillRect(cx + 3, cy - 1 + bob, 4, 2);
    }
  }
}

// ── Destructible Desk (easter egg — drops stars) ──────────────────────────
class DestructibleDesk {
  constructor(x, y, style) {
    this.x = x;
    this.y = y;
    this.w = style === 'cage' ? 40 : 36;
    this.h = style === 'cage' ? 40 : 24;
    this.hp = style === 'cage' ? 4 : 3;
    this.maxHp = this.hp;
    this.destroyed = false;
    this.flashTimer = 0;
    this.style = style || 'trump'; // 'trump', 'biden', or 'cage'
    this.spawnMaduro = false;      // set to true for the easter egg desk
  }

  takeDamage(amount, game) {
    if (this.destroyed) return;
    this.hp -= amount;
    this.flashTimer = 0.1;
    Particles.sparks(this.x + this.w / 2, this.y + this.h / 2);
    if (this.hp <= 0) {
      this.destroyed = true;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      // Explosion
      const color = this.style === 'cage' ? '#555555' : this.style === 'trump' ? '#aa8822' : '#cc2222';
      Particles.explode(cx, cy, color, 12);
      Particles.explode(cx, cy, '#ffffcc', 8);
      // Drop star pickup
      if (!game.starPickups) game.starPickups = [];
      game.starPickups.push(new StarPickup(this.x + 10, this.y));
      game.player.score += 50;
      // Spawn Maduro NPC only from the special desk
      if (this.spawnMaduro) {
        if (!game.npcs) game.npcs = [];
        game.npcs.push(new MaduroNPC(this.x, this.y - 20));
      }
    }
  }

  draw(ctx) {
    if (this.destroyed) {
      // Debris
      if (this.style === 'cage') {
        // Bent bars and broken lock
        ctx.fillStyle = '#444';
        ctx.fillRect(this.x + 4, this.y + 10, 2, 16);
        ctx.fillRect(this.x + 14, this.y + 8, 2, 20);
        ctx.fillRect(this.x + 24, this.y + 12, 2, 14);
        ctx.fillRect(this.x + 34, this.y + 6, 2, 18);
        ctx.fillStyle = '#882222';
        ctx.fillRect(this.x + 8, this.y + 20, 10, 3);
        ctx.fillStyle = '#aa8822';
        ctx.fillRect(this.x + 16, this.y + 28, 4, 4);
      } else {
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(this.x + 4, this.y + 8, 14, 10);
        ctx.fillRect(this.x + 20, this.y + 6, 12, 12);
      }
      return;
    }

    if (this.flashTimer > 0) ctx.globalAlpha = 0.5;

    if (this.style === 'cage') {
      // BDSM cage — black iron bars, padlock, red leather accents
      const x = this.x, y = this.y, w = this.w, h = this.h;
      // Base platform — dark metal
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      // Red leather lining (visible inside)
      ctx.fillStyle = '#551111';
      ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      ctx.fillStyle = '#661818';
      ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
      // Vertical bars
      ctx.fillStyle = '#444';
      for (let bx = x + 4; bx < x + w - 2; bx += 5) {
        ctx.fillRect(bx, y, 2, h);
      }
      // Horizontal bars (top, middle, bottom)
      ctx.fillStyle = '#444';
      ctx.fillRect(x, y, w, 2);
      ctx.fillRect(x, y + Math.floor(h / 2) - 1, w, 2);
      ctx.fillRect(x, y + h - 2, w, 2);
      // Corner rivets — silver dots
      ctx.fillStyle = '#999';
      const rv = 2;
      ctx.fillRect(x + 1, y + 1, rv, rv);
      ctx.fillRect(x + w - 3, y + 1, rv, rv);
      ctx.fillRect(x + 1, y + h - 3, rv, rv);
      ctx.fillRect(x + w - 3, y + h - 3, rv, rv);
      // Padlock — gold lock on front center
      ctx.fillStyle = '#aa8822';
      ctx.fillRect(x + w / 2 - 3, y + h - 8, 6, 6);
      ctx.fillStyle = '#ccaa44';
      ctx.fillRect(x + w / 2 - 2, y + h - 12, 4, 5);
      // Keyhole
      ctx.fillStyle = '#222';
      ctx.fillRect(x + w / 2 - 1, y + h - 6, 2, 2);
      // Red X straps (leather cross on top)
      ctx.fillStyle = '#882222';
      for (let i = 0; i < Math.min(w, h) - 8; i += 2) {
        ctx.fillRect(x + 4 + i, y + 4 + i * (h - 8) / (w - 8), 2, 2);
        ctx.fillRect(x + w - 6 - i, y + 4 + i * (h - 8) / (w - 8), 2, 2);
      }
    } else if (this.style === 'trump') {
      // Trump's desk — mahogany with gold trim
      ctx.fillStyle = '#5a3020';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = '#6a4030';
      ctx.fillRect(this.x + 2, this.y + 2, this.w - 4, this.h - 4);
      // Gold trim
      ctx.fillStyle = '#ccaa44';
      ctx.fillRect(this.x, this.y, this.w, 2);
      ctx.fillRect(this.x, this.y, 2, this.h);
      ctx.fillRect(this.x + this.w - 2, this.y, 2, this.h);
      // Nameplate
      ctx.fillStyle = '#ccaa44';
      ctx.fillRect(this.x + 10, this.y + 8, 16, 8);
      ctx.fillStyle = '#222';
      ctx.fillRect(this.x + 11, this.y + 9, 14, 6);
      // Papers
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(this.x + 4, this.y + 4, 5, 6);
      ctx.fillRect(this.x + 28, this.y + 5, 5, 7);
    } else {
      // Biden's podium desk — walnut with presidential seal
      ctx.fillStyle = '#4a3828';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = '#5a4838';
      ctx.fillRect(this.x + 2, this.y + 2, this.w - 4, this.h - 4);
      // Presidential seal (mini)
      ctx.fillStyle = '#ccaa44';
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2244aa';
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      // Microphone
      ctx.fillStyle = '#888';
      ctx.fillRect(this.x + 6, this.y + 2, 2, 10);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(this.x + 5, this.y + 1, 4, 3);
    }

    ctx.globalAlpha = 1;

    // HP bar
    if (this.hp < this.maxHp) {
      const barW = 28;
      const barH = 3;
      ctx.fillStyle = '#333';
      ctx.fillRect(this.x + 4, this.y - 6, barW, barH);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(this.x + 4, this.y - 6, barW * (this.hp / this.maxHp), barH);
    }
  }
}

// ── Maduro NPC (spawns from broken desk, claps, gives bonus points) ───────
class MaduroNPC {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 28;
    this.h = 28;
    this.timer = 0;
    this.lifetime = 4.0;     // stays for 4 seconds
    this.alive = true;
    this.bonusGiven = false;
    this.bonusPoints = 500;
    this.clapTimer = 0;
    this.clapFrame = 0;      // 0 or 1 for clap animation
    this.moveDir = Math.random() > 0.5 ? 1 : -1;
    this.floatTextTimer = 0;
    this.sparkleTimer = 0;
  }

  update(dt, game) {
    if (!this.alive) return;
    this.timer += dt;
    this.clapTimer += dt;
    this.sparkleTimer += dt;

    // Clap animation toggle
    if (this.clapTimer > 0.25) {
      this.clapTimer = 0;
      this.clapFrame = 1 - this.clapFrame;
      // Clap sparkles
      Particles.list.push({
        x: this.x + this.w / 2,
        y: this.y + 4,
        vx: (Math.random() - 0.5) * 30,
        vy: -20 - Math.random() * 20,
        life: 0.4,
        maxLife: 0.5,
        size: 2,
        color: '#ffd700',
      });
    }

    // Slight walking motion
    this.x += this.moveDir * 15 * dt;
    if (this.x < 30 || this.x > game.mapWidth - 60) this.moveDir *= -1;

    // Give bonus when player approaches
    if (!this.bonusGiven && game.player.alive) {
      const dist = Math.hypot(
        (game.player.x + game.player.w / 2) - (this.x + this.w / 2),
        (game.player.y + game.player.h / 2) - (this.y + this.h / 2)
      );
      if (dist < 50) {
        this.bonusGiven = true;
        game.player.score += this.bonusPoints;
        this.floatTextTimer = 1.5;
        // Big celebration
        Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#ffd700', 20);
        Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#ff4444', 15);
      }
    }

    // Float text countdown
    if (this.floatTextTimer > 0) this.floatTextTimer -= dt;

    // Disappear after lifetime
    if (this.timer > this.lifetime) {
      this.alive = false;
      Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#cc2222', 10);
    }
  }

  draw(ctx) {
    if (!this.alive) return;

    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;

    // Glow aura
    ctx.fillStyle = `rgba(255, 215, 0, ${0.08 + Math.sin(this.timer * 4) * 0.04})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fill();

    // Maduro sprite
    const bob = Math.sin(this.timer * 3) * 1;
    ctx.save();
    // Clap frame — slight scale pulse
    if (this.clapFrame) {
      ctx.translate(cx, cy + bob);
      ctx.scale(1.05, 0.95);
      ctx.translate(-cx, -(cy + bob));
    }
    ctx.drawImage(Sprites.maduro(), this.x - 6, this.y - 6 + bob);
    ctx.restore();

    // "👏" text above head
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'center';
    const clapText = this.clapFrame ? '👏' : '👐';
    ctx.fillText(clapText, cx, this.y - 8 + bob);

    // Bonus text floating up
    if (this.floatTextTimer > 0) {
      const alpha = Math.min(1, this.floatTextTimer);
      const floatY = this.y - 20 - (1.5 - this.floatTextTimer) * 30;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(`+${this.bonusPoints}`, cx, floatY);
      ctx.globalAlpha = 1;
    }

  }
}

// ── Health Pickup (dropped by guards) ──────────────────────────────────────
class HealthPickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 14;
    this.h = 14;
    this.healAmount = 1;
    this.timer = 0; // for bob animation
  }

  update(dt) {
    this.timer += dt;
  }

  draw(ctx) {
    const bob = Math.sin(this.timer * 4) * 2;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2 + bob;

    // Glow
    ctx.fillStyle = 'rgba(0, 255, 100, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Red cross background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Red cross
    ctx.fillStyle = '#ff2244';
    ctx.fillRect(cx - 1.5, cy - 5, 3, 10);
    ctx.fillRect(cx - 5, cy - 1.5, 10, 3);
  }
}

// ── Guard (patrols, has flashlight cone) ───────────────────────────────────
class Guard {
  constructor(x, y, patrolPoints) {
    this.x = x;
    this.y = y;
    this.w = 28;
    this.h = 28;
    this.speed = 45;
    this.hp = 2;
    this.alive = true;
    this.patrolPoints = patrolPoints || [{ x, y }];
    this.patrolIndex = 0;
    this.waitTimer = 0;
    this.facing = Math.PI / 2; // direction angle
    this.alertMode = false;
    this.alertTimer = 0;
    this.flashlightRange = 90;
    this.flashlightAngle = Math.PI / 4; // cone half-angle
    this.flashTimer = 0;
  }

  takeDamage(amount, game) {
    this.hp -= amount;
    this.flashTimer = 0.1;
    Particles.sparks(this.x + this.w / 2, this.y + this.h / 2);
    if (this.hp <= 0) {
      this.alive = false;
      game.player.score += 100;
      Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#556655', 15);
      // 40% chance to drop health pickup
      if (Math.random() < 0.4) {
        if (!game.pickups) game.pickups = [];
        game.pickups.push(new HealthPickup(this.x + 4, this.y + 4));
      }
    }
  }

  // Check if player is in flashlight cone
  canSeePlayer(player) {
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > this.flashlightRange) return false;

    const angleToPlayer = Math.atan2(dy, dx);
    let angleDiff = angleToPlayer - this.facing;
    // Normalize
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    return Math.abs(angleDiff) < this.flashlightAngle;
  }

  update(dt, game) {
    if (!this.alive) return;
    this.flashTimer = Math.max(0, this.flashTimer - dt);

    const player = game.player;

    // Check if player spotted
    if (this.canSeePlayer(player) && player.alive && player.invulnTime <= 0) {
      if (!this.alertMode) {
        this.alertMode = true;
        this.alertTimer = 3;
        Particles.alert(this.x + this.w / 2, this.y);
      }
    }

    if (this.alertMode) {
      this.alertTimer -= dt;
      if (this.alertTimer <= 0) this.alertMode = false;

      // Chase player
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        this.x += (dx / dist) * this.speed * 1.5 * dt;
        this.y += (dy / dist) * this.speed * 1.5 * dt;
        this.facing = Math.atan2(dy, dx);
      }

      // Damage on contact
      if (dist < 24 && player.invulnTime <= 0) {
        player.takeDamage(1);
      }
    } else {
      // Patrol
      const target = this.patrolPoints[this.patrolIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 4) {
        this.waitTimer += dt;
        // Rotate while waiting
        this.facing += dt * 0.8;
        if (this.waitTimer > 1.5) {
          this.waitTimer = 0;
          this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
        }
      } else {
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
        this.facing = Math.atan2(dy, dx);
      }
    }
  }

  draw(ctx) {
    if (!this.alive) return;

    // Flashlight cone
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;

    ctx.save();
    ctx.globalAlpha = this.alertMode ? 0.25 : 0.12;
    ctx.fillStyle = this.alertMode ? '#ff3333' : '#ffff66';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, this.flashlightRange,
      this.facing - this.flashlightAngle,
      this.facing + this.flashlightAngle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Guard sprite
    if (this.flashTimer > 0 && Math.floor(this.flashTimer * 20) % 2) {
      ctx.globalAlpha = 0.5;
    }
    ctx.drawImage(Sprites.guard(), this.x - 2, this.y - 2);
    ctx.globalAlpha = 1;
  }
}

// ── Drone (mini boss — flies, shoots) ──────────────────────────────────────
class Drone {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 36;
    this.h = 36;
    this.hp = 8;
    this.maxHp = 8;
    this.alive = true;
    this.speed = 60;
    this.shootTimer = 0;
    this.moveAngle = 0;
    this.moveTimer = 0;
    this.flashTimer = 0;
    this.dying = false;
    this.deathAnim = 0;
  }

  takeDamage(amount, game) {
    if (this.dying) return;
    this.hp -= amount;
    this.flashTimer = 0.1;
    Particles.sparks(this.x + this.w / 2, this.y + this.h / 2);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dying = true;
      this.deathAnim = 2.0;
      game.player.score += 500;
      game.projectiles = [];
    }
  }

  update(dt, game) {
    // Death animation: drone spins and crashes
    if (this.dying) {
      this.deathAnim -= dt;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      // Spiral down with smoke
      this.x += Math.sin(this.deathAnim * 8) * 2;
      this.y += dt * 60;
      if (Math.random() < 0.4) {
        Particles.list.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy,
          vx: (Math.random() - 0.5) * 30,
          vy: -20 - Math.random() * 20,
          life: 0.5 + Math.random() * 0.3,
          maxLife: 0.8,
          size: 3 + Math.random() * 3,
          color: ['#555', '#666', '#ff4400'][Math.floor(Math.random() * 3)],
        });
      }
      if (this.deathAnim <= 0) {
        this.alive = false;
        this.dying = false;
        // Final ground explosion
        Particles.explode(cx, cy, '#ff6600', 25);
        Particles.explode(cx, cy, '#88aacc', 20);
        Particles.explode(cx, cy, '#ffcc00', 15);
      }
      return;
    }

    if (!this.alive) return;
    this.flashTimer = Math.max(0, this.flashTimer - dt);

    // Random movement pattern
    this.moveTimer -= dt;
    if (this.moveTimer <= 0) {
      this.moveAngle = Math.random() * Math.PI * 2;
      this.moveTimer = 1 + Math.random();
    }

    this.x += Math.cos(this.moveAngle) * this.speed * dt;
    this.y += Math.sin(this.moveAngle) * this.speed * dt;

    // Keep in bounds
    this.x = Math.max(20, Math.min(game.mapWidth - this.w - 20, this.x));
    this.y = Math.max(20, Math.min(game.mapHeight / 2, this.y));

    // Shoot at player
    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && game.player.alive) {
      this.shootTimer = 1.2;
      const px = game.player.x + game.player.w / 2;
      const py = game.player.y + game.player.h / 2;
      const dx = px - (this.x + this.w / 2);
      const dy = py - (this.y + this.h / 2);
      const dist = Math.hypot(dx, dy);
      game.projectiles.push(new Projectile(
        this.x + this.w / 2, this.y + this.h / 2,
        (dx / dist) * 130, (dy / dist) * 130, true
      ));
    }
  }

  draw(ctx) {
    if (!this.alive && !this.dying) return;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x + this.w / 2, this.y + this.h + 4, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hover bob (or spinning if dying)
    const bob = this.dying ? 0 : Math.sin(Date.now() / 200) * 3;

    if (this.flashTimer > 0 || this.dying) ctx.globalAlpha = this.dying ? 0.6 : 0.5;

    // Spin if dying
    if (this.dying) {
      ctx.save();
      const cx = this.x + this.w / 2 - 2;
      const cy = this.y + this.h / 2 - 2;
      ctx.translate(cx, cy);
      ctx.rotate(this.deathAnim * 10);
      ctx.drawImage(Sprites.drone(), -this.w / 2, -this.h / 2);
      ctx.restore();
    } else {
      ctx.drawImage(Sprites.drone(), this.x - 2, this.y - 2 + bob);
    }
    ctx.globalAlpha = 1;

    // HP bar
    const barW = 36;
    const barH = 4;
    const bx = this.x + (this.w - barW) / 2;
    const by = this.y - 8 + bob;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(bx, by, barW * Math.max(0, this.hp / this.maxHp), barH);
  }
}

// ── Security Boss (dash + stun) ────────────────────────────────────────────
class SecurityBoss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 44;
    this.h = 44;
    this.hp = 15;
    this.maxHp = 15;
    this.alive = true;
    this.speed = 50;
    this.state = 'idle'; // idle, dash, stun, cooldown
    this.stateTimer = 1;
    this.dashTarget = { x: 0, y: 0 };
    this.flashTimer = 0;
    this.dying = false;
    this.deathAnim = 0;
  }

  takeDamage(amount, game) {
    if (this.dying) return;
    this.hp -= amount;
    this.flashTimer = 0.1;
    Particles.sparks(this.x + this.w / 2, this.y + this.h / 2);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dying = true;
      this.deathAnim = 2.5;
      game.player.score += 1000;
    }
  }

  update(dt, game) {
    // Death animation: stumbles, sparks fly, collapses
    if (this.dying) {
      this.deathAnim -= dt;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      // Stumble sideways
      this.x += Math.sin(this.deathAnim * 5) * 1.5;
      // Sparks and flashes
      if (Math.random() < 0.3) {
        Particles.sparks(
          cx + (Math.random() - 0.5) * 30,
          cy + (Math.random() - 0.5) * 30
        );
      }
      // Scattered "tie" and "hair" particles
      if (this.deathAnim < 1.5 && Math.random() < 0.25) {
        const angle = Math.random() * Math.PI * 2;
        Particles.list.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * (40 + Math.random() * 60),
          vy: Math.sin(angle) * (40 + Math.random() * 60) - 20,
          life: 1.0 + Math.random(),
          maxLife: 1.5,
          size: 3 + Math.random() * 3,
          color: ['#cc0000', '#f5d442', '#1a1a6a', '#ffe066'][Math.floor(Math.random() * 4)],
        });
      }
      if (this.deathAnim <= 0) {
        this.alive = false;
        this.dying = false;
        Particles.explode(cx, cy, '#ff6600', 25);
        Particles.explode(cx, cy, '#f5d442', 20);
      }
      return;
    }

    if (!this.alive) return;
    this.flashTimer = Math.max(0, this.flashTimer - dt);

    const player = game.player;
    this.stateTimer -= dt;

    switch (this.state) {
      case 'idle':
        // Walk toward player slowly
        if (player.alive) {
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 10) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
          }
        }
        if (this.stateTimer <= 0) {
          this.state = 'dash';
          this.stateTimer = 0.4;
          this.dashTarget = { x: player.x, y: player.y };
          Particles.alert(this.x + this.w / 2, this.y);
        }
        break;

      case 'dash':
        // Fast dash toward target
        const dx2 = this.dashTarget.x - this.x;
        const dy2 = this.dashTarget.y - this.y;
        const dist2 = Math.hypot(dx2, dy2);
        if (dist2 > 5) {
          const dashSpeed = 300;
          this.x += (dx2 / dist2) * dashSpeed * dt;
          this.y += (dy2 / dist2) * dashSpeed * dt;
        }
        // Damage on contact
        if (player.alive) {
          const cdist = Math.hypot(
            (player.x + player.w / 2) - (this.x + this.w / 2),
            (player.y + player.h / 2) - (this.y + this.h / 2)
          );
          if (cdist < 30) player.takeDamage(1);
        }
        if (this.stateTimer <= 0) {
          this.state = 'stun';
          this.stateTimer = 1.5;
          // Stun wave
          Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#aaaaff', 8);
          // Damage nearby
          if (player.alive) {
            const sd = Math.hypot(
              (player.x + player.w / 2) - (this.x + this.w / 2),
              (player.y + player.h / 2) - (this.y + this.h / 2)
            );
            if (sd < 60) player.takeDamage(1);
          }
        }
        break;

      case 'stun':
        // Vulnerable — stands still
        if (this.stateTimer <= 0) {
          this.state = 'cooldown';
          this.stateTimer = 2;
        }
        break;

      case 'cooldown':
        if (player.alive) {
          const dx3 = player.x - this.x;
          const dy3 = player.y - this.y;
          const dist3 = Math.hypot(dx3, dy3);
          if (dist3 > 80) {
            this.x += (dx3 / dist3) * this.speed * 0.5 * dt;
            this.y += (dy3 / dist3) * this.speed * 0.5 * dt;
          }
        }
        if (this.stateTimer <= 0) {
          this.state = 'idle';
          this.stateTimer = 2;
        }
        break;
    }

    // Keep in bounds
    this.x = Math.max(0, Math.min(game.mapWidth - this.w, this.x));
    this.y = Math.max(0, Math.min(game.mapHeight - this.h, this.y));
  }

  draw(ctx) {
    if (!this.alive && !this.dying) return;

    // Dying — shaking + fading
    if (this.dying) {
      const shake = (Math.random() - 0.5) * 5;
      const alpha = Math.max(0.15, this.deathAnim / 2.5);
      ctx.globalAlpha = alpha;
      ctx.drawImage(Sprites.securityBoss(), this.x - 2 + shake, this.y - 2);
      ctx.globalAlpha = 1;

      // HP bar at 0
      const barW = 44;
      const barH = 5;
      ctx.fillStyle = '#333';
      ctx.fillRect(this.x, this.y - 10, barW, barH);
      return;
    }

    // Stun indicator
    if (this.state === 'stun') {
      ctx.strokeStyle = '#aaaaff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Dash trail
    if (this.state === 'dash') {
      ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
      ctx.fillRect(this.x - 4, this.y - 4, this.w + 8, this.h + 8);
    }

    if (this.flashTimer > 0) ctx.globalAlpha = 0.5;
    ctx.drawImage(Sprites.securityBoss(), this.x - 2, this.y - 2);
    ctx.globalAlpha = 1;

    // HP bar
    const barW = 44;
    const barH = 5;
    const bx = this.x;
    const by = this.y - 10;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
  }
}

// ── Tech Boss (server room — Bill Gates caricature) ──────────────────────
// Mechanics: deploys "firewall" shields, throws "virus" projectiles in bursts,
// spawns mini-drones. Vulnerable when recharging.
class TechBoss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 44;
    this.h = 44;
    this.hp = 12;
    this.maxHp = 12;
    this.alive = true;
    this.speed = 40;
    this.state = 'move';  // move, burst, shield, recharge
    this.stateTimer = 2;
    this.flashTimer = 0;
    this.burstCount = 0;
    this.burstTimer = 0;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.dying = false;
    this.deathAnim = 0;
    this.moveAngle = 0;
  }

  takeDamage(amount, game) {
    if (this.dying) return;
    if (this.shieldActive) {
      // Shield absorbs damage — show sparks
      Particles.sparks(this.x + this.w / 2, this.y + this.h / 2);
      return;
    }
    this.hp -= amount;
    this.flashTimer = 0.1;
    Particles.sparks(this.x + this.w / 2, this.y + this.h / 2);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dying = true;
      this.deathAnim = 2.5;
      game.player.score += 1200;
      game.projectiles = [];
    }
  }

  update(dt, game) {
    if (this.dying) {
      this.deathAnim -= dt;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      // Electrification death — sparks + blue screen particles
      if (Math.random() < 0.4) {
        Particles.list.push({
          x: cx + (Math.random() - 0.5) * 40,
          y: cy + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 80,
          vy: (Math.random() - 0.5) * 80 - 20,
          life: 0.6 + Math.random() * 0.5,
          maxLife: 1.0,
          size: 2 + Math.random() * 3,
          color: ['#00aaff', '#4488ff', '#88ccff', '#ffffff', '#6a4a8a'][Math.floor(Math.random() * 5)],
        });
      }
      // "BSOD" text particles
      if (this.deathAnim < 1.5 && Math.random() < 0.15) {
        Particles.list.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 100,
          vy: -30 - Math.random() * 50,
          life: 1.0, maxLife: 1.2,
          size: 3 + Math.random() * 3,
          color: '#0044ff',
        });
      }
      if (this.deathAnim <= 0) {
        this.alive = false;
        this.dying = false;
        Particles.explode(cx, cy, '#00aaff', 30);
        Particles.explode(cx, cy, '#6a4a8a', 20);
      }
      return;
    }

    if (!this.alive) return;
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.stateTimer -= dt;

    const player = game.player;
    if (!player.alive) return;

    switch (this.state) {
      case 'move':
        // Move around, tracking player loosely
        this.moveAngle += (Math.random() - 0.5) * 2 * dt;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 80) {
          this.x += (dx / dist) * this.speed * dt;
          this.y += (dy / dist) * this.speed * dt;
        } else {
          this.x += Math.cos(this.moveAngle) * this.speed * dt;
          this.y += Math.sin(this.moveAngle) * this.speed * dt;
        }
        if (this.stateTimer <= 0) {
          this.state = 'burst';
          this.burstCount = 5;
          this.burstTimer = 0;
          this.stateTimer = 2.0;
        }
        break;

      case 'burst':
        // Rapid fire 5 "virus" projectiles
        this.burstTimer -= dt;
        if (this.burstTimer <= 0 && this.burstCount > 0) {
          this.burstTimer = 0.25;
          this.burstCount--;
          const px = player.x + player.w / 2;
          const py = player.y + player.h / 2;
          const ddx = px - (this.x + this.w / 2);
          const ddy = py - (this.y + this.h / 2);
          const dd = Math.hypot(ddx, ddy);
          const spread = (Math.random() - 0.5) * 0.4;
          const angle = Math.atan2(ddy, ddx) + spread;
          game.projectiles.push(new Projectile(
            this.x + this.w / 2, this.y + this.h / 2,
            Math.cos(angle) * 100, Math.sin(angle) * 100, true
          ));
        }
        if (this.burstCount <= 0 && this.stateTimer <= 0) {
          // Activate shield
          this.state = 'shield';
          this.shieldActive = true;
          this.stateTimer = 2.5;
          Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#00aaff', 10);
        }
        break;

      case 'shield':
        // Protected — moving slowly
        this.x += Math.sin(Date.now() / 500) * 0.5;
        if (this.stateTimer <= 0) {
          this.state = 'recharge';
          this.shieldActive = false;
          this.stateTimer = 2.0;
        }
        break;

      case 'recharge':
        // Vulnerable! Standing still, "rebooting"
        if (this.stateTimer <= 0) {
          this.state = 'move';
          this.stateTimer = 2.5;
        }
        break;
    }

    // Keep in bounds
    this.x = Math.max(20, Math.min(game.mapWidth - this.w - 20, this.x));
    this.y = Math.max(20, Math.min(game.mapHeight - this.h - 20, this.y));
  }

  draw(ctx) {
    if (!this.alive && !this.dying) return;

    if (this.dying) {
      const shake = (Math.random() - 0.5) * 6;
      ctx.globalAlpha = Math.max(0.15, this.deathAnim / 2.5);
      ctx.drawImage(Sprites.techBoss(), this.x - 2 + shake, this.y - 2);
      ctx.globalAlpha = 1;
      return;
    }

    // Shield visual
    if (this.shieldActive) {
      ctx.strokeStyle = `rgba(0, 170, 255, ${0.4 + Math.sin(Date.now() / 100) * 0.2})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      // Inner glow
      ctx.fillStyle = 'rgba(0, 170, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Recharge indicator
    if (this.state === 'recharge') {
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }

    if (this.flashTimer > 0) ctx.globalAlpha = 0.5;
    ctx.drawImage(Sprites.techBoss(), this.x - 2, this.y - 2);
    ctx.globalAlpha = 1;

    // HP bar
    const barW = 44;
    const barH = 5;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x, this.y - 10, barW, barH);
    ctx.fillStyle = this.shieldActive ? '#00aaff' : '#8844cc';
    ctx.fillRect(this.x, this.y - 10, barW * (this.hp / this.maxHp), barH);
  }
}

// ── Politician Boss (villa — Biden caricature) ──────────────────────────
// Mechanics: slow but tanky, summons Secret Service guards,
// does sweeping "speech" shockwave, charges with podium ram.
class PoliticianBoss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 44;
    this.h = 44;
    this.hp = 14;
    this.maxHp = 14;
    this.alive = true;
    this.speed = 35;
    this.state = 'walk';  // walk, speech, summon, stumble
    this.stateTimer = 2.5;
    this.flashTimer = 0;
    this.dying = false;
    this.deathAnim = 0;
    this.summoned = 0;  // how many guards summoned
  }

  takeDamage(amount, game) {
    if (this.dying) return;
    this.hp -= amount;
    this.flashTimer = 0.1;
    Particles.sparks(this.x + this.w / 2, this.y + this.h / 2);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dying = true;
      this.deathAnim = 2.5;
      game.player.score += 1500;
      game.projectiles = [];
    }
  }

  update(dt, game) {
    if (this.dying) {
      this.deathAnim -= dt;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      // Stumbles, papers fly, American flag particles
      this.x += Math.sin(this.deathAnim * 3) * 2;
      this.y += dt * 10;
      if (Math.random() < 0.35) {
        const angle = Math.random() * Math.PI * 2;
        Particles.list.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * (30 + Math.random() * 60),
          vy: Math.sin(angle) * (30 + Math.random() * 60) - 20,
          life: 1.0 + Math.random(),
          maxLife: 1.5,
          size: 3 + Math.random() * 3,
          color: ['#cc2222', '#ffffff', '#2244aa', '#1a2244', '#e8e8e8'][Math.floor(Math.random() * 5)],
        });
      }
      if (this.deathAnim <= 0) {
        this.alive = false;
        this.dying = false;
        Particles.explode(cx, cy, '#cc2222', 20);
        Particles.explode(cx, cy, '#2244aa', 20);
        Particles.explode(cx, cy, '#ffffff', 15);
      }
      return;
    }

    if (!this.alive) return;
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.stateTimer -= dt;

    const player = game.player;
    if (!player.alive) return;

    switch (this.state) {
      case 'walk':
        // Walk toward player
        {
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 10) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
          }
          // Contact damage
          if (dist < 28) player.takeDamage(1);
        }
        if (this.stateTimer <= 0) {
          // Alternate between speech and summon
          if (this.summoned < 3 && Math.random() < 0.4) {
            this.state = 'summon';
            this.stateTimer = 1.5;
          } else {
            this.state = 'speech';
            this.stateTimer = 1.0;
            Particles.alert(this.x + this.w / 2, this.y);
          }
        }
        break;

      case 'speech':
        // Shockwave attack — expanding ring damages player
        if (this.stateTimer <= 0.3 && !this._speechFired) {
          this._speechFired = true;
          const cx = this.x + this.w / 2;
          const cy = this.y + this.h / 2;
          // Ring of projectiles
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            game.projectiles.push(new Projectile(
              cx, cy,
              Math.cos(angle) * 70, Math.sin(angle) * 70, true
            ));
          }
          Particles.explode(cx, cy, '#2244aa', 15);
        }
        if (this.stateTimer <= 0) {
          this._speechFired = false;
          this.state = 'stumble';
          this.stateTimer = 2.0;
        }
        break;

      case 'summon':
        // Summon a Secret Service guard
        if (this.stateTimer <= 0.5 && !this._summonFired) {
          this._summonFired = true;
          this.summoned++;
          const side = Math.random() > 0.5 ? game.mapWidth - 50 : 30;
          const gy = 100 + Math.random() * (game.mapHeight - 200);
          const guard = new Guard(side, gy, [
            { x: side, y: gy },
            { x: player.x, y: player.y },
          ]);
          guard.alertMode = true;
          guard.alertTimer = 999;
          guard.hp = 3;
          game.enemies.push(guard);
          Particles.explode(side, gy, '#1a2244', 10);
        }
        if (this.stateTimer <= 0) {
          this._summonFired = false;
          this.state = 'walk';
          this.stateTimer = 3.0;
        }
        break;

      case 'stumble':
        // Vulnerable — moving erratically
        this.x += Math.sin(this.stateTimer * 6) * 1.5;
        if (this.stateTimer <= 0) {
          this.state = 'walk';
          this.stateTimer = 2.5;
        }
        break;
    }

    // Keep in bounds
    this.x = Math.max(20, Math.min(game.mapWidth - this.w - 20, this.x));
    this.y = Math.max(20, Math.min(game.mapHeight - this.h - 20, this.y));
  }

  draw(ctx) {
    if (!this.alive && !this.dying) return;

    if (this.dying) {
      const shake = (Math.random() - 0.5) * 6;
      ctx.globalAlpha = Math.max(0.15, this.deathAnim / 2.5);
      ctx.drawImage(Sprites.politicianBoss(), this.x - 2 + shake, this.y - 2);
      ctx.globalAlpha = 1;
      return;
    }

    // Speech charge-up aura
    if (this.state === 'speech') {
      const progress = 1 - (this.stateTimer / 1.0);
      ctx.fillStyle = `rgba(34, 68, 170, ${0.1 + progress * 0.15})`;
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 25 + progress * 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stumble indicator
    if (this.state === 'stumble') {
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }

    if (this.flashTimer > 0) ctx.globalAlpha = 0.5;
    ctx.drawImage(Sprites.politicianBoss(), this.x - 2, this.y - 2);
    ctx.globalAlpha = 1;

    // HP bar
    const barW = 44;
    const barH = 5;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x, this.y - 10, barW, barH);
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(this.x, this.y - 10, barW * (this.hp / this.maxHp), barH);
  }
}

// ── Final Villain (3 phases) ───────────────────────────────────────────────
class FinalBoss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 52;
    this.h = 52;
    this.hp = 16;          // nerfed from 25
    this.maxHp = 16;
    this.alive = true;
    this.phase = 1;
    this.speed = 35;       // nerfed from 40
    this.attackTimer = 0;
    this.teleportTimer = 0;
    this.moveAngle = 0;
    this.moveTimer = 0;
    this.flashTimer = 0;
    this.enraged = false;
    this.deathAnim = 0;    // epic death animation timer
    this.dying = false;
  }

  takeDamage(amount, game) {
    if (this.dying) return;
    this.hp -= amount;
    this.flashTimer = 0.1;
    Particles.sparks(this.x + this.w / 2, this.y + this.h / 2);

    // Phase transitions
    const hpPercent = this.hp / this.maxHp;
    if (hpPercent <= 0.3 && this.phase < 3) {
      this.phase = 3;
      this.enraged = true;
      this.speed = 60;   // nerfed from 80
      Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#ff0000', 30);
    } else if (hpPercent <= 0.6 && this.phase < 2) {
      this.phase = 2;
      this.speed = 45;   // nerfed from 55
      Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#ff6600', 20);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.dying = true;
      this.deathAnim = 3.5; // 3.5 second epic death sequence
      game.player.score += 3000;
      // Clear all projectiles — mercy
      game.projectiles = [];
    }
  }

  update(dt, game) {
    // Epic death animation
    if (this.dying) {
      this.deathAnim -= dt;
      this.flashTimer = 0.05;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;

      // Phase 1 (3.5→2.0): rapid explosions around boss
      if (this.deathAnim > 2.0) {
        if (Math.random() < 0.4) {
          Particles.explode(
            cx + (Math.random() - 0.5) * 60,
            cy + (Math.random() - 0.5) * 60,
            ['#ff0000', '#ff6600', '#ffcc00', '#ffffff'][Math.floor(Math.random() * 4)],
            8
          );
        }
      }
      // Phase 2 (2.0→0.8): screen-wide flashing, "files" scatter
      if (this.deathAnim <= 2.0 && this.deathAnim > 0.8) {
        if (Math.random() < 0.5) {
          // Scatter "document" particles in all directions
          for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 120;
            Particles.list.push({
              x: cx, y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1.5 + Math.random(),
              maxLife: 2.0,
              size: 4 + Math.random() * 4,
              color: ['#fff', '#eee', '#ffd', '#ffe'][Math.floor(Math.random() * 4)],
            });
          }
          Particles.explode(cx, cy, '#ff4400', 6);
        }
      }
      // Phase 3 (0.8→0): final massive explosion + white flash
      if (this.deathAnim <= 0.8 && this.deathAnim > 0) {
        if (!this._finalBlast) {
          this._finalBlast = true;
          // Huge multi-color explosion
          for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            const speed = 80 + Math.random() * 100;
            Particles.list.push({
              x: cx, y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1.2 + Math.random() * 0.8,
              maxLife: 2.0,
              size: 3 + Math.random() * 5,
              color: ['#ff0000', '#ff6600', '#ffcc00', '#ffffff', '#ff3388'][i % 5],
            });
          }
          // Ring of sparks
          for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            Particles.list.push({
              x: cx + Math.cos(angle) * 30,
              y: cy + Math.sin(angle) * 30,
              vx: Math.cos(angle) * 150,
              vy: Math.sin(angle) * 150,
              life: 0.6,
              maxLife: 0.6,
              size: 2,
              color: '#ffff88',
            });
          }
        }
      }
      if (this.deathAnim <= 0) {
        this.alive = false;
        this.dying = false;
      }
      return;
    }

    if (!this.alive) return;
    this.flashTimer = Math.max(0, this.flashTimer - dt);

    const player = game.player;
    if (!player.alive) return;

    this.attackTimer -= dt;
    this.teleportTimer -= dt;

    switch (this.phase) {
      case 1: // Throws projectiles
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
          this.moveAngle = Math.random() * Math.PI * 2;
          this.moveTimer = 1.5 + Math.random();
        }
        this.x += Math.cos(this.moveAngle) * this.speed * dt;
        this.y += Math.sin(this.moveAngle) * this.speed * dt;

        if (this.attackTimer <= 0) {
          this.attackTimer = 1.4;   // nerfed from 1.0
          this.throwProjectile(game);
        }
        break;

      case 2: // Teleports randomly
        if (this.teleportTimer <= 0) {
          this.teleportTimer = 2.8;  // nerfed from 2.0
          Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#aa00ff', 15);
          this.x = 40 + Math.random() * (game.mapWidth - 80);
          this.y = 40 + Math.random() * (game.mapHeight - 120);
          Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#aa00ff', 15);
        }
        if (this.attackTimer <= 0) {
          this.attackTimer = 1.2;    // nerfed from 0.8
          this.throwProjectile(game);
        }
        break;

      case 3: // Enrage — chases, but nerfed
        {
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 10) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
          }
          if (dist < 30) player.takeDamage(1);

          if (this.attackTimer <= 0) {
            this.attackTimer = 0.8;  // nerfed from 0.5
            // Spray 3 directions instead of 4
            for (let a = 0; a < 3; a++) {
              const angle = (Math.PI * 2 / 3) * a + Date.now() / 1000;
              game.projectiles.push(new Projectile(
                this.x + this.w / 2, this.y + this.h / 2,
                Math.cos(angle) * 80, Math.sin(angle) * 80, true  // nerfed speed from 110
              ));
            }
          }

          if (this.teleportTimer <= 0) {
            this.teleportTimer = 4.0;  // nerfed from 3.0
            Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#ff0000', 15);
            this.x = 40 + Math.random() * (game.mapWidth - 80);
            this.y = 40 + Math.random() * (game.mapHeight - 120);
          }
        }
        break;
    }

    // Keep in bounds
    this.x = Math.max(10, Math.min(game.mapWidth - this.w - 10, this.x));
    this.y = Math.max(10, Math.min(game.mapHeight - this.h - 10, this.y));
  }

  throwProjectile(game) {
    const px = game.player.x + game.player.w / 2;
    const py = game.player.y + game.player.h / 2;
    const dx = px - (this.x + this.w / 2);
    const dy = py - (this.y + this.h / 2);
    const dist = Math.hypot(dx, dy);
    const speed = this.enraged ? 100 : 80;  // nerfed from 150/110
    game.projectiles.push(new Projectile(
      this.x + this.w / 2, this.y + this.h / 2,
      (dx / dist) * speed, (dy / dist) * speed, true
    ));
  }

  draw(ctx) {
    if (!this.alive && !this.dying) return;

    // Death animation — boss shakes + white flash
    if (this.dying) {
      const shake = (Math.random() - 0.5) * 6;
      const shake2 = (Math.random() - 0.5) * 6;
      const alpha = Math.max(0.2, this.deathAnim / 3.5);
      ctx.globalAlpha = alpha;
      ctx.drawImage(Sprites.villain(), this.x - 2 + shake, this.y - 2 + shake2);
      ctx.globalAlpha = 1;

      // White flash during final blast
      if (this.deathAnim <= 0.8 && this.deathAnim > 0.3) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = `rgba(255,255,255,${(0.8 - this.deathAnim) * 1.5})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
      }

      // Boss HP bar still shows at 0
      const barW2 = 200;
      const barH2 = 8;
      const bx2 = (ctx.canvas.width / 2 - barW2 / 2);
      const by2 = 78;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#222';
      ctx.fillRect(bx2 - 1, by2 - 1, barW2 + 2, barH2 + 2);
      ctx.fillStyle = '#441111';
      ctx.fillRect(bx2, by2, barW2, barH2);
      ctx.fillStyle = '#fff';
      ctx.font = '10px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(I18n.t('boss_island_keeper'), bx2 + barW2 / 2, by2 - 3);
      ctx.restore();
      return;
    }

    // Enrage aura
    if (this.enraged) {
      ctx.fillStyle = `rgba(255, 0, 0, ${0.15 + Math.sin(Date.now() / 100) * 0.1})`;
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 40, 0, Math.PI * 2);
      ctx.fill();
    }

    // Phase 2 teleport shimmer
    if (this.phase === 2) {
      ctx.fillStyle = `rgba(170, 0, 255, ${0.1 + Math.sin(Date.now() / 150) * 0.08})`;
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 35, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.flashTimer > 0) ctx.globalAlpha = 0.5;
    ctx.drawImage(Sprites.villain(), this.x - 2, this.y - 2);
    ctx.globalAlpha = 1;

    // Boss HP bar (below Telegram close button)
    const barW = 200;
    const barH = 8;
    const bx = (ctx.canvas.width / 2 - barW / 2);
    const by = 78;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen coords
    ctx.fillStyle = '#222';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#441111';
    ctx.fillRect(bx, by, barW, barH);
    const hpColor = this.enraged ? '#ff0000' : (this.phase === 2 ? '#ff6600' : '#cc0000');
    ctx.fillStyle = hpColor;
    ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(I18n.t('boss_island_keeper'), bx + barW / 2, by - 3);
    ctx.restore();
  }
}

// ── Projectile ─────────────────────────────────────────────────────────────
class Projectile {
  constructor(x, y, vx, vy, hostile) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.hostile = hostile; // damages player if true
    this.alive = true;
    this.w = 6;
    this.h = 6;
  }

  update(dt, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Out of bounds
    if (this.x < -20 || this.x > game.mapWidth + 20 ||
        this.y < -20 || this.y > game.mapHeight + 20) {
      this.alive = false;
      return;
    }

    // Hit player
    if (this.hostile && game.player.alive) {
      const dx = (game.player.x + game.player.w / 2) - this.x;
      const dy = (game.player.y + game.player.h / 2) - this.y;
      if (Math.hypot(dx, dy) < 16) {
        game.player.takeDamage(1);
        this.alive = false;
        Particles.sparks(this.x, this.y);
      }
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    const sprite = this.hostile ? Sprites.enemyProjectile() : Sprites.projectile();
    ctx.drawImage(sprite, this.x - 4, this.y - 4);
  }
}

// ── Destructible Server ────────────────────────────────────────────────────
class DestructibleServer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 32;
    this.h = 48;
    this.hp = 5;
    this.maxHp = 5;
    this.destroyed = false;
    this.flashTimer = 0;
  }

  takeDamage(amount, game) {
    if (this.destroyed) return;
    this.hp -= amount;
    this.flashTimer = 0.1;
    Particles.sparks(this.x + this.w / 2, this.y + this.h / 2);
    if (this.hp <= 0) {
      this.destroyed = true;
      game.player.score += 300;
      Particles.explode(this.x + this.w / 2, this.y + this.h / 2, '#33ff88', 20);
    }
  }

  draw(ctx) {
    if (this.destroyed) {
      // Destroyed remains
      ctx.fillStyle = '#222';
      ctx.fillRect(this.x + 4, this.y + 20, 24, 28);
      ctx.fillStyle = '#333';
      ctx.fillRect(this.x + 8, this.y + 24, 16, 20);
      return;
    }

    if (this.flashTimer > 0) ctx.globalAlpha = 0.5;
    ctx.drawImage(Sprites.server(), this.x, this.y);
    ctx.globalAlpha = 1;

    // HP bar
    const barW = 28;
    const barH = 3;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x + 2, this.y - 6, barW, barH);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(this.x + 2, this.y - 6, barW * (this.hp / this.maxHp), barH);
  }
}

// ── Laser beam obstacle ────────────────────────────────────────────────────
class LaserBeam {
  constructor(x1, y1, x2, y2, toggleSpeed) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.active = true;
    this.timer = 0;
    this.toggleSpeed = toggleSpeed || 2; // seconds per toggle
  }

  update(dt, game) {
    this.timer += dt;
    if (this.timer >= this.toggleSpeed) {
      this.timer = 0;
      this.active = !this.active;
    }

    if (this.active && game.player.alive) {
      // Simple line-to-rect collision
      if (this.intersectsPlayer(game.player)) {
        game.player.takeDamage(1);
      }
    }
  }

  intersectsPlayer(p) {
    // Simplified: check distance from player center to laser line
    const pcx = p.x + p.w / 2;
    const pcy = p.y + p.h / 2;
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return false;

    const t = Math.max(0, Math.min(1,
      ((pcx - this.x1) * dx + (pcy - this.y1) * dy) / (len * len)));
    const closestX = this.x1 + t * dx;
    const closestY = this.y1 + t * dy;
    const dist = Math.hypot(pcx - closestX, pcy - closestY);
    return dist < 14;
  }

  draw(ctx) {
    if (!this.active) {
      // Dim inactive laser
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(this.x1, this.y1);
      ctx.lineTo(this.x2, this.y2);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    // Active laser
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();

    // Glow
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;

    // Emitter nodes
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(this.x1 - 3, this.y1 - 3, 6, 6);
    ctx.fillRect(this.x2 - 3, this.y2 - 3, 6, 6);
  }
}
