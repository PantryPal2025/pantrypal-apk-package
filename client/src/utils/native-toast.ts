import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';

export const showNativeToast = async (message: string, duration: 'short' | 'long' = 'short') => {
  try {
    // Only use native toast on mobile devices
    if (Capacitor.isNativePlatform()) {
      await Toast.show({
        text: message,
        duration: duration === 'short' ? 'short' : 'long',
        position: 'bottom'
      });
      return true;
    }
    
    // Return false if not on a native platform, so the app can fall back to web toasts
    return false;
  } catch (error) {
    console.error('Error showing native toast:', error);
    return false;
  }
};