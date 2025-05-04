import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { insertRecipeSchema } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleIngredientInput } from './simple-ingredient-input';

// Extend the schema with form-specific validation
const formSchema = insertRecipeSchema.extend({
  ingredients: z.string().min(5, {
    message: "Please enter at least one ingredient"
  }),
  tags: z.string().optional(),
  imageUrl: z.string().url({
    message: "Please enter a valid URL for the image"
  }).optional().or(z.literal('')),
});

// Type for form values based on the schema
type FormValues = z.infer<typeof formSchema>;

interface AddRecipeFormProps {
  onSuccess?: () => void;
}

export default function AddRecipeForm({ onSuccess }: AddRecipeFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState("basic");
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      ingredients: '',
      instructions: '',
      prepTime: 0,
      cookTime: 0,
      difficulty: 'Easy',
      tags: '',
      imageUrl: '',
    }
  });
  
  // Create mutation for adding a recipe
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Original ingredients:", data.ingredients);
      
      // Store the raw ingredients input - server will handle the conversion
      // Convert comma-separated tags to array
      const formattedData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : []
        // No need to add userId - server will get it from authenticated session
      };
      
      console.log("Sending data:", formattedData);
      
      try {
        const response = await apiRequest('POST', '/api/recipes', formattedData);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error:", errorText);
          throw new Error(`API error: ${response.status} ${errorText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Recipe creation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Recipe added",
        description: "Your recipe has been added successfully!",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recipes/suggested'] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add recipe: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: FormValues) {
    console.log("Recipe form submission data:", data);
    console.log("Recipe form ingredients:", data.ingredients);
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="mb-10 w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Ingredients & Instructions</TabsTrigger>
            <TabsTrigger value="additional">Additional Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 relative block">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter recipe name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the recipe" 
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/image.jpg" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button 
                type="button" 
                onClick={() => setCurrentTab("details")}
              >
                Next
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4 relative block">
            <SimpleIngredientInput
              control={form.control}
              name="ingredients"
            />
            
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Step-by-step cooking instructions" 
                      className="min-h-[150px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setCurrentTab("basic")}
              >
                Previous
              </Button>
              <Button 
                type="button" 
                onClick={() => setCurrentTab("additional")}
              >
                Next
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="additional" className="space-y-4 relative block">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prepTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prep Time (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cookTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cook Time (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || 'Easy'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="z-[100]">
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Breakfast, Healthy, Quick" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setCurrentTab("details")}
              >
                Previous
              </Button>
              <div className="space-x-2">
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <Button 
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Adding..." : "Add Recipe"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}