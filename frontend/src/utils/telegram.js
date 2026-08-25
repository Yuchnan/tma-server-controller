/**
 * Telegram WebApp Integration Utilities
 */

export const getTelegram = () => {
  return typeof window !== 'undefined' && window.Telegram?.WebApp ? window.Telegram.WebApp : null;
};

export const isTelegramApp = () => {
  const tg = getTelegram();
  return Boolean(tg && tg.initData && tg.initData.length > 0);
};

export const initTelegramApp = () => {
  const tg = getTelegram();
  if (!tg) return null;

  try {
    tg.ready();
    tg.expand();
    
    // Set header and background color if supported
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#07090e');
    }
    if (tg.setBackgroundColor) {
      tg.setBackgroundColor('#07090e');
    }
    if (tg.enableClosingConfirmation) {
      tg.enableClosingConfirmation();
    }
  } catch (e) {
    console.warn('Telegram WebApp init warning:', e);
  }

  return tg;
};

export const getTelegramUser = () => {
  const tg = getTelegram();
  return tg?.initDataUnsafe?.user || null;
};

export const triggerHaptic = (style = 'medium') => {
  const tg = getTelegram();
  if (!tg?.HapticFeedback) return;

  try {
    switch (style) {
      case 'light':
      case 'medium':
      case 'heavy':
      case 'rigid':
      case 'soft':
        tg.HapticFeedback.impactOccurred(style);
        break;
      case 'success':
      case 'warning':
      case 'error':
        tg.HapticFeedback.notificationOccurred(style);
        break;
      case 'selection':
        tg.HapticFeedback.selectionChanged();
        break;
      default:
        tg.HapticFeedback.impactOccurred('medium');
    }
  } catch (e) {
    // Ignore haptic errors on unsupported devices
  }
};
