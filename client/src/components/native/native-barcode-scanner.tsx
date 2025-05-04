import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useNativeCamera, BarcodeResult } from "@/hooks/use-native-camera";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Capacitor } from '@capacitor/core';

interface NativeBarcodeProps {
  onBarcodeDetected: (barcode: string) => void;
  onCancel: () => void;
}

export function NativeBarcodeScanner({ onBarcodeDetected, onCancel }: NativeBarcodeProps) {
  const { isLoading, lastResult, startScan, isNative } = useNativeCamera();
  const [showNativeNotice, setShowNativeNotice] = useState(!isNative);
  
  const handleScan = async () => {
    const result = await startScan();
    if (result && result.text) {
      onBarcodeDetected(result.text);
    }
  };
  
  // Show a notice when not running on a native platform
  if (showNativeNotice) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Native Scanner Unavailable</CardTitle>
          <CardDescription>
            Native camera scanning is only available when running on a mobile device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You are currently running PantryPal in a web browser. For the best barcode scanning experience, please install the PantryPal app on your Android device.
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowNativeNotice(false)}
          >
            Continue with limited functionality
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Scan Barcode</CardTitle>
        <CardDescription>
          Scan a product barcode to add it to your inventory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center min-h-[200px] bg-muted rounded-md">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
              <p className="mt-4 text-sm">Scanning...</p>
            </div>
          ) : lastResult ? (
            <div className="flex flex-col items-center">
              <div className="text-success">
                <Icon name="check" className="w-16 h-16" />
              </div>
              <p className="mt-2 font-semibold">{lastResult.text}</p>
              <p className="text-xs text-muted-foreground">Format: {lastResult.format}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <Icon name="barcode" className="w-16 h-16" />
              <p className="mt-2 text-sm">Press the scan button to activate the camera</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          disabled={isLoading} 
          onClick={handleScan}
          className="bg-gradient-to-r from-green-500 to-emerald-700 hover:from-green-600 hover:to-emerald-800"
        >
          {isLoading ? "Scanning..." : "Scan Barcode"}
        </Button>
      </CardFooter>
    </Card>
  );
}