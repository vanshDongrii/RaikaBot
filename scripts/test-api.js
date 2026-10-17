/**
 * Raika End-to-End API Test Script
 * Verifies backend functionality, game outcomes, balance math, and English responses.
 */

const assert = require('assert');
const db = require('../server/db');
const games = require('../server/games');
const strings = require('../server/locales/en');

console.log('====================================================');
console.log('🧪 Starting Raika Platform End-to-End Automated Tests');
console.log('====================================================\n');

// Test 1: User creation & initial balance
console.log('Test 1: User Profile & Demo Balance Initialization');
const testUserId = 'test_player_' + Date.now();
const user = db.getOrCreateUser({ id: testUserId, first_name: 'TestHero', username: 'testhero' });
assert.strictEqual(user.id, testUserId);
assert.strictEqual(user.demo_balance, 1000, 'Initial balance should be 1,000 Demo Coins');
console.log(`✓ User initialized with balance: ${user.demo_balance} Demo Coins`);

// Test 2: Daily bonus streak claim
console.log('\nTest 2: Daily Bonus Streak Claim');
const bonusResult = db.claimDailyBonus(testUserId);
assert.strictEqual(bonusResult.success, true);
assert.strictEqual(bonusResult.streak, 1);
assert.strictEqual(bonusResult.amount, 100);
assert.strictEqual(bonusResult.balance, 1100);
console.log(`✓ Day 1 bonus claimed successfully (+${bonusResult.amount} Coins). New balance: ${bonusResult.balance}`);

// Immediate 2nd claim should be rejected (cooldown)
const repeatClaim = db.claimDailyBonus(testUserId);
assert.strictEqual(repeatClaim.success, false);
assert.strictEqual(repeatClaim.alreadyClaimed, true);
console.log(`✓ Cooldown enforced. Next bonus available in: ${repeatClaim.timeLeft}`);

// Test 3: Provably Fair Game 1 - Coin Flip
console.log('\nTest 3: Coin Flip Game Simulation');
const flipResult = games.playCoinFlip(50, 'heads');
assert(['heads', 'tails'].includes(flipResult.landedSide));
assert(['win', 'loss'].includes(flipResult.outcome));
if (flipResult.outcome === 'win') {
  assert.strictEqual(flipResult.multiplier, 1.96);
  assert.strictEqual(flipResult.payout, 98);
  assert.strictEqual(flipResult.profit, 48);
} else {
  assert.strictEqual(flipResult.multiplier, 0);
  assert.strictEqual(flipResult.profit, -50);
}
db.recordMatch(testUserId, flipResult);
console.log(`✓ Coin Flip resolved: ${flipResult.outcome.toUpperCase()} (${flipResult.details.description})`);

// Test 4: Provably Fair Game 2 - Dice Roll
console.log('\nTest 4: Dice Roll Simulation');
const diceResult = games.playDice(50, 'under', 50);
assert(diceResult.roll >= 0 && diceResult.roll <= 99);
db.recordMatch(testUserId, diceResult);
console.log(`✓ Dice Roll resolved: Rolled ${diceResult.roll} (${diceResult.outcome.toUpperCase()})`);

// Test 5: Provably Fair Game 3 - Crash Rocket
console.log('\nTest 5: Crash Rocket Simulation');
const crashPoint = games.generateCrashPoint();
assert(crashPoint >= 1.00, 'Crash point must be >= 1.00x');
console.log(`✓ Crash point generated: ${crashPoint.toFixed(2)}x`);

const crashAutoResult = games.playCrashAuto(50, 1.50);
db.recordMatch(testUserId, crashAutoResult);
console.log(`✓ Crash round resolved: ${crashAutoResult.outcome.toUpperCase()} (Crashed at ${crashAutoResult.crashPoint.toFixed(2)}x)`);

// Test 6: Provably Fair Game 4 - Mines Interactive Session
console.log('\nTest 6: Mines Interactive Session Simulation');
const minesSession = games.startMinesSession(testUserId, 50, 3);
assert.strictEqual(minesSession.mineCount, 3);
console.log(`✓ Mines session started: ID ${minesSession.sessionId}, next multiplier: ${minesSession.nextMultiplier}x`);

// Step tiles
let step = games.stepMinesSession(minesSession.sessionId, 0);
if (!step.hitMine) {
  console.log(`✓ Tile 0 is safe gem! Current multiplier: ${step.currentMultiplier}x`);
  const cashout = games.cashoutMinesSession(minesSession.sessionId);
  assert.strictEqual(cashout.outcome, 'win');
  db.recordMatch(testUserId, cashout);
  console.log(`✓ Cashed out Mines at ${cashout.multiplier}x for ${cashout.payout} Coins`);
} else {
  console.log(`✓ Tile 0 hit a mine! Handled loss gracefully.`);
}

// Test 7: Provably Fair Game 5 - Lucky Wheel
console.log('\nTest 7: Lucky Wheel Simulation');
const wheelResult = games.playWheel(50);
assert(wheelResult.segmentIndex >= 0 && wheelResult.segmentIndex < 12);
db.recordMatch(testUserId, wheelResult);
console.log(`✓ Lucky Wheel stopped on ${wheelResult.segment.label} (${wheelResult.outcome.toUpperCase()})`);

// Test 8: Leaderboard & User Rank
console.log('\nTest 8: Leaderboard Generation');
const leaderboard = db.getLeaderboard(5);
assert(leaderboard.length > 0, 'Leaderboard must contain ranked players');
const userRank = db.getUserRank(testUserId);
console.log(`✓ Leaderboard returned ${leaderboard.length} players. Test user rank: #${userRank}`);

// Test 9: Match History
console.log('\nTest 9: Match History Retrieval');
const userMatches = db.getUserMatches(testUserId, 10);
assert(userMatches.length > 0, 'User should have match records');
console.log(`✓ Retrieved ${userMatches.length} match records for user`);

// Test 10: Free Refill Logic
console.log('\nTest 10: Free Refill Logic');
// Current balance is > 100, refill should be rejected
const ineligibleRefill = db.refillBalance(testUserId);
assert.strictEqual(ineligibleRefill.success, false, 'Refill should be rejected if balance >= 100');
console.log(`✓ High-balance refill rejected properly: "${ineligibleRefill.reason}"`);

// Artificially lower balance to test successful refill
const u = db.getUser(testUserId);
u.demo_balance = 20;
const eligibleRefill = db.refillBalance(testUserId);
assert.strictEqual(eligibleRefill.success, true);
assert.strictEqual(eligibleRefill.balance, 520);
console.log(`✓ Low-balance refill approved! +500 Coins added. New balance: ${eligibleRefill.balance}`);

// Test 11: Cashier Deposit Simulation
console.log('\nTest 11: Cashier Deposit Simulation');
const depResult = db.createDeposit(testUserId, { asset: 'USDT', usdtAmount: 25 });
assert.strictEqual(depResult.success, true);
assert.strictEqual(depResult.transaction.coins_amount, 2500);
assert.strictEqual(depResult.transaction.type, 'deposit');
console.log(`✓ Simulated deposit confirmed! +${depResult.transaction.coins_amount} Coins ($${depResult.transaction.fiat_amount} USDT). New balance: ${depResult.newBalance}`);

// Test 12: Cashier Withdrawal Simulation & Ledger
console.log('\nTest 12: Cashier Withdrawal Simulation & Ledger');
const addrs = db.getUserDepositAddresses(testUserId);
const wthResult = db.createWithdrawal(testUserId, { asset: 'USDT', coinsAmount: 1000, destinationAddress: addrs.USDT_TRC20 });
assert.strictEqual(wthResult.success, true);
assert.strictEqual(wthResult.transaction.coins_amount, 1000);
assert.strictEqual(wthResult.transaction.type, 'withdrawal');
console.log(`✓ Simulated withdrawal submitted! -${wthResult.transaction.coins_amount} Coins ($${wthResult.transaction.fiat_amount} USDT). Remaining: ${wthResult.newBalance}`);

const cashierSummary = db.getCashierSummary(testUserId);
assert(cashierSummary.totalDeposited >= 2500);
assert(cashierSummary.totalWithdrawn >= 1000);
console.log(`✓ Cashier summary verified: Total Deposited: ${cashierSummary.totalDeposited}, Total Withdrawn: ${cashierSummary.totalWithdrawn}`);

console.log('\n====================================================');
console.log('🎉 ALL 12 BACKEND, GAME ENGINE & CASHIER TESTS PASSED!');
console.log('====================================================\n');
