import { useMemo, useState } from 'react';
import { differenceInDays, format, isToday, isTomorrow } from 'date-fns';
import { InventoryItem } from '@shared/schema';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import CategoryBadge from '@/components/ui/category-badge';

interface InventoryItemRowProps {
  item: InventoryItem;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: number) => void;
}

export default function InventoryItemRow({ item, onEdit, onDelete }: InventoryItemRowProps) {
  const {
    id, 
    name, 
    description, 
    category, 
    location, 
    quantity, 
    unit, 
    expirationDate,
    notes
  } = item;
  
  const [imageError, setImageError] = useState(false);
  
  // Extract image URL from notes if present
  const getImageUrl = () => {
    if (!notes) return null;
    
    // Check if there's a product image URL in the notes
    const imageUrlMatch = notes.match(/Product Image: (https:\/\/[^\s\n]+)/);
    if (imageUrlMatch && imageUrlMatch[1]) {
      return imageUrlMatch[1];
    }
    
    // Also check for other image URL patterns
    const altImageUrlMatch = notes.match(/(https:\/\/images\.openfoodfacts\.org\/[^\s\n]+)/);
    if (altImageUrlMatch && altImageUrlMatch[1]) {
      return altImageUrlMatch[1];
    }
    
    return null;
  }
  
  const imageUrl = getImageUrl();
  
  const expirationBadge = useMemo(() => {
    if (!expirationDate) return null;
    
    const expiration = new Date(expirationDate);
    const daysUntil = differenceInDays(expiration, new Date());
    
    let badgeClass = 'bg-neutral-100 text-neutral-600';
    let label = format(expiration, 'MMM d');
    
    if (daysUntil <= 0) {
      badgeClass = 'bg-destructive bg-opacity-10 text-destructive';
      label = 'Today';
    } else if (isTomorrow(expiration)) {
      badgeClass = 'bg-destructive bg-opacity-10 text-destructive';
      label = 'Tomorrow';
    } else if (daysUntil <= 3) {
      badgeClass = 'bg-warning bg-opacity-10 text-warning';
      label = `${daysUntil} days`;
    } else if (daysUntil <= 180) {
      label = `${daysUntil} days`;
    }
    
    return (
      <span className={`text-xs font-medium ${badgeClass} px-2 py-0.5 rounded-full`}>
        {label}
      </span>
    );
  }, [expirationDate]);
  
  const getItemIcon = () => {
    switch (category.toLowerCase()) {
      case 'produce': return 'food';
      case 'dairy': return 'cheese';
      case 'bakery': return 'bread';
      case 'grains': return 'cookies';
      default: return 'food';
    }
  };
  
  const getIconBgColor = () => {
    switch (category.toLowerCase()) {
      case 'produce': return 'bg-primary-light bg-opacity-10';
      case 'dairy': return 'bg-secondary-light bg-opacity-10';
      case 'bakery': return 'bg-neutral-100';
      case 'grains': return 'bg-neutral-100';
      default: return 'bg-info bg-opacity-10';
    }
  };
  
  const getIconColor = () => {
    switch (category.toLowerCase()) {
      case 'produce': return 'text-primary-light';
      case 'dairy': return 'text-secondary-light';
      case 'bakery': 
      case 'grains':
        return 'text-neutral-600';
      default: return 'text-info';
    }
  };
  
  return (
    <tr>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center">
          {imageUrl && !imageError ? (
            <div className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden mr-2 border border-gray-200">
              <img 
                src={imageUrl} 
                alt={name}
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className={`h-8 w-8 flex-shrink-0 rounded-md ${getIconBgColor()} flex items-center justify-center mr-2`}>
              <Icon name={getItemIcon() as any} className={getIconColor()} />
            </div>
          )}
          <div>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-neutral-500">{description}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <CategoryBadge category={category} />
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm">
        {quantity} {unit}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm">{location}</td>
      <td className="px-3 py-2 whitespace-nowrap">
        {expirationBadge}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-right">
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(id)}
            className="text-neutral-500 hover:text-destructive"
          >
            <Icon name="close" size="sm" />
          </Button>
        )}
      </td>
    </tr>
  );
}
