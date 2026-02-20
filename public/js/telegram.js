// ─── Telegram WebApp Integration ─────────────────────────────────────────────
const TG = {
  user: null,
  initData: '',

  init() {
    if (window.Telegram && window.Telegram.WebApp) {
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
        };
      }
    }

    // Fallback for development outside Telegram
    if (!this.user) {
      this.user = {
        id: 'dev_' + Math.floor(Math.random() * 99999),
        username: 'DevAgent',
        firstName: 'Dev',
      };
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
        }),
      });
      return await res.json();
    } catch (e) {
      console.error('Failed to submit score:', e);
      return null;
    }
  },

  // Fetch leaderboard
  async getLeaderboard() {
    try {
      const res = await fetch('/leaderboard');
      const data = await res.json();
      return data.leaderboard || [];
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
      return [];
    }
  },
};
