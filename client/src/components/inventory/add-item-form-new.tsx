import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { FoodCategory, StorageLocation, MeasurementUnit, MeasurementUnitType, FoodCategoryType, StorageLocationType } from '@shared/schema';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Barcode } from 'lucide-react';
import { SimpleBarcodeScanner } from './simple-barcode-scanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ProductData } from '@/types/product';

interface AddItemFormProps {
  onSuccess?: () => void;
}

// Create a string-only schema for the form to avoid date conversion issues
const inventoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string(),
  location: z.string(),
  quantity: z.number().min(0),
  unit: z.string(),
  expirationDate: z.string().optional(),
  notes: z.string().optional(),
  userId: z.number().optional(), // Will be set by the server
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

export default function AddItemForm({ onSuccess }: AddItemFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ProductData | null>(null);
  const [productDetailsOpen, setProductDetailsOpen] = useState(false);
  
  // Product details dialog form state
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<MeasurementUnitType>(MeasurementUnit.COUNT);
  const [category, setCategory] = useState<FoodCategoryType>(FoodCategory.OTHER);
  const [location, setLocation] = useState<StorageLocationType>(StorageLocation.PANTRY);
  const [price, setPrice] = useState(0);
  const [expDate, setExpDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const foodCategories = Object.values(FoodCategory);
  const storageLocations = Object.values(StorageLocation);
  const measurementUnits = Object.values(MeasurementUnit);
  
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: FoodCategory.PRODUCE,
      location: StorageLocation.FRIDGE,
      quantity: 1,
      unit: MeasurementUnit.COUNT,
      notes: '',
      expirationDate: format(new Date(), 'yyyy-MM-dd'),
    }
  });
  
  // Handle product data from barcode scanner
  const handleProductFound = (productData: ProductData) => {
    console.log("Product found from barcode scanner:", productData);
    
    // Create nutrition notes
    let notes = '';
    if (productData.nutritionInfo) {
      const nutritionInfo = productData.nutritionInfo;
      notes = 'Nutrition Info:\n';
      
      if (nutritionInfo.calories) notes += `Calories: ${nutritionInfo.calories}kcal\n`;
      if (nutritionInfo.protein) notes += `Protein: ${nutritionInfo.protein}g\n`;
      if (nutritionInfo.carbs) notes += `Carbs: ${nutritionInfo.carbs}g\n`;
      if (nutritionInfo.fat) notes += `Fat: ${nutritionInfo.fat}g\n`;
      
      if (nutritionInfo.ingredients) notes += `Ingredients: ${nutritionInfo.ingredients}\n`;
      
      if (nutritionInfo.allergens && nutritionInfo.allergens.length > 0) {
        notes += `Allergens: ${nutritionInfo.allergens.join(', ')}\n`;
      }
    }
    
    if (productData.barcode) {
      notes += `\nBarcode: ${productData.barcode}`;
    }
    
    // Create an updated product object with notes
    const productWithNotes: ProductData = {
      ...productData,
      notes
    };
    
    // Set the product in state
    setScannedProduct(productWithNotes);
    
    // Open the product details dialog immediately
    setProductDetailsOpen(true);
    
    toast({
      title: "Product found",
      description: `${productData.name} found. Please complete the product details.`,
    });
  };
  
  // Handle saving product details
  const handleSaveProductDetails = () => {
    if (!scannedProduct) return;
    
    // Update the main form with product details
    form.setValue('name', scannedProduct.name);
    form.setValue('description', scannedProduct.brand ? `${scannedProduct.brand}` : '');
    form.setValue('category', category);
    form.setValue('location', location);
    form.setValue('quantity', quantity);
    form.setValue('unit', unit);
    form.setValue('expirationDate', expDate);
    form.setValue('notes', scannedProduct.notes || '');
    
    // Close the details dialog
    setProductDetailsOpen(false);
    
    toast({
      title: "Details completed",
      description: `${scannedProduct.name} details added. You can now submit the form or make additional adjustments.`,
    });
  };

  const onSubmit = async (data: InventoryFormValues) => {
    try {
      console.log('Submitting inventory item with data:', data);
      
      const response = await apiRequest('POST', '/api/inventory', data);
      
      if (response.ok) {
        const savedItem = await response.json();
        console.log('Item saved successfully:', savedItem);
        
        toast({
          title: 'Item added',
          description: `"${data.name}" has been added to your inventory.`,
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
        form.reset({
          name: '',
          description: '',
          category: FoodCategory.PRODUCE,
          location: StorageLocation.FRIDGE,
          quantity: 1,
          unit: MeasurementUnit.COUNT,
          notes: '',
          expirationDate: format(new Date(), 'yyyy-MM-dd'),
        });
        
        // Reset product state
        setScannedProduct(null);
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error('Server response not OK:', response.status);
        let errorMessage = 'Failed to add item';
        
        try {
          const errorData = await response.json();
          console.error('Error data from server:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Could not parse error response as JSON');
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to add item:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add item. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <div className="flex justify-between items-center">
                  <FormLabel>Item Name</FormLabel>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 text-xs"
                    onClick={() => setScannerOpen(true)}
                  >
                    <Barcode className="h-3.5 w-3.5" />
                    Scan Barcode
                  </Button>
                </div>
                <FormControl>
                  <Input 
                    placeholder="Enter item name" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Barcode Scanner */}
          {scannerOpen && (
            <SimpleBarcodeScanner
              isOpen={scannerOpen}
              onClose={() => setScannerOpen(false)}
              onScanComplete={handleProductFound}
            />
          )}
          
          {/* Product Details Dialog */}
          <Dialog open={productDetailsOpen} onOpenChange={setProductDetailsOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Product Details</DialogTitle>
              </DialogHeader>
              
              {scannedProduct && (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={scannedProduct.imageUrl} 
                      alt={scannedProduct.name} 
                      className="w-16 h-16 object-contain bg-gray-100 rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/gray/white?text=No+Image';
                      }}
                    />
                    <div>
                      <h3 className="font-medium">{scannedProduct.name}</h3>
                      {scannedProduct.brand && <p className="text-sm text-gray-500">{scannedProduct.brand}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Quantity</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={quantity}
                          onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Unit</label>
                        <select 
                          className="w-full p-2 border rounded-md"
                          value={unit}
                          onChange={(e) => {
                            const newUnit = e.target.value as MeasurementUnitType;
                            setUnit(newUnit);
                          }}
                        >
                          {Object.values(MeasurementUnit).map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select 
                          className="w-full p-2 border rounded-md"
                          value={category}
                          onChange={(e) => {
                            const newCategory = e.target.value as FoodCategoryType;
                            setCategory(newCategory);
                          }}
                        >
                          {Object.values(FoodCategory).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Storage Location</label>
                        <select 
                          className="w-full p-2 border rounded-md"
                          value={location}
                          onChange={(e) => {
                            const newLocation = e.target.value as StorageLocationType;
                            setLocation(newLocation);
                          }}
                        >
                          {Object.values(StorageLocation).map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Expiration Date</label>
                        <input
                          type="date"
                          value={expDate}
                          onChange={(e) => setExpDate(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setProductDetailsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProductDetails}>
                      Add to Inventory
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
          
          {scannedProduct && (
            <div className="bg-blue-50 p-3 my-2 rounded-md">
              <p className="text-blue-800 text-sm mb-1">Product scanned: <span className="font-semibold">{scannedProduct.name}</span></p>
              {scannedProduct.brand && <p className="text-blue-700 text-xs">Brand: {scannedProduct.brand}</p>}
              <p className="text-blue-600 text-xs mt-1">Adjust quantities and other details as needed</p>
            </div>
          )}
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Optional description" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {foodCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Location</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {storageLocations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {measurementUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="expirationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiration Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    min={format(new Date(), 'yyyy-MM-dd')}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes about this item" 
                  className="h-20 resize-none"
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Cancel
          </Button>
          <Button type="submit">Add Item</Button>
        </div>
      </form>
    </Form>
  );
}