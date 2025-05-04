import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { FoodCategory, StorageLocation, MeasurementUnit, FoodCategoryType, StorageLocationType, MeasurementUnitType } from '@shared/schema';
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
import { ProductData, EnhancedProductData } from '@/types/product';
import { BarcodeScanWorkflow } from './barcode-scan-workflow';

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
  
  // This code is no longer used since we're using the BarcodeScanWorkflow component instead
  // All barcode scanning logic is now in the BarcodeScanWorkflow component

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
  
  // Handle product data from scan workflow
  const handleProductCompleted = (enhancedProduct: EnhancedProductData) => {
    console.log("Product completed from scan workflow:", enhancedProduct);
    
    // Update the main form with product details
    form.setValue('name', enhancedProduct.name);
    form.setValue('description', enhancedProduct.brand ? `${enhancedProduct.brand}` : '');
    form.setValue('category', enhancedProduct.category);
    form.setValue('location', enhancedProduct.location);
    form.setValue('quantity', enhancedProduct.quantity);
    form.setValue('unit', enhancedProduct.unit);
    form.setValue('expirationDate', enhancedProduct.expirationDate || format(new Date(), 'yyyy-MM-dd'));
    form.setValue('notes', enhancedProduct.notes || '');
    
    // Set the product for display in the info box
    setScannedProduct(enhancedProduct);
    
    toast({
      title: "Details completed",
      description: `${enhancedProduct.name} details added. You can now submit the form or make additional adjustments.`,
    });
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
                  <BarcodeScanWorkflow onProductComplete={handleProductCompleted} />
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