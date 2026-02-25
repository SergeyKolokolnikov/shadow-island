// ─── Internationalization (i18n) ─────────────────────────────────────────────
const I18n = {
  lang: 'en', // default

  translations: {
    en: {
      // Title screen
      title_operation: 'OPERATION',
      title_shadow_island: 'SHADOW ISLAND',
      title_tagline: 'Infiltrate. Eliminate. Escape.',
      btn_start: 'START MISSION',
      btn_leaderboard: 'LEADERBOARD',

      // Mobile controls
      kick_label: 'KICK',

      // Game over screen
      mission_failed: 'MISSION FAILED',
      you_were_eliminated: 'You were eliminated.',
      btn_retry: 'RETRY',
      btn_menu: 'MENU',

      // Victory screen
      mission_complete: 'MISSION COMPLETE',
      btn_close: 'CLOSE',

      // HUD
      score_label: 'SCORE: ',
      top_agents: 'TOP AGENTS',

      // Death animation
      agent_down: 'AGENT DOWN',
      mission_failed_dots: 'Mission failed...',

      // Level transition
      prepare: 'Prepare yourself...',

      // Leaderboard
      loading: 'Loading...',
      no_scores: 'No scores yet. Be the first!',
      score_prefix: 'Score: ',
      time_prefix: 'Time: ',

      // Level names
      level_beach: 'BEACH LANDING',
      level_mansion: 'THE MANSION',
      level_server: 'SERVER ROOM',
      level_villa: 'THE VILLA',
      level_boss: 'DR. VORTEX',
      boss_island_keeper: 'THE ISLAND KEEPER',
    },

    ru: {
      // Title screen
      title_operation: 'ОПЕРАЦИЯ',
      title_shadow_island: 'ТЁМНЫЙ ОСТРОВ',
      title_tagline: 'Проникни. Устрани. Сбеги.',
      btn_start: 'НАЧАТЬ МИССИЮ',
      btn_leaderboard: 'ЛИДЕРЫ',

      // Mobile controls
      kick_label: 'УДАР',

      // Game over screen
      mission_failed: 'МИССИЯ ПРОВАЛЕНА',
      you_were_eliminated: 'Вы были уничтожены.',
      btn_retry: 'ЗАНОВО',
      btn_menu: 'МЕНЮ',

      // Victory screen
      mission_complete: 'МИССИЯ ВЫПОЛНЕНА',
      btn_close: 'ЗАКРЫТЬ',

      // HUD
      score_label: 'ОЧКИ: ',
      top_agents: 'ЛУЧШИЕ АГЕНТЫ',

      // Death animation
      agent_down: 'АГЕНТ УБИТ',
      mission_failed_dots: 'Миссия провалена...',

      // Level transition
      prepare: 'Приготовься...',

      // Leaderboard
      loading: 'Загрузка...',
      no_scores: 'Пока нет результатов. Стань первым!',
      score_prefix: 'Очки: ',
      time_prefix: 'Время: ',

      // Level names
      level_beach: 'ВЫСАДКА НА БЕРЕГ',
      level_mansion: 'ОСОБНЯК',
      level_server: 'СЕРВЕРНАЯ',
      level_villa: 'ВИЛЛА',
      level_boss: 'ДР. ВОРТЕКС',
      boss_island_keeper: 'ХРАНИТЕЛЬ ОСТРОВА',
    },
  },

  // Detect language: ?lang=ru param > Telegram WebApp = en > Max WebApp = ru > default ru
  detect() {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang');

    if (langParam && this.translations[langParam]) {
      this.lang = langParam;
    } else if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
      // Launched from Telegram — English
      this.lang = 'en';
    } else if (window.WebApp && window.WebApp.initData) {
      // Launched from Max — Russian
      this.lang = 'ru';
    } else {
      // Default (direct browser) — Russian
      this.lang = 'ru';
    }

    console.log('[i18n] Language:', this.lang);
    return this.lang;
  },

  // Get translated string
  t(key) {
    const dict = this.translations[this.lang] || this.translations.en;
    return dict[key] || this.translations.en[key] || key;
  },

  // Get platform name
  getPlatform() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
      return 'telegram';
    }
    return 'max';
  },

  // Apply translations to DOM elements with data-i18n attribute
  applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
  },
};
