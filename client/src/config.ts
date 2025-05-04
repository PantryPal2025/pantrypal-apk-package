import { Capacitor } from '@capacitor/core';

interface AppConfig {
  apiUrl: string;
  appName: string;
  version: string;
  isProduction: boolean;
  platform: string;
}

// Determine if we're running in production
const isProduction = import.meta.env.PROD === true;

// Determine if we're running on a native device
const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();

// URLs for different environments
const devApiUrl = 'http://localhost:5000'; // Local development
const prodWebApiUrl = 'https://pantrypal.app'; // Production web
const prodNativeApiUrl = 'https://pantrypal.app'; // Production mobile API URL

// Select the appropriate API URL based on environment
let apiUrl = devApiUrl;
if (isProduction) {
  apiUrl = isNative ? prodNativeApiUrl : prodWebApiUrl;
}

// You can override the API URL with an environment variable
if (import.meta.env.VITE_API_URL) {
  apiUrl = import.meta.env.VITE_API_URL;
}

const config: AppConfig = {
  apiUrl,
  appName: 'PantryPal',
  version: '1.0.0',
  isProduction,
  platform
};

export default config;