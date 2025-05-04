import React from 'react';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: string;
  isHighlighted?: boolean;
  className?: string;
}

export default function CategoryBadge({ category, isHighlighted = false, className }: CategoryBadgeProps) {
  const getCategoryStyles = () => {
    switch (category.toLowerCase()) {
      case 'produce':
        return 'bg-success bg-opacity-10 text-success';
      case 'dairy':
      case 'frozen':
        return 'bg-warning bg-opacity-10 text-warning';
      case 'meat':
        return 'bg-destructive bg-opacity-10 text-destructive';
      case 'bakery':
      case 'grains':
      case 'spices':
      case 'canned goods':
      default:
        return isHighlighted 
          ? 'bg-primary bg-opacity-10 text-primary' 
          : 'bg-neutral-100 text-neutral-600';
    }
  };
  
  return (
    <span 
      className={cn(
        'text-xs px-2 py-0.5 rounded-full',
        getCategoryStyles(),
        className
      )}
    >
      {category}
    </span>
  );
}
