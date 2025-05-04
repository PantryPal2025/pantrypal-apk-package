import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Camera, ShoppingBag, Barcode, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BrowserMultiFormatReader, Result, DecodeHintType, BarcodeFormat } from '@zxing/library';

// Define interface for the barcode API result
interface BarcodeResult {
  product: {
    product_name: string;
    brands?: string;
    categories?: string;
    quantity?: string;
    image_url?: string;
    nutriments?: {
      energy?: number;
      "energy-kcal"?: number;
      fat?: number;
      "saturated-fat"?: number;
      carbohydrates?: number;
      sugars?: number;
      proteins?: number;
      salt?: number;
      fiber?: number;
    };
    nutrient_levels?: {
      fat?: string;
      salt?: string;
      sugars?: string;
      "saturated-fat"?: string;
    };
    ingredients_text?: string;
    allergens?: string;
    allergens_tags?: string[];
  };
  code: string;
  status: number;
  status_verbose: string;
}

// Interface for our product data structure
interface ProductData {
  name: string;
  brand?: string;
  category?: string;
  quantity?: string;
  expirationDate?: string;
  price?: number;
  count?: number;
  imageUrl?: string;
  nutritionInfo?: {
    calories?: number;
    fat?: number;
    carbs?: number;
    protein?: number;
    ingredients?: string;
    allergens?: string[];
  };
  barcode?: string;
}

// Props for the barcode scanner component
interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (productData: ProductData) => void;
}

export function BarcodeScanner({ isOpen, onClose, onProductFound }: BarcodeScannerProps) {
  // State variables
  const [manualBarcode, setManualBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [scanActive, setScanActive] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  
  const { toast } = useToast();
  
  // Initialize the barcode reader
  useEffect(() => {
    // Create barcode reader with specific formats
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8, 
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_128
    ]);
    
    // Create the reader instance
    const codeReader = new BrowserMultiFormatReader(hints);
    codeReaderRef.current = codeReader;
    
    // Cleanup on unmount
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);
  
  // Handle camera mode changes
  useEffect(() => {
    if (cameraMode && codeReaderRef.current && videoRef.current) {
      startScanning();
    } else {
      stopScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [cameraMode]);
  
  // Start the barcode scanning process
  const startScanning = async () => {
    if (!codeReaderRef.current || !videoRef.current) return;
    
    try {
      setScanActive(true);
      
      // Start continuous scanning
      console.log("Starting continuous scan...");
      const videoElem = videoRef.current;
      
      codeReaderRef.current.decodeFromVideoDevice(
        null, // Use default camera
        videoElem,
        (result: Result | null, error: any) => {
          if (result) {
            const barcode = result.getText();
            console.log("Detected barcode:", barcode);
            
            // Update UI with detected barcode
            setDetectedBarcode(barcode);
            
            // Stop scanning once a barcode is found to prevent multiple detections
            stopScanning();
            
            // Look up the product
            handleBarcodeScan(barcode);
          }
          
          if (error) {
            // This is just for scanning attempts, not a user-facing error
            console.log("Scanning attempt:", error);
          }
        }
      );
    } catch (err) {
      console.error("Error starting barcode scanner:", err);
      setScanActive(false);
      
      toast({
        title: "Camera Error",
        description: "Could not start the barcode scanner. Please try manual entry.",
        variant: "destructive",
      });
    }
  };
  
  // Stop the scanning process
  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      setScanActive(false);
    }
  };
  
  // Handle barcode lookup using the Open Food Facts API
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Looking up barcode:", barcode);
      
      // Call the API
      const response = await axios.get<BarcodeResult>(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      
      console.log("API response:", response.data);
      
      if (response.data.status === 1) {
        const { product, code } = response.data;
        
        // Process allergen tags to make them more readable
        const allergensList = product.allergens_tags?.map(allergen => {
          // Format: "en:allergen-name" -> "Allergen Name"
          const allergenName = allergen.split(':').pop() || '';
          return allergenName
            .replace(/-/g, ' ')
            .replace(/^./, str => str.toUpperCase());
        }) || [];
        
        // Extract calories
        const calories = product.nutriments?.["energy-kcal"] || 
                        (product.nutriments?.energy ? product.nutriments.energy / 4.184 : undefined);
        
        // Map the API response to our product data structure
        const productData: ProductData = {
          name: product.product_name || 'Unknown Product',
          brand: product.brands,
          category: mapCategoryFromOpenFoodFacts(product.categories),
          quantity: product.quantity,
          barcode: code,
          imageUrl: product.image_url,
          nutritionInfo: {
            calories: calories,
            fat: product.nutriments?.fat,
            carbs: product.nutriments?.carbohydrates,
            protein: product.nutriments?.proteins,
            ingredients: product.ingredients_text,
            allergens: allergensList
          }
        };
        
        console.log("Processed product data:", productData);
        
        // Call onProductFound with the product data but don't close yet
        // Let the parent component handle closing so the details form can be shown
        onProductFound(productData);
        
        toast({
          title: "Product found",
          description: `Found: ${productData.name}`,
        });
      } else {
        setError("Product not found in database. Try another barcode or enter details manually.");
        toast({
          title: "Product not found",
          description: "The barcode was scanned but no matching product was found.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error fetching product data:", err);
      setError("Failed to fetch product data. Please check your connection and try again.");
      toast({
        title: "Error",
        description: "Failed to fetch product data from Open Food Facts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loading, onClose, onProductFound, toast]);
  
  // Function to map Open Food Facts categories to our app categories
  const mapCategoryFromOpenFoodFacts = (categories?: string): string => {
    if (!categories) return 'Other';
    
    const lowercaseCategories = categories.toLowerCase();
    
    if (lowercaseCategories.includes('fruit') || lowercaseCategories.includes('vegetable')) {
      return 'Produce';
    } else if (lowercaseCategories.includes('milk') || lowercaseCategories.includes('dairy') || lowercaseCategories.includes('cheese')) {
      return 'Dairy';
    } else if (lowercaseCategories.includes('meat') || lowercaseCategories.includes('beef') || lowercaseCategories.includes('pork') || lowercaseCategories.includes('chicken')) {
      return 'Meat';
    } else if (lowercaseCategories.includes('bread') || lowercaseCategories.includes('bakery')) {
      return 'Bakery';
    } else if (lowercaseCategories.includes('rice') || lowercaseCategories.includes('grain') || lowercaseCategories.includes('pasta') || lowercaseCategories.includes('cereal')) {
      return 'Grains';
    } else if (lowercaseCategories.includes('frozen')) {
      return 'Frozen';
    } else if (lowercaseCategories.includes('canned') || lowercaseCategories.includes('preserved')) {
      return 'Canned Goods';
    } else if (lowercaseCategories.includes('spice') || lowercaseCategories.includes('herb')) {
      return 'Spices';
    } else {
      return 'Other';
    }
  };
  
  // Handle manual barcode submission
  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      handleBarcodeScan(manualBarcode.trim());
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cameraMode ? "Barcode Scanner" : "Product Lookup"}</DialogTitle>
          <DialogDescription>
            {cameraMode 
              ? "Hold a barcode in front of the camera for automatic scanning" 
              : "Enter a barcode manually or use the camera scanner"}
          </DialogDescription>
        </DialogHeader>
        
        {cameraMode ? (
          // Camera view
          <div className="relative overflow-hidden rounded-md bg-background">
            <div className="aspect-square w-full max-h-[350px] relative">
              <div className="flex flex-col items-center justify-center w-full h-full bg-black">
                {/* Video element for camera feed */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning guide overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className={`w-4/5 h-16 border-2 ${scanActive ? 'border-primary' : 'border-white'} rounded-md border-dashed ${scanActive ? 'animate-pulse' : ''}`}></div>
                  <p className="text-white text-xs mt-2 bg-black/50 px-2 py-1 rounded">
                    {detectedBarcode 
                      ? `Detected: ${detectedBarcode}` 
                      : "Position barcode within the frame"}
                  </p>
                  
                  {/* Scanning status indicator */}
                  <div className="absolute top-2 right-2 flex items-center bg-black/70 text-white text-xs px-2 py-1 rounded">
                    <div className={`w-2 h-2 rounded-full mr-1 ${scanActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    {scanActive ? "Scanning active" : "Scan paused"}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-black/70 text-white border-white/30 hover:bg-black/90"
                    onClick={() => setCameraMode(false)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    variant={scanActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => {
                      if (scanActive) {
                        stopScanning();
                      } else {
                        setDetectedBarcode(null);
                        startScanning();
                      }
                    }}
                  >
                    {scanActive ? "Stop Scan" : "Start Scan"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Options view
          <div className="flex flex-col">
            {loading ? (
              // Loading state
              <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Searching for product...</p>
              </div>
            ) : error ? (
              // Error state
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 w-full mb-4">
                  <p className="text-destructive text-center">{error}</p>
                </div>
                <Button 
                  onClick={() => setError(null)}
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              // Default state
              <>
                {/* Manual barcode entry */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Barcode className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium text-blue-700">Enter Barcode Manually</h3>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter barcode number"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleManualSubmit}
                      disabled={!manualBarcode.trim()}
                      size="sm"
                    >
                      Search
                    </Button>
                  </div>
                </div>
                
                {/* Camera scanner button */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="h-4 w-4 text-green-600" />
                    <h3 className="font-medium text-green-700">Scan with Camera</h3>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    Use your device camera to scan product barcodes automatically
                  </div>
                  <Button 
                    onClick={() => setCameraMode(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Open Camera Scanner
                  </Button>
                </div>
                
                {/* Sample products */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium text-blue-700">Sample Products</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 w-full mb-3">
                    <Button 
                      type="button"
                      variant="outline"
                      className="h-[90px] flex flex-col items-center justify-center gap-1 p-2 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => handleBarcodeScan('737628064502')}
                    >
                      <span className="text-2xl mb-1">🍲</span>
                      <span className="text-sm font-medium">Thai Kitchen</span>
                      <span className="text-xs text-muted-foreground">Rice Noodles</span>
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline"
                      className="h-[90px] flex flex-col items-center justify-center gap-1 p-2 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => handleBarcodeScan('8000500310427')}
                    >
                      <span className="text-2xl mb-1">🥜</span>
                      <span className="text-sm font-medium">Nutella</span>
                      <span className="text-xs text-muted-foreground">Hazelnut Spread</span>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Button 
                      type="button"
                      variant="outline"
                      className="h-[90px] flex flex-col items-center justify-center gap-1 p-2 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => handleBarcodeScan('5000112555158')}
                    >
                      <span className="text-2xl mb-1">🥤</span>
                      <span className="text-sm font-medium">Coca Cola</span>
                      <span className="text-xs text-muted-foreground">2L Bottle</span>
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline"
                      className="h-[90px] flex flex-col items-center justify-center gap-1 p-2 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => handleBarcodeScan('038000138416')}
                    >
                      <span className="text-2xl mb-1">🍪</span>
                      <span className="text-sm font-medium">Oreo Cookies</span>
                      <span className="text-xs text-muted-foreground">Original</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        <DialogFooter className="flex space-x-2 flex-row items-center mt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}