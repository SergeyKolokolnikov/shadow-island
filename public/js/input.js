// ─── Input Handler (Keyboard + Dual Virtual Joysticks) ───────────────────────
const Input = {
  keys: {},
  attack: false,
  _attackConsumed: false,

  // Movement joystick state
  _joystickActive: false,
  _joystickDx: 0,
  _joystickDy: 0,

  // Kick joystick state
  _kickActive: false,
  _kickDx: 0,
  _kickDy: 0,
  _kickFired: false,

  init() {
    // ── Keyboard ───────────────────────────────────────────────────────────
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') {
        e.preventDefault();
        this.attack = true;
        this._attackConsumed = false;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // ── Setup both joysticks ───────────────────────────────────────────────
    this._setupJoystick('joystick-base', 'joystick-thumb', 'move');
    this._setupJoystick('kick-base', 'kick-thumb', 'kick');
  },

  // Generic joystick setup (reused for both move and kick)
  _setupJoystick(baseId, thumbId, type) {
    const base = document.getElementById(baseId);
    const thumb = document.getElementById(thumbId);
    if (!base || !thumb) return;

    const maxDist = type === 'move' ? 37 : 33;
    let centerX = 0, centerY = 0;
    let touchId = null;

    const updateThumb = (tx, ty) => {
      let dx = tx - centerX;
      let dy = ty - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      thumb.style.transform = `translate(${dx}px, ${dy}px)`;

      const ndx = dx / maxDist;
      const ndy = dy / maxDist;

      if (type === 'move') {
        this._joystickDx = Math.abs(ndx) < 0.15 ? 0 : ndx;
        this._joystickDy = Math.abs(ndy) < 0.15 ? 0 : ndy;
      } else {
        this._kickDx = Math.abs(ndx) < 0.2 ? 0 : ndx;
        this._kickDy = Math.abs(ndy) < 0.2 ? 0 : ndy;
      }
    };

    const resetThumb = () => {
      thumb.style.transform = 'translate(0px, 0px)';
      if (type === 'move') {
        this._joystickActive = false;
        this._joystickDx = 0;
        this._joystickDy = 0;
      } else {
        // Fire kick on release if joystick was deflected
        if (this._kickActive && (this._kickDx !== 0 || this._kickDy !== 0)) {
          this._kickFired = true;
        }
        this._kickActive = false;
        this._kickDx = 0;
        this._kickDy = 0;
      }
      touchId = null;
    };

    base.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (touchId !== null) return;
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = base.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;

      if (type === 'move') {
        this._joystickActive = true;
      } else {
        this._kickActive = true;
        this._kickFired = false;
      }
      updateThumb(touch.clientX, touch.clientY);
    });

    window.addEventListener('touchmove', (e) => {
      if (touchId === null) return;
      for (const touch of e.changedTouches) {
        if (touch.identifier === touchId) {
          e.preventDefault();
          updateThumb(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    const endHandler = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === touchId) {
          resetThumb();
          break;
        }
      }
    };

    window.addEventListener('touchend', endHandler);
    window.addEventListener('touchcancel', endHandler);
  },

  // Returns true once per press (keyboard space)
  consumeAttack() {
    if (this.attack && !this._attackConsumed) {
      this._attackConsumed = true;
      this.attack = false;
      return true;
    }
    return false;
  },

  // Returns kick direction once when kick joystick is released
  consumeKick() {
    if (this._kickFired) {
      this._kickFired = false;
      return true;
    }
    return false;
  },

  // Get current kick joystick direction (for continuous kicking while held)
  getKickDirection() {
    return { dx: this._kickDx, dy: this._kickDy };
  },

  isKicking() {
    return this._kickActive && (this._kickDx !== 0 || this._kickDy !== 0);
  },

  // Movement vector (keyboard + joystick combined)
  getDirection() {
    let dx = 0, dy = 0;

    // Keyboard
    if (this.keys['w'] || this.keys['arrowup']) dy = -1;
    if (this.keys['s'] || this.keys['arrowdown']) dy = 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx = -1;
    if (this.keys['d'] || this.keys['arrowright']) dx = 1;

    // Normalize keyboard diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    // Joystick overrides if active
    if (this._joystickActive && (this._joystickDx !== 0 || this._joystickDy !== 0)) {
      dx = this._joystickDx;
      dy = this._joystickDy;
    }

    return { dx, dy };
  },

  // Check if any movement input is active
  isMoving() {
    if (this._joystickActive && (this._joystickDx !== 0 || this._joystickDy !== 0)) return true;
    return this.keys['w'] || this.keys['s'] || this.keys['a'] || this.keys['d']
      || this.keys['arrowup'] || this.keys['arrowdown']
      || this.keys['arrowleft'] || this.keys['arrowright'];
  },
};
