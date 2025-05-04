import { useState } from 'react';
import { format } from 'date-fns';
import { ProductData, EnhancedProductData } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';

interface DirectProductFormProps {
  product: ProductData;
  onComplete: (product: EnhancedProductData) => void;
}

export function DirectProductForm({ product, onComplete }: DirectProductFormProps) {
  const defaultExpiry = format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd');
  
  const [formData, setFormData] = useState({
    name: product.name || 'Unknown Product',
    quantity: product.quantity || 1,
    location: product.location || StorageLocation.PANTRY,
    category: product.category || FoodCategory.OTHER,
    unit: product.unit || MeasurementUnit.COUNT,
    expirationDate: product.expirationDate || defaultExpiry,
    notes: product.notes || '',
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const enhancedProduct: EnhancedProductData = {
      ...product,
      name: formData.name,
      quantity: formData.quantity as number,
      location: formData.location as string, 
      category: formData.category as string,
      unit: formData.unit as string,
      expirationDate: formData.expirationDate,
      notes: formData.notes,
      price: product.price || 0
    };
    
    onComplete(enhancedProduct);
  };

  // Simple form with essential fields
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center bg-primary-50">
          <h2 className="text-lg font-semibold">Add Product to Inventory</h2>
          <div className="text-amber-500 text-sm">
            Save to add to inventory
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {product.imageUrl && (
            <div className="flex justify-center mb-2">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="h-32 object-contain border rounded p-2" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {product.barcode && (
            <div className="bg-gray-50 text-sm p-2 rounded-md mb-4">
              <p><strong>Barcode:</strong> {product.barcode}</p>
            </div>
          )}
          
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => handleInputChange('name', e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                type="number" 
                min="0" 
                step="0.1" 
                value={formData.quantity} 
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)} 
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <select 
                id="unit" 
                className="w-full border rounded-md p-2" 
                value={formData.unit} 
                onChange={(e) => handleInputChange('unit', e.target.value)}
              >
                {Object.values(MeasurementUnit).map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select 
                id="category" 
                className="w-full border rounded-md p-2" 
                value={formData.category} 
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {Object.values(FoodCategory).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <select 
                id="location" 
                className="w-full border rounded-md p-2" 
                value={formData.location} 
                onChange={(e) => handleInputChange('location', e.target.value)}
              >
                {Object.values(StorageLocation).map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="expiration">Expiration Date</Label>
            <Input 
              id="expiration" 
              type="date" 
              value={formData.expirationDate} 
              onChange={(e) => handleInputChange('expirationDate', e.target.value)} 
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea 
              id="notes" 
              className="w-full border rounded-md p-2 h-24" 
              value={formData.notes} 
              onChange={(e) => handleInputChange('notes', e.target.value)} 
              placeholder="Add any additional details about this product"
            />
          </div>
          
          <div className="pt-4">
            <Button onClick={handleSave} className="w-full">
              Save to Inventory
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}