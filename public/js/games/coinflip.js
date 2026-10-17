/**
 * Raika Game - Coin Flip (3D Animated)
 * 100% English-Only Interface
 */

class CoinFlipGame {
  constructor() {
    this.selectedSide = 'heads'; // 'heads' | 'tails'
    this.stake = 50;
    this.isFlipping = false;
  }

  mount(container) {
    container.innerHTML = `
      <div class="game-container" id="coinflip-game">
        <div class="game-header">
          <div class="game-title-group">
            <h2 class="game-title">🪙 ${STRINGS.games.coinflip.name}</h2>
            <span class="game-badge badge-emerald">${STRINGS.games.coinflip.badge}</span>
          </div>
          <p class="game-description">${STRINGS.games.coinflip.rules}</p>
        </div>

        <div class="coinflip-stage">
          <div class="coin-3d-wrapper">
            <div class="coin-3d" id="coin-element">
              <div class="coin-face coin-front">
                <div class="coin-symbol">👑</div>
                <div class="coin-label">${STRINGS.games.coinflip.heads}</div>
              </div>
              <div class="coin-face coin-back">
                <div class="coin-symbol">⚡</div>
                <div class="coin-label">${STRINGS.games.coinflip.tails}</div>
              </div>
            </div>
          </div>
          <div class="coin-shadow" id="coin-shadow"></div>
          <div class="coin-result-message" id="coin-result-text">Choose your side and flip!</div>
        </div>

        <div class="game-controls-panel">
          <div class="control-label">${STRINGS.games.coinflip.selectSide}</div>
          <div class="side-selector-group">
            <button type="button" class="side-btn active" id="btn-select-heads" data-side="heads">
              <span class="side-icon">👑</span>
              <span class="side-text">${STRINGS.games.coinflip.heads}</span>
              <span class="side-multiplier">1.96x</span>
            </button>
            <button type="button" class="side-btn" id="btn-select-tails" data-side="tails">
              <span class="side-icon">⚡</span>
              <span class="side-text">${STRINGS.games.coinflip.tails}</span>
              <span class="side-multiplier">1.96x</span>
            </button>
          </div>

          <div class="stake-control-block">
            <div class="stake-header">
              <span class="control-label">${STRINGS.common.stake}</span>
              <span class="stake-payout-preview">Est. Win: <strong id="coin-payout-preview">${Math.floor(this.stake * 1.96)}</strong> Coins</span>
            </div>
            <div class="stake-input-wrapper">
              <span class="stake-coin-icon">💰</span>
              <input type="number" id="coin-stake-input" class="stake-input" value="${this.stake}" min="10" step="10">
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

          <button type="button" class="action-btn btn-primary btn-large glow-gold" id="btn-flip-coin">
            <span class="btn-text">${STRINGS.games.coinflip.flipButton}</span>
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const headsBtn = document.getElementById('btn-select-heads');
    const tailsBtn = document.getElementById('btn-select-tails');
    const flipBtn = document.getElementById('btn-flip-coin');
    const stakeInput = document.getElementById('coin-stake-input');

    headsBtn.addEventListener('click', () => {
      if (this.isFlipping) return;
      this.selectedSide = 'heads';
      headsBtn.classList.add('active');
      tailsBtn.classList.remove('active');
      window.SoundEffects.playClick();
      window.TelegramService.hapticImpact('light');
    });

    tailsBtn.addEventListener('click', () => {
      if (this.isFlipping) return;
      this.selectedSide = 'tails';
      tailsBtn.classList.add('active');
      headsBtn.classList.remove('active');
      window.SoundEffects.playClick();
      window.TelegramService.hapticImpact('light');
    });

    stakeInput.addEventListener('input', (e) => {
      this.stake = Math.max(10, parseInt(e.target.value, 10) || 10);
      this.updatePayoutPreview();
    });

    // Chip presets
    document.querySelectorAll('#coinflip-game .chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isFlipping) return;
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
        this.updatePayoutPreview();
      });
    });

    flipBtn.addEventListener('click', () => this.handleFlip());
  }

  updatePayoutPreview() {
    const el = document.getElementById('coin-payout-preview');
    if (el) {
      el.textContent = Math.floor(this.stake * 1.96).toLocaleString();
    }
  }

  async handleFlip() {
    if (this.isFlipping) return;

    const user = window.TelegramService.getUser();
    const currentBalance = window.AppState ? window.AppState.balance : 0;

    if (this.stake > currentBalance) {
      window.showToast(STRINGS.alerts.insufficientCoins.replace('{balance}', currentBalance.toLocaleString()), 'error');
      window.SoundEffects.playLoss();
      return;
    }

    this.isFlipping = true;
    const flipBtn = document.getElementById('btn-flip-coin');
    const resultText = document.getElementById('coin-result-text');
    const coinEl = document.getElementById('coin-element');

    flipBtn.disabled = true;
    flipBtn.querySelector('.btn-text').textContent = STRINGS.games.coinflip.flipping;
    resultText.textContent = 'Flipping through the air...';
    resultText.className = 'coin-result-message flipping';

    window.SoundEffects.playCoinFlip();
    window.TelegramService.hapticImpact('medium');

    // Trigger 3D flip animation
    coinEl.classList.remove('land-heads', 'land-tails');
    coinEl.classList.add('flipping-active');

    try {
      const response = await window.API.playCoinFlip(user.id, this.stake, this.selectedSide);

      // Wait 1.6s for flip animation to complete smoothly
      await new Promise(r => setTimeout(r, 1600));

      coinEl.classList.remove('flipping-active');
      const landed = response.game.landedSide; // 'heads' or 'tails'
      coinEl.classList.add(landed === 'heads' ? 'land-heads' : 'land-tails');

      if (response.success) {
        window.AppState.updateBalance(response.newBalance);

        if (response.game.outcome === 'win') {
          window.SoundEffects.playWin();
          window.TelegramService.hapticNotification('success');
          resultText.textContent = STRINGS.games.coinflip.winResult.replace('{side}', landed.toUpperCase());
          resultText.className = 'coin-result-message win pulse-glow';
          window.showToast(`+${response.game.payout} Demo Coins!`, 'success');
        } else {
          window.SoundEffects.playLoss();
          window.TelegramService.hapticNotification('warning');
          resultText.textContent = STRINGS.games.coinflip.lossResult.replace('{side}', landed.toUpperCase());
          resultText.className = 'coin-result-message loss';
        }
      } else {
        window.showToast(response.error || STRINGS.alerts.actionFailed, 'error');
      }
    } catch (err) {
      window.showToast(STRINGS.alerts.actionFailed, 'error');
    } finally {
      this.isFlipping = false;
      flipBtn.disabled = false;
      flipBtn.querySelector('.btn-text').textContent = STRINGS.games.coinflip.flipButton;
    }
  }
}

window.CoinFlipGame = CoinFlipGame;
