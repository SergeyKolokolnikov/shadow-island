// ─── Input Handler (Keyboard + Touch) ────────────────────────────────────────
const Input = {
  keys: {},
  attack: false,
  _attackConsumed: false,

  init() {
    // Keyboard
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

    // Mobile D-pad
    const dpadBtns = document.querySelectorAll('.dpad-btn');
    dpadBtns.forEach((btn) => {
      const dir = btn.dataset.dir;
      const keyMap = { up: 'w', down: 's', left: 'a', right: 'd' };
      const key = keyMap[dir];

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.keys[key] = true;
      });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.keys[key] = false;
      });
      btn.addEventListener('touchcancel', (e) => {
        this.keys[key] = false;
      });
    });

    // Mobile attack button
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

  // Movement vector
  getDirection() {
    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy = -1;
    if (this.keys['s'] || this.keys['arrowdown']) dy = 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx = -1;
    if (this.keys['d'] || this.keys['arrowright']) dx = 1;
    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }
    return { dx, dy };
  },

  // Check if any movement key is held
  isMoving() {
    return this.keys['w'] || this.keys['s'] || this.keys['a'] || this.keys['d']
      || this.keys['arrowup'] || this.keys['arrowdown']
      || this.keys['arrowleft'] || this.keys['arrowright'];
  },
};
