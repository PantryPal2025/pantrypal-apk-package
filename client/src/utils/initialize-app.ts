import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { showToast, initializePushNotifications, initializeCapacitor } from './capacitor';

/**
 * Initialize all native app features
 * This function should be called once when the application starts
 */
export async function initializeApp() {
  if (!Capacitor.isNativePlatform()) {
    console.log('Running in browser, skipping native initialization');
    return;
  }
  
  try {
    // Initialize Capacitor first
    await initializeCapacitor();
    
    // Initialize app features
    await Promise.all([
      initializeAppListeners(),
      initializePushNotifications(),
    ]);
    
    console.log('App initialization complete');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}



/**
 * Set up app lifecycle event listeners
 */
async function initializeAppListeners() {
  try {
    // Handle back button
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        // If we can't go back (i.e., we're at the root), show a confirm dialog
        showToast('Press back again to exit');
      }
    });
    
    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App came to foreground
        console.log('App became active');
      } else {
        // App went to background
        console.log('App went to background');
      }
    });
    
    // Handle app resuming from background
    App.addListener('appRestoredResult', (data) => {
      console.log('App restored with data:', data);
    });
  } catch (error) {
    console.error('Error setting up app listeners:', error);
  }
}