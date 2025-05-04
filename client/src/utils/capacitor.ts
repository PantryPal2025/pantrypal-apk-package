import { Capacitor } from "@capacitor/core";
import { Toast as CapToast } from "@capacitor/toast";
import { type AlertOptions, type ActionSheetOptions } from "@capacitor/dialog";
import { Camera as CapCamera, type CameraResultType } from "@capacitor/camera";
import { type PushNotificationSchema, PushNotifications } from "@capacitor/push-notifications";
import { StatusBar } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Check if running on a native platform (iOS or Android)
 */
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Show a toast message on native platforms or use the browser console on web
 */
export async function showToast(message: string, duration: "short" | "long" = "short"): Promise<void> {
  if (isNative()) {
    await CapToast.show({
      text: message,
      duration: duration === "short" ? "short" : "long",
      position: "bottom",
    });
  } else {
    console.log(`Toast: ${message}`);
  }
}

/**
 * Initialize push notifications on native platforms
 */
export async function initializePushNotifications(): Promise<void> {
  if (!isNative()) {
    console.log("Push notifications only available on native platforms");
    return;
  }

  // Request permission to use push notifications
  const result = await PushNotifications.requestPermissions();

  if (result.receive === "granted") {
    // Register with Apple / Google to receive push notifications
    await PushNotifications.register();
  }
}

/**
 * Add push notification handlers for different events
 */
export function addPushNotificationListeners(callbacks: {
  onRegistration?: (token: string) => void;
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onActionPerformed?: (notification: PushNotificationSchema) => void;
}): () => void {
  if (!isNative()) {
    return () => {/* No cleanup needed for web */};
  }

  // On registration success
  const registrationListener = PushNotifications.addListener("registration", (token) => {
    console.log("Push registration success:", token.value);
    if (callbacks.onRegistration) {
      callbacks.onRegistration(token.value);
    }
  });

  // On notification received when app is in foreground
  const notificationListener = PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push notification received:", notification);
    if (callbacks.onNotificationReceived) {
      callbacks.onNotificationReceived(notification);
    }
  });

  // On notification action performed (notification was tapped)
  const actionListener = PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
    console.log("Push notification action performed:", notification);
    if (callbacks.onActionPerformed) {
      callbacks.onActionPerformed(notification.notification);
    }
  });

  // Return cleanup function
  return () => {
    registrationListener.remove();
    notificationListener.remove();
    actionListener.remove();
  };
}

/**
 * Set the color of the status bar (Android only)
 */
export async function setStatusBarColor(color: string, darkContent = false): Promise<void> {
  if (isNative()) {
    try {
      // Set color (Android)
      await StatusBar.setBackgroundColor({ color });
      
      // Set style (iOS & Android)
      if (darkContent) {
        await StatusBar.setStyle({ style: "dark" });
      } else {
        await StatusBar.setStyle({ style: "light" });
      }
    } catch (error) {
      console.error("Error setting status bar color:", error);
    }
  }
}

/**
 * Hide the status bar (full-screen mode)
 */
export async function hideStatusBar(): Promise<void> {
  if (isNative()) {
    try {
      await StatusBar.hide();
    } catch (error) {
      console.error("Error hiding status bar:", error);
    }
  }
}

/**
 * Show the status bar
 */
export async function showStatusBar(): Promise<void> {
  if (isNative()) {
    try {
      await StatusBar.show();
    } catch (error) {
      console.error("Error showing status bar:", error);
    }
  }
}

/**
 * Take a photo using the device camera
 */
export async function takePhoto(): Promise<string | null> {
  if (!isNative()) {
    console.log("Camera access only available on native platforms");
    return null;
  }

  try {
    const image = await CapCamera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
    });

    return image.webPath || null;
  } catch (error) {
    console.error("Error taking photo:", error);
    return null;
  }
}

/**
 * Get the platform name (ios, android, web)
 */
export function getPlatform(): string {
  return Capacitor.getPlatform();
}

/**
 * Initialize Capacitor and its plugins
 * This function is called at app startup to configure all native features
 */
export async function initializeCapacitor(): Promise<void> {
  if (!isNative()) {
    console.log('Not running on a native platform, skipping Capacitor initialization');
    return;
  }

  try {
    console.log('Initializing Capacitor...');
    
    // Configure status bar
    await StatusBar.setBackgroundColor({ color: '#4CAF50' });
    await StatusBar.setStyle({ style: 'light' });
    
    // Hide splash screen with a fade effect
    setTimeout(async () => {
      await SplashScreen.hide({
        fadeOutDuration: 300
      });
    }, 1000);
    
    console.log('Capacitor initialization complete');
  } catch (error) {
    console.error('Error initializing Capacitor:', error);
  }
}