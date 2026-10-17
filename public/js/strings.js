/**
 * Raika Telegram Mini App - Centralized English Strings
 * Mandatory Requirement: English-Only Interface throughout the entire application.
 * No secondary languages, no language selectors, no untranslated text.
 */

const STRINGS = {
  locale: 'en',
  appName: 'Raika Games',
  tagline: 'Premier Telegram Demo Arcade',

  // Navigation & Header
  nav: {
    home: 'Home',
    games: 'Games',
    bonus: 'Daily Bonus',
    leaderboard: 'Leaderboard',
    history: 'History',
    profile: 'Profile',
    invite: 'Invite Friends',
    settings: 'Settings',
    help: 'Help'
  },

  // Common Actions & Badges
  common: {
    playNow: 'Play Now',
    claim: 'Claim',
    claimed: 'Claimed',
    copied: 'Copied to Clipboard!',
    copyLink: 'Copy Referral Link',
    shareTelegram: 'Share to Telegram',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back to Games',
    refresh: 'Refresh',
    all: 'All',
    wins: 'Wins',
    losses: 'Losses',
    demoBalance: 'Demo Coins',
    freeRefill: 'Refill Demo Coins (+500)',
    stake: 'Stake Amount',
    multiplier: 'Multiplier',
    profit: 'Profit',
    payout: 'Payout',
    status: 'Status',
    date: 'Date & Time',
    game: 'Game',
    rank: 'Rank',
    player: 'Player',
    winnings: 'Winnings',
    winRate: 'Win Rate',
    totalGames: 'Total Games',
    loading: 'Loading, please wait...',
    connecting: 'Connecting to Raika Network...',
    provablyFair: '100% Provably Fair Demo System',
    freeToPlay: 'Free Demo Coins • No Real Money Gambling',
    tryAgain: 'Please Try Again'
  },

  // Home Screen
  home: {
    greeting: 'Welcome back,',
    heroTitle: 'Play & Win Demo Coins',
    heroSubtitle: 'Choose from 5 exciting mini-games, claim daily streak bonuses, and dominate the global rankings.',
    quickPlay: 'Featured Games',
    dailyBonusBannerTitle: 'Daily Reward Ready!',
    dailyBonusBannerDesc: 'Claim free demo coins to maintain your winning streak.',
    claimBonusBtn: 'Claim Your Daily Bonus',
    recentActivity: 'Live Community Wins',
    statsOverview: 'Your Overview',
    topUpBtn: '+ Refill',
    activePlayers: 'Online Players'
  },

  // Game Lobby & Cards
  lobby: {
    title: 'Game Lobby',
    subtitle: 'Select a game and start playing with your demo coins.',
    minStake: 'Min Stake: 10',
    maxMultiplier: 'Max Win: Up to 100x',
    categories: {
      all: 'All Games',
      arcade: 'Arcade',
      quick: 'Quick Play',
      highReward: 'High Multiplier'
    }
  },

  // Specific Game Interfaces
  games: {
    coinflip: {
      name: 'Coin Flip',
      badge: 'Classic 50/50',
      description: 'Choose Heads or Tails. Double your stake on every right call!',
      rules: 'Select your stake, choose Heads or Tails, and flip the golden coin. Payout is 1.96x for a correct prediction.',
      selectSide: 'Select Your Choice',
      heads: 'Heads',
      tails: 'Tails',
      flipButton: 'Flip the Coin',
      flipping: 'Flipping...',
      winResult: 'You Won! The coin landed on {side}!',
      lossResult: 'You Lost! The coin landed on {side}. Better luck next flip!'
    },
    dice: {
      name: 'Dice Roll',
      badge: 'Adjustable Odds',
      description: 'Set your target threshold and predict whether the roll is Under or Over.',
      rules: 'Slide the threshold between 2 and 98. Choose Under or Over. The payout multiplier adjusts dynamically based on your exact mathematical chance of winning.',
      targetLabel: 'Target Number',
      rollUnder: 'Roll Under',
      rollOver: 'Roll Over',
      winChance: 'Win Chance',
      payoutMultiplier: 'Payout Multiplier',
      rollButton: 'Roll the Dice',
      rolling: 'Rolling...',
      winResult: 'You Won! Rolled {result} ({direction} {target})!',
      lossResult: 'You Lost! Rolled {result} ({direction} {target}). Try again!'
    },
    crash: {
      name: 'Crash Rocket',
      badge: 'Live Multiplier',
      description: 'Watch the rocket soar! Cash out before it flies away into deep space.',
      rules: 'Place your stake and launch the rocket. The multiplier rises continuously from 1.00x upward. Hit Cash Out before the crash to secure your winnings. If it crashes first, your stake is lost.',
      launchButton: 'Launch Rocket',
      cashOutButton: 'Cash Out at {multiplier}x',
      inFlight: 'Rocket in Flight...',
      crashed: 'CRASHED AT {multiplier}x',
      winResult: 'Cashed Out! You won {payout} coins at {multiplier}x!',
      lossResult: 'Crash! The rocket exploded at {multiplier}x.'
    },
    mines: {
      name: 'Mines',
      badge: 'Risk & Strategy',
      description: 'Uncover sparkling emerald gems on a 5x5 grid while avoiding hidden mines.',
      rules: 'Select how many hidden mines are on the field (1 to 24). Tap tiles to uncover gems. Each gem increases your cashout multiplier. Cash out at any time or keep going for bigger rewards!',
      mineCountLabel: 'Number of Hidden Mines',
      gemCountLabel: 'Gems Found',
      currentMultiplier: 'Current Multiplier',
      nextGemMultiplier: 'Next Gem',
      startGameButton: 'Start Exploration',
      cashOutButton: 'Cash Out {payout} Coins',
      uncoverTile: 'Pick a Tile',
      winResult: 'Successfully Cashed Out {payout} Demo Coins!',
      lossResult: 'BOOM! You uncovered a mine. Game over!'
    },
    wheel: {
      name: 'Lucky Wheel',
      badge: 'Spin & Win',
      description: 'Spin the neon carnival wheel to hit multipliers up to 10x your stake.',
      rules: 'Choose your stake and spin the wheel. The wheel contains 12 segments featuring multipliers from 0x to 10x jackpot.',
      spinButton: 'Spin the Wheel',
      spinning: 'Spinning the Wheel...',
      jackpotAlert: 'JACKPOT! 10x MULTIPLIER HIT!',
      winResult: 'You Won! The wheel stopped on {multiplier}x (+{payout} coins)!',
      lossResult: 'No win this time! The wheel stopped on {multiplier}x.'
    }
  },

  // Daily Streak Bonus
  bonus: {
    title: 'Daily Bonus Streak',
    subtitle: 'Log in daily to claim escalating demo coin rewards. Keep your streak alive!',
    dayLabel: 'Day {day}',
    coinsReward: '+{amount} Coins',
    readyToClaim: 'Claim Now',
    claimedToday: 'Collected Today',
    locked: 'Locked',
    currentStreak: 'Current Streak: Day {day} of 7',
    nextBonusTimer: 'Next reward available in {time}',
    claimSuccess: 'Your Reward Has Been Claimed! +{amount} Demo Coins added to your balance.',
    streakResetNotice: 'Log in every 24 hours to prevent your streak from resetting.'
  },

  // Leaderboard
  leaderboard: {
    title: 'Global Leaderboard',
    subtitle: 'Top players with the highest demo coin winnings this week.',
    topRankings: 'Hall of Fame',
    rankHeader: 'Rank',
    playerHeader: 'Player',
    winningsHeader: 'Total Won',
    gamesHeader: 'Games Played',
    yourRankBanner: 'Your Position: #{rank} • Total Winnings: {amount} Coins',
    emptyList: 'No game records yet. Start playing to take the #1 spot!'
  },

  // Referral / Invite
  referral: {
    title: 'Invite Friends',
    subtitle: 'Share your personal referral link and receive free demo coins for every friend who joins!',
    rewardPerFriend: '+500 Demo Coins',
    rewardDesc: 'Granted automatically when your friend starts playing.',
    yourLink: 'Your Unique Invite Link',
    copyBtn: 'Copy Link',
    shareBtn: 'Share on Telegram',
    statsTitle: 'Referral Performance',
    totalInvited: 'Friends Invited',
    totalEarned: 'Total Coins Earned',
    noReferralsYet: 'You have not invited any friends yet. Share your link above to get started!'
  },

  // Match History
  history: {
    title: 'Game History',
    subtitle: 'Review your recent game outcomes, stakes, and payout multipliers.',
    filterAll: 'All Matches',
    filterWins: 'Wins Only',
    filterLosses: 'Losses Only',
    emptyHistory: 'No games recorded yet. Pick a game from the lobby to start playing!',
    stakeLabel: 'Stake:',
    payoutLabel: 'Payout:',
    profitLabel: 'Profit:'
  },

  // Profile & Balance
  profile: {
    title: 'Player Profile',
    subtitle: 'Manage your demo account, check your career statistics, and refill coins.',
    balanceCardTitle: 'Your Demo Coin Balance',
    refillButton: 'Refill Demo Coins (+500)',
    refillEligibleMsg: 'Balance low? Click refill to get +500 free demo coins right away!',
    refillIneligibleMsg: 'Refill unlocks whenever your balance falls below 100 coins.',
    statsTitle: 'Lifetime Statistics',
    statTotalGames: 'Total Matches',
    statWins: 'Matches Won',
    statLosses: 'Matches Lost',
    statWinRate: 'Win Percentage',
    statTotalWagered: 'Total Wagered',
    statTotalWon: 'Total Won',
    statNetProfit: 'Net Profit',
    statBestMultiplier: 'Best Multiplier'
  },

  // Settings
  settings: {
    title: 'Settings',
    subtitle: 'Customize your gameplay experience.',
    audioEffects: 'Sound Effects',
    audioDesc: 'Procedural arcade and casino audio synthesized via Web Audio.',
    haptics: 'Haptic Feedback',
    hapticsDesc: 'Vibration feedback on device when tapping buttons and winning.',
    fastAnimations: 'Turbo Animations',
    fastAnimationsDesc: 'Accelerate game animations for rapid gameplay.',
    language: 'Language',
    languageValue: 'English (Default & Only)',
    languageNote: 'Raika is strictly an English-only platform across all interfaces.',
    simulatorMode: 'Telegram Simulator View',
    simulatorDesc: 'Show Telegram WebApp mobile device bezel when testing in browser.',
    resetData: 'Reset Demo Data',
    resetDesc: 'Restore starting balance to 1,000 coins and clear local history.'
  },

  // Cashier & Wallet Simulation Mode
  cashier: {
    title: 'Cashier & Wallet',
    subtitle: 'Simulate crypto deposits, test withdrawals, and inspect transaction ledgers.',
    tabs: {
      deposit: 'Deposit',
      withdraw: 'Withdraw',
      transactions: 'Transactions'
    },
    deposit: {
      title: 'Simulated Crypto Deposit',
      selectAsset: 'Select Crypto Network',
      addressLabel: 'Your Deposit Address (Simulation)',
      rateNotice: 'Simulation Rate: 1 USDT = 100 Demo Coins ($1.00 USD)',
      testPackagesTitle: 'Instant Simulated Top-Up Packages',
      customAmount: 'Custom USDT Amount',
      simulateTransferBtn: 'Simulate Deposit Transfer',
      copyAddress: 'Copy Address',
      bonusTag: '+5% Bonus Coins'
    },
    withdraw: {
      title: 'Simulated Crypto Withdrawal',
      destinationLabel: 'Destination Wallet Address',
      destinationPlaceholder: 'Enter TRC-20 or TON wallet address...',
      amountLabel: 'Withdrawal Amount (Demo Coins)',
      minNotice: 'Minimum withdrawal: 1,000 Demo Coins ($10.00 USD)',
      fiatPreview: 'Simulated Payout: ${fiat} USD',
      submitBtn: 'Submit Simulated Withdrawal',
      processingTime: 'Instant simulation processing'
    },
    transactions: {
      title: 'Cashier Transaction Ledger',
      filterAll: 'All Transactions',
      filterDeposits: 'Deposits',
      filterWithdrawals: 'Withdrawals',
      empty: 'No cashier transactions recorded yet. Try a simulated deposit!',
      colType: 'Type',
      colAmount: 'Amount',
      colStatus: 'Status',
      colDate: 'Date',
      colHash: 'TX Hash'
    },
    receipt: {
      title: 'Blockchain Transaction Receipt',
      statusConfirmed: 'Confirmed on Blockchain (Simulated)',
      statusPending: 'Broadcasting to Network',
      networkFee: 'Network Fee: 0 Demo Coins (Free Simulation)',
      closeBtn: 'Close Receipt'
    }
  },

  // System Messages & Notifications
  alerts: {
    insufficientCoins: 'Insufficient Demo Coins! Your current balance is {balance}. Please lower your stake or claim your free refill.',
    invalidStake: 'Please enter a valid stake between 10 and {balance} coins.',
    rewardClaimed: 'Your Reward Has Been Claimed!',
    bonusAlreadyClaimed: 'You have already claimed your daily bonus today. Please return tomorrow!',
    refillSuccess: 'Demo balance replenished! +500 Demo Coins have been added.',
    depositSuccess: 'Deposit Confirmed! +{amount} Demo Coins ({cryptoAmount} {asset}) credited to your account.',
    withdrawSuccess: 'Withdrawal Processed! {amount} Demo Coins sent to your destination address.',
    withdrawMinError: 'Minimum withdrawal amount is 1,000 Demo Coins ($10.00 USD).',
    withdrawInvalidAddress: 'Please enter a valid wallet address (at least 20 characters).',
    gameInProgress: 'A game is currently in progress. Please finish it before leaving.',
    actionFailed: 'Please Try Again. Something went wrong while processing your request.',
    copiedSuccess: 'Copied to clipboard!'
  }
};

// Export for browser environment
if (typeof window !== 'undefined') {
  window.STRINGS = STRINGS;
}

// Export for Node/CommonJS environment if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = STRINGS;
}
