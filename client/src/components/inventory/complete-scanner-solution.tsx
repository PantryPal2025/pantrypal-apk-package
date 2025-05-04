import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrowserMultiFormatReader } from '@zxing/library';
import { ProductData, EnhancedProductData } from '@/types/product';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { FoodCategory, StorageLocation, MeasurementUnit, MeasurementUnitType, FoodCategoryType, StorageLocationType } from '@shared/schema';

interface CompleteScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onProductComplete: (product: EnhancedProductData) => void;
}

export function CompleteScanner({ isOpen, onClose, onProductComplete }: CompleteScannerProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Scanner stages
  const [stage, setStage] = useState<'scanning' | 'details'>('scanning');
  const [scannedProduct, setScannedProduct] = useState<ProductData | null>(null);
  
  // Product details state
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<MeasurementUnitType>(MeasurementUnit.COUNT);
  const [category, setCategory] = useState<FoodCategoryType>(FoodCategory.OTHER);
  const [location, setLocation] = useState<StorageLocationType>(StorageLocation.PANTRY);
  const [price, setPrice] = useState(0);
  const [expDate, setExpDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Set up barcode scanning
  useEffect(() => {
    if (!isOpen || !videoRef || stage !== 'scanning') return;

    const startScanning = async () => {
      try {
        setScanning(true);
        
        const constraints = {
          video: { facingMode: 'environment' }
        };
        
        console.log("Scanning attempt:", constraints);
        
        // Get video stream
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoRef.srcObject = stream;
        
        // Wait for video to be ready
        await videoRef.play();
        
        // Initialize barcode reader
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined, 
          videoRef, 
          async (result) => {
            if (result) {
              // Stop scanning when barcode is detected
              controls.stop();
              setScanning(false);
              
              const barcode = result.getText();
              console.log("Detected barcode:", barcode);
              
              // Look up product information
              await lookupBarcodeInfo(barcode);
            }
          }
        );
        
        return () => {
          controls.stop();
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please make sure you've granted camera permissions.");
        setScanning(false);
      }
    };
    
    const cleanup = startScanning();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [isOpen, videoRef, stage]);
  
  useEffect(() => {
    // Cleanup when dialog closes
    if (!isOpen && videoRef?.srcObject) {
      const stream = videoRef.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }, [isOpen, videoRef]);

  // Function to lookup barcode information
  const lookupBarcodeInfo = async (barcode: string) => {
    try {
      console.log("Looking up barcode:", barcode);
      
      // Call the Open Food Facts API
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      console.log("API response:", data);
      
      if (data.status === 1) {
        const product = data.product;
        
        // Extract nutrition data
        const nutrients = product.nutriments || {};
        const nutritionData = {
          calories: nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || nutrients['energy_100g'] / 4.184 || 0,
          fat: nutrients['fat_100g'] || 0,
          carbs: nutrients['carbohydrates_100g'] || 0,
          protein: nutrients['proteins_100g'] || 0,
          ingredients: product.ingredients_text,
          allergens: product.allergens_tags ? product.allergens_tags.map((tag: string) => tag.replace('en:', '')) : []
        };
        
        // Create product data object
        const productData: ProductData = {
          name: product.product_name || 'Unknown Product',
          brand: product.brands || '',
          category: 'Other',
          barcode: barcode,
          imageUrl: product.image_front_url || product.image_url,
          quantity: 1,
          nutritionInfo: nutritionData
        };
        
        console.log("Processed product data:", productData);
        setScannedProduct(productData);
        
        // Create nutrition notes
        let notes = '';
        if (productData.nutritionInfo) {
          const nutritionInfo = productData.nutritionInfo;
          notes = 'Nutrition Info:\n';
          
          if (nutritionInfo.calories) notes += `Calories: ${nutritionInfo.calories}kcal\n`;
          if (nutritionInfo.protein) notes += `Protein: ${nutritionInfo.protein}g\n`;
          if (nutritionInfo.carbs) notes += `Carbs: ${nutritionInfo.carbs}g\n`;
          if (nutritionInfo.fat) notes += `Fat: ${nutritionInfo.fat}g\n`;
          
          if (nutritionInfo.ingredients) notes += `Ingredients: ${nutritionInfo.ingredients}\n`;
          
          if (nutritionInfo.allergens && nutritionInfo.allergens.length > 0) {
            notes += `Allergens: ${nutritionInfo.allergens.join(', ')}\n`;
          }
        }
        
        if (productData.barcode) {
          notes += `\nBarcode: ${productData.barcode}`;
        }
        
        // Create an updated product object with notes
        const productWithNotes: ProductData = {
          ...productData,
          notes
        };
        
        // Set product and move to details screen
        setScannedProduct(productWithNotes);
        setStage('details');
        
        toast({
          title: "Product found",
          description: `${productData.name} found. Please complete the product details.`,
        });
      } else {
        // Product not found, create a basic product
        const basicProduct: ProductData = {
          name: 'Unknown Product',
          barcode: barcode,
          category: 'Other',
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
          description: "We couldn't find detailed information for this barcode. Basic information has been added.",
        });
        
        setScannedProduct(basicProduct);
        setStage('details');
      }
    } catch (error) {
      console.error("Error looking up barcode:", error);
      
      // Create a basic product on error
      const basicProduct: ProductData = {
        name: `Product (${barcode})`,
        barcode: barcode,
        category: 'Other',
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
        description: "There was an error looking up the product. Basic information has been added.",
      });
      
      setScannedProduct(basicProduct);
      setStage('details');
    }
  };

  // Handle manual close
  const handleClose = () => {
    if (videoRef?.srcObject) {
      const stream = videoRef.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    setScanning(false);
    setStage('scanning');
    onClose();
  };
  
  // Handle saving product details
  const handleSaveProduct = () => {
    if (!scannedProduct) return;
    
    const enhancedProduct: EnhancedProductData = {
      ...scannedProduct,
      quantity,
      unit,
      category,
      location,
      price,
      expirationDate: expDate
    };
    
    console.log("Saving product with details:", enhancedProduct);
    onProductComplete(enhancedProduct);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {stage === 'scanning' ? 'Scan Barcode' : 'Product Details'}
          </DialogTitle>
        </DialogHeader>
        
        {stage === 'scanning' && (
          <>
            <div className="relative">
              <video
                ref={setVideoRef}
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
              
              {/* Scanning guides */}
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
          </>
        )}
        
        {stage === 'details' && scannedProduct && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <img 
                src={scannedProduct.imageUrl} 
                alt={scannedProduct.name} 
                className="w-16 h-16 object-contain bg-gray-100 rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/gray/white?text=No+Image';
                }}
              />
              <div>
                <h3 className="font-medium">{scannedProduct.name}</h3>
                {scannedProduct.brand && <p className="text-sm text-gray-500">{scannedProduct.brand}</p>}
              </div>
            </div>
            
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={unit}
                    onChange={(e) => {
                      const newUnit = e.target.value as MeasurementUnitType;
                      setUnit(newUnit);
                    }}
                  >
                    {Object.values(MeasurementUnit).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={category}
                    onChange={(e) => {
                      const newCategory = e.target.value as FoodCategoryType;
                      setCategory(newCategory);
                    }}
                  >
                    {Object.values(FoodCategory).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Storage Location</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={location}
                    onChange={(e) => {
                      const newLocation = e.target.value as StorageLocationType;
                      setLocation(newLocation);
                    }}
                  >
                    {Object.values(StorageLocation).map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
              
              {/* Nutrition info */}
              {scannedProduct.nutritionInfo && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Nutrition Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Calories: {Math.round(scannedProduct.nutritionInfo.calories)}kcal</div>
                    <div>Protein: {scannedProduct.nutritionInfo.protein}g</div>
                    <div>Carbs: {scannedProduct.nutritionInfo.carbs}g</div>
                    <div>Fat: {scannedProduct.nutritionInfo.fat}g</div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveProduct}
              >
                Add to Inventory
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}