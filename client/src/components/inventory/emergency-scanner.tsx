import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductData, EnhancedProductData } from '@/types/product';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Camera, QrCode, Loader2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';

interface EmergencyScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onProductComplete: (product: EnhancedProductData) => void;
}

export default function EmergencyScanner({ isOpen, onClose, onProductComplete }: EmergencyScannerProps) {
  // Mode tracking - scanning or showing form
  const [showScanner, setShowScanner] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Scanner refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();
  
  // Scanned product data
  const [barcode, setBarcode] = useState<string>('');
  const [scannedProduct, setScannedProduct] = useState<ProductData | null>(null);
  
  // Form data
  const [name, setName] = useState('Unknown Product');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<string>(MeasurementUnit.COUNT);
  const [category, setCategory] = useState<string>(FoodCategory.OTHER);
  const [location, setLocation] = useState<string>(StorageLocation.PANTRY);
  const [expirationDate, setExpirationDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd')
  );
  const [notes, setNotes] = useState('');
  
  // Start the camera
  useEffect(() => {
    if (isOpen && showScanner && !showForm) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [isOpen, showScanner, showForm]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);
  
  // Start the scanner
  const startScanner = async () => {
    try {
      // Stop any existing streams
      stopScanner();
      
      // Start scanner
      if (!videoRef.current) {
        toast({
          title: 'Scanner Error',
          description: 'Could not access camera element',
          variant: 'destructive'
        });
        return;
      }
      
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }
      
      console.log('Starting barcode scanner');
      
      // Start continuous decoding
      await codeReaderRef.current.decodeFromVideoDevice(
        null, // Use default device
        videoRef.current,
        (result, err) => {
          if (result) {
            // Get barcode
            const code = result.getText();
            
            // Play beep sound
            playBeepSound();
            
            // Set state
            console.log('Barcode detected:', code);
            setBarcode(code);
            
            // Stop scanner
            stopScanner();
            
            // Look up product
            lookupProduct(code);
          }
          
          if (err && err.toString() !== 'NotFoundException') {
            console.error('Scanner error:', err);
          }
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions or use manual entry.',
        variant: 'destructive'
      });
    }
  };
  
  // Stop the scanner
  const stopScanner = () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.stopAsyncDecode();
        codeReaderRef.current.stopContinuousDecode();
        
        // Release camera
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };
  
  // Play beep sound
  const playBeepSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 1800;
      gainNode.gain.value = 0.3;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(0);
      setTimeout(() => oscillator.stop(), 100);
    } catch (e) {
      console.log('Sound play error:', e);
    }
  };
  
  // Manual barcode entry
  const handleManualSubmit = () => {
    if (!manualBarcode.trim()) {
      toast({
        title: 'Enter Barcode',
        description: 'Please enter a barcode number',
        variant: 'default'
      });
      return;
    }
    
    // Stop scanning
    stopScanner();
    
    // Look up product
    setBarcode(manualBarcode);
    lookupProduct(manualBarcode);
  };
  
  // Look up product from barcode
  const lookupProduct = async (code: string) => {
    try {
      // Update UI
      setIsLoading(true);
      setShowScanner(false);
      
      console.log('Looking up barcode:', code);
      
      // Call API
      const response = await apiRequest('GET', `/api/products/barcode/${code}`);
      const data = await response.json();
      
      console.log('Product data:', data);
      
      if (data && data.product) {
        // Process the data
        const { product } = data;
        
        // Extract nutrition info
        const nutrients = product.nutriments || {};
        let allergens: string[] = [];
        
        if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
          allergens = product.allergens_tags.map((allergen: string) => 
            allergen.replace('en:', '')
          );
        }
        
        // Build product object
        const foundProduct: ProductData = {
          name: product.product_name || 'Unknown Product',
          brand: product.brands || '',
          category: 'OTHER',
          barcode: code,
          imageUrl: product.image_url || product.image_front_url || '',
          quantity: 1,
          nutritionInfo: {
            calories: nutrients.energy_value || nutrients['energy-kcal_100g'] || 0,
            fat: nutrients.fat_100g || 0,
            carbs: nutrients.carbohydrates_100g || 0,
            protein: nutrients.proteins_100g || 0,
            allergens: allergens,
            ingredients: product.ingredients_text || ''
          },
          notes: `Barcode: ${code}\n${product.ingredients_text ? `Ingredients: ${product.ingredients_text}` : ''}`
        };
        
        // Update state
        setName(foundProduct.name);
        setNotes(foundProduct.notes || '');
        setScannedProduct(foundProduct);
        
        toast({
          title: 'Product Found',
          description: `${foundProduct.name} found. Please complete the details.`
        });
      } else {
        // No product found
        const basicProduct: ProductData = {
          name: 'Unknown Product',
          brand: '',
          category: 'OTHER',
          barcode: code,
          imageUrl: '',
          quantity: 1,
          notes: `Barcode: ${code}`
        };
        
        setScannedProduct(basicProduct);
        
        toast({
          title: 'Product Not Found',
          description: 'No product information available. Please enter details manually.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error looking up product:', err);
      
      // Create basic product
      const basicProduct: ProductData = {
        name: 'Unknown Product',
        brand: '',
        category: 'OTHER',
        barcode: code,
        imageUrl: '',
        quantity: 1,
        notes: `Barcode: ${code}`
      };
      
      setScannedProduct(basicProduct);
      
      toast({
        title: 'Lookup Error',
        description: 'Failed to look up product information. Please enter details manually.',
        variant: 'destructive'
      });
    } finally {
      // Always show form
      setIsLoading(false);
      setShowForm(true);
    }
  };
  
  // Save the product
  const handleSaveProduct = () => {
    if (!scannedProduct) return;
    
    // Create enhanced product
    const enhancedProduct: EnhancedProductData = {
      ...scannedProduct,
      name,
      quantity,
      unit,
      category,
      location,
      expirationDate,
      notes,
      price: 0
    };
    
    // Call parent callback
    onProductComplete(enhancedProduct);
    
    // Close scanner
    toast({
      title: 'Product Saved',
      description: `${name} has been prepared for adding to inventory.`
    });
    
    handleClose();
  };
  
  // Close handler
  const handleClose = () => {
    stopScanner();
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-start pt-8 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden mb-8">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {showScanner && 'Scan Product Barcode'}
            {isLoading && 'Looking Up Product'}
            {showForm && 'Add to Inventory'}
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4">
          {showScanner && (
            <>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="border-2 border-yellow-400 border-dashed rounded w-3/4 h-1/3 flex items-center justify-center">
                    <QrCode className="text-yellow-400 h-8 w-8 opacity-50" />
                  </div>
                </div>
              </div>
              
              <div className="text-center text-sm mb-4">
                <p>Position barcode within the scanning area</p>
                <p className="mt-1 text-muted-foreground">Or manually enter the barcode below</p>
              </div>
              
              <div className="mt-4 border-t pt-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter barcode manually"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleManualSubmit();
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleManualSubmit}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {isLoading && (
            <div className="text-center py-12">
              <p className="font-semibold mb-2">Barcode detected: {barcode}</p>
              <p className="text-gray-500 mb-4">Looking up product information...</p>
              <div className="flex justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            </div>
          )}
          
          {showForm && scannedProduct && (
            <div className="space-y-4">
              {scannedProduct.imageUrl && (
                <div className="flex justify-center mb-2">
                  <img
                    src={scannedProduct.imageUrl}
                    alt={scannedProduct.name}
                    className="h-32 object-contain border rounded p-1"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {barcode && (
                <div className="bg-gray-50 p-2 rounded text-sm">
                  <span className="font-medium">Barcode:</span> {barcode}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    {Object.values(MeasurementUnit).map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {Object.values(FoodCategory).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    {Object.values(StorageLocation).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Expiration Date</label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full p-2 border rounded-md min-h-[80px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div className="pt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setShowScanner(true);
                    setScannedProduct(null);
                    setBarcode('');
                  }}
                >
                  Scan Again
                </Button>
                
                <Button type="button" onClick={handleSaveProduct}>
                  <Check className="h-4 w-4 mr-2" />
                  Save to Inventory
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}