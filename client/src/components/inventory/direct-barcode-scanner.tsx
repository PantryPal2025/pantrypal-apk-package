import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, X } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useToast } from '@/hooks/use-toast';
import { ProductData } from '@/types/product';

interface DirectBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (productData: ProductData) => void;
}

export function DirectBarcodeScanner({ isOpen, onClose, onScanComplete }: DirectBarcodeScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Sample product data for testing without a real barcode
  const sampleProducts: ProductData[] = [
    {
      barcode: '737628064502',
      name: 'Organic Bananas',
      brand: 'Dole',
      category: 'Produce',
      quantity: 1,
      imageUrl: 'https://images.openfoodfacts.org/images/products/073/762/806/4502/front_en.6.400.jpg',
      nutritionInfo: {
        calories: 105,
        protein: 1.3,
        fat: 0.4,
        carbs: 27,
        ingredients: 'Organic bananas',
        allergens: []
      }
    },
    {
      barcode: '021130126026',
      name: 'Organic Milk',
      brand: 'Horizon',
      category: 'Dairy',
      quantity: 1,
      imageUrl: 'https://images.openfoodfacts.org/images/products/002/113/012/6026/front_en.4.400.jpg',
      nutritionInfo: {
        calories: 150,
        protein: 8,
        fat: 8,
        carbs: 12,
        ingredients: 'Organic whole milk, vitamin D3',
        allergens: ['Milk']
      }
    },
    {
      barcode: '818290013814',
      name: 'Almond Butter',
      brand: 'Justin\'s',
      category: 'Pantry',
      quantity: 1,
      imageUrl: 'https://images.openfoodfacts.org/images/products/818/290/013/8146/front_en.4.400.jpg',
      nutritionInfo: {
        calories: 190,
        protein: 7,
        fat: 17,
        carbs: 7,
        ingredients: 'Dry roasted almonds, palm oil',
        allergens: ['Nuts']
      }
    }
  ];

  // Initialize the barcode reader
  useEffect(() => {
    if (isOpen) {
      const hints = new Map();
      hints.set(2, true); // TRY_HARDER
      
      // Create a reader with default settings
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      
      return () => {
        reader.reset();
      };
    }
  }, [isOpen]);

  // Start the camera when the dialog opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Start the camera
  const startCamera = useCallback(async () => {
    try {
      if (!videoRef.current) return;
      
      if (streamRef.current) {
        stopCamera();
      }
      
      setScanning(true);
      const constraints = {
        video: { facingMode: 'environment' }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current && readerRef.current) {
        videoRef.current.srcObject = stream;
        
        try {
          console.log('Scanning attempt:', constraints);
          
          // Start continuous scanning
          readerRef.current.decodeFromVideoDevice(
            null,
            videoRef.current,
            (result, error) => {
              if (result) {
                const barcode = result.getText();
                console.log('Detected barcode:', barcode);
                handleBarcodeDetected(barcode);
              }
              
              if (error && !(error instanceof NotFoundException)) {
                console.error('Scanning error:', error);
              }
            }
          );
        } catch (error) {
          console.error('Failed to start scanning:', error);
          toast({
            title: 'Camera Error',
            description: 'Failed to access camera for scanning. Please try again or enter a code manually.',
            variant: 'destructive',
          });
          setScanning(false);
        }
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: 'Camera Access Denied',
        description: 'Please allow camera access to scan barcodes, or enter a barcode manually.',
        variant: 'destructive',
      });
      setScanning(false);
    }
  }, [toast]);

  // Stop the camera
  const stopCamera = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  }, []);

  // Handle barcode detection
  const handleBarcodeDetected = async (barcode: string) => {
    try {
      if (!barcode || barcode.trim() === '') return;
      
      stopCamera();
      setScanning(false);
      
      toast({
        title: 'Barcode Detected',
        description: `Searching for product: ${barcode}`,
      });
      
      console.log('Looking up barcode:', barcode);
      
      // Try to fetch product data from the Open Food Facts API
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      console.log('API response:', data);
      
      // If the product is found in the API
      if (data.status === 1 && data.product) {
        const product = data.product;
        
        // Extract the relevant data
        const productData: ProductData = {
          name: product.product_name || 'Unknown Product',
          brand: product.brands,
          category: 'Other', // Default category
          barcode: barcode,
          imageUrl: product.image_url,
          quantity: 1, // Default quantity as number
          nutritionInfo: {
            calories: product.nutriments ? (product.nutriments['energy-kcal_100g'] || 0) : 0,
            fat: product.nutriments ? (product.nutriments.fat_100g || 0) : 0,
            carbs: product.nutriments ? (product.nutriments.carbohydrates_100g || 0) : 0,
            protein: product.nutriments ? (product.nutriments.proteins_100g || 0) : 0,
            ingredients: product.ingredients_text,
            allergens: product.allergens_tags ? product.allergens_tags.map((a: string) => a.replace('en:', '')) : []
          }
        };
        
        console.log('Processed product data:', productData);
        onScanComplete(productData);
        onClose(); // This closes the scanner dialog, but the parent should then show the details dialog
      } else {
        // If the product is not found in the API, show an error
        toast({
          title: 'Product Not Found',
          description: 'Using a sample product instead. In a production app, you\'d enter details manually.',
          variant: 'destructive',
        });
        
        // Use a sample product for testing
        const sampleProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
        onScanComplete({...sampleProduct, barcode: barcode});
        onClose();
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      toast({
        title: 'Error Processing Barcode',
        description: 'Failed to look up product information. Using a sample product instead.',
        variant: 'destructive',
      });
      
      // Use a sample product for testing
      const sampleProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
      onScanComplete({...sampleProduct, barcode: barcode});
      onClose();
    }
  };

  // Handle manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeDetected(manualCode.trim());
    }
  };

  // Handle selecting a sample product
  const handleSelectSample = (sample: ProductData) => {
    onScanComplete(sample);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Scan Barcode</span>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => {
                // Clean close to make sure we don't interfere with product details dialog
                setScanning(false);
                if (videoRef.current && videoRef.current.srcObject) {
                  const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                  tracks.forEach(track => track.stop());
                }
                onClose();
              }} 
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Scan a product barcode or enter it manually
          </DialogDescription>
        </DialogHeader>
        
        {/* Camera View */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            playsInline
            muted
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Scanning indicator */}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-1 w-3/4 rounded overflow-hidden bg-black/20">
                <div className="h-full w-1/4 bg-primary animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
          
          {/* Camera controls */}
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full bg-white/30 backdrop-blur-sm hover:bg-white/50 transition-colors"
              onClick={startCamera}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        
        {/* Manual code entry */}
        <form onSubmit={handleManualSubmit} className="mt-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter barcode manually"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button type="submit" className="shrink-0">Submit</Button>
          </div>
        </form>
        
        {/* Sample products */}
        <div className="mt-2">
          <h3 className="text-sm font-medium mb-2">Or select a sample product:</h3>
          <div className="grid grid-cols-1 gap-2">
            {sampleProducts.map((sample, index) => (
              <button
                key={index}
                onClick={() => handleSelectSample(sample)}
                className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                  <Camera className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{sample.name}</p>
                  <p className="text-xs text-gray-500 truncate">{sample.brand} - {sample.barcode}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}