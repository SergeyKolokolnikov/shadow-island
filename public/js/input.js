// ─── Input Handler (Keyboard + Virtual Joystick) ─────────────────────────────
const Input = {
  keys: {},
  attack: false,
  _attackConsumed: false,

  // Joystick state
  _joystickActive: false,
  _joystickDx: 0,
  _joystickDy: 0,

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

    // ── Virtual Joystick ───────────────────────────────────────────────────
    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');

    if (base && thumb) {
      const maxDist = 37; // max thumb offset from center (px)
      let baseRect = null;
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

        // Normalize to -1..1
        this._joystickDx = dx / maxDist;
        this._joystickDy = dy / maxDist;

        // Dead zone
        if (Math.abs(this._joystickDx) < 0.15) this._joystickDx = 0;
        if (Math.abs(this._joystickDy) < 0.15) this._joystickDy = 0;
      };

      const resetThumb = () => {
        thumb.style.transform = 'translate(0px, 0px)';
        this._joystickActive = false;
        this._joystickDx = 0;
        this._joystickDy = 0;
        touchId = null;
      };

      base.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (touchId !== null) return; // already tracking a touch
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        baseRect = base.getBoundingClientRect();
        centerX = baseRect.left + baseRect.width / 2;
        centerY = baseRect.top + baseRect.height / 2;
        this._joystickActive = true;
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

      window.addEventListener('touchend', (e) => {
        for (const touch of e.changedTouches) {
          if (touch.identifier === touchId) {
            resetThumb();
            break;
          }
        }
      });

      window.addEventListener('touchcancel', (e) => {
        for (const touch of e.changedTouches) {
          if (touch.identifier === touchId) {
            resetThumb();
            break;
          }
        }
      });
    }

    // ── Mobile attack button ───────────────────────────────────────────────
    const atkBtn = document.getElementById('btn-attack');
    if (atkBtn) {
      atkBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.attack = true;
        this._attackConsumed = false;
      });
    }
  },

  // Returns true once per press
  consumeAttack() {
    if (this.attack && !this._attackConsumed) {
      this._attackConsumed = true;
      this.attack = false;
      return true;
    }
    return false;
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
