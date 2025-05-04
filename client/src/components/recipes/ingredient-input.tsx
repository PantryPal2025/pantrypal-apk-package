import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FormDescription } from '@/components/ui/form';

interface IngredientInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function IngredientInput({
  value,
  onChange,
  className,
}: IngredientInputProps) {
  const [ingredients, setIngredients] = useState<string>(value || '');
  
  useEffect(() => {
    console.log("IngredientInput initializing with value:", value);
  }, []);

  // Update parent whenever ingredients change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log("Setting ingredients to:", newValue);
    setIngredients(newValue);
    onChange(newValue);
  };

  return (
    <div className={className}>
      <Textarea
        placeholder="Enter your ingredients, one per line"
        className="min-h-[150px]"
        value={ingredients}
        onChange={handleChange}
      />
      <FormDescription className="mt-2 text-sm">
        Example: "2 cups flour" or "3 tablespoons olive oil"
      </FormDescription>
    </div>
  );
}