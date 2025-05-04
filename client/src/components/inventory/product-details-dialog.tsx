import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';
import { format, addDays } from 'date-fns';
import { ProductData, EnhancedProductData } from '@/types/product';

interface ProductDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductData;
  onSave: (productWithDetails: EnhancedProductData) => void;
}

export function ProductDetailsDialog({ isOpen, onClose, product, onSave }: ProductDetailsDialogProps) {
  // Default values
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<string>(MeasurementUnit.COUNT);
  const [location, setLocation] = useState<string>(StorageLocation.PANTRY);
  const [category, setCategory] = useState<string>(product?.category || FoodCategory.OTHER);
  const [price, setPrice] = useState(0);
  const [expirationDate, setExpirationDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setUnit(MeasurementUnit.COUNT);
      setLocation(StorageLocation.PANTRY);
      setCategory(product.category || FoodCategory.OTHER);
      setPrice(0);
      setExpirationDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    }
  }, [product]);

  const handleSave = () => {
    if (!product) return;
    
    const enhancedProduct: EnhancedProductData = {
      ...product,
      quantity,
      unit,
      location,
      category,
      price,
      expirationDate
    };
    
    onSave(enhancedProduct);
    onClose();
  };

  if (!product) return null;

  console.log("Product details dialog with isOpen:", isOpen);
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log("Dialog onOpenChange called with:", open);
        if (!open) onClose();
      }}
      modal={true}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
          <DialogDescription>
            Add details for {product.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-16 h-16 object-contain bg-gray-100 rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/gray/white?text=No+Image';
              }}
            />
            <div>
              <h3 className="font-medium">{product.name}</h3>
              {product.brand && <p className="text-sm text-gray-500">{product.brand}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="unit">Unit</Label>
              <Select 
                value={unit} 
                onValueChange={(value: string) => setUnit(value)}
              >
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MeasurementUnit).map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={category} 
                onValueChange={(value: string) => setCategory(value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FoodCategory).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="location">Storage Location</Label>
              <Select 
                value={location} 
                onValueChange={(value: string) => setLocation(value)}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(StorageLocation).map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Add to Inventory</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}