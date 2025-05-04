import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Search, X } from 'lucide-react';
import { ProductData } from '@/types/product';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';
import { format } from 'date-fns';

type FindProductButtonProps = {
  onProductFound: (product: ProductData) => void;
};

export function DirectProductLookup({ onProductFound }: FindProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setBarcode('');
    setLoading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    reset();
  };

  const lookupBarcode = async () => {
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
          barcode,
          imageUrl: product.image_url || product.image_front_url || '',
          quantity: 1,
          unit: MeasurementUnit.COUNT,
          location: StorageLocation.PANTRY,
          expirationDate: format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
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
        
        // Pass the product to the parent
        onProductFound(foundProduct);
        
        // Close the dialog and show success message
        handleClose();
        
        toast({
          title: 'Product Found',
          description: `${foundProduct.name} found and added to form.`
        });
      } else {
        // Handle not found
        toast({
          title: 'Product Not Found',
          description: 'No product information available for this barcode.',
          variant: 'destructive'
        });
        
        // Create a basic product with just the barcode
        const basicProduct: ProductData = {
          name: 'Unknown Product',
          brand: '',
          category: FoodCategory.OTHER,
          barcode: barcode,
          quantity: 1,
          unit: MeasurementUnit.COUNT,
          location: StorageLocation.PANTRY,
          expirationDate: format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
          notes: `Barcode: ${barcode}`
        };
        
        // Pass the basic product to the parent
        onProductFound(basicProduct);
        
        // Close the dialog
        handleClose();
      }
    } catch (err) {
      console.error('Error looking up product:', err);
      
      toast({
        title: 'Lookup Error',
        description: 'Failed to look up product information.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 text-xs"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-3.5 w-3.5 mr-1" />
        Find Product
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Look up Product by Barcode</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Enter Barcode</label>
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Enter product barcode"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      lookupBarcode();
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={lookupBarcode}
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Looking up...' : 'Look up'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}