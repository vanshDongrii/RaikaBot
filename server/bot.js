/**
 * Raika Telegram Bot - 100% English-Only Implementation
 * Handles all commands, inline keyboards, referral deep-links, and BotFather configurations.
 */

const { Telegraf, Markup } = require('telegraf');
const strings = require('./locales/en');
const db = require('./db');

function createBot(token, webAppUrl = '') {
  if (!token) {
    console.log('[Raika Bot] No TELEGRAM_BOT_TOKEN provided. Running in simulation & web-only mode.');
    return null;
  }

  const bot = new Telegraf(token);

  // Helper to format string templates
  function format(template, vars = {}) {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] !== undefined ? vars[key] : '');
  }

  // Common main inline keyboard
  function getMainMenuKeyboard(userId) {
    const isHttps = Boolean(webAppUrl && webAppUrl.startsWith('https://'));
    const miniAppButton = isHttps
      ? Markup.button.webApp(strings.buttons.launchMiniApp, `${webAppUrl}?userId=${userId}`)
      : Markup.button.callback(strings.buttons.launchMiniApp, 'open_miniapp_info');

    return Markup.inlineKeyboard([
      [miniAppButton],
      [
        Markup.button.callback(strings.buttons.playGames, 'cmd_play'),
        Markup.button.callback(strings.buttons.dailyBonus, 'cmd_bonus')
      ],
      [
        Markup.button.callback(strings.buttons.cashier, 'cmd_cashier'),
        Markup.button.callback(strings.buttons.deposit, 'cmd_deposit')
      ],
      [
        Markup.button.callback(strings.buttons.leaderboard, 'cmd_top'),
        Markup.button.callback(strings.buttons.myProfile, 'cmd_profile')
      ],
      [
        Markup.button.callback(strings.buttons.demoBalance, 'cmd_balance'),
        Markup.button.callback(strings.buttons.inviteFriends, 'cmd_referral')
      ],
      [
        Markup.button.callback(strings.buttons.gameHistory, 'cmd_matches'),
        Markup.button.callback(strings.buttons.help, 'cmd_help')
      ]
    ]);
  }

  // /start command
  bot.command('start', (ctx) => {
    const tgUser = ctx.from;
    const user = db.getOrCreateUser(tgUser);

    // Check for referral parameter in /start ref_xyz
    const startPayload = ctx.message && ctx.message.text ? ctx.message.text.split(' ')[1] : null;
    if (startPayload && startPayload.startsWith('ref_')) {
      const refResult = db.applyReferral(user.id, startPayload);
      if (refResult.success) {
        ctx.reply(`🎉 You joined via referral from ${refResult.referrerName}! +${refResult.bonus} Demo Coins added to your balance.`);
      }
    }

    const text = format(strings.messages.welcome, {
      balance: user.demo_balance.toLocaleString()
    });

    return ctx.replyWithMarkdown(text, getMainMenuKeyboard(user.id));
  });

  // /play command
  bot.command('play', (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const isHttps = Boolean(webAppUrl && webAppUrl.startsWith('https://'));
    const miniAppUrl = isHttps ? `${webAppUrl}?userId=${user.id}&tab=games` : '';
    
    const keyboard = Markup.inlineKeyboard([
      ...(miniAppUrl ? [[Markup.button.webApp('🚀 Launch Mini App to Play', miniAppUrl)]] : []),
      [
        Markup.button.callback('🪙 Coin Flip', 'game_coinflip'),
        Markup.button.callback('🎲 Dice Roll', 'game_dice')
      ],
      [
        Markup.button.callback('🚀 Crash Rocket', 'game_crash'),
        Markup.button.callback('💎 Mines', 'game_mines')
      ],
      [
        Markup.button.callback('🎡 Lucky Wheel', 'game_wheel')
      ],
      [
        Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')
      ]
    ]);

    return ctx.replyWithMarkdown(strings.messages.play, keyboard);
  });

  // /profile command
  bot.command('profile', (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const rank = db.getUserRank(user.id);
    const winRate = user.total_games > 0 ? Math.round((user.games_won / user.total_games) * 100) : 0;

    const text = format(strings.messages.profile, {
      name: user.first_name,
      id: user.id,
      balance: user.demo_balance.toLocaleString(),
      rank,
      totalGames: user.total_games,
      gamesWon: user.games_won,
      winRate,
      totalWon: user.total_won.toLocaleString(),
      referrals: user.referrals_count
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(strings.buttons.freeRefill, 'action_refill')],
      [Markup.button.callback(strings.buttons.gameHistory, 'cmd_matches')],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);

    return ctx.replyWithMarkdown(text, keyboard);
  });

  // /balance command
  bot.command('balance', (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const status = user.demo_balance < 100 ? '⚠️ Low balance (Refill available!)' : '✅ Healthy balance';

    const text = format(strings.messages.balance, {
      balance: user.demo_balance.toLocaleString(),
      status
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(strings.buttons.freeRefill, 'action_refill')],
      [Markup.button.callback(strings.buttons.dailyBonus, 'cmd_bonus')],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);

    return ctx.replyWithMarkdown(text, keyboard);
  });

  // /bonus command
  bot.command('bonus', (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const result = db.claimDailyBonus(user.id);

    if (result.success) {
      const text = format(strings.messages.bonusSuccess, {
        amount: result.amount,
        streak: result.streak,
        balance: result.balance.toLocaleString()
      });
      return ctx.replyWithMarkdown(text, getMainMenuKeyboard(user.id));
    } else {
      const text = format(strings.messages.bonusAlreadyClaimed, {
        streak: result.streak,
        timeLeft: result.timeLeft
      });
      return ctx.replyWithMarkdown(text, getMainMenuKeyboard(user.id));
    }
  });

  // /top (Leaderboard) command
  bot.command('top', (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const leaderboard = db.getLeaderboard(10);
    const userRank = db.getUserRank(user.id);

    let rankingList = '';
    if (leaderboard.length === 0) {
      rankingList = strings.messages.emptyLeaderboard;
    } else {
      rankingList = leaderboard.map((p) => {
        const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`;
        return `${medal} *${p.name}* — ${p.total_won.toLocaleString()} Coins (${p.win_rate}% win)`;
      }).join('\n');
    }

    const text = format(strings.messages.leaderboardHeader, {
      rankingList,
      userRank,
      userWinnings: (user.total_won || 0).toLocaleString()
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(strings.buttons.playGames, 'cmd_play')],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);

    return ctx.replyWithMarkdown(text, keyboard);
  });

  // /matches command
  bot.command('matches', (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const matches = db.getUserMatches(user.id, 5);

    if (matches.length === 0) {
      return ctx.replyWithMarkdown(strings.messages.noMatches, getMainMenuKeyboard(user.id));
    }

    const matchesList = matches.map((m) => {
      const icon = m.outcome === 'win' ? '🟢 WIN' : '🔴 LOSS';
      const profitFormatted = m.profit >= 0 ? `+${m.profit}` : `${m.profit}`;
      return `• *${m.game_type.toUpperCase()}* | ${icon} | Stake: ${m.stake} | Profit: ${profitFormatted} Coins (${m.multiplier}x)`;
    }).join('\n');

    const text = format(strings.messages.matchesHeader, {
      count: matches.length,
      matchesList
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(strings.buttons.playGames, 'cmd_play')],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);

    return ctx.replyWithMarkdown(text, keyboard);
  });

  // /cashier command
  bot.command('cashier', (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const summary = db.getCashierSummary(user.id);

    const text = format(strings.messages.cashierInfo, {
      balance: summary.balance.toLocaleString(),
      fiatVal: summary.fiatValue.toFixed(2),
      totalDeposited: summary.totalDeposited.toLocaleString(),
      totalWithdrawn: summary.totalWithdrawn.toLocaleString()
    });

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('💳 Deposit Simulation', 'cmd_deposit'),
        Markup.button.callback('💸 Withdraw Simulation', 'cmd_withdraw')
      ],
      [
        Markup.button.callback(strings.buttons.transactions, 'cmd_transactions'),
        Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')
      ]
    ]);

    return ctx.replyWithMarkdown(text, keyboard);
  });

  // /deposit command
  bot.command('deposit', (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const addrs = db.getUserDepositAddresses(user.id);

    const text = format(strings.messages.depositInfo, {
      address: addrs.USDT_TRC20
    });

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('💵 +$10 (1,000 Coins)', 'quick_dep_10'),
        Markup.button.callback('💵 +$25 (2,500 Coins)', 'quick_dep_25')
      ],
      [
        Markup.button.callback('💵 +$50 (5,000 Coins)', 'quick_dep_50'),
        Markup.button.callback('💎 +$100 (10,500 Coins)', 'quick_dep_100')
      ],
      [
        Markup.button.callback(strings.buttons.cashier, 'cmd_cashier'),
        Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')
      ]
    ]);

    return ctx.replyWithMarkdown(text, keyboard);
  });

  // /withdraw command
  bot.command('withdraw', (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const fiatVal = (user.demo_balance / 100).toFixed(2);

    if (user.demo_balance < 1000) {
      const text = format(strings.messages.withdrawInsufficient, {
        minWithdrawal: '1,000',
        balance: user.demo_balance.toLocaleString()
      });
      return ctx.replyWithMarkdown(text, Markup.inlineKeyboard([[Markup.button.callback('💳 Deposit Simulation', 'cmd_deposit')]]));
    }

    const text = format(strings.messages.withdrawInfo, {
      balance: user.demo_balance.toLocaleString(),
      fiatVal
    });

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('📤 Withdraw 1,000 Coins ($10)', 'quick_wth_1000'),
        Markup.button.callback('📤 Withdraw 2,500 Coins ($25)', 'quick_wth_2500')
      ],
      [
        Markup.button.callback('📤 Withdraw 5,000 Coins ($50)', 'quick_wth_5000')
      ],
      [
        Markup.button.callback(strings.buttons.cashier, 'cmd_cashier'),
        Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')
      ]
    ]);

    return ctx.replyWithMarkdown(text, keyboard);
  });

  // /settings command
  bot.command('settings', (ctx) => {
    const text = format(strings.messages.settings, {
      soundStatus: 'Enabled (Web Audio)',
      hapticStatus: 'Enabled (Vibration)',
      animStatus: 'Smooth Turbo'
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);

    return ctx.replyWithMarkdown(text, keyboard);
  });

  // /help command
  bot.command('help', (ctx) => {
    return ctx.replyWithMarkdown(strings.messages.help, getMainMenuKeyboard(ctx.from.id));
  });

  // Callback query handlers
  bot.action('cmd_start', (ctx) => {
    ctx.answerCbQuery();
    const user = db.getOrCreateUser(ctx.from);
    const text = format(strings.messages.welcome, {
      balance: user.demo_balance.toLocaleString()
    });
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...getMainMenuKeyboard(user.id) });
  });

  bot.action('cmd_play', (ctx) => {
    ctx.answerCbQuery();
    const user = db.getOrCreateUser(ctx.from);
    const isHttps = Boolean(webAppUrl && webAppUrl.startsWith('https://'));
    const miniAppUrl = isHttps ? `${webAppUrl}?userId=${user.id}&tab=games` : '';
    const keyboard = Markup.inlineKeyboard([
      ...(miniAppUrl ? [[Markup.button.webApp('🚀 Launch Mini App to Play', miniAppUrl)]] : []),
      [
        Markup.button.callback('🪙 Coin Flip', 'game_coinflip'),
        Markup.button.callback('🎲 Dice Roll', 'game_dice')
      ],
      [
        Markup.button.callback('🚀 Crash Rocket', 'game_crash'),
        Markup.button.callback('💎 Mines', 'game_mines')
      ],
      [
        Markup.button.callback('🎡 Lucky Wheel', 'game_wheel')
      ],
      [
        Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')
      ]
    ]);
    return ctx.editMessageText(strings.messages.play, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('cmd_profile', (ctx) => {
    ctx.answerCbQuery();
    const user = db.getOrCreateUser(ctx.from);
    const rank = db.getUserRank(user.id);
    const winRate = user.total_games > 0 ? Math.round((user.games_won / user.total_games) * 100) : 0;

    const text = format(strings.messages.profile, {
      name: user.first_name,
      id: user.id,
      balance: user.demo_balance.toLocaleString(),
      rank,
      totalGames: user.total_games,
      gamesWon: user.games_won,
      winRate,
      totalWon: user.total_won.toLocaleString(),
      referrals: user.referrals_count
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(strings.buttons.freeRefill, 'action_refill')],
      [Markup.button.callback(strings.buttons.gameHistory, 'cmd_matches')],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('cmd_balance', (ctx) => {
    ctx.answerCbQuery();
    const user = db.getOrCreateUser(ctx.from);
    const status = user.demo_balance < 100 ? '⚠️ Low balance (Refill available!)' : '✅ Healthy balance';

    const text = format(strings.messages.balance, {
      balance: user.demo_balance.toLocaleString(),
      status
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(strings.buttons.freeRefill, 'action_refill')],
      [Markup.button.callback(strings.buttons.dailyBonus, 'cmd_bonus')],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('cmd_bonus', (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const result = db.claimDailyBonus(user.id);

    if (result.success) {
      ctx.answerCbQuery('Bonus claimed!');
      const text = format(strings.messages.bonusSuccess, {
        amount: result.amount,
        streak: result.streak,
        balance: result.balance.toLocaleString()
      });
      return ctx.editMessageText(text, { parse_mode: 'Markdown', ...getMainMenuKeyboard(user.id) });
    } else {
      ctx.answerCbQuery('Already claimed today!');
      const text = format(strings.messages.bonusAlreadyClaimed, {
        streak: result.streak,
        timeLeft: result.timeLeft
      });
      return ctx.editMessageText(text, { parse_mode: 'Markdown', ...getMainMenuKeyboard(user.id) });
    }
  });

  bot.action('cmd_top', (ctx) => {
    ctx.answerCbQuery();
    const user = db.getOrCreateUser(ctx.from);
    const leaderboard = db.getLeaderboard(10);
    const userRank = db.getUserRank(user.id);

    const rankingList = leaderboard.map((p) => {
      const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`;
      return `${medal} *${p.name}* — ${p.total_won.toLocaleString()} Coins (${p.win_rate}% win)`;
    }).join('\n');

    const text = format(strings.messages.leaderboardHeader, {
      rankingList,
      userRank,
      userWinnings: (user.total_won || 0).toLocaleString()
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(strings.buttons.playGames, 'cmd_play')],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('cmd_matches', (ctx) => {
    ctx.answerCbQuery();
    const user = db.getOrCreateUser(ctx.from);
    const matches = db.getUserMatches(user.id, 5);

    if (matches.length === 0) {
      return ctx.editMessageText(strings.messages.noMatches, { parse_mode: 'Markdown', ...getMainMenuKeyboard(user.id) });
    }

    const matchesList = matches.map((m) => {
      const icon = m.outcome === 'win' ? '🟢 WIN' : '🔴 LOSS';
      const profitFormatted = m.profit >= 0 ? `+${m.profit}` : `${m.profit}`;
      return `• *${m.game_type.toUpperCase()}* | ${icon} | Stake: ${m.stake} | Profit: ${profitFormatted} Coins (${m.multiplier}x)`;
    }).join('\n');

    const text = format(strings.messages.matchesHeader, {
      count: matches.length,
      matchesList
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(strings.buttons.playGames, 'cmd_play')],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('cmd_referral', (ctx) => {
    ctx.answerCbQuery();
    const user = db.getOrCreateUser(ctx.from);
    const botUsername = ctx.botInfo && ctx.botInfo.username ? ctx.botInfo.username : 'raika_bot';
    const referralLink = `https://t.me/${botUsername}?start=${user.referral_code}`;

    const text = format(strings.messages.referral, {
      referralLink
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url(strings.buttons.shareReferral, `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on Raika and get +500 free Demo Coins to play games!')}`)],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('action_refill', (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const result = db.refillBalance(user.id);

    if (result.success) {
      ctx.answerCbQuery('Refilled +500 Demo Coins!');
      const text = format(strings.messages.refillSuccess, {
        balance: result.balance.toLocaleString()
      });
      return ctx.editMessageText(text, { parse_mode: 'Markdown', ...getMainMenuKeyboard(user.id) });
    } else {
      ctx.answerCbQuery('Balance not eligible for refill');
      const text = format(strings.messages.refillNotEligible, {
        balance: result.balance.toLocaleString()
      });
      return ctx.editMessageText(text, { parse_mode: 'Markdown', ...getMainMenuKeyboard(user.id) });
    }
  });

  bot.action('cmd_help', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText(strings.messages.help, { parse_mode: 'Markdown', ...getMainMenuKeyboard(ctx.from.id) });
  });

  bot.action('open_miniapp_info', (ctx) => {
    ctx.answerCbQuery();
    return ctx.reply('🎮 To open the Telegram Mini App inside Telegram, set up an HTTPS URL (such as ngrok or Cloudflare tunnel) in your .env file.\n\nYou can also play directly via the chat buttons below or open http://localhost:3000 in your browser!');
  });

  // Direct game quick triggers via bot
  bot.action('game_coinflip', (ctx) => {
    ctx.answerCbQuery();
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🪙 Flip 50 on Heads', 'quick_flip_heads_50'),
        Markup.button.callback('🪙 Flip 50 on Tails', 'quick_flip_tails_50')
      ],
      [
        Markup.button.callback('🪙 Flip 100 on Heads', 'quick_flip_heads_100'),
        Markup.button.callback('🪙 Flip 100 on Tails', 'quick_flip_tails_100')
      ],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_play')]
    ]);
    return ctx.editMessageText(`🪙 *Coin Flip Game*\n\nSelect your stake and side to flip instantly, or open the Mini App for 3D animations:`, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action(/quick_flip_(heads|tails)_(\d+)/, (ctx) => {
    const choice = ctx.match[1];
    const stake = parseInt(ctx.match[2], 10);
    const user = db.getOrCreateUser(ctx.from);

    if (user.demo_balance < stake) {
      ctx.answerCbQuery('Insufficient balance!');
      return ctx.reply(format(strings.messages.insufficientBalance, { balance: user.demo_balance }));
    }

    const { playCoinFlip } = require('./games');
    const outcome = playCoinFlip(stake, choice);
    db.recordMatch(user.id, outcome);

    ctx.answerCbQuery(outcome.outcome === 'win' ? 'You Won!' : 'You Lost!');

    const resultEmoji = outcome.outcome === 'win' ? '🎉 WIN!' : '💥 LOSS';
    const message = `🪙 *Coin Flip Result:*\n\n` +
      `Your Choice: *${choice.toUpperCase()}*\n` +
      `Landed On: *${outcome.landedSide.toUpperCase()}*\n` +
      `Outcome: *${resultEmoji}*\n` +
      `Profit: *${outcome.profit >= 0 ? '+' + outcome.profit : outcome.profit} Demo Coins*\n` +
      `New Balance: *${(user.demo_balance + outcome.profit).toLocaleString()} Demo Coins*`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Play Again', 'game_coinflip')],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);

    return ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard });
  });

  // Cashier & Simulation Action Handlers
  bot.action('cmd_cashier', (ctx) => {
    ctx.answerCbQuery();
    const user = db.getOrCreateUser(ctx.from);
    const summary = db.getCashierSummary(user.id);
    const text = format(strings.messages.cashierInfo, {
      balance: summary.balance.toLocaleString(),
      fiatVal: summary.fiatValue.toFixed(2),
      totalDeposited: summary.totalDeposited.toLocaleString(),
      totalWithdrawn: summary.totalWithdrawn.toLocaleString()
    });
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('💳 Deposit Simulation', 'cmd_deposit'),
        Markup.button.callback('💸 Withdraw Simulation', 'cmd_withdraw')
      ],
      [
        Markup.button.callback(strings.buttons.transactions, 'cmd_transactions'),
        Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')
      ]
    ]);
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('cmd_deposit', (ctx) => {
    ctx.answerCbQuery();
    const user = db.getOrCreateUser(ctx.from);
    const addrs = db.getUserDepositAddresses(user.id);
    const text = format(strings.messages.depositInfo, {
      address: addrs.USDT_TRC20
    });
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('💵 +$10 (1,000 Coins)', 'quick_dep_10'),
        Markup.button.callback('💵 +$25 (2,500 Coins)', 'quick_dep_25')
      ],
      [
        Markup.button.callback('💵 +$50 (5,000 Coins)', 'quick_dep_50'),
        Markup.button.callback('💎 +$100 (10,500 Coins)', 'quick_dep_100')
      ],
      [
        Markup.button.callback(strings.buttons.cashier, 'cmd_cashier'),
        Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')
      ]
    ]);
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('cmd_withdraw', (ctx) => {
    ctx.answerCbQuery();
    const user = db.getOrCreateUser(ctx.from);
    const fiatVal = (user.demo_balance / 100).toFixed(2);
    if (user.demo_balance < 1000) {
      const text = format(strings.messages.withdrawInsufficient, {
        minWithdrawal: '1,000',
        balance: user.demo_balance.toLocaleString()
      });
      return ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💳 Deposit Simulation', 'cmd_deposit')]]) });
    }
    const text = format(strings.messages.withdrawInfo, {
      balance: user.demo_balance.toLocaleString(),
      fiatVal
    });
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('📤 Withdraw 1,000 Coins ($10)', 'quick_wth_1000'),
        Markup.button.callback('📤 Withdraw 2,500 Coins ($25)', 'quick_wth_2500')
      ],
      [
        Markup.button.callback('📤 Withdraw 5,000 Coins ($50)', 'quick_wth_5000')
      ],
      [
        Markup.button.callback(strings.buttons.cashier, 'cmd_cashier'),
        Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')
      ]
    ]);
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action(/quick_dep_(\d+)/, (ctx) => {
    const usdtAmount = parseInt(ctx.match[1], 10);
    const user = db.getOrCreateUser(ctx.from);
    const res = db.createDeposit(user.id, { asset: 'USDT', usdtAmount });
    ctx.answerCbQuery(`+$${usdtAmount} USDT Deposited!`);
    const text = format(strings.messages.depositSuccess, {
      amount: res.transaction.coins_amount.toLocaleString(),
      cryptoAmount: `$${usdtAmount}`,
      asset: 'USDT',
      txHash: res.transaction.tx_hash.slice(0, 24) + '...',
      balance: res.newBalance.toLocaleString()
    });
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('💳 Deposit Again', 'cmd_deposit'),
        Markup.button.callback('🎲 Play Games', 'cmd_play')
      ],
      [
        Markup.button.callback(strings.buttons.cashier, 'cmd_cashier'),
        Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')
      ]
    ]);
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action(/quick_wth_(\d+)/, (ctx) => {
    const coinsAmount = parseInt(ctx.match[1], 10);
    const user = db.getOrCreateUser(ctx.from);
    const addrs = db.getUserDepositAddresses(user.id);
    const res = db.createWithdrawal(user.id, { asset: 'USDT', coinsAmount, destinationAddress: addrs.USDT_TRC20 });
    if (!res.success) {
      ctx.answerCbQuery('Withdrawal failed');
      return ctx.reply(res.error);
    }
    ctx.answerCbQuery('Withdrawal processed!');
    const text = format(strings.messages.withdrawSuccess, {
      amount: coinsAmount.toLocaleString(),
      fiatVal: (coinsAmount / 100).toFixed(2),
      asset: 'USDT (TRC-20)',
      address: addrs.USDT_TRC20.slice(0, 16) + '...',
      txHash: res.transaction.tx_hash.slice(0, 24) + '...',
      balance: res.newBalance.toLocaleString()
    });
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('💸 Withdraw Again', 'cmd_withdraw'),
        Markup.button.callback('🎲 Play Games', 'cmd_play')
      ],
      [
        Markup.button.callback(strings.buttons.cashier, 'cmd_cashier'),
        Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')
      ]
    ]);
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('cmd_transactions', (ctx) => {
    ctx.answerCbQuery();
    const user = db.getOrCreateUser(ctx.from);
    const txs = db.getUserTransactions(user.id, 6);
    if (txs.length === 0) {
      return ctx.editMessageText(strings.messages.noTransactions, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💳 Deposit Simulation', 'cmd_deposit')],
          [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
        ])
      });
    }
    const transactionsList = txs.map(t => {
      const icon = t.type === 'deposit' ? '🟢 DEP' : '🔴 WTH';
      const sign = t.type === 'deposit' ? '+' : '-';
      return `• ${icon} | *${sign}${t.coins_amount.toLocaleString()} Coins* (~$${t.fiat_amount} ${t.asset}) | \`${t.status.toUpperCase()}\``;
    }).join('\n');

    const text = format(strings.messages.transactionsHeader, { transactionsList });
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('💳 Deposit', 'cmd_deposit'),
        Markup.button.callback('💸 Withdraw', 'cmd_withdraw')
      ],
      [Markup.button.callback(strings.buttons.backToMenu, 'cmd_start')]
    ]);
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  return bot;
}

module.exports = {
  createBot
};
