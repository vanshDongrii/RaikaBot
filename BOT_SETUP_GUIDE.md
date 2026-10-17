# Telegram Bot Setup Guide (@BotFather) - 100% English-Only

This document provides the exact English commands, descriptions, and configurations to set up your Raika Telegram Bot using **@BotFather** on Telegram.

---

## 1. Create Bot & Get API Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Send `/newbot`.
3. Choose a name:
   ```text
   Raika Games
   ```
4. Choose a username ending in `bot` (e.g., `RaikaGamesBot` or `MyRaikaBot`).
5. Copy the HTTP API token provided by BotFather and paste it into your `.env` file:
   ```env
   TELEGRAM_BOT_TOKEN=1234567890:ABCDefGhIJKlmNoPQRsTUVwxyZ
   WEB_APP_URL=https://your-domain.com
   ```

---

## 2. Set Bot Description & About (English-Only)

### Set Description (`/setdescription`):
Send `/setdescription` to @BotFather, choose your bot, and send:
```text
Welcome to Raika Games! 🎮

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

All games use virtual demo coins for entertainment only. Enjoy playing!
```

### Set About Text (`/setabouttext`):
Send `/setabouttext` to @BotFather, choose your bot, and send:
```text
Play exciting demo games, win demo coins, and climb the leaderboard in English!
```

---

## 3. Configure Bot Command Menu (`/setcommands`)

Send `/setcommands` to @BotFather, choose your bot, and send the exact English list below:

```text
start - Welcome! Ready to play?
play - Choose a game to start playing
profile - Your Profile
balance - Your Demo Coin Balance
bonus - Claim Your Daily Bonus
top - Leaderboard
matches - Your Game History
settings - Settings
help - Here is how to use the bot
```

---

## 4. Configure Telegram Mini App Menu Button (`/setmenubutton`)

To enable the Web App button directly in the chat input bar:
1. Send `/setmenubutton` to @BotFather.
2. Select your bot.
3. Choose **"Configure menu button"**.
4. Enter the button text:
   ```text
   🚀 Launch Mini App
   ```
5. Enter your deployed Web App URL:
   ```text
   https://your-domain.com
   ```
*(For local testing, you can use ngrok or Cloudflare tunnel, e.g. `https://xxxx.ngrok-free.app`)*

---

## 5. Bot Commands Specification Reference

| Command | English Response | Action |
|---|---|---|
| `/start` | "Welcome! Ready to play?" | Shows welcome card, starting 1,000 demo balance, and inline action buttons. Supports `/start ref_xyz` referral deep links. |
| `/play` | "Choose a game to start playing." | Lists Coin Flip, Dice Roll, Crash Rocket, Mines, and Lucky Wheel with direct play triggers and Mini App launch. |
| `/profile` | "Your Profile" | Displays Player Name, User ID, Demo Coin Balance, Global Rank, Games Played, Win Rate, and Total Winnings. |
| `/balance` | "Your Demo Coin Balance" | Shows current balance, health status, and free refill option (+500 coins) if balance is below 100. |
| `/bonus` | "Claim Your Daily Bonus" | Claims Day 1–7 streak rewards with increasing demo coin rewards (100, 150, 220, 320, 450, 650, 1,000). Enforces 24h cooldown. |
| `/top` | "Leaderboard" | Displays top 10 global players ranked by total demo coin winnings and current user position. |
| `/matches` | "Your Game History" | Displays user's recent matches with stakes, multipliers, and profit outcomes. |
| `/settings` | "Settings" | Shows platform settings with English explicitly locked as the default and only language. |
| `/help` | "Here is how to use the bot." | Comprehensive guide explaining virtual demo coins, provably fair mechanics, and command usage. |
