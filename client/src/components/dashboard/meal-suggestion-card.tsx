import { Icon } from '@/components/ui/icon';
import { Link } from 'wouter';
import CategoryBadge from '@/components/ui/category-badge';

interface MealSuggestionCardProps {
  id: number;
  name: string;
  imageUrl: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  ingredients: string[];
  hasAllIngredients?: boolean;
  percentIngredients?: number;
}

export default function MealSuggestionCard({ 
  id, 
  name, 
  imageUrl, 
  prepTime, 
  cookTime,
  difficulty,
  ingredients,
  hasAllIngredients = false,
  percentIngredients = 0
}: MealSuggestionCardProps) {
  
  // Get main 3 ingredients for display
  const mainIngredients = ingredients.slice(0, 3);
  
  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden h-full flex flex-col">
      <div className="h-40 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-medium mb-1">{name}</h3>
        <div className="flex items-center text-sm text-neutral-500 mb-2">
          <Icon name="time" className="mr-1" size="sm" />
          {prepTime + cookTime} mins
          <span className="mx-2">•</span>
          <Icon name="dish" className="mr-1" size="sm" />
          {difficulty}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {mainIngredients.map((ingredient, index) => {
            const isExpiring = index === 0; // Assume first ingredient is expiring for demo
            return (
              <CategoryBadge 
                key={index} 
                category={ingredient} 
                isHighlighted={isExpiring}
              />
            );
          })}
          {ingredients.length > 3 && (
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
              +{ingredients.length - 3} more
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-auto">
          <span className="text-xs text-success flex items-center">
            <Icon name="checkCircle" className="mr-1" size="xs" />
            {hasAllIngredients 
              ? 'You have all ingredients'
              : `You have ${percentIngredients}% of ingredients`
            }
          </span>
          <Link href={`/recipes/${id}`} className="text-primary hover:text-primary-dark text-sm">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
