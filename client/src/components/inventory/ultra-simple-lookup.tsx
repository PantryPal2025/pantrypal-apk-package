import { useState, useCallback } from 'react';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

type BareBonesLookupProps = {
  onComplete: (formValues: Record<string, any>) => void;
};

export default function UltraSimpleLookup({ onComplete }: BareBonesLookupProps) {
  const [showInput, setShowInput] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleBarcodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  }, []);
  
  const handleSubmit = useCallback(async () => {
    if (!barcode.trim()) {
      alert('Please enter a barcode');
      return;
    }
    
    setLoading(true);
    
    try {
      // Call barcode API
      const response = await apiRequest('GET', `/api/products/barcode/${barcode}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.product) {
          // Process the product data
          const { product } = data;
          
          // Extract nutrition info
          const nutrients = product.nutriments || {};
          let allergens: string[] = [];
          
          if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
            allergens = product.allergens_tags.map((allergen: string) => 
              allergen.replace('en:', '')
            );
          }
          
          // Create notes with product image URL and nutrition info
          let notes = '';
          
          // Add image URL if available
          if (product.image_url) {
            notes += `Product Image: ${product.image_url}\n\n`;
          }
          
          if (nutrients) {
            notes += 'Nutrition Info:\n';
            
            if (nutrients.energy_value || nutrients['energy-kcal_100g']) 
              notes += `Calories: ${parseFloat(nutrients.energy_value || nutrients['energy-kcal_100g']).toFixed(2)}kcal\n`;
            
            if (nutrients.fat_100g) notes += `Fat: ${parseFloat(nutrients.fat_100g).toFixed(2)}g\n`;
            if (nutrients.carbohydrates_100g) notes += `Carbs: ${parseFloat(nutrients.carbohydrates_100g).toFixed(2)}g\n`;
            if (nutrients.proteins_100g) notes += `Protein: ${parseFloat(nutrients.proteins_100g).toFixed(2)}g\n`;
            
            if (product.ingredients_text) notes += `\nIngredients: ${product.ingredients_text}\n`;
            
            if (allergens.length > 0) {
              notes += `\nAllergens: ${allergens.join(', ')}\n`;
            }
          }
          
          notes += `\nBarcode: ${barcode}`;
          
          // Send form values back to parent
          onComplete({
            name: product.product_name || 'Unknown Product',
            description: product.brands || '',
            category: FoodCategory.OTHER,
            location: StorageLocation.PANTRY,
            quantity: 1,
            unit: MeasurementUnit.COUNT,
            expirationDate: format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
            notes
          });
          
          setShowInput(false);
          setBarcode('');
        } else {
          // No product found, just send the barcode as a note
          onComplete({
            name: 'Unknown Product',
            description: '',
            category: FoodCategory.OTHER,
            location: StorageLocation.PANTRY,
            quantity: 1,
            unit: MeasurementUnit.COUNT,
            expirationDate: format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
            notes: `Barcode: ${barcode}`
          });
          
          setShowInput(false);
          setBarcode('');
        }
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error looking up barcode:', err);
      alert('Failed to look up product. Please try again or enter manually.');
    } finally {
      setLoading(false);
    }
  }, [barcode, onComplete]);
  
  // Keyboard handler for enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);
  
  return (
    <div>
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 text-xs"
        onClick={() => setShowInput(true)}
      >
        <Search className="h-3.5 w-3.5 mr-1" />
        Find Product
      </Button>
      
      {showInput && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50" onClick={() => setShowInput(false)}>
          <div className="bg-white p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Look up Product by Barcode</h3>
              <button className="text-gray-500" onClick={() => setShowInput(false)}>✕</button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Enter Barcode</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={barcode}
                onChange={handleBarcodeChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter product barcode"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 text-sm border border-gray-300 rounded-md"
                onClick={() => setShowInput(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md flex items-center"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Looking up...' : 'Look up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}