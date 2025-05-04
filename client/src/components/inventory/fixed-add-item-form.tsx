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
import UltraSimpleLookup from './ultra-simple-lookup';

interface FixedAddItemFormProps {
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

export default function FixedAddItemForm({ onSuccess }: FixedAddItemFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [productFound, setProductFound] = useState(false);
  
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
  
  // Handle product lookup
  const handleProductFound = (formValues: Record<string, any>) => {
    // Update the form with found product data
    form.setValue('name', formValues.name);
    form.setValue('description', formValues.description || '');
    form.setValue('category', formValues.category || FoodCategory.OTHER);
    form.setValue('location', formValues.location || StorageLocation.PANTRY);
    form.setValue('quantity', formValues.quantity || 1);
    form.setValue('unit', formValues.unit || MeasurementUnit.COUNT);
    form.setValue('expirationDate', formValues.expirationDate || format(new Date(), 'yyyy-MM-dd'));
    form.setValue('notes', formValues.notes || '');
    
    setProductFound(true);
    
    // Show a success toast
    toast({
      title: 'Product Found',
      description: `${formValues.name} found and added to form.`,
    });
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
        
        // Reset product found state
        setProductFound(false);
        
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
                  <UltraSimpleLookup onComplete={handleProductFound} />
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
                    {Object.values(FoodCategory).map(category => (
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
                    {Object.values(StorageLocation).map(location => (
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
                      {Object.values(MeasurementUnit).map(unit => (
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
        
        {productFound && (
          <div className="bg-blue-50 p-3 my-2 rounded-md">
            <p className="text-blue-800 text-sm mb-1">Product found and added to the form</p>
            <p className="text-blue-600 text-xs mt-1">Adjust quantities and other details as needed</p>
          </div>
        )}
      </form>
    </Form>
  );
}