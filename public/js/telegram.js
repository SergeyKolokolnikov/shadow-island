// ─── Platform Integration (Telegram + Max) ──────────────────────────────────
const TG = {
  user: null,
  initData: '',
  platform: 'max', // default; overridden if Telegram/Max detected

  init() {
    // 1. Try Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
      this.platform = 'telegram';
      const webapp = window.Telegram.WebApp;
      webapp.ready();
      webapp.expand();

      this.initData = webapp.initData || '';

      const u = webapp.initDataUnsafe && webapp.initDataUnsafe.user;
      if (u) {
        this.user = {
          id: u.id,
          username: u.username || u.first_name || 'Agent',
          firstName: u.first_name || '',
          isPremium: u.is_premium || false,
        };
      }
    }

    // 2. Try Max WebApp (window.WebApp from max-web-app.js)
    if (!this.user && window.WebApp && window.WebApp.initData) {
      this.platform = 'max';
      const webapp = window.WebApp;
      webapp.ready();

      this.initData = webapp.initData || '';

      const u = webapp.initDataUnsafe && webapp.initDataUnsafe.user;
      if (u) {
        this.user = {
          id: 'max_' + u.id,
          username: u.username || u.first_name || 'Агент',
          firstName: u.first_name || '',
          isPremium: false,
        };
      }
    }

    // 3. Fallback — persistent anonymous user via localStorage
    if (!this.user) {
      this.platform = I18n.lang === 'ru' ? 'max' : 'telegram';
      let savedId = null;
      try { savedId = localStorage.getItem('shadow_island_user_id'); } catch (e) {}

      if (!savedId) {
        savedId = 'anon_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
        try { localStorage.setItem('shadow_island_user_id', savedId); } catch (e) {}
      }

      this.user = {
        id: savedId,
        username: 'Agent',
        firstName: 'Agent',
        isPremium: false,
      };
    }

    console.log('[TG] Platform:', this.platform, '| User:', this.user.id, '| Name:', this.user.username);

    // Register user in Google Sheets (fire and forget)
    this.registerUser();
  },

  // Register user in Google Sheets when they open the game
  async registerUser() {
    try {
      await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: this.initData,
          user: this.user,
          platform: this.platform,
        }),
      });
    } catch (e) {
      console.error('Failed to register user:', e);
    }
  },

  // Track play attempt (increment counter in Google Sheets)
  async trackPlay() {
    try {
      await fetch('/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.user.id }),
      });
    } catch (e) {
      console.error('Failed to track play:', e);
    }
  },

  // Send score to backend
  async submitScore(score, time) {
    try {
      const res = await fetch('/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: this.initData,
          userId: this.user.id,
          username: this.user.username,
          score,
          time,
          platform: this.platform,
        }),
      });
      return await res.json();
    } catch (e) {
      console.error('Failed to submit score:', e);
      return null;
    }
  },

  // Fetch leaderboard (filtered by platform)
  async getLeaderboard() {
    try {
      const res = await fetch(`/leaderboard?platform=${this.platform}`);
      const data = await res.json();
      return data.leaderboard || [];
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
      return [];
    }
  },
};
