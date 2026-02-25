// ─── Main Entry Point ────────────────────────────────────────────────────────
(function () {
  'use strict';

  // ── DOM elements ─────────────────────────────────────────────────────
  const titleScreen = document.getElementById('title-screen');
  const gameCanvas = document.getElementById('game-canvas');
  const mobileControls = document.getElementById('mobile-controls');
  const gameoverScreen = document.getElementById('gameover-screen');
  const victoryScreen = document.getElementById('victory-screen');
  const leaderboardModal = document.getElementById('leaderboard-modal');

  const btnStart = document.getElementById('btn-start');
  const btnLeaderboard = document.getElementById('btn-leaderboard');
  const btnRetry = document.getElementById('btn-retry');
  const btnMenu = document.getElementById('btn-menu');
  const btnLeaderboard2 = document.getElementById('btn-leaderboard2');
  const btnMenu2 = document.getElementById('btn-menu2');
  const btnCloseLB = document.getElementById('btn-close-lb');

  const victoryScore = document.getElementById('victory-score');
  const victoryTime = document.getElementById('victory-time');
  const leaderboardList = document.getElementById('leaderboard-list');

  let game = null;
  let isMobile = false;

  // ── Initialize ───────────────────────────────────────────────────────
  function init() {
    // Detect language first (before anything else)
    I18n.detect();
    I18n.applyToDOM();

    TG.init();
    Input.init();

    // Detect mobile
    isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    // Handle resize
    window.addEventListener('resize', () => {
      if (game) game.resize();
    });
  }

  // ── Show / hide screens ──────────────────────────────────────────────
  function showScreen(screen) {
    titleScreen.classList.add('hidden');
    gameCanvas.style.display = 'none';
    mobileControls.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
    leaderboardModal.classList.add('hidden');

    if (screen === 'title') {
      titleScreen.classList.remove('hidden');
    } else if (screen === 'game') {
      gameCanvas.style.display = 'block';
      if (isMobile) mobileControls.classList.remove('hidden');
    } else if (screen === 'gameover') {
      gameoverScreen.classList.remove('hidden');
    } else if (screen === 'victory') {
      victoryScreen.classList.remove('hidden');
    } else if (screen === 'leaderboard') {
      leaderboardModal.classList.remove('hidden');
    }
  }

  // ── Start game ───────────────────────────────────────────────────────
  function startGame() {
    showScreen('game');

    // Track play attempt in Google Sheets
    TG.trackPlay();

    game = new Game(gameCanvas);

    game.onGameOver = () => {
      setTimeout(() => showScreen('gameover'), 500);
    };

    game.onVictory = async (score, time) => {
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      victoryScore.textContent = I18n.t('score_prefix') + score;
      victoryTime.textContent = `${I18n.t('time_prefix')}${mins}:${secs.toString().padStart(2, '0')}`;

      // Submit score to backend
      await TG.submitScore(score, time);

      setTimeout(() => showScreen('victory'), 800);
    };

    game.start();
  }

  // ── Leaderboard ──────────────────────────────────────────────────────
  async function showLeaderboard() {
    showScreen('leaderboard');
    leaderboardList.innerHTML = `<p style="color:#666;text-align:center">${I18n.t('loading')}</p>`;

    const entries = await TG.getLeaderboard();

    if (entries.length === 0) {
      leaderboardList.innerHTML = `<p style="color:#666;text-align:center">${I18n.t('no_scores')}</p>`;
      return;
    }

    leaderboardList.innerHTML = entries.map((e, i) => `
      <div class="lb-entry">
        <span class="lb-rank">#${i + 1}</span>
        <span class="lb-name">${escapeHtml(e.username)}</span>
        <span class="lb-score">${e.score}</span>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Button handlers ──────────────────────────────────────────────────
  btnStart.addEventListener('click', startGame);
  btnLeaderboard.addEventListener('click', showLeaderboard);

  btnRetry.addEventListener('click', () => {
    showScreen('game');
    TG.trackPlay();
    if (game) game.restart();
  });

  btnMenu.addEventListener('click', () => showScreen('title'));
  btnMenu2.addEventListener('click', () => showScreen('title'));
  btnLeaderboard2.addEventListener('click', showLeaderboard);

  btnCloseLB.addEventListener('click', () => {
    // Go back to wherever we came from
    if (game && !game.running) {
      showScreen(game.player && game.player.alive ? 'victory' : 'title');
    } else {
      showScreen('title');
    }
  });

  // Prevent context menu on long press (mobile)
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // ── Boot ─────────────────────────────────────────────────────────────
  init();
  showScreen('title');

})();
