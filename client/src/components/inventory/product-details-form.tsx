import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, InfoIcon, TagIcon, DollarSignIcon, ListChecksIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
  notes?: string;
}

interface ProductDetailsFormProps {
  isOpen: boolean;
  onClose: () => void;
  productData: ProductData;
  onSave: (product: CompletedProduct) => void;
}

export function ProductDetailsForm({ isOpen, onClose, productData, onSave }: ProductDetailsFormProps) {
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
    
    // Create notes with product information including the image URL
    let notes = '';
    
    // Include product image URL in notes for extraction in inventory list
    if (productData.imageUrl) {
      notes += `Product Image: ${productData.imageUrl}\n\n`;
    }
    
    // Add barcode information if available
    if (productData.barcode) {
      notes += `Barcode: ${productData.barcode}\n`;
    }
    
    // Add nutrition information if available
    if (productData.nutritionInfo) {
      notes += '\nNutrition Info:\n';
      if (productData.nutritionInfo.calories) notes += `Calories: ${productData.nutritionInfo.calories}kcal\n`;
      if (productData.nutritionInfo.fat) notes += `Fat: ${productData.nutritionInfo.fat}g\n`;
      if (productData.nutritionInfo.carbs) notes += `Carbs: ${productData.nutritionInfo.carbs}g\n`;
      if (productData.nutritionInfo.protein) notes += `Protein: ${productData.nutritionInfo.protein}g\n`;
      
      if (productData.nutritionInfo.ingredients) {
        notes += `\nIngredients: ${productData.nutritionInfo.ingredients}\n`;
      }
      
      if (productData.nutritionInfo.allergens && productData.nutritionInfo.allergens.length > 0) {
        notes += `\nAllergens: ${productData.nutritionInfo.allergens.join(', ')}\n`;
      }
    }
    
    const completedProduct: CompletedProduct = {
      ...productData,
      count: parseInt(count),
      price: parseFloat(price),
      expirationDate: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      location: location,
      notes: notes // Add generated notes with image URL
    };
    
    onSave(completedProduct);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Complete Product Details</DialogTitle>
          <DialogDescription>
            Add the remaining details to save this product to your inventory
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input 
                    id="name" 
                    value={productData.name} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input 
                    id="barcode" 
                    value={productData.barcode || 'N/A'} 
                    disabled 
                    className="bg-muted font-mono text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input 
                    id="brand" 
                    value={productData.brand || 'Unknown'} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input 
                    id="category" 
                    value={productData.category || 'Other'} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Package Size</Label>
                  <Input 
                    id="quantity" 
                    value={productData.quantity || 'No data'} 
                    disabled 
                    className="bg-muted"
                  />
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
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    <DollarSignIcon className="h-4 w-4 inline mr-1" />
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
                  <Label htmlFor="count">
                    <ListChecksIcon className="h-4 w-4 inline mr-1" />
                    Quantity
                  </Label>
                  <Input 
                    id="count"
                    type="number"
                    min="1"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiry">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Expiry Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
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
              </div>
            </form>
          </TabsContent>
          
          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="py-4 space-y-4">
            {productData.nutritionInfo ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-800">Nutrition Facts</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Calories:</span>
                        <span>{productData.nutritionInfo.calories?.toFixed(0) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Fat:</span>
                        <span>{productData.nutritionInfo.fat?.toFixed(1) || 'N/A'} g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Carbohydrates:</span>
                        <span>{productData.nutritionInfo.carbs?.toFixed(1) || 'N/A'} g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Protein:</span>
                        <span>{productData.nutritionInfo.protein?.toFixed(1) || 'N/A'} g</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800">Ingredients</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 line-clamp-6">
                        {productData.nutritionInfo.ingredients || 'No ingredient data available'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
                    <InfoIcon className="h-4 w-4 mr-2" />
                    Allergens
                  </h3>
                  <div className="mt-2">
                    {productData.nutritionInfo.allergens && 
                     productData.nutritionInfo.allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {productData.nutritionInfo.allergens.map((allergen, index) => (
                          <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No allergen data available</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <InfoIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600">No Nutrition Information</h3>
                <p className="text-gray-500 mt-2">
                  Nutrition data for this product was not found in the database
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Image Tab */}
          <TabsContent value="image" className="py-4">
            {productData.imageUrl ? (
              <div className="flex justify-center">
                <div className="relative w-full max-w-sm">
                  <img 
                    src={productData.imageUrl} 
                    alt={productData.name} 
                    className="w-full rounded-lg shadow-md"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
                    <p className="text-sm font-medium">{productData.name}</p>
                    {productData.brand && (
                      <p className="text-xs opacity-80">{productData.brand}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-40 w-40 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                  <TagIcon className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-gray-500 mt-4">
                  No product image available
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            className="flex-1"
          >
            Add to Inventory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}