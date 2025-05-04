import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ProductData, EnhancedProductData } from '@/types/product';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface QuickAddProductFormProps {
  product: ProductData;
  onComplete: (product: EnhancedProductData) => void;
}

export default function QuickAddProductForm({ product, onComplete }: QuickAddProductFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState(product.name || 'Unknown Product');
  const [quantity, setQuantity] = useState<number>(product.quantity || 1);
  const [category, setCategory] = useState<string>(product.category || FoodCategory.OTHER);
  const [unit, setUnit] = useState<string>(product.unit || MeasurementUnit.COUNT);
  const [location, setLocation] = useState<string>(product.location || StorageLocation.PANTRY);
  const [expirationDate, setExpirationDate] = useState<string>(
    product.expirationDate || format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd')
  );
  const [notes, setNotes] = useState<string>(product.notes || '');

  useEffect(() => {
    // Add message when form opens
    toast({
      title: "Product form opened",
      description: "Complete the details to add this item to your inventory"
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const enhancedProduct: EnhancedProductData = {
      ...product,
      name,
      quantity,
      category,
      unit,
      location,
      expirationDate,
      notes,
      price: product.price || 0
    };
    
    onComplete(enhancedProduct);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0,0,0,0.7)'}}>
      <div className="bg-white rounded-lg shadow-xl w-[95%] max-w-md max-h-[90vh] overflow-auto">
        <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-50 border-b">
          <h2 className="text-lg font-semibold text-blue-800">Add to Inventory</h2>
          <p className="text-sm text-blue-700">
            {product.barcode ? `Barcode: ${product.barcode}` : 'New Product'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {product.imageUrl && (
            <div className="flex justify-center mb-3">
              <img 
                src={product.imageUrl} 
                alt={name} 
                className="max-h-32 object-contain border rounded" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <input 
              className="w-full p-2 border rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input 
                className="w-full p-2 border rounded"
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select 
                className="w-full p-2 border rounded"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {Object.values(MeasurementUnit).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select 
                className="w-full p-2 border rounded"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.values(FoodCategory).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <select 
                className="w-full p-2 border rounded"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {Object.values(StorageLocation).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Expiration Date</label>
            <input 
              className="w-full p-2 border rounded"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea 
              className="w-full p-2 border rounded h-20"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes"
            />
          </div>
          
          <div className="pt-3 border-t mt-4">
            <button 
              type="submit" 
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Save to Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}