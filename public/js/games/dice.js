/**
 * Raika Game - Dice Roll (Adjustable Odds)
 * 100% English-Only Interface
 */

class DiceGame {
  constructor() {
    this.stake = 50;
    this.direction = 'under'; // 'under' | 'over'
    this.target = 50;
    this.isRolling = false;
  }

  mount(container) {
    container.innerHTML = `
      <div class="game-container" id="dice-game">
        <div class="game-header">
          <div class="game-title-group">
            <h2 class="game-title">🎲 ${STRINGS.games.dice.name}</h2>
            <span class="game-badge badge-blue">${STRINGS.games.dice.badge}</span>
          </div>
          <p class="game-description">${STRINGS.games.dice.rules}</p>
        </div>

        <div class="dice-stage">
          <div class="dice-visual-box">
            <div class="dice-result-number" id="dice-number-display">50</div>
            <div class="dice-target-indicator" id="dice-target-indicator">Target: Under 50</div>
          </div>
          <div class="dice-result-message" id="dice-result-text">Slide to adjust odds, then roll!</div>
        </div>

        <div class="game-controls-panel">
          <!-- Odds & Multiplier Display Cards -->
          <div class="dice-stats-grid">
            <div class="stat-card">
              <span class="stat-card-label">${STRINGS.games.dice.winChance}</span>
              <span class="stat-card-value text-emerald" id="dice-win-chance">50.0%</span>
            </div>
            <div class="stat-card">
              <span class="stat-card-label">${STRINGS.games.dice.payoutMultiplier}</span>
              <span class="stat-card-value text-gold" id="dice-multiplier-val">1.96x</span>
            </div>
            <div class="stat-card">
              <span class="stat-card-label">${STRINGS.common.payout}</span>
              <span class="stat-card-value text-cyan" id="dice-payout-val">${Math.floor(this.stake * 1.96)}</span>
            </div>
          </div>

          <!-- Direction Toggle -->
          <div class="direction-toggle-group">
            <button type="button" class="dir-btn active" id="btn-dir-under">
              <span>📉 ${STRINGS.games.dice.rollUnder}</span>
            </button>
            <button type="button" class="dir-btn" id="btn-dir-over">
              <span>📈 ${STRINGS.games.dice.rollOver}</span>
            </button>
          </div>

          <!-- Slider -->
          <div class="slider-wrapper">
            <div class="slider-labels">
              <span>2</span>
              <span class="slider-current-target" id="slider-target-val">Target: 50</span>
              <span>98</span>
            </div>
            <input type="range" id="dice-slider" class="range-slider" min="2" max="98" value="50">
          </div>

          <!-- Stake Control -->
          <div class="stake-control-block">
            <div class="stake-header">
              <span class="control-label">${STRINGS.common.stake}</span>
            </div>
            <div class="stake-input-wrapper">
              <span class="stake-coin-icon">💰</span>
              <input type="number" id="dice-stake-input" class="stake-input" value="${this.stake}" min="10" step="10">
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

          <button type="button" class="action-btn btn-primary btn-large glow-blue" id="btn-roll-dice">
            <span class="btn-text">${STRINGS.games.dice.rollButton}</span>
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateOdds();
  }

  bindEvents() {
    const dirUnder = document.getElementById('btn-dir-under');
    const dirOver = document.getElementById('btn-dir-over');
    const slider = document.getElementById('dice-slider');
    const stakeInput = document.getElementById('dice-stake-input');
    const rollBtn = document.getElementById('btn-roll-dice');

    dirUnder.addEventListener('click', () => {
      if (this.isRolling) return;
      this.direction = 'under';
      dirUnder.classList.add('active');
      dirOver.classList.remove('active');
      window.SoundEffects.playClick();
      this.updateOdds();
    });

    dirOver.addEventListener('click', () => {
      if (this.isRolling) return;
      this.direction = 'over';
      dirOver.classList.add('active');
      dirUnder.classList.remove('active');
      window.SoundEffects.playClick();
      this.updateOdds();
    });

    slider.addEventListener('input', (e) => {
      this.target = parseInt(e.target.value, 10);
      this.updateOdds();
    });

    stakeInput.addEventListener('input', (e) => {
      this.stake = Math.max(10, parseInt(e.target.value, 10) || 10);
      this.updateOdds();
    });

    // Chip presets
    document.querySelectorAll('#dice-game .chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isRolling) return;
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
        this.updateOdds();
      });
    });

    rollBtn.addEventListener('click', () => this.handleRoll());
  }

  updateOdds() {
    const targetLabel = document.getElementById('slider-target-val');
    const indicator = document.getElementById('dice-target-indicator');
    const chanceEl = document.getElementById('dice-win-chance');
    const multEl = document.getElementById('dice-multiplier-val');
    const payoutEl = document.getElementById('dice-payout-val');

    let winChance = this.direction === 'under' ? this.target : (99 - this.target);
    winChance = Math.max(1, Math.min(98, winChance));
    const multiplier = (98 / winChance).toFixed(2);
    const payout = Math.floor(this.stake * multiplier);

    if (targetLabel) targetLabel.textContent = `Target: ${this.target}`;
    if (indicator) indicator.textContent = `Win if roll is ${this.direction.toUpperCase()} ${this.target}`;
    if (chanceEl) chanceEl.textContent = `${winChance.toFixed(1)}%`;
    if (multEl) multEl.textContent = `${multiplier}x`;
    if (payoutEl) payoutEl.textContent = payout.toLocaleString();
  }

  async handleRoll() {
    if (this.isRolling) return;

    const user = window.TelegramService.getUser();
    const currentBalance = window.AppState ? window.AppState.balance : 0;

    if (this.stake > currentBalance) {
      window.showToast(STRINGS.alerts.insufficientCoins.replace('{balance}', currentBalance.toLocaleString()), 'error');
      window.SoundEffects.playLoss();
      return;
    }

    this.isRolling = true;
    const rollBtn = document.getElementById('btn-roll-dice');
    const numDisplay = document.getElementById('dice-number-display');
    const resultText = document.getElementById('dice-result-text');

    rollBtn.disabled = true;
    rollBtn.querySelector('.btn-text').textContent = STRINGS.games.dice.rolling;
    resultText.textContent = 'Rolling the dice...';
    resultText.className = 'dice-result-message rolling';

    window.TelegramService.hapticImpact('medium');

    // Number ticker animation
    let tickCount = 0;
    const interval = setInterval(() => {
      numDisplay.textContent = Math.floor(Math.random() * 100);
      window.SoundEffects.playTick();
      tickCount++;
      if (tickCount > 10) clearInterval(interval);
    }, 60);

    try {
      const response = await window.API.playDice(user.id, this.stake, this.direction, this.target);

      await new Promise(r => setTimeout(r, 700));
      clearInterval(interval);

      if (response.success) {
        const roll = response.game.roll;
        numDisplay.textContent = roll;
        window.AppState.updateBalance(response.newBalance);

        if (response.game.outcome === 'win') {
          window.SoundEffects.playWin();
          window.TelegramService.hapticNotification('success');
          numDisplay.className = 'dice-result-number win pulse-glow';
          resultText.textContent = STRINGS.games.dice.winResult
            .replace('{result}', roll)
            .replace('{direction}', this.direction.toUpperCase())
            .replace('{target}', this.target);
          resultText.className = 'dice-result-message win';
          window.showToast(`+${response.game.payout} Demo Coins!`, 'success');
        } else {
          window.SoundEffects.playLoss();
          window.TelegramService.hapticNotification('warning');
          numDisplay.className = 'dice-result-number loss';
          resultText.textContent = STRINGS.games.dice.lossResult
            .replace('{result}', roll)
            .replace('{direction}', this.direction.toUpperCase())
            .replace('{target}', this.target);
          resultText.className = 'dice-result-message loss';
        }
      } else {
        window.showToast(response.error || STRINGS.alerts.actionFailed, 'error');
      }
    } catch (err) {
      window.showToast(STRINGS.alerts.actionFailed, 'error');
    } finally {
      this.isRolling = false;
      rollBtn.disabled = false;
      rollBtn.querySelector('.btn-text').textContent = STRINGS.games.dice.rollButton;
    }
  }
}

window.DiceGame = DiceGame;
