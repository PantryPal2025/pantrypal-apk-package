import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ShoppingListItemProps {
  id: number;
  name: string;
  completed: boolean | null;
}

export default function ShoppingListItem({ id, name, completed }: ShoppingListItemProps) {
  const [isChecked, setIsChecked] = useState(completed ?? false);
  const queryClient = useQueryClient();
  
  const handleChange = async () => {
    try {
      const newState = !isChecked;
      setIsChecked(newState);
      
      await apiRequest('PATCH', `/api/shopping/${id}`, {
        completed: newState
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/shopping'] });
    } catch (error) {
      // Revert on error
      setIsChecked(isChecked);
      console.error('Failed to update shopping item:', error);
    }
  };
  
  return (
    <li>
      <div className="flex items-center space-x-3">
        <Checkbox 
          id={`shopping-item-${id}`} 
          checked={Boolean(isChecked)}
          onCheckedChange={handleChange}
          className="text-primary"
        />
        <Label 
          htmlFor={`shopping-item-${id}`}
          className={`text-sm ${isChecked ? 'line-through text-neutral-400' : ''}`}
        >
          {name}
        </Label>
      </div>
    </li>
  );
}
