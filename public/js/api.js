/**
 * Raika Client API Service
 * Handles all REST requests to backend endpoints.
 */

class ApiService {
  constructor() {
    this.baseUrl = '/api';
  }

  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    const user = window.TelegramService ? window.TelegramService.getUser() : null;
    if (user && user.id) {
      defaultHeaders['x-telegram-user-id'] = user.id;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`API Error on [${endpoint}]:`, err);
      return { success: false, error: 'Network communication error. Please check your connection.' };
    }
  }

  // User & Profile
  async getUser(userId) {
    return this.request(`/user?userId=${encodeURIComponent(userId)}`);
  }

  async syncUser(tgUser) {
    return this.request('/user/sync', {
      method: 'POST',
      body: JSON.stringify({ tgUser })
    });
  }

  // Rewards & Refills
  async claimDailyBonus(userId) {
    return this.request('/bonus/claim', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async refillBalance(userId) {
    return this.request('/refill', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // Cashier & Simulation
  async getCashierInfo(userId) {
    return this.request(`/cashier/info?userId=${encodeURIComponent(userId)}`);
  }

  async simulateDeposit(userId, asset, usdtAmount) {
    return this.request('/cashier/deposit', {
      method: 'POST',
      body: JSON.stringify({ userId, asset, usdtAmount })
    });
  }

  async simulateWithdraw(userId, asset, coinsAmount, destinationAddress) {
    return this.request('/cashier/withdraw', {
      method: 'POST',
      body: JSON.stringify({ userId, asset, coinsAmount, destinationAddress })
    });
  }

  async getCashierTransactions(userId) {
    return this.request(`/cashier/transactions?userId=${encodeURIComponent(userId)}`);
  }

  // Leaderboard & Live Feeds
  async getLeaderboard(userId) {
    return this.request(`/leaderboard?userId=${encodeURIComponent(userId)}`);
  }

  async getHistory(userId) {
    return this.request(`/history?userId=${encodeURIComponent(userId)}`);
  }

  async getLiveWins() {
    return this.request('/live-wins');
  }

  // Referral
  async applyReferral(userId, referralCode) {
    return this.request('/referral/apply', {
      method: 'POST',
      body: JSON.stringify({ userId, referralCode })
    });
  }

  // Game Endpoints
  async playCoinFlip(userId, stake, choice) {
    return this.request('/games/coinflip', {
      method: 'POST',
      body: JSON.stringify({ userId, stake, choice })
    });
  }

  async playDice(userId, stake, direction, target) {
    return this.request('/games/dice', {
      method: 'POST',
      body: JSON.stringify({ userId, stake, direction, target })
    });
  }

  async startCrashRound(userId, stake) {
    return this.request('/games/crash/round', {
      method: 'POST',
      body: JSON.stringify({ userId, stake })
    });
  }

  async cashoutCrash(userId, stake, multiplier) {
    return this.request('/games/crash/cashout', {
      method: 'POST',
      body: JSON.stringify({ userId, stake, multiplier })
    });
  }

  async startMines(userId, stake, mineCount) {
    return this.request('/games/mines/start', {
      method: 'POST',
      body: JSON.stringify({ userId, stake, mineCount })
    });
  }

  async stepMines(userId, sessionId, tileIndex) {
    return this.request('/games/mines/step', {
      method: 'POST',
      body: JSON.stringify({ userId, sessionId, tileIndex })
    });
  }

  async cashoutMines(userId, sessionId) {
    return this.request('/games/mines/cashout', {
      method: 'POST',
      body: JSON.stringify({ userId, sessionId })
    });
  }

  async playWheel(userId, stake) {
    return this.request('/games/wheel', {
      method: 'POST',
      body: JSON.stringify({ userId, stake })
    });
  }
}

window.API = new ApiService();
