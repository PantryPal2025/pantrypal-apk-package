import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';
import { useQueryClient } from '@tanstack/react-query';
import { useZxing } from 'react-zxing';
import { X, Info, Camera, Scan, Check, AlertTriangle } from 'lucide-react';
import PortionTrackingDialog from './portion-tracking-dialog';

// Product information interface
interface ProductInfo {
  name: string;
  brand: string;
  imageUrl: string;
  genericName?: string;
  packageQuantity?: string;
  
  // Nutrition
  calories?: string;
  fat?: string;
  carbs?: string;
  protein?: string;
  fiber?: string;
  salt?: string;
  sodium?: string;
  sugars?: string;
  saturatedFat?: string;
  servingSize?: string;
  ingredients?: string;
  allergens?: string[];
  
  // Scoring and ratings
  nutriScore?: string;
  novaGroup?: string;
  ecoScore?: string;
  environmentalImpact?: string;
  
  // Additional info
  packaging?: string;
  origin?: string;
  labels?: string;
  stores?: string;
  categories?: string;
  barcode: string;
}

type FoodCategoryType = typeof FoodCategory[keyof typeof FoodCategory];
type StorageLocationType = typeof StorageLocation[keyof typeof StorageLocation];
type MeasurementUnitType = typeof MeasurementUnit[keyof typeof MeasurementUnit];

interface LastResortFormProps {
  onSuccess: () => void;
}

export default function LastResortForm({ onSuccess }: LastResortFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FoodCategoryType>(FoodCategory.PRODUCE);
  const [location, setLocation] = useState<StorageLocationType>(StorageLocation.FRIDGE);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<MeasurementUnitType>(MeasurementUnit.COUNT);
  const [expirationDate, setExpirationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Barcode lookup
  const [barcode, setBarcode] = useState('');
  const [showLookup, setShowLookup] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // Product information
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showPortionTracking, setShowPortionTracking] = useState(false);
  const [showPortionTrackingDialog, setShowPortionTrackingDialog] = useState(false);
  
  // Barcode scanner setup
  const { ref: cameraRef, result, torch, start, stop } = useZxing({
    onDecodeResult(result) {
      const scannedBarcode = result.getText();
      setBarcode(scannedBarcode);
      setShowScanner(false);
      handleLookupWithBarcode(scannedBarcode);
    },
    paused: !showScanner,
  });
  
  // Cleanup camera when component unmounts or scanner is hidden
  useEffect(() => {
    return () => {
      if (stop) stop();
    };
  }, [stop]);
  
  // Pause scanner when dialog is closed
  useEffect(() => {
    if (!showLookup && stop) {
      setShowScanner(false);
      stop();
    }
  }, [showLookup, stop]);
  
  const handleLookupWithBarcode = async (barcodeValue: string) => {
    if (!barcodeValue) {
      return;
    }
    
    setLookupLoading(true);
    
    try {
      const response = await apiRequest('GET', `/api/products/barcode/${barcodeValue}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.product) {
          const { product } = data;
          
          // 1. Extract nutrition info
          const nutrients = product.nutriments || {};
          let allergens: string[] = [];
          
          if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
            allergens = product.allergens_tags.map((allergen: string) => 
              allergen.replace('en:', '')
            );
          }
          
          // 2. Determine product category from tags if available
          let category: FoodCategoryType = FoodCategory.OTHER;
          if (product.categories_tags && Array.isArray(product.categories_tags)) {
            const categories = product.categories_tags.map((c: string) => c.replace('en:', '').toLowerCase());
            
            if (categories.some((c: string) => c.includes('fruit') || c.includes('vegetable') || c.includes('produce'))) {
              category = FoodCategory.PRODUCE;
            } else if (categories.some((c: string) => c.includes('dairy') || c.includes('milk') || c.includes('cheese'))) {
              category = FoodCategory.DAIRY;
            } else if (categories.some((c: string) => c.includes('meat') || c.includes('poultry') || c.includes('fish') || c.includes('seafood'))) {
              category = FoodCategory.MEAT;
            } else if (categories.some((c: string) => c.includes('bakery') || c.includes('bread') || c.includes('pastry'))) {
              category = FoodCategory.BAKERY;
            } else if (categories.some((c: string) => c.includes('frozen'))) {
              category = FoodCategory.FROZEN;
            } else if (categories.some((c: string) => c.includes('beverage') || c.includes('drink'))) {
              // Handle category mapping for beverages
              category = FoodCategory.OTHER;
            } else if (categories.some((c: string) => c.includes('snack') || c.includes('candy') || c.includes('chocolate'))) {
              // Handle category mapping for snacks
              category = FoodCategory.OTHER;
            } else if (categories.some((c: string) => c.includes('condiment') || c.includes('sauce') || c.includes('spice'))) {
              category = FoodCategory.SPICES;
            }
          }
          
          // 3. Determine storage location based on category
          let location: StorageLocationType = StorageLocation.PANTRY;
          if (category === FoodCategory.MEAT || category === FoodCategory.DAIRY || 
              category === FoodCategory.PRODUCE) {
            location = StorageLocation.FRIDGE;
          } else if (category === FoodCategory.FROZEN) {
            location = StorageLocation.FREEZER;
          } else if (category === FoodCategory.SPICES) {
            location = StorageLocation.SPICE_RACK;
          }
          
          // 4. Set default expiration date based on category
          let expiryDate = new Date();
          if (category === FoodCategory.MEAT) {
            expiryDate.setDate(expiryDate.getDate() + 5); // 5 days for meat
          } else if (category === FoodCategory.DAIRY) {
            expiryDate.setDate(expiryDate.getDate() + 7); // 7 days for dairy
          } else if (category === FoodCategory.PRODUCE) {
            expiryDate.setDate(expiryDate.getDate() + 7); // 7 days for produce
          } else if (category === FoodCategory.BAKERY) {
            expiryDate.setDate(expiryDate.getDate() + 5); // 5 days for bakery
          } else {
            expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 months for non-perishables
          }
          
          // 5. Create structured product info object
          const productInfo: ProductInfo = {
            name: product.product_name || 'Unknown Product',
            brand: product.brands || '',
            imageUrl: product.image_url || '',
            barcode: barcodeValue,
            genericName: product.generic_name,
            packageQuantity: product.quantity,
            
            // Nutrition details with values rounded to 2 decimal places
            calories: nutrients.energy_value || nutrients['energy-kcal_100g'] 
              ? `${parseFloat(nutrients.energy_value || nutrients['energy-kcal_100g']).toFixed(2)}kcal` 
              : undefined,
            fat: nutrients.fat_100g ? `${parseFloat(nutrients.fat_100g).toFixed(2)}g` : undefined,
            carbs: nutrients.carbohydrates_100g ? `${parseFloat(nutrients.carbohydrates_100g).toFixed(2)}g` : undefined,
            protein: nutrients.proteins_100g ? `${parseFloat(nutrients.proteins_100g).toFixed(2)}g` : undefined,
            fiber: nutrients.fiber_100g ? `${parseFloat(nutrients.fiber_100g).toFixed(2)}g` : undefined,
            salt: nutrients.salt_100g ? `${parseFloat(nutrients.salt_100g).toFixed(2)}g` : undefined,
            sodium: nutrients.sodium_100g ? `${parseFloat(nutrients.sodium_100g).toFixed(2)}g` : undefined,
            sugars: nutrients.sugars_100g ? `${parseFloat(nutrients.sugars_100g).toFixed(2)}g` : undefined,
            saturatedFat: nutrients.saturated_fat_100g ? `${parseFloat(nutrients.saturated_fat_100g).toFixed(2)}g` : undefined,
            servingSize: product.serving_size,
            ingredients: product.ingredients_text,
            allergens: allergens.length > 0 ? allergens : undefined,
            
            // Scoring and certifications
            nutriScore: product.nutriscore_grade ? product.nutriscore_grade.toUpperCase() : undefined,
            novaGroup: product.nova_group ? `${product.nova_group}` : undefined,
            ecoScore: product.ecoscore_grade ? product.ecoscore_grade.toUpperCase() : undefined,
            environmentalImpact: product.ecoscore_score ? `${product.ecoscore_score}/100` : undefined,
            
            // Additional info
            packaging: product.packaging_text,
            origin: product.origins || product.countries,
            labels: product.labels && typeof product.labels === 'string' ? product.labels : undefined,
            stores: product.stores && typeof product.stores === 'string' ? product.stores : undefined,
            categories: product.categories && typeof product.categories === 'string' ? product.categories : undefined,
          };
          
          // 6. Update form fields with basic info
          setName(productInfo.name);
          setDescription(productInfo.brand);
          setCategory(category);
          setLocation(location);
          setExpirationDate(format(expiryDate, 'yyyy-MM-dd'));
          
          // 7. Save product info in state
          setProductInfo(productInfo);
          
          // 8. Build notes with product image URL and barcode reference
          let productNotes = `Barcode: ${barcodeValue}\n`;
          
          // Include image URL in notes for extraction in inventory list
          if (productInfo.imageUrl) {
            productNotes += `\nProduct Image: ${productInfo.imageUrl}\n`;
          }
          
          if (productInfo.ingredients) {
            productNotes += `\nIngredients: ${productInfo.ingredients}`;
          }
          if (productInfo.allergens && productInfo.allergens.length > 0) {
            productNotes += `\nAllergens: ${productInfo.allergens.join(', ')}`;
          }
          
          setNotes(productNotes);
          
          // 9. Show product details dialog
          setShowProductDetails(true);
          
          // Close lookup dialog
          setShowLookup(false);
          setBarcode('');
        } else {
          // Just set barcode in notes
          setName('Unknown Product');
          setNotes(`Barcode: ${barcodeValue}`);
          
          // Close lookup dialog
          setShowLookup(false);
          setBarcode('');
        }
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error looking up barcode:', err);
    } finally {
      setLookupLoading(false);
    }
  };
  
  const handleLookup = () => {
    handleLookupWithBarcode(barcode);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = {
        name,
        description,
        category,
        location,
        quantity,
        unit,
        expirationDate,
        notes
      };
      
      const response = await apiRequest('POST', '/api/inventory', data);
      
      if (response.ok) {
        const savedItem = await response.json();
        
        // Track inventory action in gamification system
        try {
          // Determine if barcode was used
          const usedBarcode = notes?.includes('Barcode:') || false;
          await apiRequest('POST', '/api/gamification/challenges/progress', {
            action: 'inventory_add',
            usedBarcode
          });
          
          // Refresh gamification data
          queryClient.invalidateQueries({ queryKey: ['/api/gamification/points'] });
          queryClient.invalidateQueries({ queryKey: ['/api/gamification/achievements'] });
          queryClient.invalidateQueries({ queryKey: ['/api/gamification/challenges'] });
        } catch (err) {
          console.error('Error updating gamification:', err);
          // Don't block the inventory addition even if gamification update fails
        }
        
        // Reset form
        setName('');
        setDescription('');
        setCategory(FoodCategory.PRODUCE as FoodCategoryType);
        setLocation(StorageLocation.FRIDGE as StorageLocationType);
        setQuantity(1);
        setUnit(MeasurementUnit.COUNT as MeasurementUnitType);
        setExpirationDate(format(new Date(), 'yyyy-MM-dd'));
        setNotes('');
        
        // Refresh inventory data
        queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 relative">
      {/* Full-screen product lookup animation */}
      {lookupLoading && (
        <div className="fixed inset-0 bg-gradient-to-b from-black/90 to-blue-900/90 z-50 flex flex-col items-center justify-center overflow-hidden">
          {/* Scanner line effect */}
          <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
            <div className="w-64 h-64 relative border-2 border-dashed border-blue-400 rounded-md">
              <div className="animate-scanner"></div>
            </div>
          </div>
          
          {/* Floating product icons */}
          <div className="absolute">
            <div className="grid grid-cols-3 gap-8">
              <div className="animate-float delay-150">
                <div className="h-10 w-10 relative bg-green-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="animate-float">
                <div className="h-12 w-12 relative bg-blue-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="animate-float delay-300">
                <div className="h-10 w-10 relative bg-amber-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="z-10 flex flex-col items-center">
            <div className="animate-bounce mb-4">
              <div className="h-16 w-16 relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75"></div>
                <div className="relative rounded-full h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-white text-xl font-bold mb-2">Finding Product</div>
            <div className="text-blue-200 text-center max-w-xs bg-black/30 p-3 rounded-lg backdrop-blur-sm">
              Searching product databases and fetching nutritional information...
            </div>
            <div className="mt-8 flex space-x-2">
              <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
              <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse delay-150"></div>
              <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse delay-300"></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Add New Item</h2>
        <div className="flex gap-2">
          {productInfo && (
            <>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md flex items-center"
                onClick={() => setShowProductDetails(true)}
              >
                <Info className="h-4 w-4 mr-1" />
                Product Info
              </button>
              
              {/* Meat Portion Tracking button - only show for meat category */}
              {category === FoodCategory.MEAT && (
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-md flex items-center"
                  onClick={() => setShowPortionTrackingDialog(true)}
                >
                  <Scan className="h-4 w-4 mr-1" />
                  Track Portions
                </button>
              )}
            </>
          )}
          <button
            type="button"
            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md"
            onClick={() => setShowLookup(true)}
          >
            Find Product
          </button>
        </div>
      </div>
      
      {/* Product Details Dialog */}
      {showProductDetails && productInfo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-auto">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Product Details</h3>
              <button 
                onClick={() => setShowProductDetails(false)} 
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className="flex flex-col">
                  {productInfo.imageUrl ? (
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                      <img 
                        src={productInfo.imageUrl} 
                        alt={productInfo.name} 
                        className="max-h-64 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
                      <p className="text-gray-400">No image available</p>
                    </div>
                  )}
                  
                  {/* Basic product information */}
                  <div className="mt-4">
                    <h2 className="text-xl font-bold">{productInfo.name}</h2>
                    {productInfo.brand && <p className="text-gray-700">{productInfo.brand}</p>}
                    {productInfo.genericName && <p className="text-gray-600 mt-1">{productInfo.genericName}</p>}
                    {productInfo.packageQuantity && (
                      <p className="text-gray-600 mt-1">Package: {productInfo.packageQuantity}</p>
                    )}
                    <p className="text-gray-500 mt-2">Barcode: {productInfo.barcode}</p>
                  </div>
                </div>
                
                {/* Product Details Sections */}
                <div className="space-y-6">
                  {/* Nutrition Information */}
                  <div>
                    <h4 className="text-md font-semibold mb-2 border-b pb-1">Nutrition Facts</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {productInfo.calories && (
                        <div className="text-sm"><span className="font-medium">Calories:</span> {productInfo.calories}</div>
                      )}
                      {productInfo.fat && (
                        <div className="text-sm"><span className="font-medium">Fat:</span> {productInfo.fat}</div>
                      )}
                      {productInfo.carbs && (
                        <div className="text-sm"><span className="font-medium">Carbs:</span> {productInfo.carbs}</div>
                      )}
                      {productInfo.protein && (
                        <div className="text-sm"><span className="font-medium">Protein:</span> {productInfo.protein}</div>
                      )}
                      {productInfo.fiber && (
                        <div className="text-sm"><span className="font-medium">Fiber:</span> {productInfo.fiber}</div>
                      )}
                      {productInfo.salt && (
                        <div className="text-sm"><span className="font-medium">Salt:</span> {productInfo.salt}</div>
                      )}
                      {productInfo.sodium && (
                        <div className="text-sm"><span className="font-medium">Sodium:</span> {productInfo.sodium}</div>
                      )}
                      {productInfo.sugars && (
                        <div className="text-sm"><span className="font-medium">Sugars:</span> {productInfo.sugars}</div>
                      )}
                      {productInfo.saturatedFat && (
                        <div className="text-sm"><span className="font-medium">Saturated Fat:</span> {productInfo.saturatedFat}</div>
                      )}
                    </div>
                    
                    {productInfo.servingSize && (
                      <div className="text-sm mt-2">
                        <span className="font-medium">Serving Size:</span> {productInfo.servingSize}
                      </div>
                    )}
                  </div>
                  
                  {/* Ingredients and Allergens */}
                  {(productInfo.ingredients || (productInfo.allergens && productInfo.allergens.length > 0)) && (
                    <div>
                      <h4 className="text-md font-semibold mb-2 border-b pb-1">Ingredients & Allergens</h4>
                      {productInfo.ingredients && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Ingredients:</span> {productInfo.ingredients}
                        </div>
                      )}
                      
                      {productInfo.allergens && productInfo.allergens.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Allergens:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {productInfo.allergens.map((allergen, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 bg-red-50 text-red-800 rounded-md text-xs"
                              >
                                {allergen}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Product Scores */}
                  {(productInfo.nutriScore || productInfo.ecoScore || productInfo.novaGroup) && (
                    <div>
                      <h4 className="text-md font-semibold mb-2 border-b pb-1">Product Ratings</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {productInfo.nutriScore && (
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-600">Nutrition</span>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                              ${productInfo.nutriScore === 'A' ? 'bg-green-500 text-white' : 
                                productInfo.nutriScore === 'B' ? 'bg-green-300 text-gray-800' : 
                                productInfo.nutriScore === 'C' ? 'bg-yellow-400 text-gray-800' : 
                                productInfo.nutriScore === 'D' ? 'bg-orange-400 text-gray-800' : 
                                productInfo.nutriScore === 'E' ? 'bg-red-500 text-white' : 
                                'bg-gray-200 text-gray-800'}`}
                            >
                              {productInfo.nutriScore || '?'}
                            </div>
                          </div>
                        )}
                        
                        {productInfo.ecoScore && (
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-600">Environment</span>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                              ${productInfo.ecoScore === 'A' ? 'bg-green-500 text-white' : 
                                productInfo.ecoScore === 'B' ? 'bg-green-300 text-gray-800' : 
                                productInfo.ecoScore === 'C' ? 'bg-yellow-400 text-gray-800' : 
                                productInfo.ecoScore === 'D' ? 'bg-orange-400 text-gray-800' : 
                                productInfo.ecoScore === 'E' ? 'bg-red-500 text-white' : 
                                'bg-gray-200 text-gray-800'}`}
                            >
                              {productInfo.ecoScore || '?'}
                            </div>
                          </div>
                        )}
                        
                        {productInfo.novaGroup && (
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-600">Processing</span>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                              ${productInfo.novaGroup === '1' ? 'bg-green-500 text-white' : 
                                productInfo.novaGroup === '2' ? 'bg-yellow-400 text-gray-800' : 
                                productInfo.novaGroup === '3' ? 'bg-orange-400 text-gray-800' : 
                                productInfo.novaGroup === '4' ? 'bg-red-500 text-white' : 
                                'bg-gray-200 text-gray-800'}`}
                            >
                              {productInfo.novaGroup || '?'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional information */}
                  <div>
                    <h4 className="text-md font-semibold mb-2 border-b pb-1">Additional Information</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {productInfo.origin && (
                        <div className="text-sm"><span className="font-medium">Origin:</span> {productInfo.origin}</div>
                      )}
                      {productInfo.packaging && (
                        <div className="text-sm"><span className="font-medium">Packaging:</span> {productInfo.packaging}</div>
                      )}
                      {productInfo.labels && (
                        <div className="text-sm"><span className="font-medium">Labels:</span> {productInfo.labels}</div>
                      )}
                      {productInfo.stores && (
                        <div className="text-sm"><span className="font-medium">Stores:</span> {productInfo.stores}</div>
                      )}
                      {productInfo.categories && (
                        <div className="text-sm"><span className="font-medium">Categories:</span> {productInfo.categories}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                  onClick={() => setShowProductDetails(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Product Lookup Dialog */}
      {showLookup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Look up Product by Barcode</h3>
              <button 
                onClick={() => {
                  setShowLookup(false);
                  setShowScanner(false);
                  if (stop) stop();
                }} 
                className="text-gray-500"
              >
                ✕
              </button>
            </div>
            
            {showScanner ? (
              <div className="mb-4">
                <div className="relative">
                  <video
                    ref={cameraRef}
                    className="w-full h-64 object-cover rounded-md border border-gray-300"
                  />
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-dashed border-white rounded-md"></div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Position barcode in the center of the camera
                </div>
                <button
                  className="mt-3 w-full bg-red-500 text-white py-2 px-4 rounded-md"
                  onClick={() => {
                    setShowScanner(false);
                    if (stop) stop();
                  }}
                >
                  Cancel Scanning
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Enter Barcode</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLookup();
                      }
                    }}
                  />
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md flex items-center"
                    onClick={() => setShowScanner(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Scan Barcode
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md"
                      onClick={() => setShowLookup(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md flex items-center"
                      onClick={handleLookup}
                      disabled={lookupLoading}
                    >
                      {lookupLoading && (
                        <span className="mr-2">
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        </span>
                      )}
                      {lookupLoading ? 'Looking up...' : 'Look up'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Item Name *</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategoryType)}
              required
            >
              {Object.values(FoodCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Storage Location *</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={location}
              onChange={(e) => setLocation(e.target.value as StorageLocationType)}
              required
            >
              {Object.values(StorageLocation).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Quantity *</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-md"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Unit *</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={unit}
                onChange={(e) => setUnit(e.target.value as MeasurementUnitType)}
                required
              >
                {Object.values(MeasurementUnit).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Expiration Date</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md h-24"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            className="px-4 py-2 text-sm border border-gray-300 rounded-md"
            onClick={() => {
              setName('');
              setDescription('');
              setCategory(FoodCategory.PRODUCE as FoodCategoryType);
              setLocation(StorageLocation.FRIDGE as StorageLocationType);
              setQuantity(1);
              setUnit(MeasurementUnit.COUNT as MeasurementUnitType);
              setExpirationDate(format(new Date(), 'yyyy-MM-dd'));
              setNotes('');
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </form>
      
      {/* Portion Tracking Dialog for meat products */}
      {showPortionTrackingDialog && productInfo && (
        <PortionTrackingDialog
          isOpen={showPortionTrackingDialog}
          onClose={() => setShowPortionTrackingDialog(false)}
          productInfo={productInfo}
          baseNotes={notes}
          baseCategory={category}
        />
      )}
    </div>
  );
}