import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, DollarSignIcon, PackageIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Import the product data interface
interface ProductData {
  name: string;
  brand?: string;
  category?: string;
  quantity?: string;
  expirationDate?: string;
  price?: number;
  count?: number;
  imageUrl?: string;
  nutritionInfo?: {
    calories?: number;
    fat?: number;
    carbs?: number;
    protein?: number;
    ingredients?: string;
    allergens?: string[];
  };
  barcode?: string;
}

// Interface for the completed product with user-added details
interface CompletedProduct extends ProductData {
  count: number;
  price: number;
  expirationDate: string;
  location: string;
}

interface SimpleDetailsFormProps {
  isOpen: boolean;
  onClose: () => void;
  productData: ProductData;
  onSave: (product: CompletedProduct) => void;
}

export function SimpleDetailsForm({ isOpen, onClose, productData, onSave }: SimpleDetailsFormProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(
    productData.expirationDate ? new Date(productData.expirationDate) : undefined
  );
  const [price, setPrice] = useState<string>(productData.price?.toString() || '');
  const [count, setCount] = useState<string>(productData.count?.toString() || '1');
  const [location, setLocation] = useState<string>('Pantry');
  
  // Handle the form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast({
        title: "Missing expiration date",
        description: "Please select an expiration date",
        variant: "destructive",
      });
      return;
    }
    
    if (!price || parseFloat(price) <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }
    
    if (!count || parseInt(count) <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }
    
    const completedProduct: CompletedProduct = {
      ...productData,
      count: parseInt(count),
      price: parseFloat(price),
      expirationDate: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      location: location,
    };
    
    onSave(completedProduct);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Complete Product Details</DialogTitle>
          <DialogDescription>
            Add the remaining details for {productData.name} before saving to inventory
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
              <PackageIcon className="w-4 h-4 mr-2" /> 
              Product Information
            </h3>
            <p className="text-sm text-blue-700">{productData.name}</p>
            {productData.brand && <p className="text-xs text-blue-600">Brand: {productData.brand}</p>}
            {productData.barcode && <p className="text-xs text-blue-600">Barcode: {productData.barcode}</p>}
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center">
                <DollarSignIcon className="h-4 w-4 mr-1" />
                Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input 
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="count">Quantity</Label>
              <Input 
                id="count"
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Expiry Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="expiry"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <select 
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Pantry">Pantry</option>
                <option value="Refrigerator">Refrigerator</option>
                <option value="Freezer">Freezer</option>
                <option value="Spice Rack">Spice Rack</option>
                <option value="Cabinet">Cabinet</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        
          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={onClose} className="mr-2">
              Cancel
            </Button>
            <Button type="submit">
              Add to Inventory
            </Button>
          </DialogFooter>
        </form>
        
      </DialogContent>
    </Dialog>
  );
}