import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';
import { ProductData, EnhancedProductData } from '@/types/product';

interface BasicProductFormProps {
  product: ProductData;
  onSave: (product: EnhancedProductData) => void;
}

export function BasicProductForm({ product, onSave }: BasicProductFormProps) {
  const [name, setName] = useState(product.name || 'Unknown Product');
  const [quantity, setQuantity] = useState(product.quantity || 1);
  const [notes, setNotes] = useState(product.notes || '');
  const [expirationDate, setExpirationDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd')
  );

  const handleSave = () => {
    const enhancedProduct: EnhancedProductData = {
      ...product,
      name,
      quantity,
      unit: product.unit || MeasurementUnit.COUNT,
      category: product.category || FoodCategory.OTHER,
      location: product.location || StorageLocation.PANTRY,
      price: product.price || 0,
      expirationDate,
      notes
    };

    onSave(enhancedProduct);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Product Details</h2>
        </div>

        <div className="p-5 space-y-4">
          {product.imageUrl && (
            <div className="flex justify-center mb-4">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="max-h-32 rounded border" 
              />
            </div>
          )}

          <div>
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <Label htmlFor="expiration">Expiration Date</Label>
            <Input
              id="expiration"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes"
              className="w-full border rounded p-2 h-20"
            />
          </div>

          <div className="pt-4">
            <Button type="button" onClick={handleSave} className="w-full">
              Save Product
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}