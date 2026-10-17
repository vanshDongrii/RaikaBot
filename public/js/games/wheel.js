/**
 * Raika Game - Lucky Wheel (Neon Canvas Spinner)
 * 100% English-Only Interface
 */

class WheelGame {
  constructor() {
    this.stake = 50;
    this.isSpinning = false;
    this.canvas = null;
    this.ctx = null;
    this.currentRotation = 0; // In radians
    this.segments = [
      { label: '0x', multiplier: 0.0, color: '#DC2626' },
      { label: '1.2x', multiplier: 1.2, color: '#2563EB' },
      { label: '1.5x', multiplier: 1.5, color: '#059669' },
      { label: '2x', multiplier: 2.0, color: '#D97706' },
      { label: '0.5x', multiplier: 0.5, color: '#4B5563' },
      { label: '3x', multiplier: 3.0, color: '#7C3AED' },
      { label: '0x', multiplier: 0.0, color: '#DC2626' },
      { label: '1.2x', multiplier: 1.2, color: '#2563EB' },
      { label: '5x', multiplier: 5.0, color: '#DB2777' },
      { label: '0.8x', multiplier: 0.8, color: '#4B5563' },
      { label: '2x', multiplier: 2.0, color: '#D97706' },
      { label: '10x JACKPOT', multiplier: 10.0, color: '#F59E0B' }
    ];
  }

  mount(container) {
    container.innerHTML = `
      <div class="game-container" id="wheel-game">
        <div class="game-header">
          <div class="game-title-group">
            <h2 class="game-title">🎡 ${STRINGS.games.wheel.name}</h2>
            <span class="game-badge badge-gold">${STRINGS.games.wheel.badge}</span>
          </div>
          <p class="game-description">${STRINGS.games.wheel.rules}</p>
        </div>

        <div class="wheel-stage-wrapper">
          <div class="wheel-pointer-needle">▼</div>
          <canvas id="wheel-canvas" class="wheel-canvas" width="340" height="340"></canvas>
          <div class="wheel-center-hub">🎯</div>
          <div class="wheel-result-message" id="wheel-result-text">Spin to win up to 10x jackpot!</div>
        </div>

        <div class="game-controls-panel">
          <div class="stake-control-block">
            <div class="stake-header">
              <span class="control-label">${STRINGS.common.stake}</span>
              <span class="stake-payout-preview">Jackpot Potential: <strong id="wheel-jackpot-preview">${this.stake * 10}</strong> Coins</span>
            </div>
            <div class="stake-input-wrapper">
              <span class="stake-coin-icon">💰</span>
              <input type="number" id="wheel-stake-input" class="stake-input" value="${this.stake}" min="10" step="10">
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

          <button type="button" class="action-btn btn-primary btn-large glow-gold" id="btn-spin-wheel">
            <span class="btn-text">${STRINGS.games.wheel.spinButton}</span>
          </button>
        </div>
      </div>
    `;

    this.initCanvas();
    this.bindEvents();
    this.drawWheel();
  }

  initCanvas() {
    this.canvas = document.getElementById('wheel-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  bindEvents() {
    const spinBtn = document.getElementById('btn-spin-wheel');
    const stakeInput = document.getElementById('wheel-stake-input');

    stakeInput.addEventListener('input', (e) => {
      this.stake = Math.max(10, parseInt(e.target.value, 10) || 10);
      document.getElementById('wheel-jackpot-preview').textContent = (this.stake * 10).toLocaleString();
    });

    document.querySelectorAll('#wheel-game .chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isSpinning) return;
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
        document.getElementById('wheel-jackpot-preview').textContent = (this.stake * 10).toLocaleString();
      });
    });

    spinBtn.addEventListener('click', () => this.handleSpin());
  }

  drawWheel() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = w / 2 - 12;

    this.ctx.clearRect(0, 0, w, h);

    const numSegs = this.segments.length;
    const arcAngle = (2 * Math.PI) / numSegs;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(this.currentRotation);

    // Draw segments
    for (let i = 0; i < numSegs; i++) {
      const seg = this.segments[i];
      const startAngle = i * arcAngle;
      const endAngle = startAngle + arcAngle;

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, radius, startAngle, endAngle);
      this.ctx.closePath();

      this.ctx.fillStyle = seg.color;
      this.ctx.fill();

      // Divider stroke
      this.ctx.strokeStyle = '#0A0D14';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Segment text
      this.ctx.save();
      this.ctx.rotate(startAngle + arcAngle / 2);
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = seg.multiplier === 10 ? 'bold 13px sans-serif' : 'bold 15px sans-serif';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(seg.label, radius - 16, 5);
      this.ctx.restore();
    }

    // Outer neon rim
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#F59E0B';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();

    this.ctx.restore();
  }

  async handleSpin() {
    if (this.isSpinning) return;

    const user = window.TelegramService.getUser();
    const currentBalance = window.AppState ? window.AppState.balance : 0;

    if (this.stake > currentBalance) {
      window.showToast(STRINGS.alerts.insufficientCoins.replace('{balance}', currentBalance.toLocaleString()), 'error');
      window.SoundEffects.playLoss();
      return;
    }

    this.isSpinning = true;
    const spinBtn = document.getElementById('btn-spin-wheel');
    const resultText = document.getElementById('wheel-result-text');

    spinBtn.disabled = true;
    spinBtn.querySelector('.btn-text').textContent = STRINGS.games.wheel.spinning;
    resultText.textContent = 'Wheel is spinning...';
    resultText.className = 'wheel-result-message spinning';

    window.TelegramService.hapticImpact('heavy');

    try {
      const response = await window.API.playWheel(user.id, this.stake);
      if (!response.success) {
        window.showToast(response.error || STRINGS.alerts.actionFailed, 'error');
        this.isSpinning = false;
        spinBtn.disabled = false;
        spinBtn.querySelector('.btn-text').textContent = STRINGS.games.wheel.spinButton;
        return;
      }

      const targetIndex = response.game.segmentIndex;
      const numSegs = this.segments.length;
      const arcAngle = (2 * Math.PI) / numSegs;

      // Calculate target angle so pointer at top (3*PI/2) points to segment
      const pointerAngle = (3 * Math.PI) / 2;
      const segmentCenterAngle = targetIndex * arcAngle + (arcAngle / 2);
      
      const fullRotations = (5 + Math.floor(Math.random() * 3)) * (2 * Math.PI);
      const targetAngle = this.currentRotation + fullRotations + (pointerAngle - (this.currentRotation % (2 * Math.PI)) - segmentCenterAngle);

      const startAngle = this.currentRotation;
      const totalDistance = targetAngle - startAngle;
      const duration = 4200; // ms
      const startTime = performance.now();

      let lastTickAngle = startAngle;

      const animateWheel = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);

        // Cubic ease out
        const ease = 1 - Math.pow(1 - t, 3);
        this.currentRotation = startAngle + totalDistance * ease;

        // Play tick sound when passing each segment arc
        if (Math.abs(this.currentRotation - lastTickAngle) >= arcAngle) {
          window.SoundEffects.playTick();
          window.TelegramService.hapticImpact('light');
          lastTickAngle = this.currentRotation;
        }

        this.drawWheel();

        if (t < 1) {
          requestAnimationFrame(animateWheel);
        } else {
          this.finishSpin(response);
        }
      };

      requestAnimationFrame(animateWheel);
    } catch (err) {
      window.showToast(STRINGS.alerts.actionFailed, 'error');
      this.isSpinning = false;
      spinBtn.disabled = false;
      spinBtn.querySelector('.btn-text').textContent = STRINGS.games.wheel.spinButton;
    }
  }

  finishSpin(response) {
    this.isSpinning = false;
    const spinBtn = document.getElementById('btn-spin-wheel');
    const resultText = document.getElementById('wheel-result-text');

    spinBtn.disabled = false;
    spinBtn.querySelector('.btn-text').textContent = STRINGS.games.wheel.spinButton;

    window.AppState.updateBalance(response.newBalance);

    const game = response.game;
    if (game.multiplier >= 1.0) {
      window.SoundEffects.playWin();
      window.TelegramService.hapticNotification('success');
      resultText.textContent = STRINGS.games.wheel.winResult
        .replace('{multiplier}', game.multiplier)
        .replace('{payout}', game.payout.toLocaleString());
      resultText.className = 'wheel-result-message win pulse-glow';
      window.showToast(`+${game.payout} Demo Coins!`, 'success');
    } else {
      window.SoundEffects.playLoss();
      window.TelegramService.hapticNotification('warning');
      resultText.textContent = STRINGS.games.wheel.lossResult.replace('{multiplier}', game.multiplier);
      resultText.className = 'wheel-result-message loss';
    }
  }
}

window.WheelGame = WheelGame;
