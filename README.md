# Raika Games — Telegram Bot & Mini App (100% English-Only Edition)

A high-performance gaming platform built for Telegram featuring an interactive **Telegram Bot** and a mobile-optimized **Telegram Mini App (TMA)** with 5 playable provably fair demo arcade games, daily streak bonuses, global leaderboards, and referral rewards.

> **MANDATORY REQUIREMENT ENFORCED:**
> This entire codebase and user interface are **strictly 100% English-only**. No secondary languages, translation menus, or untranslated tokens exist anywhere in the application.

---

## 🎮 Included Games (All English with Live Physics & Audio)

1. **🪙 Coin Flip (3D)**: Select Heads or Tails, flip a 3D animated coin, win at a 1.96x multiplier.
2. **🎲 Dice Roll**: Slide target from 2 to 98, predict Under or Over with dynamically calculated mathematical win chance % and payout multipliers.
3. **🚀 Crash Rocket**: Real-time canvas curve trajectory where multiplier rises exponentially from 1.00x upward. Cash out before the rocket crashes!
4. **💎 Mines (5x5 Grid)**: Strategic exploration grid. Set hidden mines (1 to 24), uncover sparkling emerald gems, and cash out step-by-step winnings.
5. **🎡 Lucky Wheel**: Neon spinning wheel with 12 segments featuring multipliers from 0x to a 10x Jackpot.

---

## 🚀 Key Features

- **Demo Coins Economy**: Starts with 1,000 Demo Coins. If balance drops below 100, free refill of +500 Demo Coins is available anytime.
- **7-Day Streak Daily Bonus**: Escalating daily rewards (Day 1: 100 → Day 7: 1,000 Demo Coins) with 24-hour cooldown timer.
- **Global Leaderboard**: Live podium (🥇 1st, 🥈 2nd, 🥉 3rd) and top rankings by total winnings.
- **Referral System**: Unique referral links (`https://t.me/raika_bot?start=ref_...`) providing +500 Demo Coins to both the referrer and the invited friend.
- **Web Audio Procedural Sound Synthesizer**: Zero external audio assets; crisp synthesized casino sound effects for clicks, coin flips, dice rolls, wins, explosions, and cashouts.
- **Telegram WebApp Integration**: Seamless integration with `Telegram.WebApp` (haptics, theme parameters, expand, user session) with browser simulator view for desktop testing.

---

## 📋 Bot Commands (English-Only)

| Command | English Response |
|---|---|
| `/start` | "Welcome! Ready to play?" |
| `/play` | "Choose a game to start playing." |
| `/profile` | "Your Profile" |
| `/balance` | "Your Demo Coin Balance" |
| `/bonus` | "Claim Your Daily Bonus" |
| `/top` | "Leaderboard" |
| `/matches` | "Your Game History" |
| `/settings` | "Settings" |
| `/help` | "Here is how to use the bot." |

---

## 🛠️ Project Structure

```text
├── server/
│   ├── index.js            # Express server, REST API, static files, and bot bootstrap
│   ├── bot.js              # Telegraf Telegram Bot handlers and inline keyboards
│   ├── db.js               # In-memory and JSON file persistence layer
│   ├── games.js            # Provably fair game math and session engines
│   └── locales/
│       └── en.js           # Centralized English bot strings and BotFather metadata
├── public/
│   ├── index.html          # Semantic HTML5 Mini App with desktop simulator bezel
│   ├── css/
│   │   └── app.css         # Cyberpunk dark mode, glassmorphism, 3D animations
│   └── js/
│       ├── strings.js      # Centralized English UI dictionary for Mini App
│       ├── audio.js        # Web Audio API procedural sound synthesizer
│       ├── telegram.js     # Telegram WebApp SDK helper & haptic feedback
│       ├── api.js          # REST API client
│       ├── app.js          # Main UI controller & screen router
│       └── games/          # 5 interactive game controllers
│           ├── coinflip.js
│           ├── dice.js
│           ├── crash.js
│           ├── mines.js
│           └── wheel.js
├── scripts/
│   ├── audit-language.js   # Automated test: validates 100% English compliance
│   └── test-api.js         # End-to-end backend and game simulation tests
├── BOT_SETUP_GUIDE.md      # Step-by-step BotFather setup guide in English
└── package.json
```

---

## 🏁 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Add your `TELEGRAM_BOT_TOKEN` from @BotFather. If left empty, the platform runs in web simulation mode.)*

### 3. Run Automated Tests
```bash
# Run backend and game logic tests
npm test

# Run language compliance audit
npm run audit:language
```

### 4. Start Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser to experience the Telegram Mini App.
