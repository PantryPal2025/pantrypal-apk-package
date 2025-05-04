import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pantrypal.app',
  appName: 'PantryPal',
  webDir: 'client/dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true // Allow HTTP during development
  },
  android: {
    buildOptions: {
      // Android build options
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      signingType: 'apksigner'
    }
  }
};

export default config;
