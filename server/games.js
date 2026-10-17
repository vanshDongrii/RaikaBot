/**
 * Raika Gaming Platform - Game Logic & Simulation Engine
 * Provably fair demo mechanics with natural English feedback.
 */

// Math combination formula for Mines odds
function combination(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let c = 1;
  for (let i = 1; i <= k; i++) {
    c = (c * (n - (k - i))) / i;
  }
  return c;
}

// Active in-memory interactive game sessions (e.g., Mines)
const activeSessions = new Map();

/**
 * 1. Coin Flip Game
 */
function playCoinFlip(stake, choice) {
  const normalizedChoice = String(choice).toLowerCase() === 'tails' ? 'tails' : 'heads';
  const landedSide = Math.random() < 0.5 ? 'heads' : 'tails';
  const isWin = normalizedChoice === landedSide;
  const multiplier = isWin ? 1.96 : 0;
  const payout = isWin ? Math.floor(stake * multiplier) : 0;
  const profit = payout - stake;

  return {
    game_type: 'coinflip',
    stake,
    choice: normalizedChoice,
    landedSide,
    multiplier,
    payout,
    profit,
    outcome: isWin ? 'win' : 'loss',
    details: {
      userChoice: normalizedChoice === 'heads' ? 'Heads' : 'Tails',
      result: landedSide === 'heads' ? 'Heads' : 'Tails',
      description: isWin 
        ? `Landed on ${landedSide === 'heads' ? 'Heads' : 'Tails'}! You won ${payout} Demo Coins.` 
        : `Landed on ${landedSide === 'heads' ? 'Heads' : 'Tails'}. Better luck next flip!`
    }
  };
}

/**
 * 2. Dice Roll Game
 */
function playDice(stake, direction, target) {
  const normDirection = String(direction).toLowerCase() === 'over' ? 'over' : 'under';
  const normTarget = Math.max(2, Math.min(98, parseInt(target, 10) || 50));
  const roll = Math.floor(Math.random() * 100); // 0 to 99

  let isWin = false;
  let winChance = 50;

  if (normDirection === 'under') {
    isWin = roll < normTarget;
    winChance = normTarget;
  } else {
    isWin = roll > normTarget;
    winChance = 99 - normTarget;
  }

  const rawMultiplier = (98 / Math.max(1, winChance));
  const multiplier = isWin ? Number(rawMultiplier.toFixed(2)) : 0;
  const payout = isWin ? Math.floor(stake * multiplier) : 0;
  const profit = payout - stake;

  return {
    game_type: 'dice',
    stake,
    direction: normDirection,
    target: normTarget,
    roll,
    winChance,
    multiplier,
    payout,
    profit,
    outcome: isWin ? 'win' : 'loss',
    details: {
      roll,
      direction: normDirection === 'under' ? 'Under' : 'Over',
      target: normTarget,
      description: isWin 
        ? `Rolled ${roll} (${normDirection} ${normTarget})! You won ${payout} Demo Coins.`
        : `Rolled ${roll} (${normDirection} ${normTarget}). Roll missed!`
    }
  };
}

/**
 * 3. Crash Rocket Game
 */
function generateCrashPoint() {
  // House edge 4%, formula: 0.96 / (1 - r)
  const r = Math.random();
  if (r < 0.04) return 1.00; // Instant crash at start
  const crash = Math.max(1.00, Number((0.96 / (1 - r)).toFixed(2)));
  return Math.min(crash, 250.00); // Cap at 250x for balance
}

function playCrashAuto(stake, autoCashout) {
  const crashPoint = generateCrashPoint();
  const targetMultiplier = Math.max(1.01, Number(parseFloat(autoCashout || 2.0).toFixed(2)));
  const isWin = crashPoint >= targetMultiplier;
  const multiplier = isWin ? targetMultiplier : 0;
  const payout = isWin ? Math.floor(stake * multiplier) : 0;
  const profit = payout - stake;

  return {
    game_type: 'crash',
    stake,
    crashPoint,
    targetMultiplier,
    multiplier,
    payout,
    profit,
    outcome: isWin ? 'win' : 'loss',
    details: {
      crashPoint: `${crashPoint.toFixed(2)}x`,
      cashedOutAt: isWin ? `${targetMultiplier.toFixed(2)}x` : null,
      description: isWin
        ? `Cashed out at ${targetMultiplier.toFixed(2)}x before rocket crashed at ${crashPoint.toFixed(2)}x! +${payout} Coins.`
        : `Rocket crashed at ${crashPoint.toFixed(2)}x before your ${targetMultiplier.toFixed(2)}x target.`
    }
  };
}

/**
 * 4. Mines Game - Session Management
 */
function startMinesSession(userId, stake, mineCount) {
  const mines = Math.max(1, Math.min(24, parseInt(mineCount, 10) || 3));
  
  // Create 25 tile positions, randomly place mines
  const minePositions = new Set();
  while (minePositions.size < mines) {
    minePositions.add(Math.floor(Math.random() * 25));
  }

  const sessionId = 'mines_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const session = {
    sessionId,
    userId: String(userId),
    stake,
    mineCount: mines,
    minePositions: Array.from(minePositions),
    revealedTiles: [],
    currentMultiplier: 1.0,
    isFinished: false,
    startedAt: Date.now()
  };

  activeSessions.set(sessionId, session);

  return {
    sessionId,
    mineCount: mines,
    revealedCount: 0,
    currentMultiplier: 1.0,
    nextMultiplier: calculateNextMinesMultiplier(mines, 1)
  };
}

function calculateNextMinesMultiplier(mineCount, gemsFound) {
  const totalTiles = 25;
  const safeTiles = totalTiles - mineCount;
  if (gemsFound > safeTiles) return 0;
  
  const odds = combination(totalTiles, gemsFound) / combination(safeTiles, gemsFound);
  const houseMultiplier = odds * 0.97; // 3% house edge
  return Number(Math.max(1.05, houseMultiplier).toFixed(2));
}

function stepMinesSession(sessionId, tileIndex) {
  const session = activeSessions.get(sessionId);
  if (!session || session.isFinished) {
    return { error: 'Session not found or already finished' };
  }

  if (session.revealedTiles.includes(tileIndex)) {
    return { error: 'Tile already revealed' };
  }

  const isMine = session.minePositions.includes(tileIndex);

  if (isMine) {
    // Hit a mine!
    session.isFinished = true;
    session.revealedTiles.push(tileIndex);
    activeSessions.delete(sessionId);

    return {
      hitMine: true,
      tileIndex,
      allMines: session.minePositions,
      outcome: 'loss',
      multiplier: 0,
      payout: 0,
      profit: -session.stake,
      details: {
        gemsFound: session.revealedTiles.length - 1,
        description: 'Boom! You uncovered a hidden mine. Better luck next time!'
      }
    };
  }

  // Safe gem found!
  session.revealedTiles.push(tileIndex);
  const gemsFound = session.revealedTiles.length;
  session.currentMultiplier = calculateNextMinesMultiplier(session.mineCount, gemsFound);
  
  const isMaxClear = gemsFound === (25 - session.mineCount);
  const nextMultiplier = isMaxClear ? null : calculateNextMinesMultiplier(session.mineCount, gemsFound + 1);

  return {
    hitMine: false,
    tileIndex,
    gemsFound,
    currentMultiplier: session.currentMultiplier,
    currentPayout: Math.floor(session.stake * session.currentMultiplier),
    nextMultiplier,
    isMaxClear
  };
}

function cashoutMinesSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session || session.isFinished) {
    return { error: 'Session not found or already finished' };
  }

  if (session.revealedTiles.length === 0) {
    return { error: 'You must reveal at least one gem before cashing out' };
  }

  session.isFinished = true;
  activeSessions.delete(sessionId);

  const payout = Math.floor(session.stake * session.currentMultiplier);
  const profit = payout - session.stake;

  return {
    success: true,
    outcome: 'win',
    stake: session.stake,
    multiplier: session.currentMultiplier,
    payout,
    profit,
    allMines: session.minePositions,
    revealedTiles: session.revealedTiles,
    details: {
      gemsFound: session.revealedTiles.length,
      multiplier: `${session.currentMultiplier.toFixed(2)}x`,
      description: `Cashed out successfully! Found ${session.revealedTiles.length} gems for ${payout} Demo Coins.`
    }
  };
}

/**
 * 5. Lucky Wheel Game
 */
const WHEEL_SEGMENTS = [
  { label: '0x', multiplier: 0.0, color: '#EF4444' },
  { label: '1.2x', multiplier: 1.2, color: '#3B82F6' },
  { label: '1.5x', multiplier: 1.5, color: '#10B981' },
  { label: '2x', multiplier: 2.0, color: '#F59E0B' },
  { label: '0.5x', multiplier: 0.5, color: '#6B7280' },
  { label: '3x', multiplier: 3.0, color: '#8B5CF6' },
  { label: '0x', multiplier: 0.0, color: '#EF4444' },
  { label: '1.2x', multiplier: 1.2, color: '#3B82F6' },
  { label: '5x', multiplier: 5.0, color: '#EC4899' },
  { label: '0.8x', multiplier: 0.8, color: '#6B7280' },
  { label: '2x', multiplier: 2.0, color: '#F59E0B' },
  { label: '10x JACKPOT', multiplier: 10.0, color: '#FBBF24' }
];

function playWheel(stake) {
  const segmentIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
  const segment = WHEEL_SEGMENTS[segmentIndex];
  const multiplier = segment.multiplier;
  const payout = Math.floor(stake * multiplier);
  const profit = payout - stake;
  const isWin = multiplier >= 1.0;

  return {
    game_type: 'wheel',
    stake,
    segmentIndex,
    segment,
    multiplier,
    payout,
    profit,
    outcome: isWin ? 'win' : 'loss',
    details: {
      landedSegment: segment.label,
      multiplier: `${multiplier}x`,
      description: multiplier === 10.0
        ? `JACKPOT! The wheel stopped on 10x! Won ${payout} Demo Coins!`
        : isWin
        ? `Wheel stopped on ${segment.label}! Won ${payout} Demo Coins.`
        : `Wheel stopped on ${segment.label}. Try your luck again!`
    }
  };
}

module.exports = {
  playCoinFlip,
  playDice,
  generateCrashPoint,
  playCrashAuto,
  startMinesSession,
  stepMinesSession,
  cashoutMinesSession,
  playWheel,
  WHEEL_SEGMENTS
};
