/**
 * Raika Telegram WebApp SDK Integration
 * Manages Telegram WebApp lifecycle, haptics, theme colors, and browser simulator fallback.
 */

class TelegramService {
  constructor() {
    this.tg = window.Telegram ? window.Telegram.WebApp : null;
    this.isInsideTelegram = Boolean(this.tg && this.tg.initData);
    this.hapticsEnabled = true;
    this.currentUser = null;

    this.init();
  }

  init() {
    if (this.isInsideTelegram && this.tg) {
      try {
        this.tg.ready();
        this.tg.expand();
        this.tg.setHeaderColor('#0A0D14');
        this.tg.setBackgroundColor('#0A0D14');
      } catch (err) {
        console.warn('Telegram WebApp initialization error:', err);
      }
    }

    this.extractUser();
  }

  extractUser() {
    // Check URL parameters first
    const params = new URLSearchParams(window.location.search);
    const queryUserId = params.get('userId');

    if (this.isInsideTelegram && this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
      const u = this.tg.initDataUnsafe.user;
      this.currentUser = {
        id: String(u.id),
        first_name: u.first_name || 'Player',
        username: u.username || 'tg_user',
        is_bot: false
      };
    } else if (queryUserId) {
      this.currentUser = {
        id: String(queryUserId),
        first_name: 'Player_' + String(queryUserId).slice(-4),
        username: 'user_' + String(queryUserId)
      };
    } else {
      // Local demo fallback
      let savedId = localStorage.getItem('raika_demo_user_id');
      if (!savedId) {
        savedId = 'player_' + Math.floor(1000 + Math.random() * 9000);
        localStorage.setItem('raika_demo_user_id', savedId);
      }
      this.currentUser = {
        id: savedId,
        first_name: 'Lucky Adventurer',
        username: 'raika_player'
      };
    }
  }

  getUser() {
    return this.currentUser;
  }

  setHapticsEnabled(val) {
    this.hapticsEnabled = Boolean(val);
  }

  hapticImpact(style = 'light') {
    if (!this.hapticsEnabled) return;
    if (this.tg && this.tg.HapticFeedback && this.tg.HapticFeedback.impactOccurred) {
      try {
        this.tg.HapticFeedback.impactOccurred(style);
      } catch (e) {}
    } else if (navigator.vibrate) {
      // Fallback browser vibration
      const duration = style === 'heavy' ? 40 : style === 'medium' ? 25 : 15;
      navigator.vibrate(duration);
    }
  }

  hapticNotification(type = 'success') {
    if (!this.hapticsEnabled) return;
    if (this.tg && this.tg.HapticFeedback && this.tg.HapticFeedback.notificationOccurred) {
      try {
        this.tg.HapticFeedback.notificationOccurred(type);
      } catch (e) {}
    } else if (navigator.vibrate) {
      navigator.vibrate([20, 40, 20]);
    }
  }

  closeApp() {
    if (this.tg && this.tg.close) {
      this.tg.close();
    }
  }
}

window.TelegramService = new TelegramService();
