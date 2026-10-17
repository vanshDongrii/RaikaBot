/**
 * Raika Telegram Mini App - Main Application Controller
 * 100% English-Only Implementation
 */

class AppController {
  constructor() {
    this.user = null;
    this.balance = 1000;
    this.activeTab = 'home';
    this.activeGame = null;
    this.gameInstances = {};
    this.liveTickerInterval = null;
  }

  async init() {
    // Extract user from Telegram WebApp or browser fallback
    const tgUser = window.TelegramService.getUser();
    
    // Sync with backend
    const syncRes = await window.API.syncUser(tgUser);
    if (syncRes.success && syncRes.user) {
      this.user = syncRes.user;
      this.balance = syncRes.user.demo_balance;
    } else {
      this.user = tgUser;
      this.balance = 1000;
    }

    this.updateUserHeader();
    this.bindNavigation();
    this.bindGlobalActions();
    this.startLiveTicker();

    // Check URL parameters for direct deep-link to tab or game
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get('tab') || 'home';
    const initialGame = params.get('game');

    if (initialGame) {
      this.switchTab('games');
      this.launchGame(initialGame);
    } else {
      this.switchTab(initialTab);
    }
  }

  updateUserHeader() {
    const nameEl = document.getElementById('user-display-name');
    const avatarEl = document.getElementById('user-avatar-initial');
    const balanceEl = document.getElementById('header-balance-amount');

    if (nameEl && this.user) {
      nameEl.textContent = this.user.first_name || 'Adventurer';
    }
    if (avatarEl && this.user) {
      avatarEl.textContent = (this.user.first_name || 'A').charAt(0).toUpperCase();
    }
    if (balanceEl) {
      balanceEl.textContent = this.balance.toLocaleString();
    }
  }

  updateBalance(newBalance) {
    const oldBalance = this.balance;
    this.balance = newBalance;
    const balanceEl = document.getElementById('header-balance-amount');
    
    if (balanceEl) {
      // Animate balance change
      balanceEl.textContent = newBalance.toLocaleString();
      balanceEl.classList.add('balance-highlight');
      setTimeout(() => balanceEl.classList.remove('balance-highlight'), 600);
    }
  }

  bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        if (tab) {
          window.SoundEffects.playClick();
          window.TelegramService.hapticImpact('light');
          this.switchTab(tab);
        }
      });
    });
  }

  bindGlobalActions() {
    // Cashier button in header
    const cashierBtn = document.getElementById('header-cashier-btn');
    if (cashierBtn) {
      cashierBtn.addEventListener('click', () => {
        window.SoundEffects.playClick();
        window.TelegramService.hapticImpact('light');
        this.switchTab('cashier');
      });
    }

    // Quick Refill button in header (if present)
    const topUpBtn = document.getElementById('header-topup-btn');
    if (topUpBtn) {
      topUpBtn.addEventListener('click', () => {
        window.SoundEffects.playClick();
        this.handleFreeRefill();
      });
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close-btn, .modal-backdrop, #btn-receipt-done').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-close-btn') || e.target.id === 'btn-receipt-done') {
          this.closeAllModals();
        }
      });
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update nav active classes
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Hide all view screens
    document.querySelectorAll('.app-screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // Show target view screen
    const targetScreen = document.getElementById(`screen-${tabName}`);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    // Tab-specific rendering
    if (tabName === 'home') {
      this.renderHome();
    } else if (tabName === 'games') {
      this.renderLobby();
    } else if (tabName === 'bonus') {
      this.renderBonusScreen();
    } else if (tabName === 'leaderboard') {
      this.renderLeaderboardScreen();
    } else if (tabName === 'history') {
      this.renderHistoryScreen();
    } else if (tabName === 'profile') {
      this.renderProfileScreen();
    } else if (tabName === 'settings') {
      this.renderSettingsScreen();
    } else if (tabName === 'cashier') {
      this.renderCashierScreen();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------------------------------------------------------------------------
  // SCREEN: HOME
  // ---------------------------------------------------------------------------
  renderHome() {
    const greetingEl = document.getElementById('home-greeting-text');
    if (greetingEl && this.user) {
      greetingEl.textContent = `${STRINGS.home.greeting} ${this.user.first_name}!`;
    }

    // Bind featured games cards on home screen
    document.querySelectorAll('#screen-home .game-card-action').forEach(card => {
      card.addEventListener('click', () => {
        const game = card.dataset.game;
        window.SoundEffects.playClick();
        window.TelegramService.hapticImpact('medium');
        this.switchTab('games');
        this.launchGame(game);
      });
    });

    // Home daily bonus banner click
    const homeBonusBtn = document.getElementById('home-claim-bonus-btn');
    if (homeBonusBtn) {
      homeBonusBtn.addEventListener('click', () => {
        window.SoundEffects.playClick();
        this.switchTab('bonus');
      });
    }

    // Home invite banner
    const homeInviteBtn = document.getElementById('home-invite-friends-btn');
    if (homeInviteBtn) {
      homeInviteBtn.addEventListener('click', () => {
        window.SoundEffects.playClick();
        this.openReferralModal();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // SCREEN: GAMES LOBBY
  // ---------------------------------------------------------------------------
  renderLobby() {
    const lobbyView = document.getElementById('lobby-view');
    const gamePlayView = document.getElementById('game-play-view');

    if (lobbyView) lobbyView.style.display = 'block';
    if (gamePlayView) gamePlayView.style.display = 'none';

    // Bind lobby cards
    document.querySelectorAll('#lobby-view .lobby-game-card').forEach(card => {
      card.onclick = () => {
        const game = card.dataset.game;
        window.SoundEffects.playClick();
        window.TelegramService.hapticImpact('medium');
        this.launchGame(game);
      };
    });
  }

  launchGame(gameKey) {
    this.activeGame = gameKey;
    const lobbyView = document.getElementById('lobby-view');
    const gamePlayView = document.getElementById('game-play-view');
    const container = document.getElementById('game-container-target');

    if (lobbyView) lobbyView.style.display = 'none';
    if (gamePlayView) gamePlayView.style.display = 'block';

    // Back button in game header
    const backBtn = document.getElementById('btn-back-to-lobby');
    if (backBtn) {
      backBtn.onclick = () => {
        window.SoundEffects.playClick();
        this.renderLobby();
      };
    }

    // Mount game instance
    if (gameKey === 'coinflip') {
      this.gameInstances.coinflip = new window.CoinFlipGame();
      this.gameInstances.coinflip.mount(container);
    } else if (gameKey === 'dice') {
      this.gameInstances.dice = new window.DiceGame();
      this.gameInstances.dice.mount(container);
    } else if (gameKey === 'crash') {
      this.gameInstances.crash = new window.CrashGame();
      this.gameInstances.crash.mount(container);
    } else if (gameKey === 'mines') {
      this.gameInstances.mines = new window.MinesGame();
      this.gameInstances.mines.mount(container);
    } else if (gameKey === 'wheel') {
      this.gameInstances.wheel = new window.WheelGame();
      this.gameInstances.wheel.mount(container);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------------------------------------------------------------------------
  // SCREEN: DAILY BONUS
  // ---------------------------------------------------------------------------
  async renderBonusScreen() {
    const container = document.getElementById('bonus-streak-calendar');
    const claimBtn = document.getElementById('btn-claim-daily-bonus');
    const streakText = document.getElementById('bonus-streak-status-text');
    const timerText = document.getElementById('bonus-timer-text');

    const streakRewards = [100, 150, 220, 320, 450, 650, 1000];
    const currentStreak = this.user ? (this.user.daily_streak || 0) : 0;

    if (streakText) {
      streakText.textContent = STRINGS.bonus.currentStreak.replace('{day}', currentStreak);
    }

    // Build 7-day calendar cards
    if (container) {
      let html = '';
      for (let day = 1; day <= 7; day++) {
        const reward = streakRewards[day - 1];
        const isPast = day < currentStreak;
        const isCurrent = day === currentStreak;
        const isFuture = day > currentStreak;

        let statusClass = isPast ? 'claimed' : isCurrent ? 'active pulse-glow' : 'locked';
        let badgeText = isPast ? STRINGS.common.claimed : isCurrent ? 'Today' : STRINGS.bonus.locked;

        html += `
          <div class="bonus-day-card ${statusClass}">
            <div class="day-number">Day ${day}</div>
            <div class="day-coin-icon">${day === 7 ? '🎁' : '🪙'}</div>
            <div class="day-reward-amount">+${reward}</div>
            <div class="day-status-pill">${badgeText}</div>
          </div>
        `;
      }
      container.innerHTML = html;
    }

    if (claimBtn) {
      claimBtn.onclick = async () => {
        window.SoundEffects.playClick();
        window.TelegramService.hapticImpact('heavy');
        claimBtn.disabled = true;

        try {
          const res = await window.API.claimDailyBonus(this.user.id);
          if (res.success) {
            this.updateBalance(res.balance);
            this.user.daily_streak = res.streak;
            window.SoundEffects.playWin();
            window.TelegramService.hapticNotification('success');
            window.showToast(STRINGS.bonus.claimSuccess.replace('{amount}', res.amount), 'success');
            this.renderBonusScreen();
          } else if (res.alreadyClaimed) {
            window.SoundEffects.playLoss();
            window.showToast(STRINGS.alerts.bonusAlreadyClaimed, 'info');
            if (timerText) {
              timerText.textContent = STRINGS.bonus.nextBonusTimer.replace('{time}', res.timeLeft);
            }
          } else {
            window.showToast(res.error || STRINGS.alerts.actionFailed, 'error');
          }
        } catch (e) {
          window.showToast(STRINGS.alerts.actionFailed, 'error');
        } finally {
          claimBtn.disabled = false;
        }
      };
    }
  }

  // ---------------------------------------------------------------------------
  // SCREEN: LEADERBOARD
  // ---------------------------------------------------------------------------
  async renderLeaderboardScreen() {
    const podiumContainer = document.getElementById('leaderboard-podium-target');
    const listContainer = document.getElementById('leaderboard-list-target');
    const userRankBanner = document.getElementById('leaderboard-user-rank-banner');

    try {
      const res = await window.API.getLeaderboard(this.user.id);
      if (!res.success) return;

      const players = res.leaderboard || [];

      // Top 3 Podium
      if (podiumContainer && players.length >= 3) {
        const first = players[0];
        const second = players[1];
        const third = players[2];

        podiumContainer.innerHTML = `
          <div class="podium-item podium-second">
            <div class="podium-rank-badge">🥈 2nd</div>
            <div class="podium-avatar">👤</div>
            <div class="podium-name">${second.name}</div>
            <div class="podium-winnings">${second.total_won.toLocaleString()} Coins</div>
            <div class="podium-bar height-second"></div>
          </div>
          <div class="podium-item podium-first">
            <div class="podium-crown">👑</div>
            <div class="podium-rank-badge">🥇 1st</div>
            <div class="podium-avatar first-avatar">👑</div>
            <div class="podium-name">${first.name}</div>
            <div class="podium-winnings">${first.total_won.toLocaleString()} Coins</div>
            <div class="podium-bar height-first"></div>
          </div>
          <div class="podium-item podium-third">
            <div class="podium-rank-badge">🥉 3rd</div>
            <div class="podium-avatar">👤</div>
            <div class="podium-name">${third.name}</div>
            <div class="podium-winnings">${third.total_won.toLocaleString()} Coins</div>
            <div class="podium-bar height-third"></div>
          </div>
        `;
      }

      // Rest of the ranks (4-10)
      if (listContainer) {
        const remaining = players.slice(3);
        if (remaining.length === 0) {
          listContainer.innerHTML = `<div class="empty-state">${STRINGS.leaderboard.emptyList}</div>`;
        } else {
          listContainer.innerHTML = remaining.map(p => `
            <div class="leaderboard-row ${p.id === this.user.id ? 'highlight-user' : ''}">
              <div class="lb-col-rank">#${p.rank}</div>
              <div class="lb-col-player">
                <span class="player-name">${p.name}</span>
                <span class="player-meta">${p.total_games} games • ${p.win_rate}% win</span>
              </div>
              <div class="lb-col-winnings">${p.total_won.toLocaleString()} Coins</div>
            </div>
          `).join('');
        }
      }

      if (userRankBanner && res.currentUser) {
        userRankBanner.textContent = STRINGS.leaderboard.yourRankBanner
          .replace('{rank}', res.currentUser.rank)
          .replace('{amount}', (res.currentUser.total_won || 0).toLocaleString());
      }
    } catch (e) {
      console.error(e);
    }
  }

  // ---------------------------------------------------------------------------
  // SCREEN: MATCH HISTORY
  // ---------------------------------------------------------------------------
  async renderHistoryScreen() {
    const listContainer = document.getElementById('history-list-target');
    const filterAll = document.getElementById('btn-history-filter-all');
    const filterWins = document.getElementById('btn-history-filter-wins');
    const filterLosses = document.getElementById('btn-history-filter-losses');

    let allMatches = [];

    const applyFilter = (filterType) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (filterType === 'all') filterAll.classList.add('active');
      if (filterType === 'wins') filterWins.classList.add('active');
      if (filterType === 'losses') filterLosses.classList.add('active');

      const filtered = allMatches.filter(m => {
        if (filterType === 'wins') return m.outcome === 'win';
        if (filterType === 'losses') return m.outcome === 'loss';
        return true;
      });

      if (filtered.length === 0) {
        listContainer.innerHTML = `<div class="empty-state">${STRINGS.history.emptyHistory}</div>`;
        return;
      }

      listContainer.innerHTML = filtered.map(m => {
        const isWin = m.outcome === 'win';
        const icon = m.game_type === 'coinflip' ? '🪙' : m.game_type === 'dice' ? '🎲' : m.game_type === 'crash' ? '🚀' : m.game_type === 'mines' ? '💎' : '🎡';
        const gameTitle = STRINGS.games[m.game_type] ? STRINGS.games[m.game_type].name : m.game_type.toUpperCase();
        const dateStr = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
          <div class="history-item-card ${isWin ? 'win-card' : 'loss-card'}">
            <div class="history-card-header">
              <span class="history-game-badge">${icon} ${gameTitle}</span>
              <span class="history-outcome-badge ${isWin ? 'badge-emerald' : 'badge-red'}">
                ${isWin ? 'WIN' : 'LOSS'}
              </span>
            </div>
            <div class="history-card-body">
              <div class="history-detail-row">
                <span>${STRINGS.history.stakeLabel} <strong>${m.stake} Coins</strong></span>
                <span>${STRINGS.history.payoutLabel} <strong>${m.payout} Coins</strong></span>
                <span>${STRINGS.history.profitLabel} <strong class="${isWin ? 'text-emerald' : 'text-red'}">${m.profit >= 0 ? '+' + m.profit : m.profit}</strong></span>
              </div>
              <div class="history-card-footer">
                <span class="history-date">${dateStr}</span>
                <span class="history-mult">${m.multiplier}x</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    filterAll.onclick = () => applyFilter('all');
    filterWins.onclick = () => applyFilter('wins');
    filterLosses.onclick = () => applyFilter('losses');

    try {
      const res = await window.API.getHistory(this.user.id);
      if (res.success) {
        allMatches = res.matches || [];
        applyFilter('all');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // ---------------------------------------------------------------------------
  // SCREEN: PROFILE
  // ---------------------------------------------------------------------------
  async renderProfileScreen() {
    const nameEl = document.getElementById('profile-player-name');
    const idEl = document.getElementById('profile-user-id');
    const balanceEl = document.getElementById('profile-demo-balance');
    const refillBtn = document.getElementById('btn-profile-refill');

    const statGames = document.getElementById('stat-total-games');
    const statWins = document.getElementById('stat-games-won');
    const statWinRate = document.getElementById('stat-win-rate');
    const statWon = document.getElementById('stat-total-won');
    const statMultiplier = document.getElementById('stat-best-multiplier');

    if (nameEl) nameEl.textContent = this.user.first_name || 'Adventurer';
    if (idEl) idEl.textContent = `ID: ${this.user.id}`;
    if (balanceEl) balanceEl.textContent = `${this.balance.toLocaleString()} Demo Coins`;

    // Fetch fresh stats
    try {
      const res = await window.API.getUser(this.user.id);
      if (res.success && res.user) {
        const u = res.user;
        this.user = u;
        if (statGames) statGames.textContent = u.total_games;
        if (statWins) statWins.textContent = u.games_won;
        if (statWinRate) statWinRate.textContent = `${u.winRate}%`;
        if (statWon) statWon.textContent = `${u.total_won.toLocaleString()} Coins`;
        if (statMultiplier) statMultiplier.textContent = `${(u.best_multiplier || 1.0).toFixed(2)}x`;
      }
    } catch (e) {
      console.error(e);
    }

    if (refillBtn) {
      refillBtn.onclick = () => this.handleFreeRefill();
    }

    // Profile invite friends button
    const inviteBtn = document.getElementById('profile-invite-btn');
    if (inviteBtn) {
      inviteBtn.onclick = () => this.openReferralModal();
    }
  }

  // ---------------------------------------------------------------------------
  // SCREEN: SETTINGS
  // ---------------------------------------------------------------------------
  renderSettingsScreen() {
    const audioToggle = document.getElementById('setting-toggle-audio');
    const hapticToggle = document.getElementById('setting-toggle-haptics');
    const simToggle = document.getElementById('setting-toggle-simulator');
    const resetBtn = document.getElementById('btn-reset-demo-data');

    if (audioToggle) {
      audioToggle.checked = window.SoundEffects.enabled;
      audioToggle.onchange = () => {
        window.SoundEffects.setEnabled(audioToggle.checked);
        window.showToast(`Sound Effects: ${audioToggle.checked ? 'Enabled' : 'Disabled'}`, 'info');
      };
    }

    if (hapticToggle) {
      hapticToggle.checked = window.TelegramService.hapticsEnabled;
      hapticToggle.onchange = () => {
        window.TelegramService.setHapticsEnabled(hapticToggle.checked);
        window.showToast(`Haptics: ${hapticToggle.checked ? 'Enabled' : 'Disabled'}`, 'info');
      };
    }

    if (simToggle) {
      const isSim = document.body.classList.contains('telegram-simulator-mode');
      simToggle.checked = isSim;
      simToggle.onchange = () => {
        document.body.classList.toggle('telegram-simulator-mode', simToggle.checked);
        window.showToast(`Simulator View: ${simToggle.checked ? 'Active' : 'Full Window'}`, 'info');
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm('Are you sure you want to restore demo starting coins and preferences?')) {
          this.updateBalance(1000);
          window.showToast('Demo data restored to 1,000 Demo Coins.', 'success');
        }
      };
    }
  }

  // ---------------------------------------------------------------------------
  // SCREEN: CASHIER & WALLET (SIMULATION)
  // ---------------------------------------------------------------------------
  async renderCashierScreen() {
    let selectedDepositAsset = 'USDT';
    let selectedWithdrawAsset = 'USDT';
    let cachedCashierInfo = null;
    let allTransactions = [];

    // DOM Elements
    const balanceNum = document.getElementById('cashier-balance-num');
    const fiatNum = document.getElementById('cashier-fiat-num');
    const totalDepNum = document.getElementById('cashier-total-dep');
    const totalWthNum = document.getElementById('cashier-total-wth');

    const tabDepositBtn = document.getElementById('btn-cashier-tab-deposit');
    const tabWithdrawBtn = document.getElementById('btn-cashier-tab-withdraw');
    const tabTransactionsBtn = document.getElementById('btn-cashier-tab-transactions');

    const viewDeposit = document.getElementById('cashier-view-deposit');
    const viewWithdraw = document.getElementById('cashier-view-withdraw');
    const viewTransactions = document.getElementById('cashier-view-transactions');

    const depAddressInput = document.getElementById('cashier-deposit-address');
    const copyDepAddrBtn = document.getElementById('btn-copy-deposit-addr');
    const customDepInput = document.getElementById('cashier-custom-dep-input');
    const customDepPreview = document.getElementById('deposit-custom-coins-preview');
    const simulateDepBtn = document.getElementById('btn-simulate-deposit');

    const withdrawAddressInput = document.getElementById('cashier-withdraw-address');
    const withdrawAmountInput = document.getElementById('cashier-withdraw-amount');
    const withdrawFiatPreview = document.getElementById('withdraw-fiat-preview');
    const simulateWithdrawBtn = document.getElementById('btn-simulate-withdraw');

    // Sub-Tab Switcher
    const switchCashierTab = (tab) => {
      [tabDepositBtn, tabWithdrawBtn, tabTransactionsBtn].forEach(b => b.classList.remove('active'));
      [viewDeposit, viewWithdraw, viewTransactions].forEach(v => v.style.display = 'none');

      if (tab === 'deposit') {
        tabDepositBtn.classList.add('active');
        viewDeposit.style.display = 'block';
      } else if (tab === 'withdraw') {
        tabWithdrawBtn.classList.add('active');
        viewWithdraw.style.display = 'block';
      } else if (tab === 'transactions') {
        tabTransactionsBtn.classList.add('active');
        viewTransactions.style.display = 'block';
        loadTransactions();
      }
    };

    if (tabDepositBtn) tabDepositBtn.onclick = () => switchCashierTab('deposit');
    if (tabWithdrawBtn) tabWithdrawBtn.onclick = () => switchCashierTab('withdraw');
    if (tabTransactionsBtn) tabTransactionsBtn.onclick = () => switchCashierTab('transactions');

    // Fetch Cashier Data
    try {
      const res = await window.API.getCashierInfo(this.user.id);
      if (res.success) {
        cachedCashierInfo = res;
        if (balanceNum) balanceNum.textContent = res.balance.toLocaleString();
        if (fiatNum) fiatNum.textContent = res.fiatValue.toFixed(2);
        if (totalDepNum) totalDepNum.textContent = `${res.totalDeposited.toLocaleString()} Coins`;
        if (totalWthNum) totalWthNum.textContent = `${res.totalWithdrawn.toLocaleString()} Coins`;

        if (depAddressInput && res.depositAddresses) {
          depAddressInput.value = res.depositAddresses.USDT_TRC20;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Asset Selector for Deposit
    const updateDepositAddress = () => {
      if (!cachedCashierInfo || !cachedCashierInfo.depositAddresses) return;
      if (selectedDepositAsset === 'USDT') {
        depAddressInput.value = cachedCashierInfo.depositAddresses.USDT_TRC20;
      } else if (selectedDepositAsset === 'TON') {
        depAddressInput.value = cachedCashierInfo.depositAddresses.TON;
      } else if (selectedDepositAsset === 'BTC') {
        depAddressInput.value = cachedCashierInfo.depositAddresses.BTC;
      }
    };

    ['btn-asset-usdt', 'btn-asset-ton', 'btn-asset-btc'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.onclick = () => {
          document.querySelectorAll('#cashier-view-deposit .side-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedDepositAsset = btn.dataset.asset;
          window.SoundEffects.playClick();
          updateDepositAddress();
        };
      }
    });

    // Copy Address Button
    if (copyDepAddrBtn) {
      copyDepAddrBtn.onclick = () => {
        navigator.clipboard.writeText(depAddressInput.value);
        window.SoundEffects.playClick();
        window.TelegramService.hapticNotification('success');
        window.showToast(STRINGS.alerts.copiedSuccess, 'success');
      };
    }

    // Preset Deposit Packages
    document.querySelectorAll('.cashier-dep-package').forEach(pkg => {
      pkg.onclick = () => {
        const amt = parseInt(pkg.dataset.amount, 10);
        if (customDepInput) {
          customDepInput.value = amt;
          updateCustomDepositPreview(amt);
        }
        window.SoundEffects.playClick();
      };
    });

    // Custom Deposit Preview
    const updateCustomDepositPreview = (amt) => {
      const coins = amt * 100;
      const bonus = amt >= 100 ? Math.floor(coins * 0.05) : 0;
      if (customDepPreview) {
        customDepPreview.textContent = `Coins: +${(coins + bonus).toLocaleString()}${bonus > 0 ? ' (Includes +5% Bonus!)' : ''}`;
      }
    };

    if (customDepInput) {
      customDepInput.oninput = (e) => {
        const amt = Math.max(1, parseInt(e.target.value, 10) || 1);
        updateCustomDepositPreview(amt);
      };
    }

    // Execute Deposit Simulation
    if (simulateDepBtn) {
      simulateDepBtn.onclick = async () => {
        const amt = parseInt(customDepInput ? customDepInput.value : 10, 10);
        window.SoundEffects.playClick();
        window.TelegramService.hapticImpact('heavy');
        simulateDepBtn.disabled = true;
        simulateDepBtn.querySelector('span').textContent = 'Processing Blockchain Simulation...';

        try {
          const res = await window.API.simulateDeposit(this.user.id, selectedDepositAsset, amt);
          if (res.success) {
            this.updateBalance(res.newBalance);
            if (balanceNum) balanceNum.textContent = res.newBalance.toLocaleString();
            if (fiatNum) fiatNum.textContent = (res.newBalance / 100).toFixed(2);
            if (totalDepNum && res.totalDeposited !== undefined) {
              totalDepNum.textContent = `${res.totalDeposited.toLocaleString()} Coins`;
            }
            window.SoundEffects.playCashout();
            window.TelegramService.hapticNotification('success');
            this.showReceiptModal(res.transaction);
            window.showToast(`Deposit confirmed! +${res.transaction.coins_amount.toLocaleString()} Coins credited.`, 'success');
          } else {
            window.showToast(res.error || STRINGS.alerts.actionFailed, 'error');
          }
        } catch (e) {
          window.showToast(STRINGS.alerts.actionFailed, 'error');
        } finally {
          simulateDepBtn.disabled = false;
          simulateDepBtn.querySelector('span').textContent = 'Simulate Deposit Transfer';
        }
      };
    }

    // Withdrawal Section Handlers
    ['btn-wth-asset-usdt', 'btn-wth-asset-ton'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.onclick = () => {
          document.querySelectorAll('#cashier-view-withdraw .side-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedWithdrawAsset = btn.dataset.asset;
          window.SoundEffects.playClick();
        };
      }
    });

    const updateWithdrawPreview = (coins) => {
      if (withdrawFiatPreview) {
        withdrawFiatPreview.textContent = `Estimated Value: ~$${(coins / 100).toFixed(2)} USD`;
      }
    };

    if (withdrawAmountInput) {
      withdrawAmountInput.oninput = (e) => {
        const coins = parseInt(e.target.value, 10) || 0;
        updateWithdrawPreview(coins);
      };
    }

    // Percentage chips
    const setWithdrawAmount = (coins) => {
      if (withdrawAmountInput) {
        withdrawAmountInput.value = Math.max(0, Math.floor(coins));
        updateWithdrawPreview(withdrawAmountInput.value);
      }
    };

    const pct25 = document.getElementById('btn-wth-pct-25');
    const pct50 = document.getElementById('btn-wth-pct-50');
    const pct75 = document.getElementById('btn-wth-pct-75');
    const pctMax = document.getElementById('btn-wth-pct-max');

    if (pct25) pct25.onclick = () => setWithdrawAmount(this.balance * 0.25);
    if (pct50) pct50.onclick = () => setWithdrawAmount(this.balance * 0.50);
    if (pct75) pct75.onclick = () => setWithdrawAmount(this.balance * 0.75);
    if (pctMax) pctMax.onclick = () => setWithdrawAmount(this.balance);

    // Execute Withdrawal Simulation
    if (simulateWithdrawBtn) {
      simulateWithdrawBtn.onclick = async () => {
        const coins = parseInt(withdrawAmountInput ? withdrawAmountInput.value : 1000, 10);
        const addr = withdrawAddressInput ? withdrawAddressInput.value.trim() : '';

        if (!addr || addr.length < 15) {
          window.showToast(STRINGS.alerts.withdrawInvalidAddress, 'warning');
          return;
        }

        if (coins < 1000) {
          window.showToast(STRINGS.alerts.withdrawMinError, 'warning');
          return;
        }

        if (coins > this.balance) {
          window.showToast(STRINGS.alerts.insufficientCoins.replace('{balance}', this.balance.toLocaleString()), 'error');
          return;
        }

        simulateWithdrawBtn.disabled = true;
        simulateWithdrawBtn.querySelector('span').textContent = 'Broadcasting Withdrawal...';
        window.SoundEffects.playClick();

        try {
          const res = await window.API.simulateWithdraw(this.user.id, selectedWithdrawAsset, coins, addr);
          if (res.success) {
            this.updateBalance(res.newBalance);
            if (balanceNum) balanceNum.textContent = res.newBalance.toLocaleString();
            if (fiatNum) fiatNum.textContent = (res.newBalance / 100).toFixed(2);
            if (totalWthNum && res.totalWithdrawn !== undefined) {
              totalWthNum.textContent = `${res.totalWithdrawn.toLocaleString()} Coins`;
            }
            window.SoundEffects.playCashout();
            window.TelegramService.hapticNotification('success');
            this.showReceiptModal(res.transaction);
            window.showToast(`Withdrawal of ${coins.toLocaleString()} Coins processed successfully!`, 'success');
          } else {
            window.showToast(res.error || STRINGS.alerts.actionFailed, 'error');
          }
        } catch (e) {
          window.showToast(STRINGS.alerts.actionFailed, 'error');
        } finally {
          simulateWithdrawBtn.disabled = false;
          simulateWithdrawBtn.querySelector('span').textContent = 'Submit Simulated Withdrawal';
        }
      };
    }

    // Load Transactions Ledger
    const loadTransactions = async (filterType = 'all') => {
      const listEl = document.getElementById('cashier-transactions-list');
      if (!listEl) return;

      try {
        const res = await window.API.getCashierTransactions(this.user.id);
        if (res.success) {
          allTransactions = res.transactions || [];
          renderTransactionsList(filterType);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const renderTransactionsList = (filterType = 'all') => {
      const listEl = document.getElementById('cashier-transactions-list');
      if (!listEl) return;

      const filtered = allTransactions.filter(t => {
        if (filterType === 'dep') return t.type === 'deposit';
        if (filterType === 'wth') return t.type === 'withdrawal';
        return true;
      });

      if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-state">${STRINGS.cashier.transactions.empty}</div>`;
        return;
      }

      listEl.innerHTML = filtered.map(t => {
        const isDep = t.type === 'deposit';
        const dateStr = new Date(t.created_at).toLocaleString();
        return `
          <div class="history-item-card ${isDep ? 'win-card' : 'loss-card'}">
            <div class="history-card-header">
              <span class="history-game-badge">${isDep ? '📥 Deposit' : '📤 Withdrawal'} (${t.asset})</span>
              <span class="history-outcome-badge ${isDep ? 'badge-emerald' : 'badge-purple'}">
                ${t.status.toUpperCase()}
              </span>
            </div>
            <div class="history-card-body">
              <div class="history-detail-row">
                <span>Amount: <strong class="${isDep ? 'text-emerald' : 'text-purple'}">${isDep ? '+' : '-'}${t.coins_amount.toLocaleString()} Coins</strong></span>
                <span>Fiat Value: <strong>$${t.fiat_amount.toFixed(2)} USD</strong></span>
              </div>
              <div class="history-card-footer">
                <span class="history-date">${dateStr}</span>
                <span class="history-mult" style="font-family: monospace; font-size: 9px;">${t.tx_hash.slice(0, 16)}...</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    const btnTxAll = document.getElementById('btn-tx-filter-all');
    const btnTxDep = document.getElementById('btn-tx-filter-dep');
    const btnTxWth = document.getElementById('btn-tx-filter-wth');

    if (btnTxAll) btnTxAll.onclick = () => {
      [btnTxAll, btnTxDep, btnTxWth].forEach(b => b.classList.remove('active'));
      btnTxAll.classList.add('active');
      renderTransactionsList('all');
    };
    if (btnTxDep) btnTxDep.onclick = () => {
      [btnTxAll, btnTxDep, btnTxWth].forEach(b => b.classList.remove('active'));
      btnTxDep.classList.add('active');
      renderTransactionsList('dep');
    };
    if (btnTxWth) btnTxWth.onclick = () => {
      [btnTxAll, btnTxDep, btnTxWth].forEach(b => b.classList.remove('active'));
      btnTxWth.classList.add('active');
      renderTransactionsList('wth');
    };
  }

  showReceiptModal(tx) {
    const modal = document.getElementById('modal-receipt');
    if (!modal || !tx) return;

    const iconEl = document.getElementById('receipt-type-icon');
    const titleEl = document.getElementById('receipt-title-text');
    const typeVal = document.getElementById('receipt-type-val');
    const amountVal = document.getElementById('receipt-amount-val');
    const networkVal = document.getElementById('receipt-network-val');
    const addressVal = document.getElementById('receipt-address-val');
    const hashVal = document.getElementById('receipt-hash-val');

    const isDep = tx.type === 'deposit';

    if (iconEl) iconEl.textContent = isDep ? '📥' : '📤';
    if (titleEl) titleEl.textContent = isDep ? 'Deposit Confirmed' : 'Withdrawal Submitted';
    if (typeVal) typeVal.textContent = isDep ? 'Simulated Deposit' : 'Simulated Withdrawal';
    if (amountVal) amountVal.textContent = `${isDep ? '+' : '-'}${tx.coins_amount.toLocaleString()} Coins ($${tx.fiat_amount.toFixed(2)} ${tx.asset})`;
    if (networkVal) networkVal.textContent = tx.network || 'Tron (TRC-20)';
    if (addressVal) addressVal.textContent = tx.address ? `${tx.address.slice(0, 12)}...${tx.address.slice(-6)}` : 'N/A';
    if (hashVal) hashVal.textContent = tx.tx_hash ? `${tx.tx_hash.slice(0, 16)}...` : 'N/A';

    modal.classList.add('active');
  }

  // ---------------------------------------------------------------------------
  // FREE REFILL MODAL / HANDLER
  // ---------------------------------------------------------------------------
  async handleFreeRefill() {
    window.SoundEffects.playClick();
    if (this.balance >= 100) {
      window.showToast(STRINGS.profile.refillIneligibleMsg, 'warning');
      return;
    }

    try {
      const res = await window.API.refillBalance(this.user.id);
      if (res.success) {
        this.updateBalance(res.balance);
        window.SoundEffects.playWin();
        window.TelegramService.hapticNotification('success');
        window.showToast(STRINGS.alerts.refillSuccess, 'success');
      } else {
        window.showToast(res.reason || STRINGS.alerts.actionFailed, 'warning');
      }
    } catch (e) {
      window.showToast(STRINGS.alerts.actionFailed, 'error');
    }
  }

  // ---------------------------------------------------------------------------
  // REFERRAL MODAL
  // ---------------------------------------------------------------------------
  openReferralModal() {
    const modal = document.getElementById('modal-referral');
    const linkInput = document.getElementById('referral-link-input');
    const copyBtn = document.getElementById('btn-copy-ref-link');
    const shareBtn = document.getElementById('btn-share-telegram');

    const botUsername = 'raika_bot';
    const refCode = this.user ? (this.user.referral_code || 'ref_welcome') : 'ref_welcome';
    const link = `https://t.me/${botUsername}?start=${refCode}`;

    if (linkInput) linkInput.value = link;

    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(link);
        window.SoundEffects.playClick();
        window.TelegramService.hapticNotification('success');
        window.showToast(STRINGS.common.copied, 'success');
      };
    }

    if (shareBtn) {
      shareBtn.onclick = () => {
        const shareText = encodeURIComponent('Join me on Raika and claim +500 free Demo Coins to play games!');
        const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${shareText}`;
        window.open(tgShareUrl, '_blank');
      };
    }

    if (modal) modal.classList.add('active');
  }

  closeAllModals() {
    document.querySelectorAll('.app-modal').forEach(m => m.classList.remove('active'));
  }

  // ---------------------------------------------------------------------------
  // LIVE RECENT WINS TICKER
  // ---------------------------------------------------------------------------
  startLiveTicker() {
    const tickerContainer = document.getElementById('live-wins-ticker-content');
    if (!tickerContainer) return;

    const fetchLiveWins = async () => {
      try {
        const res = await window.API.getLiveWins();
        if (res.success && res.matches && res.matches.length > 0) {
          tickerContainer.innerHTML = res.matches.map(m => `
            <div class="ticker-item">
              <span class="ticker-player">${m.player_name || 'Player'}</span>
              <span class="ticker-game">${m.game_type.toUpperCase()}</span>
              <span class="ticker-win">+${m.payout} Coins</span>
            </div>
          `).join('');
        }
      } catch (e) {}
    };

    fetchLiveWins();
    this.liveTickerInterval = setInterval(fetchLiveWins, 15000);
  }
}

// Global Toast System
window.showToast = function(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `app-toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span class="toast-message">${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('visible'), 20);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

// Initialize Application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.AppState = new AppController();
  window.AppState.init();
});
