# Operation: Shadow Island — Deployment Guide

## Local Development

```bash
cd ShadowIsland
npm install
npm start
# Open http://localhost:3000
```

In dev mode (no BOT_TOKEN), Telegram validation is skipped and a random dev user is created.

## Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set environment variable:
   ```
   BOT_TOKEN=<your-telegram-bot-token>
   ```
4. Railway auto-detects Node.js and runs `npm start`
5. Copy the deployed URL (e.g., `https://shadow-island.up.railway.app`)

## Deploy to Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo, set:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment: `BOT_TOKEN=<your-token>`

## Set up Telegram Mini App

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newapp` (or `/editapp` for existing bot)
3. Select your bot
4. Set the Web App URL to your deployed URL
5. Done! Users can launch the game from your bot's menu button

### Configure Bot Menu Button

Send to BotFather:
```
/setmenubutton
```
Then select your bot and paste the URL.

## Environment Variables

| Variable    | Required | Description                     |
|-------------|----------|---------------------------------|
| `BOT_TOKEN` | Yes*     | Telegram Bot token from BotFather |
| `PORT`      | No       | Server port (default: 3000)     |

*Required for production. Without it, Telegram initData validation is skipped.

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML5 Canvas (no frameworks)
- **Storage**: In-memory (MVP). For production, swap `Map` in server.js with Redis/PostgreSQL.
- **Sprites**: Procedurally generated pixel art (no external assets)
