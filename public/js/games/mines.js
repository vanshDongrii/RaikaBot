/**
 * Raika Game - Mines (5x5 Interactive Tile Grid)
 * 100% English-Only Interface
 */

class MinesGame {
  constructor() {
    this.stake = 50;
    this.mineCount = 3;
    this.sessionId = null;
    this.isPlaying = false;
    this.currentMultiplier = 1.0;
    this.revealedCount = 0;
  }

  mount(container) {
    container.innerHTML = `
      <div class="game-container" id="mines-game">
        <div class="game-header">
          <div class="game-title-group">
            <h2 class="game-title">💎 ${STRINGS.games.mines.name}</h2>
            <span class="game-badge badge-emerald">${STRINGS.games.mines.badge}</span>
          </div>
          <p class="game-description">${STRINGS.games.mines.rules}</p>
        </div>

        <!-- Multiplier & Odds Bar -->
        <div class="mines-stats-bar">
          <div class="stat-card">
            <span class="stat-card-label">${STRINGS.games.mines.mineCountLabel}</span>
            <span class="stat-card-value text-red" id="mines-count-display">${this.mineCount} Mines</span>
          </div>
          <div class="stat-card">
            <span class="stat-card-label">${STRINGS.games.mines.currentMultiplier}</span>
            <span class="stat-card-value text-emerald" id="mines-curr-multiplier">1.00x</span>
          </div>
          <div class="stat-card">
            <span class="stat-card-label">${STRINGS.games.mines.nextGemMultiplier}</span>
            <span class="stat-card-value text-gold" id="mines-next-multiplier">1.18x</span>
          </div>
        </div>

        <!-- 5x5 Tiles Grid -->
        <div class="mines-grid" id="mines-tile-grid">
          ${this.generateTileMarkup()}
        </div>

        <div class="game-controls-panel">
          <!-- Mine Count Selector -->
          <div class="mines-setup-group" id="mines-setup-controls">
            <div class="control-label">${STRINGS.games.mines.mineCountLabel}</div>
            <div class="mine-preset-chips">
              <button class="mine-chip active" data-mines="1">1</button>
              <button class="mine-chip" data-mines="3">3</button>
              <button class="mine-chip" data-mines="5">5</button>
              <button class="mine-chip" data-mines="10">10</button>
              <button class="mine-chip" data-mines="15">15</button>
              <button class="mine-chip" data-mines="20">20</button>
            </div>
          </div>

          <!-- Stake Control -->
          <div class="stake-control-block" id="mines-stake-controls">
            <div class="stake-header">
              <span class="control-label">${STRINGS.common.stake}</span>
            </div>
            <div class="stake-input-wrapper">
              <span class="stake-coin-icon">💰</span>
              <input type="number" id="mines-stake-input" class="stake-input" value="${this.stake}" min="10" step="10">
            </div>
            <div class="stake-chip-presets">
              <button class="chip-btn" data-amount="10">+10</button>
              <button class="chip-btn" data-amount="50">+50</button>
              <button class="chip-btn" data-amount="100">+100</button>
              <button class="chip-btn" data-action="half">1/2</button>
              <button class="chip-btn" data-action="double">2X</button>
              <button class="chip-btn" data-action="max">MAX</button>
            </div>
          </div>

          <!-- Action Button: Start or Cash Out -->
          <button type="button" class="action-btn btn-primary btn-large glow-emerald" id="btn-mines-action">
            <span class="btn-text" id="mines-btn-text">${STRINGS.games.mines.startGameButton}</span>
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  generateTileMarkup() {
    let tiles = '';
    for (let i = 0; i < 25; i++) {
      tiles += `
        <button type="button" class="mine-tile" data-index="${i}" id="mine-tile-${i}">
          <div class="tile-inner">
            <div class="tile-front">❓</div>
            <div class="tile-back" id="tile-back-${i}">💎</div>
          </div>
        </button>
      `;
    }
    return tiles;
  }

  bindEvents() {
    const actionBtn = document.getElementById('btn-mines-action');
    const stakeInput = document.getElementById('mines-stake-input');

    // Mine preset chips
    document.querySelectorAll('#mines-game .mine-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isPlaying) return;
        window.SoundEffects.playClick();
        document.querySelectorAll('#mines-game .mine-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mineCount = parseInt(btn.dataset.mines, 10);
        document.getElementById('mines-count-display').textContent = `${this.mineCount} Mines`;
      });
    });

    stakeInput.addEventListener('input', (e) => {
      if (this.isPlaying) return;
      this.stake = Math.max(10, parseInt(e.target.value, 10) || 10);
    });

    // Chip presets
    document.querySelectorAll('#mines-game .chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isPlaying) return;
        window.SoundEffects.playClick();
        const amount = btn.dataset.amount;
        const action = btn.dataset.action;
        const currentBalance = window.AppState ? window.AppState.balance : 1000;

        if (amount) {
          this.stake += parseInt(amount, 10);
        } else if (action === 'half') {
          this.stake = Math.max(10, Math.floor(this.stake / 2));
        } else if (action === 'double') {
          this.stake = Math.min(currentBalance, this.stake * 2);
        } else if (action === 'max') {
          this.stake = Math.max(10, currentBalance);
        }

        stakeInput.value = this.stake;
      });
    });

    // Tile click handler
    document.querySelectorAll('.mine-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const index = parseInt(tile.dataset.index, 10);
        this.handleTileClick(index);
      });
    });

    actionBtn.addEventListener('click', () => {
      if (!this.isPlaying) {
        this.startSession();
      } else {
        this.cashOut();
      }
    });
  }

  async startSession() {
    const user = window.TelegramService.getUser();
    const currentBalance = window.AppState ? window.AppState.balance : 0;

    if (this.stake > currentBalance) {
      window.showToast(STRINGS.alerts.insufficientCoins.replace('{balance}', currentBalance.toLocaleString()), 'error');
      window.SoundEffects.playLoss();
      return;
    }

    const actionBtn = document.getElementById('btn-mines-action');
    const btnText = document.getElementById('mines-btn-text');
    const stakeInput = document.getElementById('mines-stake-input');

    actionBtn.disabled = true;
    btnText.textContent = 'Preparing Grid...';

    // Reset all tiles
    document.querySelectorAll('.mine-tile').forEach(tile => {
      tile.className = 'mine-tile';
      tile.disabled = false;
      const back = tile.querySelector('.tile-back');
      if (back) back.textContent = '💎';
    });

    try {
      const response = await window.API.startMines(user.id, this.stake, this.mineCount);
      if (!response.success) {
        window.showToast(response.error || STRINGS.alerts.actionFailed, 'error');
        actionBtn.disabled = false;
        btnText.textContent = STRINGS.games.mines.startGameButton;
        return;
      }

      window.AppState.updateBalance(response.balance);
      this.sessionId = response.session.sessionId;
      this.isPlaying = true;
      this.currentMultiplier = 1.0;
      this.revealedCount = 0;

      stakeInput.disabled = true;
      actionBtn.disabled = true; // disabled until 1st gem revealed
      actionBtn.className = 'action-btn btn-cashout btn-large glow-gold';
      btnText.textContent = STRINGS.games.mines.uncoverTile;

      document.getElementById('mines-curr-multiplier').textContent = '1.00x';
      document.getElementById('mines-next-multiplier').textContent = `${response.session.nextMultiplier}x`;

      window.TelegramService.hapticImpact('medium');
    } catch (err) {
      window.showToast(STRINGS.alerts.actionFailed, 'error');
      actionBtn.disabled = false;
      btnText.textContent = STRINGS.games.mines.startGameButton;
    }
  }

  async handleTileClick(index) {
    if (!this.isPlaying || !this.sessionId) return;
    const tile = document.getElementById(`mine-tile-${index}`);
    if (!tile || tile.classList.contains('revealed')) return;

    tile.disabled = true;
    window.TelegramService.hapticImpact('light');

    const user = window.TelegramService.getUser();
    try {
      const response = await window.API.stepMines(user.id, this.sessionId, index);
      if (!response.success) {
        window.showToast(response.error || STRINGS.alerts.actionFailed, 'error');
        return;
      }

      const step = response.step;
      const back = tile.querySelector('.tile-back');

      if (step.hitMine) {
        // Exploded!
        back.textContent = '💣';
        tile.classList.add('revealed', 'tile-mine');
        window.SoundEffects.playExplosion();
        window.TelegramService.hapticNotification('error');

        // Reveal other mines
        if (step.allMines) {
          step.allMines.forEach(mIdx => {
            const mTile = document.getElementById(`mine-tile-${mIdx}`);
            if (mTile && !mTile.classList.contains('revealed')) {
              mTile.classList.add('revealed', 'tile-mine-dim');
              const b = mTile.querySelector('.tile-back');
              if (b) b.textContent = '💣';
            }
          });
        }

        this.endSession(false);
      } else {
        // Safe Gem!
        back.textContent = '💎';
        tile.classList.add('revealed', 'tile-gem');
        window.SoundEffects.playGem();
        window.TelegramService.hapticNotification('success');

        this.revealedCount++;
        this.currentMultiplier = step.currentMultiplier;

        document.getElementById('mines-curr-multiplier').textContent = `${step.currentMultiplier.toFixed(2)}x`;
        document.getElementById('mines-next-multiplier').textContent = step.nextMultiplier ? `${step.nextMultiplier.toFixed(2)}x` : 'MAX';

        // Enable Cash Out button with updated amount
        const actionBtn = document.getElementById('btn-mines-action');
        const btnText = document.getElementById('mines-btn-text');
        actionBtn.disabled = false;
        btnText.textContent = STRINGS.games.mines.cashOutButton.replace('{payout}', step.currentPayout.toLocaleString());

        if (step.isMaxClear) {
          this.cashOut();
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async cashOut() {
    if (!this.isPlaying || !this.sessionId) return;

    const user = window.TelegramService.getUser();
    const actionBtn = document.getElementById('btn-mines-action');
    actionBtn.disabled = true;

    try {
      const response = await window.API.cashoutMines(user.id, this.sessionId);
      if (response.success) {
        window.AppState.updateBalance(response.newBalance);
        window.SoundEffects.playCashout();
        window.TelegramService.hapticNotification('success');

        // Reveal remaining mines
        if (response.cashout.allMines) {
          response.cashout.allMines.forEach(mIdx => {
            const mTile = document.getElementById(`mine-tile-${mIdx}`);
            if (mTile && !mTile.classList.contains('revealed')) {
              mTile.classList.add('revealed', 'tile-mine-dim');
              const b = mTile.querySelector('.tile-back');
              if (b) b.textContent = '💣';
            }
          });
        }

        window.showToast(`+${response.cashout.payout} Demo Coins Cashed Out!`, 'success');
        this.endSession(true);
      }
    } catch (e) {
      console.error(e);
    }
  }

  endSession(isWin) {
    this.isPlaying = false;
    this.sessionId = null;

    const actionBtn = document.getElementById('btn-mines-action');
    const btnText = document.getElementById('mines-btn-text');
    const stakeInput = document.getElementById('mines-stake-input');

    actionBtn.disabled = false;
    actionBtn.className = 'action-btn btn-primary btn-large glow-emerald';
    btnText.textContent = STRINGS.games.mines.startGameButton;
    stakeInput.disabled = false;

    // Disable unrevealed tiles
    document.querySelectorAll('.mine-tile:not(.revealed)').forEach(t => t.disabled = true);
  }
}

window.MinesGame = MinesGame;
