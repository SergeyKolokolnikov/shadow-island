// ─── Google Sheets Integration ─────────────────────────────────────────────
const { google } = require('googleapis');

const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
const GOOGLE_CREDS_BASE64 = process.env.GOOGLE_CREDS_BASE64 || '';

// Cache auth client to avoid re-creating on every call
let _sheetsClient = null;
let _sheetInitialized = false;

async function getSheetsClient() {
  if (_sheetsClient) return _sheetsClient;

  if (!GOOGLE_CREDS_BASE64 || !GOOGLE_SHEETS_ID) {
    console.warn('Google Sheets not configured (GOOGLE_SHEETS_ID or GOOGLE_CREDS_BASE64 missing)');
    return null;
  }

  try {
    const creds = JSON.parse(
      Buffer.from(GOOGLE_CREDS_BASE64, 'base64').toString()
    );

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    _sheetsClient = google.sheets({ version: 'v4', auth: client });

    // Ensure "users" sheet exists with headers
    if (!_sheetInitialized) {
      await ensureUsersSheet(_sheetsClient);
      _sheetInitialized = true;
    }

    return _sheetsClient;
  } catch (err) {
    console.error('[GSheets] Auth error:', err.message);
    return null;
  }
}

// ─── Ensure "users" sheet exists with proper headers ────────────────────────
async function ensureUsersSheet(sheets) {
  try {
    // Check if sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
    });

    const sheetNames = spreadsheet.data.sheets.map(s => s.properties.title);

    if (!sheetNames.includes('users')) {
      // Create the "users" sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SHEETS_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: 'users' },
            },
          }],
        },
      });
      console.log('[GSheets] Created "users" sheet');
    }

    // Check if headers exist
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'users!A1:G1',
    });

    const headerRow = (headerRes.data.values && headerRes.data.values[0]) || [];

    if (headerRow.length === 0 || headerRow[0] !== 'Telegram Id') {
      // Write headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: 'users!A1:G1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Telegram Id', 'Telegram Username', 'Telegram Name', 'Telegram Is Premium', 'Created', 'Score Points', 'Score Time']],
        },
      });
      console.log('[GSheets] Headers written to "users" sheet');
    }
  } catch (err) {
    console.error('[GSheets] Error ensuring users sheet:', err.message);
  }
}

// ─── Add new user to "users" sheet ──────────────────────────────────────────
// Columns: Telegram Id | Telegram Username | Telegram Name | Telegram Is Premium | Created | Score Points | Score Time
async function googleAddUser(user) {
  const sheets = await getSheetsClient();
  if (!sheets) return false;

  const telegramId = String(user.id);
  const telegramUsername = user.username || '';
  const telegramName = user.firstName || '';
  const telegramIsPremium = user.isPremium || false;

  try {
    // Check if user already exists
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'users!A:G',
    });

    const rows = response.data.values || [];
    const existingRowIndex = rows.findIndex(row => row[0] == telegramId);

    if (existingRowIndex === -1) {
      // New user — append row (Score Points and Score Time empty for now)
      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: 'users!A:G',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [[telegramId, telegramUsername, telegramName, telegramIsPremium, new Date().toISOString(), '', '']],
        },
      });
      console.log(`[GSheets] New user added: ${telegramId} (@${telegramUsername})`);
      return true;
    } else {
      // User exists — update username/name in case they changed
      const rowNumber = existingRowIndex + 1; // 1-based
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: `users!B${rowNumber}:D${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[telegramUsername, telegramName, telegramIsPremium]],
        },
      });
      console.log(`[GSheets] User updated: ${telegramId} (@${telegramUsername})`);
      return true;
    }
  } catch (err) {
    console.error('[GSheets] Error adding user:', err.message);
    return false;
  }
}

// ─── Update user's score and time after game completion ─────────────────────
// Writes to columns F (Score Points) and G (Score Time)
// Only updates if new score is higher than existing
async function googleUpdateScore(userId, score, time) {
  const sheets = await getSheetsClient();
  if (!sheets) return false;

  const telegramId = String(userId);

  try {
    // Get all users to find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'users!A:G',
    });

    const rows = response.data.values || [];
    const existingRowIndex = rows.findIndex(row => row[0] == telegramId);

    if (existingRowIndex === -1) {
      console.warn(`[GSheets] User ${telegramId} not found for score update`);
      return false;
    }

    const rowNumber = existingRowIndex + 1; // 1-based
    const existingScore = parseFloat(rows[existingRowIndex][5]) || 0;

    // Only update if new score is higher
    if (score > existingScore) {
      // Format time as M:SS
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: `users!F${rowNumber}:G${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[score, timeStr]],
        },
      });
      console.log(`[GSheets] Score updated for ${telegramId}: ${score} pts, ${timeStr}`);
      return true;
    } else {
      console.log(`[GSheets] Score for ${telegramId} not updated (existing: ${existingScore}, new: ${score})`);
      return false;
    }
  } catch (err) {
    console.error('[GSheets] Error updating score:', err.message);
    return false;
  }
}

// ─── Get leaderboard from Google Sheets ────────────────────────────────────
// Returns top players sorted by Score Points descending
async function googleGetLeaderboard(limit = 50) {
  const sheets = await getSheetsClient();
  if (!sheets) return null; // null means GSheets not configured, use in-memory

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'users!A:G',
    });

    const rows = response.data.values || [];
    const leaderboard = [];

    // Skip header row (index 0), and skip rows with no score
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const scoreVal = parseFloat(row[5]) || 0;
      if (scoreVal > 0) {
        leaderboard.push({
          userId: row[0],
          username: row[1] || row[2] || 'Agent',
          score: scoreVal,
          time: row[6] || '',
          timeRaw: 0, // We store formatted time, so parse back for sorting
        });
      }
    }

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    return leaderboard.slice(0, limit);
  } catch (err) {
    console.error('[GSheets] Error fetching leaderboard:', err.message);
    return null;
  }
}

// ─── Health check — direct connection test with error propagation ───────────
async function googleHealthCheck() {
  if (!GOOGLE_CREDS_BASE64 || !GOOGLE_SHEETS_ID) {
    return { connected: false, error: 'GOOGLE_SHEETS_ID or GOOGLE_CREDS_BASE64 not set' };
  }

  try {
    const creds = JSON.parse(
      Buffer.from(GOOGLE_CREDS_BASE64, 'base64').toString()
    );

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Try reading the spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
    });

    const sheetNames = spreadsheet.data.sheets.map(s => s.properties.title);

    return {
      connected: true,
      title: spreadsheet.data.properties.title,
      sheets: sheetNames,
      serviceAccount: creds.client_email || 'unknown',
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      code: err.code || null,
    };
  }
}

module.exports = {
  googleAddUser,
  googleUpdateScore,
  googleGetLeaderboard,
  googleHealthCheck,
};
