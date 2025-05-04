import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrowserMultiFormatReader } from '@zxing/library';
import { ProductData } from '@/types/product';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: ProductData) => void;
}

export function BasicBarcodeScanner({ isOpen, onClose, onProductFound }: BarcodeScannerProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef(false);
  
  // Initialize and start scanning
  useEffect(() => {
    if (!isOpen || !videoRef.current) return;
    
    const startScanning = async () => {
      try {
        // Create a new code reader if needed
        if (!codeReader.current) {
          codeReader.current = new BrowserMultiFormatReader();
        }
        
        setError(null);
        setScanning(true);
        scanningRef.current = true;
        
        // Try to get a video stream
        const videoInputDevices = await codeReader.current.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          setError('No camera found. Please check your device permissions.');
          setScanning(false);
          return;
        }
        
        // Use the default device (usually back camera on mobile)
        const selectedDeviceId = null; // Use default
        
        try {
          // Start continuous scanning
          await codeReader.current.decodeFromVideoDevice(
            selectedDeviceId, 
            videoRef.current, 
            async (result, error) => {
              if (error) {
                // This is expected, just continue scanning
                return;
              }
              
              if (result && scanningRef.current) {
                scanningRef.current = false; // Prevent multiple detections
                
                const barcode = result.getText();
                console.log('Barcode detected:', barcode);
                
                // Stop scanning immediately
                if (codeReader.current) {
                  try {
                    codeReader.current.reset();
                  } catch (e) {
                    console.error('Error resetting code reader:', e);
                  }
                }
                
                // Get product data
                await lookupProduct(barcode);
              }
            }
          );
        } catch (err) {
          setError('Error starting barcode scanner. Please try again.');
          setScanning(false);
          console.error('Scanner initialization error:', err);
        }
      } catch (err) {
        setError('Camera access error. Please check permissions.');
        setScanning(false);
        console.error('Camera access error:', err);
      }
    };
    
    startScanning();
    
    // Cleanup function
    return () => {
      if (codeReader.current) {
        try {
          codeReader.current.reset();
        } catch (e) {
          console.error('Error cleaning up scanner:', e);
        }
      }
      scanningRef.current = false;
    };
  }, [isOpen]);
  
  // Look up product from barcode
  const lookupProduct = async (barcode: string) => {
    try {
      // Use the Open Food Facts API
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1) {
        const product = data.product;
        
        // Extract nutrition data
        const nutrients = product.nutriments || {};
        const nutritionData = {
          calories: nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || (nutrients['energy_100g'] ? nutrients['energy_100g'] / 4.184 : 0) || 0,
          fat: nutrients['fat_100g'] || 0,
          carbs: nutrients['carbohydrates_100g'] || 0,
          protein: nutrients['proteins_100g'] || 0,
          ingredients: product.ingredients_text,
          allergens: product.allergens_tags ? product.allergens_tags.map((tag: string) => tag.replace('en:', '')) : []
        };
        
        // Create product data
        const productData: ProductData = {
          name: product.product_name || 'Unknown Product',
          brand: product.brands || '',
          category: 'OTHER',
          barcode: barcode,
          imageUrl: product.image_front_url || product.image_url,
          quantity: 1,
          nutritionInfo: nutritionData
        };
        
        // Add barcode to notes
        let notes = '';
        if (nutritionData.ingredients) {
          notes += `Ingredients: ${nutritionData.ingredients}\n\n`;
        }
        notes += `Barcode: ${barcode}`;
        productData.notes = notes;
        
        toast({
          title: "Product found",
          description: `${productData.name} found. Complete the details to add to inventory.`,
        });
        
        // First close the scanner
        onClose();
        
        // Wait a moment for animation to complete
        setTimeout(() => {
          // Then pass the product to parent
          onProductFound(productData);
        }, 300);
      } else {
        // Product not found
        const basicProduct: ProductData = {
          name: 'Unknown Product',
          barcode: barcode,
          category: 'OTHER',
          quantity: 1,
          notes: `Barcode: ${barcode}`,
          nutritionInfo: {
            calories: 0,
            fat: 0,
            carbs: 0,
            protein: 0,
            allergens: []
          }
        };
        
        toast({
          title: "Product not found",
          description: "No details found for this barcode. Basic information added.",
          variant: "destructive"
        });
        
        onClose();
        setTimeout(() => {
          onProductFound(basicProduct);
        }, 300);
      }
    } catch (err) {
      console.error('Error looking up product:', err);
      
      // Handle API error
      const basicProduct: ProductData = {
        name: `Product (${barcode})`,
        barcode: barcode,
        category: 'OTHER',
        quantity: 1,
        notes: `Barcode: ${barcode}`,
        nutritionInfo: {
          calories: 0,
          fat: 0,
          carbs: 0,
          protein: 0,
          allergens: []
        }
      };
      
      toast({
        title: "Error looking up product",
        description: "Could not fetch product details. Basic information added.",
        variant: "destructive"
      });
      
      onClose();
      setTimeout(() => {
        onProductFound(basicProduct);
      }, 300);
    }
  };
  
  // Handle manual close
  const handleClose = () => {
    if (codeReader.current) {
      try {
        codeReader.current.reset();
      } catch (e) {
        console.error('Error during scanner cleanup:', e);
      }
    }
    scanningRef.current = false;
    setScanning(false);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover bg-black rounded-md"
            playsInline
            muted
          />
          
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-2 bg-black/30 rounded-full">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md">
              <div className="p-4 text-white text-center">
                <p>{error}</p>
                <Button 
                  className="mt-2" 
                  variant="outline" 
                  onClick={handleClose}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
          
          {/* Scanning guide */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-full w-full flex items-center justify-center">
              <div className="border-2 border-white/70 rounded w-3/4 h-1/3"></div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-4">
          <p className="text-sm text-gray-500">
            Position the barcode within the scanning area
          </p>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}