/**
 * Centralized English Strings for Raika Telegram Bot & Backend API
 * Mandatory Requirement: English-Only Interface throughout the entire project.
 */

module.exports = {
  locale: 'en',
  botName: 'Raika Games',
  
  // Bot Commands and Descriptions
  commands: {
    start: {
      command: 'start',
      description: 'Start the bot and open main menu'
    },
    play: {
      command: 'play',
      description: 'Choose a game to start playing'
    },
    profile: {
      command: 'profile',
      description: 'View your profile and gaming stats'
    },
    balance: {
      command: 'balance',
      description: 'Check your demo coin balance'
    },
    bonus: {
      command: 'bonus',
      description: 'Claim your daily bonus reward'
    },
    top: {
      command: 'top',
      description: 'View top players on the leaderboard'
    },
    matches: {
      command: 'matches',
      description: 'View your recent game history'
    },
    settings: {
      command: 'settings',
      description: 'Adjust your game preferences'
    },
    help: {
      command: 'help',
      description: 'How to play and use the bot'
    },
    deposit: {
      command: 'deposit',
      description: 'Deposit demo coins simulation'
    },
    withdraw: {
      command: 'withdraw',
      description: 'Withdraw demo coins simulation'
    },
    cashier: {
      command: 'cashier',
      description: 'Open Cashier and Transaction History'
    }
  },

  // Bot Messages
  messages: {
    welcome: `🦊 Welcome to Raika Game

  ⭐ Raika Game offers the best online mini-games on Telegram

  📢 How to start playing?
  1. Start with your free Demo Coins. Deposits and withdrawals are simulations only.
  2. Use Bonuses to invite friends and earn Demo Coins.
  3. Enter /play or tap Play to start playing!

  💳 Balance: {balance} Demo Coins
  👑 Wagers: {wagers} Demo Coins

  🌐 About us
  Portal | Channel | Chat | Support | FAQ`,

    play: `🎲 *Choose a Game to Start Playing*

Select one of our provably fair demo games:
• 🪙 *Coin Flip* — Simple 50/50 action with 1.96x multiplier
• 🎲 *Dice Roll* — Set your target and roll for huge wins
• 🚀 *Crash Rocket* — Cash out before the rocket flies away!
• 💎 *Mines* — Uncover gems and dodge hidden mines
• 🎡 *Lucky Wheel* — Spin to win up to 10x jackpot!`,

    profile: `👤 *Your Profile*

🏷 *Name:* {name}
🆔 *User ID:* \`{id}\`
💰 *Demo Coin Balance:* {balance} Coins
🏆 *Global Rank:* #{rank}
🎯 *Total Games Played:* {totalGames}
✅ *Games Won:* {gamesWon}
📈 *Win Rate:* {winRate}%
💎 *All-Time Winnings:* {totalWon} Coins
👥 *Friends Invited:* {referrals}`,

    balance: `💰 *Your Demo Coin Balance*

Current Balance: *{balance} Demo Coins*
Status: {status}

💡 *Need more coins?*
Claim your daily bonus, use free instant refill below 100 coins, or try the Deposit Simulation!`,

    bonusSuccess: `🎉 *Daily Bonus Claimed!*

You received *+{amount} Demo Coins*!
🔥 *Current Streak:* Day {streak} of 7
💰 *New Balance:* {balance} Demo Coins

Come back in 24 hours for tomorrow's bonus!`,

    bonusAlreadyClaimed: `⏳ *Bonus Already Claimed Today*

You have already collected today's reward!
🔥 *Streak:* Day {streak} of 7
⏱ *Next Bonus Available in:* {timeLeft}

Keep playing games or invite friends to earn more demo coins!`,

    leaderboardHeader: `🏆 *Raika Global Leaderboard*

Top players ranked by total demo coin winnings:

{rankingList}

👤 *Your Ranking:* #{userRank} ({userWinnings} Coins Won)`,

    emptyLeaderboard: `No games recorded yet. Be the first player to top the leaderboard!`,

    matchesHeader: `📜 *Your Recent Game History*

Here are your last {count} matches:

{matchesList}`,

    noMatches: `You haven't played any matches yet! Use /play to start your first game.`,

    settings: `⚙️ *Settings & Preferences*

🌐 *Language:* English (Default & Only)
🔊 *Sound Effects:* {soundStatus}
📳 *Haptic Feedback:* {hapticStatus}
⚡ *Quick Animations:* {animStatus}

You can configure these preferences inside the Mini App.`,

    help: `ℹ️ *Here is how to use the bot*

Welcome to *Raika*! This platform lets you enjoy exciting, simulated arcade and casino games with 100% free *Demo Coins*.

📌 *Bot Commands:*
/start — Launch the bot and view menu
/play — Browse and start playing games
/profile — Check your stats and achievements
/balance — Check your demo coin balance
/bonus — Claim daily streak rewards
/top — View global player leaderboards
/matches — Review your recent game results
/cashier — Open Cashier simulation
/deposit — Deposit simulation
/withdraw — Withdrawal simulation
/settings — View your platform settings
/help — Show this help manual

💎 *Demo Coins Policy:*
All games use virtual demo coins for entertainment purposes only. No real money gambling is involved. If your balance runs low, you can refill for free anytime!

Need assistance? Contact our support team or launch the Mini App.`,

    cashierInfo: `🏦 *Raika Cashier & Wallet (Simulation Mode)*

Manage your balance with simulated crypto deposits and withdrawals:

💰 *Available Balance:* {balance} Demo Coins (~$\{fiatVal} USD)
📥 *Total Deposited:* {totalDeposited} Coins
📤 *Total Withdrawn:* {totalWithdrawn} Coins

*Simulation Exchange Rate:*
1 USDT / 1 USD = 100 Demo Coins

Choose an action below to test deposits or withdrawals:`,

    depositInfo: `💳 *Deposit Simulation*

Select an amount to test the deposit flow:
• 💵 *$10 USDT* → +1,000 Demo Coins
• 💵 *$25 USDT* → +2,500 Demo Coins
• 💵 *$50 USDT* → +5,000 Demo Coins
• 💵 *$100 USDT* → +10,500 Demo Coins *(+5% Bonus)*

*Simulated Deposit Address (USDT TRC-20):*
\`{address}\`

Tap a button below to simulate an instant deposit:`,

    depositSuccess: `✅ *Deposit Confirmed (Simulation)!*

Received: *+{amount} Demo Coins* ({cryptoAmount} {asset})
TX Hash: \`{txHash}\`
💰 *New Balance:* {balance} Demo Coins`,

    withdrawInfo: `💸 *Withdrawal Simulation*

*Current Balance:* {balance} Demo Coins (~$\{fiatVal} USD)
*Minimum Withdrawal:* 1,000 Demo Coins ($10 USD)

Select a simulated withdrawal package below:`,

    withdrawSuccess: `✅ *Withdrawal Submitted (Simulation)!*

Amount: *{amount} Demo Coins* (~$\{fiatVal} USD)
Asset: *{asset}*
Destination: \`{address}\`
TX Hash: \`{txHash}\`
Status: 🟢 *Completed*
💰 *Remaining Balance:* {balance} Demo Coins`,

    withdrawInsufficient: `⚠️ *Insufficient Balance for Withdrawal*

You need at least *{minWithdrawal} Demo Coins* ($10 USD) to withdraw.
Your current balance is *{balance} Demo Coins*.`,

    transactionsHeader: `📜 *Recent Cashier Transactions*

{transactionsList}`,

    noTransactions: `No deposits or withdrawals recorded yet. Use /deposit to test your first deposit!`,

    referral: `👥 *Invite Friends & Earn Rewards*

Invite your friends to Raika and earn *+500 Demo Coins* for every friend who joins!

🔗 *Your Personal Referral Link:*
\`{referralLink}\`

Share this link with your friends or Telegram channels to start earning!`,

    refillSuccess: `🎁 *Demo Coins Refilled!*

Your balance has been boosted with *+500 Demo Coins*!
💰 *Current Balance:* {balance} Demo Coins. Have fun!`,

    refillNotEligible: `⚠️ *Refill Not Available*

Free refills are available when your balance falls below 100 Demo Coins.
Your current balance is *{balance} Demo Coins*.`,

    insufficientBalance: `⚠️ *Insufficient Demo Coins*

You do not have enough coins for this stake.
Your current balance is *{balance} Demo Coins*.
Please lower your stake or claim your daily bonus / free refill.`,

    errorGeneric: `❌ *An error occurred. Please try again later.*`,
    invalidAmount: `⚠️ Please enter a valid positive number for your stake.`
  },

  // Buttons & Labels (Inline & Reply Keyboards)
  buttons: {
    play: '🎮 Play',
    profile: '👤 Profile',
    bonuses: '🎁 Bonuses',
    depositDemo: '💰 Deposit (Demo)',
    withdrawDemo: '💸 Withdraw (Demo)',
    launchMiniApp: '🚀 Launch Mini App',
    playGames: '🎲 Play Games',
    dailyBonus: '🎁 Daily Bonus',
    leaderboard: '🏆 Leaderboard',
    myProfile: '👤 My Profile',
    demoBalance: '💰 Demo Balance',
    cashier: '🏦 Cashier',
    deposit: '💳 Deposit',
    withdraw: '💸 Withdraw',
    gameHistory: '📜 Game History',
    transactions: '📜 Transactions',
    inviteFriends: '👥 Invite Friends',
    freeRefill: '🔄 Free Refill (+500)',
    help: 'ℹ️ Help & Rules',
    settings: '⚙️ Settings',
    backToMenu: '🔙 Main Menu',
    close: '❌ Close',
    shareReferral: '📤 Share Link'
  },

  // Game Names & Labels
  games: {
    coinflip: {
      name: 'Coin Flip',
      description: 'Pick Heads or Tails. 50% chance for a 1.96x multiplier.'
    },
    dice: {
      name: 'Dice Roll',
      description: 'Predict whether the roll will be Under or Over your target.'
    },
    crash: {
      name: 'Crash Rocket',
      description: 'Watch the multiplier climb and cash out before the rocket crashes!'
    },
    mines: {
      name: 'Mines',
      description: 'Uncover sparkling gems on a 5x5 grid while avoiding hidden mines.'
    },
    wheel: {
      name: 'Lucky Wheel',
      description: 'Spin the neon wheel for a chance to win up to 10x your stake.'
    }
  },

  // BotFather Configuration Export
  botFather: {
    name: 'Raika Games',
    shortDescription: 'Play exciting demo games, win demo coins, and climb the leaderboard in English!',
    description: `Welcome to Raika Games! 🎮

Experience premier demo arcade games:
🪙 Coin Flip
🎲 Dice Roll
🚀 Crash Rocket
💎 Mines
🎡 Lucky Wheel

✨ Features:
• 100% Free Demo Coins
• Daily streak bonuses
• Global leaderboards
• Fast Telegram Mini App interface
• Provably fair simulated outcomes
• Simulated Cashier & Crypto Wallet

All games use virtual demo coins for entertainment only. Enjoy playing!`,
    commandsList: `start - Welcome! Ready to play?
play - Choose a game to start playing
profile - Your Profile
balance - Your Demo Coin Balance
bonus - Claim Your Daily Bonus
cashier - Cashier & Wallet
deposit - Deposit Simulation
withdraw - Withdrawal Simulation
top - Leaderboard
matches - Your Game History
settings - Settings
help - Here is how to use the bot`
  }
};
