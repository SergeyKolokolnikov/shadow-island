const express = require('express');
const crypto = require('crypto');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { googleAddUser, googleUpdateScore, googleIncrementAttempts, googleGetLeaderboard, googleHealthCheck } = require('./google-sheets');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const APP_URL = process.env.APP_URL || ''; // e.g. https://shadow-island-production.up.railway.app

// In-memory score storage (fallback if Google Sheets not configured)
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

// ─── POST /register — register user in Google Sheets on game start ──────────
app.post('/register', async (req, res) => {
  const { initData, user } = req.body;

  if (!user || !user.id) {
    return res.status(400).json({ error: 'Missing user data' });
  }

  // Validate Telegram data if provided
  if (initData && !validateTelegramData(initData)) {
    return res.status(403).json({ error: 'Invalid Telegram data' });
  }

  // Save to Google Sheets (async, non-blocking for the game)
  googleAddUser(user).catch(err => console.error('[Register] GSheets error:', err));

  res.json({ success: true });
});

// ─── POST /play — increment play attempts counter ────────────────────────────
app.post('/play', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  googleIncrementAttempts(userId).catch(err => console.error('[Play] GSheets error:', err));

  res.json({ success: true });
});

// ─── POST /score — save player score ─────────────────────────────────────────
app.post('/score', async (req, res) => {
  const { initData, userId, username, score, time } = req.body;

  if (!userId || score === undefined) {
    return res.status(400).json({ error: 'Missing userId or score' });
  }

  // Validate Telegram data if provided
  if (initData && !validateTelegramData(initData)) {
    return res.status(403).json({ error: 'Invalid Telegram data' });
  }

  // Save to in-memory (fallback / fast access)
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

  // Save to Google Sheets (update score columns)
  googleUpdateScore(userId, Number(score), Number(time) || 0)
    .catch(err => console.error('[Score] GSheets error:', err));

  res.json({ success: true, highScore: scores.get(String(userId)).score });
});

// ─── GET /leaderboard — top 50 players ───────────────────────────────────────
app.get('/leaderboard', async (req, res) => {
  // Try Google Sheets first
  const gsLeaderboard = await googleGetLeaderboard(50);

  if (gsLeaderboard !== null) {
    // Google Sheets is configured and returned data
    res.json({ leaderboard: gsLeaderboard });
  } else {
    // Fallback to in-memory
    const leaderboard = [...scores.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
    res.json({ leaderboard });
  }
});

// ─── GET /health — check Google Sheets connection status ─────────────────────
app.get('/health', async (req, res) => {
  const gsConfigured = !!(process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_CREDS_BASE64);

  // Direct connection test with full error details
  const healthResult = await googleHealthCheck();

  // Parse service account email from creds for debugging
  let serviceEmail = 'unknown';
  try {
    if (process.env.GOOGLE_CREDS_BASE64) {
      const c = JSON.parse(Buffer.from(process.env.GOOGLE_CREDS_BASE64, 'base64').toString());
      serviceEmail = c.client_email || 'not found in creds';
    }
  } catch (e) { serviceEmail = 'parse error: ' + e.message; }

  res.json({
    status: 'ok',
    googleSheets: {
      configured: gsConfigured,
      ...healthResult,
      sheetsIdFull: process.env.GOOGLE_SHEETS_ID || 'NOT SET',
      sheetsIdLength: (process.env.GOOGLE_SHEETS_ID || '').length,
      credsLength: process.env.GOOGLE_CREDS_BASE64 ? process.env.GOOGLE_CREDS_BASE64.length : 0,
      serviceEmail,
    },
    inMemoryScores: scores.size,
  });
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

    // Register user from Telegram bot too
    googleAddUser({
      id: msg.from.id,
      username: msg.from.username || '',
      firstName: `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim(),
      isPremium: msg.from.is_premium || false,
    }).catch(err => console.error('[Bot Register] GSheets error:', err));

    // Build leaderboard text — prefer Google Sheets
    let leaderboard = await googleGetLeaderboard(10);
    if (leaderboard === null) {
      // Fallback to in-memory
      leaderboard = [...scores.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    }

    // Build message parts (plain Markdown for reliability)
    let lbText = '';
    if (leaderboard.length > 0) {
      const medals = ['🥇', '🥈', '🥉'];
      const nums = ['4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      const barFull = '▓';
      const barEmpty = '░';

      // Find max score for bar chart
      const maxScore = leaderboard[0].score || 1;

      lbText = '🏆 *TOP AGENTS*\n\n';

      lbText += leaderboard.map((e, i) => {
        const medal = i < 3 ? medals[i] : (nums[i - 3] || `${i + 1}.`);
        let timeStr = '';
        if (typeof e.time === 'string' && e.time.length > 0) {
          timeStr = `${e.time}`;
        } else if (typeof e.time === 'number' && e.time > 0) {
          const mins = Math.floor(e.time / 60);
          const secs = Math.floor(e.time % 60);
          timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Score bar (visual representation)
        const barLen = 8;
        const filled = Math.max(1, Math.round((e.score / maxScore) * barLen));
        const bar = barFull.repeat(filled) + barEmpty.repeat(barLen - filled);

        // Username — plain text without links (no web preview)
        const name = `@${e.username}` || 'Agent';

        // Top 3 get special formatting
        if (i < 3) {
          return `${medal} *${escapeMarkdown(name)}* *${e.score}* (${timeStr})`;
        }
        return `${medal} ${escapeMarkdown(name)} ${e.score} (${timeStr})`;
      }).join('\n');

      lbText += `\n\n`;
    } else {
      lbText += '🏆 *TOP AGENTS*\n';
      lbText += '🕳 _No results yet\\. Be the first agent to complete the mission!_';
    }

    const text = `👋 Hello, *${escapeMarkdown(firstName)}*!\n\n` +
      `*Operation: Shadow Island*\n\n` +
      `Infiltrate the island, fight the guards, and defeat the villain!\n\n` +
      lbText;

    // Inline button to launch the game
    const opts = {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [],
      },
    };

    // Add "Play" button if APP_URL is set
    if (APP_URL) {
      opts.reply_markup.inline_keyboard.push([
        { text: '🕹 PLAY', web_app: { url: APP_URL } },
      ]);
    }

    bot.sendMessage(chatId, text, opts);
  });

  // Escape MarkdownV2 special chars
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
  if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_CREDS_BASE64) {
    console.log('WARNING: GOOGLE_SHEETS_ID or GOOGLE_CREDS_BASE64 not set — using in-memory leaderboard');
  } else {
    console.log('Google Sheets configured — sheet ID:', process.env.GOOGLE_SHEETS_ID.substring(0, 12) + '...');
  }
});
