import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface PlatformInfo {
  isNative: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
  platform: string;
}

export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    isNative: false,
    isAndroid: false,
    isIOS: false,
    isWeb: true,
    platform: 'web'
  });

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    
    setPlatformInfo({
      isNative,
      isAndroid: platform === 'android',
      isIOS: platform === 'ios',
      isWeb: platform === 'web',
      platform
    });
  }, []);

  return platformInfo;
}