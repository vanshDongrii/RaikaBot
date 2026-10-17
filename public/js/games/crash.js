/**
 * Raika Game - Crash Rocket (Live Canvas Animation)
 * 100% English-Only Interface
 */

class CrashGame {
  constructor() {
    this.stake = 50;
    this.state = 'idle'; // 'idle' | 'flying' | 'crashed' | 'cashed_out'
    this.currentMultiplier = 1.00;
    this.targetCrashPoint = 1.00;
    this.animFrameId = null;
    this.startTime = 0;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
  }

  mount(container) {
    container.innerHTML = `
      <div class="game-container" id="crash-game">
        <div class="game-header">
          <div class="game-title-group">
            <h2 class="game-title">🚀 ${STRINGS.games.crash.name}</h2>
            <span class="game-badge badge-purple">${STRINGS.games.crash.badge}</span>
          </div>
          <p class="game-description">${STRINGS.games.crash.rules}</p>
        </div>

        <div class="crash-stage-wrapper">
          <canvas id="crash-canvas" class="crash-canvas" width="600" height="340"></canvas>
          <div class="crash-overlay">
            <div class="crash-multiplier-display" id="crash-multiplier-text">1.00x</div>
            <div class="crash-status-subtext" id="crash-status-text">Ready for launch</div>
          </div>
        </div>

        <div class="game-controls-panel">
          <div class="stake-control-block">
            <div class="stake-header">
              <span class="control-label">${STRINGS.common.stake}</span>
              <span class="stake-payout-preview" id="crash-current-win-preview">Current Payout: 0 Coins</span>
            </div>
            <div class="stake-input-wrapper">
              <span class="stake-coin-icon">💰</span>
              <input type="number" id="crash-stake-input" class="stake-input" value="${this.stake}" min="10" step="10">
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

          <button type="button" class="action-btn btn-primary btn-large glow-purple" id="btn-crash-action">
            <span class="btn-text" id="crash-btn-text">${STRINGS.games.crash.launchButton}</span>
          </button>
        </div>
      </div>
    `;

    this.initCanvas();
    this.bindEvents();
    this.drawIdle();
  }

  initCanvas() {
    this.canvas = document.getElementById('crash-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      // Responsive scale adjustment
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * (window.devicePixelRatio || 1);
      this.canvas.height = rect.height * (window.devicePixelRatio || 1);
      this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
  }

  bindEvents() {
    const actionBtn = document.getElementById('btn-crash-action');
    const stakeInput = document.getElementById('crash-stake-input');

    stakeInput.addEventListener('input', (e) => {
      if (this.state === 'flying') return;
      this.stake = Math.max(10, parseInt(e.target.value, 10) || 10);
    });

    document.querySelectorAll('#crash-game .chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.state === 'flying') return;
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

    actionBtn.addEventListener('click', () => {
      if (this.state === 'idle' || this.state === 'crashed' || this.state === 'cashed_out') {
        this.startRound();
      } else if (this.state === 'flying') {
        this.cashOut();
      }
    });
  }

  drawIdle() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    this.ctx.clearRect(0, 0, w, h);

    // Grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // Ground curve
    this.ctx.strokeStyle = '#8B5CF6';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(30, h - 30);
    this.ctx.lineTo(w - 30, h - 30);
    this.ctx.stroke();
  }

  async startRound() {
    const user = window.TelegramService.getUser();
    const currentBalance = window.AppState ? window.AppState.balance : 0;

    if (this.stake > currentBalance) {
      window.showToast(STRINGS.alerts.insufficientCoins.replace('{balance}', currentBalance.toLocaleString()), 'error');
      window.SoundEffects.playLoss();
      return;
    }

    const actionBtn = document.getElementById('btn-crash-action');
    const btnText = document.getElementById('crash-btn-text');
    const multText = document.getElementById('crash-multiplier-text');
    const statusText = document.getElementById('crash-status-text');
    const stakeInput = document.getElementById('crash-stake-input');

    stakeInput.disabled = true;
    actionBtn.disabled = true;
    btnText.textContent = 'Preparing Rocket...';

    try {
      const response = await window.API.startCrashRound(user.id, this.stake);
      if (!response.success) {
        window.showToast(response.error || STRINGS.alerts.actionFailed, 'error');
        stakeInput.disabled = false;
        actionBtn.disabled = false;
        btnText.textContent = STRINGS.games.crash.launchButton;
        return;
      }

      window.AppState.updateBalance(response.balance);
      this.targetCrashPoint = response.crashPoint;
      this.state = 'flying';
      this.currentMultiplier = 1.00;
      this.startTime = performance.now();
      this.particles = [];

      actionBtn.disabled = false;
      actionBtn.className = 'action-btn btn-cashout btn-large glow-emerald';
      btnText.textContent = `Cash Out (1.00x)`;
      multText.className = 'crash-multiplier-display flying';
      statusText.textContent = STRINGS.games.crash.inFlight;
      statusText.className = 'crash-status-subtext flying';

      window.TelegramService.hapticImpact('heavy');
      this.runAnimationLoop();
    } catch (err) {
      window.showToast(STRINGS.alerts.actionFailed, 'error');
      stakeInput.disabled = false;
      actionBtn.disabled = false;
      btnText.textContent = STRINGS.games.crash.launchButton;
    }
  }

  runAnimationLoop() {
    const loop = (time) => {
      if (this.state !== 'flying') return;

      const elapsedSec = (time - this.startTime) / 1000;
      // Exponential curve: multiplier = e^(0.07 * t)
      const current = Math.max(1.00, Math.pow(Math.E, 0.09 * elapsedSec));
      this.currentMultiplier = Number(current.toFixed(2));

      // Check crash condition
      if (this.currentMultiplier >= this.targetCrashPoint) {
        this.triggerCrash();
        return;
      }

      this.updateFlightUI();
      this.renderFrame(elapsedSec);

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  updateFlightUI() {
    const multText = document.getElementById('crash-multiplier-text');
    const btnText = document.getElementById('crash-btn-text');
    const previewEl = document.getElementById('crash-current-win-preview');

    if (multText) {
      multText.textContent = `${this.currentMultiplier.toFixed(2)}x`;
    }
    const currentPayout = Math.floor(this.stake * this.currentMultiplier);
    if (btnText) {
      btnText.textContent = `Cash Out ${currentPayout.toLocaleString()} Coins (${this.currentMultiplier.toFixed(2)}x)`;
    }
    if (previewEl) {
      previewEl.textContent = `Current Payout: ${currentPayout.toLocaleString()} Coins`;
    }
  }

  renderFrame(elapsed) {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    this.ctx.clearRect(0, 0, w, h);

    // Background Grid
    this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 35) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 0; y < h; y += 35) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // Rocket Position
    const startX = 35;
    const startY = h - 35;
    const progress = Math.min(1, elapsed / 8);
    const endX = startX + progress * (w - 100);
    const endY = startY - Math.pow(progress, 1.3) * (h - 80);

    // Glowing Curve Path
    const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, '#8B5CF6');
    gradient.addColorStop(1, '#EC4899');

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.quadraticCurveTo(startX + (endX - startX) * 0.4, startY, endX, endY);
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = '#EC4899';
    this.ctx.shadowBlur = 12;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Fill underneath curve
    this.ctx.lineTo(endX, startY);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(236, 72, 153, 0.06)';
    this.ctx.fill();

    // Rocket sprite / icon
    this.ctx.font = '24px sans-serif';
    this.ctx.fillText('🚀', endX - 12, endY + 8);

    // Exhaust spark particles
    if (Math.random() < 0.6) {
      this.particles.push({
        x: endX - 8,
        y: endY + 4,
        vx: -(Math.random() * 2 + 1),
        vy: Math.random() * 2 - 1,
        life: 1.0,
        color: Math.random() < 0.5 ? '#F59E0B' : '#EF4444'
      });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      } else {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
      }
    }
  }

  async cashOut() {
    if (this.state !== 'flying') return;

    this.state = 'cashed_out';
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const user = window.TelegramService.getUser();
    const finalMultiplier = this.currentMultiplier;
    const finalPayout = Math.floor(this.stake * finalMultiplier);

    const multText = document.getElementById('crash-multiplier-text');
    const statusText = document.getElementById('crash-status-text');
    const actionBtn = document.getElementById('btn-crash-action');
    const btnText = document.getElementById('crash-btn-text');
    const stakeInput = document.getElementById('crash-stake-input');

    window.SoundEffects.playCashout();
    window.TelegramService.hapticNotification('success');

    multText.className = 'crash-multiplier-display win pulse-glow';
    multText.textContent = `${finalMultiplier.toFixed(2)}x`;
    statusText.textContent = STRINGS.games.crash.winResult
      .replace('{payout}', finalPayout.toLocaleString())
      .replace('{multiplier}', finalMultiplier.toFixed(2));
    statusText.className = 'crash-status-subtext win';

    actionBtn.className = 'action-btn btn-primary btn-large glow-purple';
    btnText.textContent = STRINGS.games.crash.launchButton;
    stakeInput.disabled = false;

    window.showToast(`+${finalPayout} Demo Coins Cashed Out!`, 'success');

    try {
      const response = await window.API.cashoutCrash(user.id, this.stake, finalMultiplier);
      if (response.success) {
        window.AppState.updateBalance(response.newBalance);
      }
    } catch (e) {
      console.error(e);
    }
  }

  triggerCrash() {
    this.state = 'crashed';
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const multText = document.getElementById('crash-multiplier-text');
    const statusText = document.getElementById('crash-status-text');
    const actionBtn = document.getElementById('btn-crash-action');
    const btnText = document.getElementById('crash-btn-text');
    const stakeInput = document.getElementById('crash-stake-input');

    window.SoundEffects.playExplosion();
    window.TelegramService.hapticNotification('error');

    multText.className = 'crash-multiplier-display crashed';
    multText.textContent = `${this.targetCrashPoint.toFixed(2)}x`;
    statusText.textContent = STRINGS.games.crash.crashed.replace('{multiplier}', this.targetCrashPoint.toFixed(2));
    statusText.className = 'crash-status-subtext crashed';

    actionBtn.className = 'action-btn btn-primary btn-large glow-purple';
    btnText.textContent = STRINGS.games.crash.launchButton;
    stakeInput.disabled = false;
  }
}

window.CrashGame = CrashGame;
