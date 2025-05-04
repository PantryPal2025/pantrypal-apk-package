import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';
import { ProductData, EnhancedProductData } from '@/types/product';

interface PersistentProductDetailsProps {
  product: ProductData;
  onCancel: () => void;
  onSave: (product: EnhancedProductData) => void;
}

export function PersistentProductDetails({
  product,
  onCancel,
  onSave,
}: PersistentProductDetailsProps) {
  const [productName, setProductName] = useState(product.name || 'Unknown Product');
  const [brand, setBrand] = useState(product.brand || '');
  const [quantity, setQuantity] = useState(product.quantity || 1);
  const [unit, setUnit] = useState<string>(product.unit || MeasurementUnit.COUNT);
  const [category, setCategory] = useState<string>(product.category || FoodCategory.OTHER);
  const [location, setLocation] = useState<string>(StorageLocation.PANTRY);
  const [price, setPrice] = useState(product.price || 0);
  const [notes, setNotes] = useState(product.notes || '');
  const [expirationDate, setExpirationDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd')
  );

  // Handle save button click
  const handleSave = () => {
    const enhancedProduct: EnhancedProductData = {
      ...product,
      name: productName,
      brand,
      quantity,
      unit,
      category,
      location,
      price,
      expirationDate,
      notes
    };

    onSave(enhancedProduct);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-auto max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
          <h2 className="text-lg font-semibold">Product Details</h2>
          <div className="text-amber-500 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span className="text-xs">Form will only close when you save</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {product.imageUrl && (
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 overflow-hidden rounded border">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/200x200/gray/white?text=No+Image';
                  }}
                />
              </div>
            </div>
          )}
            
          <div className="mb-3">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="brand">Brand (Optional)</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Brand name"
            />
          </div>
          
          {product.barcode && (
            <div className="text-sm bg-gray-50 p-2 rounded-md">
              <p>Barcode: {product.barcode}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FoodCategory).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Storage Location</Label>
              <Select
                value={location}
                onValueChange={(value) => setLocation(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(StorageLocation).map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
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
              <Label htmlFor="unit">Unit</Label>
              <Select 
                value={unit} 
                onValueChange={(value) => setUnit(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MeasurementUnit).map((un) => (
                    <SelectItem key={un} value={un}>
                      {un}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="price">Price (Optional)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this product"
              className="h-20 w-full border rounded-md p-2"
            />
          </div>

          {product.nutritionInfo && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-2">Nutrition Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {product.nutritionInfo.calories !== undefined && product.nutritionInfo.calories > 0 && (
                  <div>
                    <span className="font-medium">Calories:</span>{' '}
                    {product.nutritionInfo.calories}kcal
                  </div>
                )}
                {product.nutritionInfo.protein !== undefined && product.nutritionInfo.protein > 0 && (
                  <div>
                    <span className="font-medium">Protein:</span>{' '}
                    {product.nutritionInfo.protein}g
                  </div>
                )}
                {product.nutritionInfo.carbs !== undefined && product.nutritionInfo.carbs > 0 && (
                  <div>
                    <span className="font-medium">Carbs:</span>{' '}
                    {product.nutritionInfo.carbs}g
                  </div>
                )}
                {product.nutritionInfo.fat !== undefined && product.nutritionInfo.fat > 0 && (
                  <div>
                    <span className="font-medium">Fat:</span>{' '}
                    {product.nutritionInfo.fat}g
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white border-t p-3 -mx-5 -mb-5 mt-6">
            <Button type="button" onClick={handleSave} className="w-full">
              Save Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}