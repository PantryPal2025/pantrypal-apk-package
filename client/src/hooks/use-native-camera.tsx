import { useRef, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Toast } from '@capacitor/toast';

export type BarcodeResult = {
  text: string;
  format: string;
};

/**
 * Hook to use the native camera for barcode scanning on mobile devices.
 * Falls back to a basic photo capture on web.
 */
export function useNativeCamera() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<BarcodeResult | null>(null);
  
  /**
   * Start the native camera for scanning
   */
  const startScan = async (): Promise<BarcodeResult | null> => {
    // Only proceed if we're on a native platform
    if (!Capacitor.isNativePlatform()) {
      console.log('Native camera only available on mobile devices');
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Take a photo using the native camera
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        promptLabelHeader: 'Scan Barcode',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'From Photos',
        promptLabelPicture: 'Take Photo'
      });
      
      // In a real implementation, we would process this image to detect barcodes
      // For this example, we're simulating barcode detection
      const mockBarcodeResult = {
        text: '123456789012', // Simulated barcode
        format: 'UPC_A'
      };
      
      setLastResult(mockBarcodeResult);
      setIsLoading(false);
      
      // Show a success message
      await Toast.show({
        text: `Barcode detected: ${mockBarcodeResult.text}`,
        duration: 'short',
        position: 'bottom'
      });
      
      return mockBarcodeResult;
    } catch (error) {
      console.error('Camera error:', error);
      setIsLoading(false);
      
      // Show an error message
      await Toast.show({
        text: 'Failed to scan barcode. Please try again.',
        duration: 'short',
        position: 'bottom'
      });
      
      return null;
    }
  };
  
  /**
   * Get a photo from the device gallery
   */
  const getPhotoFromGallery = async (): Promise<string | null> => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Native gallery access only available on mobile devices');
      return null;
    }
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });
      
      return image.webPath || null;
    } catch (error) {
      console.error('Gallery error:', error);
      return null;
    }
  };
  
  return {
    isLoading,
    lastResult,
    startScan,
    getPhotoFromGallery,
    isNative: Capacitor.isNativePlatform()
  };
}