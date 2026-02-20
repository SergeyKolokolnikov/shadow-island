const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';

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

app.listen(PORT, () => {
  console.log(`Shadow Island server running on port ${PORT}`);
  if (!BOT_TOKEN) {
    console.log('WARNING: BOT_TOKEN not set — Telegram validation disabled (dev mode)');
  }
});
