import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductData, EnhancedProductData } from '@/types/product';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { X, Camera, QrCode, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';

interface InlineScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onProductComplete: (product: EnhancedProductData) => void;
}

enum ScanMode {
  SCANNING,
  LOADING,
  PRODUCT_FORM
}

export function InlineScanner({ isOpen, onClose, onProductComplete }: InlineScannerProps) {
  const [mode, setMode] = useState<ScanMode>(ScanMode.SCANNING);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ProductData | null>(null);
  
  // Form state for found product
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<string>(MeasurementUnit.COUNT);
  const [category, setCategory] = useState<string>(FoodCategory.OTHER);
  const [location, setLocation] = useState<string>(StorageLocation.PANTRY);
  const [expirationDate, setExpirationDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd')
  );
  const [notes, setNotes] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const { toast } = useToast();
  
  // Update form when product is found
  useEffect(() => {
    if (scannedProduct) {
      setName(scannedProduct.name || 'Unknown Product');
      setQuantity(scannedProduct.quantity || 1);
      setNotes(scannedProduct.notes || '');
    }
  }, [scannedProduct]);
  
  // Function to play a beep sound when a barcode is detected
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
  
  // Clean up all camera resources
  const cleanupResources = () => {
    if (codeReaderRef.current) {
      try {
        console.log('Stopping code reader');
        // Reset the reader - release camera
        codeReaderRef.current.stopAsyncDecode();
        codeReaderRef.current.stopContinuousDecode();
        
        // Reset streams
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      } catch (e) {
        console.error('Error stopping code reader:', e);
      }
    }
    scanningRef.current = false;
  };
  
  // Start barcode scanning
  const startScanning = async () => {
    try {
      // First, clean up any existing resources
      cleanupResources();
      
      // Reset state
      setBarcode(null);
      setError(null);
      setScanning(true);
      scanningRef.current = true;
      setMode(ScanMode.SCANNING);
      
      if (!videoRef.current) {
        setError('Video element not found');
        setScanning(false);
        return;
      }
      
      // Create a barcode reader if one doesn't exist
      if (!codeReaderRef.current) {
        console.log('Creating new barcode reader');
        codeReaderRef.current = new BrowserMultiFormatReader();
      }
      
      console.log('Starting barcode scanner');
      
      // Get available video devices
      try {
        // Using the default device (usually back camera on mobile)
        // Start continuous scanning
        const selectedDeviceId = null; // Use default
        
        await codeReaderRef.current.decodeFromVideoDevice(
          selectedDeviceId, 
          videoRef.current, 
          (result, err) => {
            if (result && scanningRef.current) {
              // Immediately prevent further scans
              scanningRef.current = false;
              
              const barcodeText = result.getText();
              console.log('Barcode detected:', barcodeText);
              
              // Play success sound
              playBeepSound();
              
              // Update state and look up product
              setBarcode(barcodeText);
              setScanning(false);
              setMode(ScanMode.LOADING);
              lookupBarcode(barcodeText);
            }
            
            // Error handling - ignore NotFoundException which is normal during scanning
            if (err && String(err) !== 'NotFoundException') {
              console.error('Scanning error:', err);
            }
          }
        );
        
        console.log('Barcode scanner started successfully');
      } catch (err) {
        console.error('Error starting scanner device:', err);
        setError('Could not start barcode scanner. Please try manual entry.');
        setScanning(false);
      }
    } catch (err) {
      console.error('Failed to initialize scanner:', err);
      setError('Camera access error. Please check permissions or use manual entry.');
      setScanning(false);
    }
  };
  
  // Initialize scanner when component mounts
  useEffect(() => {
    if (isOpen && mode === ScanMode.SCANNING) {
      // Wait a moment for dialog to render before starting scanner
      const timer = setTimeout(() => {
        startScanning();
      }, 500);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    // Clean up on unmount or when dialog closes
    return () => {
      cleanupResources();
    };
  }, [isOpen, mode]);
  
  // Handle manual barcode submission
  const handleManualSubmit = () => {
    if (!manualBarcode.trim()) {
      toast({
        title: 'Enter Barcode',
        description: 'Please enter a barcode number below.',
        variant: 'default'
      });
      return;
    }
    
    // Stop camera scanning
    cleanupResources();
    
    // Process the barcode
    setBarcode(manualBarcode);
    setScanning(false);
    setMode(ScanMode.LOADING);
    lookupBarcode(manualBarcode);
  };
  
  // Handle clean close
  const handleClose = () => {
    cleanupResources();
    onClose();
  };
  
  // Restart scanner if it stops
  const handleRestartScanner = () => {
    setScannedProduct(null);
    startScanning();
  };
  
  // Handle saving the product form
  const handleSaveProduct = () => {
    if (!scannedProduct) return;
    
    // Create enhanced product with form data
    const enhancedProduct: EnhancedProductData = {
      ...scannedProduct,
      name,
      quantity,
      unit,
      category,
      location,
      expirationDate,
      notes,
      price: scannedProduct.price || 0 // Ensure price is always set
    };
    
    console.log('Saving product with data:', enhancedProduct);
    
    // Call the onScanComplete callback
    onProductComplete(enhancedProduct);
    
    // Close the scanner
    handleClose();
    
    toast({
      title: 'Product Saved',
      description: `${name} has been prepared for adding to inventory.`,
    });
  };
  
  // Lookup barcode in the API
  const lookupBarcode = async (barcodeText: string) => {
    try {
      console.log('Looking up barcode:', barcodeText);
      
      // Call your server endpoint to look up the product
      const response = await apiRequest('GET', `/api/products/barcode/${barcodeText}`);
      
      if (response.ok) {
        const productData = await response.json();
        console.log('API response:', productData);
        
        if (productData && productData.product) {
          // Process the product data
          const { product } = productData;
          
          // Extract nutrition information
          const nutrients = product.nutriments || {};
          let allergens: string[] = [];
          
          if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
            allergens = product.allergens_tags.map((allergen: string) => {
              return allergen.replace('en:', '');
            });
          }
          
          // Create a simplified product object
          const processedProduct: ProductData = {
            name: product.product_name || 'Unknown Product',
            brand: product.brands || '',
            category: 'OTHER',
            barcode: barcodeText,
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
            notes: `Barcode: ${barcodeText}\n${product.ingredients_text ? `Ingredients: ${product.ingredients_text}` : ''}`
          };
          
          console.log('Processed product data:', processedProduct);
          toast({
            title: "Product found",
            description: `${processedProduct.name} found. Complete the details to add to inventory.`,
          });
          
          // Set the product and mode
          setScannedProduct(processedProduct);
          setMode(ScanMode.PRODUCT_FORM);
        } else {
          toast({
            title: 'Product Not Found',
            description: 'No information found for this barcode. Please enter details manually.',
            variant: 'destructive',
          });
          
          // Still provide a basic product with the barcode
          const basicProduct: ProductData = {
            name: 'Unknown Product',
            brand: '',
            category: 'OTHER',
            barcode: barcodeText,
            imageUrl: '',
            quantity: 1,
            notes: `Barcode: ${barcodeText}`
          };
          
          setScannedProduct(basicProduct);
          setMode(ScanMode.PRODUCT_FORM);
        }
      } else {
        throw new Error('Error looking up barcode');
      }
    } catch (error) {
      console.error('Error looking up barcode:', error);
      toast({
        title: 'Lookup Error',
        description: 'Failed to look up product information. Please try again or enter details manually.',
        variant: 'destructive',
      });
      
      // Call with a basic product
      const basicProduct: ProductData = {
        name: 'Unknown Product',
        brand: '',
        category: 'OTHER',
        barcode: barcodeText,
        imageUrl: '',
        quantity: 1,
        notes: `Barcode: ${barcodeText}`
      };
      
      setScannedProduct(basicProduct);
      setMode(ScanMode.PRODUCT_FORM);
    }
  };
  
  // Render based on the current mode
  const renderContent = () => {
    switch (mode) {
      case ScanMode.SCANNING:
        return (
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
              
              {/* Scanning indicator */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-2 bg-black/30 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center text-sm mb-4">
              <p>Position barcode within the scanning area</p>
              <p className="mt-1 text-muted-foreground">Or manually enter the barcode number below</p>
              
              {scanning ? (
                <p className="text-green-500 mt-2">Scanning active...</p>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRestartScanner}
                  className="mt-2"
                >
                  <Camera className="h-3.5 w-3.5 mr-1" />
                  Restart Scanner
                </Button>
              )}
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
        );
        
      case ScanMode.LOADING:
        return (
          <div className="text-center py-12">
            <p className="font-semibold mb-2">Barcode detected: {barcode}</p>
            <p className="text-gray-500 mb-4">Looking up product information...</p>
            <div className="flex justify-center">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        );
        
      case ScanMode.PRODUCT_FORM:
        if (!scannedProduct) return null;
        
        return (
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
              <Button type="button" variant="outline" onClick={handleRestartScanner}>
                Scan Again
              </Button>
              
              <Button type="button" onClick={handleSaveProduct}>
                <Check className="h-4 w-4 mr-2" />
                Save to Inventory
              </Button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-start pt-8 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden mb-8">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {mode === ScanMode.SCANNING && "Scan Product Barcode"}
            {mode === ScanMode.LOADING && "Looking Up Product"}
            {mode === ScanMode.PRODUCT_FORM && "Add to Inventory"}
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
          {error ? (
            <div className="text-red-500 mb-4">
              {error}
            </div>
          ) : null}
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
}