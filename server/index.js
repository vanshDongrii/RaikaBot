/**
 * Raika Gaming Platform - Express API & Telegram Bot Server
 * 100% English-Only Architecture
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const db = require('./db');
const games = require('./games');
const strings = require('./locales/en');
const { createBot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;
const WEB_APP_URL = process.env.WEB_APP_URL || `http://localhost:${PORT}`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

app.use(cors());
app.use(express.json());

// Serve static frontend files for the Telegram Mini App
app.use(express.static(path.join(__dirname, '../public')));

// Middleware to extract or default user
function resolveUserId(req) {
  return String(
    req.body.userId || 
    req.query.userId || 
    (req.headers['x-telegram-user-id'] ? req.headers['x-telegram-user-id'] : 'demo_player_1')
  );
}

// -----------------------------------------------------------------------------
// REST API ENDPOINTS FOR TELEGRAM MINI APP
// -----------------------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'Raika Games',
    locale: 'en',
    time: new Date().toISOString()
  });
});

// BotFather Setup Helper
app.get('/api/botfather', (req, res) => {
  res.json(strings.botFather);
});

// Get or sync user profile
app.get('/api/user', (req, res) => {
  const userId = resolveUserId(req);
  const user = db.getOrCreateUser({ id: userId });
  const rank = db.getUserRank(userId);
  const winRate = user.total_games > 0 ? Math.round((user.games_won / user.total_games) * 100) : 0;

  res.json({
    success: true,
    user: {
      ...user,
      rank,
      winRate
    }
  });
});

app.post('/api/user/sync', (req, res) => {
  const tgUser = req.body.tgUser || {};
  const user = db.getOrCreateUser(tgUser);
  const rank = db.getUserRank(user.id);
  const winRate = user.total_games > 0 ? Math.round((user.games_won / user.total_games) * 100) : 0;

  res.json({
    success: true,
    user: {
      ...user,
      rank,
      winRate
    }
  });
});

// Daily Streak Bonus Claim
app.post('/api/bonus/claim', (req, res) => {
  const userId = resolveUserId(req);
  const result = db.claimDailyBonus(userId);
  res.json(result);
});

// Free Demo Coin Refill
app.post('/api/refill', (req, res) => {
  const userId = resolveUserId(req);
  const result = db.refillBalance(userId);
  res.json(result);
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const userId = resolveUserId(req);
  const leaderboard = db.getLeaderboard(10);
  const userRank = db.getUserRank(userId);
  const user = db.getUser(userId);

  res.json({
    success: true,
    leaderboard,
    currentUser: {
      rank: userRank,
      total_won: user ? user.total_won : 0
    }
  });
});

// Match History
app.get('/api/history', (req, res) => {
  const userId = resolveUserId(req);
  const matches = db.getUserMatches(userId, 50);
  res.json({
    success: true,
    matches
  });
});

// Live Community Wins (ticker)
app.get('/api/live-wins', (req, res) => {
  const recent = db.getRecentLiveMatches(8);
  res.json({
    success: true,
    matches: recent
  });
});

// Apply Referral
app.post('/api/referral/apply', (req, res) => {
  const userId = resolveUserId(req);
  const { referralCode } = req.body;
  const result = db.applyReferral(userId, referralCode);
  res.json(result);
});

// -----------------------------------------------------------------------------
// CASHIER & WALLET SIMULATION ENDPOINTS
// -----------------------------------------------------------------------------

// Cashier Summary & Addresses
app.get('/api/cashier/info', (req, res) => {
  const userId = resolveUserId(req);
  const summary = db.getCashierSummary(userId);
  res.json({
    success: true,
    ...summary,
    exchangeRate: '1 USDT = 100 Demo Coins',
    minDeposit: 1, // $1 USD
    minWithdrawal: 1000 // 1,000 Coins = $10 USD
  });
});

// Simulated Deposit
app.post('/api/cashier/deposit', (req, res) => {
  const userId = resolveUserId(req);
  const { asset, usdtAmount } = req.body;
  const result = db.createDeposit(userId, { asset, usdtAmount });
  res.json(result);
});

// Simulated Withdrawal
app.post('/api/cashier/withdraw', (req, res) => {
  const userId = resolveUserId(req);
  const { asset, coinsAmount, destinationAddress } = req.body;
  const result = db.createWithdrawal(userId, { asset, coinsAmount, destinationAddress });
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// User Cashier Transactions
app.get('/api/cashier/transactions', (req, res) => {
  const userId = resolveUserId(req);
  const txs = db.getUserTransactions(userId, 50);
  res.json({
    success: true,
    transactions: txs
  });
});

// -----------------------------------------------------------------------------
// GAMEPLAY ENDPOINTS
// -----------------------------------------------------------------------------

// Helper to validate stake
function validateUserStake(userId, stake) {
  const user = db.getOrCreateUser({ id: userId });
  const numStake = parseInt(stake, 10);
  if (isNaN(numStake) || numStake < 10) {
    return { valid: false, error: 'Minimum stake is 10 Demo Coins.' };
  }
  if (user.demo_balance < numStake) {
    return { valid: false, error: 'Insufficient Demo Coins. Refill or lower your stake.' };
  }
  return { valid: true, numStake, user };
}

// 1. Coin Flip
app.post('/api/games/coinflip', (req, res) => {
  const userId = resolveUserId(req);
  const { stake, choice } = req.body;

  const check = validateUserStake(userId, stake);
  if (!check.valid) {
    return res.status(400).json({ success: false, error: check.error });
  }

  const result = games.playCoinFlip(check.numStake, choice);
  const { match, user } = db.recordMatch(userId, result);

  res.json({
    success: true,
    game: result,
    match,
    newBalance: user.demo_balance
  });
});

// 2. Dice Roll
app.post('/api/games/dice', (req, res) => {
  const userId = resolveUserId(req);
  const { stake, direction, target } = req.body;

  const check = validateUserStake(userId, stake);
  if (!check.valid) {
    return res.status(400).json({ success: false, error: check.error });
  }

  const result = games.playDice(check.numStake, direction, target);
  const { match, user } = db.recordMatch(userId, result);

  res.json({
    success: true,
    game: result,
    match,
    newBalance: user.demo_balance
  });
});

// 3. Crash Rocket (Auto/Instant target)
app.post('/api/games/crash', (req, res) => {
  const userId = resolveUserId(req);
  const { stake, autoCashout } = req.body;

  const check = validateUserStake(userId, stake);
  if (!check.valid) {
    return res.status(400).json({ success: false, error: check.error });
  }

  const result = games.playCrashAuto(check.numStake, autoCashout);
  const { match, user } = db.recordMatch(userId, result);

  res.json({
    success: true,
    game: result,
    match,
    newBalance: user.demo_balance
  });
});

// 3b. Crash Point Generator for live frontend rocket animation
app.post('/api/games/crash/round', (req, res) => {
  const userId = resolveUserId(req);
  const { stake } = req.body;

  const check = validateUserStake(userId, stake);
  if (!check.valid) {
    return res.status(400).json({ success: false, error: check.error });
  }

  // Deduct stake upfront for round
  check.user.demo_balance -= check.numStake;
  check.user.total_wagered += check.numStake;
  check.user.total_games += 1;

  const crashPoint = games.generateCrashPoint();

  res.json({
    success: true,
    stake: check.numStake,
    crashPoint,
    balance: check.user.demo_balance
  });
});

// 3c. Crash Round Manual Cashout
app.post('/api/games/crash/cashout', (req, res) => {
  const userId = resolveUserId(req);
  const { stake, multiplier } = req.body;
  const user = db.getOrCreateUser({ id: userId });

  const numStake = parseInt(stake, 10);
  const mult = Math.max(1.00, Number(parseFloat(multiplier).toFixed(2)));
  const payout = Math.floor(numStake * mult);
  const profit = payout - numStake;

  const matchRecord = {
    game_type: 'crash',
    stake: numStake,
    multiplier: mult,
    payout,
    profit,
    outcome: 'win',
    details: {
      cashedOutAt: `${mult.toFixed(2)}x`,
      description: `Cashed out at ${mult.toFixed(2)}x for ${payout} Demo Coins!`
    }
  };

  // Add payout to balance
  user.demo_balance += payout;
  user.games_won += 1;
  user.total_won += payout;
  if (mult > user.best_multiplier) {
    user.best_multiplier = mult;
  }

  const { match } = db.recordMatch(userId, matchRecord);

  res.json({
    success: true,
    payout,
    newBalance: user.demo_balance,
    match
  });
});

// 4. Mines - Start Session
app.post('/api/games/mines/start', (req, res) => {
  const userId = resolveUserId(req);
  const { stake, mineCount } = req.body;

  const check = validateUserStake(userId, stake);
  if (!check.valid) {
    return res.status(400).json({ success: false, error: check.error });
  }

  // Deduct stake for active session
  check.user.demo_balance -= check.numStake;

  const session = games.startMinesSession(userId, check.numStake, mineCount);

  res.json({
    success: true,
    session,
    balance: check.user.demo_balance
  });
});

// 4b. Mines - Step / Reveal Tile
app.post('/api/games/mines/step', (req, res) => {
  const { sessionId, tileIndex } = req.body;
  const stepResult = games.stepMinesSession(sessionId, parseInt(tileIndex, 10));

  if (stepResult.error) {
    return res.status(400).json({ success: false, error: stepResult.error });
  }

  if (stepResult.hitMine) {
    const userId = resolveUserId(req);
    // Record loss
    db.recordMatch(userId, {
      game_type: 'mines',
      stake: 0, // already deducted at start
      multiplier: 0,
      payout: 0,
      profit: stepResult.profit,
      outcome: 'loss',
      details: stepResult.details
    });
  }

  res.json({
    success: true,
    step: stepResult
  });
});

// 4c. Mines - Cash Out
app.post('/api/games/mines/cashout', (req, res) => {
  const userId = resolveUserId(req);
  const { sessionId } = req.body;
  const cashoutResult = games.cashoutMinesSession(sessionId);

  if (cashoutResult.error) {
    return res.status(400).json({ success: false, error: cashoutResult.error });
  }

  const { match, user } = db.recordMatch(userId, {
    game_type: 'mines',
    stake: cashoutResult.stake,
    multiplier: cashoutResult.multiplier,
    payout: cashoutResult.payout,
    profit: cashoutResult.profit,
    outcome: 'win',
    details: cashoutResult.details
  });

  res.json({
    success: true,
    cashout: cashoutResult,
    match,
    newBalance: user.demo_balance
  });
});

// 5. Lucky Wheel
app.post('/api/games/wheel', (req, res) => {
  const userId = resolveUserId(req);
  const { stake } = req.body;

  const check = validateUserStake(userId, stake);
  if (!check.valid) {
    return res.status(400).json({ success: false, error: check.error });
  }

  const result = games.playWheel(check.numStake);
  const { match, user } = db.recordMatch(userId, result);

  res.json({
    success: true,
    game: result,
    match,
    newBalance: user.demo_balance
  });
});

// -----------------------------------------------------------------------------
// START SERVER & BOT
// -----------------------------------------------------------------------------

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎮 Raika Games Server running on port ${PORT}`);
  console.log(`🌐 Mini App URL: ${WEB_APP_URL}`);
  console.log(`📖 Locale: English (Mandatory 100% English Interface)`);
  console.log(`====================================================`);
});

// Start Telegram Bot
const bot = createBot(TELEGRAM_BOT_TOKEN, WEB_APP_URL);
if (bot) {
  function launchBotWithRetry(retries = 10, delay = 3000) {
    console.log('[Raika Bot] Connecting to Telegram polling...');
    bot.launch()
      .then(() => {
        console.log('[Raika Bot] Connected to Telegram successfully!');
        return bot.telegram.getMe();
      })
      .then((botInfo) => {
        console.log(`[Raika Bot] Online as @${botInfo.username} (${botInfo.first_name})`);
      })
      .catch((err) => {
        console.error('[Raika Bot] Connection error:', err.message);
        if (retries > 0) {
          console.log(`[Raika Bot] Retrying connection in ${delay / 1000}s... (${retries} attempts left)`);
          setTimeout(() => launchBotWithRetry(retries - 1, delay), delay);
        }
      });
  }

  launchBotWithRetry();

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { app, server };
