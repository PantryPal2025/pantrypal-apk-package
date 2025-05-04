import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Map of deep link paths to their corresponding app routes
 */
const DEEP_LINK_ROUTES: Record<string, string> = {
  '/scan': '/inventory/scan',
  '/recipe/add': '/recipes/add',
  '/shopping': '/shopping',
  '/inventory': '/inventory',
  '/recipes': '/recipes'
};

/**
 * Hook to handle deep linking in the app
 */
export function useDeepLinks() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Only register deep link listeners on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Handle app open from a deep link
    const handleUrlOpen = (event: URLOpenListenerEvent) => {
      const slug = event.url.split('pantrypal://').pop();
      
      if (!slug) return;
      
      // Find matching route or fallback to home
      const matchedRoute = Object.entries(DEEP_LINK_ROUTES).find(([key]) => 
        slug.startsWith(key.replace('/', ''))
      );
      
      if (matchedRoute) {
        // Navigate to the matched route
        const [, route] = matchedRoute;
        setLocation(route);
      } else {
        // Fallback to home route if no match
        setLocation('/');
      }
    };

    // Listen for deep link events
    const urlOpenListener = App.addListener('appUrlOpen', handleUrlOpen);

    // Cleanup listener on unmount
    return () => {
      urlOpenListener.remove();
    };
  }, [setLocation]);
}

/**
 * Parse app URL parameters from a deep link
 * @param url The deep link URL
 * @returns Object containing parameter key-value pairs
 */
export function parseDeepLinkParams(url: string): Record<string, string> {
  try {
    const params: Record<string, string> = {};
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  } catch (error) {
    console.error('Error parsing deep link params:', error);
    return {};
  }
}