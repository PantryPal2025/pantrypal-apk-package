import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';
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
import { ProductData } from '@/types/product';
import { EmergencyItemLookup } from './emergency-item-lookup';
import { Search } from 'lucide-react';

interface SimpleAddItemFormProps {
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

export default function SimpleAddItemForm({ onSuccess }: SimpleAddItemFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Product lookup state
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ProductData | null>(null);
  
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
  
  // Lookup product by barcode
  const lookupBarcode = async () => {
    if (!barcode.trim()) {
      toast({
        title: 'Enter Barcode',
        description: 'Please enter a barcode number',
        variant: 'default'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('Looking up barcode:', barcode);
      
      // Call API
      const response = await apiRequest('GET', `/api/products/barcode/${barcode}`);
      
      if (!response.ok) {
        throw new Error('Error looking up barcode');
      }
      
      const data = await response.json();
      
      if (data && data.product) {
        // Process the data
        const { product } = data;
        
        // Extract nutrition info
        const nutrients = product.nutriments || {};
        let allergens: string[] = [];
        
        if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
          allergens = product.allergens_tags.map((allergen: string) => 
            allergen.replace('en:', '')
          );
        }
        
        // Build product object
        const foundProduct: ProductData = {
          name: product.product_name || 'Unknown Product',
          brand: product.brands || '',
          category: 'OTHER',
          barcode,
          imageUrl: product.image_url || product.image_front_url || '',
          quantity: 1,
          nutritionInfo: {
            calories: nutrients.energy_value || nutrients['energy-kcal_100g'] || 0,
            fat: nutrients.fat_100g || 0,
            carbs: nutrients.carbohydrates_100g || 0,
            protein: nutrients.proteins_100g || 0,
            allergens: allergens,
            ingredients: product.ingredients_text || ''
          },
          notes: `Barcode: ${barcode}\n${product.ingredients_text ? `Ingredients: ${product.ingredients_text}` : ''}`
        };
        
        // Update form with product data
        form.setValue('name', foundProduct.name);
        form.setValue('description', foundProduct.brand ? `${foundProduct.brand}` : '');
        form.setValue('notes', foundProduct.notes || '');
        
        setScannedProduct(foundProduct);
        
        toast({
          title: 'Product Found',
          description: `${foundProduct.name} found and added to form.`
        });
      } else {
        toast({
          title: 'Product Not Found',
          description: 'No product information available for this barcode.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error looking up product:', err);
      
      toast({
        title: 'Lookup Error',
        description: 'Failed to look up product information.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setShowLookupModal(false); // Close the modal
    }
  };
  
  // Form submission
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
                    onClick={() => setShowLookupModal(true)}
                  >
                    <Search className="h-3.5 w-3.5 mr-1" />
                    Find Product
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
        
        {/* Super simple emergency lookup form - no fancy components */}
        {showLookupModal && (
          <EmergencyItemLookup 
            isOpen={showLookupModal}
            onClose={() => setShowLookupModal(false)}
            onSuccess={(productData) => {
              // Update form with product data  
              form.setValue('name', productData.name);
              form.setValue('description', productData.description || '');
              form.setValue('category', productData.category || FoodCategory.OTHER);
              form.setValue('location', productData.location || StorageLocation.PANTRY);
              form.setValue('quantity', productData.quantity || 1);
              form.setValue('unit', productData.unit || MeasurementUnit.COUNT);
              form.setValue('expirationDate', productData.expirationDate || format(new Date(), 'yyyy-MM-dd'));
              form.setValue('notes', productData.notes || '');
              
              // Update scanned product state with basic info
              setScannedProduct({
                name: productData.name,
                brand: productData.description,
                barcode: '',
                category: productData.category,
              });
              
              // Show toast
              toast({
                title: 'Product Found',
                description: `${productData.name} details added to form.`,
              });
            }}
          />
        )}
        
        {scannedProduct && (
          <div className="bg-blue-50 p-3 my-2 rounded-md">
            <p className="text-blue-800 text-sm mb-1">Product found: <span className="font-semibold">{scannedProduct.name}</span></p>
            {scannedProduct.brand && <p className="text-blue-700 text-xs">Brand: {scannedProduct.brand}</p>}
            <p className="text-blue-600 text-xs mt-1">Adjust quantities and other details as needed</p>
          </div>
        )}
      </form>
    </Form>
  );
}