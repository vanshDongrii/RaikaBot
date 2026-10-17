/**
 * Raika Gaming Platform - Persistent In-Memory / File Database
 * Manages users, balances, daily streaks, matches, and leaderboards.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial state
const defaultState = {
  users: {},
  matches: [],
  transactions: [],
  globalStats: {
    totalMatches: 0,
    totalCoinsWagered: 0,
    totalCoinsWon: 0,
    totalDeposited: 0,
    totalWithdrawn: 0
  }
};

let dbState = { ...defaultState };

// Load persisted DB
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbState = JSON.parse(raw);
    } else {
      saveDB();
    }
  } catch (err) {
    console.error('Error loading database, resetting to default:', err.message);
    dbState = { ...defaultState };
  }
}

// Save DB atomically
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database:', err.message);
  }
}

loadDB();

// Daily streak reward amounts (Days 1 to 7)
const DAILY_REWARDS = [100, 150, 220, 320, 450, 650, 1000];

/**
 * Get or create a player profile
 */
function getOrCreateUser(tgUser = {}) {
  const userId = String(tgUser.id || 'demo_player_1');
  
  if (!dbState.users[userId]) {
    const defaultReferralCode = 'ref_' + Math.random().toString(36).substring(2, 8);
    dbState.users[userId] = {
      id: userId,
      username: tgUser.username || 'Player_' + userId.slice(-4),
      first_name: tgUser.first_name || 'Adventurer',
      demo_balance: 1000,
      daily_streak: 0,
      last_bonus_claimed_at: null,
      total_wagered: 0,
      total_won: 0,
      total_games: 0,
      games_won: 0,
      best_multiplier: 1.0,
      referral_code: defaultReferralCode,
      referred_by: null,
      referrals_count: 0,
      referral_earnings: 0,
      created_at: Date.now()
    };
    saveDB();
  } else {
    // Update user display name if provided
    if (tgUser.first_name) dbState.users[userId].first_name = tgUser.first_name;
    if (tgUser.username) dbState.users[userId].username = tgUser.username;
  }

  return dbState.users[userId];
}

/**
 * Get user by ID
 */
function getUser(userId) {
  return dbState.users[String(userId)] || null;
}

/**
 * Refill user demo balance if under 100 coins
 */
function refillBalance(userId) {
  const user = getOrCreateUser({ id: userId });
  if (user.demo_balance >= 100) {
    return { success: false, reason: 'Balance is 100 coins or higher. Refill is unlocked below 100 coins.', balance: user.demo_balance };
  }
  user.demo_balance += 500;
  saveDB();
  return { success: true, added: 500, balance: user.demo_balance };
}

/**
 * Claim daily streak reward
 */
function claimDailyBonus(userId) {
  const user = getOrCreateUser({ id: userId });
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

  if (user.last_bonus_claimed_at) {
    const diff = now - user.last_bonus_claimed_at;
    if (diff < ONE_DAY_MS) {
      const remainingMs = ONE_DAY_MS - diff;
      const hours = Math.floor(remainingMs / (60 * 60 * 1000));
      const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      return {
        success: false,
        alreadyClaimed: true,
        streak: user.daily_streak || 1,
        timeLeft: `${hours}h ${minutes}m`,
        remainingMs,
        balance: user.demo_balance
      };
    }

    if (diff > TWO_DAYS_MS) {
      // Streak broken, reset to Day 1
      user.daily_streak = 1;
    } else {
      // Streak advances (1-7 cycling)
      user.daily_streak = (user.daily_streak % 7) + 1;
    }
  } else {
    // First claim
    user.daily_streak = 1;
  }

  const rewardAmount = DAILY_REWARDS[user.daily_streak - 1] || 100;
  user.demo_balance += rewardAmount;
  user.last_bonus_claimed_at = now;
  saveDB();

  return {
    success: true,
    amount: rewardAmount,
    streak: user.daily_streak,
    balance: user.demo_balance
  };
}

/**
 * Record a played match and update user stats
 */
function recordMatch(userId, { game_type, stake, multiplier, payout, profit, outcome, details }) {
  const user = getOrCreateUser({ id: userId });
  const matchId = 'match_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  const match = {
    id: matchId,
    user_id: user.id,
    player_name: user.first_name,
    game_type,
    stake: Number(stake),
    multiplier: Number(multiplier),
    payout: Number(payout),
    profit: Number(profit),
    outcome, // 'win' | 'loss'
    details: details || {},
    created_at: Date.now()
  };

  // Update user balance
  user.demo_balance = Math.max(0, user.demo_balance + profit);
  user.total_wagered += stake;
  user.total_games += 1;

  if (outcome === 'win') {
    user.games_won += 1;
    user.total_won += payout;
    if (multiplier > user.best_multiplier) {
      user.best_multiplier = Number(multiplier.toFixed(2));
    }
  }

  // Update global stats
  dbState.globalStats.totalMatches += 1;
  dbState.globalStats.totalCoinsWagered += stake;
  if (outcome === 'win') {
    dbState.globalStats.totalCoinsWon += payout;
  }

  // Add match to beginning of matches list
  dbState.matches.unshift(match);
  if (dbState.matches.length > 200) {
    dbState.matches.pop();
  }

  saveDB();
  return { match, user };
}

/**
 * Get Leaderboard: top users sorted by total winnings
 */
function getLeaderboard(limit = 10) {
  // Ensure we have active mock leaderboard users if database is fresh
  seedMockLeaderboardIfNeeded();

  const allUsers = Object.values(dbState.users);
  const sorted = allUsers
    .sort((a, b) => (b.total_won || 0) - (a.total_won || 0))
    .slice(0, limit)
    .map((u, index) => ({
      rank: index + 1,
      id: u.id,
      name: u.first_name,
      username: u.username,
      total_won: u.total_won || 0,
      games_won: u.games_won || 0,
      total_games: u.total_games || 0,
      win_rate: u.total_games > 0 ? Math.round((u.games_won / u.total_games) * 100) : 0,
      best_multiplier: u.best_multiplier || 1.0
    }));

  return sorted;
}

/**
 * Get user rank
 */
function getUserRank(userId) {
  const allUsers = Object.values(dbState.users).sort((a, b) => (b.total_won || 0) - (a.total_won || 0));
  const index = allUsers.findIndex(u => u.id === String(userId));
  return index >= 0 ? index + 1 : allUsers.length + 1;
}

/**
 * Get matches for a specific user
 */
function getUserMatches(userId, limit = 20) {
  return dbState.matches
    .filter(m => m.user_id === String(userId))
    .slice(0, limit);
}

/**
 * Get recent live platform matches
 */
function getRecentLiveMatches(limit = 8) {
  return dbState.matches.slice(0, limit);
}

/**
 * Apply referral code
 */
function applyReferral(newUserId, referralCode) {
  if (!referralCode) return { success: false };
  const user = getOrCreateUser({ id: newUserId });
  if (user.referred_by) return { success: false, reason: 'Referral already applied' };

  // Find referrer
  const referrer = Object.values(dbState.users).find(u => u.referral_code === referralCode);
  if (!referrer || referrer.id === user.id) {
    return { success: false, reason: 'Invalid referral code' };
  }

  user.referred_by = referrer.id;
  user.demo_balance += 500; // Bonus for joining via referral

  referrer.referrals_count += 1;
  referrer.referral_earnings += 500;
  referrer.demo_balance += 500; // Bonus for referrer

  saveDB();
  return { success: true, bonus: 500, referrerName: referrer.first_name };
}

/**
 * Seed initial mock leaderboard entries for rich first-time display
 */
function seedMockLeaderboardIfNeeded() {
  const mockSeedKeys = ['bot_alex', 'bot_sophia', 'bot_liam', 'bot_emma', 'bot_noah'];
  if (Object.keys(dbState.users).length > 3) return;

  const mockSeeds = [
    { id: 'bot_alex', username: 'CryptoAce', first_name: 'Alex Rivera', demo_balance: 18450, total_won: 42800, total_games: 85, games_won: 52, best_multiplier: 14.5 },
    { id: 'bot_sophia', username: 'LuckySophia', first_name: 'Sophia Chen', demo_balance: 14200, total_won: 31500, total_games: 64, games_won: 38, best_multiplier: 10.0 },
    { id: 'bot_liam', username: 'RocketLiam', first_name: 'Liam Vance', demo_balance: 9800, total_won: 22400, total_games: 51, games_won: 29, best_multiplier: 8.4 },
    { id: 'bot_emma', username: 'MinesQueen', first_name: 'Emma Watson', demo_balance: 8100, total_won: 18600, total_games: 44, games_won: 24, best_multiplier: 6.8 },
    { id: 'bot_noah', username: 'DiceMaster', first_name: 'Noah King', demo_balance: 6500, total_won: 15200, total_games: 38, games_won: 21, best_multiplier: 5.2 }
  ];

  for (const s of mockSeeds) {
    if (!dbState.users[s.id]) {
      dbState.users[s.id] = {
        ...s,
        daily_streak: 4,
        last_bonus_claimed_at: Date.now() - 3600000,
        total_wagered: Math.round(s.total_won * 0.75),
        referral_code: 'ref_' + s.id.slice(4),
        referred_by: null,
        referrals_count: 3,
        referral_earnings: 1500,
        created_at: Date.now() - 86400000 * 5
      };
    }
  }
  saveDB();
}

/**
 * Cashier & Crypto Wallet Simulation Engine
 */

function generateHex(len = 64) {
  let str = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < len; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

function getUserDepositAddresses(userId) {
  const seed = String(userId).slice(-6);
  return {
    USDT_TRC20: 'TX7K' + seed + 'mQ9pL2vR8wY4sE1tN6zB3' + generateHex(8),
    TON: 'EQD' + seed + 'kF3hP0vB7xM1wZ9yT4qL8' + generateHex(12),
    BTC: 'bc1q' + seed + 'w9k3z7f4y2t8x5m1p6c0' + generateHex(14)
  };
}

function createDeposit(userId, { asset = 'USDT', usdtAmount = 10 }) {
  const user = getOrCreateUser({ id: userId });
  const numUsdt = Math.max(1, parseFloat(usdtAmount) || 10);
  
  // Base exchange: 1 USDT = 100 Demo Coins
  let coins = Math.floor(numUsdt * 100);
  let bonusCoins = 0;

  // 5% bonus for deposits of $100 or more
  if (numUsdt >= 100) {
    bonusCoins = Math.floor(coins * 0.05);
    coins += bonusCoins;
  }

  const txId = 'tx_dep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const txHash = '0x' + generateHex(64);
  const addresses = getUserDepositAddresses(user.id);
  const address = asset === 'TON' ? addresses.TON : asset === 'BTC' ? addresses.BTC : addresses.USDT_TRC20;

  const transaction = {
    id: txId,
    user_id: user.id,
    type: 'deposit',
    asset: String(asset).toUpperCase(),
    network: asset === 'TON' ? 'The Open Network (TON)' : asset === 'BTC' ? 'Bitcoin' : 'Tron (TRC-20)',
    fiat_amount: Number(numUsdt.toFixed(2)),
    coins_amount: coins,
    bonus_coins: bonusCoins,
    tx_hash: txHash,
    address,
    status: 'completed',
    created_at: Date.now()
  };

  user.demo_balance += coins;
  user.total_deposited = (user.total_deposited || 0) + coins;
  dbState.globalStats.totalDeposited = (dbState.globalStats.totalDeposited || 0) + coins;

  if (!dbState.transactions) dbState.transactions = [];
  dbState.transactions.unshift(transaction);
  if (dbState.transactions.length > 500) dbState.transactions.pop();

  saveDB();

  return {
    success: true,
    transaction,
    newBalance: user.demo_balance,
    totalDeposited: user.total_deposited || 0,
    totalWithdrawn: user.total_withdrawn || 0
  };
}

function createWithdrawal(userId, { asset = 'USDT', coinsAmount = 1000, destinationAddress = '' }) {
  const user = getOrCreateUser({ id: userId });
  const coins = parseInt(coinsAmount, 10);

  if (isNaN(coins) || coins < 1000) {
    return { success: false, error: 'Minimum withdrawal is 1,000 Demo Coins ($10.00 USD).' };
  }

  if (user.demo_balance < coins) {
    return { success: false, error: `Insufficient Demo Coins. Your current balance is ${user.demo_balance.toLocaleString()} Coins.` };
  }

  const cleanAddr = String(destinationAddress || '').trim();
  if (cleanAddr.length < 15) {
    return { success: false, error: 'Please enter a valid destination wallet address.' };
  }

  const numUsdt = Number((coins / 100).toFixed(2));
  const txId = 'tx_wth_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const txHash = '0x' + generateHex(64);

  const transaction = {
    id: txId,
    user_id: user.id,
    type: 'withdrawal',
    asset: String(asset).toUpperCase(),
    network: asset === 'TON' ? 'The Open Network (TON)' : 'Tron (TRC-20)',
    fiat_amount: numUsdt,
    coins_amount: coins,
    bonus_coins: 0,
    tx_hash: txHash,
    address: cleanAddr,
    status: 'completed',
    created_at: Date.now()
  };

  user.demo_balance -= coins;
  user.total_withdrawn = (user.total_withdrawn || 0) + coins;
  dbState.globalStats.totalWithdrawn = (dbState.globalStats.totalWithdrawn || 0) + coins;

  if (!dbState.transactions) dbState.transactions = [];
  dbState.transactions.unshift(transaction);
  if (dbState.transactions.length > 500) dbState.transactions.pop();

  saveDB();

  return {
    success: true,
    transaction,
    newBalance: user.demo_balance,
    totalDeposited: user.total_deposited || 0,
    totalWithdrawn: user.total_withdrawn || 0
  };
}

function getUserTransactions(userId, limit = 50) {
  if (!dbState.transactions) dbState.transactions = [];
  return dbState.transactions
    .filter(t => t.user_id === String(userId))
    .slice(0, limit);
}

function getCashierSummary(userId) {
  const user = getOrCreateUser({ id: userId });
  const txs = getUserTransactions(userId, 10);
  const addresses = getUserDepositAddresses(user.id);
  const fiatVal = Number((user.demo_balance / 100).toFixed(2));

  return {
    balance: user.demo_balance,
    fiatValue: fiatVal,
    totalDeposited: user.total_deposited || 0,
    totalWithdrawn: user.total_withdrawn || 0,
    depositAddresses: addresses,
    recentTransactions: txs
  };
}

module.exports = {
  getOrCreateUser,
  getUser,
  refillBalance,
  claimDailyBonus,
  recordMatch,
  getLeaderboard,
  getUserRank,
  getUserMatches,
  getRecentLiveMatches,
  applyReferral,
  getUserDepositAddresses,
  createDeposit,
  createWithdrawal,
  getUserTransactions,
  getCashierSummary
};
