import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Control } from 'react-hook-form';

interface SimpleIngredientInputProps {
  control: Control<any>;
  name: string;
}

export function SimpleIngredientInput({ control, name }: SimpleIngredientInputProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Ingredients*</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter your ingredients, one per line"
              className="min-h-[150px]"
              {...field}
              value={field.value || ''}
            />
          </FormControl>
          <FormDescription>
            Enter one ingredient per line, e.g. "2 cups flour" or "3 tbsp olive oil"
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}