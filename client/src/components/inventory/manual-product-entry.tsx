import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductData, EnhancedProductData } from '@/types/product';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { X, Check, Search } from 'lucide-react';
import { format } from 'date-fns';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';

interface ManualProductEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onProductComplete: (product: EnhancedProductData) => void;
}

export default function ManualProductEntry({ isOpen, onClose, onProductComplete }: ManualProductEntryProps) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  
  // Form state
  const [name, setName] = useState('Unknown Product');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<string>(MeasurementUnit.COUNT);
  const [category, setCategory] = useState<string>(FoodCategory.OTHER);
  const [location, setLocation] = useState<string>(StorageLocation.PANTRY);
  const [expirationDate, setExpirationDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd')
  );
  const [notes, setNotes] = useState('');
  
  const { toast } = useToast();
  
  // Look up the product
  const lookupProduct = async () => {
    if (!barcode.trim()) {
      toast({
        title: 'Enter Barcode',
        description: 'Please enter a barcode number',
        variant: 'default'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('Looking up barcode:', barcode);
      
      // Call API
      const response = await apiRequest('GET', `/api/products/barcode/${barcode}`);
      
      if (!response.ok) {
        throw new Error('Error looking up barcode');
      }
      
      const data = await response.json();
      
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
          barcode: barcode,
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
          notes: `Barcode: ${barcode}\n${product.ingredients_text ? `Ingredients: ${product.ingredients_text}` : ''}`
        };
        
        // Update state
        setName(foundProduct.name);
        setNotes(foundProduct.notes || '');
        setProduct(foundProduct);
        
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
          barcode: barcode,
          imageUrl: '',
          quantity: 1,
          notes: `Barcode: ${barcode}`
        };
        
        setProduct(basicProduct);
        
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
        barcode: barcode,
        imageUrl: '',
        quantity: 1,
        notes: `Barcode: ${barcode}`
      };
      
      setProduct(basicProduct);
      
      toast({
        title: 'Lookup Error',
        description: 'Failed to look up product information. Please enter details manually.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Save the product
  const handleSaveProduct = () => {
    if (!product) return;
    
    // Create enhanced product
    const enhancedProduct: EnhancedProductData = {
      ...product,
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
    
    // Close form
    toast({
      title: 'Product Saved',
      description: `${name} has been prepared for adding to inventory.`
    });
    
    handleClose();
  };
  
  // Reset form
  const resetForm = () => {
    setBarcode('');
    setProduct(null);
    setName('Unknown Product');
    setQuantity(1);
    setUnit(MeasurementUnit.COUNT);
    setCategory(FoodCategory.OTHER);
    setLocation(StorageLocation.PANTRY);
    setExpirationDate(
      format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd')
    );
    setNotes('');
  };
  
  // Close handler
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-start pt-8 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden mb-8">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {!product ? 'Enter Product Barcode' : 'Add to Inventory'}
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
          {!product ? (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-neutral-600">Enter a barcode to look up product information</p>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        lookupProduct();
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={lookupProduct}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Search className="h-4 w-4 mr-1" />
                  )}
                  {loading ? 'Looking up...' : 'Look up'}
                </Button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-neutral-200">
                <h3 className="text-sm font-medium mb-2">Or add product manually</h3>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const basicProduct: ProductData = {
                      name: 'Unknown Product',
                      brand: '',
                      category: 'OTHER',
                      barcode: barcode || 'Manual entry',
                      imageUrl: '',
                      quantity: 1,
                      notes: barcode ? `Barcode: ${barcode}` : ''
                    };
                    
                    setProduct(basicProduct);
                  }}
                >
                  Add product manually
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {product.imageUrl && (
                <div className="flex justify-center mb-2">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
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
                    setProduct(null);
                    setBarcode('');
                  }}
                >
                  Back
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