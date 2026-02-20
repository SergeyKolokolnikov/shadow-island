const express = require('express');
const crypto = require('crypto');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const APP_URL = process.env.APP_URL || ''; // e.g. https://shadow-island-production.up.railway.app

// In-memory score storage (MVP — replace with DB for production)
const scores = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Telegram initData validation ────────────────────────────────────────────
function validateTelegramData(initData) {
  if (!BOT_TOKEN) return true; // Skip validation in dev mode

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  const dataCheckArr = [];
  for (const [key, value] of [...params.entries()].sort()) {
    dataCheckArr.push(`${key}=${value}`);
  }
  const dataCheckString = dataCheckArr.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return computedHash === hash;
}

// ─── POST /score — save player score ─────────────────────────────────────────
app.post('/score', (req, res) => {
  const { initData, userId, username, score, time } = req.body;

  if (!userId || score === undefined) {
    return res.status(400).json({ error: 'Missing userId or score' });
  }

  // Validate Telegram data if provided
  if (initData && !validateTelegramData(initData)) {
    return res.status(403).json({ error: 'Invalid Telegram data' });
  }

  const existing = scores.get(String(userId));
  if (!existing || score > existing.score) {
    scores.set(String(userId), {
      userId: String(userId),
      username: username || 'Agent',
      score: Number(score),
      time: Number(time) || 0,
      date: new Date().toISOString()
    });
  }

  res.json({ success: true, highScore: scores.get(String(userId)).score });
});

// ─── GET /leaderboard — top 50 players ───────────────────────────────────────
app.get('/leaderboard', (req, res) => {
  const leaderboard = [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  res.json({ leaderboard });
});

// ─── Fallback to index.html ──────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Telegram Bot (/start command with leaderboard) ──────────────────────────
if (BOT_TOKEN) {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Agent';

    // Build leaderboard text
    const leaderboard = [...scores.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    let lbText = '';
    if (leaderboard.length > 0) {
      const medals = ['🥇', '🥈', '🥉'];
      lbText = '\n\n🏆 *TOP AGENTS:*\n';
      lbText += leaderboard.map((e, i) => {
        const medal = medals[i] || `${i + 1}.`;
        const mins = Math.floor(e.time / 60);
        const secs = Math.floor(e.time % 60);
        const timeStr = e.time > 0 ? ` — ${mins}:${secs.toString().padStart(2, '0')}` : '';
        return `${medal} *${escapeMarkdown(e.username)}* — ${e.score} pts${timeStr}`;
      }).join('\n');
    } else {
      lbText = '\n\n_No scores yet. Be the first agent to complete the mission!_';
    }

    const text = `👋 Hello, *${escapeMarkdown(firstName)}*!\n\n` +
      `🎮 *Operation: Shadow Island*\n` +
      `Infiltrate the island, fight guards, hack terminals, and defeat the villain!\n` +
      lbText;

    // Inline button to launch the game
    const opts = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [],
      },
    };

    // Add "Play" button if APP_URL is set
    if (APP_URL) {
      opts.reply_markup.inline_keyboard.push([
        { text: '🕹 PLAY NOW', web_app: { url: APP_URL } },
      ]);
    }

    bot.sendMessage(chatId, text, opts);
  });

  // Escape markdown special chars
  function escapeMarkdown(str) {
    return String(str).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }

  console.log('Telegram bot started (polling mode)');
}

app.listen(PORT, () => {
  console.log(`Shadow Island server running on port ${PORT}`);
  if (!BOT_TOKEN) {
    console.log('WARNING: BOT_TOKEN not set — Telegram validation disabled (dev mode)');
  }
});
